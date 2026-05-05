<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

ob_start();
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Verify user is logged in
    if (!isset($_SESSION['account_status']) || !isset($_SESSION['username'])) {
        throw new Exception('Authentication required. Please log in.');
    }
    
    // Allow both admin and super admin to access this endpoint
    $allowed_roles = ['super admin', 'admin'];
    $creator_role = $_SESSION['account_status'];
    $creator_username = $_SESSION['username'];
    
    if (!in_array($creator_role, $allowed_roles)) {
        throw new Exception('Unauthorized access. Admin or Super Admin privileges required.');
    }

    // DB connection
    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method.');
    }

    $json_data = json_decode(file_get_contents("php://input"), true);
    $data = $json_data ?: $_POST;

    // Get intended role for the new account
    $intended_role = $data['account_status'] ?? 'user';
    
    // Permission checks based on creator's role
    if ($intended_role === 'super admin') {
        // Only super admin can create another super admin
        if ($creator_role !== 'super admin') {
            throw new Exception('Only Super Admin can create another Super Admin account');
        }
        
        // Check super admin limit (maximum 2)
        $countStmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE account_status = 'super admin'");
        $countStmt->execute();
        $countResult = $countStmt->get_result()->fetch_assoc();
        $countStmt->close();
        
        if ((int)$countResult['count'] >= 2) {
            throw new Exception('Maximum of 2 Super Admin accounts already exist. Cannot create a 3rd Super Admin account.');
        }
    } 
    elseif ($intended_role === 'admin') {
        // Both admin and super admin can create admin accounts
        if (!in_array($creator_role, ['admin', 'super admin'])) {
            throw new Exception('Only Admin or Super Admin can create Admin accounts');
        }
        // No limit check for admin accounts
    }
    elseif ($intended_role === 'user') {
        // Both admin and super admin can create regular user accounts
        if (!in_array($creator_role, ['admin', 'super admin'])) {
            throw new Exception('Only Admin or Super Admin can create user accounts');
        }
    }
    else {
        throw new Exception('Invalid account status. Must be user, admin, or super admin');
    }

    // Generate ID or use provided ID
    $userId = !empty($data['ID']) ? trim($data['ID']) : uniqid('STAFF_', true);

    // Validate User ID format (####-####)
    if (!preg_match('/^\d{4}-\d{4}$/', $userId)) {
        throw new Exception('User ID must be in the format ####-#### (e.g., 2025-1234)');
    }

    // Required fields
    $required = ['username', 'password', 're_password', 'email', 'first_name', 'last_name', 'birthdate', 'sex'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing field: $field");
        }
    }

    // Security questions validation for regular users
    $is_admin_role = in_array($intended_role, ['admin', 'super admin']);
    
    if (!$is_admin_role) {
        // Security questions are optional - only validate if they are present
        $hasSecQuestions = !empty($data['sec_question_1']) && !empty($data['sec_answer_1']);
        
        if ($hasSecQuestions) {
            // If any security question is provided, check if at least question 1 is complete
            // But allow partial completion - only validate what's provided
            $sec_q1_provided = !empty($data['sec_question_1']) && !empty($data['sec_answer_1']);
            $sec_q2_provided = !empty($data['sec_question_2']) && !empty($data['sec_answer_2']);
            $sec_q3_provided = !empty($data['sec_question_3']) && !empty($data['sec_answer_3']);
            
            // If question 2 is provided but question 2 answer is missing
            if (!empty($data['sec_question_2']) && empty($data['sec_answer_2'])) {
                throw new Exception("Security answer for question 2 is required if question 2 is provided");
            }
            
            // If question 3 is provided but question 3 answer is missing
            if (!empty($data['sec_question_3']) && empty($data['sec_answer_3'])) {
                throw new Exception("Security answer for question 3 is required if question 3 is provided");
            }
        }
    }

    // Password check
    if ($data['password'] !== $data['re_password']) {
        throw new Exception('Passwords do not match.');
    }

    $min_pass_length = $is_admin_role ? 12 : 8;
    if (strlen($data['password']) < $min_pass_length) {
        throw new Exception("Password must be at least $min_pass_length characters.");
    }

    // Email validation
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address.');
    }

    // Start transaction for data integrity
    $conn->begin_transaction();

    // Duplicate checks with specific error messages
    // Check User ID
    $checkId = $conn->prepare("SELECT user_ID FROM users WHERE user_ID = ?");
    $checkId->bind_param("s", $userId);
    $checkId->execute();
    $checkId->store_result();
    if ($checkId->num_rows > 0) {
        $checkId->close();
        throw new Exception('User ID already exists. Please use a different ID.');
    }
    $checkId->close();

    // Check Username
    $checkUser = $conn->prepare("SELECT user_ID FROM users WHERE username = ?");
    $checkUser->bind_param("s", $data['username']);
    $checkUser->execute();
    $checkUser->store_result();
    if ($checkUser->num_rows > 0) {
        $checkUser->close();
        throw new Exception('Username already exists. Please choose a different username.');
    }
    $checkUser->close();

    // Check Email
    $checkEmail = $conn->prepare("SELECT user_ID FROM users WHERE email = ?");
    $checkEmail->bind_param("s", $data['email']);
    $checkEmail->execute();
    $checkEmail->store_result();
    if ($checkEmail->num_rows > 0) {
        $checkEmail->close();
        throw new Exception('Email already exists. Please use a different email address.');
    }
    $checkEmail->close();

    // Hash password
    $hash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Hash security answers only if provided, otherwise use empty string
    $answer_1 = !empty($data['sec_answer_1']) ? password_hash($data['sec_answer_1'], PASSWORD_DEFAULT) : '';
    $answer_2 = !empty($data['sec_answer_2']) ? password_hash($data['sec_answer_2'], PASSWORD_DEFAULT) : '';
    $answer_3 = !empty($data['sec_answer_3']) ? password_hash($data['sec_answer_3'], PASSWORD_DEFAULT) : '';

    // Security question values — empty string if not provided
    $sec_q1 = $data['sec_question_1'] ?? '';
    $sec_q2 = $data['sec_question_2'] ?? '';
    $sec_q3 = $data['sec_question_3'] ?? '';

    // Optional fields
    $middle_initial    = $data['middle_initial']    ?? $data['M_I'] ?? '';
    $extension         = $data['extension']         ?? $data['Ename'] ?? '';
    $purok             = $data['purok']             ?? $data['Purok'] ?? '';
    $barangay          = $data['barangay']          ?? $data['Barangay'] ?? '';
    $city_municipality = $data['city_municipality'] ?? $data['City'] ?? '';
    $province          = $data['province']          ?? $data['Province'] ?? '';
    $country           = $data['country']           ?? 'Philippines';
    $zip_code          = $data['zip_code']          ?? $data['Zip-code'] ?? '';

    $account_status  = $intended_role;  // Use the intended role, not user input
    $approval_status = 'approved';  // Always approved when created by admin/super admin
    $approved_by     = $creator_username;

    $stmt = $conn->prepare("
    INSERT INTO users ( 
        user_ID, username, password, email,
        Fname, M_I, Lname, Extension,
        birthdate, sex, purok, barangay,
        City_Municipality, province, country, zip_code,
        sec_question_1, sec_answer_1,
        sec_question_2, sec_answer_2,
        sec_question_3, sec_answer_3,
        account_status, approval_status,
        approved_by, approved_at, is_blocked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, NOW(), 0)
    ");

    if (!$stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }

    $stmt->bind_param(
        "sssssssssssssssssssssssss",
        $userId,
        $data['username'],
        $hash,
        $data['email'],
        $data['first_name'],
        $middle_initial,
        $data['last_name'],
        $extension,
        $data['birthdate'],
        $data['sex'],
        $purok,
        $barangay,
        $city_municipality,
        $province,
        $country,
        $zip_code,
        $sec_q1,
        $answer_1,
        $sec_q2,
        $answer_2,
        $sec_q3,
        $answer_3,
        $account_status,
        $approval_status,
        $approved_by
    );

    if (!$stmt->execute()) {
        // Check for duplicate entry errors (fallback)
        if ($conn->errno == 1062) {
            if (strpos($conn->error, 'PRIMARY') !== false) {
                throw new Exception('User ID already exists. Please use a different ID.');
            } elseif (strpos($conn->error, 'username') !== false) {
                throw new Exception('Username already exists. Please choose a different username.');
            } elseif (strpos($conn->error, 'email') !== false) {
                throw new Exception('Email already exists. Please use a different email address.');
            } else {
                throw new Exception('Duplicate entry. Please check your information.');
            }
        }
        throw new Exception('Insert failed: ' . $stmt->error);
    }

    // Insert privileges for admin/super admin
    if ($is_admin_role && !empty($data['privileges']) && is_array($data['privileges'])) {
        $privStmt = $conn->prepare("
            INSERT INTO user_privileges 
            (user_id, module, can_create, can_read, can_update, can_delete, can_block)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        if ($privStmt) {
            foreach ($data['privileges'] as $module => $actions) {
                $can_create = in_array('create', $actions) ? 1 : 0;
                $can_read = in_array('read', $actions) ? 1 : 0;
                $can_update = in_array('update', $actions) ? 1 : 0;
                $can_delete = in_array('delete', $actions) ? 1 : 0;
                $can_block = in_array('block', $actions) ? 1 : 0;
                
                $privStmt->bind_param(
                    "ssiiiii",
                    $userId,
                    $module,
                    $can_create,
                    $can_read,
                    $can_update,
                    $can_delete,
                    $can_block
                );
                
                if (!$privStmt->execute()) {
                    throw new Exception('Failed to insert privileges for module: ' . $module);
                }
            }
            $privStmt->close();
        }
    }

    // Log activity
    if (file_exists('log_activity.php')) {
        require_once 'log_activity.php';
        logActivity($conn, $userId, $data['username'], $account_status,
            'Account Created',
            "New {$account_status} account created by {$creator_username}",
            $creator_username
        );
    }

    // Commit transaction
    $conn->commit();
    
    $stmt->close();
    $conn->close();

    // Success response
    $message = '';
    if ($account_status === 'super admin') {
        $message = 'Super Admin account created successfully. Maximum limit is 2 Super Admin accounts.';
    } elseif ($account_status === 'admin') {
        $message = 'Admin account created successfully.';
    } else {
        $message = 'User account created successfully.';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'user_id' => $userId,
        'role' => $account_status
    ]);

} catch (Exception $e) {
    // Rollback transaction if it was started
    if (isset($conn) && $conn->connect_errno === 0) {
        try {
            $conn->rollback();
        } catch (Exception $rollbackError) {
            // Log rollback error but don't expose to user
            error_log('Rollback failed: ' . $rollbackError->getMessage());
        }
    }
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Clean up
if (isset($conn) && $conn->connect_errno === 0) {
    $conn->close();
}

ob_end_flush();
exit;
?>