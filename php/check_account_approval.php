<?php
header('Content-Type: application/json');
session_start();

// Database connection
$host = 'localhost';
$dbname = 'fashionflow';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['user_id']) || empty($input['user_id'])) {
        echo json_encode([
            'success' => false,
            'is_approved' => false,
            'message' => 'User ID is required'
        ]);
        exit;
    }
    
    $user_id = $input['user_id'];
    
    // Query to check account approval status from users table
    $stmt = $pdo->prepare("
        SELECT 
            user_ID,
            username,
            email,
            approval_status,
            account_status,
            status,
            approved_by,
            approved_at,
            rejection_reason
        FROM users 
        WHERE user_ID = :user_id 
        LIMIT 1
    ");
    
    $stmt->execute([':user_id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'success' => true,
            'is_approved' => false,
            'status' => 'not_found',
            'message' => 'Account not found. Please check your User ID.'
        ]);
        exit;
    }
    
    // Check if account is approved by super admin based on approval_status column
    $is_approved = false;
    $status = $user['approval_status'] ?? 'pending';
    
    // Approval status can be: 'pending', 'approved', or 'rejected'
    if ($status === 'approved') {
        $is_approved = true;
    }
    
    // Also check if account is active (not suspended or blocked)
    $is_active = true;
    $account_status = $user['account_status'] ?? $user['status'] ?? 'Active';
    
    if ($account_status === 'Suspended' || $account_status === 'suspended') {
        $is_active = false;
    }
    
    // If account is not active, show appropriate message
    if (!$is_active) {
        echo json_encode([
            'success' => true,
            'is_approved' => false,
            'status' => 'suspended',
            'user_id' => $user_id,
            'email' => $user['email'] ?? '',
            'message' => 'Your account is suspended. Please contact support for assistance.'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'is_approved' => $is_approved,
        'status' => $status,
        'user_id' => $user_id,
        'username' => $user['username'] ?? '',
        'email' => $user['email'] ?? '',
        'approved_by' => $user['approved_by'] ?? null,
        'approved_at' => $user['approved_at'] ?? null,
        'message' => $is_approved ? 'Account is approved' : 'Account not approved by Super Admin'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in check_account_approval.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'is_approved' => false,
        'message' => 'Database error occurred. Please try again later.'
    ]);
} catch (Exception $e) {
    error_log("General error in check_account_approval.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'is_approved' => false,
        'message' => 'An error occurred. Please try again.'
    ]);
}
?>