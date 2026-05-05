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

if (isset($_SESSION['user_id'])) {
    $checkConn = new mysqli("localhost", "root", "", "fashionflow");
    if (!$checkConn->connect_error) {
        // Check if user was blocked while logged in
        $blockCheck = $checkConn->prepare("
            SELECT is_blocked, block_reason, username, account_status FROM users WHERE user_ID = ?
        ");
        $blockCheck->bind_param("s", $_SESSION['user_id']);
        $blockCheck->execute();
        $blockedUser = $blockCheck->get_result()->fetch_assoc();
        $blockCheck->close();

        if ($blockedUser && $blockedUser['is_blocked'] == 1) {
            require_once 'log_activity.php';
            logActivity(
                $checkConn,
                $_SESSION['user_id'],
                $blockedUser['username']       ?? $_SESSION['username'] ?? 'Unknown',
                $blockedUser['account_status'] ?? 'user',
                'Logout',
                'Forced logout — account was blocked. Reason: ' . ($blockedUser['block_reason'] ?: 'No reason provided.'),
                'System'
            );
            $checkConn->close();
            session_destroy();
            http_response_code(403);
            echo json_encode([
                'status'  => 403,
                'message' => 'Your account has been blocked. Reason: ' . ($blockedUser['block_reason'] ?: 'No reason provided.'),
                'blocked' => true
            ]);
            exit();
        }

        $checkConn->close();
    }
}

header('Content-Type: application/json');

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "fashionflow";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 500, 'message' => 'Database connection failed.']);
    exit();
}

// Handle logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $username = $_GET['username'] ?? $_SESSION['username'] ?? null;

    if ($username) {
        // Update security logs
        $updateStmt = $conn->prepare("
            UPDATE security_logs 
            SET logout_timestamp = NOW(), login_status = 'success'
            WHERE username = ? AND logout_timestamp IS NULL 
            ORDER BY login_timestamp DESC 
            LIMIT 1
        ");
        $updateStmt->bind_param("s", $username);
        $updateStmt->execute();
        $updateStmt->close();

        // Update last_logout in users table
        $logoutStmt = $conn->prepare("
            UPDATE users SET last_logout = NOW() WHERE username = ?
        ");
        $logoutStmt->bind_param("s", $username);
        $logoutStmt->execute();
        $logoutStmt->close();
    }

    session_destroy();
    echo json_encode(['status' => 200, 'message' => 'Logged out successfully.']);
    exit();
}

// Handle login - support both JSON and form data
$inputData = file_get_contents('php://input');
$data      = json_decode($inputData, true);
$isJson    = (json_last_error() === JSON_ERROR_NONE && !empty($data));

if ($isJson) {
    $inputUsername = $data['username'] ?? '';
    $password      = $data['password'] ?? '';
} else {
    $inputUsername = $_POST['Username'] ?? $_POST['username'] ?? '';
    $password      = $_POST['Password'] ?? $_POST['password'] ?? '';
}

$inputUsername = trim($inputUsername);

if (empty($inputUsername) || empty($password)) {
    http_response_code(400);
    echo json_encode(['status' => 400, 'message' => 'Username and password are required.']);
    exit();
}

$stmt = $conn->prepare("
    SELECT user_ID, username, password, account_status, approval_status,
           Fname, Lname, email, rejection_reason, is_blocked, status, block_reason
    FROM users WHERE username = ?
");
$stmt->bind_param("s", $inputUsername);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['status' => 401, 'message' => 'Invalid username or password.']);
    exit();
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['status' => 401, 'message' => 'Invalid username or password.']);
    exit();
}

// Check if blocked
if ($user['is_blocked'] == 1 || $user['status'] === 'Suspended' || $user['status'] === 'blocked') {
    http_response_code(403);
    echo json_encode([
        'status'         => 403,
        'message'        => 'Your account has been blocked. Reason: ' . ($user['block_reason'] ?: 'No reason provided. Please contact the administrator.'),
        'blocked'        => true,
        'account_status' => 'blocked'
    ]);
    exit();
}

// Check approval for regular users
if ($user['account_status'] === 'user') {
    switch ($user['approval_status']) {
        case 'pending':
            http_response_code(403);
            echo json_encode([
                'status'         => 403,
                'message'        => 'Your account is pending approval. Please wait for administrator approval.',
                'account_status' => 'pending',
                'dashboard'      => '../html/pending-approval.html'
            ]);
            exit();

        case 'rejected':
            http_response_code(403);
            echo json_encode([
                'status'  => 403,
                'message' => 'Your registration has been rejected. Reason: ' . ($user['rejection_reason'] ?: 'No reason provided. Please contact support.'),
                'account_status' => 'rejected'
            ]);
            exit();

        case 'approved':
            break;

        default:
            http_response_code(403);
            echo json_encode(['status' => 403, 'message' => 'Unknown account status. Please contact support.']);
            exit();
    }
}

// ============================================
// SUPER ADMIN MUTUAL EXCLUSION
// ============================================
if ($user['account_status'] === 'super admin') {
    try {
        $conn->begin_transaction();
        
        // Block all other super admins (set force_logout to 1 to terminate their sessions)
        $blockStmt = $conn->prepare("
            UPDATE users 
            SET is_blocked = 1, 
                block_reason = 'Auto-blocked: Another super admin currently active. Only one active super admin allowed.',
                blocked_by = ?,
                blocked_at = NOW(),
                force_logout = 1
            WHERE account_status = 'super admin' 
            AND is_blocked = 0
            AND user_ID != ?
        ");
        $blockStmt->bind_param("ss", $user['username'], $user['user_ID']);
        $blockStmt->execute();
        $blockedCount = $blockStmt->affected_rows;
        $blockStmt->close();
        
        // Unblock and update last_active for current super admin
        $unblockStmt = $conn->prepare("
            UPDATE users 
            SET is_blocked = 0, 
                block_reason = NULL, 
                blocked_by = NULL, 
                blocked_at = NULL,
                last_active = NOW(),
                force_logout = 0
            WHERE user_ID = ?
        ");
        $unblockStmt->bind_param("s", $user['user_ID']);
        $unblockStmt->execute();
        $unblockStmt->close();
        
        $conn->commit();
        
        // Log if other super admins were blocked
        if ($blockedCount > 0) {
            require_once 'log_activity.php';
            logActivity(
                $conn,
                $user['user_ID'],
                $user['username'],
                'super admin',
                'Login',
                "Super admin logged in. Blocked {$blockedCount} other super admin account(s).",
                $user['username']
            );
        }
        
    } catch (Exception $e) {
        $conn->rollback();
        // Log error but continue with login
        error_log("Super admin mutual exclusion error: " . $e->getMessage());
    }
} else {
    // For regular users and admins, just update last_active
    $updateActiveStmt = $conn->prepare("UPDATE users SET last_active = NOW() WHERE user_ID = ?");
    $updateActiveStmt->bind_param("s", $user['user_ID']);
    $updateActiveStmt->execute();
    $updateActiveStmt->close();
}

// Set session
$_SESSION['user_id']        = $user['user_ID'];
$_SESSION['username']       = $user['username'];
$_SESSION['email']          = $user['email'];
$_SESSION['full_name']      = $user['Fname'] . ' ' . $user['Lname'];
$_SESSION['account_status'] = $user['account_status'];

logSecurityActivity($conn, $user['user_ID'], $user['username'], $user['account_status']);
$conn->query("UPDATE users SET last_login = NOW() WHERE user_ID = '{$user['user_ID']}'");

$dashboard = '../html/user_dashboard.html';
if ($user['account_status'] === 'admin')       $dashboard = '../html/admin_dashboard.html';
if ($user['account_status'] === 'super admin') $dashboard = '../html/super_admin_dashboard.html';

echo json_encode([
    'status'         => 200,
    'message'        => 'Login successful!',
    'user_id'        => $user['user_ID'],
    'username'       => $user['username'],
    'account_status' => $user['account_status'],
    'dashboard'      => $dashboard
]);

require_once 'log_activity.php';
logActivity($conn, $user['user_ID'], $user['username'], $user['account_status'],
    'Login',
    'User logged in successfully',
    $user['username']
);

$stmt->close();
$conn->close();

// Helper Functions
function logSecurityActivity($conn, $userId, $username, $accountStatus) {
    $ipAddress  = $_SERVER['REMOTE_ADDR'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 'Unknown';
    $userAgent  = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $deviceInfo = parseDeviceInfo($userAgent);
    $status     = 'success';

    $insertStmt = $conn->prepare("
        INSERT INTO security_logs 
            (user_ID, username, account_status, device_info, ip_address, user_agent, login_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if ($insertStmt) {
        $insertStmt->bind_param("sssssss", $userId, $username, $accountStatus, $deviceInfo, $ipAddress, $userAgent, $status);
        $insertStmt->execute();
        $insertStmt->close();
    }
}

function parseDeviceInfo($userAgent) {
    $device  = 'Unknown Device';
    $browser = 'Unknown Browser';

    if (strpos($userAgent, 'Mobile') !== false || strpos($userAgent, 'Android') !== false)         $device = 'Mobile';
    elseif (strpos($userAgent, 'Tablet') !== false || strpos($userAgent, 'iPad') !== false)         $device = 'Tablet';
    elseif (strpos($userAgent, 'Windows') !== false)                                                $device = 'Windows PC';
    elseif (strpos($userAgent, 'Macintosh') !== false || strpos($userAgent, 'Mac OS X') !== false)  $device = 'Mac';
    elseif (strpos($userAgent, 'Linux') !== false)                                                  $device = 'Linux';

    if (strpos($userAgent, 'Chrome') !== false)       $browser = 'Chrome';
    elseif (strpos($userAgent, 'Firefox') !== false)  $browser = 'Firefox';
    elseif (strpos($userAgent, 'Safari') !== false)   $browser = 'Safari';
    elseif (strpos($userAgent, 'Edge') !== false)     $browser = 'Edge';

    return "$device - $browser";
}
?>