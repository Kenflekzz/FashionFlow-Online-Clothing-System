<?php
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_httponly', 1);
ini_set('session.gc_maxlifetime', 86400);
session_set_cookie_params([
    'lifetime' => 86400,
    'path'     => '/',
    'domain'   => '',
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

$response = ['success' => false, 'message' => 'Unknown error'];
$httpCode = 500;

try {
    if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
        throw new Exception('Not authenticated', 401);
    }

    $currentUserId   = $_SESSION['user_id'];
    $currentUsername = $_SESSION['username'] ?? 'Unknown';
    $accountStatus   = $_SESSION['account_status'] ?? null;

    if ($accountStatus !== 'super admin' && $accountStatus !== 'admin') {
        throw new Exception('Unauthorized', 403);
    }

    $rawInput = file_get_contents('php://input');
    if (!$rawInput) throw new Exception('No input received', 400);

    $data = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg(), 400);
    }

    $targetUserId = $data['user_id']      ?? null;
    $reason       = $data['reason']       ?? '';
    $forceLogout  = $data['force_logout'] ?? false;

    if (!$targetUserId) throw new Exception('No user ID provided', 400);

    if ($targetUserId === $currentUserId) {
        throw new Exception('You cannot block yourself', 400);
    }

    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if ($conn->connect_error) throw new Exception('Database connection failed', 500);

    // Check target user exists
    $checkStmt = $conn->prepare("
        SELECT username, account_status, is_blocked FROM users WHERE user_ID = ?
    ");
    $checkStmt->bind_param("s", $targetUserId);
    $checkStmt->execute();
    $targetUser = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if (!$targetUser)               throw new Exception('Target user not found', 404);
    if ($targetUser['is_blocked'] == 1) throw new Exception('User is already blocked', 400);

    // Block the user
    $stmt = $conn->prepare("
        UPDATE users SET
            is_blocked   = 1,
            status       = 'Suspended',
            block_reason = ?,
            blocked_by   = ?,
            blocked_at   = NOW()
        WHERE user_ID = ?
    ");
    $stmt->bind_param("sss", $reason, $currentUsername, $targetUserId);

    if (!$stmt->execute()) {
        throw new Exception('Failed to block user: ' . $stmt->error);
    }
    $stmt->close();

    // Log the block activity
    require_once 'log_activity.php';
    logActivity(
        $conn,
        $targetUserId,
        $targetUser['username']       ?? $targetUserId,
        $targetUser['account_status'] ?? 'user',
        'Account Blocked',
        "Account blocked by {$currentUsername}. Reason: {$reason}",
        $currentUsername
    );

    // Force logout — store in blocked_sessions
    if ($forceLogout) {
        $conn->query("
            CREATE TABLE IF NOT EXISTS blocked_sessions (
                user_id    VARCHAR(50) PRIMARY KEY,
                blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $blockSessionStmt = $conn->prepare("
            INSERT INTO blocked_sessions (user_id, blocked_at)
            VALUES (?, NOW())
            ON DUPLICATE KEY UPDATE blocked_at = NOW()
        ");
        $blockSessionStmt->bind_param("s", $targetUserId);
        $blockSessionStmt->execute();
        $blockSessionStmt->close();
    }

    $conn->close();

    $response = [
        'success' => true,
        'message' => 'User blocked successfully. They will be logged out on their next request.'
    ];
    $httpCode = 200;

} catch (Exception $e) {
    $httpCode = $e->getCode() ?: 400;
    $response = ['success' => false, 'message' => $e->getMessage()];
}

http_response_code($httpCode);
echo json_encode($response);
exit;
?>