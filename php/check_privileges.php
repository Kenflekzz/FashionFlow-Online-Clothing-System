<?php
/**
 * Privilege Check Helper - Updated MODULE_ACTIONS
 * 
 * MODULE_ACTIONS = {
 *   security_logs: ['read'],
 *   users: ['read', 'update', 'block'],      // NO create, NO delete
 *   products: ['create', 'read', 'update', 'delete'],
 *   orders: ['read', 'update', 'delete'],
 *   reports: ['read']
 * }
 */

define('MODULE_ACTIONS', [
    'security_logs' => ['read'],
    'users' => ['read', 'update', 'block'],     // ✅ Updated - no create, no delete
    'products' => ['create', 'read', 'update', 'delete'],
    'orders' => ['read', 'update', 'delete'],
    'reports' => ['read']
]);

function isValidAction($module, $action) {
    if (!isset(MODULE_ACTIONS[$module])) {
        return false;
    }
    return in_array($action, MODULE_ACTIONS[$module]);
}

function requirePrivilege($module, $action, $conn) {
    session_start();
    
    // Validate action is allowed for this module
    if (!isValidAction($module, $action)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => "Action '{$action}' is not valid for module '{$module}'"
        ]);
        exit;
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    $accountStatus = $_SESSION['account_status'] ?? null;
    
    // Super admin bypass
    if ($accountStatus === 'super admin') {
        return true;
    }
    
    if (!$userId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }
    
    // Check specific privilege
    $columnName = "can_{$action}";
    $stmt = $conn->prepare("
        SELECT {$columnName} as allowed
        FROM user_privileges
        WHERE user_id = ? AND module = ?
    ");
    $stmt->bind_param("ss", $userId, $module);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    $hasPrivilege = $row && ($row['allowed'] === 1 || $row['allowed'] === true);
    
    if (!$hasPrivilege) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => "Access denied: You don't have '{$action}' permission for '{$module}'"
        ]);
        exit;
    }
    
    return true;
}

function checkPrivilegeSilent($module, $action, $conn) {
    session_start();
    
    if (!isValidAction($module, $action)) {
        return false;
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    $accountStatus = $_SESSION['account_status'] ?? null;
    
    if ($accountStatus === 'super admin') return true;
    if (!$userId) return false;
    
    $columnName = "can_{$action}";
    $stmt = $conn->prepare("
        SELECT {$columnName} as allowed
        FROM user_privileges
        WHERE user_id = ? AND module = ?
    ");
    $stmt->bind_param("ss", $userId, $module);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    return $row && ($row['allowed'] === 1 || $row['allowed'] === true);
}
?>