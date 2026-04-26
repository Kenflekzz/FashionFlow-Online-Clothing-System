<?php
session_start();
if (isset($_SESSION['user_id'])) {
    $checkConn = new mysqli("localhost", "root", "", "fashionflow");
    if (!$checkConn->connect_error) {
        $blockCheck = $checkConn->prepare("SELECT is_blocked, block_reason FROM users WHERE user_ID = ?");
        $blockCheck->bind_param("s", $_SESSION['user_id']);
        $blockCheck->execute();
        $blockedUser = $blockCheck->get_result()->fetch_assoc();
        $blockCheck->close();
        $checkConn->close();

        if ($blockedUser && $blockedUser['is_blocked'] == 1) {
            session_destroy();
            http_response_code(403);
            echo json_encode(['status' => 403, 'message' => 'Account blocked.', 'blocked' => true]);
            exit;
        }
    }
}
header('Content-Type: application/json');

$host = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbname = "fashionflow";

$conn = new mysqli($host, $dbUser, $dbPassword, $dbname);

if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$username = $_GET['username'] ?? '';

if (!$username) {
    echo json_encode(['status' => 400, 'message' => 'Username required']);
    exit;
}

// Users can only see their own logs
$stmt = $conn->prepare("SELECT log_id, login_timestamp, logout_timestamp, device_info, ip_address, login_status 
                        FROM security_logs 
                        WHERE username = ? AND account_status = 'user'
                        ORDER BY login_timestamp DESC 
                        LIMIT 50");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$logs = [];
while ($row = $result->fetch_assoc()) {
    // FIX: Convert IPv6 localhost to IPv4 for display
    $ip = $row['ip_address'];
    if ($ip === '::1') {
        $ip = '127.0.0.1';
    } elseif (strpos($ip, '::ffff:') === 0) {
        // Convert IPv4-mapped IPv6 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
        $ip = substr($ip, 7);
    }
    
    $logs[] = [
        'id' => $row['log_id'],
        'loginTime' => $row['login_timestamp'],
        'logoutTime' => $row['logout_timestamp'],
        'device' => $row['device_info'],
        'ip' => $ip,
        'status' => $row['login_status']
    ];
}

echo json_encode([
    'status' => 200,
    'logs' => $logs
]);

$stmt->close();
$conn->close();
?>