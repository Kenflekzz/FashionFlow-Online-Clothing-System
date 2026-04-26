// Reset Password Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();

    // Display user ID and username from sessionStorage
    const userIdEl   = document.getElementById('displayUserId');
    const usernameEl = document.getElementById('displayUsername');
    if (userIdEl)   userIdEl.textContent   = sessionStorage.getItem('recovery_user_id')  || 'N/A';
    if (usernameEl) usernameEl.textContent = sessionStorage.getItem('recovery_username') || 'N/A';
});

function initializeEventListeners() {
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
    } else {
        console.error('CRITICAL: Element with id "newPassword" not found');
    }

    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    } else {
        console.error('CRITICAL: Element with id "confirmPassword" not found');
    }

    const form = document.getElementById('resetPasswordForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('CRITICAL: Element with id "resetPasswordForm" not found');
    }
}

/**
 * Toggle password visibility
 */
function togglePassword(fieldId, btn) {
    const field = document.getElementById(fieldId);
    if (!field) { console.error(`togglePassword: Element "${fieldId}" not found`); return; }

    const icon = btn.querySelector('i');

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        btn.classList.add('active');
    } else {
        field.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        btn.classList.remove('active');
    }
}

/**
 * Check and display password strength
 */
function checkPasswordStrength(e) {
    const password      = e.target.value;
    const strengthBar   = document.getElementById('strengthBar');
    const strengthBarInner = document.getElementById('strengthBarInner');
    const reqs          = document.getElementById('passwordReqs');

    if (password.length > 0) {
        if (strengthBar) strengthBar.style.display = 'block';
        if (reqs)        reqs.style.display        = 'block';
    } else {
        if (strengthBar) strengthBar.style.display = 'none';
        if (reqs)        reqs.style.display        = 'none';
        return;
    }

    const requirements = {
        length:  password.length >= 8,
        upper:   /[A-Z]/.test(password),
        lower:   /[a-z]/.test(password),
        number:  /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    updateRequirement('req-length',  requirements.length);
    updateRequirement('req-upper',   requirements.upper);
    updateRequirement('req-lower',   requirements.lower);
    updateRequirement('req-number',  requirements.number);
    updateRequirement('req-special', requirements.special);

    const strength = Object.values(requirements).filter(Boolean).length;

    if (strengthBarInner) {
        strengthBarInner.className = 'password-strength-bar';
        if (strength <= 2)      strengthBarInner.classList.add('strength-weak');
        else if (strength <= 4) strengthBarInner.classList.add('strength-medium');
        else                    strengthBarInner.classList.add('strength-strong');
    }
}

/**
 * Update requirement indicator
 */
function updateRequirement(id, met) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector('i');
    if (met) {
        el.classList.add('requirement-met');
        if (icon) icon.className = 'fas fa-check';
    } else {
        el.classList.remove('requirement-met');
        if (icon) { icon.className = 'fas fa-circle'; icon.style.fontSize = '6px'; }
    }
}

/**
 * Check if passwords match
 */
function checkPasswordMatch(e) {
    const newPassInput = document.getElementById('newPassword');
    const matchMsg     = document.getElementById('matchMessage');
    if (!newPassInput || !matchMsg) return;

    const confirmPass = e.target.value;

    if (confirmPass.length === 0) {
        matchMsg.style.display = 'none';
        matchMsg.classList.remove('error');
        return;
    }

    matchMsg.style.display = 'flex';

    if (newPassInput.value === confirmPass) {
        matchMsg.classList.remove('error');
        matchMsg.innerHTML = '<i class="fas fa-check-circle"></i><span>Passwords match</span>';
    } else {
        matchMsg.classList.add('error');
        matchMsg.innerHTML = '<i class="fas fa-times-circle"></i><span>Passwords do not match</span>';
    }
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const alertBox  = document.getElementById('alertBox');
    const icon      = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    const className = type === 'error' ? 'alert-error' : 'alert-success';

    if (!alertBox) { alert((type === 'error' ? 'Error: ' : 'Success: ') + message); return; }

    alertBox.innerHTML = `
        <div class="alert ${className}" style="margin-bottom: 15px;">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const newPassInput     = document.getElementById('newPassword');
    const confirmPassInput = document.getElementById('confirmPassword');

    if (!newPassInput || !confirmPassInput) {
        alert('Form error: Password fields not found. Please refresh the page.');
        return;
    }

    const newPass     = newPassInput.value;
    const confirmPass = confirmPassInput.value;

    if (newPass !== confirmPass) { showAlert('New passwords do not match.', 'error'); return; }
    if (newPass.length < 8)      { showAlert('New password must be at least 8 characters.', 'error'); return; }

    const btn     = document.getElementById('resetBtn');
    const btnText = document.getElementById('btnText');

    setLoadingState(btn, btnText, true);

    try {
        const response = await fetch('../php/reset-password.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    new URLSearchParams({ newPassword: newPass, confirmPassword: confirmPass })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessView();
            setTimeout(() => { window.location.href = data.redirect; }, 2000);
        } else {
            showAlert(data.message, 'error');
            setLoadingState(btn, btnText, false);
        }
    } catch (error) {
        console.error('Network/Server Error:', error);
        showAlert('Network error. Please try again.', 'error');
        setLoadingState(btn, btnText, false);
    }
}

/**
 * Set button loading state
 */
function setLoadingState(btn, btnText, loading) {
    if (!btn || !btnText) return;
    btn.disabled      = loading;
    btnText.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin"></i> Processing...'
        : 'Reset Password <i class="fas fa-check-circle"></i>';
}

/**
 * Show success view animation
 */
function showSuccessView() {
    const formContent = document.getElementById('resetFormContent');
    const successView = document.getElementById('successView');
    if (formContent) formContent.style.display  = 'none';
    if (successView) { successView.classList.remove('hidden'); successView.style.display = 'block'; }
}