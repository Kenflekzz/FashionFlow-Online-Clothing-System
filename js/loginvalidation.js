// Clear any stored session data on page load to prevent conflicts
function clearStoredSessionData() {
    // DON'T clear sessionStorage if we're on the dashboard pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('super_admin_dashboard.html') || 
        currentPath.includes('admin_dashboard.html') || 
        currentPath.includes('user_dashboard.html')) {
        console.log('On dashboard page - preserving sessionStorage');
        return;
    }
    
    // Clear sessionStorage to prevent old user data from interfering
    sessionStorage.removeItem('account_status');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('full_name');
    sessionStorage.removeItem('email');
    
    console.log('Cleared sessionStorage on login page');
    
    // Clear form fields to prevent browser autofill issues
    const usernameField = document.getElementById('Username');
    const passwordField = document.getElementById('Password');
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';
}
let failedAttempts = 0;  
let lockoutTime = 0;     
let isSubmitting = false; 
let interval; 

// Save lockout state to localStorage
function saveLockoutState(seconds) {
    const lockoutEndTime = Date.now() + seconds * 1000; 
    localStorage.setItem('lockoutEndTime', lockoutEndTime); 
    localStorage.setItem('failedAttempts', failedAttempts); 
}

// Load lockout state from localStorage
function loadLockoutState() {
    const lockoutEndTime = localStorage.getItem('lockoutEndTime');
    if (lockoutEndTime) {
        const remainingTime = Math.floor((lockoutEndTime - Date.now()) / 1000); 
        if (remainingTime > 0) {
            lockoutTime = remainingTime; 
            startLockoutTimer(lockoutTime); 
            disableElements(true); 
        } else {
            localStorage.removeItem('lockoutEndTime'); 
            localStorage.removeItem('failedAttempts'); 
        }
    }

    const storedFailedAttempts = parseInt(localStorage.getItem('failedAttempts'), 10);
    if (storedFailedAttempts >= 2) {
        failedAttempts = storedFailedAttempts;
        displayForgotPassword();
    }
}

// Clear any stored session data on page load to prevent conflicts
function clearStoredSessionData() {
    // Clear sessionStorage to prevent old user data from interfering
    sessionStorage.removeItem('account_status');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('user_id'); // Add this
    sessionStorage.removeItem('full_name'); // Add this
    sessionStorage.removeItem('email'); // Add this
    
    // Clear form fields to prevent browser autofill issues
    const usernameField = document.getElementById('Username');
    const passwordField = document.getElementById('Password');
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';
}

// Modified loginValidation with cache-busting and better error handling
async function loginValidation(event) {
    event.preventDefault(); 

    if (lockoutTime > 0) {
        alert(`Access denied for ${lockoutTime} seconds. Please wait.`);
        return; 
    }

    if (isSubmitting) {
        console.log('Form is already submitting. Preventing further submission.');
        return; 
    }

    isSubmitting = true; 

    // Get fresh values directly from DOM
    const username = document.getElementById('Username').value.trim();
    const password = document.getElementById('Password').value.trim();

    // Debug: Log what we're actually sending
    console.log('Attempting login with username:', username);

    const validationMessage = validateInput(username, password);
    if (validationMessage) {    
        alert(validationMessage);
        incrementFailedAttempts();
        isSubmitting = false;
        return;
    }

    try {
        // ADD cache-busting to prevent browser from caching the request
        const response = await fetch('../php/loginvalidation.php?t=' + new Date().getTime(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            cache: 'no-store', // Prevent fetch caching
            credentials: 'same-origin', // IMPORTANT: This sends cookies with the request
            body: new URLSearchParams({
                'Username': username,
                'Password': password,
            }),
        });

        const result = await response.json();
        
        // Debug: Log the response
        console.log('Server response:', result);
        
        if (result.status === 200) {
            alert("Login successful!"); 
            failedAttempts = 0;
            localStorage.removeItem('lockoutEndTime'); 
            localStorage.removeItem('failedAttempts'); 
            
            // Store ALL user data in sessionStorage for dashboard use
            sessionStorage.setItem('account_status', result.account_status);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('user_id', result.user_id); // Add this
            sessionStorage.setItem('full_name', result.full_name || username); // Add this
            sessionStorage.setItem('email', result.email || ''); // Add this

            // DEBUG: Check what was just stored
            console.log('=== AFTER STORING IN SESSIONSTORAGE ===');
            console.log('user_id:', sessionStorage.getItem('user_id'));
            console.log('username:', sessionStorage.getItem('username'));
            console.log('account_status:', sessionStorage.getItem('account_status'));
            console.log('full_name:', sessionStorage.getItem('full_name'));
            console.log('All sessionStorage keys:', Object.keys(sessionStorage));
            
            
            console.log('Stored in sessionStorage:', {
                user_id: result.user_id,
                username: username,
                account_status: result.account_status,
                full_name: result.full_name
            });
            
            // Clear form before redirect to prevent autofill issues next time
            document.getElementById('Username').value = '';
            document.getElementById('Password').value = '';
            
            console.log('Redirecting to:', result.dashboard);
            // Redirect based on account status
            if (result.dashboard) {
                window.location.href = result.dashboard;
            } else {
                window.location.href = '../html/menu.html';
            }

        } else {
            alert(result.message);
            incrementFailedAttempts();
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred. Please try again later.");
    } finally {
        isSubmitting = false;
    }
}

// Validate username and password length
function validateInput(username, password) {
    let messages = []; 

    if (username.length < 4 || username.length > 15) {
        messages.push("Username must be between 4 and 30 characters.");
    }
    if (password.length < 4 || password.length > 15) {
        messages.push("Password must be between 4 and 30 characters.");
    }

    return messages.length > 0 ? messages.join("\n") : null; 
}

// Increment failed login attempts
function incrementFailedAttempts() {
    failedAttempts++;

    if (failedAttempts === 2) {
        displayForgotPassword();
    }

    handleLockout();
}

// Handle lockout based on failed attempts
function handleLockout() {
    if (failedAttempts % 3 === 0) { 
        if (failedAttempts <= 3) {
            lockoutTime = 15; 
        } else if (failedAttempts <= 6) {
            lockoutTime = 30; 
        } else {
            lockoutTime = 60; 
        }
    } else {
        return; 
    }

    alert(`Access denied for ${lockoutTime} seconds. Please wait.`);
    saveLockoutState(lockoutTime); 
    disableElements(true); 
    startLockoutTimer(lockoutTime); 
}

function preventPageRefreshDuringLockout() {
    if (lockoutTime > 0) {
        window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    function handleBeforeUnload(event) {
        if(lockoutTime > 0){
            event.preventDefault();
        }
    }
}

// Start the lockout timer
function startLockoutTimer(seconds) {
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.style.display = 'block'; 

    timerDisplay.textContent = `Access denied for ${seconds} seconds.`;

    clearInterval(interval);

    interval = setInterval(() => {
        if (seconds > 0) {
            seconds--;
            timerDisplay.textContent = `Access denied for ${seconds} seconds.`;
        } else {
            clearInterval(interval);
            timerDisplay.textContent = ""; 
            timerDisplay.style.display = 'none'; 
            lockoutTime = 0; 
            disableElements(false); 
            localStorage.removeItem('lockoutEndTime'); 
            localStorage.removeItem('backButtonDisabled'); 
            preventBackButton();
            preventPageRefreshDuringLockout();
        }
    }, 1000);
    preventBackButton();
    preventPageRefreshDuringLockout();
}

// Disable/Enable login button and registration link
function disableElements(disable) {
    const loginButton = document.querySelector('button[type="submit"]');
    const registerLink = document.querySelector('a[href="../html/sign-up.html"]');
    const usernameInput = document.getElementById('Username');
    const passwordField = document.getElementById('Password');

    loginButton.disabled = disable;
    usernameInput.disabled = disable;
    passwordField.disabled = disable;
    registerLink.style.pointerEvents = disable ? "none" : "auto";
    registerLink.style.color = disable ? "gray" : "orange"; 
    registerLink.style.opacity = disable ? "0.5" : "1";

    if (disable) { 
        loginButton.style.opacity = "0.5"; 
    } else {
        loginButton.style.backgroundColor = ""; 
        loginButton.style.color = ""; 
        loginButton.style.opacity = "1"; 
    }
}

// Prevent back button during lockout
function preventBackButton() {
    window.history.pushState(null, '', window.location.href);

    window.onpopstate = function () {
        window.history.forward();
    };

    if (lockoutTime > 0) {
        localStorage.setItem('backButtonDisabled', 'true');
    } else {
        localStorage.removeItem('backButtonDisabled'); 
    }
}

function restoreBackButtonState() {
    const backButtonDisabled = localStorage.getItem('backButtonDisabled');
    if (backButtonDisabled === 'true') {
        preventBackButton();
    }
}

// MODIFIED: Run when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Clear any old session data immediately on page load
    clearStoredSessionData();
    
    loadLockoutState(); 
    restoreBackButtonState(); 

    const loginForm = document.getElementById('loginForm');
    if (loginForm && !loginForm.hasAttribute('listener-added')) {
        loginForm.addEventListener('submit', loginValidation);
        loginForm.setAttribute('listener-added', 'true'); 
    }

    loadForgotPasswordState(); 
});

// Display forgot password link
function displayForgotPassword() {
    const forgotPasswordDiv = document.getElementById('forgotPasswordDiv');
    if (forgotPasswordDiv) {
        forgotPasswordDiv.style.display = 'block'; 
        localStorage.setItem('forgotPasswordVisible', 'true'); 
    }
}

// Load the visibility of "Forgot Password" on page load
function loadForgotPasswordState() {
    const forgotPasswordVisible = localStorage.getItem('forgotPasswordVisible');
    if (forgotPasswordVisible === 'true') {
        displayForgotPassword(); 
    }
}