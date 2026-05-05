// Admin Dashboard JavaScript



document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();

    
    
    // Setup search debounce for security logs
    const searchInput = document.getElementById('adminLogSearch');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(filterAdminLogs, 300);
        });
    }
    
    highlightNavByView('dashboard');
});

// Check authentication
function checkAuth() {
    const accountStatus = sessionStorage.getItem('account_status');
    
    if (!accountStatus) {
        window.location.href = '../html/sign-in.html';
        return;
    }
    
    if (accountStatus !== 'admin') {
        if (accountStatus === 'super admin') {
            window.location.href = '../html/super_admin_dashboard.html';
        } else {
            window.location.href = '../html/user_dashboard.html';
        }
        return;
    }
    
    const username = sessionStorage.getItem('username');
    if (username) {
        const adminUserNameEl = document.getElementById('adminUserName');
        if (adminUserNameEl) {
            adminUserNameEl.textContent = username;
        }
    }
}

function initializeDashboard() {
    loadStats();
    loadTasks();
    loadAdminPrivileges(); // This will load privileges and then initialize other modules
}

// =========================
// NAVIGATION
// =========================

function highlightNavByView(viewName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const links = document.querySelectorAll('.nav-link');
    for (let link of links) {
        const onclick = link.getAttribute('onclick') || '';
        const dataView = link.getAttribute('data-view') || '';
        
        if (onclick.includes(viewName) || 
            dataView === viewName ||
            (viewName === 'users' && dataView === 'customers') ||
            (viewName === 'securityLogs' && dataView === 'security')) {
            link.classList.add('active');
            break;
        }
    }
}

function hideAllViews() {
    const views = ['dashboardView', 'securityLogsView', 'usersView', 'productsView', 'ordersView', 'reportsView', 'staffManagementView'];
    views.forEach(viewId => {
        const el = document.getElementById(viewId);
        if (el) el.style.display = 'none';
    });
}

function showDashboard() {
    hideAllViews();
    const view = document.getElementById('dashboardView');
    if (view) {
        view.style.display = 'block';
        highlightNavByView('dashboard');
    } else {
        console.error('dashboardView not found');
    }
}

function showSecurityLogs() {
    hideAllViews();
    const view = document.getElementById('securityLogsView');
    if (!view) {
        console.error('securityLogsView not found in DOM');
        showToast('Security logs view not available');
        return;
    }
    
    view.style.display = 'block';
    highlightNavByView('security');
    
    // Check privilege before loading
    if (can('security_logs', 'read')) {
        loadAdminSecurityLogs();
    } else {
        showAdminNoLogs('You do not have permission to view security logs.');
    }
}

function showUsers() {
    hideAllViews();
    const view = document.getElementById('usersView');
    if (!view) { showToast('Users view not available'); return; }

    view.style.display = 'block';
    highlightNavByView('customers');

    if (can('users', 'read')) {
        loadCustomers();
    } else {
        const tbody = document.getElementById('customersTableBody');
        if (tbody) {
            tbody.innerHTML =
                '<tr><td colspan="6" style="text-align:center;color:#dc2626;padding:40px;">' +
                '<i class="fas fa-lock" style="font-size:48px;margin-bottom:10px;"></i><br>' +
                'You do not have permission to view accounts.</td></tr>';
        }
    }
}

function showProducts() {
    hideAllViews();
    const view = document.getElementById('productsView');
    if (!view) {
        console.error('productsView not found in DOM');
        showToast('Products view not available');
        return;
    }
    
    view.style.display = 'block';
    highlightNavByView('products');
    
    if (can('products', 'read')) {
        loadProducts();
    } else {
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = 
                '<tr><td colspan="8" style="text-align:center;color:#dc2626;padding:40px;">' +
                '<i class="fas fa-lock" style="font-size:48px;margin-bottom:10px;"></i><br>' +
                'You do not have permission to view products.</td></tr>';
        }
    }
}

function showOrders() {
    hideAllViews();
    const view = document.getElementById('ordersView');
    if (!view) {
        console.error('ordersView not found in DOM');
        showToast('Orders view not available');
        return;
    }
    
    view.style.display = 'block';
    highlightNavByView('orders');
    
    if (can('orders', 'read')) {
        loadOrders();
    } else {
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = 
                '<tr><td colspan="8" style="text-align:center;color:#dc2626;padding:40px;">' +
                '<i class="fas fa-lock" style="font-size:48px;margin-bottom:10px;"></i><br>' +
                'You do not have permission to view orders.</td></tr>';
        }
    }
}

function showReports() {
    hideAllViews();
    const view = document.getElementById('reportsView');
    if (!view) {
        console.error('reportsView not found in DOM');
        showToast('Reports view not available');
        return;
    }
    
    view.style.display = 'block';
    highlightNavByView('reports');
    
    if (can('reports', 'read')) {
        loadReports();
    }
}

function showStaffManagement() {
    hideAllViews();
    const staffView = document.getElementById('staffManagementView');
    if (staffView) {
        staffView.style.display = 'block';
    } else {
        console.error('staffManagementView not found in DOM');
        showToast('Staff management view not available');
        return;
    }
    highlightNavByView('staff');
}

function showView(viewName) {
    const viewMap = {
        'dashboard': showDashboard,
        'security': showSecurityLogs,
        'securityLogs': showSecurityLogs,
        'customers': showUsers,
        'users': showUsers,
        'products': showProducts,
        'orders': showOrders,
        'reports': showReports,
        'staff': showStaffManagement,
        'categories': showCategories,
        'promotions': showPromotions,
        'settings': showSettings
    };
    
    const func = viewMap[viewName];
    if (func) {
        func();
    } else {
        console.error('Unknown view:', viewName);
        showToast(`"${viewName}" feature coming soon!`);
    }
}

// Stub functions for unimplemented views
function showCategories() {
    hideAllViews();
    showToast('Categories management coming soon!');
    showDashboard();
}

function showPromotions() {
    hideAllViews();
    showToast('Promotions feature coming soon!');
    showDashboard();
}

function showSettings() {
    hideAllViews();
    showToast('Settings page coming soon!');
    showDashboard();
}

// ================================
// PRIVILEGE SYSTEM - Aligned with your PHP endpoint
// ================================

let ADMIN_PRIVILEGES = {};

/**
 * Load privileges from PHP endpoint
 * Your PHP returns: { "module": { "can_create": bool, "can_read": bool, "can_update": bool, "can_delete": bool, "can_block": bool } }
 */
async function loadAdminPrivileges() {
    try {
        // Using your PHP endpoint - adjust path if needed
        const res = await fetch('../php/get_admin_privilege.php');
        const data = await res.json();
        
        console.log('Raw privilege data from server:', data);

        if (data.status !== 200) {
            console.error('Failed to load privileges:', data.message);
            // Set empty privileges - will restrict all actions
            ADMIN_PRIVILEGES = {};
            applyAllPrivileges();
            return;
        }

        ADMIN_PRIVILEGES = data.privileges || {};
        
        console.log('Loaded privileges:', ADMIN_PRIVILEGES);
        console.log('Sample checks:');
        console.log('- can create products:', can('products', 'create'));
        console.log('- can read users:', can('users', 'read'));
        console.log('- can update orders:', can('orders', 'update'));
        
        // Now apply privileges to UI
        applyAllPrivileges();
        
        // Load initial data for dashboard
        // (other modules load when navigated to)
        
    } catch (err) {
        console.error('Privilege fetch error:', err);
        ADMIN_PRIVILEGES = {};
    }
}

/**
 * Check if admin has specific privilege
 * @param {string} module - Module name (security_logs, users, products, orders, reports)
 * @param {string} action - Action name (create, read, update, delete, block)
 * @returns {boolean}
 */
function can(module, action) {
    const priv = ADMIN_PRIVILEGES[module];
    if (!priv) {
        console.log(`No privileges found for module: ${module}`);
        return false;
    }
    
    // Your PHP returns keys like "can_create", "can_read", etc.
    const key = `can_${action}`;
    const val = priv[key];
    
    // Debug logging (remove in production)
    // console.log(`Checking ${module}.${key}:`, val);
    
    // Handle boolean true/false or integer 1/0
    return val === true || val === 1 || val === '1' || val === 'true';
}

/**
 * Apply all privilege checks to UI
 */
function applyAllPrivileges() {
    applyNavigationPrivileges();
    applyActionButtonPrivileges();
    // Other privilege applications happen when modules are loaded
}

/**
 * Hide navigation items for modules without read access
 */
function applyNavigationPrivileges() {
    const navMap = [
        { selector: '[onclick*="showUsers"]', module: 'users', label: 'Customers' },
        { selector: '[onclick*="showProducts"]', module: 'products', label: 'Products' },
        { selector: '[onclick*="showOrders"]', module: 'orders', label: 'Orders' },
        { selector: '[onclick*="showSecurityLogs"]', module: 'security_logs', label: 'Security Logs' },
        { selector: '[onclick*="showReports"]', module: 'reports', label: 'Reports' }
    ];
    
    navMap.forEach(item => {
        const hasReadAccess = can(item.module, 'read');
        const elements = document.querySelectorAll(item.selector);
        
        elements.forEach(el => {
            const navLink = el.closest('.nav-link');
            if (navLink) {
                if (!hasReadAccess) {
                    navLink.style.display = 'none';
                    console.log(`Hiding ${item.label} nav - no read permission`);
                } else {
                    navLink.style.display = 'flex';
                }
            }
        });
    });
}

/**
 * Hide action buttons based on create privileges
 */
function applyActionButtonPrivileges() {
    // Hide "Add Product" buttons if no create permission
    const addProductButtons = document.querySelectorAll('button[onclick*="openAddProductModal"], button[onclick*="openProductModal"]');
    
    addProductButtons.forEach(btn => {
        // Check if this is an "Add" button (not Edit)
        const text = btn.textContent.toLowerCase();
        const hasPlusIcon = btn.querySelector('i.fa-plus');
        
        if (text.includes('add') || hasPlusIcon) {
            if (!can('products', 'create')) {
                btn.style.display = 'none';
                console.log('Hiding Add Product button - no create permission');
            } else {
                btn.style.display = 'inline-flex';
            }
        }
    });
    
    // Also check for Quick Actions "Add New Product" button
    const quickActionBtns = document.querySelectorAll('.btn-action');
    quickActionBtns.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('add new product') || text.includes('add product')) {
            if (!can('products', 'create')) {
                btn.style.display = 'none';
            }
        }
    });
}

// ================================
// CUSTOMERS MODULE (All Users)
// ================================
let customersData    = [];
let allUsersFullData = [];
let customerCurrentPage = 1;
let customerTotalPages  = 1;

// ── Load full user details from get_all_users.php ──
function loadAllUsersFullData() {
    fetch('../php/get_all_users.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                allUsersFullData = data.users;
                console.log('Full user cache loaded:', allUsersFullData.length);
            }
        })
        .catch(err => console.error('Failed to load full user data:', err));
}

// ── Load paginated table data ──
function loadCustomers(page = 1) {
    if (!can('users', 'read')) {
        showToast('No permission to view accounts');
        return;
    }

    const search = document.getElementById('customerSearch')?.value || '';

    const tbody = document.getElementById('customersTableBody');
    if (tbody) {
        tbody.innerHTML =
            '<tr><td colspan="6" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    }

    fetch(`../php/get_customers.php?page=${page}&search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                customersData       = data.customers;
                customerCurrentPage = data.page;
                customerTotalPages  = data.pages;
                renderCustomers();
                renderCustomerStats(data.stats);
                renderPagination('customerPagination', data.page, data.pages, 'loadCustomers');
            } else {
                showToast('Error loading accounts: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error loading accounts:', err);
            showToast('Failed to load accounts');
        });
}

// ── Render table rows ──
function renderCustomers() {
    const tbody     = document.getElementById('customersTableBody');
    if (!tbody) return;

    const canUpdate = can('users', 'update');
    const canBlock  = can('users', 'block');

    if (!customersData.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-state">No accounts found</td></tr>';
        return;
    }

    tbody.innerHTML = customersData.map(c => {
        const roleClass = c.role === 'admin'       ? 'role-admin' :
                          c.role === 'super admin'  ? 'role-super-admin' : 'role-user';
        const roleLabel = c.role === 'admin'        ? 'Admin' :
                          c.role === 'super admin'  ? 'Super Admin' : 'User';

        const isBlocked   = c.status === 'blocked' || c.status === 'Suspended';
        const statusClass = isBlocked               ? 'status-blocked' :
                            c.status === 'Pending'  ? 'status-pending'  : 'status-active';
        const statusLabel = isBlocked               ? 'Blocked' :
                            c.status               ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Active';

        // ── Action buttons ──
        let actions = `
            <button class="btn-sm btn-outline" onclick="viewCustomer('${c.id}')" title="View Details">
                <i class="fas fa-eye"></i>
            </button>`;

        if (canUpdate) {
            actions += `
            <button class="btn-sm btn-outline" onclick="editCustomer('${c.id}')" title="Edit Account">
                <i class="fas fa-edit"></i>
            </button>`;
        }

        if (canBlock) {
            if (isBlocked) {
                actions += `
            <button class="btn-sm btn-outline" style="color:#10b981;"
                    onclick="blockCustomer('${c.id}', 'active')" title="Unblock Account">
                <i class="fas fa-unlock"></i>
            </button>`;
            } else {
                actions += `
            <button class="btn-sm btn-outline" style="color:#dc2626;"
                    onclick="blockCustomer('${c.id}', 'blocked')" title="Block Account">
                <i class="fas fa-ban"></i>
            </button>`;
            }
        }

        return `
        <tr>
            <td>
                <div class="customer">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || c.username)}&background=7c3e2e&color=fff&size=30" alt="">
                    <div>
                        <div style="font-weight:600;">${escapeHtml(c.full_name || c.username)}</div>
                        <small style="color:#6b7280;">@${escapeHtml(c.username)}</small>
                    </div>
                </div>
            </td>
            <td><span class="role-badge ${roleClass}">${roleLabel}</span></td>
            <td>${escapeHtml(c.email)}</td>
            <td>${formatDate(c.created_at)}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td><div class="action-btns">${actions}</div></td>
        </tr>`;
    }).join('');
}

// ── Stats ──
function renderCustomerStats(stats) {
    const container = document.getElementById('customerStats');
    if (!container) return;

    container.innerHTML = `
        <div class="stat-box">
            <div class="stat-icon customers"><i class="fas fa-users"></i></div>
            <div class="stat-info"><h3>${stats.total || 0}</h3><p>Total Accounts</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon revenue"><i class="fas fa-user-check"></i></div>
            <div class="stat-info"><h3>${stats.active_today || 0}</h3><p>Active Today</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon orders"><i class="fas fa-user-shield"></i></div>
            <div class="stat-info"><h3>${stats.admins || 0}</h3><p>Admins</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon products" style="background:#fee2e2;color:#dc2626;">
                <i class="fas fa-user-slash"></i>
            </div>
            <div class="stat-info"><h3>${stats.blocked || 0}</h3><p>Blocked</p></div>
        </div>`;
}

// ════════════════════════════════════════
// VIEW ACTION
// ════════════════════════════════════════
async function viewCustomer(id) {
    if (!can('users', 'read')) {
        alert('No permission to view account details');
        return;
    }

    // Try full cache first
    let c = allUsersFullData.find(u => String(u.user_id) === String(id));

    // If not in cache, fetch fresh from server
    if (!c) {
        try {
            const res  = await fetch('../php/get_all_users.php');
            const data = await res.json();
            if (data.status === 200) {
                allUsersFullData = data.users;
                c = allUsersFullData.find(u => String(u.user_id) === String(id));
            }
        } catch (err) {
            console.error('Failed to fetch user details:', err);
        }
    }

    // Final fallback to paginated data
    if (!c) {
        c = customersData.find(u => String(u.id) === String(id));
    }

    if (!c) { showToast('Account not found'); return; }

    const userId    = c.user_id  || c.id;
    const fullName  = c.full_name || c.username;
    const isBlocked = c.is_blocked == 1 ||
                      c.status === 'blocked' ||
                      c.status === 'Suspended';

    // Avatar
    document.getElementById('viewUserAvatar').src =
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=7c3e2e&color=fff&size=80`;

    // Header
    document.getElementById('viewUserFullName').textContent       = fullName;
    document.getElementById('viewUserUsernameDisplay').textContent = '@' + (c.username || '');

    // Status badge
    const badge = document.getElementById('viewUserStatusBadge');
    badge.textContent   = isBlocked ? 'Blocked' : (c.status || 'Active');
    badge.style.cssText = isBlocked
        ? 'display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;background:#fee2e2;color:#991b1b;border:1px solid #ef4444;'
        : 'display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534;border:1px solid #22c55e;';

    const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.textContent = (val !== null && val !== undefined && val !== '') ? val : '—';
    };

    // Personal Info
    set('viewUserId',        userId);
    set('viewUserFname',     c.Fname);
    set('viewUserMname',     c.M_I);
    set('viewUserLname',     c.Lname);
    set('viewUserExtension', c.Extension);
    set('viewUserBirthdate', c.birthdate ? formatDate(c.birthdate) : null);
    set('viewUserSex',       c.sex);

    // Account Info
    set('viewUserUsername',  c.username);
    set('viewUserEmail',     c.email);
    set('viewUserRole',      c.role ? c.role.charAt(0).toUpperCase() + c.role.slice(1) : 'User');
    set('viewUserJoined',    c.created_at ? formatDate(c.created_at) : null);

    // Address
    set('viewUserPurok',    c.purok);
    set('viewUserBarangay', c.barangay);
    set('viewUserCity',     c.City_Municipality);
    set('viewUserProvince', c.province);
    set('viewUserCountry',  c.country);
    set('viewUserZip',      c.zip_code);

    // Block info
    const blockInfo = document.getElementById('viewUserBlockInfo');
    if (isBlocked && (c.block_reason || c.blocked_by || c.blocked_at)) {
        blockInfo.style.display = 'block';
        set('viewUserBlockReason', c.block_reason || 'No reason provided');
        set('viewUserBlockedBy',   c.blocked_by   || 'Unknown');
        set('viewUserBlockedAt',   c.blocked_at   ? formatDateTime(c.blocked_at) : null);
    } else {
        blockInfo.style.display = 'none';
    }

    document.getElementById('viewUserModal').style.display = 'flex';
}

function closeViewUserModal() {
    document.getElementById('viewUserModal').style.display = 'none';
}

// ════════════════════════════════════════
// EDIT ACTION
// ════════════════════════════════════════
async function editCustomer(id) {
    if (!can('users', 'update')) {
        alert('No permission to edit accounts');
        return;
    }

    let c = allUsersFullData.find(u => String(u.user_id) === String(id));

    if (!c) {
        try {
            const res  = await fetch('../php/get_all_users.php');
            const data = await res.json();
            if (data.status === 200) {
                allUsersFullData = data.users;
                c = allUsersFullData.find(u => String(u.user_id) === String(id));
            }
        } catch (err) {
            console.error('Failed to fetch user details:', err);
        }
    }

    if (!c) { showToast('Account not found'); return; }

    const userId = c.user_id || c.id;

    document.getElementById('editUserId').value          = userId;
    document.getElementById('editUserFname').value       = c.Fname      || '';
    document.getElementById('editUserMname').value       = c.M_I        || '';
    document.getElementById('editUserLname').value       = c.Lname      || '';
    document.getElementById('editUserExtension').value   = c.Extension  || '';
    document.getElementById('editUserBirthdate').value   = c.birthdate  || '';
    document.getElementById('editUserSex').value         = c.sex        || '';
    document.getElementById('editUserUsername').value    = c.username   || '';
    document.getElementById('editUserEmail').value       = c.email      || '';
    document.getElementById('editUserStatus').value      = c.status     || 'Active';
    document.getElementById('editUserPurok').value       = c.purok      || '';
    document.getElementById('editUserBarangay').value    = c.barangay   || '';
    document.getElementById('editUserCity').value        = c.City_Municipality || '';
    document.getElementById('editUserProvince').value    = c.province   || '';
    document.getElementById('editUserCountry').value     = c.country    || 'Philippines';
    document.getElementById('editUserZip').value         = c.zip_code   || '';

    document.getElementById('editUserModal').style.display = 'flex';

    // Add these two lines inside editCustomer() after populating the other fields:
    document.getElementById('editUserIdDisplay').value    = userId;
    document.getElementById('editUserRoleDisplay').value  = c.role
        ? c.role.charAt(0).toUpperCase() + c.role.slice(1)
        : 'User';
}

async function saveEditUser() {
    const id = document.getElementById('editUserId').value;
    if (!id) { showToast('User ID missing'); return; }

    const fname    = document.getElementById('editUserFname').value.trim();
    const lname    = document.getElementById('editUserLname').value.trim();
    const username = document.getElementById('editUserUsername').value.trim();
    const email    = document.getElementById('editUserEmail').value.trim();

    if (!fname)    { showToast('First name is required');  document.getElementById('editUserFname').focus();    return; }
    if (!lname)    { showToast('Last name is required');   document.getElementById('editUserLname').focus();    return; }
    if (!username) { showToast('Username is required');    document.getElementById('editUserUsername').focus(); return; }
    if (!email)    { showToast('Email is required');       document.getElementById('editUserEmail').focus();    return; }

    const payload = {
        user_id:           id,
        Fname:             fname,
        M_I:               document.getElementById('editUserMname').value.trim(),
        Lname:             lname,
        Extension:         document.getElementById('editUserExtension').value.trim(),
        birthdate:         document.getElementById('editUserBirthdate').value,
        sex:               document.getElementById('editUserSex').value,
        username,
        email,
        status:            document.getElementById('editUserStatus').value,
        purok:             document.getElementById('editUserPurok').value.trim(),
        barangay:          document.getElementById('editUserBarangay').value.trim(),
        City_Municipality: document.getElementById('editUserCity').value.trim(),
        province:          document.getElementById('editUserProvince').value.trim(),
        country:           document.getElementById('editUserCountry').value.trim() || 'Philippines',
        zip_code:          document.getElementById('editUserZip').value.trim()
    };

    const saveBtn  = document.getElementById('editUserSaveBtn');
    const origText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const res  = await fetch('../php/update_user.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success || data.status === 200) {
            showToast('Account updated successfully!');
            closeEditUserModal();
            loadAllUsersFullData();
            loadCustomers(customerCurrentPage);
        } else {
            showToast('Error: ' + (data.message || 'Failed to update'));
        }
    } catch (err) {
        console.error('Edit save error:', err);
        showToast('Network error. Please try again.');
    } finally {
        saveBtn.disabled  = false;
        saveBtn.innerHTML = origText;
    }
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

// ════════════════════════════════════════
// BLOCK / UNBLOCK ACTION
// ════════════════════════════════════════
function blockCustomer(id, newStatus) {
    if (!can('users', 'block')) {
        alert('No permission to block/unblock accounts');
        return;
    }

    const c = allUsersFullData.find(u => String(u.user_id) === String(id)) ||
              customersData.find(u => String(u.id) === String(id));
    if (!c) { showToast('Account not found'); return; }

    const isBlocking = newStatus === 'blocked';
    const modal      = document.getElementById('blockUserModal');
    const header     = document.getElementById('blockModalHeader');
    const title      = document.getElementById('blockModalTitle');
    const icon       = document.getElementById('blockModalIcon');
    const message    = document.getElementById('blockModalMessage');
    const nameEl     = document.getElementById('blockModalName');
    const reasonBox  = document.getElementById('blockReasonContainer');
    const confirmBtn = document.getElementById('blockModalConfirmBtn');

    if (isBlocking) {
        header.style.cssText        = 'padding:20px 25px;border-bottom:1px solid #fecaca;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:16px 16px 0 0;';
        title.style.color           = 'white';
        title.innerHTML             = '<i class="fas fa-ban" style="margin-right:8px;"></i>Block Account';
        icon.style.cssText          = 'width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:28px;background:#fee2e2;color:#dc2626;';
        icon.innerHTML              = '<i class="fas fa-ban"></i>';
        message.textContent         = 'Are you sure you want to block this account? The user will not be able to log in.';
        nameEl.style.color          = '#dc2626';
        reasonBox.style.display     = 'block';
        document.getElementById('blockReason').value = '';
        confirmBtn.textContent      = 'Block Account';
        confirmBtn.style.background = 'linear-gradient(135deg,#dc2626,#991b1b)';
        confirmBtn.style.border     = 'none';
    } else {
        header.style.cssText        = 'padding:20px 25px;border-bottom:1px solid #a7f3d0;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#059669,#065f46);border-radius:16px 16px 0 0;';
        title.style.color           = 'white';
        title.innerHTML             = '<i class="fas fa-unlock" style="margin-right:8px;"></i>Unblock Account';
        icon.style.cssText          = 'width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:28px;background:#dcfce7;color:#059669;';
        icon.innerHTML              = '<i class="fas fa-unlock"></i>';
        message.textContent         = 'Are you sure you want to unblock this account? The user will be able to log in again.';
        nameEl.style.color          = '#059669';
        reasonBox.style.display     = 'none';
        confirmBtn.textContent      = 'Unblock Account';
        confirmBtn.style.background = 'linear-gradient(135deg,#059669,#065f46)';
        confirmBtn.style.border     = 'none';
    }

    nameEl.textContent = (c.full_name || c.username) + ' (@' + c.username + ')';

    // Store pending action
    modal._pendingId     = id;
    modal._pendingStatus = newStatus;

    modal.style.display = 'flex';
}

async function confirmBlockAction() {
    const modal      = document.getElementById('blockUserModal');
    const id         = modal._pendingId;
    const newStatus  = modal._pendingStatus;
    const isBlocking = newStatus === 'blocked';

    if (isBlocking) {
        const reason = document.getElementById('blockReason').value.trim();
        if (!reason) {
            showToast('Please provide a reason for blocking');
            document.getElementById('blockReason').focus();
            return;
        }
    }

    const confirmBtn  = document.getElementById('blockModalConfirmBtn');
    const origText    = confirmBtn.textContent;
    confirmBtn.disabled  = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const formData = new FormData();
    formData.append('user_id', id);
    formData.append('status',  newStatus);
    if (isBlocking) {
        formData.append('reason', document.getElementById('blockReason').value.trim());
        formData.append('blocked_by', sessionStorage.getItem('username') || 'Admin');
    }

    try {
        const res  = await fetch('../php/update_customer_status.php', {
            method: 'POST',
            body:   formData
        });
        const data = await res.json();

        if (data.status === 200 || data.success) {
            showToast(`Account ${isBlocking ? 'blocked' : 'unblocked'} successfully`);
            closeBlockUserModal();
            loadAllUsersFullData();
            loadCustomers(customerCurrentPage);
        } else {
            showToast('Error: ' + (data.message || 'Failed to update status'));
        }
    } catch (err) {
        console.error('Block action error:', err);
        showToast('Network error. Please try again.');
    } finally {
        confirmBtn.disabled     = false;
        confirmBtn.textContent  = origText;
    }
}

function closeBlockUserModal() {
    document.getElementById('blockUserModal').style.display = 'none';
}

function exportCustomers() {
    if (!can('users', 'read')) {
        alert('No permission to export accounts');
        return;
    }
    window.open('../php/export_customers.php', '_blank');
}

function searchCustomers() { loadCustomers(1); }
function filterCustomers()  { loadCustomers(1); }
function sortCustomers()    { loadCustomers(1); }

// Close modals on backdrop click
document.addEventListener('click', function (e) {
    const viewModal  = document.getElementById('viewUserModal');
    const editModal  = document.getElementById('editUserModal');
    const blockModal = document.getElementById('blockUserModal');
    if (e.target === viewModal)  closeViewUserModal();
    if (e.target === editModal)  closeEditUserModal();
    if (e.target === blockModal) closeBlockUserModal();
});


// ================================
// PRODUCTS MODULE
// ================================
let productsData = [];
let productCategories = [];
let productCurrentPage = 1;
let productTotalPages = 1;
let editingProductId = null;

function loadProducts(page = 1) {
    if (!can('products', 'read')) {
        showToast('No permission to view products');
        return;
    }
    
    const searchInput = document.getElementById('productSearch');
    const search = searchInput ? searchInput.value : '';
    const categoryInput = document.getElementById('productCategoryFilter');
    const category = categoryInput ? categoryInput.value : 'all';
    const stockInput = document.getElementById('productStockFilter');
    const stock = stockInput ? stockInput.value : 'all';
    const statusInput = document.getElementById('productStatusFilter');
    const status = statusInput ? statusInput.value : 'all';
    
    const tbody = document.getElementById('productsTableBody');
    if (tbody) {
        tbody.innerHTML = 
            '<tr><td colspan="8" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    }
    
    fetch(`../php/get_products.php?page=${page}&search=${encodeURIComponent(search)}&category=${category}&stock=${stock}&status=${status}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                productsData = data.products;
                productCategories = data.categories;
                productCurrentPage = data.page;
                productTotalPages = data.pages;
                renderProducts();
                renderProductStats(data.stats);
                renderLowStockAlerts(data.low_stock_alerts);
                renderPagination('productPagination', data.page, data.pages, 'loadProducts');
                populateCategorySelect(data.categories);
            } else {
                showToast('Error loading products: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error loading products:', err);
            showToast('Failed to load products');
        });
}

function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const canUpdate = can('products', 'update');
    const canDelete = can('products', 'delete');
    
    if (productsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-state">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = productsData.map(p => {
        const stockPercent = Math.min((p.stock / (p.low_stock_threshold * 2)) * 100, 100);
        const stockClass = p.stock === 0 ? 'stock-low' : p.stock <= p.low_stock_threshold ? 'stock-medium' : 'stock-high';
        
        // Build action buttons based on privileges
        let actions = '';
        if (canUpdate) {
            actions += `<button class="btn-sm btn-outline" onclick="editProduct(${p.id})" title="Edit"><i class="fas fa-edit"></i></button>`;
        }
        if (canDelete) {
            actions += ` <button class="btn-sm btn-outline" style="color:#dc2626;" onclick="deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>`;
        }
        if (!actions) {
            actions = '<span style="color:#9ca3af;font-size:12px;">No actions</span>';
        }
        
        return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:50px;height:50px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                        ${p.primary_image ? `<img src="../${p.primary_image}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-tshirt" style="color:#9ca3af;"></i>'}
                    </div>
                    <div>
                        <div style="font-weight:600;">${escapeHtml(p.name)}</div>
                        <small style="color:#6b7280;">${escapeHtml(p.brand || 'No brand')}</small>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(p.sku)}</td>
            <td><span class="category-tag">${escapeHtml(p.category_name || 'Uncategorized')}</span></td>
            <td style="font-weight:600;">
                $${parseFloat(p.price).toFixed(2)}
                ${p.compare_price > p.price ? `<br><small style="text-decoration:line-through;color:#9ca3af;">$${parseFloat(p.compare_price).toFixed(2)}</small>` : ''}
            </td>
            <td>
                <div class="stock-indicator">
                    <span>${p.stock}</span>
                    <div class="stock-bar"><div class="stock-fill ${stockClass}" style="width:${stockPercent}%;"></div></div>
                </div>
            </td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
            <td>${formatDate(p.updated_at)}</td>
            <td>
                <div class="action-btns">
                    ${actions}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderProductStats(stats) {
    const container = document.getElementById('productStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-box">
            <div class="stat-icon products"><i class="fas fa-box"></i></div>
            <div class="stat-info"><h3>${stats.total || 0}</h3><p>Total Products</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon revenue"><i class="fas fa-check-circle"></i></div>
            <div class="stat-info"><h3>${stats.active || 0}</h3><p>Active</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon orders" style="background:#fef3c7;color:#92400e;"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-info"><h3>${stats.low_stock || 0}</h3><p>Low Stock</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon customers" style="background:#fee2e2;color:#dc2626;"><i class="fas fa-times-circle"></i></div>
            <div class="stat-info"><h3>${stats.out_of_stock || 0}</h3><p>Out of Stock</p></div>
        </div>
    `;
    
    // Show/hide buttons based on privileges
    const addBtn = document.querySelector('#productsView .btn-primary');
    const exportBtn = document.querySelector('#productsView .btn-outline');
    
    if (addBtn) addBtn.style.display = can('products', 'create') ? 'inline-flex' : 'none';
    if (exportBtn) exportBtn.style.display = can('products', 'read') ? 'inline-flex' : 'none';
}

function renderLowStockAlerts(alerts) {
    const card = document.getElementById('lowStockAlert');
    const body = document.getElementById('lowStockBody');
    if (!card || !body) return;
    
    if (!can('products', 'read') || !alerts || alerts.length === 0) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    body.innerHTML = alerts.map(item => `
        <div style="padding:10px;border-bottom:1px solid #fecaca;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <strong>${escapeHtml(item.name)}</strong> (SKU: ${item.sku})
                <br><small>${escapeHtml(item.category_name || 'Uncategorized')}</small>
            </div>
            <span style="background:#ef4444;color:white;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">
                Only ${item.stock} left
            </span>
        </div>
    `).join('');
}

function populateCategorySelect(categories) {
    const selects = [
        {id: 'productCategoryFilter', default: 'all', label: 'All Categories'},
        {id: 'prodCategory', default: '', label: 'Select Category'}
    ];
    
    selects.forEach(sel => {
        const select = document.getElementById(sel.id);
        if (!select) return;
        
        const currentVal = select.value;
        select.innerHTML = `<option value="${sel.default}">${sel.label}</option>`;
        
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
        });
        
        if (currentVal && currentVal !== sel.default) {
            select.value = currentVal;
        }
    });
}

// Product actions with privilege checks
function openProductModal(id = null) {
    const isEdit = id !== null;
    const requiredPerm = isEdit ? 'update' : 'create';
    
    if (!can('products', requiredPerm)) {
        alert(`No permission to ${isEdit ? 'edit' : 'create'} products`);
        return;
    }
    
    editingProductId = id;
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    if (!modal || !form) {
        console.error('Product modal elements not found');
        return;
    }
    
    form.reset();
    
    if (isEdit) {
        const product = productsData.find(p => p.id === id);
        if (!product) return;
        
        if (title) title.textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('prodName').value = product.name;
        document.getElementById('prodSKU').value = product.sku;
        document.getElementById('prodCategory').value = product.category_id;
        document.getElementById('prodBrand').value = product.brand || '';
        document.getElementById('prodPrice').value = product.price;
        document.getElementById('prodComparePrice').value = product.compare_price || '';
        document.getElementById('prodStock').value = product.stock;
        document.getElementById('prodLowStock').value = product.low_stock_threshold;
        document.getElementById('prodDescription').value = product.description || '';
        document.getElementById('prodStatus').checked = product.status === 'active';
        
        // Show current image preview if exists
        const previewDiv = document.getElementById('currentImagePreview');
        if (previewDiv && product.primary_image) {
            previewDiv.innerHTML = `<img src="../${product.primary_image}" style="max-width:100px;max-height:100px;margin-top:10px;">`;
        }
    } else {
        if (title) title.textContent = 'Add Product';
        document.getElementById('productId').value = '';
        const previewDiv = document.getElementById('currentImagePreview');
        if (previewDiv) previewDiv.innerHTML = '';
    }
    
    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
    editingProductId = null;
}

function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }
    
    const isUpdate = editingProductId !== null;
    const requiredPermission = isUpdate ? 'update' : 'create';
    
    if (!can('products', requiredPermission)) {
        alert(`No permission to ${isUpdate ? 'update' : 'create'} products`);
        return;
    }
    
    const formData = new FormData(form);
    if (editingProductId) {
        formData.append('id', editingProductId);
    }
    
    fetch('../php/save_product.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 200) {
            showToast(isUpdate ? 'Product updated successfully' : 'Product created successfully');
            closeProductModal();
            loadProducts(productCurrentPage);
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error saving product:', err);
        showToast('Failed to save product');
    });
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (!can('products', 'delete')) {
        alert('No permission to delete products');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    fetch(`../php/delete_product.php?id=${id}`, {method: 'POST'})
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                showToast('Product deleted successfully');
                loadProducts(productCurrentPage);
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error deleting product:', err);
            showToast('Failed to delete product');
        });
}

function exportProducts() {
    if (!can('products', 'read')) {
        alert('No permission to export products');
        return;
    }
    window.open('../php/export_products.php', '_blank');
}

function searchProducts() { loadProducts(1); }
function filterProducts() { loadProducts(1); }

// ================================
// ORDERS MODULE
// ================================
let ordersData = [];
let orderCurrentPage = 1;
let orderTotalPages = 1;
let selectedOrders = new Set();

function loadOrders(page = 1) {
    if (!can('orders', 'read')) {
        showToast('No permission to view orders');
        return;
    }
    
    const searchInput = document.getElementById('orderSearch');
    const search = searchInput ? searchInput.value : '';
    const statusInput = document.getElementById('orderStatusFilter');
    const status = statusInput ? statusInput.value : 'all';
    const dateInput = document.getElementById('orderDateFilter');
    const date = dateInput ? dateInput.value : 'all';
    const sortInput = document.getElementById('orderSort');
    const sort = sortInput ? sortInput.value : 'newest';
    
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        tbody.innerHTML = 
            '<tr><td colspan="8" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    }
    
    fetch(`../php/get_orders.php?page=${page}&search=${encodeURIComponent(search)}&status=${status}&date=${date}&sort=${sort}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                ordersData = data.orders;
                orderCurrentPage = data.page;
                orderTotalPages = data.pages;
                renderOrders();
                renderOrderPipeline(data.pipeline);
                renderPagination('orderPagination', data.page, data.pages, 'loadOrders');
            } else {
                showToast('Error loading orders: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error loading orders:', err);
            showToast('Failed to load orders');
        });
}

function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    const canUpdate = can('orders', 'update');
    
    if (ordersData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-state">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = ordersData.map(o => {
        let actions = `<button class="btn-sm btn-outline" onclick="viewOrder(${o.id})" title="View"><i class="fas fa-eye"></i></button>`;
        
        if (canUpdate && o.status !== 'delivered' && o.status !== 'cancelled') {
            actions += ` <button class="btn-sm btn-outline" onclick="updateOrderStatus(${o.id})" title="Update Status"><i class="fas fa-edit"></i></button>`;
        }
        
        return `
        <tr>
            <td><input type="checkbox" class="order-checkbox" value="${o.id}" ${selectedOrders.has(o.id) ? 'checked' : ''} onchange="toggleOrderSelection(${o.id})"></td>
            <td><span style="font-weight:600;color:#4f46e5;">#${o.order_number}</span></td>
            <td>
                <div class="customer">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(o.username)}&background=7c3e2e&color=fff&size=30" alt="">
                    <div>
                        <div style="font-weight:600;">${escapeHtml(o.username)}</div>
                        <small style="color:#6b7280;">${escapeHtml(o.email)}</small>
                    </div>
                </div>
            </td>
            <td>${o.total_items} items</td>
            <td style="font-weight:600;color:#059669;">$${parseFloat(o.total_amount).toFixed(2)}</td>
            <td><span class="order-status status-${o.status}">${o.status}</span></td>
            <td>${formatDate(o.created_at)}</td>
            <td>
                <div class="action-btns">
                    ${actions}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderOrderPipeline(pipeline) {
    const container = document.getElementById('orderPipeline');
    if (!container) return;
    
    container.innerHTML = `
        <div class="pipeline-step">
            <div style="width:60px;height:60px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#92400e;font-size:24px;">
                <i class="fas fa-clock"></i>
            </div>
            <h4>${pipeline.pending || 0}</h4>
            <p>Pending</p>
        </div>
        <div class="pipeline-step">
            <div style="width:60px;height:60px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#1e40af;font-size:24px;">
                <i class="fas fa-box"></i>
            </div>
            <h4>${pipeline.processing || 0}</h4>
            <p>Processing</p>
        </div>
        <div class="pipeline-step">
            <div style="width:60px;height:60px;background:#e0e7ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#3730a3;font-size:24px;">
                <i class="fas fa-shipping-fast"></i>
            </div>
            <h4>${pipeline.shipped || 0}</h4>
            <p>Shipped</p>
        </div>
        <div class="pipeline-step">
            <div style="width:60px;height:60px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#065f46;font-size:24px;">
                <i class="fas fa-check"></i>
            </div>
            <h4>${pipeline.delivered_today || 0}</h4>
            <p>Delivered Today</p>
        </div>
    `;
    
    // Show/hide buttons based on read permission
    const exportBtn = document.querySelector('#ordersView .btn-outline');
    const printBtn = document.querySelector('#ordersView .btn-primary');
    
    if (exportBtn) exportBtn.style.display = can('orders', 'read') ? 'inline-flex' : 'none';
    if (printBtn) printBtn.style.display = can('orders', 'read') ? 'inline-flex' : 'none';
}

// Order actions with privilege checks
function toggleOrderSelection(id) {
    if (selectedOrders.has(id)) {
        selectedOrders.delete(id);
    } else {
        selectedOrders.add(id);
    }
    updateSelectAllCheckbox();
}

function updateSelectAllCheckbox() {
    const selectAll = document.getElementById('selectAllOrders');
    const checkboxes = document.querySelectorAll('.order-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    if (selectAll) selectAll.checked = allChecked;
}

function toggleSelectAllOrders() {
    const selectAll = document.getElementById('selectAllOrders');
    const checkboxes = document.querySelectorAll('.order-checkbox');
    
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
        const id = parseInt(cb.value);
        if (selectAll.checked) {
            selectedOrders.add(id);
        } else {
            selectedOrders.delete(id);
        }
    });
}

function viewOrder(id) {
    if (!can('orders', 'read')) {
        alert('No permission to view orders');
        return;
    }
    
    const order = ordersData.find(o => o.id === id);
    if (!order) return;
    
    const content = document.getElementById('orderDetailContent');
    const footer = document.getElementById('orderModalFooter');
    const canUpdate = can('orders', 'update');
    
    if (content) {
        content.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
                <div>
                    <h4>Order Information</h4>
                    <p><strong>Order #:</strong> ${order.order_number}</p>
                    <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
                    <p><strong>Status:</strong> <span class="order-status status-${order.status}">${order.status}</span></p>
                    <p><strong>Payment:</strong> ${order.payment_status}</p>
                </div>
                <div>
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${escapeHtml(order.username)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(order.email)}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(order.phone || 'N/A')}</p>
                </div>
            </div>
            <div>
                <h4>Shipping Address</h4>
                <p>${escapeHtml(order.shipping_address || 'Not provided')}</p>
            </div>
            <div style="margin-top:20px;">
                <h4>Order Summary</h4>
                <p style="font-size:18px;"><strong>Total:</strong> <span style="color:#059669;">$${parseFloat(order.total_amount).toFixed(2)}</span></p>
            </div>
        `;
    }
    
    // Build footer buttons based on privileges and order status
    if (footer) {
        let footerHtml = `<button class="btn-outline" onclick="closeOrderModal()">Close</button>`;
        
        if (canUpdate && order.status !== 'delivered' && order.status !== 'cancelled') {
            const statuses = ['pending', 'processing', 'shipped', 'delivered'];
            const currentIndex = statuses.indexOf(order.status);
            const nextStatus = statuses[currentIndex + 1];
            
            if (nextStatus) {
                footerHtml += ` <button class="btn-primary" onclick="changeOrderStatus(${order.id}, '${nextStatus}')">Mark as ${nextStatus}</button>`;
            }
            
            footerHtml += ` <button class="btn-outline" style="color:#dc2626;" onclick="changeOrderStatus(${order.id}, 'cancelled')">Cancel Order</button>`;
        }
        
        footer.innerHTML = footerHtml;
    }
    
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'flex';
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

function updateOrderStatus(id) {
    viewOrder(id);
}

function changeOrderStatus(id, newStatus) {
    if (!can('orders', 'update')) {
        alert('No permission to update order status');
        return;
    }
    
    const formData = new FormData();
    formData.append('order_id', id);
    formData.append('status', newStatus);
    
    fetch('../php/update_order_status.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 200) {
            showToast(`Order status updated to ${newStatus}`);
            closeOrderModal();
            loadOrders(orderCurrentPage);
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error updating order:', err);
        showToast('Failed to update order status');
    });
}

function exportOrders() {
    if (!can('orders', 'read')) {
        alert('No permission to export orders');
        return;
    }
    window.open('../php/export_orders.php', '_blank');
}

function bulkPrintLabels() {
    if (!can('orders', 'read')) {
        alert('No permission to print labels');
        return;
    }
    
    if (selectedOrders.size === 0) {
        alert('Please select at least one order');
        return;
    }
    
    window.open(`../php/print_labels.php?ids=${Array.from(selectedOrders).join(',')}`, '_blank');
}

function searchOrders() { loadOrders(1); }
function filterOrders() { loadOrders(1); }
function sortOrders() { loadOrders(1); }

// ================================
// REPORTS MODULE
// ================================
function loadReports() {
    if (!can('reports', 'read')) {
        showToast('No permission to view reports');
        return;
    }
    
    // Initialize date inputs
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const dateFrom = document.getElementById('reportDateFrom');
    const dateTo = document.getElementById('reportDateTo');
    
    if (dateFrom) dateFrom.value = firstDay;
    if (dateTo) dateTo.value = today;
    
    // TODO: Load report data
    console.log('Loading reports...');
}

function selectReportType(type) {
    if (!can('reports', 'read')) return;
    
    document.querySelectorAll('.btn-action').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-${type}`);
    if (btn) btn.classList.add('active');
    
    // TODO: Switch report view
}

function generateReport() {
    if (!can('reports', 'read')) {
        alert('No permission to generate reports');
        return;
    }
    // TODO: Generate report
    showToast('Generating report...');
}

function exportReportPDF() {
    if (!can('reports', 'read')) return;
    window.open('../php/export_report.php?format=pdf', '_blank');
}

function exportReportExcel() {
    if (!can('reports', 'read')) return;
    window.open('../php/export_report.php?format=excel', '_blank');
}

// ================================
// SECURITY LOGS (ORIGINAL WORKING CODE)
// ================================
let adminCurrentPage = 1;
let adminEntriesPerPage = 5;
let adminAllLogs = [];
let adminFilteredLogs = [];

function changeAdminEntriesPerPage() {
    const select = document.getElementById('adminEntriesPerPage');
    adminEntriesPerPage = parseInt(select?.value) || 5;
    adminCurrentPage = 1;
    displayAdminLogsPaginated(adminFilteredLogs.length > 0 ? adminFilteredLogs : adminAllLogs);
}

function displayAdminLogsPaginated(logs) {
    const tbody = document.getElementById('adminLogsTableBody');
    if (!tbody) return;
    
    if (!logs || logs.length === 0) {
        showAdminNoLogs('No security logs found');
        updateAdminPaginationInfo(0, 0, 0);
        generateAdminPaginationButtons(0);
        return;
    }

    const totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / adminEntriesPerPage);

    if (adminCurrentPage > totalPages) adminCurrentPage = totalPages;
    if (adminCurrentPage < 1) adminCurrentPage = 1;

    const start = (adminCurrentPage - 1) * adminEntriesPerPage;
    const end = Math.min(start + adminEntriesPerPage, totalLogs);

    const pageLogs = logs.slice(start, end);
    tbody.innerHTML = '';

    pageLogs.forEach(log => {
        const row = document.createElement('tr');
        const logoutDisplay = log.logoutTime 
            ? formatDateTime(log.logoutTime)
            : '<span class="status-active">Active</span>';

        // Build action buttons based on privileges
        let actionButtons = '';
        
        if (can('security_logs', 'update')) {
            actionButtons += `
                <button class="icon-btn icon-update" onclick="updateLog(${log.id})" title="Update">
                    <i class="fas fa-pen"></i>
                </button>`;
        }
        
        if (can('security_logs', 'block')) {
            actionButtons += `
                <button class="icon-btn icon-block" onclick="blockLog(${log.id})" title="Block">
                    <i class="fas fa-ban"></i>
                </button>`;
        }
        
        if (can('security_logs', 'delete')) {
            actionButtons += `
                <button class="icon-btn icon-delete btn-delete-log" onclick="deleteLog(${log.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>`;
        }

        row.innerHTML = `
            <td>#${log.id}</td>
            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(log.username)}&background=${log.role === 'admin' ? '7c3e2e' : '3b82f6'}&color=fff&size=30" alt="">
                    <div class="user-details">
                        <strong>${escapeHtml(log.username)}</strong>
                    </div>
                </div>
            </td>
            <td><span class="role-badge role-${log.role}">${log.role}</span></td>
            <td><i class="fas fa-${getDeviceIcon(log.device)}"></i> ${escapeHtml(log.device)}</td>
            <td><code>${log.ip}</code></td>
            <td>${formatDateTime(log.loginTime)}</td>
            <td>${logoutDisplay}</td>
            <td><span class="log-status status-${log.status}">${log.status}</span></td>
            <td class="action-icons">${actionButtons}</td>
        `;
        tbody.appendChild(row);
    });

    updateAdminPaginationInfo(start + 1, end, totalLogs);
    generateAdminPaginationButtons(totalPages);
}

function updateAdminPaginationInfo(start, end, total) {
    const startEl = document.getElementById('adminStartEntry');
    const endEl = document.getElementById('adminEndEntry');
    const totalEl = document.getElementById('adminTotalEntries');
    
    if (startEl) startEl.textContent = total ? start : 0;
    if (endEl) endEl.textContent = end;
    if (totalEl) totalEl.textContent = total;
}

function generateAdminPaginationButtons(totalPages) {
    const container = document.getElementById('adminPaginationButtons');
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn prev ${adminCurrentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevBtn.disabled = adminCurrentPage === 1;
    prevBtn.onclick = () => goToAdminPage(adminCurrentPage - 1);
    container.appendChild(prevBtn);

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, adminCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        container.appendChild(createAdminPageButton(1));
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createAdminPageButton(i));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
        container.appendChild(createAdminPageButton(totalPages));
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn next ${adminCurrentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = adminCurrentPage === totalPages;
    nextBtn.onclick = () => goToAdminPage(adminCurrentPage + 1);
    container.appendChild(nextBtn);
}

function createAdminPageButton(num) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${num === adminCurrentPage ? 'active' : ''}`;
    btn.textContent = num;
    btn.onclick = () => goToAdminPage(num);
    return btn;
}

function goToAdminPage(page) {
    const totalPages = Math.ceil((adminFilteredLogs.length || adminAllLogs.length) / adminEntriesPerPage);
    if (page < 1 || page > totalPages) return;
    
    adminCurrentPage = page;
    displayAdminLogsPaginated(adminFilteredLogs.length > 0 ? adminFilteredLogs : adminAllLogs);
    
    if (window.innerWidth <= 768) {
        document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function loadAdminSecurityLogs() {
    // Check read permission first
    if (!can('security_logs', 'read')) {
        const tbody = document.getElementById('adminLogsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center;color:#dc2626;padding:40px;">
                        <i class="fas fa-lock" style="font-size:48px;margin-bottom:10px;"></i>
                        <p>You do not have permission to view security logs.</p>
                    </td>
                </tr>`;
        }
        const paginationButtons = document.getElementById('adminPaginationButtons');
        if (paginationButtons) paginationButtons.innerHTML = '';
        return;
    }
    
    const accountStatus = sessionStorage.getItem('account_status');
    const username = sessionStorage.getItem('username');
    
    if (!accountStatus || !username) {
        showAdminNoLogs('Session expired. Please login again.');
        setTimeout(() => window.location.href = '../html/sign-in.html', 2000);
        return;
    }
    
    const url = `../php/get_security_logs.php?role=${encodeURIComponent(accountStatus)}&username=${encodeURIComponent(username)}`;
    
    // Show loading state
    const tbody = document.getElementById('adminLogsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading security logs...</p>
                </td>
            </tr>`;
    }
    
    fetch(url)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    throw new Error('Server returned non-JSON response');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 200) {
                adminAllLogs = data.logs || [];
                adminFilteredLogs = [...adminAllLogs];
                adminCurrentPage = 1;
                displayAdminLogsPaginated(adminAllLogs);
                window.adminLogs = adminAllLogs;
            } else {
                showAdminNoLogs('Error loading logs: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAdminNoLogs('Failed to load security logs.');
        });
}

function showAdminNoLogs(message) {
    const tbody = document.getElementById('adminLogsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading-state">
                    <i class="fas fa-inbox" style="font-size:48px;color:#cbd5e1;"></i>
                    <p>${message}</p>
                </td>
            </tr>`;
    }
    updateAdminPaginationInfo(0, 0, 0);
    const paginationButtons = document.getElementById('adminPaginationButtons');
    if (paginationButtons) paginationButtons.innerHTML = '';
}

function filterAdminLogs() {
    if (!window.adminLogs) return;
    
    const roleFilterInput = document.getElementById('adminLogRoleFilter');
    const roleFilter = roleFilterInput ? roleFilterInput.value : 'all';
    const statusFilterInput = document.getElementById('adminLogStatusFilter');
    const statusFilter = statusFilterInput ? statusFilterInput.value : 'all';
    const searchInput = document.getElementById('adminLogSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filtered = window.adminLogs.filter(log => {
        const matchRole = roleFilter === 'all' || log.role === roleFilter;
        const matchStatus = statusFilter === 'all' || log.status === statusFilter;
        const matchSearch = log.username.toLowerCase().includes(searchTerm);
        return matchRole && matchStatus && matchSearch;
    });
    
    adminCurrentPage = 1;
    adminFilteredLogs = filtered;
    displayAdminLogsPaginated(filtered);
}

function refreshAdminLogs() {
    loadAdminSecurityLogs();
}

// Security log actions with privilege checks
function updateLog(logId) {
    if (!can('security_logs', 'update')) {
        alert('You do not have permission to update logs.');
        return;
    }
    alert(`Update log ${logId} - implement modal or API call`);
}

function blockLog(logId) {
    if (!can('security_logs', 'block')) {
        alert('You do not have permission to block logs.');
        return;
    }
    alert(`Block log ${logId} - implement API call`);
}

function deleteLog(logId) {
    if (!can('security_logs', 'delete')) {
        alert('You do not have permission to delete logs.');
        return;
    }

    if (!confirm('Are you sure you want to delete this log?')) return;

    fetch(`../php/delete_log.php?id=${logId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                showToast('Log deleted successfully');
                adminFilteredLogs = adminFilteredLogs.filter(l => l.id !== logId);
                adminAllLogs = adminAllLogs.filter(l => l.id !== logId);
                displayAdminLogsPaginated(adminFilteredLogs.length ? adminFilteredLogs : adminAllLogs);
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Failed to delete log.');
        });
}

// ================================
// STAFF MANAGEMENT - DATABASE INTEGRATION ✅
// ================================

function displayAlerts(alertContainer, alerts, type = 'error') {
    const alertHTML = alerts.map(alert => `
        <div class="alert ${type}">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${alert}</span>
        </div>
    `).join('');
    alertContainer.innerHTML = alertHTML;
    alertContainer.scrollIntoView({ behavior: 'smooth' });
}

async function saveStaffMember(staffData) {
    try {
        const response = await fetch('../php/admin_create_account.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(staffData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            return {
                success: true,
                message: result.message,
                data: result
            };
        } else {
            return {
                success: false,
                message: result.message || 'Failed to create account'
            };
        }
    } catch (error) {
        console.error('Error saving staff member:', error);
        return {
            success: false,
            message: 'Error connecting to database: ' + error.message
        };
    }
}

function selectStaffRole(role, event) {
    document.getElementById('staffSelectedRole').value = role;
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    // Show security questions only for users, NOT for admins
    const isUser = role === 'user';
    const secHeader = document.getElementById('securityQuestionsHeader');
    const secQ1 = document.getElementById('secQ1Container');
    const secQ2 = document.getElementById('secQ2Container');
    const secQ3 = document.getElementById('secQ3Container');
    const secA1 = document.getElementById('secA1Container');
    const secA2 = document.getElementById('secA2Container');
    const secA3 = document.getElementById('secA3Container');
    
    if (secHeader) secHeader.style.display = isUser ? 'block' : 'none';
    if (secQ1) secQ1.style.display = isUser ? 'flex' : 'none';
    if (secQ2) secQ2.style.display = isUser ? 'flex' : 'none';
    if (secQ3) secQ3.style.display = isUser ? 'flex' : 'none';
    if (secA1) secA1.style.display = isUser ? 'flex' : 'none';
    if (secA2) secA2.style.display = isUser ? 'flex' : 'none';
    if (secA3) secA3.style.display = isUser ? 'flex' : 'none';
}

function resetForm(form) {
    form.reset();
    const secHeader = document.getElementById('securityQuestionsHeader');
    if (secHeader) secHeader.style.display = 'none';
    
    document.querySelectorAll('[id^="secQ"], [id^="secA"]').forEach(el => {
        if (el.id.includes('Container')) el.style.display = 'none';
    });
    
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
    const userRoleOption = document.querySelector('[onclick*="selectStaffRole(\'user\'"]');
    if (userRoleOption) userRoleOption.classList.add('selected');
    
    const roleInput = document.getElementById('staffSelectedRole');
    if (roleInput) roleInput.value = 'user';
    
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) alertContainer.innerHTML = '';
}

// Initialize staff management form on page load

function validateRegistrationForm(data, requireSecurityQuestions) {
    const errors = [];

    // Basic required fields
    if (!data.first_name || data.first_name.trim() === '') {
        errors.push('First name is required.');
    }
    if (!data.last_name || data.last_name.trim() === '') {
        errors.push('Last name is required.');
    }
    if (!data.username || data.username.trim() === '') {
        errors.push('Username is required.');
    }
    if (!data.email || data.email.trim() === '') {
        errors.push('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Please enter a valid email address.');
    }
    if (!data.password || data.password.trim() === '') {
        errors.push('Password is required.');
    } else if (data.password.length < 8) {
        errors.push('Password must be at least 8 characters.');
    }
    if (data.password !== data.confirm_password) {
        errors.push('Passwords do not match.');
    }

    // Security questions — only required for 'user' role
    if (requireSecurityQuestions) {
        if (!data.security_question_1 || data.security_question_1.trim() === '') {
            errors.push('Security question 1 is required.');
        }
        if (!data.security_answer_1 || data.security_answer_1.trim() === '') {
            errors.push('Answer to security question 1 is required.');
        }
        if (!data.security_question_2 || data.security_question_2.trim() === '') {
            errors.push('Security question 2 is required.');
        }
        if (!data.security_answer_2 || data.security_answer_2.trim() === '') {
            errors.push('Answer to security question 2 is required.');
        }
        if (!data.security_question_3 || data.security_question_3.trim() === '') {
            errors.push('Security question 3 is required.');
        }
        if (!data.security_answer_3 || data.security_answer_3.trim() === '') {
            errors.push('Answer to security question 3 is required.');
        }
    }

    return errors;
}
const initStaffManagement = function() {
    if (typeof displayAge === 'function') {
        displayAge('staffBirthdate', 'staffAgeDisplay');
    }

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const alertContainer = document.getElementById('alertContainer');
            if (alertContainer) alertContainer.innerHTML = '';

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            const role = document.getElementById('staffSelectedRole')?.value || 'user';

            const requireSecurityQuestions = (role === 'user');
            const errors = validateRegistrationForm(data, requireSecurityQuestions);

            if (errors.length > 0) {
                if (alertContainer) displayAlerts(alertContainer, errors, 'error');
                return;
            }

            const result = await saveStaffMember({ ...data, role: role });

            if (result.success) {
                if (alertContainer) {
                    displayAlerts(alertContainer, [
                        `Staff account created successfully! ${data.first_name} ${data.last_name} (${result.data.staff_id}) is now registered as a ${role}.`
                    ], 'success');
                }

                setTimeout(() => {
                    resetForm(this);
                }, 2000);
            } else {
                if (alertContainer) displayAlerts(alertContainer, [result.message], 'error');
            }
        });
    }

    const userRoleOption = document.querySelector('[onclick*="selectStaffRole(\'user\'"]');
    if (userRoleOption) {
        userRoleOption.classList.add('selected');
    }
};

// Call init when DOM is ready
document.addEventListener('DOMContentLoaded', initStaffManagement);

// ================================
// UTILITY FUNCTIONS
// ================================
function renderPagination(containerId, currentPage, totalPages, loadFunctionName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    if (currentPage > 1) {
        html += `<button class="pagination-btn" onclick="${loadFunctionName}(${currentPage - 1})">Previous</button>`;
    }
    html += `<span style="margin:0 10px;">Page ${currentPage} of ${totalPages}</span>`;
    if (currentPage < totalPages) {
        html += `<button class="pagination-btn" onclick="${loadFunctionName}(${currentPage + 1})">Next</button>`;
    }
    container.innerHTML = html;
}

function getDeviceIcon(device) {
    const d = (device || '').toLowerCase();
    if (d.includes('android')) return 'robot';
    if (d.includes('iphone') || d.includes('ipad')) return 'apple';
    if (d.includes('mobile')) return 'mobile-alt';
    if (d.includes('windows')) return 'windows';
    if (d.includes('mac')) return 'apple';
    if (d.includes('linux')) return 'linux';
    return 'desktop';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(datetime) {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString();
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1f2937;color:white;padding:12px 24px;border-radius:8px;z-index:9999;';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// Stub functions for dashboard
function loadStats() { console.log('Loading stats...'); }
function loadTasks() { console.log('Loading tasks...'); }

function logout() {
    const username = sessionStorage.getItem('username');
    if (username) {
        fetch(`../php/loginvalidation.php?action=logout&username=${encodeURIComponent(username)}`)
            .finally(() => {
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            });
    } else {
        sessionStorage.clear();
        window.location.href = '../html/sign-in.html';
    }
}

// Poll every 30 seconds to check if session is still valid
function startSessionCheck() {
    setInterval(async () => {
        try {
            const response = await fetch('../php/check_session.php', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();

            if (response.status === 403 && data.blocked) {
                alert('Your account has been blocked by an administrator. You will be logged out.');
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            } else if (response.status === 401) {
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }, 10000); // every 10 seconds
}

// Start session polling
console.log('Starting session check polling...');
startSessionCheck();

// ============================================
// SECURITY LOGS FILTER FUNCTIONS - UPDATED FOR SINGLE DATE FILTERS
// ============================================

function applyAdminLogFilters() {
    if (!adminAllLogs || adminAllLogs.length === 0) {
        if (typeof showToast === 'function') showToast('No logs to filter');
        return;
    }
    
    const username = document.getElementById('filterUsername')?.value?.toLowerCase() || '';
    const loginDate = document.getElementById('filterLoginDate')?.value || '';
    const logoutDate = document.getElementById('filterLogoutDate')?.value || '';
    
    adminFilteredLogs = adminAllLogs.filter(log => {
        if (username && !log.username.toLowerCase().includes(username)) return false;
        
        if (loginDate && log.loginTime) {
            const logLoginDate = log.loginTime.split(' ')[0];
            if (logLoginDate !== loginDate) return false;
        }
        
        if (logoutDate && log.logoutTime) {
            const logLogoutDate = log.logoutTime.split(' ')[0];
            if (logLogoutDate !== logoutDate) return false;
        }
        
        return true;
    });
    
    adminCurrentPage = 1;
    displayAdminLogsPaginated(adminFilteredLogs);
    
    const resultCount = adminFilteredLogs.length;
    const message = resultCount === 0 ? 'No logs found matching criteria' : `Found ${resultCount} log${resultCount !== 1 ? 's' : ''}`;
    if (typeof showToast === 'function') showToast(message);
}

function clearAdminLogFilters() {
    const filterUsername = document.getElementById('filterUsername');
    const filterLoginDate = document.getElementById('filterLoginDate');
    const filterLogoutDate = document.getElementById('filterLogoutDate');
    
    if (filterUsername) filterUsername.value = '';
    if (filterLoginDate) filterLoginDate.value = '';
    if (filterLogoutDate) filterLogoutDate.value = '';
    
    adminFilteredLogs = [...adminAllLogs];
    adminCurrentPage = 1;
    displayAdminLogsPaginated(adminFilteredLogs);
    if (typeof showToast === 'function') showToast('Filters cleared');
}

function clearAdminLogFilters() {
    console.log('clearAdminLogFilters called');
    
    // Clear all filter inputs (matching your HTML)
    const filterUsername = document.getElementById('filterUsername');
    const filterRole = document.getElementById('filterRole');
    const filterLoginDate = document.getElementById('filterLoginDate');
    const filterLogoutDate = document.getElementById('filterLogoutDate');
    
    if (filterUsername) filterUsername.value = '';
    if (filterRole) filterRole.value = '';
    if (filterLoginDate) filterLoginDate.value = '';
    if (filterLogoutDate) filterLogoutDate.value = '';
    
    // Reset to all logs
    if (adminAllLogs) {
        adminFilteredLogs = [...adminAllLogs];
        adminCurrentPage = 1;
        
        if (typeof displayAdminLogsPaginated === 'function') {
            displayAdminLogsPaginated(adminFilteredLogs);
        }
        
        if (typeof showToast === 'function') showToast('Filters cleared');
    }
}

// ============================================
// MOBILE SIDEBAR TOGGLE FOR ADMIN DASHBOARD
// ============================================

function initMobileSidebar() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.querySelector('.sidebar');
    
    if (!toggleBtn || !overlay || !sidebar) return;
    
    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        // Prevent body scroll when sidebar is open
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }
    
    // Close sidebar function
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Event listeners
    toggleBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    // Close sidebar on window resize above mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 991) {
            closeSidebar();
        }
    });
    
    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });
}

// Initialize mobile sidebar when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileSidebar);
} else {
    initMobileSidebar();
}