/**
 * validation.js — Staff Registration Form (Admin Dashboard)
 *
 * Original validation logic preserved exactly.
 * Changes from original:
 *   1. alert() replaced with inline field-level error messages
 *   2. Real-time validation on input / blur / change events
 *   3. Role-aware password length:
 *        user        → 8–15 characters
 *        admin       → 12–15 characters
 *        super admin → 12–15 characters
 *   4. Posts to admin_create_account.php (not uservalidation.php)
 *   5. On success calls showToast() instead of redirecting
 *   6. Security questions made optional (skip validation if elements don't exist)
 */

document.addEventListener("DOMContentLoaded", function () {

    // ─────────────────────────────────────────────────────────
    // 1. Field references  (IDs match HTML exactly)
    // ─────────────────────────────────────────────────────────
    // Field ID map
    const fieldIdMap = {
        id:        'ID',
        fname:     'Fname',
        lname:     'Lname',
        user:      'Username',
        pass:      'Password',
        repass:    'Re-password',
        minitial:  'M-Initial',
        email:     'Email',
        zip:       'Zip-code',
        purok:     'Purok',
        barangay:  'Barangay',
        city:      'City',
        province:  'Province',
        country:   'Country',
        birthdate: 'birthdate',
        sex:       'Sex',
        ename:     'Ename'
    };

    // Always fetch live from DOM — never cache
    const formFields = {
        get id()        { return document.getElementById('ID'); },
        get fname()     { return document.getElementById('Fname'); },
        get lname()     { return document.getElementById('Lname'); },
        get user()      { return document.getElementById('Username'); },
        get pass()      { return document.getElementById('Password'); },
        get repass()    { return document.getElementById('Re-password'); },
        get minitial()  { return document.getElementById('M-Initial'); },
        get email()     { return document.getElementById('Email'); },
        get zip()       { return document.getElementById('Zip-code'); },
        get purok()     { return document.getElementById('Purok'); },
        get barangay()  { return document.getElementById('Barangay'); },
        get city()      { return document.getElementById('City'); },
        get province()  { return document.getElementById('Province'); },
        get country()   { return document.getElementById('Country'); },
        get birthdate() { return document.getElementById('birthdate'); },
        get sex()       { return document.getElementById('Sex'); },
        get ename()     { return document.getElementById('Ename'); }
    };

    const fieldNames = {
        id:        "ID",
        fname:     "First Name",
        lname:     "Last Name",
        birthdate: "Birthdate",
        user:      "Username",
        pass:      "Password",
        repass:    "Re-entered Password",
        minitial:  "Middle Initial",
        email:     "Email Address",
        zip:       "Zip Code",
        purok:     "Purok",
        barangay:  "Barangay",
        city:      "City",
        province:  "Province",
        country:   "Country",
        sex:       "Sex",
        ename:     "Name Extension"
    };

    // ─────────────────────────────────────────────────────────
    // 2. Inline error / success helpers
    // ─────────────────────────────────────────────────────────

    function showFieldError(el, message) {
        if (!el) return;
        clearFieldState(el);
        el.classList.add('input-error');

        const err = document.createElement('div');
        err.className = 'field-error';
        err.style.cssText = 'display:flex;align-items:center;gap:5px;color:#dc2626;font-size:12px;margin-top:4px;';
        err.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:11px;flex-shrink:0;"></i><span>${message}</span>`;

        // Append inside .form-field so placement is always correct
        // regardless of password-container wrappers or strength bars
        const formField = el.closest('.form-field');
        if (formField) {
            formField.appendChild(err);
        } else {
            const anchor = el.closest('.password-container') || el;
            anchor.insertAdjacentElement('afterend', err);
        }
    }

    function showFieldSuccess(el) {
        if (!el) return;
        clearFieldState(el);
        el.classList.add('input-valid');
    }

    function clearFieldState(el) {
        if (!el) return;
        el.classList.remove('input-error', 'input-valid');
        // Remove ALL stale .field-error elements inside the parent .form-field
        const formField = el.closest('.form-field');
        if (formField) {
            formField.querySelectorAll('.field-error').forEach(e => e.remove());
        } else {
            const anchor = el.closest('.password-container') || el;
            const next = anchor.nextElementSibling;
            if (next && next.classList.contains('field-error')) next.remove();
        }
    }

    // ─────────────────────────────────────────────────────────
    // 3. Role helper
    // ─────────────────────────────────────────────────────────

    function getSelectedRole() {
        const roleInput = document.getElementById('staffSelectedRole');
        return roleInput ? roleInput.value.trim().toLowerCase() : 'user';
    }

    function isAdminRole() {
        const role = getSelectedRole();
        return role === 'admin' || role === 'super admin';
    }

    function passwordLengthRule() {
        return isAdminRole()
            ? { min: 12, max: 15, label: 'admin/super admin accounts require 12–15 characters' }
            : { min: 8,  max: 15, label: 'user accounts require 8–15 characters' };
    }

    // ─────────────────────────────────────────────────────────
    // 4. Password strength (original logic preserved)
    // ─────────────────────────────────────────────────────────

    function checkPasswordStrength(password) {
        const weakRegex   = /^[a-zA-Z]{6,15}$/;
        const mediumRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,15}$/;
        const strongRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{6,15}$/;
        if (strongRegex.test(password)) return 'Strong';
        if (mediumRegex.test(password)) return 'Medium';
        if (weakRegex.test(password))   return 'Weak';
        return 'Weak';
    }

    function updateStrengthUI(password) {
        const bar   = document.getElementById('passwordStrengthBar');
        const label = document.getElementById('passwordStrengthLabel');
        if (!bar || !label) return;
        if (!password) {
            bar.className     = 'password-strength-bar';
            bar.style.width   = '0%';
            label.textContent = '';
            label.className   = 'strength-label';
            return;
        }
        const s = checkPasswordStrength(password);
        bar.className     = `password-strength-bar strength-${s.toLowerCase()}`;
        label.textContent = `Strength: ${s}`;
        label.className   = `strength-label ${s.toLowerCase()}`;
    }

    // ─────────────────────────────────────────────────────────
    // 5. Core validateField — original logic, showAlert → showFieldError
    // ─────────────────────────────────────────────────────────

    function validateField(field) {
        const el = formFields[field];
        if (!el) return true;

        let isValid = true;

        // Empty check — skip optional fields
        if (el.value.trim() === "") {
            if (field !== "minitial" && field !== "ename") {
                showFieldError(el, `${fieldNames[field]} cannot be empty.`);
                return false;
            }
            clearFieldState(el);
            return true;
        }

        switch (field) {

            // ── ID ──────────────────────────────────────────
            case 'id': {
                const idValue = formFields.id.value.trim();
                if (/[a-zA-Z]/.test(idValue)) {
                    isValid = false;
                    showFieldError(el, "ID must be numbers only.");
                    break;
                }
                if (!/^\d{4}-\d{4}$/.test(idValue)) {
                    isValid = false;
                    showFieldError(el, "ID must be in the format ####-####.");
                    break;
                }
                showFieldSuccess(el);
                break;
            }

            // ── FIRST NAME ──────────────────────────────────
            case 'fname': {
                const fnameValue = formFields.fname.value.trim();
                if (fnameValue.length < 4 || fnameValue.length > 15) {
                    isValid = false;
                    showFieldError(el, "First name must be between 4 and 15 characters.");
                } else if (fnameValue.includes("  ") && !fnameValue.endsWith("  ")) {
                    isValid = false;
                    showFieldError(el, "First name should not contain double spaces.");
                } else if (/[^a-zA-Z\s]/.test(fnameValue)) {
                    isValid = false;
                    showFieldError(el, "First name should not contain special characters or numbers.");
                } else if (fnameValue === fnameValue.toUpperCase()) {
                    isValid = false;
                    showFieldError(el, "First Name should not be in all uppercase.");
                } else if (fnameValue === fnameValue.toLowerCase()) {
                    isValid = false;
                    showFieldError(el, "First Name field must not be all lowercase.");
                } else {
                    const words = fnameValue.split(/\s+/);

                    if (words.length === 1) {
                        const firstWord = words[0];
                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First name should not contain three consecutive identical letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First Name should begin in capital letter followed by all small letters.");
                        }
                    }

                    if (words.length > 1) {
                        const firstWord  = words[0];
                        const secondWord = words[1];

                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in First Name should not have three consecutive identical letters.");
                        } else if (firstWord === firstWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "First word in First Name should not be in all capital letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word of First Name should begin in capital letter followed by all small letters.");
                        } else if (secondWord === secondWord.toLowerCase()) {
                            isValid = false;
                            showFieldError(el, "Second word of First Name should not be all lowercase.");
                        } else if (secondWord === secondWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "Second word in First Name should not be in all capital letters.");
                        } else if (secondWord !== secondWord.toUpperCase() && !/^[A-Z][a-z]*$/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in First Name should start with a capital letter followed by all small letters.");
                        } else if (/([a-zA-Z])\1\1/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in the First Name should not contain three consecutive identical letters.");
                        }
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── LAST NAME ────────────────────────────────────
            case 'lname': {
                const lnameValue = formFields.lname.value.trim();
                if (lnameValue.length < 4 || lnameValue.length > 15) {
                    isValid = false;
                    showFieldError(el, "Last name must be between 4 and 15 characters.");
                } else if (lnameValue.includes("  ") && !lnameValue.endsWith("  ")) {
                    isValid = false;
                    showFieldError(el, "Last name should not contain double spaces.");
                } else if (/[^a-zA-Z\s]/.test(lnameValue)) {
                    isValid = false;
                    showFieldError(el, "Last name should not contain special characters or numbers.");
                } else if (lnameValue === lnameValue.toUpperCase()) {
                    isValid = false;
                    showFieldError(el, "Last Name should not be in all uppercase.");
                } else if (lnameValue === lnameValue.toLowerCase()) {
                    isValid = false;
                    showFieldError(el, "Last Name field must not be all lowercase.");
                } else {
                    const words = lnameValue.split(/\s+/);

                    if (words.length === 1) {
                        const firstWord = words[0];
                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Last name should not contain three consecutive identical letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Last name should begin in capital letter followed by all small letters.");
                        }
                    }

                    if (words.length > 1) {
                        const firstWord  = words[0];
                        const secondWord = words[1];

                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Last Name should not have three consecutive identical letters.");
                        } else if (firstWord === firstWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "First word in Last Name should not be in all capital letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Last Name should begin with a capital letter followed by all small letters.");
                        } else if (secondWord === secondWord.toLowerCase()) {
                            isValid = false;
                            showFieldError(el, "Second word of Last Name should not be all lowercase.");
                        } else if (secondWord === secondWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "Second word in Last Name should not be in all capital letters.");
                        } else if (secondWord !== secondWord.toUpperCase() && !/^[A-Z][a-z]*$/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Last Name should start with a capital letter followed by all small letters.");
                        } else if (/([a-zA-Z])\1\1/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Last Name should not contain three consecutive identical letters.");
                        }
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── USERNAME ─────────────────────────────────────
            case 'user': {
                const userValue = formFields.user.value.trim();
                if (userValue.length < 4 || userValue.length > 15) {
                    isValid = false;
                    showFieldError(el, "Username must be between 4 and 15 characters.");
                    break;
                }
                if (/ {2,}/.test(userValue)) {
                    isValid = false;
                    showFieldError(el, "Username should not contain double spaces.");
                    break;
                }
                if (/\s/.test(userValue)) {
                    isValid = false;
                    showFieldError(el, "Username should not have spaces.");
                    break;
                }
                if (/[A-Z]/.test(userValue)) {
                    isValid = false;
                    showFieldError(el, "Username should only be lowercase letters.");
                    break;
                }
                if (/[^a-z0-9._]/.test(userValue)) {
                    isValid = false;
                    showFieldError(el, "Username only accepts numbers, underscore, and dot.");
                    break;
                }
                if (/^\d+[a-z]/.test(userValue)) {
                    isValid = false;
                    showFieldError(el, "Username must not have a number before a letter.");
                    break;
                }
                if (/[a-z]+\d+[a-z]+/.test(userValue)) {
                    isValid = false;
                    showFieldError(el, "Username should not contain numbers between letters.");
                    break;
                }
                showFieldSuccess(el);
                break;
            }

            // ── BARANGAY ─────────────────────────────────────
            case 'barangay': {
                const barangayValue = formFields.barangay.value.trim();
                if (barangayValue.length < 4 || barangayValue.length > 20) {
                    isValid = false;
                    showFieldError(el, "Barangay must be between 4 and 20 characters.");
                } else if (/ {2,}/.test(barangayValue)) {
                    isValid = false;
                    showFieldError(el, "Barangay should not contain double spaces.");
                } else if (barangayValue === barangayValue.toUpperCase()) {
                    isValid = false;
                    showFieldError(el, "Barangay should not be in all uppercase.");
                } else if (barangayValue === barangayValue.toLowerCase()) {
                    isValid = false;
                    showFieldError(el, "Barangay field must not be all lowercase.");
                } else if (/^\d+[a-zA-Z]/.test(barangayValue)) {
                    isValid = false;
                    showFieldError(el, "Barangay should not have a number before a letter.");
                } else if (/[a-z]+\d+[a-z]+/.test(barangayValue)) {
                    isValid = false;
                    showFieldError(el, "Barangay should not contain numbers between letters.");
                } else {
                    const words = barangayValue.split(/\s+/);

                    if (words.length === 1) {
                        const firstWord = words[0];
                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Barangay should not contain three consecutive identical letters.");
                        }
                    }

                    if (words.length > 1 && isValid) {
                        const firstWord  = words[0];
                        const secondWord = words[1];

                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Barangay should not have three consecutive identical letters.");
                        } else if (firstWord === firstWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "First word in Barangay should not be in all capital letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Barangay should begin with a capital letter followed by small letters.");
                        } else if (secondWord !== secondWord.toUpperCase() && !/^[A-Z][a-z]*$/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Barangay should start with a capital letter followed by small letters.");
                        } else if (/([a-zA-Z])\1\1/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Barangay should not contain three consecutive identical letters.");
                        }
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── CITY ─────────────────────────────────────────
            case 'city': {
                const cityValue = formFields.city.value.trim();
                if (cityValue.length < 4 || cityValue.length > 20) {
                    isValid = false;
                    showFieldError(el, "City/Municipality must be between 4 and 20 characters.");
                } else if (cityValue.includes("  ") && !cityValue.endsWith("  ")) {
                    isValid = false;
                    showFieldError(el, "City/Municipality should not contain double spaces.");
                } else if (cityValue === cityValue.toUpperCase()) {
                    isValid = false;
                    showFieldError(el, "City/Municipality should not be in all uppercase.");
                } else if (cityValue === cityValue.toLowerCase()) {
                    isValid = false;
                    showFieldError(el, "City/Municipality field must not be all lowercase.");
                } else if (/^\d+[a-zA-Z]/.test(cityValue)) {
                    isValid = false;
                    showFieldError(el, "City/Municipality should not have a number before a letter.");
                } else if (/[^a-zA-Z\s]/.test(cityValue)) {
                    isValid = false;
                    showFieldError(el, "City/Municipality should not contain special characters or numbers.");
                } else if (/[a-z]+\d+[a-z]+/.test(cityValue)) {
                    isValid = false;
                    showFieldError(el, "City/Municipality should not contain numbers between letters.");
                } else {
                    const words = cityValue.split(/\s+/);

                    if (words.length === 1) {
                        const firstWord = words[0];
                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "City/Municipality should not contain three consecutive identical letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "City/Municipality should begin with a capital letter followed by small letters.");
                        }
                    }

                    if (words.length > 1 && isValid) {
                        const firstWord  = words[0];
                        const secondWord = words[1];

                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in City/Municipality should not have three consecutive identical letters.");
                        } else if (firstWord === firstWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "First word in City/Municipality should not be in all capital letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in City/Municipality should begin with a capital letter followed by small letters.");
                        } else if (secondWord === secondWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "Second word in City/Municipality should not be in all capital letters.");
                        } else if (secondWord !== secondWord.toUpperCase() && !/^[A-Z][a-z]*$/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in City/Municipality should start with a capital letter followed by small letters.");
                        } else if (/([a-zA-Z])\1\1/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in City/Municipality should not contain three consecutive identical letters.");
                        }
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── PROVINCE ─────────────────────────────────────
            case 'province': {
                const provinceValue = formFields.province.value.trim();
                if (provinceValue.length < 4 || provinceValue.length > 20) {
                    isValid = false;
                    showFieldError(el, "Province must be between 4 and 20 characters.");
                } else if (/[a-z]+\d+[a-z]+/.test(provinceValue)) {
                    isValid = false;
                    showFieldError(el, "Province should not contain numbers between letters.");
                } else if (provinceValue.includes("  ") && !provinceValue.endsWith("  ")) {
                    isValid = false;
                    showFieldError(el, "Province should not contain double spaces.");
                } else if (provinceValue === provinceValue.toUpperCase()) {
                    isValid = false;
                    showFieldError(el, "Province should not be in all uppercase.");
                } else if (provinceValue === provinceValue.toLowerCase()) {
                    isValid = false;
                    showFieldError(el, "Province field must not be all lowercase.");
                } else if (/^\d+[a-zA-Z]/.test(provinceValue)) {
                    isValid = false;
                    showFieldError(el, "Province should not have a number before a letter.");
                } else if (/[^a-zA-Z\s]/.test(provinceValue)) {
                    isValid = false;
                    showFieldError(el, "Province should not contain special characters or numbers.");
                } else {
                    const words = provinceValue.split(/\s+/);

                    if (words.length === 1) {
                        const firstWord = words[0];
                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Province should not contain three consecutive identical letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Province should begin with a capital letter followed by small letters.");
                        }
                    }

                    if (words.length > 1 && isValid) {
                        const firstWord  = words[0];
                        const secondWord = words[1];

                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Province should not have three consecutive identical letters.");
                        } else if (firstWord === firstWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "First word in Province should not be in all capital letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Province should begin with a capital letter followed by small letters.");
                        } else if (secondWord === secondWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "Second word in Province should not be in all capital letters.");
                        } else if (secondWord !== secondWord.toUpperCase() && !/^[A-Z][a-z]*$/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Province should start with a capital letter followed by small letters.");
                        } else if (/([a-zA-Z])\1\1/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Province should not contain three consecutive identical letters.");
                        }
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── COUNTRY ──────────────────────────────────────
            case 'country': {
                const countryValue = formFields.country.value.trim();
                if (countryValue.length < 4 || countryValue.length > 20) {
                    isValid = false;
                    showFieldError(el, "Country must be between 4 and 20 characters.");
                } else if (countryValue.includes("  ") && !countryValue.endsWith("  ")) {
                    isValid = false;
                    showFieldError(el, "Country should not contain double spaces.");
                } else if (countryValue === countryValue.toUpperCase()) {
                    isValid = false;
                    showFieldError(el, "Country should not be in all uppercase.");
                } else if (countryValue === countryValue.toLowerCase()) {
                    isValid = false;
                    showFieldError(el, "Country field must not be all lowercase.");
                } else if (/^\d+[a-zA-Z]/.test(countryValue)) {
                    isValid = false;
                    showFieldError(el, "Country should not have a number before a letter.");
                } else if (/[^a-zA-Z\s]/.test(countryValue)) {
                    isValid = false;
                    showFieldError(el, "Country should not contain special characters or numbers.");
                } else if (/[a-z]+\d+[a-z]+/.test(countryValue)) {
                    isValid = false;
                    showFieldError(el, "Country should not contain numbers between letters.");
                } else {
                    const words = countryValue.split(/\s+/);

                    if (words.length === 1) {
                        const firstWord = words[0];
                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Country should not contain three consecutive identical letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "Country should begin with a capital letter followed by small letters.");
                        }
                    }

                    if (words.length > 1 && isValid) {
                        const firstWord  = words[0];
                        const secondWord = words[1];

                        if (/([a-zA-Z])\1\1/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Country should not have three consecutive identical letters.");
                        } else if (firstWord === firstWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "First word in Country should not be in all capital letters.");
                        } else if (!/^[A-Z][a-z]*$/.test(firstWord)) {
                            isValid = false;
                            showFieldError(el, "First word in Country should begin with a capital letter followed by small letters.");
                        } else if (secondWord === secondWord.toUpperCase()) {
                            isValid = false;
                            showFieldError(el, "Second word in Country should not be in all capital letters.");
                        } else if (secondWord !== secondWord.toUpperCase() && !/^[A-Z][a-z]*$/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Country should start with a capital letter followed by small letters.");
                        } else if (/([a-zA-Z])\1\1/.test(secondWord)) {
                            isValid = false;
                            showFieldError(el, "Second word in Country should not contain three consecutive identical letters.");
                        }
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── BIRTHDATE ────────────────────────────────────
            case 'birthdate': {
                const birthdate     = formFields.birthdate.value;
                const ageDisplay    = document.getElementById('ageDisplay');
                const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(birthdate);
                if (!isValidFormat) {
                    isValid = false;
                    showFieldError(el, "Birthdate must be in the format YYYY-MM-DD.");
                } else {
                    const birthDateObj = new Date(birthdate);
                    const today = new Date();
                    let age = today.getFullYear() - birthDateObj.getFullYear();
                    if (today.getMonth() < birthDateObj.getMonth() ||
                        (today.getMonth() === birthDateObj.getMonth() &&
                         today.getDate()  < birthDateObj.getDate())) {
                        age--;
                    }
                    if (ageDisplay) ageDisplay.textContent = `Your age is: ${age}`;
                    if (age < 18) {
                        isValid = false;
                        showFieldError(el, `You are not applicable for registering. Age is ${age}.`);
                    }
                }
                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── SEX ──────────────────────────────────────────
            case 'sex': {
                if (formFields.sex.value !== "Male" && formFields.sex.value !== "Female") {
                    isValid = false;
                    showFieldError(el, "Please select a valid gender.");
                } else {
                    showFieldSuccess(el);
                }
                break;
            }

            // ── MIDDLE INITIAL (optional) ────────────────────
            case 'minitial': {
                const minitial = formFields.minitial.value.trim();
                if (minitial === "") { clearFieldState(el); return true; }
                const isOnlyLetters = /^[A-Za-z]+$/.test(minitial);
                if (!isOnlyLetters) {
                    isValid = false;
                    showFieldError(el, "Middle Initial must contain only letters.");
                    break;
                }
                const isFirstLetterUppercase = minitial.charAt(0) === minitial.charAt(0).toUpperCase();
                if (!isFirstLetterUppercase) {
                    isValid = false;
                    showFieldError(el, "Middle Initial must start with a capital letter.");
                    break;
                }
                if (minitial.length < 1 || minitial.length > 10) {
                    isValid = false;
                    showFieldError(el, "Middle Initial must be between 1 and 10 characters.");
                    break;
                }
                isValid = true;
                showFieldSuccess(el);
                break;
            }

            // ── NAME EXTENSION (optional) ────────────────────
            case 'ename': {
                const enameValue = formFields.ename.value.trim();
                if (enameValue === "") { clearFieldState(el); return true; }
                const validExtensions    = ["Sr.", "Jr."];
                const romanNumeralsRegex = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)$/;
                const nameParts = enameValue.split(/\s+/);
                if (nameParts.length === 1 &&
                    (validExtensions.includes(enameValue) || romanNumeralsRegex.test(enameValue))) {
                    showFieldSuccess(el);
                    return true;
                } else {
                    isValid = false;
                    showFieldError(el, "The name must be 'Sr.', 'Jr.', or a valid Roman numeral (I, II, III, IV, etc.) in uppercase.");
                }
                break;
            }

            // ── PASSWORD ─────────────────────────────────────
            case 'pass': {
                const password = formFields.pass.value;
                const { min, max, label } = passwordLengthRule();

                if (password.length < min || password.length > max) {
                    isValid = false;
                    showFieldError(el, `Password must be between ${min} and ${max} characters (${label}).`);
                } else {
                    const passwordStrength = checkPasswordStrength(password);
                    if (passwordStrength === 'Weak') {
                        isValid = false;
                        showFieldError(el, "Password is too weak. Please use a stronger password example (password@123).");
                    } else if (passwordStrength === 'Medium') {
                        isValid = false;
                        showFieldError(el, "Password is medium. Please use a stronger password example (password@123).");
                    }
                }

                // Re-validate confirm password if already filled
                if (formFields.repass && formFields.repass.value) {
                    validateField('repass');
                }

                if (isValid) showFieldSuccess(el);
                break;
            }

            // ── CONFIRM PASSWORD ─────────────────────────────
            case 'repass': {
                isValid = formFields.repass.value === formFields.pass.value;
                if (!isValid) {
                    showFieldError(el, "Passwords do not match.");
                } else {
                    showFieldSuccess(el);
                }
                break;
            }

            // ── EMAIL ────────────────────────────────────────
            case 'email': {
                const emailValue = formFields.email.value.trim();
                if (emailValue.length < 4 || emailValue.length > 30) {
                    isValid = false;
                    showFieldError(el, "Email address must be between 4 and 30 characters.");
                    break;
                }
                const extensionPattern = /\.(com|ph|org|net|edu|gov)$/;
                if (!extensionPattern.test(emailValue)) {
                    isValid = false;
                    showFieldError(el, "Email address must end with a valid extension (e.g., .com, .ph, .org).");
                    break;
                }
                showFieldSuccess(el);
                break;
            }

            // ── PUROK ────────────────────────────────────────
            case 'purok': {
                const purokValue = formFields.purok.value.trim();
                if (/^[a-zA-Z]/.test(purokValue) && !/^[A-Z]/.test(purokValue)) {
                    isValid = false;
                    showFieldError(el, "Purok should begin with a capital letter.");
                } else if (purokValue === purokValue.toUpperCase() && /[a-zA-Z]/.test(purokValue)) {
                    isValid = false;
                    showFieldError(el, "Purok should not be in all capital letters.");
                } else if (/[^a-zA-Z0-9\s-]/.test(purokValue)) {
                    isValid = false;
                    showFieldError(el, "Purok should not contain special characters other than hyphens.");
                } else if (/^\d+[a-zA-Z]/.test(purokValue)) {
                    isValid = false;
                    showFieldError(el, "Purok should not have a number before a letter.");
                } else {
                    showFieldSuccess(el);
                }
                break;
            }

            // ── ZIP CODE ─────────────────────────────────────
            case 'zip': {
                const zipValue = formFields.zip.value.trim();
                if (/ {2,}/.test(zipValue)) {
                    isValid = false;
                    showFieldError(el, "Zip code should not contain double spaces.");
                    break;
                }
                if (/[^0-9]/.test(zipValue)) {
                    isValid = false;
                    showFieldError(el, "Zip code should only contain numbers.");
                } else if (zipValue.length !== 4) {
                    isValid = false;
                    showFieldError(el, "Zip code must be exactly 4 digits.");
                } else {
                    showFieldSuccess(el);
                }
                break;
            }

        } // end switch

        return isValid;
    }

    // ─────────────────────────────────────────────────────────
    // 6. Security question / answer validators (FIXED)
    // ─────────────────────────────────────────────────────────

    const secFields = [
        { id: 'staffSecQuestion1', container: 'secQ1Container', msg: 'Security question 1 is required.'            },
        { id: 'staffSecQuestion2', container: 'secQ2Container', msg: 'Security question 2 is required.'            },
        { id: 'staffSecQuestion3', container: 'secQ3Container', msg: 'Security question 3 is required.'            },
        { id: 'staffSecAnswer1',   container: 'secA1Container', msg: 'Answer to security question 1 is required.'  },
        { id: 'staffSecAnswer2',   container: 'secA2Container', msg: 'Answer to security question 2 is required.'  },
        { id: 'staffSecAnswer3',   container: 'secA3Container', msg: 'Answer to security question 3 is required.'  },
    ];

    function validateSecField(item) {
        const container = document.getElementById(item.container);
        
        // FIXED: Check if container exists before accessing style
        if (!container) return true;
        
        // Check if container is visible
        const isVisible = container.style.display !== 'none' && 
                         container.style.display !== '' && 
                         container.style.display !== 'contents';
        
        if (!isVisible) return true;

        const el = document.getElementById(item.id);
        if (!el) return true;

        if (!el.value || el.value.trim() === '') {
            showFieldError(el, item.msg);
            return false;
        }
        showFieldSuccess(el);
        return true;
    }

    // ─────────────────────────────────────────────────────────
    // 7. Real-time listeners
    // ─────────────────────────────────────────────────────────

    // ── Real-time listeners ──────────────────────────────────
    // Attach directly to each field using event delegation on the form.
    // This works even when the parent view is display:none at load time
    // because we listen on the form container, not individual elements.

    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {

        // BLUR — fires when user leaves any field: always validate
        registrationForm.addEventListener('focusout', function(e) {
            const el = e.target;
            if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA')) return;

            const id = el.id;

            // Find which formFields key this element belongs to
            const key = Object.keys(fieldIdMap).find(k => fieldIdMap[k] === id);
            if (key) {
                if (key === 'pass') updateStrengthUI(el.value);
                validateField(key);
                return;
            }

            // Check security fields
            const secItem = secFields.find(s => s.id === id);
            if (secItem) {
                validateSecField(secItem);
            }
        });

        // INPUT — fires on every keystroke: validate immediately
        registrationForm.addEventListener('input', function(e) {
            const el = e.target;
            if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA')) return;

            const id = el.id;
            const key = Object.keys(fieldIdMap).find(k => fieldIdMap[k] === id);
            if (key) {
                if (key === 'pass') updateStrengthUI(el.value);
                // Only show error while typing if field already has error state
                // (don't flash error on first keystroke)
                if (el.classList.contains('input-error') || el.classList.contains('input-valid')) {
                    validateField(key);
                }
                return;
            }

            const secItem = secFields.find(s => s.id === id);
            if (secItem) {
                if (el.classList.contains('input-error') || el.classList.contains('input-valid')) {
                    validateSecField(secItem);
                }
            }
        });

        // CHANGE — fires for select dropdowns
        registrationForm.addEventListener('change', function(e) {
            const el = e.target;
            if (!el || el.tagName !== 'SELECT') return;

            const id = el.id;
            const key = Object.keys(fieldIdMap).find(k => fieldIdMap[k] === id);
            if (key) { validateField(key); return; }

            const secItem = secFields.find(s => s.id === id);
            if (secItem) validateSecField(secItem);
        });

        // Re-validate password when role changes (affects min length rule)
        const roleInput = document.getElementById('staffSelectedRole');
        if (roleInput) {
            new MutationObserver(() => {
                const passEl = formFields.pass;
                if (passEl && passEl.value) validateField('pass');
            }).observe(roleInput, { attributes: true, attributeFilter: ['value'] });
        }
    }

       // ─────────────────────────────────────────────────────────
    // 8. Submit handler (AJAX version with loading state)
    // ─────────────────────────────────────────────────────────

    const submitButton = document.getElementById("submitButton");
    const form         = document.getElementById("registrationForm");

    if (submitButton && form) {
        submitButton.addEventListener("click", async function (e) {
            e.preventDefault();

            let allValid = true;

            // Validate all core fields (original behaviour: stop on first error)
            for (const field in formFields) {
                if (!validateField(field)) {
                    allValid = false;
                    break;
                }
            }

            if (allValid) {
                const currentRole = document.getElementById('staffSelectedRole')?.value || 'user';
                const requireSecurity = currentRole === 'user';
                
                // FIXED: Only validate security questions if they exist in DOM
                if (requireSecurity) {
                    // Check if security question elements actually exist
                    const secQuestion1 = document.getElementById('staffSecQuestion1');
                    if (secQuestion1) {
                        for (const item of secFields) {
                            if (!validateSecField(item)) {
                                allValid = false;
                                break;
                            }
                        }
                    }
                    // If security questions don't exist, skip validation
                }
            }

            if (!allValid) {
                const firstErr = form.querySelector('.input-error');
                if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            // ── POST to PHP using AJAX with loading state ──
            
            // Save original button text
            const originalText = submitButton.innerHTML;
            
            // Show loading state
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitButton.disabled = true;
            
            // Clear any existing alerts
            const alertContainer = document.getElementById('alertContainer');
            if (alertContainer) {
                alertContainer.innerHTML = '';
            }
            
            try {
                const formData = new FormData(form);
                const endpoint = form.action || '../php/admin_create_account.php';
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    // Show success toast
                    if (typeof showToast === 'function') {
                        showToast(data.message || `Account created successfully!`, 'success');
                    } else {
                        alert("Registration successful!");
                    }
                    
                    // Reset the form
                    if (typeof resetStaffForm === 'function') {
                        resetStaffForm(form);
                    } else {
                        form.reset();
                    }
                    
                    // Clear password strength display
                    const bar = document.getElementById('passwordStrengthBar');
                    const label = document.getElementById('passwordStrengthLabel');
                    if (bar) { 
                        bar.className = 'password-strength-bar'; 
                        bar.style.width = '0%'; 
                    }
                    if (label) { 
                        label.textContent = ''; 
                        label.className = 'strength-label'; 
                    }
                    
                    // Clear age display
                    const ageDisplay = document.getElementById('ageDisplay');
                    if (ageDisplay) ageDisplay.textContent = '';
                    
                    // Refresh tables if visible (for super admin dashboard)
                    if (typeof loadAllUsers === 'function') {
                        const usersSection = document.getElementById('usersSection');
                        if (usersSection && usersSection.style.display !== 'none') {
                            loadAllUsers();
                        }
                    }
                    
                    if (typeof loadAdmins === 'function') {
                        const adminsSection = document.getElementById('manageAdminsSection');
                        if (adminsSection && adminsSection.style.display !== 'none') {
                            loadAdmins();
                        }
                    }
                    
                    // If super admin account was created, show info message
                    const selectedRole = document.querySelector('input[name="account_status_radio"]:checked');
                    if (selectedRole && selectedRole.value === 'super admin' && typeof showToast === 'function') {
                        showToast('Note: Only one super admin can be active at a time. Previous super admin has been blocked.', 'info');
                    }
                    
                } else {
                    // Show error in alert container
                    if (alertContainer) {
                        alertContainer.innerHTML = `
                            <div style="display:flex;align-items:center;gap:8px;
                                 background:#fee2e2;border:1px solid #fca5a5;color:#dc2626;
                                 padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>${data.message || 'An error occurred while creating the account.'}</span>
                            </div>`;
                        alertContainer.scrollIntoView({ behavior: 'smooth' });
                    } else if (typeof showToast === 'function') {
                        showToast(data.message || 'An error occurred while creating the account.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div style="display:flex;align-items:center;gap:8px;
                             background:#fee2e2;border:1px solid #fca5a5;color:#dc2626;
                             padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>Network error. Please try again.</span>
                        </div>`;
                } else if (typeof showToast === 'function') {
                    showToast('Network error. Please try again.', 'error');
                } else {
                    alert("Network error. Please try again.");
                }
            } finally {
                // Restore button state
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }

    
    // ─────────────────────────────────────────────────────────
    // 9. Public helpers exposed to admin_dashboard.js
    // ─────────────────────────────────────────────────────────

    // displayAge — called by initStaffManagement in admin_dashboard.js
    window.displayAge = function (inputId, displayId) {
        const input   = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        if (!input || !display) return;
        input.addEventListener('change', () => {
            if (!input.value) { display.textContent = ''; return; }
            const birth = new Date(input.value);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            if (today.getMonth() < birth.getMonth() ||
               (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
            display.textContent = `Your age is: ${age}`;
        });
    };

    // validateRegistrationForm — called by initStaffManagement submit handler
    window.validateRegistrationForm = function (data, requireSecurityQuestions) {
        const errors = [];

        for (const field in formFields) {
            if (!validateField(field)) {
                const el     = formFields[field];
                const anchor = el && (el.closest('.password-container') || el);
                const errEl  = anchor && anchor.nextElementSibling;
                if (errEl && errEl.classList.contains('field-error')) {
                    errors.push(errEl.querySelector('span')?.textContent || '');
                }
                break; // original stops on first error
            }
        }

        if (errors.length === 0 && requireSecurityQuestions) {
            // Check if security question elements exist before validating
            const secQuestion1 = document.getElementById('staffSecQuestion1');
            if (secQuestion1) {
                for (const item of secFields) {
                    if (!validateSecField(item)) {
                        const el     = document.getElementById(item.id);
                        const anchor = el && (el.closest('.password-container') || el);
                        const errEl  = anchor && anchor.nextElementSibling;
                        if (errEl && errEl.classList.contains('field-error')) {
                            errors.push(errEl.querySelector('span')?.textContent || '');
                        }
                        break;
                    }
                }
            }
        }

        return errors; // empty array = all valid
    };

    // ═════════════════════════════════════════════════════════
    // 10. MULTI-STEP FORM NAVIGATION
    // ═════════════════════════════════════════════════════════

    window.goToStep = function(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(function(el) {
            el.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.getElementById('step' + step);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // Update step indicator
        updateStepIndicator(step);
        
        // Scroll to top of form
        const container = document.querySelector('.container');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
    function updateStepIndicator(currentStep) {
        const dot1 = document.getElementById('dot1');
        const dot2 = document.getElementById('dot2');
        const line1 = document.getElementById('line1');
        const label1 = document.getElementById('label1');
        const label2 = document.getElementById('label2');
        
        if (!dot1 || !dot2) return; // Not a multi-step form
        
        if (currentStep === 1) {
            dot1.className = 'step-dot active';
            dot2.className = 'step-dot';
            if (line1) line1.className = 'step-line';
            if (label1) label1.className = 'active';
            if (label2) label2.className = '';
        } else {
            dot1.className = 'step-dot completed';
            dot2.className = 'step-dot active';
            if (line1) line1.className = 'step-line active';
            if (label1) label1.className = '';
            if (label2) label2.className = 'active';
        }
    }

    // ── Validate Step 1 before allowing to proceed ──────────
    window.validateStep1 = function() {
        let allValid = true;
        
        // Validate all core personal info fields
        for (const field in formFields) {
            if (!validateField(field)) {
                allValid = false;
                break;
            }
        }
        
        if (!allValid) {
            const firstErr = document.querySelector('.input-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        
        // All valid — proceed to step 2
        goToStep(2);
        return true;
    };

    // Initialize step indicator on load
    updateStepIndicator(1);

}); // ← THIS IS THE ONLY CLOSING }); — it ends DOMContentLoaded

