<?php
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

$response = ['success' => false, 'message' => 'Unknown error'];

try {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Not authenticated', 401);
    }

    $currentUserId   = $_SESSION['user_id'];
    $currentUsername = $_SESSION['username']       ?? 'Unknown';
    $accountStatus   = $_SESSION['account_status'] ?? null;

    if ($accountStatus !== 'super admin' && $accountStatus !== 'admin') {
        throw new Exception('Unauthorized', 403);
    }

    $rawInput = file_get_contents('php://input');
    $data     = json_decode($rawInput, true);

    $targetUserId = $data['user_id'] ?? null;
    $reason       = $data['reason']  ?? '';

    if (!$targetUserId) {
        throw new Exception('No user ID provided', 400);
    }

    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if ($conn->connect_error) {
        throw new Exception('Database connection failed', 500);
    }

    // Fetch user info before unblocking
    $checkStmt = $conn->prepare("
        SELECT username, account_status, is_blocked, status FROM users WHERE user_ID = ?
    ");
    $checkStmt->bind_param("s", $targetUserId);
    $checkStmt->execute();
    $user = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if (!$user) {
        throw new Exception('User not found', 404);
    }

    if ($user['is_blocked'] == 0) {
        throw new Exception('User is not blocked', 400);
    }

    // Unblock the user
    $stmt = $conn->prepare("
        UPDATE users SET
            is_blocked   = 0,
            status       = 'Active',
            block_reason = NULL,
            blocked_by   = NULL,
            blocked_at   = NULL
        WHERE user_ID = ?
    ");
    $stmt->bind_param("s", $targetUserId);

    if (!$stmt->execute()) {
        throw new Exception('Failed to unblock user: ' . $stmt->error);
    }
    $stmt->close();

    // Log the unblock activity
    require_once 'log_activity.php';
    logActivity(
        $conn,
        $targetUserId,
        $user['username']       ?? $targetUserId,
        $user['account_status'] ?? 'user',
        'Account Unblocked',
        "Account unblocked by {$currentUsername}" . ($reason ? ". Reason: {$reason}" : ''),
        $currentUsername
    );

    // Also remove from blocked_sessions if exists
    $conn->query("
        DELETE FROM blocked_sessions WHERE user_id = '$targetUserId'
    ");

    $conn->close();

    $response = [
        'success' => true,
        'message' => 'User unblocked successfully'
    ];

} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
    error_log("Unblock user error: " . $e->getMessage());
}

echo json_encode($response);
exit;
?>  