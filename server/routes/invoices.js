const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// @route    POST api/invoices
// @desc     Create an invoice
// @access   Private (Protected by auth middleware)
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized: User ID missing' });
    }

    const newInvoice = new Invoice({
      ...req.body,
      user: userId
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
  const userId = req.user?.id;
  const label = `[FETCH-INVOICES] ${userId}`;
  console.time(label);

  try {
    const { search, date, page = 1, limit = 10, diagnostics = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);
    
    let query = { user: userId };

    if (search && search.trim() !== '' && search !== 'undefined') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { 'customerDetails.name': searchRegex },
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
    const total = await Invoice.countDocuments(query);
    const pages = Math.ceil(total / pageSize);

    // Use standard find for maximum reliability and speed
    const invoices = await Invoice.find(query)
      .select('invoiceNumber customerDetails date grandTotal createdAt status')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    let diagData = null;
    if (diagnostics === 'true' || diagnostics === true) {
        const globalTotal = await Invoice.countDocuments({});
        diagData = {
            globalTotal,
            userTotal: total,
            orphanCount: globalTotal - (await Invoice.countDocuments({ user: { $exists: true, $ne: null } }))
        };
    }

    console.timeEnd(label);
    res.json({
      invoices: invoices || [],
      total,
      page: parseInt(page),
      pages,
      diagnostics: diagData
    });
  } catch (err) {
    console.timeEnd(label);
    console.error('Error fetching invoices:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
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
