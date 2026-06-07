const express = require('express');
const router = express.Router();
const Challan = require('../models/Challan');
const auth = require('../middleware/auth');

// @route    POST api/challan
// @desc     Create a delivery challan
// @access   Private
router.post('/', auth, async (req, res) => {
  const { challanNo, date, toDetails, items } = req.body;

  // Basic validation
  if (!challanNo) {
    return res.status(400).json({ msg: 'Challan Number is required' });
  }
  if (!toDetails || !toDetails.clientName) {
    return res.status(400).json({ msg: 'Client Name is required' });
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

// @route    GET api/challan/latest
// @desc     Get the latest delivery challan
// @access   Private
router.get('/latest', auth, async (req, res) => {
  try {
    const challan = await Challan.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });

    if (!challan) {
      return res.status(404).json({ msg: 'No Challan Data Found' });
    }

    res.json(challan);
  } catch (err) {
    console.error('Error fetching latest challan:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    GET api/challan
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

module.exports = router;
