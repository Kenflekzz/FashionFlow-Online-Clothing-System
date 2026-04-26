<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);  // CRITICAL: Hide errors from output
ini_set('log_errors', 1);        
require_once 'check_privileges.php';

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

// Check read permission
if (!checkPrivilegeSilent('orders', 'read', $conn)) {
    http_response_code(403);
    echo json_encode(['status' => 403, 'message' => 'No permission to view orders']);
    $conn->close();
    exit;
}

// Pagination
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 10;
$offset = ($page - 1) * $limit;

// Filters
$search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
$status = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : 'all';
$date = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : 'all';
$sort = isset($_GET['sort']) ? $conn->real_escape_string($_GET['sort']) : 'newest';

// Build WHERE
$where = "WHERE 1=1";
if (!empty($search)) {
    $where .= " AND (o.order_number LIKE '%{$search}%' OR u.username LIKE '%{$search}%' OR u.email LIKE '%{$search}%')";
}
if ($status !== 'all') {
    $where .= " AND o.status = '{$status}'";
}
if ($date === 'today') {
    $where .= " AND DATE(o.created_at) = CURDATE()";
} elseif ($date === 'week') {
    $where .= " AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
} elseif ($date === 'month') {
    $where .= " AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}

// Sorting
$orderBy = "ORDER BY o.created_at DESC";
if ($sort === 'oldest') {
    $orderBy = "ORDER BY o.created_at ASC";
} elseif ($sort === 'amount_high') {
    $orderBy = "ORDER BY o.total_amount DESC";
}

// Count total
$countQuery = "SELECT COUNT(DISTINCT o.id) as total FROM orders o LEFT JOIN users u ON o.user_id = u.user_ID {$where}";
$countResult = $conn->query($countQuery);
$total = $countResult->fetch_assoc()['total'];

// Main query
$query = "
    SELECT 
        o.id,
        o.order_number,
        o.user_id,
        u.username,
        u.email,
        o.total_amount,
        o.status,
        o.payment_status,
        o.shipping_address,
        o.created_at,
        COUNT(DISTINCT oi.id) as item_count,
        SUM(oi.quantity) as total_items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_ID
    LEFT JOIN order_items oi ON o.id = oi.order_id
    {$where}
    GROUP BY o.id
    {$orderBy}
    LIMIT {$limit} OFFSET {$offset}
";

$result = $conn->query($query);
$orders = [];

while ($row = $result->fetch_assoc()) {
    $orders[] = [
        'id' => intval($row['id']),
        'order_number' => $row['order_number'],
        'user_id' => intval($row['user_id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'total_amount' => floatval($row['total_amount']),
        'status' => $row['status'],
        'payment_status' => $row['payment_status'],
        'shipping_address' => $row['shipping_address'],
        'created_at' => $row['created_at'],
        'item_count' => intval($row['item_count']),
        'total_items' => intval($row['total_items'])
    ];
}

// Pipeline statistics
$pipelineQuery = "
    SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' AND DATE(updated_at) = CURDATE() THEN 1 ELSE 0 END) as delivered_today
    FROM orders 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
";
$pipelineResult = $conn->query($pipelineQuery);
$pipeline = $pipelineResult->fetch_assoc();

$conn->close();

echo json_encode([
    'status' => 200,
    'orders' => $orders,
    'total' => intval($total),
    'page' => $page,
    'pages' => ceil($total / $limit),
    'pipeline' => [
        'pending' => intval($pipeline['pending']),
        'processing' => intval($pipeline['processing']),
        'shipped' => intval($pipeline['shipped']),
        'delivered_today' => intval($pipeline['delivered_today'])
    ]
]);
?>