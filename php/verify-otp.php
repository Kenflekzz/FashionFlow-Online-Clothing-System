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

$otp = $_POST['otp'] ?? '';

if (empty($otp)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter the verification code.']);
    exit();
}

if (!isset($_SESSION['reset_uid']) || !isset($_SESSION['otp_expire'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Session expired. Please start over.']);
    exit();
}

if (time() > $_SESSION['otp_expire']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verification code has expired.']);
    exit();
}

$uid = $_SESSION['reset_uid'];

$stmt = $conn->prepare("SELECT otp_code, otp_expires_at FROM users WHERE User_ID = ?");
$stmt->bind_param("i", $uid);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    exit();
}

$row = $result->fetch_assoc();

if ($otp !== $row['otp_code']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid verification code.']);
    exit();
}

if (strtotime($row['otp_expires_at']) < time()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verification code has expired.']);
    exit();
}

// OTP valid! Clear from DB and mark as verified
$_SESSION['otp_verified'] = true;

$stmt = $conn->prepare("UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE User_ID = ?");
$stmt->bind_param("i", $uid);
$stmt->execute();

echo json_encode([
    'success' => true,
    'message' => 'Code verified successfully.',
    'redirect' => '../html/security-verify.html'  // Step 3: Security Questions
]);

$stmt->close();
$conn->close();
?>