const express = require('express');
const router = express.Router();
const Challan = require('../models/Challan');
const auth = require('../middleware/auth');

// @route    POST api/challans
// @desc     Create a delivery challan
// @access   Private
router.post('/', auth, async (req, res) => {
  const { chNo, fromDetails, toDetails, items } = req.body;

  // Basic validation
  if (!chNo) {
    return res.status(400).json({ msg: 'Challan Number (chNo) is required' });
  }
  if (!fromDetails || !fromDetails.companyName) {
    return res.status(400).json({ msg: 'From Company Name is required' });
  }
  if (!toDetails || !toDetails.companyName) {
    return res.status(400).json({ msg: 'To Company Name is required' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'At least one item is required' });
  }

  try {
    const newChallan = new Challan({
      ...req.body,
      user: req.user.id
    });

    const challan = await newChallan.save();
    res.status(201).json(challan);
  } catch (err) {
    console.error('Challan Save Error:', err);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }

    res.status(500).json({
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route    GET api/challans
// @desc     Get all challans for the user
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const challans = await Challan.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(challans);
  } catch (err) {
    console.error('Error fetching challans:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    GET api/challans/:id
// @desc     Get challan by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id);

    if (!challan) {
      return res.status(404).json({ msg: 'Challan not found' });
    }

    // Check user
    if (challan.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(challan);
  } catch (err) {
    console.error('Error fetching challan:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challan not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    DELETE api/challans/:id
// @desc     Delete a delivery challan
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id);

    if (!challan) {
      return res.status(404).json({ msg: 'Challan not found' });
    }

    // Check user ownership
    if (challan.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Challan.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Challan deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/challans/:id:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challan not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
