// Authentication controllers for registration, login, and logout
const { generateToken } = require('../utils/token');

const register = async (req, res) => {
  // Registration logic
  res.status(201).json({ message: 'Registration successful' });
};

const login = async (req, res) => {
  // Login logic
  const token = generateToken(req.user.id);
  res.json({ token, user: req.user });
};

const logout = async (req, res) => {
  // Logout logic
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, logout };
