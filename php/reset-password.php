<?php
session_start();
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "fashionflow";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

// Verify all previous steps completed
if (!isset($_SESSION['otp_verified']) || $_SESSION['otp_verified'] !== true ||
    !isset($_SESSION['security_verified']) || $_SESSION['security_verified'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Please complete all verification steps first.']);
    exit();
}

$newPassword = $_POST['newPassword'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

// Validation
if (empty($newPassword) || empty($confirmPassword)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
    exit();
}

// Get current password hash for comparison
$uid = $_SESSION['reset_uid'];
$stmt = $conn->prepare("SELECT password FROM users WHERE User_ID = ?");
$stmt->bind_param("i", $uid);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

// Validate new password
if ($newPassword !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New passwords do not match.']);
    exit();
}

if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters.']);
    exit();
}

// Additional password strength validation
if (!preg_match('/[A-Z]/', $newPassword) || 
    !preg_match('/[a-z]/', $newPassword) || 
    !preg_match('/[0-9]/', $newPassword)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must contain uppercase, lowercase, and numbers.']);
    exit();
}

// Prevent reusing old password
if (password_verify($newPassword, $user['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password cannot be the same as your current password.']);
    exit();
}

// Hash and update new password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE users SET password = ? WHERE User_ID = ?");
$stmt->bind_param("si", $hashedPassword, $uid);

if ($stmt->execute()) {
    // Clear all recovery session data
    session_destroy();
    
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successful.',
        'redirect' => 'sign-in.html'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update password. Please try again.']);
}

$stmt->close();
$conn->close();
?>