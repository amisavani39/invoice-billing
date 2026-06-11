const ExcelJS = require('exceljs');
const Invoice = require('../models/Invoice');

/**
 * @desc    Get all invoices for export (unpaginated)
 */
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user?.id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(invoices || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get paginated invoices with search
 */
const getInvoices = async (req, res) => {
  try {
    const { search, date, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);
    
    let query = {};
    if (req.user?.id) query.user = req.user.id;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ invoiceNumber: searchRegex }, { 'customerDetails.name': searchRegex }];
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * @desc    Get dashboard stats
 */
const getInvoiceStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const statsResult = await Invoice.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' }
        }
      }
    ]);

    const stats = statsResult[0] || { totalInvoices: 0, totalRevenue: 0 };
    const recentInvoices = await Invoice.find({ user: userId })
      .select('invoiceNumber customerDetails.name date grandTotal')
      .sort({ date: -1 })
      .limit(5);

    res.json({ ...stats, recentInvoices });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

/**
 * @desc    Get invoice by ID
 */
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user?.id });
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * @desc    Create invoice
 */
const createInvoice = async (req, res) => {
  try {
    console.log('[CREATE INVOICE] Starting...', { 
        invoiceNumber: req.body.invoiceNumber, 
        userId: req.user?.id 
    });

    // 1. Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        console.error('[CREATE INVOICE] Database connection not ready');
        return res.status(503).json({ 
            success: false, 
            msg: "Database connection not ready. Please wait a few seconds and try again." 
        });
    }

    // 2. Create the model instance
    const newInvoice = new Invoice({ 
        ...req.body, 
        user: req.user?.id || req.body.user // Priority to authenticated user ID
    });
    
    // 3. Explicitly validate before saving
    const validationError = newInvoice.validateSync();
    if (validationError) {
        console.warn('[CREATE INVOICE] Validation failed:', validationError.message);
        const messages = Object.values(validationError.errors).map(val => val.message);
        return res.status(400).json({ 
            success: false, 
            msg: "Validation failed: " + messages.join(', ') 
        });
    }

    // 4. Save to database
    const invoice = await newInvoice.save();
    console.log('[CREATE INVOICE] Success:', invoice._id);
    
    res.status(201).json({ 
        success: true, 
        invoice 
    });

  } catch (err) {
    console.error('[CREATE INVOICE ERROR] Full details:', {
        message: err.message,
        code: err.code,
        name: err.name
    });
    
    // Handle Duplicate Key Error (Code 11000)
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        msg: `Invoice number "${req.body.invoiceNumber}" already exists for this user.` 
      });
    }

    // Handle Cast Errors (e.g. invalid ID or number format)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            msg: `Invalid data format for field: ${err.path}`
        });
    }

    // Fallback for any other errors
    res.status(500).json({ 
        success: false,
        msg: 'Internal Server Error: ' + (err.message || 'Unknown error'),
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Update invoice
 */
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user?.id },
      { $set: req.body },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * @desc    Delete invoice
 */
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user?.id });
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });
    res.json({ msg: 'Invoice removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * @desc    Export all invoices to Excel (Robust Binary Version)
 * @route   GET /api/invoices/export
 * @access  Private
 */
const exportInvoicesToExcel = async (req, res) => {
  try {
    console.log(`[EXPORT] User ${req.user?.id} requested invoice export`);
    const invoices = await Invoice.find({ user: req.user?.id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ success: false, message: "No invoices found in database" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    worksheet.columns = [
      { header: "Invoice No", key: "invoiceNo", width: 20 },
      { header: "Customer Name", key: "customerName", width: 30 },
      { header: "GST Number", key: "gstNumber", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Sub Total", key: "subTotal", width: 15 },
      { header: "CGST", key: "cgst", width: 12 },
      { header: "SGST", key: "sgst", width: 12 },
      { header: "IGST", key: "igst", width: 12 },
      { header: "Grand Total", key: "grandTotal", width: 20 },
      { header: "Status", key: "status", width: 15 }
    ];

    invoices.forEach(inv => {
      worksheet.addRow({
        invoiceNo: inv.invoiceNumber || "",
        customerName: inv.customerDetails?.name || "",
        gstNumber: inv.customerDetails?.gstNumber || "",
        date: inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : "",
        subTotal: inv.subTotal || 0,
        cgst: inv.cgst || 0,
        sgst: inv.sgst || 0,
        igst: inv.igst || 0,
        grandTotal: inv.grandTotal || 0,
        status: inv.status || "PENDING"
      });
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    });

    // 5. Generate Buffer (Real .xlsx binary)
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`[EXPORT] Success: Generated ${buffer.byteLength} bytes for ${invoices.length} invoices`);

    // 6. Set Absolute Binary Headers
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=Invoices.xlsx',
      'Content-Length': buffer.byteLength,
      'Cache-Control': 'no-cache'
    });

    return res.status(200).send(buffer);

  } catch (error) {
    console.error("[EXPORT ERROR]:", error.message);
    res.status(500).json({ success: false, message: "Server failed to generate Excel file" });
  }
};

module.exports = {
  exportInvoicesToExcel,
  getAllInvoices,
  getInvoices,
  getInvoiceStats,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};