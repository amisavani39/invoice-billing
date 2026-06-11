const express = require('express');
const router = express.Router();
const {
  exportInvoicesToExcel,
  getAllInvoices,
  getInvoices,
  getInvoiceStats,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');

// @route    GET api/invoices/export
// @desc     Export all invoices to Excel
// @access   Private
router.get('/export', exportInvoicesToExcel);

// @route    GET api/invoices/all
router.get('/all', getAllInvoices);

// @route    GET api/invoices/stats
router.get('/stats', getInvoiceStats);

// @route    GET api/invoices
router.get('/', getInvoices);

// @route    GET api/invoices/:id
router.get('/:id', getInvoiceById);

// @route    POST api/invoices
router.post('/', createInvoice);

// @route    PUT api/invoices/:id
router.put('/:id', updateInvoice);

// @route    DELETE api/invoices/:id
router.delete('/:id', deleteInvoice);

module.exports = router;