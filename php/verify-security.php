<?php
session_start();

$conn = new mysqli('localhost','root','','fashionflow');

// IMPORTANT: Check that Step 2 (OTP) was completed first
if (!isset($_SESSION['otp_verified']) || !isset($_SESSION['recovery_user_id'])) {
    header("Location: ../html/security-verify.html?error=Please complete email verification first");
    exit();
}

$user_id = $_SESSION['recovery_user_id']; // Get from session, not form (more secure)
$ans1 = strtolower(trim($_POST['answer_1'] ?? ''));
$ans2 = strtolower(trim($_POST['answer_2'] ?? ''));
$ans3 = strtolower(trim($_POST['answer_3'] ?? ''));

// Fetch stored hashes from database
$stmt = $conn->prepare("SELECT sec_answer_1, sec_answer_2, sec_answer_3 FROM users WHERE User_ID = ?");
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();

if (!$result) {
    header("Location: ../html/security-verify.html?error=User not found");
    exit();
}

// Verify all 3 answers using password_verify
if (password_verify($ans1, $result['sec_answer_1']) && 
    password_verify($ans2, $result['sec_answer_2']) && 
    password_verify($ans3, $result['sec_answer_3'])) {
    
    // Success! Allow password reset
    $_SESSION['security_verified'] = true;
    $_SESSION['allow_reset'] = true;
    $token = bin2hex(random_bytes(32));
    $_SESSION['reset_token'] = $token;
    
    // Redirect to Step 4 (Reset Password)
    header("Location: ../html/forgot-password.html?token=" . $token);
    exit();
    
} else {
    // Wrong answer - don't specify which one for security
    header("Location: ../html/security-verify.html?error=" . urlencode("One or more answers are incorrect"));
    exit();
}
?>