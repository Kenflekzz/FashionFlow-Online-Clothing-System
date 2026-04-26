<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

ob_start();
session_start();
header('Content-Type: application/json');

try {
    if (($_SESSION['account_status'] ?? '') !== 'super admin') {
        throw new Exception('Unauthorized access.');
    }

    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if ($conn->connect_error) {
        throw new Exception('Database connection failed.');
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method.');
    }

    $userId = $_POST['ID'] ?? uniqid('USR_', true);

    // Validate required fields
    $required = ['username','password','re_password','email','first_name','last_name','birthdate','sex'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    if ($_POST['password'] !== $_POST['re_password']) {
        throw new Exception('Passwords do not match.');
    }

    if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email.');
    }

    // Check duplicates
    $dup = $conn->prepare("SELECT user_ID FROM users WHERE username = ? OR email = ?");
    $dup->bind_param("ss", $_POST['username'], $_POST['email']);
    $dup->execute();
    if ($dup->get_result()->num_rows > 0) {
        throw new Exception('Username or email already exists.');
    }
    $dup->close();

    // Prepare variables
    $hash = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $M_I = $_POST['middle_initial'] ?? '';
    $extension = $_POST['extension'] ?? '';
    $purok = $_POST['purok'] ?? '';
    $barangay = $_POST['barangay'] ?? '';
    $city_municipality = $_POST['city_municipality'] ?? '';
    $province = $_POST['province'] ?? '';
    $country = $_POST['country'] ?? 'Philippines';
    $zip_code = $_POST['zip_code'] ?? '';
    $account_status = $_POST['account_status'] ?? 'user';
    $approved_by = $_SESSION['username'] ?? 'system';

    // ✅ Handle Security Questions for User accounts (stored in users table)
    $sec_question_1 = null;
    $sec_answer_1 = null;
    $sec_question_2 = null;
    $sec_answer_2 = null;
    $sec_question_3 = null;
    $sec_answer_3 = null;

    if ($account_status === 'user') {
        // Validate security questions
        if (empty($_POST['sec_question_1']) || empty($_POST['sec_answer_1']) ||
            empty($_POST['sec_question_2']) || empty($_POST['sec_answer_2']) ||
            empty($_POST['sec_question_3']) || empty($_POST['sec_answer_3'])) {
            throw new Exception('All security questions and answers are required for user accounts.');
        }

        $sec_question_1 = $_POST['sec_question_1'];
        $sec_question_2 = $_POST['sec_question_2'];
        $sec_question_3 = $_POST['sec_question_3'];
        
        // Hash answers for security (case-insensitive)
        $sec_answer_1 = password_hash(strtolower(trim($_POST['sec_answer_1'])), PASSWORD_DEFAULT);
        $sec_answer_2 = password_hash(strtolower(trim($_POST['sec_answer_2'])), PASSWORD_DEFAULT);
        $sec_answer_3 = password_hash(strtolower(trim($_POST['sec_answer_3'])), PASSWORD_DEFAULT);
    }

    // Insert user with security questions (if applicable)
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
            approved_by, approved_at,
            is_blocked, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW(), 0, 'Active')
    ");

    $stmt->bind_param(
        "ssssssssssssssssssssssss",
        $userId,
        $_POST['username'],
        $hash,
        $_POST['email'],
        $_POST['first_name'],
        $M_I,
        $_POST['last_name'],
        $extension,
        $_POST['birthdate'],
        $_POST['sex'],
        $purok,
        $barangay,
        $city_municipality,
        $province,
        $country,
        $zip_code,
        $sec_question_1,
        $sec_answer_1,
        $sec_question_2,
        $sec_answer_2,
        $sec_question_3,
        $sec_answer_3,
        $account_status,
        $approved_by
    );

    if (!$stmt->execute()) {
        throw new Exception('User creation failed: ' . $stmt->error);
    }
    $stmt->close();

    // ✅ Handle privileges for Admin and Super Admin only (NOT for User)
    // Note: Using separate user_privileges table for admin privileges
    if ($account_status !== 'user') {
        $modules = ['security_logs','users','products','orders','reports'];
        $privileges = $_POST['privileges'] ?? [];

        error_log("Creating $account_status $userId with privileges: " . print_r($privileges, true));

        $priv = $conn->prepare("
            INSERT INTO user_privileges
            (user_id, module, can_create, can_read, can_update, can_delete, can_block)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($modules as $module) {
            $moduleActions = $privileges[$module] ?? [];
            
            // For super admin: grant all permissions
            // For admin: use submitted privileges or default to read-only
            if ($account_status === 'super admin') {
                $moduleActions = ['create', 'read', 'update', 'delete', 'block'];
            } elseif (empty($moduleActions)) {
                $moduleActions = ['read']; // Default for regular admin
            }

            $can_create = in_array('create', $moduleActions) ? 1 : 0;
            $can_read   = in_array('read', $moduleActions) ? 1 : 0;
            $can_update = in_array('update', $moduleActions) ? 1 : 0;
            $can_delete = in_array('delete', $moduleActions) ? 1 : 0;
            $can_block  = in_array('block', $moduleActions) ? 1 : 0;

            $priv->bind_param(
                "ssiiiii",
                $userId,
                $module,
                $can_create,
                $can_read,
                $can_update,
                $can_delete,
                $can_block
            );

            if (!$priv->execute()) {
                error_log("Failed to insert privilege for $module: " . $priv->error);
            }
        }
        $priv->close();
    }

    // ✅ Dynamic success message based on role
    $roleLabel = $account_status === 'super admin' ? 'Super Admin' : 
                 ($account_status === 'admin' ? 'Admin' : 'User');

    echo json_encode([
        'success' => true,
        'message' => "$roleLabel account created successfully.",
        'user_id' => $userId,
        'role' => $account_status
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

exit;
?>