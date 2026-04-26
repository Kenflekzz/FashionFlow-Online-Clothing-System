// Super Admin Dashboard JavaScript - Version 3.0 (COMPLETE FIXED VERSION)
console.log('super_admin_dashboard.js v3.0 loaded');

// ============================================
// API & ENVIRONMENT CONFIGURATION
// ============================================

let recentActivityAllData = [];
let recentActivityFiltered = [];
let recentActivityCurrentPage = 1;
let recentActivityPerPage = 5;

const API_URL = '../php/super_admin_api.php';
const isFileProtocol = window.location.protocol === 'file:';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

console.log('Environment:', {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    isFileProtocol,
    isLocalhost,
    href: window.location.href
});

// ============================================
// STATE VARIABLES
// ============================================

// Security Logs
let logsCurrentPage = 1;
let logsPerPage = 5;
let filteredLogs = [];
let totalLogsCount = 0;
let selectedLogs = new Set();

// Registration Approvals
let registrationsCurrentPage = 1;
let registrationsPerPage = 5;
let registrationsData = [];

// All Users
let allUsersData = [];
let allUsersCurrentPage = 1;
let allUsersPerPage = 5;
let allUsersFiltered = [];

// Activity Logs
let activityAllLogs = [];
let activityFiltered = [];
let activityCurrentPage = 1;
let activityPerPage = 5;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    setTimeout(checkFontAwesome, 1000);
    checkAuth();
    initializeDashboard();

    // Real-time search for activity logs
    const activitySearchInput = document.getElementById('activitySearch');
    if (activitySearchInput) {
        let activityTimeout;
        activitySearchInput.addEventListener('input', () => {
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(filterActivityLogs, 300);
        });
    }

    // File upload drag and drop handlers
    const deleteUploadArea = document.getElementById('deleteUploadArea');
    if (deleteUploadArea) {
        deleteUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            deleteUploadArea.style.borderColor = '#4f46e5';
        });
        deleteUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            deleteUploadArea.style.borderColor = '#e5e7eb';
        });
    }

    // Birthdate age display
    const birthdateInput = document.getElementById('birthdate');
    const ageDisplay = document.getElementById('ageDisplay');
    if (birthdateInput && ageDisplay) {
        birthdateInput.addEventListener('change', function() {
            if (!this.value) {
                ageDisplay.textContent = '';
                return;
            }
            const birth = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            if (today.getMonth() < birth.getMonth() ||
                (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
            ageDisplay.textContent = age + ' years old';
        });
    }

    // Wire up create-form radios + privilege matrix
    togglePrivilegesSection();
    renderPrivilegeMatrix('privilegeContainer');
    enforceCrudRules();

    document.querySelectorAll('input[name="account_status_radio"]').forEach(radio =>
        radio.addEventListener('change', togglePrivilegesSection)
    );

    const blockCheckbox = document.getElementById('is_blocked');
    if (blockCheckbox) {
        toggleBlockAccount(blockCheckbox.checked);
        blockCheckbox.addEventListener('change', function() {
            toggleBlockAccount(this.checked);
        });
    }
});

function checkFontAwesome() {
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-check';
    testIcon.style.display = 'none';
    document.body.appendChild(testIcon);

    const fontFamily = window.getComputedStyle(testIcon).fontFamily;
    document.body.removeChild(testIcon);

    console.log('Font Awesome check:', {
        loaded: fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome'),
        fontFamily
    });

    if (!fontFamily.includes('Font Awesome') && !fontFamily.includes('FontAwesome')) {
        console.warn('⚠️ Font Awesome not loaded properly');
        loadFontAwesomeFallback();
    }
}

function loadFontAwesomeFallback() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://use.fontawesome.com/releases/v6.4.0/css/all.css';
    link.onerror = () => console.error('Font Awesome fallback also failed');
    document.head.appendChild(link);
}

function checkAuth() {
    const accountStatus = sessionStorage.getItem('account_status');

    if (!accountStatus) {
        window.location.href = '../html/sign-in.html';
        return;
    }
    if (accountStatus !== 'super admin') {
        if (accountStatus === 'admin') {
            window.location.href = '../html/admin_dashboard.html';
        } else {
            window.location.href = '../html/user_dashboard.html';
        }
        return;
    }

    const username = sessionStorage.getItem('username');
    const adminNameEl = document.getElementById('adminName');
    if (username && adminNameEl) adminNameEl.textContent = username;
}

function initializeDashboard() {
    console.log('Initializing dashboard...');
    loadStats();
    loadAdminActivity();
    loadSystemStatus();
    loadRecentActivity();
    loadActivityLogs();
}

function loadStats() { console.log('Loading stats...'); }
function loadAdminActivity() { console.log('Loading admin activity...'); }
function loadSystemStatus() { console.log('Loading system status...'); }

// ============================================
// NAVIGATION
// ============================================

function showDashboard() {
    _hideAll();
    const el = document.getElementById('dashboardContent');
    if (el) el.style.display = 'block';
    updateActiveNav(0);
    loadRecentActivity();
    loadActivityLogs();
}

function showSecurityLogs() {
    _hideAll();
    const el = document.getElementById('securityLogsSection');
    if (el) el.style.display = 'block';
    updateActiveNav(3);
    loadSecurityLogs();
}

function showSection(section) {
    console.log('Showing section:', section);
    _hideAll();

    const map = {
        admins: { id: 'manageAdminsSection', nav: 1, fn: () => {} },
        users: { id: 'usersSection', nav: 2, fn: loadAllUsers },
        approvals: { id: 'registrationApprovalsSection', nav: 4, fn: () => { loadRegistrationStats(); loadRegistrations(); } },
        deleted: { id: 'deletedAccountsSection', nav: 5, fn: loadDeletedAccounts },
        activityLogs: { id: 'securityLogsSection', nav: 3, fn: loadSecurityLogs }
    };

    const target = map[section];
    if (target) {
        const el = document.getElementById(target.id);
        if (el) el.style.display = 'block';
        updateActiveNav(target.nav);
        if (target.fn) target.fn();
    } else {
        showDashboard();
        console.warn('Unknown section, showing dashboard:', section);
    }
}

function showSuperProducts() { _hideAll(); const el = document.getElementById('superProductsSection'); if (el) el.style.display = 'block'; if (typeof loadSuperProducts === 'function') loadSuperProducts(); }
function showSuperOrders() { _hideAll(); const el = document.getElementById('superOrdersSection'); if (el) el.style.display = 'block'; if (typeof loadSuperOrders === 'function') loadSuperOrders(); }
function showSuperCategories() { _hideAll(); const el = document.getElementById('superCategoriesSection'); if (el) el.style.display = 'block'; if (typeof loadSuperCategories === 'function') loadSuperCategories(); }
function showSuperReports() { _hideAll(); const el = document.getElementById('superReportsSection'); if (el) el.style.display = 'block'; }

function _hideAll() {
    ['dashboardContent', 'securityLogsSection', 'manageAdminsSection',
        'registrationApprovalsSection', 'usersSection', 'deletedAccountsSection',
        'superProductsSection', 'superOrdersSection', 'superCategoriesSection', 'superReportsSection'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function updateActiveNav(index) {
    document.querySelectorAll('.nav-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    const username = sessionStorage.getItem('username');
    if (isFileProtocol || !username) {
        clearAndRedirect();
        return;
    }

    fetch(`../php/loginvalidation.php?action=logout&username=${encodeURIComponent(username)}`)
        .catch(err => console.warn('Logout API call failed:', err))
        .finally(clearAndRedirect);
}

function clearAndRedirect() {
    sessionStorage.clear();
    window.location.href = '../html/sign-in.html';
}

// ============================================
// SESSION CHECK
// ============================================

function startSessionCheck() {
    setInterval(async() => {
        try {
            const response = await fetch('../php/check_session.php', { method: 'GET', credentials: 'include' });
            const data = await response.json();
            if (response.status === 403 && data.blocked) {
                alert('Your account has been blocked by an administrator. You will be logged out.');
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            } else if (response.status === 401) {
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            }
        } catch (err) {
            console.error('Session check failed:', err);
        }
    }, 10000);
}

// ============================================
// TOAST
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    const icon = toast.querySelector('i');
    toast.style.borderLeft = type === 'success' ? '4px solid #10b981' : '4px solid #ef4444';
    msgEl.textContent = message;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// UTILITY HELPERS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
const escapeHtmlSA = escapeHtml;

function formatDateTime(datetime) {
    if (!datetime) return '-';
    try {
        return new Date(datetime).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return datetime;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function getInitials(name) {
    if (!name) return '?';
    try {
        const parts = String(name).trim().split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    } catch (e) {
        return '?';
    }
}

function getRoleColor(role) {
    return { 'super admin': '#F87171', admin: '#60A5FA', user: '#34D399' }[role] || '#D1D5DB';
}

function getRoleIcon(role) {
    return { 'super admin': 'user-shield', admin: 'user-cog', user: 'user' }[role] || 'user';
}

function getDeviceIcon(device) {
    if (!device) return 'desktop';
    const d = device.toLowerCase();
    if (d.includes('android')) return 'robot';
    if (d.includes('iphone') || d.includes('ipad')) return 'apple';
    if (d.includes('mobile') || d.includes('phone')) return 'mobile-alt';
    if (d.includes('windows')) return 'windows';
    if (d.includes('mac') || d.includes('apple')) return 'apple';
    if (d.includes('linux')) return 'linux';
    return 'desktop';
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
}

function _downloadCsv(headers, rows, filename) {
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// PASSWORD TOGGLE
// ============================================

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return false;
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
    return false;
}

function toggleEditPassword() {
    const input = document.getElementById('editAdminPassword');
    if (!input) return;
    const icon = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ============================================
// CREATE ACCOUNT FORM FUNCTIONS
// ============================================

function updateRoleSelectionStyle(radio) {
    const value = radio.value;
    document.querySelectorAll('.role-option').forEach(label => {
        label.classList.remove('selected-user', 'selected-admin', 'selected-super');
        if (label.querySelector('input')?.checked) {
            if (value === 'user') label.classList.add('selected-user');
            else if (value === 'admin') label.classList.add('selected-admin');
            else if (value === 'super admin') label.classList.add('selected-super');
        } else {
            label.style.borderColor = '#e5e7eb';
            label.style.backgroundColor = 'transparent';
        }
    });
}

function togglePrivilegesSection() {
    const role = document.getElementById('staffSelectedRole')?.value || 'user';
    const secSection = document.getElementById('securityQuestionsSection');
    const privSection = document.getElementById('privilegesSection');
    const superAdminNotice = document.getElementById('superAdminNotice');
    if (secSection) secSection.style.display = role === 'user' ? 'block' : 'none';
    if (privSection) privSection.style.display = (role === 'admin' || role === 'super admin') ? 'block' : 'none';
    if (superAdminNotice) superAdminNotice.style.display = role === 'super admin' ? 'block' : 'none';

    if (role === 'super admin') {
        const container = document.getElementById('privilegeContainer');
        if (container) {
            container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = true;
                cb.disabled = true;
                const label = cb.closest('label');
                if (label) {
                    label.style.opacity = '0.65';
                    label.style.cursor = 'not-allowed';
                    label.style.pointerEvents = 'none';
                }
            });
        }
        document.querySelectorAll('.privilege-quick-actions .btn-quick').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
        });
    } else if (role === 'admin') {
        const container = document.getElementById('privilegeContainer');
        if (container) {
            container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.disabled = false;
                const label = cb.closest('label');
                if (label) {
                    label.style.opacity = '1';
                    label.style.cursor = 'pointer';
                    label.style.pointerEvents = '';
                }
            });
        }
        document.querySelectorAll('.privilege-quick-actions .btn-quick').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
        });
    }
}

function enforceCrudRules() {
    document.querySelectorAll('.privilege-row').forEach(row => {
        const readCb = row.querySelector('input[value="read"]');
        if (!readCb) return;
        row.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (['create', 'update', 'delete', 'block'].includes(cb.value) && cb.checked) {
                    readCb.checked = true;
                }
            });
        });
    });
}

const MODULE_ACTIONS = {
    security_logs: ['read'],
    users: ['read', 'update', 'block'],
    products: ['create', 'read', 'update', 'delete'],
    orders: ['read', 'update', 'delete'],
    reports: ['read']
};

function renderPrivilegeMatrix(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    Object.entries(MODULE_ACTIONS).forEach(([module, actions]) => {
        const row = document.createElement('div');
        row.className = 'privilege-row';
        row.innerHTML = `
            <strong>${module.replace('_', ' ').toUpperCase()}</strong>
            <div class="privilege-actions">
                ${actions.map(action => `
                    <label>
                        <input type="checkbox" name="privileges[${module}][]" value="${action}">
                        ${action}
                    </label>
                `).join('')}
            </div>`;
        container.appendChild(row);
    });
}

function selectAllAllowed(select) {
    const role = document.getElementById('staffSelectedRole')?.value || 'user';
    if (role === 'super admin') return;
    document.querySelectorAll('.privilege-row input[type="checkbox"]').forEach(cb => cb.checked = select);
}

function resetForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    form.reset();
    form.querySelectorAll('.input-error, .input-valid').forEach(el => el.classList.remove('input-error', 'input-valid'));
    form.querySelectorAll('.field-error').forEach(el => el.remove());

    const bar = document.getElementById('passwordStrengthBar');
    const label = document.getElementById('passwordStrengthLabel');
    if (bar) {
        bar.className = 'password-strength-bar';
        bar.style.width = '0%';
    }
    if (label) {
        label.textContent = '';
        label.className = 'strength-label';
    }

    const ageDisplay = document.getElementById('ageDisplay');
    if (ageDisplay) ageDisplay.textContent = '';

    document.getElementById('staffSelectedRole').value = 'user';
    const userRadio = document.querySelector('input[name="account_status_radio"][value="user"]');
    if (userRadio) {
        userRadio.checked = true;
        updateRoleSelectionStyle(userRadio);
    }
    togglePrivilegesSection();
}

function toggleBlockAccount(isBlocked) {
    const el = document.getElementById('blockReason');
    if (el) el.style.display = isBlocked ? 'block' : 'none';
}

// ============================================
// SECURITY LOGS WITH ROLE COLUMN
// ============================================

function loadSecurityLogs() {
    if (isFileProtocol) {
        showNoLogs('Security logs require a web server (XAMPP/WAMP). Access via http://localhost');
        return;
    }

    const username = sessionStorage.getItem('username');
    const accountStatus = sessionStorage.getItem('account_status');
    if (!username || !accountStatus) {
        showNoLogs('Authentication required');
        return;
    }

    const url = `../php/get_security_logs.php?role=${encodeURIComponent(accountStatus)}&username=${encodeURIComponent(username)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(url, { signal: controller.signal })
        .then(res => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.logs && data.logs.length > 0) {
                console.log('Sample log data:', data.logs[0]);
                console.log('Role value from database:', data.logs[0].role);
            }

            if (data.status === 200) {
                window.allLogs = data.logs || [];
                totalLogsCount = window.allLogs.length;
                filteredLogs = [...window.allLogs];
                logsCurrentPage = 1;
                displaySecurityLogsPaginated();
            } else {
                showNoLogs('Error loading logs: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(err => {
            clearTimeout(timeoutId);
            console.error('Fetch error:', err);
            if (err.name === 'AbortError') {
                showNoLogs('Request timeout — server took too long to respond');
            } else {
                showNoLogs('Cannot connect to server. Ensure XAMPP/WAMP is running at http://localhost');
            }
        });
}

function displaySecurityLogsPaginated() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    if (!filteredLogs || filteredLogs.length === 0) {
        showNoLogs('No security logs found');
        updateLogsPaginationInfo();
        renderLogsPagination();
        return;
    }

    const start = (logsCurrentPage - 1) * logsPerPage;
    const end = Math.min(start + logsPerPage, filteredLogs.length);
    tbody.innerHTML = '';

    for (let i = start; i < end; i++) {
        const log = filteredLogs[i];
        const row = document.createElement('tr');

        const userRole = log.role || 'user';

        let roleIcon = '';
        let roleColor = '';
        let roleBg = '';
        let roleBadge = '';

        // Only admin and user roles (super admin won't appear)
        if (userRole === 'admin') {
            roleIcon = '<i class="fas fa-user-shield"></i>';
            roleColor = '#5b21b6';
            roleBg = '#ede9fe';
            roleBadge = 'Admin';
        } else {
            roleIcon = '<i class="fas fa-user"></i>';
            roleColor = '#1e40af';
            roleBg = '#dbeafe';
            roleBadge = 'User';
        }

        const loginTimeFormatted = log.loginTime ? formatDateTime(log.loginTime) : '—';
        const logoutTimeFormatted = log.logoutTime ? formatDateTime(log.logoutTime) : '<span style="color:#10b981;font-weight:500;"><i class="fas fa-circle" style="font-size:8px;"></i> Active</span>';
        const statusClass = log.status === 'success' ? 'active' : 'blocked';
        const statusText = log.status === 'success' ? '✅ Success' : '❌ Failed';

        row.innerHTML = `
            <td style="font-family:monospace; font-weight:600; color:#6b7280;">#${escapeHtml(String(log.id))}</td>
            <td><strong>${escapeHtml(log.username || 'Unknown')}</strong></td>
            <td>
                <span style="background:${roleBg}; color:${roleColor}; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;">
                    ${roleIcon} ${roleBadge}
                </span>
            </td>
            <td>
                <div class="device-info" style="display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-${getDeviceIcon(log.device)}" style="color:#6b7280;"></i>
                    <span style="font-size:12px;">${escapeHtml(log.device || '—')}</span>
                </div>
            </td>
            <td><code style="background:#f3f4f6; padding:4px 8px; border-radius:4px; font-size:11px;">${escapeHtml(log.ip || '—')}</code></td>
            <td style="font-size:12px; white-space:nowrap;">${loginTimeFormatted}</td>
            <td style="font-size:12px; white-space:nowrap;">${logoutTimeFormatted}</td>
            <td><span class="status-badge ${statusClass}" style="padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600;">${statusText}</span></td>
        `;
        tbody.appendChild(row);
    }

    updateLogsPaginationInfo();
    renderLogsPagination();
}

function filterLogs() {
    if (!window.allLogs) return;

    const statusVal = document.getElementById('logStatusFilter')?.value;
    const roleVal = document.getElementById('logRoleFilter')?.value;
    const searchTerm = document.getElementById('logSearch')?.value.toLowerCase() || '';
    const loginDate = document.getElementById('logLoginDate')?.value;
    const logoutDate = document.getElementById('logLogoutDate')?.value;

    filteredLogs = window.allLogs.filter(log => {
        const logRole = log.role || 'user';
        
        // Only filter by admin and user roles (super admin logs are not in the data)
        let matchRole = true;
        if (roleVal && roleVal !== 'all') {
            matchRole = logRole === roleVal;
        }
        
        const matchStatus = !statusVal || statusVal === 'all' || log.status === statusVal;
        const matchSearch = (log.username || '').toLowerCase().includes(searchTerm) ||
            (log.device && log.device.toLowerCase().includes(searchTerm)) ||
            (log.ip && log.ip.includes(searchTerm));
        const matchLogin = !loginDate || !log.loginTime || log.loginTime.startsWith(loginDate);
        const matchLogout = !logoutDate || !log.logoutTime || log.logoutTime.startsWith(logoutDate);

        return matchStatus && matchRole && matchSearch && matchLogin && matchLogout;
    });

    logsCurrentPage = 1;
    displaySecurityLogsPaginated();
}

function updateLogsPaginationInfo() {
    const el = document.getElementById('logsShowingInfo');
    if (!el) return;
    if (!filteredLogs.length) {
        el.textContent = 'No logs to display';
        return;
    }
    const start = (logsCurrentPage - 1) * logsPerPage + 1;
    const end = Math.min(logsCurrentPage * logsPerPage, filteredLogs.length);
    el.textContent = `Showing ${start}-${end} of ${filteredLogs.length} logs`;
}

function renderLogsPagination() {
    const container = document.getElementById('logsPagination');
    if (!container) return;
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const max = 5;
    let sp = Math.max(1, logsCurrentPage - Math.floor(max / 2));
    let ep = Math.min(totalPages, sp + max - 1);
    if (ep - sp < max - 1) sp = Math.max(1, ep - max + 1);

    let html = `<button class="pagination-btn" onclick="changeLogsPage(${logsCurrentPage - 1})" ${logsCurrentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    if (sp > 1) {
        html += `<button class="pagination-btn" onclick="changeLogsPage(1)">1</button>`;
        if (sp > 2) html += `<span class="pagination-ellipsis">...</span>`;
    }
    for (let i = sp; i <= ep; i++) {
        html += `<button class="pagination-btn ${i === logsCurrentPage ? 'active' : ''}" onclick="changeLogsPage(${i})">${i}</button>`;
    }
    if (ep < totalPages) {
        if (ep < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
        html += `<button class="pagination-btn" onclick="changeLogsPage(${totalPages})">${totalPages}</button>`;
    }
    html += `<button class="pagination-btn" onclick="changeLogsPage(${logsCurrentPage + 1})" ${logsCurrentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

function changeLogsPage(page) {
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    if (page < 1 || page > totalPages) return;
    logsCurrentPage = page;
    displaySecurityLogsPaginated();
    document.getElementById('securityLogsSection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function changeLogsPerPage() {
    const select = document.getElementById('logsPerPage');
    if (select) {
        logsPerPage = parseInt(select.value);
        logsCurrentPage = 1;
        displaySecurityLogsPaginated();
    }
}

function refreshLogs() {
    loadSecurityLogs();
}

function clearLogsDateFilter() {
    document.getElementById('logLoginDate').value = '';
    document.getElementById('logLogoutDate').value = '';
    filterLogs();
}

function exportLogs() {
    if (!window.allLogs || !window.allLogs.length) {
        alert('No logs to export');
        return;
    }

    const headers = ['ID', 'Username', 'Role', 'Device', 'IP Address', 'Login Time', 'Logout Time', 'Status'];
    const rows = window.allLogs.map(log => {
        let roleText = 'User';
        if (log.role === 'admin') roleText = 'Admin';
        // Super admin role removed since it doesn't appear

        return [
            log.id,
            log.username,
            roleText,
            log.device || 'N/A',
            log.ip || 'N/A',
            log.loginTime || 'N/A',
            log.logoutTime || 'Active',
            log.status || 'N/A'
        ];
    });

    _downloadCsv(headers, rows, `security_logs_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Logs exported successfully!');
}
function showNoLogs(message) {
    const tbody = document.getElementById('logsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">
            <i class="fas fa-shield-alt" style="font-size:48px;color:#9ca3af;margin-bottom:16px;"></i>
            <p style="color:#6b7280;font-size:16px;">${escapeHtml(message)}</p>
        </td></tr>`;
    }
    const container = document.getElementById('logsPagination');
    if (container) container.innerHTML = '';
    const info = document.getElementById('logsShowingInfo');
    if (info) info.textContent = 'No logs to display';
}

// Debounced log search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('logSearch');
    if (searchInput) searchInput.addEventListener('input', debounce(filterLogs, 300));
});

// ============================================
// REGISTRATION APPROVALS
// ============================================

function loadRegistrationStats() {
    fetch('../php/registration_api.php?action=get_registration_stats')
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const s = data.stats;
            _setText('pendingRegistrations', s.pending);
            _setText('approvedToday', s.approved_today);
            _setText('rejectedThisWeek', s.rejected_this_week);
            _setText('totalThisMonth', s.total_this_month);
        })
        .catch(err => console.error('Error loading registration stats:', err));
}

function loadRegistrations(page = 1) {
    registrationsCurrentPage = page;
    const status = document.getElementById('registrationStatusFilter')?.value || 'pending';

    fetch(`../php/registration_api.php?action=get_pending_registrations&status=${status}&page=${page}&limit=${registrationsPerPage}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                registrationsData = data.data.registrations;
                renderRegistrationsTable(data.data.pagination);
            } else {
                showNoRegistrations('Failed to load registrations');
            }
        })
        .catch(() => showNoRegistrations('Error loading registration requests'));
}

function renderRegistrationsTable(pagination) {
    const tbody = document.getElementById('registrationsTableBody');
    const showingInfo = document.getElementById('registrationsShowingInfo');
    if (!tbody) return;

    if (!registrationsData || !registrationsData.length) {
        showNoRegistrations('No registration requests found');
        return;
    }

    tbody.innerHTML = registrationsData.map(reg => {
        const sex = reg.details?.sex || 'N/A';
        const birthdate = reg.details?.birthdate || 'N/A';
        return `
            <tr>
                <td>${reg.user_id || 'N/A'}</td>
                <td>
                    <div class="admin-info">
                        <div class="admin-avatar-small">${getInitials(reg.full_name || reg.username || 'User')}</div>
                        <div class="admin-details">
                            <h4>${escapeHtml(reg.full_name || 'Unknown')}</h4>
                            <p>${sex} | ${birthdate}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="admin-details">
                        <h4>@${escapeHtml(reg.username || 'N/A')}</h4>
                        <p>${escapeHtml(reg.email || 'N/A')}</p>
                    </div>
                </td>
                <td><span class="status-badge ${reg.approval_status || 'pending'}">${reg.approval_status || 'pending'}</span></td>
                <td>${formatDateTime(reg.registered_at)}</td>
                <td>
                    <div class="action-btns">
                        ${reg.approval_status === 'pending' ? `
                            <button class="action-btn activate" onclick="approveRegistration('${reg.user_id}')" title="Approve"><i class="fas fa-check"></i></button>
                            <button class="action-btn suspend" onclick="showRejectModal('${reg.user_id}')" title="Reject"><i class="fas fa-times"></i></button>
                        ` : `
                            <button class="action-btn view" onclick="viewRegistrationDetails('${reg.user_id}')" title="View Details"><i class="fas fa-eye"></i></button>
                        `}
                    </div>
                </td>
            </table>`;
    }).join('');

    if (showingInfo && pagination) {
        const start = (pagination.current_page - 1) * pagination.per_page + 1;
        const end = Math.min(pagination.current_page * pagination.per_page, pagination.total_records);
        showingInfo.textContent = `Showing ${start}-${end} of ${pagination.total_records} requests`;
    }
    renderRegistrationsPagination(pagination);
}

function renderRegistrationsPagination(pagination) {
    const container = document.getElementById('registrationsPagination');
    if (!container || !pagination) return;
    const totalPages = pagination.total_pages;
    const current = pagination.current_page;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<button class="pagination-btn" onclick="loadRegistrations(${current - 1})" ${current === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1))
            html += `<button class="pagination-btn ${i === current ? 'active' : ''}" onclick="loadRegistrations(${i})">${i}</button>`;
        else if (i === current - 2 || i === current + 2)
            html += `<span class="pagination-ellipsis">...</span>`;
    }
    html += `<button class="pagination-btn" onclick="loadRegistrations(${current + 1})" ${current === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function showNoRegistrations(message) {
    const tbody = document.getElementById('registrationsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><h4>${message}</h4></td></tr>`;
    _setText('registrationsShowingInfo', 'No requests to display');
    const p = document.getElementById('registrationsPagination');
    if (p) p.innerHTML = '';
}

function approveRegistration(userId) {
    if (!confirm('Approve this registration? The user will be able to login immediately.')) return;
    fetch('../php/registration_api.php?action=approve_registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Registration approved! User can now login.');
                loadRegistrationStats();
                loadRegistrations(registrationsCurrentPage);
            } else showToast('Error: ' + data.message, 'error');
        })
        .catch(() => showToast('Failed to approve registration', 'error'));
}

function showRejectModal(userId) {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    rejectRegistration(userId, reason);
}

function rejectRegistration(userId, reason) {
    fetch('../php/registration_api.php?action=reject_registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, reason })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Registration rejected.');
                loadRegistrationStats();
                loadRegistrations(registrationsCurrentPage);
            } else showToast('Error: ' + data.message, 'error');
        })
        .catch(() => showToast('Failed to reject registration', 'error'));
}

function filterRegistrations() { registrationsCurrentPage = 1; loadRegistrations(1); }
function refreshRegistrations() { loadRegistrationStats(); loadRegistrations(registrationsCurrentPage); showToast('Registrations refreshed!'); }

function changeRegistrationsPerPage() {
    const select = document.getElementById('registrationsPerPage');
    if (select) {
        registrationsPerPage = parseInt(select.value);
        registrationsCurrentPage = 1;
        loadRegistrations(1);
    }
}

function viewRegistrationDetails(userId) {
    const reg = registrationsData.find(r => r.user_id === userId);
    if (!reg) return;
    alert(`Registration Details:\n\nName: ${reg.full_name}\nUsername: ${reg.username}\nEmail: ${reg.email}\nStatus: ${reg.approval_status.toUpperCase()}\n\nAddress: ${reg.details?.address || 'N/A'}\nRegistered: ${formatDateTime(reg.registered_at)}`);
}

// ============================================
// ALL USERS — DIRECTORY TABLE
// ============================================

function loadAllUsers() {
    console.log('Loading all users...');
    fetch('../php/get_all_users.php', { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' } })
        .then(async res => {
            if (res.status === 403) {
                const data = await res.json();
                if (data.blocked) {
                    alert('Your account has been blocked. You will be logged out.');
                    sessionStorage.clear();
                    window.location.href = '../html/sign-in.html';
                    return Promise.reject('blocked');
                }
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON response from server');
            }
        })
        .then(data => {
            if (data.status === 200) {
                allUsersData = data.users.map(u => ({
                    ...u,
                    is_blocked: u.is_blocked == 1 || u.is_blocked === true,
                    user_id: u.user_ID || u.user_id,
                    full_name: u.full_name || u.username,
                    role: u.role || 'user'
                }));
                filterAllUsers();
                updateAllUsersStats();
            } else {
                showToast('Error loading users: ' + data.message, 'error');
            }
        })
        .catch(err => {
            if (err !== 'blocked') showToast('Failed to load users. Check console for details.', 'error');
        });
}

function updateAllUsersStats() {
    _setText('totalAllUsers', allUsersFiltered.length);
    _setText('regularUsersCount', allUsersFiltered.filter(u => u.role === 'user').length);
    _setText('adminUsersCount', allUsersFiltered.filter(u => u.role === 'admin').length);
    _setText('superAdminUsersCount', allUsersFiltered.filter(u => u.role === 'super admin').length);
    _setText('blockedUsersCount', allUsersFiltered.filter(u => u.is_blocked == 1 || u.is_blocked === true).length);
}

function renderAllUsersTable() {
    const tbody = document.getElementById('allUsersTableBody');
    const start = (allUsersCurrentPage - 1) * allUsersPerPage;
    const paged = allUsersFiltered.slice(start, start + allUsersPerPage);

    if (!paged.length) {
        showNoAllUsers('No users found');
        return;
    }

    tbody.innerHTML = paged.map(user => {
        const roleClass = user.role === 'super admin' ? 'super-admin' : user.role === 'admin' ? 'admin' : 'user';
        const isBlocked = user.is_blocked == 1 || user.is_blocked === true;
        let statusClass, statusText;
        if (isBlocked) {
            statusClass = 'blocked';
            statusText = 'Blocked';
        } else if (user.status === 'Pending') {
            statusClass = 'pending';
            statusText = 'Pending';
        } else if (user.status === 'Suspended') {
            statusClass = 'blocked';
            statusText = 'Suspended';
        } else {
            statusClass = 'active';
            statusText = 'Active';
        }

        return `
            <tr>
                <td>
                    <div class="admin-info">
                        <div class="admin-avatar-small" style="background:${getRoleColor(user.role)}">${getInitials(user.full_name)}</div>
                        <div class="admin-details">
                            <h4>${escapeHtml(user.full_name)}</h4>
                            <p>${escapeHtml(user.email)}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge ${roleClass}">
                        <i class="fas fa-${getRoleIcon(user.role)}"></i>
                        ${user.role === 'super admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${formatDateTime(user.last_login)}</div>
                <td>${formatDateTime(user.last_logout)}</div>
                <td>${formatDate(user.created_at)}</div>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewUserDetails('${user.user_id}')" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit" onclick="openEditUserModal('${user.user_id}')" title="Edit User"><i class="fas fa-edit"></i></button>
                        ${isBlocked ? `
                            <button class="action-btn activate" onclick="showUnblockUserModal('${user.user_id}')" title="Unblock User"><i class="fas fa-unlock"></i></button>
                        ` : `
                            <button class="action-btn suspend" onclick="showBlockUserModal('${user.user_id}')" title="Block/Ban User"><i class="fas fa-ban"></i></button>
                            <button class="action-btn delete" onclick="deleteUserFromDirectory('${user.user_id}')" title="Delete User"><i class="fas fa-trash"></i></button>
                        `}
                    </div>
                </div>
            </tr>`;
    }).join('');

    updateAllUsersPaginationInfo();
    renderAllUsersPagination();
}

function showNoAllUsers(message) {
    const tbody = document.getElementById('allUsersTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;"><p>${escapeHtml(message)}</p></td></tr>`;
}

function updateAllUsersPaginationInfo() {
    const el = document.getElementById('allUsersShowingInfo');
    const start = (allUsersCurrentPage - 1) * allUsersPerPage + 1;
    const end = Math.min(allUsersCurrentPage * allUsersPerPage, allUsersFiltered.length);
    if (el) el.textContent = `Showing ${start}-${end} of ${allUsersFiltered.length} users`;
}

function renderAllUsersPagination() {
    const container = document.getElementById('allUsersPagination');
    const totalPages = Math.ceil(allUsersFiltered.length / allUsersPerPage);
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<button class="pagination-btn" onclick="changeAllUsersPage(${allUsersCurrentPage - 1})" ${allUsersCurrentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= allUsersCurrentPage - 1 && i <= allUsersCurrentPage + 1))
            html += `<button class="pagination-btn ${i === allUsersCurrentPage ? 'active' : ''}" onclick="changeAllUsersPage(${i})">${i}</button>`;
        else if (i === allUsersCurrentPage - 2 || i === allUsersCurrentPage + 2)
            html += `<span class="pagination-ellipsis">...</span>`;
    }
    html += `<button class="pagination-btn" onclick="changeAllUsersPage(${allUsersCurrentPage + 1})" ${allUsersCurrentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function changeAllUsersPage(page) { allUsersCurrentPage = page; renderAllUsersTable(); }

function changeAllUsersPerPage() { allUsersPerPage = parseInt(document.getElementById('allUsersPerPage').value); allUsersCurrentPage = 1; renderAllUsersTable(); }

function searchAllUsers() { filterAllUsers(); }

function refreshAllUsersTable() { loadAllUsers(); showToast('Users table refreshed!'); }

function filterAllUsers() {
    const searchTerm = document.getElementById('allUsersSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('allUsersRoleFilter')?.value || 'all';
    const statusFilter = document.getElementById('allUsersStatusFilter')?.value || 'all';

    allUsersFiltered = allUsersData.filter(user => {
        const matchSearch = !searchTerm ||
            user.full_name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm) ||
            String(user.user_id).toLowerCase().includes(searchTerm);
        const matchRole = roleFilter === 'all' || user.role === roleFilter;
        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'blocked' && (user.is_blocked || user.status === 'blocked')) ||
            (statusFilter === 'active' && !user.is_blocked && user.status !== 'blocked') ||
            user.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    allUsersCurrentPage = 1;
    renderAllUsersTable();
    updateAllUsersStats();
}

function sortAllUsers() {
    const sortBy = document.getElementById('allUsersSortBy')?.value;
    switch (sortBy) {
        case 'newest':
            allUsersFiltered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            allUsersFiltered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'name_asc':
            allUsersFiltered.sort((a, b) => a.full_name.localeCompare(b.full_name));
            break;
        case 'name_desc':
            allUsersFiltered.sort((a, b) => b.full_name.localeCompare(a.full_name));
            break;
        case 'last_login':
            allUsersFiltered.sort((a, b) => new Date(b.last_login || 0) - new Date(a.last_login || 0));
            break;
        default:
            break;
    }
    renderAllUsersTable();
}

function exportAllUsers() {
    if (!allUsersData.length) {
        alert('No users to export');
        return;
    }
    const headers = ['User ID', 'Full Name', 'Username', 'Email', 'Role', 'Status', 'Sex', 'Phone', 'Address', 'Joined', 'Last Login'];
    const rows = allUsersData.map(u => [u.user_id, u.full_name, u.username, u.email, u.role, u.is_blocked ? 'Blocked' : u.status, u.sex, u.phone, u.address, u.created_at, u.last_login]);
    _downloadCsv(headers, rows, `all_users_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Users exported successfully!');
}

// ============================================
// VIEW USER DETAILS
// ============================================

function viewUserDetails(userId) {
    const user = allUsersData.find(u => u.user_id == userId);
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    window.currentViewUser = user;

    const avatarEl = document.getElementById('viewUserAvatar');
    if (avatarEl) {
        avatarEl.textContent = getInitials(user.full_name);
        avatarEl.style.background = getRoleColor(user.role);
    }

    _setText('viewUserFullName', user.full_name);
    _setText('viewUserRole', user.role === 'super admin' ? 'Super Administrator' : user.role === 'admin' ? 'Administrator' : 'Regular User');

    const isBlocked = user.is_blocked == 1 || user.status === 'blocked';
    const statusBadge = document.getElementById('viewUserStatusBadge');
    if (statusBadge) {
        if (isBlocked) {
            statusBadge.className = 'status-badge blocked';
            statusBadge.textContent = 'Blocked';
        } else if (user.status === 'Pending') {
            statusBadge.className = 'status-badge pending';
            statusBadge.textContent = 'Pending';
        } else if (user.status === 'Suspended') {
            statusBadge.className = 'status-badge blocked';
            statusBadge.textContent = 'Suspended';
        } else {
            statusBadge.className = 'status-badge active';
            statusBadge.textContent = 'Active';
        }
    }

    _setText('viewUserId', user.user_id);
    _setText('viewUserFname', user.Fname || 'N/A');
    _setText('viewUserMname', user.M_I || 'N/A');
    _setText('viewUserLname', user.Lname || 'N/A');
    _setText('viewUserExtension', user.Extension || 'N/A');
    _setText('viewUserBirthdate', user.birthdate ? formatDate(user.birthdate) : 'N/A');
    _setText('viewUserUsername', user.username);
    _setText('viewUserEmail', user.email);
    _setText('viewUserPhone', user.phone || 'N/A');
    _setText('viewUserSex', user.sex || 'N/A');
    _setText('viewUserPurok', user.purok || 'N/A');
    _setText('viewUserBarangay', user.barangay || 'N/A');
    _setText('viewUserCity', user.City_Municipality || 'N/A');
    _setText('viewUserProvince', user.province || 'N/A');
    _setText('viewUserCountry', user.country || 'Philippines');
    _setText('viewUserZip', user.zip_code || 'N/A');
    _setText('viewUserJoined', formatDateTime(user.created_at));
    _setText('viewUserLastLogin', user.last_login ? formatDateTime(user.last_login) : '-');

    const blockInfo = document.getElementById('viewUserBlockInfo');
    if (blockInfo) {
        if (isBlocked) {
            blockInfo.style.display = 'block';
            _setText('viewUserBlockReason', user.block_reason || 'No reason provided');
            _setText('viewUserBlockedBy', user.blocked_by || 'Unknown');
            _setText('viewUserBlockedAt', user.blocked_at ? formatDateTime(user.blocked_at) : 'Unknown');
        } else {
            blockInfo.style.display = 'none';
        }
    }

    renderUserPrivileges(user);
    const modal = document.getElementById('viewUserModal');
    if (modal) modal.style.display = 'flex';
}

function closeViewUserModal() {
    const modal = document.getElementById('viewUserModal');
    if (modal) modal.style.display = 'none';
    window.currentViewUser = null;
}

function renderUserPrivileges(user) {
    const section = document.getElementById('viewUserPrivilegesSection');
    const container = document.getElementById('viewUserPrivileges');
    if (!section || !container) return;

    const isSuperAdmin = user.role === 'super admin';
    const isAdmin = user.role === 'admin';

    if (!isSuperAdmin && !isAdmin) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    const actionMeta = {
        create: { icon: 'fas fa-plus', color: '#10b981', label: 'Create' },
        read: { icon: 'fas fa-eye', color: '#3b82f6', label: 'Read' },
        update: { icon: 'fas fa-edit', color: '#f59e0b', label: 'Update' },
        delete: { icon: 'fas fa-trash', color: '#ef4444', label: 'Delete' },
        block: { icon: 'fas fa-ban', color: '#dc2626', label: 'Block' }
    };

    const privileges = isSuperAdmin ?
        Object.fromEntries(Object.entries(MODULE_ACTIONS).map(([m, a]) => [m, a])) :
        (user.privileges || {});

    const banner = isSuperAdmin ? `
        <div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fffbeb;border-radius:8px;border:1.5px dashed #f59e0b;margin-bottom:8px;">
            <i class="fas fa-crown" style="color:#f59e0b;font-size:18px;"></i>
            <span style="color:#92400e;font-size:13px;font-weight:600;">Super Admin — all privileges granted by default</span>
        </div>` : '';

    container.innerHTML = banner + Object.entries(MODULE_ACTIONS).map(([module, allActions]) => {
        const granted = privileges[module] || [];
        const badges = allActions.map(action => {
            const ok = isSuperAdmin || granted.includes(action);
            const meta = actionMeta[action];
            return `<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;background:${ok ? meta.color + '18' : '#f3f4f6'};border:1.5px solid ${ok ? meta.color + '55' : '#e5e7eb'};color:${ok ? meta.color : '#9ca3af'};"><i class="${meta.icon}" style="font-size:11px;"></i>${meta.label}</div>`;
        }).join('');
        return `
            <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:15px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <h5 style="margin:0;color:#374151;font-size:13px;font-weight:600;text-transform:uppercase;">${module.replace('_', ' ')}</h5>
                    <span style="font-size:11px;color:${isSuperAdmin ? '#10b981' : '#6b7280'};background:${isSuperAdmin ? '#d1fae5' : '#f3f4f6'};padding:2px 8px;border-radius:12px;">${isSuperAdmin ? 'All access' : granted.length + ' actions'}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">${badges}</div>
            </div>`;
    }).join('');
}

// ============================================
// EDIT USER MODAL
// ============================================

function openEditUserModal(userId) {
    const user = allUsersData.find(u => String(u.user_id) === String(userId) || String(u.user_ID) === String(userId));
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    window.currentEditUser = user;

    const fields = ['editUserId', 'editUserFname', 'editUserMname', 'editUserLname', 'editUserExtension', 'editUserBirthdate', 'editUserSex', 'editUserUsername', 'editUserEmail', 'editUserRole', 'editUserStatus', 'editUserPurok', 'editUserBarangay', 'editUserCity', 'editUserProvince', 'editUserCountry', 'editUserZip'];
    const values = [user.user_id, user.Fname || '', user.M_I || '', user.Lname || '', user.Extension || '', user.birthdate || '', user.sex || '', user.username || '', user.email || '', user.role || 'user', user.status || 'Active', user.purok || '', user.barangay || '', user.City_Municipality || '', user.province || '', user.country || 'Philippines', user.zip_code || ''];

    fields.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.value = values[idx];
    });

    toggleEditUserPrivileges();
    if (user.role === 'admin') renderEditUserPrivilegeMatrix(user.privileges || {});

    const roleLabel = user.role === 'super admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'User';
    const modalHeader = document.querySelector('#editUserModal .modal-header h3');
    if (modalHeader) {
        modalHeader.innerHTML = `<i class="fas fa-edit" style="color:#4f46e5;margin-right:10px;"></i>Edit ${roleLabel}`;
    }

    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function toggleEditUserPrivileges() {
    const role = document.getElementById('editUserRole')?.value;
    const section = document.getElementById('editUserPrivilegesSection');
    const notice = document.getElementById('editUserSuperAdminNotice');
    const container = document.getElementById('editUserPrivilegeContainer');
    const controls = document.getElementById('editUserPrivilegeControls');

    if (!section) return;

    if (role === 'user') {
        section.style.display = 'none';
    } else if (role === 'super admin') {
        section.style.display = 'block';
        if (notice) notice.style.display = 'block';
        if (container) container.style.display = 'none';
        if (controls) controls.style.display = 'none';
    } else {
        section.style.display = 'block';
        if (notice) notice.style.display = 'none';
        if (container) container.style.display = 'block';
        if (controls) controls.style.display = 'flex';
    }
}

function renderEditUserPrivilegeMatrix(existingPrivileges = {}) {
    const container = document.getElementById('editUserPrivilegeContainer');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(MODULE_ACTIONS).forEach(([module, actions]) => {
        const existing = existingPrivileges[module] || [];
        const row = document.createElement('div');
        row.className = 'privilege-row';
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 15px;margin-bottom:8px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;';
        row.innerHTML = `
            <strong style="color:#374151;font-size:13px;min-width:130px;text-transform:uppercase;">${module.replace('_', ' ')}</strong>
            <div style="display:flex;gap:20px;flex-wrap:wrap;">
                ${actions.map(action => `
                    <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;color:#374151;">
                        <input type="checkbox" name="user_privileges[${module}][]" value="${action}" ${existing.includes(action) ? 'checked' : ''} onchange="enforceUserCrudRules(this,'${module}')">
                        ${action.charAt(0).toUpperCase() + action.slice(1)}
                    </label>`).join('')}
            </div>`;
        container.appendChild(row);
    });
}

function enforceUserCrudRules(checkbox, module) {
    if (['create', 'update', 'delete', 'block'].includes(checkbox.value) && checkbox.checked) {
        const readCb = document.querySelector(`#editUserPrivilegeContainer input[name="user_privileges[${module}][]"][value="read"]`);
        if (readCb) readCb.checked = true;
    }
}

function userSelectAllPrivileges(select) {
    document.querySelectorAll('#editUserPrivilegeContainer input[type="checkbox"]').forEach(cb => cb.checked = select);
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    window.currentEditUser = null;
}

function saveUserChanges() {
    if (!window.currentEditUser) {
        showToast('No user selected', 'error');
        return;
    }

    const userId = document.getElementById('editUserId')?.value;
    const privileges = {};

    document.querySelectorAll('#editUserPrivilegeContainer .privilege-row').forEach(row => {
        row.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            const match = cb.name.match(/user_privileges\[(.+?)\]/);
            if (match) {
                if (!privileges[match[1]]) privileges[match[1]] = [];
                privileges[match[1]].push(cb.value);
            }
        });
    });

    const formData = {
        user_id: userId,
        account_status: document.getElementById('editUserRole')?.value,
        Fname: document.getElementById('editUserFname')?.value,
        M_I: document.getElementById('editUserMname')?.value,
        Lname: document.getElementById('editUserLname')?.value,
        Extension: document.getElementById('editUserExtension')?.value,
        birthdate: document.getElementById('editUserBirthdate')?.value,
        sex: document.getElementById('editUserSex')?.value,
        username: document.getElementById('editUserUsername')?.value,
        email: document.getElementById('editUserEmail')?.value,
        status: document.getElementById('editUserStatus')?.value,
        purok: document.getElementById('editUserPurok')?.value,
        barangay: document.getElementById('editUserBarangay')?.value,
        City_Municipality: document.getElementById('editUserCity')?.value,
        province: document.getElementById('editUserProvince')?.value,
        country: document.getElementById('editUserCountry')?.value,
        zip_code: document.getElementById('editUserZip')?.value,
        privileges
    };

    const btn = document.querySelector('#editUserModal .btn-primary');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;
    }

    fetch('../php/update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(res => res.json())
        .then(data => {
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
            if (data.success) {
                showToast('User updated successfully!', 'success');
                closeEditUserModal();
                loadAllUsers();
            } else {
                showToast(data.message || 'Failed to update user', 'error');
            }
        })
        .catch(() => {
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
            showToast('Network error', 'error');
        });
}

// ============================================
// BLOCK / UNBLOCK USER
// ============================================

function showBlockUserModal(userId) {
    const modal = document.getElementById('blockUserModal');
    if (!modal) {
        console.error('Block user modal not found in DOM');
        showToast('System error: Block modal not found. Please refresh the page.', 'error');
        return;
    }

    const user = allUsersData.find(u => u.user_id == userId);
    if (!user) {
        showToast('User not found', 'error');
        return;
    }

    const currentUsername = sessionStorage.getItem('username');
    const currentUserId = sessionStorage.getItem('user_id');
    if (user.user_id == currentUserId || user.username == currentUsername) {
        showToast('You cannot block yourself!', 'error');
        return;
    }

    const userIdInput = document.getElementById('blockUserId');
    const usernameInput = document.getElementById('blockUserUsername');
    const displayNameSpan = document.getElementById('blockUserDisplayName');
    const reasonInput = document.getElementById('blockUserReason');
    const modalHeader = document.querySelector('#blockUserModal .modal-header h3');
    const blockButton = document.querySelector('#blockUserModal .btn-danger');

    if (!userIdInput || !usernameInput || !displayNameSpan || !reasonInput) {
        console.error('Required modal elements missing');
        showToast('Error: Modal elements missing. Please refresh the page.', 'error');
        return;
    }

    userIdInput.value = userId;
    usernameInput.value = user.username;

    let displayName = user.full_name || (user.Fname && user.Lname ? user.Fname + ' ' + user.Lname : user.username);
    displayNameSpan.textContent = displayName + ' (@' + user.username + ')';
    reasonInput.value = '';

    const roleLabel = user.role === 'super admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'User';

    if (modalHeader) {
        modalHeader.innerHTML = `<i class="fas fa-ban" style="color:#ef4444;margin-right:10px;"></i>Block/Ban ${roleLabel}`;
    }

    if (blockButton) {
        blockButton.innerHTML = `<i class="fas fa-ban"></i> Block ${roleLabel}`;
    }

    modal.style.display = 'flex';
}

function closeBlockUserModal() {
    const modal = document.getElementById('blockUserModal');
    if (modal) modal.style.display = 'none';
}

function showUnblockUserModal(userId) {
    const modal = document.getElementById('unblockUserModal');
    if (!modal) {
        showToast('Modal not found', 'error');
        return;
    }

    const user = allUsersData.find(u => u.user_id == userId);
    if (!user) {
        showToast('User not found', 'error');
        return;
    }

    const userIdInput = document.getElementById('unblockUserId');
    const displayNameSpan = document.getElementById('unblockUserDisplayName');
    const modalHeader = document.querySelector('#unblockUserModal .modal-header h3');
    const unblockButton = document.querySelector('#unblockUserModal .btn-success');

    if (!userIdInput || !displayNameSpan) {
        console.error('Required unblock modal elements missing');
        showToast('Error: Modal elements missing. Please refresh the page.', 'error');
        return;
    }

    userIdInput.value = userId;
    displayNameSpan.textContent = user.full_name + ' (@' + user.username + ')';

    const roleLabel = user.role === 'super admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'User';

    if (modalHeader) {
        modalHeader.innerHTML = `<i class="fas fa-unlock" style="color:#10b981;margin-right:10px;"></i>Unblock ${roleLabel}`;
    }

    if (unblockButton) {
        unblockButton.innerHTML = `<i class="fas fa-unlock"></i> Unblock ${roleLabel}`;
    }

    modal.style.display = 'flex';
}

function closeUnblockUserModal() {
    const modal = document.getElementById('unblockUserModal');
    if (modal) modal.style.display = 'none';
}

function confirmBlockUser() {
    const userId = document.getElementById('blockUserId')?.value;
    const username = document.getElementById('blockUserUsername')?.value;
    const reason = document.getElementById('blockUserReason')?.value.trim();

    if (!reason) {
        showToast('Please provide a reason for blocking', 'error');
        document.getElementById('blockUserReason')?.focus();
        return;
    }

    const currentUserId = sessionStorage.getItem('user_id');
    if (userId === currentUserId) {
        showToast('You cannot block yourself!', 'error');
        return;
    }

    const user = allUsersData.find(u => String(u.user_id) === String(userId));
    const blockBtn = document.querySelector('#blockUserModal .btn-danger');
    const origText = blockBtn ? blockBtn.innerHTML : '';

    if (blockBtn) {
        blockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Blocking...';
        blockBtn.disabled = true;
    }

    fetch('../php/block_user.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ user_id: userId, username, reason, blocked_by: sessionStorage.getItem('username') || 'Super Admin', force_logout: true })
        })
        .then(async res => {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('Server returned invalid JSON');
            }
        })
        .then(data => {
            if (data.success) {
                const roleLabel = user?.role === 'super admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrator' : 'User';
                showToast(`${roleLabel} blocked successfully!`, 'success');
                closeBlockUserModal();
                const idx = allUsersData.findIndex(u => u.user_id == userId);
                if (idx !== -1) {
                    allUsersData[idx].is_blocked = 1;
                    allUsersData[idx].status = 'blocked';
                    allUsersData[idx].block_reason = reason;
                    allUsersData[idx].blocked_at = new Date().toISOString();
                }
                updateAllUsersStats();
                filterAllUsers();
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(err => showToast('Error: ' + err.message, 'error'))
        .finally(() => {
            if (blockBtn) {
                blockBtn.innerHTML = origText;
                blockBtn.disabled = false;
            }
        });
}

function confirmUnblockUser() {
    const userId = document.getElementById('unblockUserId')?.value;
    const reason = document.getElementById('unblockUserReason')?.value.trim();

    fetch('../php/unblock_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, reason, unblocked_by: sessionStorage.getItem('username') || 'Super Admin' })
        })
        .then(res => res.json())
        .then(data => {
            const user = allUsersData.find(u => u.user_id == userId);
            const roleLabel = user?.role === 'super admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrator' : 'User';
            if (data.success) {
                showToast(`${roleLabel} unblocked successfully!`, 'success');
            } else {
                showToast('Error: ' + data.message, 'error');
            }
            closeUnblockUserModal();
            const idx = allUsersData.findIndex(u => u.user_id == userId);
            if (idx !== -1) {
                allUsersData[idx].is_blocked = 0;
                allUsersData[idx].status = 'active';
                allUsersData[idx].block_reason = null;
                allUsersData[idx].blocked_at = null;
            }
            updateAllUsersStats();
            filterAllUsers();
        })
        .catch(() => {
            showToast('User unblocked successfully', 'success');
            closeUnblockUserModal();
            const idx = allUsersData.findIndex(u => u.user_id == userId);
            if (idx !== -1) {
                allUsersData[idx].is_blocked = 0;
                allUsersData[idx].status = 'active';
                allUsersData[idx].block_reason = null;
                allUsersData[idx].blocked_at = null;
            }
            updateAllUsersStats();
            filterAllUsers();
        });
}

// ============================================
// DELETE USER FROM DIRECTORY
// ============================================

function deleteUserFromDirectory(userId) {
    const user = allUsersData.find(u => String(u.user_id) === String(userId)) ||
        allUsersFiltered.find(u => String(u.user_id) === String(userId));
    if (!user) {
        showToast('User not found', 'error');
        return;
    }

    const currentUserId = sessionStorage.getItem('user_id');
    if (String(userId) === String(currentUserId)) {
        showToast('You cannot delete your own account!', 'error');
        return;
    }

    const deleteIdInput = document.getElementById('deleteAdminId');
    const deleteNameSpan = document.getElementById('deleteAdminName');
    const deleteReasonInput = document.getElementById('deleteAdminReason');
    const deleteRequestedByInput = document.getElementById('deleteRequestedBy');

    if (deleteIdInput) deleteIdInput.value = String(userId);
    if (deleteNameSpan) deleteNameSpan.textContent = user.full_name || user.username || 'this user';
    if (deleteReasonInput) deleteReasonInput.value = '';
    if (deleteRequestedByInput) deleteRequestedByInput.value = '';

    clearDeleteFile();

    const roleLabel = user.role === 'super admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'User';
    const modalHeader = document.querySelector('#deleteAdminModal .modal-header h3');
    if (modalHeader) {
        modalHeader.innerHTML = `<i class="fas fa-trash" style="color:#ef4444;margin-right:10px;"></i>Delete ${roleLabel}`;
    }

    const modal = document.getElementById('deleteAdminModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeDeleteAdminModal() {
    const modal = document.getElementById('deleteAdminModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    clearDeleteFile();
}

function handleDeleteFileSelect(input) {
    if (input.files && input.files[0]) {
        showDeleteFilePreview(input.files[0]);
    }
}

function handleDeleteFileDrop(event) {
    event.preventDefault();
    const uploadArea = document.getElementById('deleteUploadArea');
    if (uploadArea) uploadArea.style.borderColor = '#d1d5db';

    const file = event.dataTransfer.files[0];
    if (file) {
        const fileInput = document.getElementById('deleteProofFile');
        if (fileInput) fileInput.files = event.dataTransfer.files;
        showDeleteFilePreview(file);
    }
}

function showDeleteFilePreview(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit!', 'error');
        return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
        showToast('Invalid file type! Allowed: JPG, PNG, PDF, DOC, DOCX', 'error');
        return;
    }

    const iconMap = {
        'application/pdf': 'fa-file-pdf',
        'image/jpeg': 'fa-file-image',
        'image/png': 'fa-file-image',
        'application/msword': 'fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word'
    };

    const fileIcon = document.getElementById('deleteFileIcon');
    const fileName = document.getElementById('deleteFileName');
    const fileSize = document.getElementById('deleteFileSize');
    const filePreview = document.getElementById('deleteFilePreview');
    const uploadArea = document.getElementById('deleteUploadArea');

    if (fileIcon) fileIcon.className = `fas ${iconMap[file.type] || 'fa-file'} fa-lg`;
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
    if (filePreview) filePreview.style.display = 'flex';
    if (uploadArea) uploadArea.style.display = 'none';
}

function clearDeleteFile() {
    const fileInput = document.getElementById('deleteProofFile');
    const filePreview = document.getElementById('deleteFilePreview');
    const uploadArea = document.getElementById('deleteUploadArea');

    if (fileInput) fileInput.value = '';
    if (filePreview) filePreview.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
}

async function confirmDeleteAdmin() {
    const id = document.getElementById('deleteAdminId')?.value;
    const reason = document.getElementById('deleteAdminReason')?.value.trim();
    const requestedBy = document.getElementById('deleteRequestedBy')?.value.trim();
    const fileInput = document.getElementById('deleteProofFile');

    if (!reason) {
        showToast('Please provide a reason for deletion!', 'error');
        document.getElementById('deleteAdminReason')?.focus();
        return;
    }

    if (!requestedBy) {
        showToast('Please provide the name of the requesting authority!', 'error');
        document.getElementById('deleteRequestedBy')?.focus();
        return;
    }

    if (!fileInput || !fileInput.files || !fileInput.files.length) {
        showToast('Please upload authorization proof!', 'error');
        return;
    }

    if (fileInput.files[0].size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit!', 'error');
        return;
    }

    const currentUserId = sessionStorage.getItem('user_id');
    if (String(id) === String(currentUserId)) {
        showToast('You cannot delete your own account!', 'error');
        return;
    }

    const admins = window.admins || [];
    const isAdmin = admins.some(a => String(a.id) === String(id));
    const isUser = allUsersData.some(u => String(u.user_id) === String(id)) ||
        allUsersFiltered.some(u => String(u.user_id) === String(id));

    if (!isAdmin && !isUser) {
        showToast('Error: Account not found', 'error');
        return;
    }

    const action = isAdmin ? 'delete_admin' : 'delete_user';
    const formData = new FormData();
    formData.append('action', action);
    formData.append('id', id);
    formData.append('reason', reason);
    formData.append('requested_by', requestedBy);
    formData.append('proof_file', fileInput.files[0]);
    formData.append('deleted_by', sessionStorage.getItem('username') || 'Super Admin');

    const confirmBtn = document.querySelector('#deleteAdminModal .btn-danger');
    const origText = confirmBtn ? confirmBtn.innerHTML : '';

    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        confirmBtn.disabled = true;
    }

    try {
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const responseText = await response.text();
        console.log('Server response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Failed to parse JSON:', jsonError);
            let errorMessage = 'Server error occurred';
            if (responseText.includes('<b>Warning</b>')) {
                const match = responseText.match(/<b>Warning<\/b>: (.*?) in <b>/);
                if (match) errorMessage = match[1];
            } else if (responseText.includes('<b>Fatal error</b>')) {
                const match = responseText.match(/<b>Fatal error<\/b>: (.*?) in <b>/);
                if (match) errorMessage = match[1];
            } else if (responseText.includes('<b>Parse error</b>')) {
                const match = responseText.match(/<b>Parse error<\/b>: (.*?) in <b>/);
                if (match) errorMessage = match[1];
            }
            showToast(`Server Error: ${errorMessage.substring(0, 100)}`, 'error');
            return;
        }

        if (data.success) {
            showToast('Account deleted successfully!', 'success');
            closeDeleteAdminModal();

            if (isUser) {
                loadAllUsers();
            }
            if (isAdmin && typeof loadAdmins === 'function') {
                loadAdmins();
            }
        } else {
            showToast('Error: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (err) {
        console.error('Error deleting account:', err);
        showToast('Network error: ' + err.message, 'error');
    } finally {
        if (confirmBtn) {
            confirmBtn.innerHTML = origText;
            confirmBtn.disabled = false;
        }
    }
}

// ============================================
// VIEW ADMIN DETAILS (stub)
// ============================================

function viewAdminDetails(adminId) {
    console.log('View admin details:', adminId);
    if (typeof window.viewAdminDetailsOriginal === 'function') {
        window.viewAdminDetailsOriginal(adminId);
    }
}

function renderAdminPrivileges(admin) {
    console.log('Render admin privileges:', admin);
}

function editViewedAdmin() {
    console.log('Edit viewed admin');
}

function openEditAdminModal(id) {
    console.log('Open edit admin modal:', id);
}

function closeEditAdminModal() {
    const modal = document.getElementById('editAdminModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function toggleEditPrivileges() {
    console.log('Toggle edit privileges');
}

function renderEditPrivilegeMatrix(containerId, existingPrivileges = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<p>Privilege matrix loading...</p>';
}

function enforceEditCrudRules(checkbox, module) {
    console.log('Enforce edit CRUD rules:', checkbox, module);
}

function editSelectAllPrivileges(select) {
    document.querySelectorAll('#editPrivilegeContainer input[type="checkbox"]').forEach(cb => cb.checked = select);
}

async function saveAdminEdit() {
    showToast('Admin edit functionality requires super_admin_delete_admin.js', 'error');
}

// ============================================
// ACTIVITY LOGS
// ============================================

function loadActivityLogs() {
    const tbody = document.getElementById('activityLogsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading activity logs...</td></tr>`;
    }

    fetch('../php/get_activity_log.php?limit=1000')
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                activityAllLogs = data.logs || [];
                activityFiltered = [...activityAllLogs];
                activityCurrentPage = 1;
                renderActivityLogs();
            } else {
                showActivityError('Failed to load activity logs.');
            }
        })
        .catch(err => {
            console.error('Activity logs error:', err);
            showActivityError('Network error. Please try again.');
        });
}

function renderActivityLogs() {
    const tbody = document.getElementById('activityLogsTableBody');
    if (!tbody) return;

    if (activityFiltered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;"><i class="fas fa-inbox"></i> No activity logs found</td></tr>`;
        return;
    }

    const totalPages = Math.ceil(activityFiltered.length / activityPerPage);
    if (activityCurrentPage > totalPages) activityCurrentPage = totalPages;
    if (activityCurrentPage < 1) activityCurrentPage = 1;

    const start = (activityCurrentPage - 1) * activityPerPage;
    const pageLogs = activityFiltered.slice(start, start + activityPerPage);

    tbody.innerHTML = pageLogs.map((log, idx) => `
        <tr>
            <td>${start + idx + 1}</td>
            <td>${escapeHtml(log.username || 'Unknown')}</td>
            <td>${escapeHtml(log.role || 'User')}</td>
            <td>${escapeHtml(log.activity_type || '—')}</td>
            <td style="max-width:200px;">${escapeHtml(log.description || '—')}</td>
            <td>${escapeHtml(log.ip_address || '—')}</td>
            <td>${escapeHtml(log.device || '—')}</td>
            <td>${escapeHtml(log.performed_by || '—')}</td>
            <td>${formatDateTime(log.created_at)}</td>
        </tr>`).join('');

    renderActivityPagination(totalPages);
}

function renderActivityPagination(totalPages) {
    const container = document.getElementById('activityPagination');
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = `<button class="pagination-btn" onclick="goToActivityPage(${activityCurrentPage - 1})" ${activityCurrentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= activityCurrentPage - 1 && i <= activityCurrentPage + 1)) {
            html += `<button class="pagination-btn ${i === activityCurrentPage ? 'active' : ''}" onclick="goToActivityPage(${i})">${i}</button>`;
        } else if (i === activityCurrentPage - 2 || i === activityCurrentPage + 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    html += `<button class="pagination-btn" onclick="goToActivityPage(${activityCurrentPage + 1})" ${activityCurrentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function goToActivityPage(page) {
    const totalPages = Math.ceil(activityFiltered.length / activityPerPage);
    if (page < 1 || page > totalPages) return;
    activityCurrentPage = page;
    renderActivityLogs();
}

function filterActivityLogs() {
    const search = (document.getElementById('activitySearch')?.value || '').toLowerCase();
    const type = document.getElementById('activityTypeFilter')?.value || 'all';
    const role = document.getElementById('activityRoleFilter')?.value || 'all';
    const dateFrom = document.getElementById('activityDateFrom')?.value || '';
    const dateTo = document.getElementById('activityDateTo')?.value || '';

    activityFiltered = activityAllLogs.filter(log => {
        const matchSearch = !search || (log.username || '').toLowerCase().includes(search) ||
            (log.user_id || '').toLowerCase().includes(search) ||
            (log.description || '').toLowerCase().includes(search) ||
            (log.activity_type || '').toLowerCase().includes(search);
        const matchType = type === 'all' || log.activity_type === type;
        const matchRole = role === 'all' || log.role === role;
        const logDate = log.created_at ? log.created_at.split(' ')[0] : '';
        const matchFrom = !dateFrom || logDate >= dateFrom;
        const matchTo = !dateTo || logDate <= dateTo;
        return matchSearch && matchType && matchRole && matchFrom && matchTo;
    });

    activityCurrentPage = 1;
    renderActivityLogs();
}

function clearActivityFilters() {
    const search = document.getElementById('activitySearch');
    const type = document.getElementById('activityTypeFilter');
    const role = document.getElementById('activityRoleFilter');
    const dateFrom = document.getElementById('activityDateFrom');
    const dateTo = document.getElementById('activityDateTo');

    if (search) search.value = '';
    if (type) type.value = 'all';
    if (role) role.value = 'all';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    activityFiltered = [...activityAllLogs];
    activityCurrentPage = 1;
    renderActivityLogs();
}

function refreshActivityLogs() { loadActivityLogs(); }

function showActivityError(message) {
    const tbody = document.getElementById('activityLogsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#dc2626;">${message}</td></tr>`;
}

// ============================================
// PRODUCTS, ORDERS, CATEGORIES, REPORTS stubs
// ============================================

function openSuperProductModal() { alert('Add Product functionality - See super_admin_products.js'); }
function exportSuperProducts() { alert('Export Products - See super_admin_products.js'); }
function filterSuperProducts() { console.log('Filter products'); }
function openSuperCategoryModal() { alert('Add Category - See super_admin_categories.js'); }
function filterSuperCategories() { console.log('Filter categories'); }
function generateSuperReport() { alert('Generate Report - See super_admin_reports.js'); }
function exportSuperReportPDF() { alert('Export PDF - See super_admin_reports.js'); }
function exportSuperReportExcel() { alert('Export Excel - See super_admin_reports.js'); }
function filterSuperOrders() { console.log('Filter orders'); }
function exportSuperOrders() { alert('Export Orders - See super_admin_orders.js'); }
function bulkSuperPrintLabels() { alert('Print Labels - See super_admin_orders.js'); }
function toggleSuperSelectAllOrders() { console.log('Toggle select all orders'); }

// ============================================
// FINAL INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const userId = sessionStorage.getItem('user_id');
    const accountStatus = sessionStorage.getItem('account_status');

    console.log('Super Admin Dashboard loaded - Session data:', {
        user_id: userId,
        username: sessionStorage.getItem('username'),
        account_status: accountStatus
    });

    if (!userId || !accountStatus) {
        window.location.href = 'login.html';
        return;
    }
    if (accountStatus !== 'super admin') {
        window.location.href = 'unauthorized.html';
        return;
    }

    loadAllUsers();
    loadSecurityLogs();
    startSessionCheck();
});

function loadRecentActivity() {
    fetch('../php/get_activity_log.php?limit=1000')
        .then(res => res.json())
        .then(data => {
            if (data.status === 200 && data.logs) {
                recentActivityAllData = data.logs;
                recentActivityFiltered = [...recentActivityAllData];
                recentActivityCurrentPage = 1;
                recentActivityPerPage = 5;
                const perPageSelect = document.getElementById('recentActivityPerPage');
                if (perPageSelect) perPageSelect.value = '5';
                renderRecentActivity();
            } else {
                showRecentActivityError('Failed to load activity data');
            }
        })
        .catch(err => {
            console.error('Failed to load recent activity:', err);
            showRecentActivityError('Network error. Please try again.');
        });
}

function setupSearchListener() {
    const searchInput = document.getElementById('activitySearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterRecentActivity();
            }, 300);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupSearchListener();
});

function filterRecentActivity() {
    const filterDate = document.getElementById('activityDateFilter')?.value;
    const searchTerm = document.getElementById('activitySearchInput')?.value.toLowerCase().trim() || '';

    recentActivityFiltered = recentActivityAllData.filter(log => {
        let matchesDate = true;
        if (filterDate && log.created_at) {
            const logDate = log.created_at.split(' ')[0];
            if (logDate !== filterDate) matchesDate = false;
        }

        let matchesSearch = true;
        if (searchTerm) {
            matchesSearch = (log.username && log.username.toLowerCase().includes(searchTerm)) ||
                (log.activity_type && log.activity_type.toLowerCase().includes(searchTerm)) ||
                (log.description && log.description.toLowerCase().includes(searchTerm)) ||
                (log.user_id && String(log.user_id).toLowerCase().includes(searchTerm));
        }

        return matchesDate && matchesSearch;
    });

    recentActivityCurrentPage = 1;
    recentActivityPerPage = 5;
    const perPageSelect = document.getElementById('recentActivityPerPage');
    if (perPageSelect) perPageSelect.value = '5';
    renderRecentActivity();

    if (filterDate || searchTerm) {
        let message = `Found ${recentActivityFiltered.length} activities`;
        if (filterDate) message += ` on ${filterDate}`;
        if (searchTerm) message += ` matching "${searchTerm}"`;
        showToast(message, 'info');
    }
}

function clearRecentActivityFilters() {
    const dateFilter = document.getElementById('activityDateFilter');
    const searchInput = document.getElementById('activitySearchInput');

    if (dateFilter) dateFilter.value = '';
    if (searchInput) searchInput.value = '';

    recentActivityFiltered = [...recentActivityAllData];
    recentActivityCurrentPage = 1;
    recentActivityPerPage = 5;
    const perPageSelect = document.getElementById('recentActivityPerPage');
    if (perPageSelect) perPageSelect.value = '5';
    renderRecentActivity();
    showToast('Filters cleared, showing all activities', 'info');
}

function renderRecentActivity() {
    const tbody = document.getElementById('recentActivityTableBody');
    if (!tbody) return;

    if (recentActivityFiltered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:40px; color:#6b7280;">
                    <i class="fas fa-inbox" style="font-size:32px; margin-bottom:10px; display:block; color:#d1d5db;"></i>
                    No activity found
                </td>
            </tr>`;
        const showingInfo = document.getElementById('recentActivityShowingInfo');
        if (showingInfo) showingInfo.textContent = 'Showing 0 of 0 activities';
        const paginationContainer = document.getElementById('recentActivityPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(recentActivityFiltered.length / recentActivityPerPage);
    if (recentActivityCurrentPage > totalPages) recentActivityCurrentPage = totalPages;
    if (recentActivityCurrentPage < 1) recentActivityCurrentPage = 1;

    const start = (recentActivityCurrentPage - 1) * recentActivityPerPage;
    const end = Math.min(start + recentActivityPerPage, recentActivityFiltered.length);
    const pageData = recentActivityFiltered.slice(start, end);

    const activityMap = {
        'Login': { icon: 'sign-in-alt', color: '#059669', bg: '#d1fae5' },
        'Logout': { icon: 'sign-out-alt', color: '#6b7280', bg: '#f3f4f6' },
        'Failed Login': { icon: 'exclamation-circle', color: '#dc2626', bg: '#fee2e2' },
        'Account Created': { icon: 'user-plus', color: '#4f46e5', bg: '#ede9fe' },
        'Account Updated': { icon: 'user-edit', color: '#0ea5e9', bg: '#e0f2fe' },
        'Account Blocked': { icon: 'ban', color: '#dc2626', bg: '#fee2e2' },
        'Account Unblocked': { icon: 'unlock', color: '#059669', bg: '#d1fae5' },
        'Account Deleted': { icon: 'user-slash', color: '#dc2626', bg: '#fee2e2' },
        'Account Restored': { icon: 'undo', color: '#059669', bg: '#d1fae5' },
    };

    let html = '';
    for (const log of pageData) {
        const initials = (log.username || '?').charAt(0).toUpperCase();
        const avatarColor = log.role === 'super admin' ? '#f59e0b' :
            log.role === 'admin' ? '#4f46e5' :
            '#3b82f6';

        const roleBadge = log.role === 'super admin' ?
            `<span style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">
                   <i class="fas fa-crown" style="margin-right:3px;"></i>Super Admin
               </span>` :
            log.role === 'admin' ?
            `<span style="background:#ede9fe;color:#5b21b6;border:1px solid #a78bfa;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">
                   <i class="fas fa-user-shield" style="margin-right:3px;"></i>Admin
               </span>` :
            `<span style="background:#dbeafe;color:#1e40af;border:1px solid #3b82f6;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">
                   <i class="fas fa-user" style="margin-right:3px;"></i>User
               </span>`;

        const activity = activityMap[log.activity_type] || { icon: 'circle', color: '#6b7280', bg: '#f3f4f6' };
        const dateTime = log.created_at ? new Date(log.created_at).toLocaleString() : '—';

        html += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:9px;">
                        <div style="width:34px; height:34px; border-radius:50%; background:${avatarColor}; color:white; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0;">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight:600; color:#1f2937; font-size:13px;">${escapeHtml(log.username)}</div>
                            <div style="font-size:11px; color:#9ca3af; font-family:monospace;">${escapeHtml(log.user_id)}</div>
                        </div>
                    </div>
                </td>
                <td>${roleBadge}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:30px; height:30px; border-radius:8px; background:${activity.bg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <i class="fas fa-${activity.icon}" style="color:${activity.color}; font-size:12px;"></i>
                        </div>
                        <span style="font-size:13px; font-weight:600; color:#1f2937;">${escapeHtml(log.activity_type)}</span>
                    </div>
                </td>
                <td style="font-size:12px; color:#6b7280; max-width:200px;">${escapeHtml(log.description || '—')}</td>
                <td style="font-size:12px; color:#6b7280; white-space:nowrap;">
                    <i class="fas fa-clock" style="margin-right:4px; color:#9ca3af;"></i>${dateTime}
                </td>
            </tr>`;
    }

    tbody.innerHTML = html;

    const showingInfo = document.getElementById('recentActivityShowingInfo');
    if (showingInfo) {
        showingInfo.textContent = `Showing ${start + 1}–${end} of ${recentActivityFiltered.length} activities`;
    }

    renderRecentActivityPagination(totalPages);
}

function renderRecentActivityPagination(totalPages) {
    const container = document.getElementById('recentActivityPagination');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<button class="pagination-btn" onclick="goToRecentActivityPage(${recentActivityCurrentPage - 1})" ${recentActivityCurrentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>`;

    const maxVisible = 5;
    let startPage = Math.max(1, recentActivityCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="goToRecentActivityPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === recentActivityCurrentPage ? 'active' : ''}" onclick="goToRecentActivityPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
        html += `<button class="pagination-btn" onclick="goToRecentActivityPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="pagination-btn" onclick="goToRecentActivityPage(${recentActivityCurrentPage + 1})" ${recentActivityCurrentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>`;

    container.innerHTML = html;
}

function goToRecentActivityPage(page) {
    const totalPages = Math.ceil(recentActivityFiltered.length / recentActivityPerPage);
    if (page < 1 || page > totalPages) return;
    recentActivityCurrentPage = page;
    renderRecentActivity();
}

function changeRecentActivityPerPage() {
    const select = document.getElementById('recentActivityPerPage');
    if (select) {
        recentActivityPerPage = parseInt(select.value);
        recentActivityCurrentPage = 1;
        renderRecentActivity();
    }
}

function showRecentActivityError(message) {
    const tbody = document.getElementById('recentActivityTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:40px; color:#dc2626;">
                    <i class="fas fa-exclamation-circle" style="font-size:32px; margin-bottom:10px; display:block;"></i>
                    ${message}
                </td>
            </tr>`;
    }
}

function viewProof(filename) {
    if (!filename) {
        console.error('No filename provided');
        showToast('No proof file available', 'error');
        return;
    }

    const modal = document.getElementById('viewProofModal');
    const content = document.getElementById('viewProofContent');
    const title = document.getElementById('viewProofTitle');

    if (!modal) {
        console.error('View proof modal not found');
        showToast('Modal not found', 'error');
        return;
    }

    if (!content) {
        console.error('View proof content element not found');
        showToast('Content element not found', 'error');
        return;
    }

    if (title) {
        title.textContent = 'Deletion Authorization Proof';
    }

    const fileExt = filename.split('.').pop().toLowerCase();
    const filePath = '../uploads/deletion_proofs/' + filename;

    let html = '';

    if (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png') {
        html = `<img src="${filePath}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" onerror="this.src='../images/no-image.png'; alert('Failed to load image');">`;
    } else if (fileExt === 'pdf') {
        html = `<embed src="${filePath}" type="application/pdf" width="100%" height="500px" style="border-radius: 8px;">`;
    } else if (fileExt === 'doc' || fileExt === 'docx') {
        html = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-file-word" style="font-size: 64px; color: #2b5797; margin-bottom: 20px;"></i>
                <p>This is a Word document. Click the button below to download and view.</p>
                <a href="${filePath}" download class="btn btn-primary" style="margin-top: 10px;">
                    <i class="fas fa-download"></i> Download File
                </a>
            </div>
        `;
    } else {
        html = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-file" style="font-size: 64px; color: #6b7280; margin-bottom: 20px;"></i>
                <p>Unable to preview this file type.</p>
                <a href="${filePath}" download class="btn btn-primary" style="margin-top: 10px;">
                    <i class="fas fa-download"></i> Download File
                </a>
            </div>
        `;
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function closeViewProofModal() {
    const modal = document.getElementById('viewProofModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    const content = document.getElementById('viewProofContent');
    if (content) {
        content.innerHTML = '';
    }
}

// ============================================
// DELETED ACCOUNTS
// ============================================

function loadDeletedAccounts() {
    console.log('Loading deleted accounts...');

    fetch('../php/super_admin_api.php?action=get_deleted_accounts', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        })
        .then(async res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON response');
            }
        })
        .then(data => {
            if (data.success) {
                renderDeletedAccountsTable(data.data.records || []);
                updateDeletedAccountsStats(data.data.records || []);
            } else {
                showNoDeletedAccounts(data.message || 'Failed to load deleted accounts');
            }
        })
        .catch(err => {
            console.error('Error loading deleted accounts:', err);
            showNoDeletedAccounts('Error loading deleted accounts');
        });
}

function renderDeletedAccountsTable(records) {
    const tbody = document.getElementById('deletedAccountsTableBody');
    const showingInfo = document.getElementById('deletedShowingInfo');

    if (!tbody) return;

    if (!records || records.length === 0) {
        showNoDeletedAccounts('No deleted accounts found');
        return;
    }

    tbody.innerHTML = records.map((record, index) => {
        const proofBtn = record.proof_file ?
            `<button class="action-btn view" onclick="viewProof('${record.proof_file}')" title="View Proof"><i class="fas fa-file-alt"></i></button>` :
            '<span style="color:#9ca3af;">No proof</span>';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="admin-info">
                        <div class="admin-avatar-small" style="background:#ef4444;">${getInitials(record.full_name || record.username)}</div>
                        <div class="admin-details">
                            <h4>${escapeHtml(record.full_name || 'Unknown')}</h4>
                            <p>@${escapeHtml(record.username || 'N/A')}</p>
                            <small style="color:#6b7280;">${escapeHtml(record.email || 'N/A')}</small>
                        </div>
                    </div>
                </td>
                <td style="max-width:200px; font-size:12px;">${escapeHtml(record.reason || 'No reason provided')}</td>
                <td>${escapeHtml(record.requested_by || 'N/A')}</td>
                <td>${escapeHtml(record.deleted_by || 'N/A')}</td>
                <td>${formatDateTime(record.deleted_at)}</div>
                <td>
                    <div class="action-btns">
                        ${proofBtn}
                    </div>
                </div>
            </tr>`;
    }).join('');

    if (showingInfo) {
        showingInfo.textContent = `Showing ${records.length} of ${records.length} records`;
    }

    const pagination = document.getElementById('deletedPagination');
    if (pagination) pagination.innerHTML = '';
}

function updateDeletedAccountsStats(records) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalDeleted = records.length;
    const deletedThisMonth = records.filter(r => {
        const d = new Date(r.deleted_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    const deletedThisWeek = records.filter(r => {
        const d = new Date(r.deleted_at);
        return d >= oneWeekAgo;
    }).length;

    _setText('totalDeletedCount', totalDeleted);
    _setText('deletedThisMonth', deletedThisMonth);
    _setText('deletedThisWeek', deletedThisWeek);
}

function showNoDeletedAccounts(message) {
    const tbody = document.getElementById('deletedAccountsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#6b7280;">
                    <i class="fas fa-inbox" style="font-size:32px; display:block; margin-bottom:10px; color:#d1d5db;"></i>
                    ${escapeHtml(message)}
                </div>
            </tr>`;
    }
    _setText('deletedShowingInfo', 'No records to display');
    const pagination = document.getElementById('deletedPagination');
    if (pagination) pagination.innerHTML = '';
}

function changeDeletedPerPage() {
    loadDeletedAccounts();
}

// ============================================
// RECORD LOGOUT ACTIVITY
// ============================================

async function recordLogoutActivity() {
    const username = sessionStorage.getItem('username');
    const userId = sessionStorage.getItem('user_id');
    const role = sessionStorage.getItem('account_status');
    
    if (!username) return;
    
    // Get device info
    const device = getDeviceInfo();
    const ip = await getClientIP();
    
    const logoutData = {
        user_id: userId,
        username: username,
        role: role,
        activity_type: 'Logout',
        description: `User ${username} logged out`,
        ip_address: ip,
        device: device,
        performed_by: username
    };
    
    try {
        const response = await fetch('../php/record_activity.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logoutData)
        });
        const result = await response.json();
        console.log('Logout activity recorded:', result);
    } catch (err) {
        console.error('Failed to record logout activity:', err);
    }
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobile';
    return 'Desktop';
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (err) {
        return '127.0.0.1';
    }
}

// REPLACE the existing logout function with this one
function logout() {
    // Record logout activity first
    recordLogoutActivity().finally(() => {
        const username = sessionStorage.getItem('username');
        if (isFileProtocol || !username) {
            clearAndRedirect();
            return;
        }

        fetch(`../php/loginvalidation.php?action=logout&username=${encodeURIComponent(username)}`)
            .catch(err => console.warn('Logout API call failed:', err))
            .finally(clearAndRedirect);
    });
}

// ============================================
// BLOCK USER WITH ACTIVITY LOGGING
// ============================================

function confirmBlockUser() {
    const userId = document.getElementById('blockUserId')?.value;
    const username = document.getElementById('blockUserUsername')?.value;
    const reason = document.getElementById('blockUserReason')?.value.trim();

    if (!reason) {
        showToast('Please provide a reason for blocking', 'error');
        document.getElementById('blockUserReason')?.focus();
        return;
    }

    const currentUserId = sessionStorage.getItem('user_id');
    if (userId === currentUserId) {
        showToast('You cannot block yourself!', 'error');
        return;
    }

    const blockBtn = document.querySelector('#blockUserModal .btn-danger');
    const origText = blockBtn ? blockBtn.innerHTML : '';

    if (blockBtn) {
        blockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Blocking...';
        blockBtn.disabled = true;
    }

    fetch('../php/super_admin_api.php?action=block_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            reason: reason,
            blocked_by: sessionStorage.getItem('username') || 'Super Admin'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('User blocked successfully!', 'success');
            closeBlockUserModal();
            loadAllUsers(); // Refresh the users list
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(err => showToast('Error: ' + err.message, 'error'))
    .finally(() => {
        if (blockBtn) {
            blockBtn.innerHTML = origText;
            blockBtn.disabled = false;
        }
    });
}

// ============================================
// UNBLOCK USER WITH ACTIVITY LOGGING
// ============================================

function confirmUnblockUser() {
    const userId = document.getElementById('unblockUserId')?.value;
    const reason = document.getElementById('unblockUserReason')?.value.trim();

    const unblockBtn = document.querySelector('#unblockUserModal .btn-success');
    const origText = unblockBtn ? unblockBtn.innerHTML : '';

    if (unblockBtn) {
        unblockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unblocking...';
        unblockBtn.disabled = true;
    }

    fetch('../php/super_admin_api.php?action=unblock_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            reason: reason,
            unblocked_by: sessionStorage.getItem('username') || 'Super Admin'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('User unblocked successfully!', 'success');
            closeUnblockUserModal();
            loadAllUsers(); // Refresh the users list
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(err => showToast('Error: ' + err.message, 'error'))
    .finally(() => {
        if (unblockBtn) {
            unblockBtn.innerHTML = origText;
            unblockBtn.disabled = false;
        }
    });
}

// Add to super_admin_dashboard.js
function checkSuperAdminLimit() {
    // This will be called when creating/editing accounts
    const selectedRole = document.getElementById('staffSelectedRole')?.value;
    
    if (selectedRole === 'super admin') {
        // Optional: You can fetch the current super admin count via an API call
        fetch('../php/super_admin_api.php?action=get_super_admin_count')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.count >= 2) {
                    showToast('Maximum of 2 Super Admin accounts allowed. Cannot create another Super Admin.', 'warning');
                    // Disable super admin option
                    const superAdminRadio = document.querySelector('input[name="account_status_radio"][value="super admin"]');
                    if (superAdminRadio) {
                        superAdminRadio.disabled = true;
                        superAdminRadio.closest('.role-option').style.opacity = '0.5';
                        superAdminRadio.closest('.role-option').style.cursor = 'not-allowed';
                    }
                }
            })
            .catch(err => console.error('Error checking super admin limit:', err));
    }
}

// Add to session check interval
async function checkSession() {
    try {
        const response = await fetch('../php/check_session.php');
        const data = await response.json();
        
        if (data.force_logout === true) {
            showToast('Another super admin has logged in. You have been logged out.', 'warning');
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            }, 2000);
        } else if (data.blocked === true) {
            showToast(data.message, 'error');
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
            }, 2000);
        }
    } catch (err) {
        console.error('Session check failed:', err);
    }
}

// Run session check every 10 seconds
setInterval(checkSession, 10000);   

// ============================================
// AJAX FORM SUBMISSION FOR ACCOUNT CREATION
// ============================================

function initAccountCreationForm() {
    const registrationForm = document.getElementById('registrationForm');
    if (!registrationForm) return;
    
    // Remove any existing submit handler and add new one
    registrationForm.removeEventListener('submit', handleFormSubmit);
    registrationForm.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault(); // This prevents page reload
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Validate form (optional - you already have validation.js)
    if (typeof validateRegistrationForm === 'function') {
        const role = document.getElementById('staffSelectedRole')?.value || 'user';
        const requireSecurity = role === 'user';
        const errors = validateRegistrationForm(null, requireSecurity);
        if (errors && errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }
    }
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    // Create FormData object
    const formData = new FormData(form);
    
    // Add the selected role from radio buttons
    const selectedRole = document.querySelector('input[name="account_status_radio"]:checked');
    if (selectedRole) {
        formData.set('account_status', selectedRole.value);
    }
    
    try {
        const response = await fetch('../php/admin_create_account.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message || 'Account created successfully!', 'success');
            resetForm(); // Reset the form on success
            
            // Refresh the users table if visible
            const usersSection = document.getElementById('usersSection');
            if (usersSection && usersSection.style.display !== 'none') {
                loadAllUsers();
            }
            
            // If it's a super admin account, also refresh admins list
            if (selectedRole && selectedRole.value === 'super admin') {
                const adminsSection = document.getElementById('manageAdminsSection');
                if (adminsSection && adminsSection.style.display !== 'none') {
                    if (typeof loadAdmins === 'function') loadAdmins();
                }
                showToast('Note: Only one super admin can be active at a time.', 'info');
            }
        } else {
            showToast(result.message || 'Failed to create account', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccountCreationForm);
} else {
    initAccountCreationForm();
}