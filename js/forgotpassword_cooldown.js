// ============================================
// FORGOT PASSWORD COOLDOWN SYSTEM
// ============================================

// Storage keys
const STORAGE_KEY = 'forgotPasswordAttempts';
const COOLDOWN_KEY = 'forgotPasswordCooldown';

// Configuration
const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 30;
const COOLDOWN_SECONDS = COOLDOWN_MINUTES * 60;

// Get current data from localStorage
function getForgotPasswordData() {
    const attempts = parseInt(localStorage.getItem(STORAGE_KEY)) || 0;
    const cooldownEnd = parseInt(localStorage.getItem(COOLDOWN_KEY)) || 0;
    return { attempts, cooldownEnd };
}

// Save attempts
function saveAttempts(attempts) {
    localStorage.setItem(STORAGE_KEY, attempts);
}

// Start cooldown
function startCooldown() {
    const cooldownEnd = Date.now() + (COOLDOWN_SECONDS * 1000);
    localStorage.setItem(COOLDOWN_KEY, cooldownEnd);
    localStorage.setItem(STORAGE_KEY, MAX_ATTEMPTS);
    return cooldownEnd;
}

// Reset attempts (after successful verification or after cooldown)
function resetAttempts() {
    localStorage.setItem(STORAGE_KEY, 0);
    localStorage.removeItem(COOLDOWN_KEY);
}

// Check if currently in cooldown
function isInCooldown() {
    const { cooldownEnd } = getForgotPasswordData();
    return cooldownEnd > Date.now();
}

// Get remaining cooldown time in seconds
function getRemainingCooldownSeconds() {
    const { cooldownEnd } = getForgotPasswordData();
    if (cooldownEnd <= Date.now()) return 0;
    return Math.ceil((cooldownEnd - Date.now()) / 1000);
}

// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display
let timerInterval = null;

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    const forgotLink = document.getElementById('forgotPasswordLink');
    
    if (isInCooldown()) {
        const remaining = getRemainingCooldownSeconds();
        if (remaining > 0) {
            timerDisplay.style.display = 'block';
            timerDisplay.innerHTML = `<i class="fas fa-clock"></i> Too many attempts. Please wait ${formatTime(remaining)} before trying again.`;
            if (forgotLink) {
                forgotLink.style.pointerEvents = 'none';
                forgotLink.style.opacity = '0.5';
                forgotLink.style.cursor = 'not-allowed';
            }
            return true;
        } else {
            // Cooldown expired, reset
            resetAttempts();
            timerDisplay.style.display = 'none';
            if (forgotLink) {
                forgotLink.style.pointerEvents = 'auto';
                forgotLink.style.opacity = '1';
                forgotLink.style.cursor = 'pointer';
            }
            return false;
        }
    } else {
        timerDisplay.style.display = 'none';
        if (forgotLink) {
            forgotLink.style.pointerEvents = 'auto';
            forgotLink.style.opacity = '1';
            forgotLink.style.cursor = 'pointer';
        }
        return false;
    }
}

// Start the countdown timer
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const stillInCooldown = updateTimerDisplay();
        if (!stillInCooldown && timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);
}

// Show custom alert message (ROW STYLE - fixed)
function showAlertMessage(message, type = 'info') {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        left: auto;
        z-index: 9999;
        padding: 14px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px;
        min-width: 300px;
        max-width: 450px;
        width: auto;
        font-family: inherit;
        line-height: 1.4;
    `;
    
    // Set colors based on type
    if (type === 'warning') {
        alertDiv.style.backgroundColor = '#fff3e0';
        alertDiv.style.borderLeft = '4px solid #ff9800';
        alertDiv.style.color = '#e65100';
    } else if (type === 'error') {
        alertDiv.style.backgroundColor = '#ffebee';
        alertDiv.style.borderLeft = '4px solid #f44336';
        alertDiv.style.color = '#c62828';
    } else {
        alertDiv.style.backgroundColor = '#e3f2fd';
        alertDiv.style.borderLeft = '4px solid #2196f3';
        alertDiv.style.color = '#0d47a1';
    }
    
    // Icon based on type
    let icon = '';
    if (type === 'warning') icon = '⚠️';
    else if (type === 'error') icon = '❌';
    else icon = 'ℹ️';
    
    alertDiv.innerHTML = `
        <span style="font-size: 18px; flex-shrink: 0;">${icon}</span>
        <span style="flex: 1; text-align: left;">${message}</span>
        <button onclick="this.closest('.custom-alert').remove()" style="background: none; border: none; font-size: 16px; cursor: pointer; color: inherit; padding: 0; margin: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">&times;</button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv && alertDiv.parentElement) {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translateX(100%)';
            alertDiv.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (alertDiv && alertDiv.parentElement) alertDiv.remove();
            }, 300);
        }
    }, 5000);
}

// Handle forgot password click
function handleForgotPassword(event) {
    event.preventDefault();
    
    // Check if in cooldown
    if (isInCooldown()) {
        const remaining = getRemainingCooldownSeconds();
        showAlertMessage(`Too many attempts! Please wait ${formatTime(remaining)} before trying again.`, 'warning');
        updateTimerDisplay();
        startTimer();
        return;
    }
    
    // Get current attempts
    const { attempts } = getForgotPasswordData();
    
    // Check if max attempts reached
    if (attempts >= MAX_ATTEMPTS) {
        startCooldown();
        updateTimerDisplay();
        startTimer();
        showAlertMessage(`You have exceeded the maximum of ${MAX_ATTEMPTS} attempts. Please wait ${COOLDOWN_MINUTES} minutes before trying again.`, 'warning');
        return;
    }
    
    // Increment attempts
    const newAttempts = attempts + 1;
    saveAttempts(newAttempts);
    
    // Show remaining attempts
    const remainingAttempts = MAX_ATTEMPTS - newAttempts;
    
    if (remainingAttempts > 0) {
        showAlertMessage(`Forgot password request initiated. You have ${remainingAttempts} attempt(s) remaining before a ${COOLDOWN_MINUTES}-minute cooldown.`, 'info');
    } else {
        showAlertMessage(`This is your last attempt. If you fail, you will be locked out for ${COOLDOWN_MINUTES} minutes.`, 'warning');
    }
    
    // Redirect to verification page
    setTimeout(() => {
        window.location.href = '../html/user_id_verify.html';
    }, 2000);
}

// Add CSS animation for slide in
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Check cooldown status on page load
document.addEventListener('DOMContentLoaded', function() {
    updateTimerDisplay();
    if (isInCooldown()) {
        startTimer();
    }
    
    // Also check if there's a pending cooldown from sessionStorage (for cross-page persistence)
    const pendingCooldown = sessionStorage.getItem('forgotPasswordPendingCooldown');
    if (pendingCooldown && !isInCooldown()) {
        sessionStorage.removeItem('forgotPasswordPendingCooldown');
    }
});

// Make functions global for onclick
window.handleForgotPassword = handleForgotPassword;