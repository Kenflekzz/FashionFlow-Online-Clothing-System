document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registrationForm");
    const submitButton = document.getElementById("submitButton");

    submitButton.addEventListener("click", async function (event) {
        event.preventDefault(); // Prevent form submission initially

        let formValid = true; // Initialize form validation status

        async function validateField(fieldName, fieldValue, fieldLabel) {
            if (fieldValue.length > 0) {
                try {
                    const response = await fetch("../php/server-side-validation.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: `check_${fieldName}=true&${fieldName}=${encodeURIComponent(fieldValue)}`,
                    });

                    if (response.status === 409) {
                        formValid = false; // Mark form as invalid
                        alert(`${fieldLabel} already exists. Please choose a different one.`);
                        return false; // Stop further validation for this field
                    }
                    return true; // Validation passed for this field
                } catch (error) {
                    formValid = false; // Mark form as invalid
                    alert("Network error. Please try again later.");
                    return false; // Stop further validation
                }
            }
            return true; // Skip empty fields
        }

        // Validate individual fields sequentially
        const ID = document.getElementById("ID").value.trim();
        if (!(await validateField("ID", ID, "User ID"))) return; // Stop if ID validation fails

        const username = document.getElementById("Username").value.trim();
        if (!(await validateField("username", username, "Username"))) return; // Stop if Username validation fails

        const email = document.getElementById("Email").value.trim();
        if (!(await validateField("email", email, "Email"))) return; // Stop if Email validation fails

        const password = document.getElementById("Password").value.trim();
        if (!(await validateField("password", password, "Password"))) return; // Stop if Password validation fails

        // Only submit the form if all validations pass
        if (formValid) {
            form.submit(); // Submit the form
        } else {
            console.log("Form submission blocked due to validation errors.");
        }
    });
});
