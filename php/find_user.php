<?php
session_start();
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "fashionflow";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500); // ← keep 500, this IS a real server error
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

$user_id = $_POST['user_id'] ?? '';

if (empty($user_id)) {
    http_response_code(200); // ← changed from 400
    echo json_encode(['success' => false, 'message' => 'Please enter your User ID.']);
    exit();
}

$stmt = $conn->prepare("SELECT user_ID, username, email, sec_question_1, sec_question_2, sec_question_3 
                        FROM users 
                        WHERE user_ID = ?");
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(200); // ← already correct
    echo json_encode(['success' => false, 'message' => 'User ID not found. Please check and try again.']);
    exit();
}

$row = $result->fetch_assoc();

if (empty($row['sec_question_1']) || empty($row['sec_question_2']) || empty($row['sec_question_3'])) {
    http_response_code(200); // ← changed from 400
    echo json_encode(['success' => false, 'message' => 'Security questions not set for this account. Please contact support.']);
    exit();
}

$_SESSION['recovery_user_id'] = $row['user_ID'];
$_SESSION['recovery_username'] = $row['username'];  // ← add this
$_SESSION['recovery_email']   = $row['email'];
$_SESSION['has_security_questions'] = true;

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'User found. Proceeding to send verification code...',
    'user_id' => $row['user_ID'],
    'username' => $row['username'],  // ← this line is missing
    'email'   => $row['email']
]);

$stmt->close();
$conn->close();
?>