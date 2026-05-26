# FashionFlow - Technical Administrator Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Process](#installation-process)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Email Setup](#email-setup)
6. [Backup & Recovery](#backup--recovery)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Performance Optimization](#performance-optimization)
10. [Security Hardening](#security-hardening)

---

## System Requirements

### Minimum Specifications
- **OS**: Windows/Linux/macOS
- **Web Server**: Apache 2.4+
- **PHP**: 7.4 or higher
- **Database**: MySQL 5.7+ or MariaDB 10.3+
- **RAM**: 2GB (4GB recommended)
- **Disk**: 1GB free space minimum
- **Internet**: For email functionality

### Required PHP Extensions
```
- mysqli or PDO (database)
- curl (HTTP requests)
- openssl (encryption)
- mbstring (string handling)
- json (data parsing)
```

### Recommended Software
```
- Composer (dependency management)
- PHPMyAdmin (database administration)
- Git (version control)
- Postman (API testing)
```

---

## Installation Process

### Step 1: Environment Preparation

#### A. Install XAMPP (Windows)
1. Download from `https://www.apachefriends.org/`
2. Run installer
3. Select Apache and MySQL
4. Choose installation directory
5. Complete installation
6. Start Apache and MySQL from Control Panel

#### B. Verify PHP Installation
```bash
php --version
```
Should output PHP 7.4 or higher.

#### C. Create Project Directory
```bash
cd c:\xampp\htdocs
mkdir CamasuraKenneth
cd CamasuraKenneth
```

### Step 2: Extract Project Files

1. Copy all project files to `c:\xampp\htdocs\CamasuraKenneth\`
2. Verify folder structure:
   ```
   CamasuraKenneth/
   ├── html/
   ├── php/
   ├── css/
   ├── js/
   ├── image/
   ├── uploads/
   ├── vendor/
   ├── composer.json
   └── README.md
   ```

### Step 3: Install Dependencies

```bash
cd c:\xampp\htdocs\CamasuraKenneth
composer install
```

**Expected output**:
```
Loading composer repositories with package information
Installing dependencies from lock file
  - Installing phpmailer/phpmailer (v6.x.x)
Generating autoload files
```

**If Composer not installed**:
```bash
# Download from https://getcomposer.org/
# Or install via command:
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php composer.phar install
```

---

## Database Setup

### Step 1: Create Database

#### Via phpMyAdmin
1. Open `http://localhost/phpmyadmin`
2. Click "New"
3. Enter database name: `fashionflow`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

#### Via Command Line (MySQL)
```bash
mysql -u root -p
# (Press Enter if no password)
# Then execute:
CREATE DATABASE fashionflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;  # Verify creation
EXIT;
```

### Step 2: Create Database Tables

Execute the following SQL to create all required tables:

```sql
USE fashionflow;

-- Users table
CREATE TABLE users (
  user_ID INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('Customer', 'Admin', 'Super Admin') DEFAULT 'Customer',
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  account_status ENUM('active', 'inactive') DEFAULT 'active',
  is_blocked BOOLEAN DEFAULT 0,
  blocked_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (username),
  INDEX (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX (category_id),
  INDEX (sku),
  INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Images table
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  status ENUM('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled') DEFAULT 'Pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_ID) ON DELETE CASCADE,
  INDEX (user_id),
  INDEX (status),
  INDEX (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX (order_id),
  INDEX (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Log table
CREATE TABLE activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  username VARCHAR(50),
  role VARCHAR(20),
  activity_type VARCHAR(50),
  description TEXT,
  performed_by VARCHAR(50),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (username),
  INDEX (activity_type),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Logs table
CREATE TABLE security_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  login_timestamp TIMESTAMP,
  logout_timestamp TIMESTAMP NULL,
  login_status ENUM('success', 'failure') DEFAULT 'success',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (username),
  INDEX (login_status),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Questions table
CREATE TABLE security_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question VARCHAR(255) NOT NULL,
  answer_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_ID) ON DELETE CASCADE,
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP table
CREATE TABLE otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  email VARCHAR(100),
  otp_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT 0,
  INDEX (email),
  INDEX (user_id),
  INDEX (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blocked Sessions table
CREATE TABLE blocked_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reason VARCHAR(255),
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unblocked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_ID),
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX idx_products_created ON products(created_at);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_users_created ON users(created_at);
```

### Step 3: Verify Database Creation

```bash
mysql -u root -p
USE fashionflow;
SHOW TABLES;
```

Should display all 12 tables.

---

## Configuration

### Database Connection

**File**: All PHP files that connect to database  
**Default Location**: Usually configured in each PHP file

**Standard Configuration** (if using config file):
```php
<?php
// Database Configuration
$host = 'localhost';
$user = 'root';
$password = '';  // Empty for XAMPP default
$database = 'fashionflow';

try {
    $conn = new mysqli($host, $user, $password, $database);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    die("Database Error: " . $e->getMessage());
}
?>
```

### Session Configuration

**File**: PHP files with `session_start()`

**Recommended Settings**:
```php
// Secure session configuration
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);

session_name('FASHIONFLOW_SESSION');
session_cookie_httponly(true);  // Prevents JavaScript access
session_cookie_samesite('Lax');
session_cookie_secure(false);   // Set to true in HTTPS production
session_cookie_lifetime(1800);  // 30 minutes

session_start();
```

### Upload Directory Permissions

**Path**: `/uploads/`

**Permissions Required**:
```bash
# Linux/macOS
chmod 755 uploads/

# Windows: Right-click → Properties → Security → Edit
# Grant "Modify" permission to IIS_IUSRS or equivalent
```

---

## Email Setup

### Using Gmail SMTP

**File**: `php/send-otp.php`

#### Step 1: Enable 2FA on Gmail Account
1. Go to `https://myaccount.google.com/`
2. Security settings
3. Enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to Security Settings
2. Find "App passwords"
3. Select "Mail" and "Windows Computer"
4. Generate password (16-character)
5. Copy and save securely

#### Step 3: Update Configuration
```php
$mail->Host = 'smtp.gmail.com';
$mail->Port = 587;
$mail->SMTPSecure = 'tls';
$mail->SMTPAuth = true;
$mail->Username = 'your-email@gmail.com';
$mail->Password = 'your-16-char-app-password';
$mail->setFrom('your-email@gmail.com', 'FashionFlow');
$mail->addReplyTo('support@fashionflow.com');
```

### Using Other SMTP Providers

#### Office 365
```php
$mail->Host = 'smtp.office365.com';
$mail->Port = 587;
$mail->SMTPSecure = 'tls';
$mail->Username = 'your-email@outlook.com';
$mail->Password = 'your-password';
```

#### Custom SMTP Server
```php
$mail->Host = 'mail.yourdomain.com';
$mail->Port = 587;  // or 25, 465
$mail->SMTPSecure = 'tls';  // or 'ssl'
$mail->SMTPAuth = true;
$mail->Username = 'admin@yourdomain.com';
$mail->Password = 'your-password';
```

### Test Email Configuration

```php
<?php
require 'vendor/autoload.php';

$mail = new PHPMailer\PHPMailer\PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'test@gmail.com';
    $mail->Password = 'app-password';
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    $mail->setFrom('test@gmail.com');
    $mail->addAddress('recipient@example.com');
    $mail->Subject = 'Test Email';
    $mail->Body = 'Email configuration successful!';
    
    $mail->send();
    echo 'Email sent successfully';
} catch (Exception $e) {
    echo "Email error: {$mail->ErrorInfo}";
}
?>
```

---

## Backup & Recovery

### Automated Daily Backups

#### Script: `backup.php` (Create new file)
```php
<?php
// Backup script - run daily via cron job

$database = 'fashionflow';
$backup_dir = __DIR__ . '/backups/';

// Create backup directory
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

$timestamp = date('Y-m-d_H-i-s');
$backup_file = $backup_dir . 'backup_' . $timestamp . '.sql';

$cmd = "mysqldump -u root -p '' {$database} > {$backup_file}";
exec($cmd, $output, $status);

if ($status === 0) {
    echo "Backup successful: {$backup_file}\n";
    
    // Keep only last 30 backups
    $files = glob($backup_dir . 'backup_*.sql');
    if (count($files) > 30) {
        usort($files, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        unlink($files[0]); // Delete oldest
    }
} else {
    echo "Backup failed\n";
}
?>
```

#### Schedule with Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Name: "FashionFlow Daily Backup"
4. Trigger: Daily at 2 AM
5. Action: Run `php c:\xampp\htdocs\CamasuraKenneth\backup.php`

### Manual Backup

#### Via phpMyAdmin
1. Open `http://localhost/phpmyadmin`
2. Select `fashionflow` database
3. Click "Export"
4. Format: SQL
5. Click "Go"
6. Save file as `backup_YYYYMMDD.sql`

#### Via MySQL Command
```bash
mysqldump -u root -p fashionflow > backup_20240526.sql
```

### Database Recovery

#### From SQL File
```bash
mysql -u root -p fashionflow < backup_20240526.sql
```

#### Via phpMyAdmin
1. Open phpMyAdmin
2. Select `fashionflow` database
3. Click "Import"
4. Choose SQL file
5. Click "Go"

---

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Check error logs
- [ ] Verify backup completion
- [ ] Review security logs for anomalies
- [ ] Check disk space usage

#### Monthly
- [ ] Review user accounts for inactive
- [ ] Archive old logs
- [ ] Update dependencies: `composer update`
- [ ] Test password recovery system
- [ ] Verify email functionality

#### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] Review and update documentation

### Database Optimization

```sql
-- Optimize all tables (run monthly)
OPTIMIZE TABLE users;
OPTIMIZE TABLE products;
OPTIMIZE TABLE orders;
OPTIMIZE TABLE activity_log;
OPTIMIZE TABLE security_logs;

-- Remove old temporary OTP records (older than 24 hours)
DELETE FROM otp WHERE expires_at < NOW() AND is_used = 1;

-- Archive old logs (older than 90 days)
INSERT INTO activity_log_archive
SELECT * FROM activity_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

DELETE FROM activity_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Check Database Size

```sql
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size in MB'
FROM information_schema.TABLES
WHERE table_schema = 'fashionflow';
```

---

## Troubleshooting

### Connection Issues

#### PHP Cannot Connect to Database
```bash
# Check MySQL is running
# Windows: XAMPP Control Panel → MySQL should be green

# Test from command line
mysql -u root -p
# If successful, database is accessible
```

#### Solution
1. Start MySQL in XAMPP
2. Verify credentials in PHP file
3. Check database exists: `SHOW DATABASES;`
4. Check user permissions

### Email Not Sending

#### Check Email Logs
```bash
# On Windows, check XAMPP PHP error log
# Usually: C:\xampp\php\logs\php_error.log
```

#### Solution
1. Verify SMTP credentials
2. Check firewall blocking port 587
3. Verify "Less secure apps" enabled (Gmail)
4. Test with basic script (see Email Setup section)
5. Check email quota not exceeded

### Slow Performance

#### Identify Slow Queries
```sql
-- Check for missing indexes
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
-- Should show "Using index" or "key is not null"

-- Create missing indexes if needed
CREATE INDEX idx_user_email ON users(email);
```

#### Solutions
1. Run database optimization
2. Add missing indexes
3. Archive old log data
4. Increase PHP memory limit:
   ```
   memory_limit = 256M
   ```

### 404 Page Not Found

#### Check File Paths
```
Expected: C:\xampp\htdocs\CamasuraKenneth\html\sign-in.html
Access: http://localhost/CamasuraKenneth/html/sign-in.html
```

#### Solution
1. Verify files exist in correct location
2. Check Apache document root: `C:\xampp\htdocs`
3. Restart Apache
4. Clear browser cache

---

## Performance Optimization

### PHP Configuration

**File**: `php.ini`

**Recommended Settings**:
```ini
; Memory
memory_limit = 256M

; Execution
max_execution_time = 30
max_input_time = 60

; Session
session.gc_maxlifetime = 1800

; Error reporting (production)
display_errors = Off
log_errors = On
error_log = /path/to/logs/php_error.log

; Output buffering
output_buffering = 4096
```

### MySQL Optimization

```sql
-- Check table fragmentation
SHOW TABLE STATUS FROM fashionflow;

-- Repair fragmented tables
REPAIR TABLE users;
REPAIR TABLE products;
REPAIR TABLE orders;
```

### Caching Strategy

**Query Caching** (if available):
```php
// Cache product data for 1 hour
$cache_key = 'products_list';
$products = apcu_fetch($cache_key);

if ($products === false) {
    $products = $db->query("SELECT * FROM products WHERE status = 'active'");
    apcu_store($cache_key, $products, 3600);
}
```

---

## Security Hardening

### Critical Security Updates

#### 1. Move Credentials Out of Code

**Create `.env` file**:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=fashionflow

MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

**Load with Composer package**:
```bash
composer require vlucas/phpdotenv
```

**Use in code**:
```php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$db_host = $_ENV['DB_HOST'];
$db_user = $_ENV['DB_USER'];
```

#### 2. Enable HTTPS

**Self-signed certificate for testing**:
```bash
# OpenSSL command (or use XAMPP SSL setup)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /path/to/key.pem -out /path/to/cert.pem
```

**Update cookie settings**:
```php
session_cookie_secure(true);  // Only send over HTTPS
```

#### 3. Add CSRF Protection

**Generate token**:
```php
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
```

**Verify token**:
```php
if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    die('CSRF token validation failed');
}
```

#### 4. Implement Rate Limiting

```php
// Login rate limiting
$ip = $_SERVER['REMOTE_ADDR'];
$key = "login_attempts_{$ip}";
$attempts = apcu_fetch($key, $success) ?: 0;

if ($attempts >= 5) {
    die('Too many login attempts. Try again in 15 minutes.');
}

apcu_store($key, $attempts + 1, 900); // 15 minutes
```

#### 5. Input Validation

```php
// Validate all inputs
$email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    die('Invalid email format');
}

$username = preg_match('/^[a-zA-Z0-9_]{3,20}$/', $_POST['username']) 
    ? $_POST['username'] 
    : null;
if (!$username) {
    die('Invalid username format');
}
```

### Security Checklist

- [ ] Move credentials to `.env` file
- [ ] Enable HTTPS
- [ ] Add CSRF tokens to all forms
- [ ] Implement rate limiting on login
- [ ] Validate all user inputs
- [ ] Use prepared statements (already implemented)
- [ ] Enable security headers
- [ ] Regular security audits
- [ ] Keep PHP and dependencies updated
- [ ] Monitor access logs

### Security Headers

**Add to PHP header**:
```php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Content-Security-Policy: default-src self');
```

---

## Monitoring & Logging

### Access Logs

**Enable in Apache** (httpd.conf):
```apache
LogFormat "%h %l %u %t \"%r\" %>s %b" common
CustomLog logs/access.log common
```

### Error Logs

**PHP Errors**:
```php
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/php_errors.log');
```

### Activity Monitoring

**Check activity logs daily**:
```sql
SELECT 
  DATE(created_at) as date,
  activity_type,
  COUNT(*) as count
FROM activity_log
GROUP BY DATE(created_at), activity_type
ORDER BY created_at DESC
LIMIT 50;
```

---

## Disaster Recovery Plan

### If Database Corruption Detected

1. **Stop application**: Disable website access
2. **Restore backup**: `mysql -u root -p fashionflow < backup.sql`
3. **Verify restoration**: Check key tables
4. **Resume service**: Bring website back online
5. **Investigate cause**: Check error logs

### If Hacked

1. **Isolate system**: Disconnect from network
2. **Change all passwords**: Database, SMTP, admin accounts
3. **Review logs**: Check security_logs for unauthorized access
4. **Update code**: Patch vulnerabilities
5. **Restore clean backup**: If suspicious code found
6. **Notify users**: Send security alert emails

### Recovery Time Objectives (RTO)

- Database recovery: < 30 minutes
- Full system recovery: < 2 hours
- User notification: < 1 hour

---

## Support & Resources

### Documentation
- Full User Guide: `USER_GUIDE.md`
- Quick Reference: `QUICK_REFERENCE.md`
- README: `README.md`

### External Resources
- PHP Documentation: `https://php.net`
- MySQL Documentation: `https://dev.mysql.com/doc/`
- PHPMailer Docs: `https://github.com/PHPMailer/PHPMailer`
- Apache Docs: `https://httpd.apache.org/docs/`

### Getting Help
- Check error logs first
- Review documentation
- Test with isolated cases
- Contact development team

---

**Last Updated**: May 26, 2026  
**Version**: 1.0  
**Maintained By**: Development Team
