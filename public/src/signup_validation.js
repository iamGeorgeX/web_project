document.addEventListener('DOMContentLoaded', function () {

  // Helper: Remove previous error notifications within a form.
  function clearErrors(form) {
    form.querySelectorAll('.error-notification').forEach(el => el.remove());
  }

  // Helper: Display an error message under the input field.
  function displayError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    // Find the closest container (assumed to have class "form-group")
    const container = input.closest('.form-group') || input.parentNode;
    // Remove any existing error message for this container.
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

  // Validation for Organiser Signup Form
  const organiserForm = document.querySelector('form[action="/organiser-signup"]');
  if (organiserForm) {
    organiserForm.addEventListener('submit', function (e) {
      clearErrors(organiserForm);

      let hasError = false;

      const organizationName = document.getElementById('org-name').value.trim();
      const organizationAddress = document.getElementById('org-address').value.trim();
      const organizationPhone = document.getElementById('org-phone').value.trim();
      const afm = document.getElementById('afm').value.trim();
      const paymentDetails = document.getElementById('payment-details').value.trim();
      const password = document.getElementById('password').value.trim();
      const email = document.getElementById('email').value.trim();

      // Organization Name: allow letters (Latin/Greek) and spaces.
      const nameRegex = /^[A-Za-zΑ-Ωα-ωΆΈΉΊΌΎΏάέήίόύώ\s]+$/;
      if (!nameRegex.test(organizationName)) {
        displayError('org-name', "Παρακαλώ εισάγετε έγκυρο ονοματεπώνυμο ή εταιρική επωνυμία (μόνο γράμματα).");
        hasError = true;
      }
      
      // Address must not be empty.
      if (!organizationAddress) {
        displayError('org-address', "Παρακαλώ εισάγετε μια έγκυρη διεύθυνση/έδρα.");
        hasError = true;
      }
      
      // Organization Phone: Must be exactly 10 digits.
      if (!/^\d{10}$/.test(organizationPhone)) {
        displayError('org-phone', "Παρακαλώ εισάγετε έγκυρο τηλέφωνο (ακριβώς 10 αριθμοί).");
        hasError = true;
      }
      
      // ΑΦΜ: Must be exactly 9 digits.
      if (!/^\d{9}$/.test(afm)) {
        displayError('afm', "Παρακαλώ εισάγετε έγκυρο ΑΦΜ (ακριβώς 9 αριθμοί).");
        hasError = true;
      }
      
      // Payment Details: Must start with 2 letters followed by 32 digits (total 34 characters).
      if (!/^[A-Za-z]{2}\d{32}$/.test(paymentDetails)) {
        displayError('payment-details', "Παρακαλώ εισάγετε έγκυρα στοιχεία λογαριασμού πληρωμών (34 χαρακτήρες: 2 γράμματα και 32 αριθμοί).");
        hasError = true;
      }
      
      // Password: Must be strong (min 8 characters, at least one lowercase, one uppercase, one digit, one special character).
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
        displayError('password', "Παρακαλώ εισάγετε έναν ισχυρό κωδικό. Τουλάχιστον 8 χαρακτήρες, ένα κεφαλαίο, ένα πεζό, έναν αριθμό και έναν ειδικό χαρακτήρα.");
        hasError = true;
      }
      
      // Email: Must have only letters before and after the '@', with a basic TLD.
      const emailRegex = /^[A-Za-z]+@[A-Za-z]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        displayError('email', "Παρακαλώ εισάγετε έγκυρη διεύθυνση email.");
        hasError = true;
      }
      
      if (hasError) {
        e.preventDefault();
      }
    });
  }

  // Validation for User Signup Form
  const userForm = document.querySelector('form[action="/signup"]');
  if (userForm) {
    userForm.addEventListener('submit', function (e) {
      clearErrors(userForm);

      let hasError = false;

      const firstName = document.getElementById('first-name').value.trim();
      const lastName = document.getElementById('last-name').value.trim();
      // Assuming email and password fields exist for user signup.
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password') ? document.getElementById('password').value.trim() : '';

      // First Name: allow only letters (Latin/Greek) and spaces.
      const nameRegex = /^[A-Za-zΑ-Ωα-ωΆΈΉΊΌΎΏάέήίόύώ\s]+$/;
      if (!nameRegex.test(firstName)) {
        displayError('first-name', "Παρακαλώ εισάγετε έγκυρο Όνομα (μόνο γράμματα).");
        hasError = true;
      }
      // Last Name: allow only letters.
      if (!nameRegex.test(lastName)) {
        displayError('last-name', "Παρακαλώ εισάγετε έγκυρο Επώνυμο (μόνο γράμματα).");
        hasError = true;
      }
      
      // Email: validate with the same rule as for organiser signup.
      const emailRegex = /^[A-Za-z]+@[A-Za-z]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        displayError('email', "Παρακαλώ εισάγετε έγκυρη διεύθυνση email .");
        hasError = true;
      }
      
      // Password, if present, must be strong.
      if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
        displayError('password', "Παρακαλώ εισάγετε έναν ισχυρό κωδικό πρόσβασης. Τουλάχιστον 8 χαρακτήρες, ένα κεφαλαίο, ένα πεζό, έναν αριθμό και έναν ειδικό χαρακτήρα.");
        hasError = true;
      }
      
      if (hasError) {
        e.preventDefault();
      }
    });
  }
  // Add Change Password Validation

});