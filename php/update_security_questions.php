<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['account_status']) || $_SESSION['account_status'] !== 'user') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$userId = $input['user_id'];
$secQ1 = $input['sec_question_1'] ?? '';
$secA1 = $input['sec_answer_1'] ?? '';
$secQ2 = $input['sec_question_2'] ?? '';
$secA2 = $input['sec_answer_2'] ?? '';
$secQ3 = $input['sec_question_3'] ?? '';
$secA3 = $input['sec_answer_3'] ?? '';

// Verify session matches the user being updated
if ($userId != $_SESSION['user_id']) {
    echo json_encode(['success' => false, 'message' => 'You can only update your own security questions']);
    exit;
}

// Validate all fields are filled
if (empty($secQ1) || empty($secA1) || empty($secQ2) || empty($secA2) || empty($secQ3) || empty($secA3)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all security questions and answers']);
    exit;
}

// Hash answers for security
$hashedA1 = password_hash($secA1, PASSWORD_DEFAULT);
$hashedA2 = password_hash($secA2, PASSWORD_DEFAULT);
$hashedA3 = password_hash($secA3, PASSWORD_DEFAULT);

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET 
                        sec_question_1 = ?, sec_answer_1 = ?,
                        sec_question_2 = ?, sec_answer_2 = ?,
                        sec_question_3 = ?, sec_answer_3 = ?
                        WHERE user_ID = ?");
$stmt->bind_param("sssssss", $secQ1, $hashedA1, $secQ2, $hashedA2, $secQ3, $hashedA3, $userId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Security questions updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update security questions: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>