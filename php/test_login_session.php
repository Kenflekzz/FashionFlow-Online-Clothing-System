<?php
session_start();
header('Content-Type: application/json');

// Clear any existing session for testing
session_destroy();
session_start();

// Set test data
$_SESSION['user_id'] = 'test_user_123';
$_SESSION['username'] = 'testadmin';
$_SESSION['account_status'] = 'super admin';

// Force session to write
session_write_close();

// Start a new session to verify
session_start();
echo json_encode([
    'session_id' => session_id(),
    'session_data' => $_SESSION,
    'session_status' => session_status()
]);
?>