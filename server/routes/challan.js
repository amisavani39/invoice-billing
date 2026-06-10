const express = require('express');
const router = express.Router();
const Challan = require('../models/Challan');
// Auth middleware is already applied in server.js, so we don't need it here.

// @route    POST api/challans
// @desc     Create a delivery challan
// @access   Private
router.post('/', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ msg: 'Unauthorized: User ID missing' });
  }

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
      user: userId
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

// @route    GET api/challans/stats
// @desc     Get challan statistics for the user
// @access   Private
router.get('/stats', async (req, res) => {
  try {
    const totalChallans = await Challan.countDocuments({ user: req.user.id });
    res.json({ totalChallans });
  } catch (err) {
    console.error('Error fetching challan stats:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    GET api/challans
// @desc     Get all challans for the user (with search and pagination)
// @access   Private
router.get('/', async (req, res) => {
  const userId = req.user?.id;
  const label = `[FETCH-CHALLANS] ${userId}`;
  console.time(label);

  try {
    const { search, date, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);
    
    let query = { user: userId };

    if (search && search.trim() !== '' && search !== 'undefined') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { chNo: searchRegex },
        { 'toDetails.companyName': searchRegex },
      ];
    }

    if (date && date.trim() !== '' && date !== 'undefined') {
      const startDate = new Date(date);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
    }

    // Calculate total documents for accurate pagination
    const total = await Challan.countDocuments(query);
    const pages = Math.ceil(total / pageSize);

    // Extremely simplified and robust fetch
    const challans = await Challan.find(query)
      .select('chNo toDetails date gstin items createdAt poNo fromDetails')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    console.timeEnd(label);
    
    res.json({
      challans: challans || [],
      total,
      page: parseInt(page),
      pages
    });
  } catch (err) {
    console.timeEnd(label);
    console.error('Error fetching challans:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route    GET api/challans/:id
// @desc     Get challan by ID
// @access   Private
router.get('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
