const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// @route    POST api/invoices
// @desc     Create an invoice
// @access   Private (Protected by auth middleware)
router.post('/', async (req, res) => {
  try {
    // req.user.id is set by the auth middleware
    const newInvoice = new Invoice({
      ...req.body,
      user: req.user.id
    });

    const invoice = await newInvoice.save();
    res.status(201).json({
      success: true,
      invoice,
    });
  } catch (err) {
    console.error('Invoice Save Error:', err);
    res.status(500).json({
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route    GET api/invoices
// @desc     Get all invoices for the authenticated user
// @access   Private
router.get('/', async (req, res) => {
  try {
    const { search, date, page = 1, limit = 10 } = req.query;
    
    // Filter by authenticated user's ID
    let query = { user: req.user.id };

    if (search && search !== 'undefined' && search !== '') {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (date && date !== 'undefined' && date !== '') {
      const startDate = new Date(date);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .select('invoiceNumber customerDetails.name customerDetails.mobileNumber customerDetails.gstNumber date grandTotal')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      invoices,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    console.error('Error fetching invoices:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    GET api/invoices/stats
// @desc     Get dashboard statistics for the authenticated user
// @access   Private
router.get('/stats', async (req, res) => {
  try {
    const statsResult = await Invoice.aggregate([
      {
        $match: { user: req.user.id } // Filter by user
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' }
        }
      }
    ]);

    const stats = statsResult[0] || { totalInvoices: 0, totalRevenue: 0 };

    const recentInvoices = await Invoice.find({ user: req.user.id })
      .select('invoiceNumber customerDetails.name date grandTotal')
      .sort({ date: -1 })
      .limit(5);

    return res.json({
      totalInvoices: stats.totalInvoices || 0,
      totalRevenue: stats.totalRevenue || 0,
      recentInvoices: recentInvoices || []
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    return res.status(500).json({ 
      success: false,
      msg: 'Server Error', 
      error: err.message,
      totalInvoices: 0,
      totalRevenue: 0,
      recentInvoices: []
    });
  }
});

// @route    GET api/invoices/:id
// @desc     Get invoice by ID
// @access   Private
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id // Ensure user owns the invoice
    });

    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    PUT api/invoices/:id
// @desc     Update an invoice
// @access   Private
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route    DELETE api/invoices/:id
// @desc     Delete an invoice
// @access   Private
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

    res.json({ msg: 'Invoice removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
