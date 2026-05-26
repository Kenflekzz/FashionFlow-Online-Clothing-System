# FashionFlow - Complete User Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Installation & Setup](#installation--setup)
3. [User Roles & Access Levels](#user-roles--access-levels)
4. [Getting Started](#getting-started)
5. [Customer User Guide](#customer-user-guide)
6. [Admin User Guide](#admin-user-guide)
7. [Super Admin User Guide](#super-admin-user-guide)
8. [Account Recovery & Security](#account-recovery--security)
9. [Troubleshooting](#troubleshooting)
10. [Security & Best Practices](#security--best-practices)

---

## Project Overview

**FashionFlow** is a complete e-commerce platform for managing online clothing sales with multi-role user management, product catalog, order processing, and comprehensive security features.

### Key Features
- 🛒 **E-Commerce**: Product browsing, inventory management, order placement
- 👥 **Multi-Role System**: Customer, Admin, and Super Admin roles
- 🔐 **Advanced Security**: OTP verification, security questions, activity logging
- 📊 **Admin Dashboard**: Product, order, and user management
- 📧 **Email Notifications**: OTP and password reset via email
- 📝 **Audit Trail**: Complete activity and security logging

### Technology Stack
- **Backend**: PHP 7.4+
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Email**: PHPMailer (SMTP via Gmail)
- **Dependency Manager**: Composer

---

## Installation & Setup

### Prerequisites
- XAMPP or similar PHP/MySQL server
- PHP 7.4 or higher
- MySQL Server
- Composer (for dependency management)
- Email account with SMTP support (optional, for email features)

### Step-by-Step Installation

#### 1. **Place Files in Correct Location**
```
Project Path: c:\xampp\htdocs\CamasuraKenneth
```

#### 2. **Install Dependencies**
Open terminal/command prompt and navigate to project directory:
```bash
cd c:\xampp\htdocs\CamasuraKenneth
composer install
```
This installs PHPMailer for email functionality.

#### 3. **Create Database**
Open phpMyAdmin (usually at `http://localhost/phpmyadmin`):
- Click "New"
- Create database named: `fashionflow`
- Character set: `utf8mb4_unicode_ci`

#### 4. **Import Database Schema**
You'll need to create the required tables. Contact the database administrator or use the provided SQL schema file.

**Required Tables:**
- `users` - User accounts and authentication
- `products` - Product catalog
- `categories` - Product categories
- `product_images` - Product images
- `orders` - Customer orders
- `order_items` - Order line items
- `activity_log` - User activity tracking
- `security_logs` - Login/logout tracking
- `blocked_sessions` - Forced logout records
- `security_questions` - Security Q&A data

#### 5. **Configure Email (Optional)**
For password reset and OTP features to work:
- File: `php/send-otp.php`
- Current setup: Gmail SMTP
- Update credentials:
  ```php
  $mail->Username = 'your-email@gmail.com';
  $mail->Password = 'your-app-password';
  ```
- **Note**: Use App Passwords for Gmail, not your regular password

#### 6. **Start Server**
- Open XAMPP Control Panel
- Start Apache and MySQL
- Access application: `http://localhost/CamasuraKenneth/`

### Verification Checklist
- [ ] Files in `c:\xampp\htdocs\CamasuraKenneth`
- [ ] `composer install` completed successfully
- [ ] Database `fashionflow` created
- [ ] Database tables imported
- [ ] Apache and MySQL running
- [ ] Can access `http://localhost/CamasuraKenneth/html/Home.html`

---

## User Roles & Access Levels

### 1. **Customer (End User)**
**Purpose**: Browse products, place orders, manage account

**Capabilities**:
- ✅ Register new account
- ✅ Browse product catalog
- ✅ Place and track orders
- ✅ View order history
- ✅ Manage personal profile
- ✅ Update security questions
- ✅ Reset password via OTP

**Cannot**:
- ❌ Create/manage products
- ❌ Manage users
- ❌ View other customers' orders
- ❌ Access admin functions

### 2. **Admin**
**Purpose**: Manage products, orders, and customer support

**Capabilities**:
- ✅ Full product management (Create, Read, Update, Delete)
- ✅ Order management and status updates
- ✅ View customer information
- ✅ Block/unblock user accounts
- ✅ View activity logs
- ✅ Update user details

**Cannot**:
- ❌ Create/manage admin accounts
- ❌ Approve new user registrations
- ❌ Access security logs
- ❌ Reset system settings
- ❌ Delete users

### 3. **Super Admin**
**Purpose**: System administration and user approval

**Capabilities**:
- ✅ All Admin capabilities
- ✅ Approve/reject new user registrations
- ✅ Create and manage admin accounts
- ✅ View all users and manage accounts
- ✅ Access security logs
- ✅ System reports and analytics
- ✅ Full database access

**Cannot**:
- ❌ Modify core system settings (database structure)
- ❌ Change application code

---

## Getting Started

### First-Time Setup for System Administrator

#### **Step 1: Create Super Admin Account**
```
Method: Direct database insert (no UI for initial creation)
SQL Command (execute in phpMyAdmin):
INSERT INTO users (username, email, password, role, approval_status, account_status, is_blocked)
VALUES ('admin', 'admin@example.com', SHA2('AdminPassword123!', 256), 'Super Admin', 'approved', 'active', 0);
```

#### **Step 2: Access Super Admin Dashboard**
1. Go to: `http://localhost/CamasuraKenneth/html/sign-in.html`
2. Login with credentials created above
3. You'll be redirected to Super Admin Dashboard

#### **Step 3: Create Regular Admins**
1. In Super Admin Dashboard → "Manage Admins"
2. Click "Create New Admin"
3. Fill in:
   - Username
   - Email
   - Password (auto-generated)
4. Click "Create"
5. Admin account ready to use

#### **Step 4: Test Customer Registration**
1. Go to: `http://localhost/CamasuraKenneth/html/sign-up.html`
2. Fill registration form:
   - Personal information
   - Choose 3 security questions
   - Accept terms
3. Click "Register"
4. You'll see "Account Pending Approval" message
5. Return to Super Admin Dashboard
6. Go to "Pending Approvals"
7. Review and approve the registration

---

## Customer User Guide

### Registration Process

**Step 1: Access Registration Page**
- URL: `http://localhost/CamasuraKenneth/html/sign-up.html`

**Step 2: Fill Personal Information**
- Full Name (First & Last name)
- Email Address
- Username (must be unique)
- Password (must meet requirements)
- Confirm Password

**Step 3: Set Security Questions**
- Select 3 security questions from dropdown
- Provide answers (these are hashed for security)
- Example questions:
  - "What is your mother's maiden name?"
  - "What is the name of your first pet?"
  - "In what city were you born?"

**Step 4: Accept Terms**
- Read and check "I agree to the Terms and Conditions"

**Step 5: Submit**
- Click "Register"
- You'll see: "Your account is pending approval. Please wait for admin review."

**Step 6: Wait for Approval**
- Super Admin must approve your account
- You'll receive an email notification when approved
- Once approved, you can log in

### Login

**Step 1: Go to Login Page**
- URL: `http://localhost/CamasuraKenneth/html/sign-in.html`

**Step 2: Enter Credentials**
- Username or Email
- Password

**Step 3: Submit**
- Click "Sign In"
- If approved, you'll access Customer Dashboard
- If not approved, you'll see: "Your account is still pending approval"

### Customer Dashboard

**Features Available:**

#### **1. View Profile**
- Click "My Profile"
- See your personal information
- Button: "Edit Profile" to update details

#### **2. Browse Products**
- Main product listing with:
  - Product images
  - Name and description
  - Price
  - Stock availability
  - Category filter

#### **3. Place Orders**
- Click "Add to Cart" on products
- View cart (cart icon)
- Review items and total
- Click "Checkout"
- Confirm order
- Order created with "Pending" status

#### **4. View Order History**
- Go to "My Orders"
- See all your orders with:
  - Order number
  - Order date
  - Status (Pending, Processing, Shipped, Completed, Cancelled)
  - Total amount
  - Order items

#### **5. Update Security Questions**
- Go to "Account Settings"
- Click "Update Security Questions"
- Re-select 3 questions
- Provide new answers
- Save changes

#### **6. Change Password**
- Go to "Account Settings"
- Click "Change Password"
- Enter current password
- Enter new password
- Confirm new password
- Save

#### **7. Logout**
- Click "Logout" button
- Session ends
- Redirected to home page

### Placing an Order - Detailed Steps

1. **Browse Products**
   - View product listing
   - Filter by category if needed
   - Click product to see details

2. **Add to Cart**
   - Click "Add to Cart"
   - Confirm quantity
   - Product added

3. **Review Cart**
   - Click cart icon (top right)
   - See all items
   - Review quantities and prices
   - See total amount

4. **Checkout**
   - Click "Proceed to Checkout"
   - Verify shipping address
   - Choose shipping method
   - Enter payment information (if applicable)

5. **Place Order**
   - Click "Place Order"
   - See confirmation: "Order placed successfully"
   - Order number: #XXXXX
   - Status: Pending (Admin will process)

6. **Order Confirmation Email**
   - Check email for order confirmation
   - Contains order details and tracking info

---

## Admin User Guide

### Admin Dashboard Access

**URL**: `http://localhost/CamasuraKenneth/html/admin_dashboard.html`

**Login Requirements**:
- Must have "Admin" role
- Account must be approved
- Account must not be blocked

### Admin Functions

#### **1. Product Management**

**View Products**
- Click "Products" menu
- See product table with:
  - Product ID
  - Product name
  - SKU
  - Price
  - Stock quantity
  - Category
  - Status
- Search functionality
- Pagination (items per page)

**Add New Product**
- Click "Add Product" button
- Fill form:
  - Product Name
  - SKU (unique identifier)
  - Description
  - Price
  - Stock Quantity
  - Category
  - Upload product image
- Click "Save Product"
- Product added and visible in catalog

**Edit Product**
- Click "Edit" on product row
- Modify any field:
  - Name
  - Price
  - Stock
  - Description
  - Category
  - Image
- Click "Save Changes"
- Updates reflected immediately

**Delete Product**
- Click "Delete" on product row
- Confirm deletion
- Product soft-deleted (removed from catalog)

#### **2. Order Management**

**View All Orders**
- Click "Orders" menu
- See table with:
  - Order ID
  - Order Number
  - Customer name
  - Order date
  - Total amount
  - Status
  - Actions

**Update Order Status**
- Click "Update Status" for order
- Status options:
  - Pending → Processing
  - Processing → Shipped
  - Shipped → Completed
  - Any status → Cancelled
- Select new status
- Click "Update"
- Status changed (customer notified via email)

**View Order Details**
- Click order number
- See:
  - Order items with quantities
  - Unit prices
  - Subtotal
  - Shipping cost
  - Total
  - Delivery address
  - Order timeline

#### **3. Customer Management**

**View All Customers**
- Click "Customers" menu
- See customer table with:
  - User ID
  - Username
  - Email
  - Registration date
  - Account status
  - Approval status
  - Block status

**Block User Account**
- Click "Block" on user row
- Enter reason for blocking (optional):
  - "Suspicious activity"
  - "Payment fraud"
  - "Terms violation"
  - etc.
- Click "Confirm"
- User account blocked:
  - User logged out immediately
  - Cannot log in again
  - Cannot place orders

**Unblock User Account**
- Click "Unblock" on user row
- Confirm unblocking
- User can log in again

**View User Profile**
- Click user row
- See detailed profile:
  - Personal information
  - Email
  - Registration date
  - Account status
  - Order history
  - Activity log

#### **4. Activity Logging**

**View Activity Log**
- Click "Activity Log" menu
- See all user activities:
  - User who performed action
  - Activity type (login, logout, product update, order placed, etc.)
  - Description
  - Timestamp
  - Filter by:
    - Date range
    - Activity type
    - User

**Generate Report**
- Click "Generate Report"
- Select date range
- Choose report type:
  - Daily summary
  - Weekly summary
  - Monthly summary
- Export as PDF/Excel

### Admin Best Practices

1. **Check New Orders Daily**
   - Process pending orders promptly
   - Update customers on progress
   - Prevent order delays

2. **Monitor Product Stock**
   - Review low stock alerts
   - Update quantities regularly
   - Remove out-of-stock items

3. **Review Customer Support**
   - Check for blocked accounts
   - Review reasons for blocks
   - Address customer complaints

4. **Audit Activity Logs**
   - Look for suspicious patterns
   - Track failed login attempts
   - Monitor unauthorized access attempts

---

## Super Admin User Guide

### Super Admin Dashboard Access

**URL**: `http://localhost/CamasuraKenneth/html/super_admin_dashboard.html`

**Login Requirements**:
- Must have "Super Admin" role
- Account must be approved
- Account must not be blocked

### Super Admin Functions

#### **1. User Registration Approval**

**View Pending Registrations**
- Click "Pending Approvals" menu
- See list of users awaiting approval:
  - Username
  - Email
  - Registration date
  - Status: Pending

**Approve New User**
- Click "Approve" button on user
- Confirm action
- User account status changes to "approved"
- Approval email sent to user
- User can now log in

**Reject Registration**
- Click "Reject" button on user
- Enter rejection reason:
  - "Incomplete information"
  - "Verification failed"
  - "Policy violation"
  - Custom reason
- User receives rejection email
- Account deleted from system

**Review User Information**
- Click on user name
- See complete registration details:
  - Personal information
  - Security questions provided
  - Registration IP address
  - Timestamp

#### **2. Admin Account Management**

**View All Admins**
- Click "Manage Admins" menu
- See table with:
  - Admin ID
  - Username
  - Email
  - Role (Admin, Super Admin)
  - Created date
  - Status

**Create New Admin Account**
- Click "Create New Admin" button
- Fill form:
  - Username (must be unique)
  - Email address
  - Password (auto-generated, provide to admin securely)
  - Admin level: Admin or Super Admin
- Click "Create"
- Admin account created
- Welcome email sent with credentials

**Edit Admin Account**
- Click "Edit" on admin row
- Modify:
  - Email
  - Admin level
  - Status
- Click "Save"

**Delete Admin Account**
- Click "Delete" on admin row
- Confirm deletion
- Admin account deactivated
- Admin cannot log in

**Reset Admin Password**
- Click "Reset Password" on admin row
- New temporary password generated
- Email sent to admin with new password
- Admin should change password on first login

#### **3. User Management**

**View All Users**
- Click "Manage Users" menu
- See comprehensive user table:
  - User ID
  - Username
  - Email
  - Role
  - Account status
  - Approval status
  - Block status
  - Created date

**Update User Information**
- Click "Edit" on user row
- Modify:
  - Email
  - Account status (active/inactive)
  - Approval status
  - Block status
- Click "Save"

**Delete User Account**
- Click "Delete" on user row
- Confirm deletion
- All user data soft-deleted:
  - User cannot log in
  - Order history preserved
  - Activity logs preserved

**View User Activity**
- Click on user name
- See:
  - Login/logout history
  - Orders placed
  - Profile changes
  - Timestamps

#### **4. Security Monitoring**

**View Security Logs**
- Click "Security Logs" menu
- See all login/logout activity:
  - Username
  - Login timestamp
  - Logout timestamp
  - Login status (success/failure)
  - IP address (if available)

**Monitor Failed Login Attempts**
- Filter by failed login attempts
- Identify:
  - Brute force attacks
  - Suspicious login patterns
  - Compromised accounts

**View Blocked Sessions**
- Click "Blocked Sessions" menu
- See forced logouts:
  - User who was logged out
  - Reason (account blocked, force logout, etc.)
  - Timestamp

**Generate Security Report**
- Click "Generate Security Report"
- Select date range
- Report includes:
  - Total logins
  - Failed attempts
  - Blocked accounts
  - Suspicious activities
- Export as PDF

#### **5. System Reports**

**View Dashboard Statistics**
- Dashboard main page shows:
  - Total users
  - Total products
  - Total orders
  - Revenue metrics
  - User growth chart
  - Order volume chart

**Generate Custom Report**
- Click "Reports" menu
- Select report type:
  - User registration report
  - Product inventory report
  - Order report
  - Revenue report
  - Activity audit report
- Set date range
- Choose format (PDF, Excel, CSV)
- Click "Generate"

---

## Account Recovery & Security

### Password Reset Process

**Scenario**: You forgot your password

**Step 1: Go to Login Page**
- URL: `http://localhost/CamasuraKenneth/html/sign-in.html`
- Click "Forgot Password?" link

**Step 2: Enter User ID**
- URL redirects to: `html/user_id_verify.html`
- Enter your User ID or Email
- Click "Find Account"

**Step 3: Verify Account Found**
- System shows: "Account found - Kenneth Camasura"
- Click "Send OTP"
- OTP sent to your registered email

**Step 4: Enter OTP**
- URL redirects to: `html/otp-verification.html`
- Check your email for OTP code
- Enter OTP (usually 6 digits)
- Click "Verify OTP"
- If correct, proceed to Step 5
- If incorrect, click "Resend OTP"

**Step 5: Answer Security Questions**
- URL redirects to: `html/security-verify.html`
- Answer 3 security questions you set during registration
- Provide exact answers as you saved them
- Click "Verify"

**Step 6: Set New Password**
- URL redirects to: `html/reset-password.html`
- Enter new password:
  - Must be at least 8 characters
  - Must contain uppercase and lowercase
  - Must contain numbers
  - Must contain special characters
- Confirm password
- Click "Reset Password"
- Password updated successfully
- You can now log in with new password

### OTP (One-Time Password) System

**How It Works:**
1. OTP is 6-digit code sent to your email
2. Valid for 5 minutes
3. Single use only
4. Automatically expires

**Why It's Important:**
- Prevents unauthorized password resets
- Even if someone knows your email, they can't reset password without OTP
- Adds extra security layer

**If You Don't Receive OTP:**
1. Check spam/junk folder
2. Click "Resend OTP" to get new code
3. Wait 30 seconds before requesting new OTP
4. Maximum 3 resend attempts per recovery session

### Security Questions

**What They Are:**
- 3 personal questions you answer during registration
- Answers are hashed and cannot be viewed by admins
- Used to verify your identity during password reset

**Best Practices for Answers:**
- ✅ Use exact same answers every time
- ✅ Use specific, personal answers
- ✅ Avoid public information (from social media)
- ✅ Remember your answers for future use

**If You Forget Answers:**
- Contact Super Admin
- Provide proof of identity
- Super Admin can force password reset

### Account Blocking

**What Happens When Account is Blocked:**
- ❌ You're logged out immediately
- ❌ Cannot log in again
- ❌ Cannot place orders
- ❌ Cannot access customer dashboard

**Reasons for Blocking:**
- Suspicious/fraudulent activity
- Multiple failed login attempts
- Terms and conditions violation
- Payment fraud
- Request from Super Admin

**If Your Account is Blocked:**
1. Contact system administrator
2. Provide explanation
3. Request account review
4. If approved, account will be unblocked
5. You'll receive email notification
6. You can log in again

---

## Troubleshooting

### Common Issues & Solutions

#### **1. "Account Pending Approval" Error**
**Problem**: You registered but can't log in

**Solutions**:
- ✓ Wait for Super Admin to approve your account
- ✓ Check email for approval notification
- ✓ Contact administrator to check status
- ✓ If 24+ hours have passed, ask for approval status

**How long does approval take?**
- Usually within 24-48 hours
- Varies based on administrator availability

---

#### **2. "Incorrect Username or Password" Error**
**Problem**: Cannot log in with your credentials

**Solutions**:
- ✓ Check CAPS LOCK is off
- ✓ Verify username is correct (case-sensitive)
- ✓ Ensure password is correct
- ✓ Try username instead of email (or vice versa)
- ✓ Use "Forgot Password" to reset password

**Prevention**:
- Write down username/password in secure location
- Don't share credentials with others

---

#### **3. "Your Account is Blocked" Error**
**Problem**: You're blocked from logging in

**Solutions**:
- ✓ Contact administrator immediately
- ✓ Explain the situation
- ✓ Provide proof of identity if requested
- ✓ Request account unblocking
- ✓ Wait for administrator response

**If blocked in error**:
- Request immediate unblocking
- Ask for reason of blocking
- Provide explanation
- Administrator will review and unblock

---

#### **4. OTP Not Received**
**Problem**: Didn't receive OTP email

**Solutions**:
- ✓ Check spam/junk folder
- ✓ Click "Resend OTP" (wait 30 seconds first)
- ✓ Verify email address is correct
- ✓ Try a different email client
- ✓ Contact administrator with your email

**Check email settings**:
- Make sure your firewall doesn't block emails
- Add sender email to contacts to prevent filtering

---

#### **5. "OTP Expired" Error**
**Problem**: OTP code no longer works

**Solution**:
- Click "Resend OTP"
- New code valid for 5 minutes
- Enter new code immediately

**Tip**: OTP codes are valid for exactly 5 minutes from issue time

---

#### **6. Email Features Not Working**
**Problem**: OTP and password reset emails not sending

**Causes & Solutions**:
- ✓ SMTP not configured - Ask administrator
- ✓ Email credentials incorrect - Administrator needs to update
- ✓ Gmail blocking access - Use "App Password" instead of account password
- ✓ Firewall blocking SMTP - Check server firewall settings
- ✓ Email rate limit - Wait and retry

**For Administrator**:
- Update credentials in `php/send-otp.php`
- Test SMTP connection
- Check server error logs for details

---

#### **7. Database Connection Error**
**Problem**: "Could not connect to database" message

**Solutions**:
- ✓ Verify MySQL server is running
- ✓ Check database `fashionflow` exists
- ✓ Verify database credentials
- ✓ Restart XAMPP (MySQL and Apache)
- ✓ Check for database connection timeout

**For Administrator**:
- Open phpMyAdmin: `http://localhost/phpmyadmin`
- Verify database exists
- Check phpMyAdmin can connect
- Review database user permissions

---

#### **8. Images Not Displaying**
**Problem**: Product images show broken icon

**Solutions**:
- ✓ Check image was uploaded successfully
- ✓ Verify image format (PNG, JPG, GIF, WebP)
- ✓ Check image file size (not too large)
- ✓ Verify image path is correct in database
- ✓ Clear browser cache (Ctrl+Shift+Delete)
- ✓ Check file permissions (must be readable)

**For Administrator**:
- Verify `uploads/` directory exists
- Check directory permissions (755 or similar)
- Test image upload with small file
- Check server disk space

---

#### **9. Session Timeout**
**Problem**: "Session expired, please log in again"

**Why it happens**:
- Inactive for too long (typically 30 minutes)
- Session cookie deleted
- Server session expired

**Solutions**:
- ✓ Log in again
- ✓ Don't close browser to keep session active
- ✓ Avoid staying inactive for extended periods
- ✓ Use "Remember Me" option if available

---

#### **10. "Access Denied" Error**
**Problem**: Trying to access page you don't have permission for

**Solutions**:
- ✓ Verify your user role
- ✓ Make sure you're logged in
- ✓ Contact administrator for permission escalation
- ✓ Don't try to access admin pages as customer

**Why it happens**:
- Trying to access admin page as customer
- Role doesn't have required permission
- Session expired

---

### Browser Compatibility

**Recommended Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Issues by Browser:**
- **Internet Explorer**: Not supported
- **Old Chrome/Firefox**: May have compatibility issues
- **Mobile Browsers**: Responsive design supported on most devices

**For Best Experience:**
- Use latest browser version
- Enable JavaScript
- Allow cookies
- Disable browser extensions that might interfere

---

### Performance Tips

1. **Faster Loading**:
   - Clear browser cache regularly
   - Use modern browser
   - Check internet connection
   - Close unnecessary tabs

2. **Faster Order Processing**:
   - Admin: Check orders at consistent time
   - Process in batches
   - Update status promptly

3. **Faster Search**:
   - Use specific product names
   - Filter by category
   - Use SKU code for exact match

---

## Security & Best Practices

### For All Users

#### **Password Security**
✅ **DO:**
- Use strong passwords (8+ characters, mixed case, numbers, special characters)
- Change password every 90 days
- Use unique password for this account
- Store password securely
- Use password manager (Bitwarden, 1Password)

❌ **DON'T:**
- Share password with anyone
- Write password on sticky notes
- Use simple passwords (123456, password, etc.)
- Reuse password across multiple sites
- Click password reset links in emails

#### **Account Protection**
✅ **DO:**
- Update security questions carefully
- Keep personal information private
- Log out when done (especially on public computers)
- Review account activity regularly
- Report suspicious activity immediately

❌ **DON'T:**
- Share security question answers
- Use public WiFi for account access
- Leave browser open unattended
- Allow others to use your account
- Ignore unusual login notifications

#### **Email Security**
✅ **DO:**
- Keep email account secure
- Enable 2FA on email account
- Check spam folder for OTP emails
- Use strong email password
- Keep email current and accessible

❌ **DON'T:**
- Share email with others
- Change email without updating profile
- Forget email account password
- Ignore password reset emails

---

### For Admins

#### **Access Control**
✅ **DO:**
- Log out when done
- Use unique admin credentials
- Change password regularly
- Review admin activity logs
- Limit admin account creation
- Use strong passwords

❌ **DON'T:**
- Share admin credentials
- Leave dashboard open
- Use admin account for browsing
- Create unnecessary admin accounts
- Ignore security logs

#### **Product Management**
✅ **DO:**
- Verify product information accuracy
- Use correct pricing
- Update stock regularly
- Use clear product descriptions
- Add multiple images per product
- Remove/hide out-of-stock items

❌ **DON'T:**
- Upload suspicious images
- Set incorrect prices
- Leave products with 0 stock active
- Allow duplicate products
- Add inappropriate content

#### **Order Processing**
✅ **DO:**
- Process orders promptly
- Update status immediately
- Communicate with customers
- Verify customer information
- Check for fraud
- Keep records

❌ **DON'T:**
- Delay order processing
- Forget to update status
- Process suspicious orders without verification
- Lose order records
- Cancel orders without reason

#### **User Management**
✅ **DO:**
- Review pending approvals daily
- Verify user information
- Document block reasons
- Notify users of blocks
- Respond to queries
- Keep audit trail

❌ **DON'T:**
- Approve without verification
- Block users arbitrarily
- Ignore user complaints
- Delete user records
- Share user information
- Modify activity logs

---

### For Super Admins

#### **System Security**
✅ **DO:**
- Monitor security logs daily
- Review failed login attempts
- Investigate suspicious activity
- Keep admin accounts to minimum
- Rotate super admin passwords
- Backup database regularly
- Test disaster recovery

❌ **DON'T:**
- Leave system unattended
- Share super admin password
- Create unnecessary super admin accounts
- Ignore security alerts
- Change security settings on a whim
- Allow database access to unauthorized people

#### **User Approval**
✅ **DO:**
- Verify user information
- Check for duplicate accounts
- Document approval decisions
- Maintain consistent standards
- Respond within 24 hours
- Keep approval logs

❌ **DON'T:**
- Approve without verification
- Create duplicate accounts
- Show favoritism
- Approve suspicious registrations
- Delay approvals unnecessarily
- Lose approval records

#### **Admin Oversight**
✅ **DO:**
- Monitor admin activity
- Review admin logs regularly
- Ensure proper permissions
- Audit admin actions
- Reset passwords securely
- Remove inactive admins
- Document all changes

❌ **DON'T:**
- Trust admins blindly
- Allow excessive admin power
- Ignore suspicious admin activity
- Share admin accounts
- Create permanent super admin accounts unnecessarily

---

### Security Concerns & Recommendations

#### **Current Security Status**
✅ **Implemented**:
- Password hashing (SHA256)
- Session security (HTTPOnly cookies)
- SQL injection protection (prepared statements)
- OTP-based password reset
- Security questions for verification
- Activity logging
- User blocking mechanism
- Role-based access control (RBAC)

⚠️ **Areas for Improvement**:

1. **Environment Variables**
   - Current: Email/database credentials hardcoded
   - Recommendation: Move to `.env` file
   - Impact: Prevents credential exposure in version control

2. **HTTPS**
   - Current: HTTP only
   - Recommendation: Enable HTTPS in production
   - Impact: Encrypts data in transit

3. **CSRF Protection**
   - Current: Limited implementation
   - Recommendation: Add CSRF tokens to all forms
   - Impact: Prevents cross-site attacks

4. **Rate Limiting**
   - Current: No rate limiting
   - Recommendation: Implement on login, password reset
   - Impact: Prevents brute force attacks

5. **Two-Factor Authentication**
   - Current: OTP for password reset only
   - Recommendation: Add 2FA for login
   - Impact: Stronger account protection

---

### Compliance & Data Privacy

#### **Data Handling**
- User data should only be accessed by authorized personnel
- Never share personal information
- Comply with local data protection laws
- Maintain user privacy

#### **Account Deletion**
- If requested, user data can be soft-deleted
- Maintain financial records as required by law
- Preserve audit logs for compliance

#### **Password Policy**
- Minimum 8 characters
- Mixed case letters
- Numbers and special characters
- Change every 90 days (recommended)

---

## Additional Resources

### File Locations
- **Frontend**: `/html/` - All HTML pages
- **Backend**: `/php/` - All PHP scripts
- **Styling**: `/css/` - CSS stylesheets
- **Scripts**: `/js/` - JavaScript files
- **Images**: `/image/` - Static images
- **Uploads**: `/uploads/` - User-uploaded content
- **Vendor**: `/vendor/` - Composer dependencies

### Contact & Support

**Technical Issues**:
- Contact System Administrator
- Provide detailed error message
- Include steps to reproduce
- Mention browser and OS

**Account Issues**:
- Contact Super Admin
- Provide proof of identity
- Explain the issue
- Request resolution

**Feature Requests**:
- Document requested feature
- Explain use case
- Contact development team
- Feature may be implemented in future update

---

## Changelog & Version Info

**Current Version**: 1.0  
**Last Updated**: May 2026  
**Database Version**: MySQL 5.7+

### Version 1.0 Features
- ✅ User registration and approval system
- ✅ Multi-role access control (Customer, Admin, Super Admin)
- ✅ Product catalog and inventory management
- ✅ Order management system
- ✅ OTP-based password recovery
- ✅ Security questions
- ✅ Activity logging
- ✅ Email notifications
- ✅ User blocking system
- ✅ Admin dashboard
- ✅ Super admin dashboard

### Known Limitations
- Single currency support
- Email notifications require SMTP setup
- No payment gateway integration (manual orders only)
- No real-time notifications
- Limited mobile optimization

---

## Conclusion

FashionFlow is a comprehensive e-commerce platform designed for easy product management and order processing. Whether you're a customer browsing products, an admin managing inventory, or a super admin overseeing the system, this guide provides all the information needed for successful usage.

**For Quick Help:**
1. Use search function to find specific topic
2. Check troubleshooting section for common issues
3. Contact system administrator for advanced support
4. Review security section for best practices

**Remember**: Always follow security best practices, keep your password safe, and report any suspicious activity immediately.

---

**Last Updated**: May 26, 2026  
**Documentation Version**: 1.0  
**Maintained By**: FashionFlow Development Team
