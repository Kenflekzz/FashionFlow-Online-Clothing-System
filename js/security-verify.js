// Security Verification Page JavaScript

document.addEventListener('DOMContentLoaded', initializePage);

/**
 * Initialize page on load
 */
function initializePage() {
    loadSecurityQuestions();
    setupFormHandler();

    // Display user ID and username from sessionStorage
    const userIdEl   = document.getElementById('displayUserId');
    const usernameEl = document.getElementById('displayUsername');
    if (userIdEl)   userIdEl.textContent   = sessionStorage.getItem('recovery_user_id')  || 'N/A';
    if (usernameEl) usernameEl.textContent = sessionStorage.getItem('recovery_username') || 'N/A';
}

/**
 * Load security questions from server
 */
async function loadSecurityQuestions() {
    const labels = [
        document.getElementById('label1'),
        document.getElementById('label2'),
        document.getElementById('label3')
    ];

    try {
        const response = await fetch('../php/get-security-questions.php');

        if (!response.ok) {
            throw new Error('Failed to fetch questions: ' + response.status);
        }

        const data = await response.json();

        if (data.success && data.questions && data.questions.length === 3) {
            labels.forEach((label, index) => {
                const icon = label.querySelector('i');
                label.innerHTML = '';
                label.appendChild(icon);
                label.appendChild(document.createTextNode(' ' + data.questions[index]));
            });
        } else {
            showAlert(data.message || 'Failed to load security questions.', 'error');
            redirectToStep1();
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        showAlert('Failed to load questions. Please refresh or try again.', 'error');
    }
}

/**
 * Setup form submission handler
 */
function setupFormHandler() {
    const form = document.getElementById('securityForm');
    if (!form) { console.error('Security form not found'); return; }
    form.addEventListener('submit', handleFormSubmit);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const btn     = document.getElementById('verifyBtn');
    const btnText = document.getElementById('btnText');

    setLoadingState(btn, btnText, true);

    const formData = new FormData(e.target);

    try {
        const response = await fetch('../php/get-security-answers.php', {
            method: 'POST',
            body:   formData
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirect;
        } else {
            showAlert(data.message || 'Incorrect answers. Please try again.', 'error');
            resetButton(btn, btnText);
        }
    } catch (error) {
        console.error('Submit error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
        resetButton(btn, btnText);
    }
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const alertBox  = document.getElementById('alertBox');
    const icon      = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    const className = type === 'error' ? 'alert-error' : 'alert-success';

    alertBox.innerHTML = `
        <div class="alert ${className}" style="margin-bottom: 15px;">
            <i class="fas ${icon}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
}

/**
 * Set button loading state
 */
function setLoadingState(btn, btnText, loading) {
    btn.disabled = loading;
    btnText.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin"></i> Verifying...'
        : 'Verify Answers <i class="fas fa-arrow-right"></i>';
}

/**
 * Reset button to default state
 */
function resetButton(btn, btnText) {
    btn.disabled      = false;
    btnText.innerHTML = 'Verify Answers <i class="fas fa-arrow-right"></i>';
}

/**
 * Redirect to step 1 after delay
 */
function redirectToStep1() {
    setTimeout(() => {
        window.location.href = 'user_id_verify.html';
    }, 2000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}