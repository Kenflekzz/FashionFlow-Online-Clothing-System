<?php
session_start();
header('Content-Type: application/json');

// DEBUG: Log what we received
error_log('POST data: ' . print_r($_POST, true));

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

if (!isset($_SESSION['otp_verified']) || $_SESSION['otp_verified'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Please verify OTP first.']);
    exit();
}

// DEBUG: Check if POST is empty
if (empty($_POST)) {
    // Maybe data came as JSON?
    $json = file_get_contents('php://input');
    error_log('Raw input: ' . $json);
    
    echo json_encode([
        'success' => false, 
        'message' => 'No POST data received. Raw: ' . $json
    ]);
    exit();
}

// Get answers with fallback for debugging
$answer1 = isset($_POST['answer1']) ? strtolower(trim($_POST['answer1'])) : '';
$answer2 = isset($_POST['answer2']) ? strtolower(trim($_POST['answer2'])) : '';
$answer3 = isset($_POST['answer3']) ? strtolower(trim($_POST['answer3'])) : '';

// DEBUG: Show what we got
if (empty($answer1) || empty($answer2) || empty($answer3)) {
    echo json_encode([
        'success' => false, 
        'message' => "Missing: answer1='$answer1', answer2='$answer2', answer3='$answer3'"
    ]);
    exit();
}

$uid = $_SESSION['reset_uid'];

$stmt = $conn->prepare("SELECT sec_answer_1, sec_answer_2, sec_answer_3 FROM users WHERE User_ID = ?");
$stmt->bind_param("i", $uid);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

$correct1 = password_verify($answer1, $row['sec_answer_1']);
$correct2 = password_verify($answer2, $row['sec_answer_2']);
$correct3 = password_verify($answer3, $row['sec_answer_3']);

if ($correct1 && $correct2 && $correct3) {
    $_SESSION['security_verified'] = true;
    echo json_encode([
        'success' => true,
        'message' => 'Identity verified.',
        'redirect' => '../html/reset-password.html'
    ]);
} else {
    $wrong = [];
    if (!$correct1) $wrong[] = 'Q1';
    if (!$correct2) $wrong[] = 'Q2';
    if (!$correct3) $wrong[] = 'Q3';
    
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Wrong: ' . implode(', ', $wrong)
    ]);
}

$stmt->close();
$conn->close();
?>