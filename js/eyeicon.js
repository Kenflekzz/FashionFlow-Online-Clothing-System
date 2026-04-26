function togglePassword(inputId, eyeIconElement) {
    // Get the input element by its ID
    const passwordInput = document.getElementById(inputId);
    
    // Check if the input type is 'password'
    if (passwordInput.type === "password") {
        // Change the input type to 'text' to show the password
        passwordInput.type = "text";

        // Remove the 'fa-eye' class (show icon) and add 'fa-eye-slash' class (hide icon)
        eyeIconElement.classList.remove("fa-eye");
        eyeIconElement.classList.add("fa-eye-slash");
    } else {
        // Change the input type back to 'password' to hide the password
        passwordInput.type = "password";

        // Remove the 'fa-eye-slash' class (hide icon) and add 'fa-eye' class (show icon)
        eyeIconElement.classList.remove("fa-eye-slash");
        eyeIconElement.classList.add("fa-eye");
    }
}
