<?php
session_start();
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php';

// Database connection
$conn = new mysqli('localhost', 'root', '', 'fashionflow');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

$user_id = $_POST['user_id'] ?? '';

if (empty($user_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter your User ID.']);
    exit();
}

// Verify this user was validated by find_user.php
if (!isset($_SESSION['recovery_user_id']) || $_SESSION['recovery_user_id'] !== $user_id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Please validate User ID first.']);
    exit();
}

// Lookup user by ID to get email
$stmt = $conn->prepare("SELECT User_ID, email FROM users WHERE user_ID = ?");
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User ID not found.']);
    exit();
}

$user = $result->fetch_assoc();
$email = strtolower(trim($user['email']));
$uid = $user['User_ID'];
$stmt->close();

// Generate 6-digit OTP
$otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Clear previous OTP session data
unset($_SESSION['otp_expire']);
unset($_SESSION['reset_uid']);
unset($_SESSION['otp_email']);
unset($_SESSION['otp_verified']);
unset($_SESSION['security_verified']);

$expireTs = time() + 300; // 5 minutes
$expires = date('Y-m-d H:i:s', $expireTs);

// Store in session
$_SESSION['reset_uid'] = $uid;
$_SESSION['otp_email'] = $email;
$_SESSION['otp_expire'] = $expireTs;

// Save OTP to database
$stmt = $conn->prepare('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE User_ID = ?');
$stmt->bind_param('ssi', $otp, $expires, $uid);
$stmt->execute();
$stmt->close();

// Send email using PHPMailer
$mail = new PHPMailer(true);
$mail->CharSet = 'UTF-8';

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'kenneth.camasura@csucc.edu.ph';
    $mail->Password   = 'ngdz jmpd thrv tlmd';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom('yourfashionflow@gmail.com', 'FashionFlow');
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = 'FashionFlow – Password Reset Code';
    
    $htmlBody = <<<HTML
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password</title>
  <style>
    body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;}
    .wrapper{background:#f4f4f4;padding:40px 10px;}
    .card{max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.08);}
    .header{background:#f0a160;color:#fff;padding:24px;border-radius:8px 8px 0 0;text-align:center;font-size:20px;font-weight:bold;}
    .content{padding:30px 24px;color:#333;font-size:16px;line-height:1.5;}
    .code{display:inline-block;margin:20px 0 10px;padding:14px 24px;background:#fafafa;border:2px solid #f0a160;border-radius:6px;font-size:28px;font-weight:bold;color:#d35400;letter-spacing:4px;}
    .footer{margin-top:30px;font-size:13px;color:#777;text-align:center;}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">FashionFlow</div>
      <div class="content">
        <p>Hi there,</p>
        <p>You requested a password reset. Use the 6-digit code below:</p>
        <div class="code">{$otp}</div>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
      <div class="footer">
        &copy; 2024 FashionFlow. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
HTML;

    $textBody = "FashionFlow Password Reset\n\n"
              . "Your reset code is: {$otp}\n"
              . "Valid for 5 minutes.\n\n"
              . "If you didn't request this, please ignore this email.";

    $mail->Body    = $htmlBody;
    $mail->AltBody = $textBody;
    
    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Verification code sent to your email.',
        'redirect' => '../html/otp-verification.html',  // Step 2: OTP Verification
        'email' => $email,
        'user_id' => $uid
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => "Could not send email. Please try again later."
    ]);
}

$conn->close();
?>