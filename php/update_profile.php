<?php
session_start();
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$userId = $_SESSION['user_id'];
$firstName = $input['first_name'] ?? '';
$lastName = $input['last_name'] ?? '';
$email = $input['email'] ?? '';
$phone = $input['phone'] ?? '';

if (empty($firstName) || empty($lastName) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'First name, last name, and email are required']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Check if email exists for another user
$checkStmt = $conn->prepare("SELECT user_ID FROM users WHERE email = ? AND user_ID != ?");
$checkStmt->bind_param("ss", $email, $userId);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email already in use by another account']);
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

$stmt = $conn->prepare("UPDATE users SET Fname = ?, Lname = ?, email = ?, phone = ? WHERE user_ID = ?");
$stmt->bind_param("sssss", $firstName, $lastName, $email, $phone, $userId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
}

$stmt->close();
$conn->close();
?>