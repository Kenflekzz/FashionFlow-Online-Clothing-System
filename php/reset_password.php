<?php
session_start();
header('Content-Type: application/json');

// Check if user came from forgot password flow (security questions verified)
if (!isset($_SESSION['reset_username']) || $_SESSION['reset_username'] !== $username) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Please verify your security questions first']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username']) || !isset($input['new_password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$username = $input['username'];
$newPassword = $input['new_password'];

// Validate password strength
if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
$stmt->bind_param("ss", $hashedPassword, $username);

if ($stmt->execute()) {
    // Clear the reset session
    unset($_SESSION['reset_username']);
    echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
}

$stmt->close();
$conn->close();
?>