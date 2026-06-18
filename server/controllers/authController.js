import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'Email or username already in use' });
    }
    const user = new User({ username, email });
    await user.setPassword(password);
    await user.save();
    const token = generateToken(user);
    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned. Contact support.' });
    }
    if (user.status === 'deleted') {
      return res.status(403).json({ error: 'This account no longer exists.' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// POST /api/auth/admin-login
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'This account does not have admin privileges' });
    }
    if (user.status === 'banned' || user.status === 'deleted') {
      return res.status(403).json({ error: 'This account is not active' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.json({ message: 'Admin login successful', token, user });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during admin login' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/coins
export const updateCoins = async (req, res) => {
  try {
    const { delta } = req.body;
    if (typeof delta !== 'number') {
      return res.status(400).json({ error: 'delta must be a number' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { coins: delta } },
      { new: true }
    );
    res.json({ coins: user.coins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};