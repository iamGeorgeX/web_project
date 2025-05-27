document.addEventListener('DOMContentLoaded', function () {

  // Helper: Remove previous error notifications within a form.
  function clearErrors(form) {
    form.querySelectorAll('.error-notification').forEach(el => el.remove());
  }

  // Helper: Display an error message under the input field.
  function displayError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const container = input.closest('.form-group') || input.parentNode;
    // Remove any existing error message for this input.
    const existingError = container.querySelector('.error-notification');
    if (existingError) {
      existingError.textContent = message;
    } else {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-notification';
      errorDiv.style.color = 'red';
      errorDiv.style.fontSize = '0.9em';
      errorDiv.textContent = message;
      container.appendChild(errorDiv);
    }
  }

  // Validation for Change Password Form
  const changePasswordForm = document.querySelector('form[action="/change-password"]');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', function (e) {
      clearErrors(changePasswordForm);

      let hasError = false;

      const oldPassword = document.getElementById('old_password').value.trim();
      const newPassword = document.getElementById('new_password').value.trim();
      const confirmPassword = document.getElementById('confirm_password').value.trim();

      // Validate old password is not empty.
      if (!oldPassword) {
        displayError('old_password', "Παρακαλώ εισάγετε το τρέχον password.");
        hasError = true;
      }
      // New Password: Must be strong.
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) {
        displayError('new_password', "Ο νέος κωδικός πρέπει να είναι ισχυρός (τουλάχιστον 8 χαρακτήρες, ένα πεζό, ένα κεφαλαίο, ένας αριθμός και ένας ειδικός χαρακτήρας).");
        hasError = true;
      }
      // Confirm Password: Must match new password.
      if (newPassword !== confirmPassword) {
        displayError('confirm_password', "Οι κωδικοί δεν ταιριάζουν.");
        hasError = true;
      }

      if (hasError) {
        e.preventDefault();
      }
    });
  }
});