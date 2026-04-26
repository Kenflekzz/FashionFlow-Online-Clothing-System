<?php
session_start();

// same connection you used in send-otp.php
$conn = new mysqli('localhost','root','','fashionflow');
if ($conn->connect_error) die('DB error');

if (empty($_SESSION['otp_email'])) {
    header('Location: ../html/forgot-password-step1.html');
    exit;
}

$email = $_SESSION['otp_email'];
$code  = str_pad(random_int(0,999999),6,'0',STR_PAD_LEFT);
$expire = time() + 300;   // 5 min

// update DB
$stmt = $conn->prepare('UPDATE users SET otp_code=?, otp_expires_at=? WHERE email=?');
$expireDate = date('Y-m-d H:i:s', $expire);
$stmt->bind_param('sss', $code, $expireDate, $email);
$stmt->execute();
$stmt->close();

// refresh session timestamps
$_SESSION['otp_code']   = $code;
$_SESSION['otp_expire'] = $expire;

// mail the new code
$subject = 'Your new verification code';
$message = "Use this code to reset your password: $code\nValid for 5 minutes.";
mail($email, $subject, $message);   // switch to PHPMailer if you prefer

header('Location: ../html/forgot-password-step2.html');
exit;
?>