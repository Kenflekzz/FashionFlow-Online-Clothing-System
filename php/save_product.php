<?php
session_start();
header('Content-Type: application/json');
require_once 'check_privilege.php';

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$isUpdate = $id > 0;

// Check appropriate permission
if ($isUpdate) {
    requirePrivilege('products', 'update', $conn);
} else {
    requirePrivilege('products', 'create', $conn);
}

// Get and validate inputs
$name = $conn->real_escape_string($_POST['name'] ?? '');
$sku = $conn->real_escape_string($_POST['sku'] ?? '');
$category_id = intval($_POST['category_id'] ?? 0);
$brand = $conn->real_escape_string($_POST['brand'] ?? '');
$price = floatval($_POST['price'] ?? 0);
$compare_price = floatval($_POST['compare_price'] ?? 0);
$stock = intval($_POST['stock'] ?? 0);
$low_stock_threshold = intval($_POST['low_stock_threshold'] ?? 10);
$description = $conn->real_escape_string($_POST['description'] ?? '');
$status = isset($_POST['status']) ? 'active' : 'inactive';

// Validation
if (empty($name) || empty($sku) || $price <= 0) {
    echo json_encode(['status' => 400, 'message' => 'Name, SKU, and valid price are required']);
    $conn->close();
    exit;
}

// Check SKU uniqueness (exclude current ID for updates)
$skuCheck = $conn->prepare("SELECT id FROM products WHERE sku = ? AND id != ? AND deleted_at IS NULL");
$skuCheck->bind_param("si", $sku, $id);
$skuCheck->execute();
$skuResult = $skuCheck->get_result();
if ($skuResult->num_rows > 0) {
    $skuCheck->close();
    $conn->close();
    echo json_encode(['status' => 400, 'message' => 'SKU already exists']);
    exit;
}
$skuCheck->close();

if ($isUpdate) {
    // Update existing
    $stmt = $conn->prepare("
        UPDATE products SET 
            name = ?, sku = ?, category_id = ?, brand = ?, 
            price = ?, compare_price = ?, stock = ?, 
            low_stock_threshold = ?, description = ?, status = ?
        WHERE id = ?
    ");
    $stmt->bind_param("ssisddisssi", $name, $sku, $category_id, $brand, $price, $compare_price, 
                      $stock, $low_stock_threshold, $description, $status, $id);
} else {
    // Insert new
    $stmt = $conn->prepare("
        INSERT INTO products 
        (name, sku, category_id, brand, price, compare_price, stock, low_stock_threshold, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->bind_param("ssisddisss", $name, $sku, $category_id, $brand, $price, $compare_price,
                      $stock, $low_stock_threshold, $description, $status);
}

if ($stmt->execute()) {
    $productId = $isUpdate ? $id : $stmt->insert_id;
    
    // Handle image upload
    if (isset($_FILES['image']) && $_FILES['image']['tmp_name']) {
        $uploadDir = '../uploads/products/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
            // Remove old primary image
            $conn->query("UPDATE product_images SET is_primary = 0 WHERE product_id = {$productId}");
            
            // Add new image
            $imageUrl = 'uploads/products/' . $filename;
            $imgStmt = $conn->prepare("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)");
            $imgStmt->bind_param("is", $productId, $imageUrl);
            $imgStmt->execute();
            $imgStmt->close();
        }
    }
    
    echo json_encode([
        'status' => 200,
        'message' => $isUpdate ? 'Product updated successfully' : 'Product created successfully',
        'id' => $productId
    ]);
} else {
    echo json_encode(['status' => 500, 'message' => 'Database error: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>