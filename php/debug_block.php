<?php
// test_block.php
session_start();
header('Content-Type: application/json');

// Enable error logging but not display
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set a test user in session for debugging
$_SESSION['user_id'] = 'your_user_id'; // Replace with actual super admin ID
$_SESSION['account_status'] = 'super admin';
$_SESSION['username'] = 'superadmin';

echo json_encode(['status' => 'testing', 'session' => $_SESSION]);
?>