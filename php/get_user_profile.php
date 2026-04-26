<?php
session_start();
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['user_id'];

$conn = new mysqli("localhost", "root", "", "fashionflow");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$stmt = $conn->prepare("
    SELECT user_ID, Fname, Lname, email, 
           sec_question_1, sec_question_2, sec_question_3,
           profile_pic, username
    FROM users 
    WHERE user_ID = ?
");
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user) {
    echo json_encode([
        'success' => true,
        'user' => [
            'user_id' => $user['user_ID'],
            'Fname' => $user['Fname'],
            'Lname' => $user['Lname'],
            'email' => $user['email'],
            'username' => $user['username'],
            'sec_question_1' => $user['sec_question_1'],
            'sec_question_2' => $user['sec_question_2'],
            'sec_question_3' => $user['sec_question_3'],
            'profile_pic' => $user['profile_pic'] ? '../uploads/profile_pictures/' . $user['profile_pic'] : null
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'User not found']);
}

$stmt->close();
$conn->close();
?>