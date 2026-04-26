<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(0);
ob_start();

if (!isset($_SESSION['account_status']) ||
    !in_array($_SESSION['account_status'], ['admin', 'super admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 403, 'message' => 'Unauthorized']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$limit    = isset($_GET['limit'])    ? intval($_GET['limit'])                        : 10;
$offset   = isset($_GET['offset'])   ? intval($_GET['offset'])                       : 0;
$search   = isset($_GET['search'])   ? $conn->real_escape_string($_GET['search'])    : '';
$type     = isset($_GET['type'])     ? $conn->real_escape_string($_GET['type'])      : 'all';
$role     = isset($_GET['role'])     ? $conn->real_escape_string($_GET['role'])      : 'all';
$dateFrom = isset($_GET['dateFrom']) ? $conn->real_escape_string($_GET['dateFrom'])  : '';
$dateTo   = isset($_GET['dateTo'])   ? $conn->real_escape_string($_GET['dateTo'])    : '';

$where = "WHERE 1=1";
if (!empty($search)) {
    $where .= " AND (username LIKE '%{$search}%'
                     OR description LIKE '%{$search}%'
                     OR user_id LIKE '%{$search}%'
                     OR activity_type LIKE '%{$search}%')";
}
if ($type !== 'all') {
    $where .= " AND activity_type = '{$type}'";
}
if ($role !== 'all') {
    $where .= " AND role = '{$role}'";
}
if (!empty($dateFrom)) {
    $where .= " AND DATE(created_at) >= '{$dateFrom}'";
}
if (!empty($dateTo)) {
    $where .= " AND DATE(created_at) <= '{$dateTo}'";
}

$countResult = $conn->query("SELECT COUNT(*) as total FROM activity_log {$where}");
$total       = $countResult ? $countResult->fetch_assoc()['total'] : 0;

$result = $conn->query("
    SELECT id, user_id, username, role, activity_type,
           description, ip_address, device, performed_by, created_at
    FROM activity_log
    {$where}
    ORDER BY created_at DESC
    LIMIT {$limit} OFFSET {$offset}
");

$logs = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
}

$conn->close();
ob_end_clean();
echo json_encode(['status' => 200, 'logs' => $logs, 'total' => intval($total)]);
exit;
?>