const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route    GET api/user/profile
// @desc     Get current user's profile
// @access   Public
router.get('/profile', async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const label = `[PROFILE-FETCH] ${userId || 'unknown'}`;
  console.time(label);

  try {
    if (!userId) {
      console.timeEnd(label);
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Reuse user object from auth middleware if available
    if (req.fullUser) {
      console.timeEnd(label);
      return res.json(req.fullUser);
    }

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    console.timeEnd(label);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.timeEnd(label);
    console.error('[PROFILE ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    PUT api/user/profile
// @desc     Update user's profile
// @access   Public
router.post('/profile', async (req, res) => {
  const { name, companyDetails, userId: providedUserId } = req.body;
  const userId = providedUserId || (req.user ? req.user.id : null);

  // Build profile object
  const profileFields = {};
  if (name) profileFields.name = name;
  if (companyDetails) profileFields.companyDetails = companyDetails;

  try {
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne();
    }

    if (user) {
      // Update
      user = await User.findByIdAndUpdate(
        user._id,
        { $set: profileFields },
        { new: true }
      ).select('-password');

      return res.json(user);
    }

    res.status(404).json({ msg: 'User not found' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
