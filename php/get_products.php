<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);  // NEVER output errors to browser in API endpoints
ini_set('log_errors', 1);      // Log them instead
error_reporting(E_ALL);

require_once 'check_privileges.php';

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

// Check read permission
if (!checkPrivilegeSilent('products', 'read', $conn)) {
    http_response_code(403);
    echo json_encode(['status' => 403, 'message' => 'No permission to view products']);
    $conn->close();
    exit;
}

// Pagination
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 10;
$offset = ($page - 1) * $limit;

// Filters
$search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
$category = isset($_GET['category']) ? intval($_GET['category']) : 0;
$stock = isset($_GET['stock']) ? $conn->real_escape_string($_GET['stock']) : 'all';
$status = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : 'all';

// Build WHERE
$where = "WHERE p.deleted_at IS NULL";
if (!empty($search)) {
    $where .= " AND (p.name LIKE '%{$search}%' OR p.sku LIKE '%{$search}%' OR p.brand LIKE '%{$search}%')";
}
if ($category > 0) {
    $where .= " AND p.category_id = {$category}";
}
if ($status !== 'all') {
    $where .= " AND p.status = '{$status}'";
}
if ($stock === 'low') {
    $where .= " AND p.stock <= p.low_stock_threshold AND p.stock > 0";
} elseif ($stock === 'out') {
    $where .= " AND p.stock = 0";
} elseif ($stock === 'in_stock') {
    $where .= " AND p.stock > 0";
}

// Count total
$countResult = $conn->query("SELECT COUNT(*) as total FROM products p {$where}");
$total = $countResult->fetch_assoc()['total'];

// Main query
$query = "
    SELECT 
        p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    {$where}
    ORDER BY p.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
";

$result = $conn->query($query);
$products = [];

while ($row = $result->fetch_assoc()) {
    $products[] = [
        'id' => intval($row['id']),
        'name' => $row['name'],
        'sku' => $row['sku'],
        'category_id' => intval($row['category_id']),
        'category_name' => $row['category_name'],
        'brand' => $row['brand'],
        'price' => floatval($row['price']),
        'compare_price' => floatval($row['compare_price']),
        'stock' => intval($row['stock']),
        'low_stock_threshold' => intval($row['low_stock_threshold']),
        'status' => $row['status'],
        'description' => $row['description'],
        'primary_image' => $row['primary_image'],
        'updated_at' => $row['updated_at']
    ];
}

// Get categories for filter dropdown
$catResult = $conn->query("SELECT id, name FROM categories WHERE status = 'active' ORDER BY name");
$categories = [];
while ($row = $catResult->fetch_assoc()) {
    $categories[] = $row;
}

// Statistics
$statsQuery = "
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN stock <= low_stock_threshold AND stock > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock
    FROM products 
    WHERE deleted_at IS NULL
";
$statsResult = $conn->query($statsQuery);
$stats = $statsResult->fetch_assoc();

// Low stock alerts (active products only)
$lowStockQuery = "
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.stock <= p.low_stock_threshold AND p.stock > 0 AND p.status = 'active' AND p.deleted_at IS NULL
    ORDER BY p.stock ASC 
    LIMIT 5
";
$lowStockResult = $conn->query($lowStockQuery);
$lowStockAlerts = [];
while ($row = $lowStockResult->fetch_assoc()) {
    $lowStockAlerts[] = [
        'id' => intval($row['id']),
        'name' => $row['name'],
        'sku' => $row['sku'],
        'stock' => intval($row['stock']),
        'category_name' => $row['category_name']
    ];
}

$conn->close();

echo json_encode([
    'status' => 200,
    'products' => $products,
    'categories' => $categories,
    'total' => intval($total),
    'page' => $page,
    'pages' => ceil($total / $limit),
    'stats' => [
        'total' => intval($stats['total']),
        'active' => intval($stats['active']),
        'low_stock' => intval($stats['low_stock']),
        'out_of_stock' => intval($stats['out_of_stock'])
    ],
    'low_stock_alerts' => $lowStockAlerts
]);
?>