<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(0);

// Allow both admin and super admin
if (!isset($_SESSION['account_status']) ||
    !in_array($_SESSION['account_status'], ['admin', 'super admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 403, 'message' => 'Unauthorized']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$userId    = $_POST['user_id']    ?? '';
$newStatus = $_POST['status']     ?? '';
$reason    = $_POST['reason']     ?? '';
$blockedBy = $_POST['blocked_by'] ?? $_SESSION['username'] ?? 'Admin';

if (empty($userId) || empty($newStatus)) {
    echo json_encode(['status' => 400, 'message' => 'User ID and status are required']);
    $conn->close();
    exit;
}

$isBlocking = $newStatus === 'blocked';

if ($isBlocking) {
    $stmt = $conn->prepare("
        UPDATE users SET
            is_blocked   = 1,
            status       = 'Suspended',
            block_reason = ?,
            blocked_by   = ?,
            blocked_at   = NOW()
        WHERE user_ID = ?
    ");
    $stmt->bind_param("sss", $reason, $blockedBy, $userId);
} else {
    $stmt = $conn->prepare("
        UPDATE users SET
            is_blocked   = 0,
            status       = 'Active',
            block_reason = NULL,
            blocked_by   = NULL,
            blocked_at   = NULL
        WHERE user_ID = ?
    ");
    $stmt->bind_param("s", $userId);
}

if ($stmt->execute()) {
    echo json_encode([
        'status'  => 200,
        'success' => true,
        'message' => 'Account ' . ($isBlocking ? 'blocked' : 'unblocked') . ' successfully'
    ]);
} else {
    echo json_encode([
        'status'  => 500,
        'success' => false,
        'message' => 'Failed to update status: ' . $stmt->error
    ]);
}


require_once 'log_activity.php';
$targetRow = $conn->query("SELECT username, account_status FROM users WHERE user_ID = '$userId'")->fetch_assoc();
logActivity($conn, $userId, $targetRow['username'] ?? $userId, $targetRow['account_status'] ?? 'user',
    $isBlocking ? 'Account Blocked' : 'Account Unblocked',
    $isBlocking ? "Account blocked. Reason: {$reason}" : "Account unblocked",
    $blockedBy
);

$stmt->close();
$conn->close();
?>