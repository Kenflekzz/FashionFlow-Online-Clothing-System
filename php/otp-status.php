<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['otp_expire'])) {
    echo json_encode(['expired' => true]);
    exit;
}
$expire = $_SESSION['otp_expire'];
$left = max(0, $_SESSION['otp_expire'] - time() + 1);
echo json_encode([
    'expired' => $left <= 0,
    'left'    => $left,
    'expire'  => $_SESSION['otp_expire']
]);