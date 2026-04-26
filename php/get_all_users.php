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
// Force logout check
if (isset($_SESSION['user_id'])) {
    $checkConn = new mysqli("localhost", "root", "", "fashionflow");
    if (!$checkConn->connect_error) {
        $blockCheck = $checkConn->prepare("SELECT is_blocked, block_reason FROM users WHERE user_ID = ?");
        $blockCheck->bind_param("s", $_SESSION['user_id']);
        $blockCheck->execute();
        $blockedUser = $blockCheck->get_result()->fetch_assoc();
        $blockCheck->close();
        $checkConn->close();

        if ($blockedUser && $blockedUser['is_blocked'] == 1 && empty($blockedUser['is_deleted'])) {
            session_destroy();
            http_response_code(403);
            echo json_encode(['status' => 403, 'message' => 'Your account has been blocked.', 'blocked' => true]);
            exit();
        }
    }
}
header('Content-Type: application/json');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Check if user is logged in
if (!isset($_SESSION['user_id']) && !isset($_SESSION['account_status'])) {
    http_response_code(401);
    echo json_encode(['status' => 401, 'message' => 'Not authenticated']);
    exit;
}

if (isset($_SESSION['account_status']) && 
    !in_array($_SESSION['account_status'], ['super admin', 'admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 403, 'message' => 'Unauthorized']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$query = "SELECT 
            user_ID, Fname, Lname, M_I, Extension,
            username, email, sex, birthdate,
            purok, barangay, City_Municipality, province, country, zip_code,
            account_status as role, status, is_blocked,
            blocked_at, blocked_by, block_reason,
            last_login, last_logout, registered_at as created_at
          FROM users 
          WHERE (is_deleted = 0 OR is_deleted IS NULL)
          ORDER BY registered_at DESC";
$result = $conn->query($query);

if (!$result) {
    echo json_encode(['status' => 500, 'message' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$users = [];

while ($row = $result->fetch_assoc()) {
    $fullName = $row['Fname'];
    if (!empty($row['M_I']))        $fullName .= ' ' . $row['M_I'];
    $fullName .= ' ' . $row['Lname'];
    if (!empty($row['Extension']))  $fullName .= ' ' . $row['Extension'];

    // Fetch privileges for this user
    $privileges = [];
    $privStmt = $conn->prepare("
        SELECT module, can_create, can_read, can_update, can_delete, can_block
        FROM user_privileges
        WHERE user_id = ?
    ");
    $privStmt->bind_param("s", $row['user_ID']);
    $privStmt->execute();
    $privResult = $privStmt->get_result();
    while ($priv = $privResult->fetch_assoc()) {
        $actions = [];
        if ($priv['can_create']) $actions[] = 'create';
        if ($priv['can_read'])   $actions[] = 'read';
        if ($priv['can_update']) $actions[] = 'update';
        if ($priv['can_delete']) $actions[] = 'delete';
        if ($priv['can_block'])  $actions[] = 'block';
        $privileges[$priv['module']] = $actions;
    }
    $privStmt->close();

    $users[] = [
        'user_id'           => $row['user_ID'],
        'Fname'             => $row['Fname'],
        'Lname'             => $row['Lname'],
        'M_I'               => $row['M_I'],
        'Extension'         => $row['Extension'],
        'full_name'         => $fullName,
        'username'          => $row['username'],
        'email'             => $row['email'],
        'sex'               => $row['sex'],
        'birthdate'         => $row['birthdate'],
        'purok'             => $row['purok'],
        'barangay'          => $row['barangay'],
        'City_Municipality' => $row['City_Municipality'],
        'province'          => $row['province'],
        'country'           => $row['country'],
        'zip_code'          => $row['zip_code'],
        'role'              => $row['role'],
        'status'            => $row['status'],
        'is_blocked'        => (int)$row['is_blocked'],
        'blocked_at'        => $row['blocked_at'],
        'blocked_by'        => $row['blocked_by'],
        'block_reason'      => $row['block_reason'],
        'last_login'        => $row['last_login'],
        'last_logout'       => $row['last_logout'],
        'created_at'        => $row['created_at'],
        'privileges'        => $privileges
    ];
}

$conn->close();

echo json_encode([
    'status' => 200,
    'users'  => $users
]);
?>