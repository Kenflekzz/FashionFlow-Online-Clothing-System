# FashionFlow - Quick Reference Guide

## Quick Navigation

### 🏠 Main URLs
| Page | URL |
|------|-----|
| **Home** | `http://localhost/CamasuraKenneth/html/Home.html` |
| **Login** | `http://localhost/CamasuraKenneth/html/sign-in.html` |
| **Register** | `http://localhost/CamasuraKenneth/html/sign-up.html` |
| **Customer Dashboard** | `http://localhost/CamasuraKenneth/html/user_dashboard.html` |
| **Admin Dashboard** | `http://localhost/CamasuraKenneth/html/admin_dashboard.html` |
| **Super Admin Dashboard** | `http://localhost/CamasuraKenneth/html/super_admin_dashboard.html` |
| **Password Recovery** | `http://localhost/CamasuraKenneth/html/user_id_verify.html` |

---

## 🔑 Default Test Accounts

### Super Admin (For Testing)
```
Username: admin
Email: admin@example.com
Password: AdminPassword123!
```
*(Create via SQL - see USER_GUIDE.md installation section)*

### Admin Account
*Created by Super Admin through dashboard*

### Customer Account
*Self-register through sign-up page, then approve as Super Admin*

---

## ⚡ Common Tasks - Quick Steps

### Customer: Place an Order
1. Go to Dashboard → Browse Products
2. Click "Add to Cart"
3. Click cart icon → "Checkout"
4. Click "Place Order"
5. ✅ Done! Check "My Orders"

### Customer: Reset Password
1. Click "Forgot Password?"
2. Enter User ID/Email → "Find Account"
3. Enter OTP from email
4. Answer security questions
5. Set new password
6. ✅ Log in with new password

### Admin: Add Product
1. Dashboard → Products → "Add Product"
2. Enter name, SKU, price, stock, category
3. Upload image
4. Click "Save Product"
5. ✅ Product appears in catalog

### Admin: Update Order Status
1. Dashboard → Orders
2. Click "Update Status" on order
3. Select new status (Processing → Shipped → Completed)
4. Click "Update"
5. ✅ Customer notified

### Super Admin: Approve Registration
1. Dashboard → "Pending Approvals"
2. Review user info
3. Click "Approve"
4. ✅ User can now log in

### Super Admin: Block User
1. Dashboard → "Manage Users"
2. Find user
3. Click "Block"
4. Enter reason (optional)
5. ✅ User logged out immediately

---

## 🆘 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| **Can't log in** | Check caps lock, use "Forgot Password" |
| **Account blocked** | Contact administrator |
| **Pending approval** | Wait for Super Admin, check email |
| **OTP not received** | Check spam folder, click "Resend OTP" |
| **Images not showing** | Clear browser cache (Ctrl+Shift+Delete) |
| **Database error** | Restart MySQL in XAMPP |
| **Session expired** | Log in again |

---

## 🔐 Security Quick Checklist

- ✅ Use strong password (8+ chars, mixed case, numbers, symbols)
- ✅ Log out when done
- ✅ Don't share credentials
- ✅ Update security questions carefully
- ✅ Keep email address current
- ✅ Check email for OTP codes
- ✅ Report suspicious activity

---

## 📊 User Role Comparison

| Feature | Customer | Admin | Super Admin |
|---------|----------|-------|------------|
| Browse products | ✅ | ✅ | ✅ |
| Place orders | ✅ | ✅ | ✅ |
| Manage products | ❌ | ✅ | ✅ |
| Manage orders | ❌ | ✅ | ✅ |
| Approve users | ❌ | ❌ | ✅ |
| Manage admins | ❌ | ❌ | ✅ |
| View security logs | ❌ | ❌ | ✅ |
| Block users | ❌ | ✅ | ✅ |
| View activity log | ❌ | ✅ | ✅ |

---

## 📱 Responsive Design Support

| Device | Support | Best Experience |
|--------|---------|-----------------|
| Desktop (1920px+) | ✅ Full | Recommended |
| Laptop (1366px) | ✅ Full | Good |
| Tablet (768px) | ✅ Responsive | Good |
| Mobile (375px) | ✅ Responsive | Fair |

---

## 🗂️ File Structure Overview

```
CamasuraKenneth/
├── html/              ← All web pages
├── php/               ← Backend logic
├── css/               ← Styling
├── js/                ← JavaScript
├── image/             ← Static images
├── uploads/           ← User uploads
├── vendor/            ← Dependencies (Composer)
├── composer.json      ← Dependency config
├── README.md          ← Project info
└── USER_GUIDE.md      ← This guide!
```

---

## 🚀 Startup Checklist

- [ ] XAMPP started (Apache + MySQL)
- [ ] Database `fashionflow` created
- [ ] Files in `c:\xampp\htdocs\CamasuraKenneth`
- [ ] `composer install` completed
- [ ] Email configured (if using OTP)
- [ ] Super admin account created
- [ ] Can access home page

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + C` | Stop current command (terminal) |
| `Ctrl + Shift + Delete` | Clear browser cache |
| `F5` | Refresh page |
| `Ctrl + Shift + I` | Open Developer Tools |
| `Tab` | Move between form fields |
| `Enter` | Submit form |

---

## 📧 Email Requirements

### For OTP & Password Reset
- SMTP server required
- Gmail SMTP currently configured
- Credentials: `kenneth.camasura@csucc.edu.ph`
- App Password needed (not regular password)

### If Email Not Working
1. Check SMTP credentials
2. Verify "Less secure apps" allowed (Gmail)
3. Use App Password instead
4. Check firewall blocking SMTP
5. Contact administrator

---

## 🔄 Password Policy

**Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

**Examples**:
- ✅ `MyPassword123!`
- ✅ `Secure@Password2024`
- ❌ `password` (too simple)
- ❌ `12345678` (no letters)
- ❌ `abcdefgh` (no numbers)

---

## 🎯 Session Timeout

| Action | Timeout |
|--------|---------|
| Inactivity | 30 minutes |
| Close browser | Session ends |
| Manual logout | Immediate |
| Force logout (blocked) | Immediate |

---

## 📞 Support Contacts

| Issue | Contact |
|-------|---------|
| Technical problems | System Administrator |
| Account issues | Super Admin |
| Feature requests | Development Team |
| Security concerns | Super Admin |
| Billing/payments | Admin |

---

## 📋 OTP Code Reference

**What**: One-Time Password for password reset  
**Where**: Sent to your registered email  
**Format**: 6-digit code  
**Valid for**: 5 minutes  
**Usage**: Single use only  
**Limit**: 3 resend attempts per session

---

## ✨ Features Summary

### 🛒 E-Commerce
- Product browsing with filters
- Category organization
- Stock tracking
- Order placement & tracking
- Order history

### 👥 User Management
- Self-registration
- Multi-role system
- Account approval workflow
- Profile management
- Account blocking

### 🔐 Security
- OTP verification
- Security questions
- Password hashing
- Session management
- Activity logging
- Account blocking

### 📊 Admin Features
- Product CRUD
- Order management
- User management
- Activity monitoring
- Reporting

---

## 🐛 Browser Developer Tools

**Open Inspector**: `Ctrl + Shift + I`  
**Check Console for errors**: `Ctrl + Shift + J`  
**Network tab**: See API calls and responses  
**Application tab**: View cookies and session storage

---

## 📈 Performance Tips

1. **Faster pages**: Clear cache (Ctrl+Shift+Delete)
2. **Faster search**: Use filters
3. **Faster loading**: Use wired internet
4. **Faster checkout**: Save address info
5. **Faster admin**: Process orders in batches

---

## 🎓 Next Steps

1. **First time?** → Read USER_GUIDE.md "Getting Started"
2. **Need help?** → Check "Troubleshooting" section
3. **Security questions?** → See "Account Recovery" section
4. **Admin tasks?** → Check "Admin User Guide"
5. **System setup?** → See "Installation & Setup"

---

## 📝 Important Notes

- ⚠️ Email credentials are hardcoded (security concern)
- ⚠️ Use locally only (not production-ready)
- ⚠️ Always use HTTPS in production
- ⚠️ Regular backups recommended
- ℹ️ Database version: MySQL 5.7+
- ℹ️ PHP version: 7.4+

---

## 🔗 Related Files

- **Full User Guide**: `USER_GUIDE.md`
- **Setup Info**: Installation section in USER_GUIDE.md
- **Troubleshooting**: Troubleshooting section in USER_GUIDE.md
- **Database**: `fashionflow` MySQL database
- **Code**: `/php/` directory for backend logic

---

**Need more help?** Check the full USER_GUIDE.md in the project root directory.

**Last Updated**: May 26, 2026
