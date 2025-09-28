// backend/src/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup
exports.signup = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, role });
    await user.save();

    res.json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
};