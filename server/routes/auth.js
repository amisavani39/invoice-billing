const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route    POST api/auth/register
// @desc     Register user
// @access   Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      companyDetails: {
        name: 'SHREE SHYAM FAB',
        address: 'ROAD - 3, PLOt NO - 2048 2TH FLOOR DIAMOND INDUSTRIAL PARK, SACHIN GIDC, SURAT, GUJARAT, INDIA - 394230',
        gstNumber: '',
        phone: '',
      }
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route    POST api/auth/login
// @desc     Authenticate user & get token
// @access   Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Wrong password"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "7d" }
    );

    // Success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server Error"
    });
  }
});

// @route    POST api/auth/forgot-password
// @desc     Simple direct password reset
// @access   Public
router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ msg: 'Please enter email and new password' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields if they exist
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ msg: 'Password reset successful! You can now log in.' });
  } catch (err) {
    console.error('Simple Reset Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
