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

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SESSION['account_status'] !== 'super admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$input  = json_decode(file_get_contents('php://input'), true);
$userId = $input['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'No user ID provided']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Restore the user — undo soft delete
$stmt = $conn->prepare("
    UPDATE users SET
        is_deleted      = 0,
        is_blocked      = 0,
        status          = 'Active',
        approval_status = 'approved',
        block_reason    = NULL,
        blocked_by      = NULL,
        blocked_at      = NULL
    WHERE user_ID = ?
");
$stmt->bind_param("s", $userId);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}
$stmt->close();
// Check if user actually exists regardless of affected_rows
$checkStmt = $conn->prepare("SELECT user_ID FROM users WHERE user_ID = ?");
$checkStmt->bind_param("s", $userId);
$checkStmt->execute();
$exists = $checkStmt->get_result()->fetch_assoc();
$checkStmt->close();

if (!$exists) {
    echo json_encode([
        'success' => false, 
        'message' => 'This account cannot be restored because it was permanently deleted before soft-delete was implemented. You may delete this record from the deletion log.',
        'permanently_deleted' => true
    ]);
    exit;
}

// Remove from deletion log
$del = $conn->prepare("DELETE FROM admin_deletion_logs WHERE deleted_user_id = ?");
$del->bind_param("s", $userId);
$del->execute();
$del->close();

$conn->close();

echo json_encode(['success' => true, 'message' => 'Account restored successfully']);
?>