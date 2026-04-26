<?php
session_start();
header('Content-Type: application/json');

error_reporting(0);
ini_set('display_errors', 0);

// Check authentication
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Read JSON input (this is the key fix!)
$input = json_decode(file_get_contents('php://input'), true);

// If JSON failed, try POST
if (!$input) {
    $input = $_POST;
}

if (!$input || empty($input)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request - no data received']);
    exit;
}

$userId = $_SESSION['user_id'];
$currentPassword = $input['current_password'] ?? '';
$newPassword = $input['new_password'] ?? '';

if (empty($currentPassword)) {
    echo json_encode(['success' => false, 'message' => 'Current password is required']);
    exit;
}

if (empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'New password is required']);
    exit;
}

if (strlen($newPassword) < 6) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Get user's password
$stmt = $conn->prepare("SELECT password FROM users WHERE user_ID = ?");
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    $conn->close();
    exit;
}

// Verify current password
if (!password_verify($currentPassword, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    $conn->close();
    exit;
}

// Update password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
$updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE user_ID = ?");
$updateStmt->bind_param("ss", $hashedPassword, $userId);

if ($updateStmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update password: ' . $conn->error]);
}

$updateStmt->close();
$conn->close();
?>