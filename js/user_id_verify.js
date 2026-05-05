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
 * Handle form submission with account approval check
 * Three-step process: 1) Check Account Approval, 2) Validate User ID, 3) Send OTP
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const user_id = formData.get('user_id');
    const submitButton = document.getElementById('submitButton');
    const btnText = document.getElementById('btnText');
    const alertContainer = document.getElementById('alertContainer');
    
    // Clear previous alerts
    alertContainer.innerHTML = '';
    
    // Validate format
    const pattern = /^\d{4}-\d{4}$/;
    if (!pattern.test(user_id)) {
        showAlert('Please enter a valid User ID in format: xxxx-xxxx', 'error');
        return;
    }
    
    setLoadingState(submitButton, btnText, true, 'Checking account...');
    
    try {
        // ── Step 1: Check Account Approval Status ──────────────────────────────
        const approvalResponse = await fetch('../php/check_account_approval.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: user_id })
        });

        const approvalData = await approvalResponse.json();

        if (!approvalResponse.ok || !approvalData.success) {
            throw new Error(approvalData.message || 'Failed to check account status');
        }

        // Check if account is approved by super admin
        if (!approvalData.is_approved) {
            let errorMessage = '⚠️ Account Not Approved. ';
            if (approvalData.status === 'pending') {
                errorMessage += 'Your account is pending approval from the Super Admin. Please wait for approval before resetting your password.';
            } else if (approvalData.status === 'rejected') {
                errorMessage += 'Your account has been rejected by the Super Admin. Please contact support for assistance.';
            } else {
                errorMessage += 'Please contact the Super Admin for account approval before proceeding with password recovery.';
            }
            showAlert(errorMessage, 'error');
            resetButton(submitButton, btnText, 'Continue');
            return;
        }

        // ── Step 2: Validate User ID ──────────────────────────────
        setLoadingState(submitButton, btnText, true, 'Verifying user...');
        
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
        sessionStorage.setItem('recovery_user_id', findData.user_id);
        sessionStorage.setItem('recovery_username', findData.username);

        // ── Step 3: Send OTP ──────────────────────────────────────
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
        showAlert(error.message || 'Network error. Please check your connection and try again.', 'error');
        resetButton(submitButton, btnText, 'Continue');
    }
}

/**
 * Build redirect URL with query parameters
 */
function buildRedirectUrl(baseUrl, email, userId) {
    const params = new URLSearchParams({
        email: email,
        uid: userId
    });
    return baseUrl + '?' + params.toString();
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
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