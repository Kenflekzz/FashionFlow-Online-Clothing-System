<?php
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_httponly', 1);
ini_set('session.gc_maxlifetime', 86400);
session_set_cookie_params([
    'lifetime' => 86400,
    'path'     => '/',
    'domain'   => '',
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 401, 'message' => 'Not authenticated']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 500, 'message' => 'Database error']);
    exit;
}

$stmt = $conn->prepare("SELECT is_blocked, block_reason, force_logout, account_status FROM users WHERE user_ID = ?");
$stmt->bind_param("s", $_SESSION['user_id']);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    $conn->close();
    http_response_code(401);
    echo json_encode(['status' => 401, 'message' => 'User not found']);
    exit;
}

// Check for force_logout (triggered when another super admin logged in)
if ($user['force_logout'] == 1) {
    // Clear the force_logout flag
    $clearStmt = $conn->prepare("UPDATE users SET force_logout = 0 WHERE user_ID = ?");
    $clearStmt->bind_param("s", $_SESSION['user_id']);
    $clearStmt->execute();
    $clearStmt->close();
    
    // Update last_logout
    $logoutStmt = $conn->prepare("UPDATE users SET last_logout = NOW() WHERE user_ID = ?");
    $logoutStmt->bind_param("s", $_SESSION['user_id']);
    $logoutStmt->execute();
    $logoutStmt->close();
    
    $conn->close();
    session_destroy();
    
    http_response_code(403);
    echo json_encode([
        'status'       => 403,
        'force_logout' => true,
        'message'      => 'Another super admin has logged in. Only one active super admin allowed. Session terminated.'
    ]);
    exit;
}

// Check if account is blocked
if ($user['is_blocked'] == 1) {
    // Update last_logout before destroying session
    $logoutStmt = $conn->prepare("UPDATE users SET last_logout = NOW() WHERE user_ID = ?");
    $logoutStmt->bind_param("s", $_SESSION['user_id']);
    $logoutStmt->execute();
    $logoutStmt->close();
    
    $conn->close();
    session_destroy();
    
    http_response_code(403);
    echo json_encode([
        'status'  => 403,
        'blocked' => true,
        'message' => 'Your account has been blocked. Reason: ' . ($user['block_reason'] ?: 'No reason provided.')
    ]);
    exit;
}

// Update last_active for the user (to track activity)
$updateActiveStmt = $conn->prepare("UPDATE users SET last_active = NOW() WHERE user_ID = ?");
$updateActiveStmt->bind_param("s", $_SESSION['user_id']);
$updateActiveStmt->execute();
$updateActiveStmt->close();

$conn->close();

echo json_encode([
    'status' => 200, 
    'valid' => true,
    'account_status' => $user['account_status']
]);
?>