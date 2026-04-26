// User Dashboard JavaScript (Updated with Profile Settings)

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeDashboard();
    setupEventListeners();
    setupResizeHandler();
    updateAccountMenuVisibility();
    attachLogoutHandlers();
});

// =========================
// AUTHENTICATION
// =========================
function checkAuth() {
    const accountStatus = sessionStorage.getItem('account_status');
    if (!accountStatus) return window.location.href = '../html/sign-in.html';

    if (accountStatus !== 'user') {
        if (accountStatus === 'super admin') window.location.href = '../html/super_admin_dashboard.html';
        else if (accountStatus === 'admin') window.location.href = '../html/admin_dashboard.html';
        return;
    }

    const username = sessionStorage.getItem('username');
    if (username) {
        const userNameEl = document.getElementById('userName');
        const profileNameEl = document.getElementById('profileName');
        if (userNameEl) userNameEl.textContent = username;
        if (profileNameEl) profileNameEl.textContent = username;
    }
}

// =========================
// INITIALIZATION
// =========================
function initializeDashboard() {
    if (typeof loadOrders === 'function') loadOrders();
    if (typeof loadWishlist === 'function') loadWishlist();
    if (typeof loadProfile === 'function') loadProfile();
    loadUserProfile(); // Load profile data
}

// =========================
// EVENT LISTENERS
// =========================
function setupEventListeners() {
    const entriesSelect = document.getElementById('entriesPerPage');
    if (entriesSelect) entriesSelect.addEventListener('change', changeEntriesPerPage);

    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.addEventListener('click', toggleAccountMenu);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('accountSidebar');
            if (sidebar && sidebar.classList.contains('active')) toggleAccountMenu();
        }
    });
}

// =========================
// ACCOUNT SIDEBAR
// =========================
function toggleAccountMenu() {
    const sidebar = document.getElementById('accountSidebar');
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle('active');
    document.body.style.overflow = isOpen ? 'hidden' : '';

    setTimeout(() => {
        if (isOpen) document.addEventListener('click', closeAccountMenuOnOutsideClick);
        else document.removeEventListener('click', closeAccountMenuOnOutsideClick);
    }, 10);
}

function closeAccountMenuOnOutsideClick(e) {
    const sidebar = document.getElementById('accountSidebar');
    const toggle = document.querySelector('.account-menu-toggle');
    if (!sidebar) return;

    if (!e.target.closest('.sidebar-card') && !e.target.closest('.account-menu-toggle')) {
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
        document.removeEventListener('click', closeAccountMenuOnOutsideClick);
    }
}

// =========================
// RESIZE HANDLER
// =========================
function setupResizeHandler() {
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const sidebar = document.getElementById('accountSidebar');
            if (window.innerWidth > 1024 && sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.body.style.overflow = '';
            }
            updateAccountMenuVisibility();
        }, 250);
    });
}

// =========================
// DASHBOARD NAVIGATION
// =========================
function showUserDashboard() {
    const dashboard = document.getElementById('userDashboardContent');
    const history = document.getElementById('loginHistoryContent');
    const profile = document.getElementById('profileSettingsContent');
    if (dashboard) dashboard.style.display = 'flex';
    if (history) history.style.display = 'none';
    if (profile) profile.style.display = 'none';
    updateSidebarActive(0);
    if (window.innerWidth <= 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoginHistory() {
    const dashboard = document.getElementById('userDashboardContent');
    const history = document.getElementById('loginHistoryContent');
    const profile = document.getElementById('profileSettingsContent');
    if (dashboard) dashboard.style.display = 'none';
    if (history) history.style.display = 'flex';
    if (profile) profile.style.display = 'none';
    updateSidebarActive(2);
    loadUserLoginHistory();
    if (window.innerWidth <= 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProfileSettings() {
    const dashboard = document.getElementById('userDashboardContent');
    const history = document.getElementById('loginHistoryContent');
    const profile = document.getElementById('profileSettingsContent');
    if (dashboard) dashboard.style.display = 'none';
    if (history) history.style.display = 'none';
    if (profile) profile.style.display = 'flex';
    updateSidebarActive(5);
    loadUserProfile();
    if (window.innerWidth <= 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSidebarActive(index) {
    document.querySelectorAll('.sidebar-link').forEach((link, i) => {
        link.classList.toggle('active', i === index);
    });
}

// =========================
// PROFILE SETTINGS FUNCTIONS
// =========================

function loadUserProfile() {
    const userId = sessionStorage.getItem('user_id');
    
    fetch(`../php/get_user_profile.php?user_id=${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const user = data.user;
            const firstNameInput = document.getElementById('profileFirstName');
            const lastNameInput = document.getElementById('profileLastName');
            const emailInput = document.getElementById('profileEmail');
            const secQ1 = document.getElementById('secQuestion1');
            const secQ2 = document.getElementById('secQuestion2');
            const secQ3 = document.getElementById('secQuestion3');
            const avatarImg = document.getElementById('profileAvatarImg');
            const userNameSpan = document.getElementById('userName');
            const userAvatarDiv = document.getElementById('userAvatar');
            
            if (firstNameInput) firstNameInput.value = user.Fname || '';
            if (lastNameInput) lastNameInput.value = user.Lname || '';
            if (emailInput) emailInput.value = user.email || '';
            
            if (secQ1 && user.sec_question_1) secQ1.value = user.sec_question_1;
            if (secQ2 && user.sec_question_2) secQ2.value = user.sec_question_2;
            if (secQ3 && user.sec_question_3) secQ3.value = user.sec_question_3;
            
            if (avatarImg) {
                if (user.profile_pic) {
                    avatarImg.src = user.profile_pic;
                } else {
                    const name = `${user.Fname || ''}+${user.Lname || ''}`;
                    avatarImg.src = `https://ui-avatars.com/api/?name=${name}&background=64748b&color=fff&size=120`;
                }
            }
            
            if (userNameSpan) userNameSpan.textContent = user.Fname || sessionStorage.getItem('username');
            if (userAvatarDiv) userAvatarDiv.textContent = (user.Fname ? user.Fname.charAt(0) : sessionStorage.getItem('username')?.charAt(0) || 'U').toUpperCase();
        } else {
            console.error('Error loading profile:', data.message);
        }
    })
    .catch(err => {
        console.error('Error loading profile:', err);
    });
}

// =========================
// ALERT FUNCTIONS
// =========================

function showProfileAlert(message, type = 'success') {
    console.log('showProfileAlert called:', message, type); // Debug
    
    const alertContainer = document.getElementById('profileAlertContainer');
    if (!alertContainer) {
        console.error('profileAlertContainer not found');
        return;
    }
    
    const alertId = 'alert_' + Date.now();
    const alertDiv = document.createElement('div');
    alertDiv.id = alertId;
    alertDiv.className = `alert-message ${type}`;
    alertDiv.style.cssText = `
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
        border-left: 4px solid ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const iconColor = type === 'success' ? '#10b981' : '#ef4444';
    const textColor = type === 'success' ? '#065f46' : '#991b1b';
    
    alertDiv.innerHTML = `
        <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 18px;"></i>
        <span style="flex: 1; color: ${textColor};">${message}</span>
        <i class="fas fa-times" onclick="this.closest('.alert-message').remove()" style="cursor: pointer; opacity: 0.7; color: ${textColor};"></i>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        const el = document.getElementById(alertId);
        if (el) el.remove();
    }, 5000);
    
    // Scroll to alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =========================
// UPDATE PERSONAL INFORMATION
// =========================

async function updatePersonalInfo() {
    const firstName = document.getElementById('profileFirstName').value.trim();
    const lastName = document.getElementById('profileLastName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    
    if (!firstName || !lastName) {
        showProfileAlert('First name and last name are required!', 'error');
        return;
    }
    
    if (!email) {
        showProfileAlert('Email address is required!', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showProfileAlert('Please enter a valid email address!', 'error');
        return;
    }
    
    const updateBtn = event.target;
    const originalText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    updateBtn.disabled = true;
    
    try {
        const response = await fetch('../php/update_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showProfileAlert('Personal information updated successfully!', 'success');
            const userNameSpan = document.getElementById('userName');
            if (userNameSpan) userNameSpan.textContent = firstName + ' ' + lastName;
            
            const avatar = document.getElementById('userAvatar');
            if (avatar) avatar.textContent = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
            
            sessionStorage.setItem('full_name', firstName + ' ' + lastName);
        } else {
            showProfileAlert(data.message || 'Failed to update personal information', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showProfileAlert('Network error. Please try again.', 'error');
    } finally {
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    }
}

// =========================
// UPDATE SECURITY QUESTIONS
// =========================

async function updateSecurityQuestions() {
    const question1 = document.getElementById('secQuestion1').value;
    const answer1 = document.getElementById('secAnswer1').value.trim();
    const question2 = document.getElementById('secQuestion2').value;
    const answer2 = document.getElementById('secAnswer2').value.trim();
    const question3 = document.getElementById('secQuestion3').value;
    const answer3 = document.getElementById('secAnswer3').value.trim();
    
    if (!question1 || !answer1 || !question2 || !answer2 || !question3 || !answer3) {
        showProfileAlert('Please complete all security questions and answers', 'error');
        return;
    }
    
    const updateBtn = event.target;
    const originalText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    updateBtn.disabled = true;
    
    try {
        const response = await fetch('../php/update_security_questions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                question1: question1,
                answer1: answer1,
                question2: question2,
                answer2: answer2,
                question3: question3,
                answer3: answer3
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showProfileAlert('Security questions updated successfully!', 'success');
            document.getElementById('secAnswer1').value = '';
            document.getElementById('secAnswer2').value = '';
            document.getElementById('secAnswer3').value = '';
        } else {
            showProfileAlert(data.message || 'Failed to update security questions', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showProfileAlert('Network error. Please try again.', 'error');
    } finally {
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    }
}

// =========================
// CHANGE PASSWORD
// =========================

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword) {
        showProfileAlert('Current password is required!', 'error');
        return;
    }
    
    if (!newPassword) {
        showProfileAlert('New password is required!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showProfileAlert('New password must be at least 6 characters long!', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showProfileAlert('New password and confirmation do not match!', 'error');
        return;
    }
    
    const changeBtn = event.target;
    const originalText = changeBtn.innerHTML;
    changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    changeBtn.disabled = true;
    
    try {
        const response = await fetch('../php/change_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showProfileAlert('Password changed successfully!', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        } else {
            showProfileAlert(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showProfileAlert('Network error. Please try again.', 'error');
    } finally {
        changeBtn.innerHTML = originalText;
        changeBtn.disabled = false;
    }
}

// =========================
// UPLOAD PROFILE PICTURE
// =========================

async function uploadProfilePicture(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    const maxSize = 2 * 1024 * 1024;
    
    if (file.size > maxSize) {
        showProfileAlert('File size must be less than 2MB!', 'error');
        return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showProfileAlert('Only JPG, JPEG, and PNG files are allowed!', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    showProfileAlert('Uploading profile picture...', 'info');
    
    try {
        const response = await fetch('../php/upload_profile_picture.php', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const avatarImg = document.getElementById('profileAvatarImg');
            if (avatarImg) {
                avatarImg.src = data.image_url + '?t=' + new Date().getTime();
            }
            showProfileAlert('Profile picture updated successfully!', 'success');
        } else {
            showProfileAlert(data.message || 'Failed to upload profile picture', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showProfileAlert('Network error. Please try again.', 'error');
    }
}

// =========================
// PASSWORD VISIBILITY TOGGLE
// =========================

function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.classList.remove('fa-eye');
        iconElement.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        iconElement.classList.remove('fa-eye-slash');
        iconElement.classList.add('fa-eye');
    }
}

// =========================
// FORGOT PASSWORD FUNCTIONS
// =========================

function showForgotPasswordModal() {
    const username = sessionStorage.getItem('username');
    const usernameInput = document.getElementById('forgotUsername');
    if (usernameInput) usernameInput.value = username || '';
    
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) modal.style.display = 'flex';
    
    fetch(`../php/get_security_questions.php?username=${username}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const q1 = document.getElementById('displaySecQuestion1');
                const q2 = document.getElementById('displaySecQuestion2');
                const q3 = document.getElementById('displaySecQuestion3');
                if (q1) q1.textContent = data.questions.sec_question_1 || 'Not set';
                if (q2) q2.textContent = data.questions.sec_question_2 || 'Not set';
                if (q3) q3.textContent = data.questions.sec_question_3 || 'Not set';
            }
        })
        .catch(err => console.error('Error loading security questions:', err));
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) modal.style.display = 'none';
    
    const alertContainer = document.getElementById('forgotPasswordAlert');
    if (alertContainer) alertContainer.innerHTML = '';
    
    const answer1 = document.getElementById('forgotAnswer1');
    const answer2 = document.getElementById('forgotAnswer2');
    const answer3 = document.getElementById('forgotAnswer3');
    if (answer1) answer1.value = '';
    if (answer2) answer2.value = '';
    if (answer3) answer3.value = '';
}

function showForgotPasswordAlert(message, type) {
    const container = document.getElementById('forgotPasswordAlert');
    if (!container) return;
    
    container.innerHTML = `<div style="padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; background: ${type === 'error' ? '#fee2e2' : '#d1fae5'}; color: ${type === 'error' ? '#991b1b' : '#065f46'};">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
}

function verifySecurityAnswers() {
    const username = document.getElementById('forgotUsername')?.value || '';
    const answers = {
        answer1: document.getElementById('forgotAnswer1')?.value || '',
        answer2: document.getElementById('forgotAnswer2')?.value || '',
        answer3: document.getElementById('forgotAnswer3')?.value || ''
    };
    
    if (!answers.answer1 || !answers.answer2 || !answers.answer3) {
        showForgotPasswordAlert('Please answer all security questions', 'error');
        return;
    }
    
    fetch('../php/verify_security_answers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answers })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeForgotPasswordModal();
            const resetModal = document.getElementById('resetPasswordModal');
            if (resetModal) resetModal.style.display = 'flex';
        } else {
            showForgotPasswordAlert(data.message || 'Incorrect answers', 'error');
        }
    })
    .catch(err => showForgotPasswordAlert('Network error', 'error'));
}

function closeResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) modal.style.display = 'none';
    
    const newPw = document.getElementById('resetNewPassword');
    const confirmPw = document.getElementById('resetConfirmPassword');
    if (newPw) newPw.value = '';
    if (confirmPw) confirmPw.value = '';
    
    const alertContainer = document.getElementById('resetPasswordAlert');
    if (alertContainer) alertContainer.innerHTML = '';
}

function showResetPasswordAlert(message, type) {
    const container = document.getElementById('resetPasswordAlert');
    if (!container) return;
    
    container.innerHTML = `<div style="padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; background: ${type === 'error' ? '#fee2e2' : '#d1fae5'}; color: ${type === 'error' ? '#991b1b' : '#065f46'};">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
}

function confirmResetPassword() {
    const username = document.getElementById('forgotUsername')?.value || '';
    const newPassword = document.getElementById('resetNewPassword')?.value || '';
    const confirmPassword = document.getElementById('resetConfirmPassword')?.value || '';
    
    if (!newPassword || !confirmPassword) {
        showResetPasswordAlert('Please fill in both password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showResetPasswordAlert('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showResetPasswordAlert('Password must be at least 8 characters', 'error');
        return;
    }
    
    fetch('../php/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, new_password: newPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showResetPasswordAlert('Password reset successfully! You will be logged out.', 'success');
            setTimeout(() => {
                closeResetPasswordModal();
                logout();
            }, 2000);
        } else {
            showResetPasswordAlert(data.message || 'Error resetting password', 'error');
        }
    })
    .catch(err => showResetPasswordAlert('Network error', 'error'));
}

// =========================
// LOGIN HISTORY
// =========================

let currentPage = 1, entriesPerPage = 10, totalLogs = 0, allLogs = [];

function changeEntriesPerPage() {
    const select = document.getElementById('entriesPerPage');
    entriesPerPage = parseInt(select?.value) || 10;
    currentPage = 1;
    if (allLogs.length > 0) displayUserLogs(allLogs);
}

function loadUserLoginHistory() {
    const username = sessionStorage.getItem('username');
    fetch(`../php/get_user_logs.php?username=${encodeURIComponent(username)}`, {
        credentials: 'include'
    })
    .then(async res => {
        if (res.status === 403) {
            const data = await res.json();
            if (data.blocked) {
                alert('Your account has been blocked by an administrator. You will be logged out.');
                sessionStorage.clear();
                window.location.href = '../html/sign-in.html';
                return Promise.reject('blocked');
            }
        }
        return res.json();
    })
    .then(data => {
        if (data.status === 200) displayUserLogs(data.logs);
        else showUserNoLogs('Error loading login history');
    })
    .catch(err => {
        if (err !== 'blocked') showUserNoLogs('Failed to load login history');
    });
}

function displayUserLogs(logs) {
    const tbody = document.getElementById('userLogsTableBody');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
        showUserNoLogs('No login history found');
        updatePaginationInfo(0, 0, 0);
        generatePaginationButtons(0);
        return;
    }

    allLogs = logs;
    totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / entriesPerPage);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * entriesPerPage;
    const end = Math.min(start + entriesPerPage, totalLogs);
    tbody.innerHTML = '';

    logs.slice(start, end).forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><i class="fas fa-${getDeviceIcon(log.device)}"></i> ${escapeHtml(log.device)}</div>
            <td><code>${log.ip}</code></div>
            <td>${formatDateTime(log.loginTime)}</div>
            <td>
                <span class="${log.status === 'success' ? 'status-success' : 'status-fail'}">
                    <i class="fas fa-${log.status === 'success' ? 'check-circle' : 'times-circle'}"></i> ${log.status}
                </span>
            </div>
        `;
        tbody.appendChild(row);
    });

    updatePaginationInfo(start + 1, end, totalLogs);
    generatePaginationButtons(totalPages);
}

function updatePaginationInfo(start, end, total) {
    document.getElementById('startEntry').textContent = total ? start : 0;
    document.getElementById('endEntry').textContent = end;
    document.getElementById('totalEntries').textContent = total;
}

function generatePaginationButtons(totalPages) {
    const container = document.getElementById('paginationButtons');
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn prev ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => goToPage(currentPage - 1);
    container.appendChild(prevBtn);

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    if (startPage > 1) {
        container.appendChild(createPageButton(1));
        if (startPage > 2) container.appendChild(createEllipsis());
    }

    for (let i = startPage; i <= endPage; i++) container.appendChild(createPageButton(i));

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) container.appendChild(createEllipsis());
        container.appendChild(createPageButton(totalPages));
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn next ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => goToPage(currentPage + 1);
    container.appendChild(nextBtn);
}

function createPageButton(num) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${num === currentPage ? 'active' : ''}`;
    btn.textContent = num;
    btn.onclick = () => goToPage(num);
    return btn;
}

function createEllipsis() {
    const span = document.createElement('span');
    span.className = 'pagination-ellipsis';
    span.textContent = '...';
    return span;
}

function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalLogs / entriesPerPage)) return;
    currentPage = page;
    displayUserLogs(allLogs);
    if (window.innerWidth <= 1024) {
        document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showUserNoLogs(msg) {
    const tbody = document.getElementById('userLogsTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:60px 20px; color:#6b7280;">
        <i class="fas fa-history" style="font-size:48px; display:block; color:#cbd5e1; margin-bottom:15px;"></i>
        <p>${msg}</p>
    </div></tr>`;
}

// =========================
// UTILITY FUNCTIONS
// =========================

function getDeviceIcon(device) {
    const d = device.toLowerCase();
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
    } catch(e) {
        return datetime;
    }
}

// =========================
// LOGOUT
// =========================

function attachLogoutHandlers() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    const username = sessionStorage.getItem('username');
    const clear = () => { sessionStorage.clear(); window.location.href = '../html/sign-in.html'; };
    if (username) fetch(`../php/loginvalidation.php?action=logout&username=${encodeURIComponent(username)}`).finally(clear);
    else clear();
}

// =========================
// RESPONSIVE MENU
// =========================

function updateAccountMenuVisibility() {
    const toggleBtn = document.querySelector('.account-menu-toggle');
    const sidebar = document.getElementById('accountSidebar');
    if (!toggleBtn || !sidebar) return;
    
    toggleBtn.style.display = 'flex';
    
    if (window.innerWidth > 1024 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// =========================
// SESSION CHECK
// =========================

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
    }, 10000);
}

startSessionCheck();