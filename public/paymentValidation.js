document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const cardNumberInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('expiry');
  const cvvInput = document.getElementById('cvv');

  // Auto-insert slash in expiry date
  expiryInput.addEventListener('input', (e) => {
    let value = expiryInput.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    expiryInput.value = value;
  });

  form.addEventListener('submit', (e) => {
    let errorMessages = [];

    // Validate card number: 16 digits
    const cardNumber = cardNumberInput.value.trim();
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(cardNumber)) {
      errorMessages.push("Card Number must be 16 digits.");
    }

    // Validate expiry date: MM/YY format
    const expiry = expiryInput.value.trim();
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      errorMessages.push("Expiry date must be in MM/YY format.");
    } else {
      // Check if expiry is after today
      const [expMonth, expYear] = expiry.split('/').map(Number);
      const fullYear = 2000 + expYear;
      const expiryDate = new Date(fullYear, expMonth, 0, 23, 59, 59, 999);
      const now = new Date();
      if (expiryDate < now) {
        errorMessages.push("Card expiry date must be in the future.");
      }
    }

    // Validate CVV: 3 or 4 digits
    const cvv = cvvInput.value.trim();
    const cvvRegex = /^\d{3,4}$/;
    if (!cvvRegex.test(cvv)) {
      errorMessages.push("CVV must be 3 or 4 digits.");
    }

    // If there are errors, prevent submission and alert the user
    if (errorMessages.length > 0) {
      e.preventDefault();
      alert("Please correct the following errors:\n" + errorMessages.join("\n"));
    }
  });
});