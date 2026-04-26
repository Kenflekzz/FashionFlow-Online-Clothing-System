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

// Check if OTP was verified
if (!isset($_SESSION['otp_verified']) || $_SESSION['otp_verified'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Please verify OTP first.']);
    exit();
}

$uid = $_SESSION['reset_uid'];

$stmt = $conn->prepare("SELECT sec_question_1, sec_question_2, sec_question_3 FROM users WHERE User_ID = ?");
$stmt->bind_param("i", $uid);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    exit();
}

$row = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'questions' => [
        $row['sec_question_1'],
        $row['sec_question_2'],
        $row['sec_question_3']
    ]
]);

$stmt->close();
$conn->close();
?>