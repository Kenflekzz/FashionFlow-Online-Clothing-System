// OTP Verification Page JavaScript

// Constants
const TIMER_DURATION   = 300;
const STORAGE_KEY      = 'otp_timer_expiry';
const EMAIL_STORAGE_KEY = 'recovery_email';
const UID_STORAGE_KEY   = 'recovery_user_id';

// Global variables
let countdownInterval;
let userId = '';

document.addEventListener('DOMContentLoaded', initializePage);

/**
 * Initialize page on load
 */
function initializePage() {
    loadUserData();
    setupEventListeners();
    document.getElementById('countdown').classList.add('expired');
    initializeTimer();
}

/**
 * Load user data from URL or sessionStorage
 */
function loadUserData() {
    const urlParams = new URLSearchParams(window.location.search);
    const email     = urlParams.get('email');
    const uid       = urlParams.get('uid');

    if (!email || !uid) {
        const storedEmail = sessionStorage.getItem(EMAIL_STORAGE_KEY);
        const storedUid   = sessionStorage.getItem(UID_STORAGE_KEY);

        if (!storedEmail || !storedUid) {
            window.location.href = 'user_id_verify.html';
            return;
        }

        displayData(storedEmail, storedUid);
    } else {
        sessionStorage.setItem(EMAIL_STORAGE_KEY, email);
        sessionStorage.setItem(UID_STORAGE_KEY, uid);
        displayData(email, uid);
    }

    const error = urlParams.get('error');
    if (error) {
        showAlert(decodeURIComponent(error), 'error');
    }

    // Display user ID and username from sessionStorage
    const userIdEl   = document.getElementById('displayUserId');
    const usernameEl = document.getElementById('displayUsername');
    if (userIdEl)   userIdEl.textContent   = sessionStorage.getItem('recovery_user_id')  || 'N/A';
    if (usernameEl) usernameEl.textContent = sessionStorage.getItem('recovery_username') || 'N/A';
}

/**
 * Display user email (masked)
 */
function displayData(email, uid) {
    document.getElementById('userEmail').textContent = maskEmail(email);
    userId = uid;
}

/**
 * Mask email for privacy
 */
function maskEmail(email) {
    const [localPart, domain] = email.split('@');
    if (!domain) return email;

    const visible = localPart.substring(0, 2);
    const masked  = '*'.repeat(Math.max(0, localPart.length - 2));
    return visible + masked + '@' + domain;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('otpForm');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const otpInput = document.getElementById('otp');
    if (otpInput) {
        otpInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^\d]/g, '');
        });
    }

    const resendBtn = document.getElementById('resendBtn');
    if (resendBtn) resendBtn.addEventListener('click', resendCode);
}

/**
 * Initialize timer
 */
function initializeTimer() {
    let expiryTime = sessionStorage.getItem(STORAGE_KEY);
    const now      = Date.now();

    if (!expiryTime) {
        expiryTime = now + (TIMER_DURATION * 1000);
        sessionStorage.setItem(STORAGE_KEY, expiryTime);
    }

    const remainingSeconds = Math.max(0, Math.floor((parseInt(expiryTime) - now) / 1000));

    if (remainingSeconds === 0) {
        const countdownEl      = document.getElementById('countdown');
        const resendContainer  = document.getElementById('resendContainer');
        const verifyBtn        = document.getElementById('verifyBtn');
        const btnText          = document.getElementById('btnText');

        countdownEl.textContent = 'Expired';
        countdownEl.classList.add('expired');
        countdownEl.style.color = '#dc3545';
        verifyBtn.disabled      = true;
        btnText.textContent     = 'Code Expired';
        resendContainer.classList.remove('hidden');
        return;
    }

    startTimer(remainingSeconds);
}

/**
 * Start countdown timer
 */
function startTimer(seconds) {
    const countdownEl     = document.getElementById('countdown');
    const resendContainer = document.getElementById('resendContainer');
    const verifyBtn       = document.getElementById('verifyBtn');
    const btnText         = document.getElementById('btnText');

    clearInterval(countdownInterval);

    countdownEl.classList.add('expired');
    countdownEl.style.color = '#dc3545';
    verifyBtn.disabled      = false;
    btnText.innerHTML       = 'Verify Code <i class="fas fa-arrow-right"></i>';
    resendContainer.classList.add('hidden');

    let remaining = seconds;

    function updateDisplay() {
        const minutes = Math.floor(remaining / 60);
        const secs    = remaining % 60;
        countdownEl.textContent =
            (minutes < 10 ? '0' + minutes : minutes) + ':' +
            (secs    < 10 ? '0' + secs    : secs);
        countdownEl.classList.add('expired');
    }

    updateDisplay();

    countdownInterval = setInterval(function () {
        remaining--;
        updateDisplay();
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            handleTimerExpired(countdownEl, resendContainer, verifyBtn, btnText);
        }
    }, 1000);
}

/**
 * Handle timer expiration
 */
function handleTimerExpired(countdownEl, resendContainer, verifyBtn, btnText) {
    countdownEl.textContent = 'Expired';
    countdownEl.classList.add('expired');
    countdownEl.style.color = '#dc3545';
    verifyBtn.disabled      = true;
    btnText.textContent     = 'Code Expired';
    resendContainer.classList.remove('hidden');
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const otp     = document.getElementById('otp').value;
    const btn     = document.getElementById('verifyBtn');
    const btnText = document.getElementById('btnText');

    if (!otp || otp.length !== 6) {
        showAlert('Please enter a valid 6-digit code.', 'error');
        return;
    }

    setLoadingState(btn, btnText, true);

    try {
        const response = await fetch('../php/verify-otp.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    new URLSearchParams({ otp })
        });

        const data = await response.json();

        if (data.success) {
            sessionStorage.removeItem(STORAGE_KEY);
            window.location.href = data.redirect;
        } else {
            showAlert(data.message, 'error');
            setLoadingState(btn, btnText, false);
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please try again.', 'error');
        setLoadingState(btn, btnText, false);
    }
}

/**
 * Resend OTP code
 */
async function resendCode() {
    if (!userId) {
        showAlert('Session expired. Please start over.', 'error');
        return;
    }

    const resendBtn    = document.getElementById('resendBtn');
    resendBtn.disabled = true;
    const originalHtml = resendBtn.innerHTML;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch('../php/send-otp.php', {
            method: 'POST',
            body:   new URLSearchParams({ user_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            const newExpiry = Date.now() + (TIMER_DURATION * 1000);
            sessionStorage.setItem(STORAGE_KEY, newExpiry);

            document.getElementById('resendContainer').classList.add('hidden');
            const verifyBtn = document.getElementById('verifyBtn');
            const btnText   = document.getElementById('btnText');
            verifyBtn.disabled  = false;
            btnText.innerHTML   = 'Verify Code <i class="fas fa-arrow-right"></i>';

            startTimer(TIMER_DURATION);
            showAlert('New code sent successfully!', 'success');
        } else {
            showAlert(data.message || 'Failed to resend code.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        resendBtn.disabled  = false;
        resendBtn.innerHTML = originalHtml;
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

    if (type === 'success') {
        setTimeout(() => { alertBox.innerHTML = ''; }, 3000);
    }
}

/**
 * Set button loading state
 */
function setLoadingState(btn, btnText, loading) {
    btn.disabled = loading;
    btnText.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin"></i> Verifying...'
        : 'Verify Code <i class="fas fa-arrow-right"></i>';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}