<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database config
$host = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbname = "fashionflow";

// Get parameters from URL
$viewerRole = isset($_GET['role']) ? strtolower($_GET['role']) : '';
$viewerUsername = isset($_GET['username']) ? $_GET['username'] : '';

if (empty($viewerRole) || empty($viewerUsername)) {
    echo json_encode([
        'success' => false,
        'status' => 401,    
        'message' => 'Missing viewer credentials',
        'logs' => []
    ]);
    exit;
}

// Connect to database
$conn = @new mysqli($host, $dbUser, $dbPassword, $dbname);

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'status' => 500,
        'message' => 'Database connection failed',
        'logs' => []
    ]);
    exit;
}

// VERIFY the viewer exists in users table
$stmt = $conn->prepare("SELECT account_status FROM users WHERE username = ?");
$stmt->bind_param("s", $viewerUsername);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'status' => 403,
        'message' => 'Invalid viewer username',
        'logs' => []
    ]);
    exit;
}

$stmt->bind_result($dbAccountStatus);
$stmt->fetch();
$stmt->close();

// Verify the role matches what's in database
if (strtolower($dbAccountStatus) !== $viewerRole) {
    echo json_encode([
        'success' => false,
        'status' => 403,
        'message' => 'Role mismatch',
        'logs' => []
    ]);
    exit;
}

// IMPROVED: Join with users table to get CURRENT role (in case account_status in security_logs is NULL or outdated)
$sql = "SELECT 
            sl.log_id as id, 
            sl.username, 
            COALESCE(u.account_status, sl.account_status, 'user') as role,
            sl.device_info as device, 
            sl.ip_address, 
            sl.login_timestamp as login_time, 
            sl.logout_timestamp as logout_time, 
            sl.login_status as status 
        FROM security_logs sl
        LEFT JOIN users u ON sl.username = u.username
        WHERE 1=1";

// Apply role-based filtering (using the CURRENT role from users table)
if ($viewerRole === 'super admin') {
    // Super admin sees all logs except other super admins (or see all if you prefer)
    $sql .= " AND COALESCE(u.account_status, sl.account_status, 'user') IN ('admin', 'user')";
} elseif ($viewerRole === 'admin') {
    // Admin sees USER logs only
    $sql .= " AND COALESCE(u.account_status, sl.account_status, 'user') = 'user'";
} elseif ($viewerRole === 'user') {
    // User sees only their own logs
    $sql .= " AND sl.username = '" . $conn->real_escape_string($viewerUsername) . "'";
}

// Optional filters from URL
$roleFilter = isset($_GET['role_filter']) ? $_GET['role_filter'] : 'all';
$statusFilter = isset($_GET['status_filter']) ? $_GET['status_filter'] : 'all';

// Only apply role filter if it doesn't conflict with viewer's restriction
if ($roleFilter !== 'all') {
    $sql .= " AND COALESCE(u.account_status, sl.account_status, 'user') = '" . $conn->real_escape_string($roleFilter) . "'";
}

if ($statusFilter !== 'all') {
    $sql .= " AND sl.login_status = '" . $conn->real_escape_string($statusFilter) . "'";
}

$sql .= " ORDER BY sl.login_timestamp DESC";

$result = $conn->query($sql);

$logs = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        // Convert IPv6 localhost to IPv4 for display
        $ip = $row['ip_address'];
        if ($ip === '::1') {
            $ip = '127.0.0.1';
        } elseif (strpos($ip, '::ffff:') === 0) {
            $ip = substr($ip, 7);
        }
        
        // Normalize role value
        $role = strtolower($row['role']);
        if ($role === 'superadmin') $role = 'super admin';
        
        $logs[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'role' => $role,
            'device' => $row['device'] ?: 'Unknown',
            'ip' => $ip ?: '0.0.0.0',
            'loginTime' => $row['login_time'],
            'logoutTime' => $row['logout_time'],
            'status' => strtolower($row['status'])
        ];
    }
}

echo json_encode([
    'success' => true,
    'status' => 200,
    'logs' => $logs,
    'count' => count($logs),
    'viewer' => $viewerUsername,
    'viewer_role' => $viewerRole
]);

$conn->close();
?>