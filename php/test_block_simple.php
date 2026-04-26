<?php
session_start();
header('Content-Type: application/json');

// Log everything for debugging
error_log("=== SIMPLE BLOCK TEST ===");
error_log("Session ID: " . session_id());
error_log("Session data: " . print_r($_SESSION, true));
error_log("Cookies: " . print_r($_COOKIE, true));

$response = [
    'success' => false,
    'message' => 'Unknown error',
    'debug' => [
        'session_id' => session_id(),
        'session_data' => $_SESSION,
        'cookies' => $_COOKIE,
        'method' => $_SERVER['REQUEST_METHOD'],
        'input' => file_get_contents('php://input')
    ]
];

try {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('No user_id in session');
    }
    
    $response['success'] = true;
    $response['message'] = 'Session is valid';
    $response['current_user'] = $_SESSION['user_id'];
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>