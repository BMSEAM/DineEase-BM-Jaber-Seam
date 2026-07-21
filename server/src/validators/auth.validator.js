// Request validation for authentication endpoints
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

module.exports = { validateEmail, validatePassword };
