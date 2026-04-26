// User ID Verification Page JavaScript

document.addEventListener('DOMContentLoaded', initializePage);

/**
 * Initialize page functionality
 */
function initializePage() {
    setupInputFormatting();
    setupFormHandler();
}

/**
 * Setup auto-formatting for User ID input
 * Format: xxxx-xxxx
 */
function setupInputFormatting() {
    const userIdInput = document.getElementById('user_id');
    
    if (!userIdInput) return;
    
    userIdInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d]/g, '');
        value = value.substring(0, 8);
        if (value.length >= 4) {
            value = value.slice(0, 4) + '-' + value.slice(4);
        }
        e.target.value = value;
    });

    userIdInput.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.which);
        if (!/[\d]/.test(char) && e.which !== 8 && e.which !== 46) {
            e.preventDefault();
        }
    });
}

/**
 * Setup form submission handler
 */
function setupFormHandler() {
    const form = document.getElementById('forgotPasswordForm');
    if (!form) return;
    form.addEventListener('submit', handleFormSubmit);
}

/**
 * Handle form submission
 * Two-step process: 1) Validate User ID, 2) Send OTP
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData      = new FormData(e.target);
    const submitButton  = document.getElementById('submitButton');
    const btnText       = document.getElementById('btnText');
    const alertContainer = document.getElementById('alertContainer');
    
    alertContainer.innerHTML = '';
    setLoadingState(submitButton, btnText, true, 'Verifying...');
    
    try {
        // ── Step 1: Validate User ID ──────────────────────────────
        const findResponse = await fetch('../php/find_user.php', {
            method: 'POST',
            body: formData
        });

        const findData = await findResponse.json();

        if (!findData.success) {
            showAlert(findData.message || 'User ID not found.', 'error');
            resetButton(submitButton, btnText, 'Continue');
            return;
        }

        // Store user_id and username immediately after step 1 succeeds
        sessionStorage.setItem('recovery_user_id',  findData.user_id);
        sessionStorage.setItem('recovery_username', findData.username);

        // ── Step 2: Send OTP ──────────────────────────────────────
        setLoadingState(submitButton, btnText, true, 'Sending code...');
        
        const otpResponse = await fetch('../php/send-otp.php', {
            method: 'POST',
            body: formData
        });

        const otpData = await otpResponse.json();
        
        if (otpData.success) {
            // Store email from OTP response then redirect
            sessionStorage.setItem('recovery_email', otpData.email);

            const redirectUrl = buildRedirectUrl(otpData.redirect, otpData.email, otpData.user_id);
            window.location.href = redirectUrl;
        } else {
            showAlert(otpData.message || 'Failed to send verification code.', 'error');
            resetButton(submitButton, btnText, 'Continue');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
        resetButton(submitButton, btnText, 'Continue');
    }
}

/**
 * Build redirect URL with query parameters
 */
function buildRedirectUrl(baseUrl, email, userId) {
    const params = new URLSearchParams({
        email: email,
        uid:   userId
    });
    return baseUrl + '?' + params.toString();
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const icon      = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    const className = type === 'error' ? 'alert-error' : 'alert-success';
    
    alertContainer.innerHTML = `
        <div class="alert ${className}">
            <i class="fas ${icon}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    if (type === 'success') {
        setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
    }
}

/**
 * Set button loading state
 */
function setLoadingState(button, btnTextSpan, loading, text) {
    button.disabled = loading;
    if (loading) {
        btnTextSpan.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }
}

/**
 * Reset button to default state
 */
function resetButton(button, btnTextSpan, originalText) {
    button.disabled = false;
    btnTextSpan.innerHTML = `${originalText} <i class="fas fa-arrow-right"></i>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}