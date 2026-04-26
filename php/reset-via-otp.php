<?php
session_start();
if (!isset($_SESSION['otp_ok']) || $_SESSION['otp_ok'] !== true)
    die('Access denied – verify OTP first.');

$conn = new mysqli('localhost','root','','fashionflow');
if ($conn->connect_error) die('DB error');

$new = $_POST['newPassword'];
$conf = $_POST['confirmPassword'];

if ($new !== $conf) die('Passwords do not match.');
if (strlen($new) < 6)   die('Password too short.');

$hash = password_hash($new, PASSWORD_DEFAULT);
$uid  = $_SESSION['reset_uid'];

$stmt = $conn->prepare('UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE User_ID = ?');
$stmt->bind_param('si', $hash, $uid);
$stmt->execute();
$stmt->close();

session_destroy();
header('Location: ../html/sign-in.html?reset=success');
exit;
?>