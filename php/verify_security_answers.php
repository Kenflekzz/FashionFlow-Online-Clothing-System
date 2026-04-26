<?php
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username']) || !isset($input['answers'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$username = $input['username'];
$answers = $input['answers'];

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$stmt = $conn->prepare("SELECT sec_answer_1, sec_answer_2, sec_answer_3 FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $valid1 = password_verify($answers['answer1'], $row['sec_answer_1']);
    $valid2 = password_verify($answers['answer2'], $row['sec_answer_2']);
    $valid3 = password_verify($answers['answer3'], $row['sec_answer_3']);
    
    if ($valid1 && $valid2 && $valid3) {
        // Store username in session for password reset
        $_SESSION['reset_username'] = $username;
        echo json_encode(['success' => true, 'message' => 'Answers verified']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Incorrect answers']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'User not found']);
}

$stmt->close();
$conn->close();
?>