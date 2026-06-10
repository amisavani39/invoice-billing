const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  user: {
    type: String,
    required: false,
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  orderNumber: { type: String },
  orderDate: { type: Date },
  parcelBag: { type: String },
  eWayBill: { type: String },
  transportName: { type: String },
  companyDetails: {
    name: { type: String },
    address: { type: String },
    gstNumber: { type: String },
    phone: { type: String },
  },
  customerDetails: {
    name: { type: String, required: true },
    billingAddress: { type: String, required: true },
    shippingAddress: { type: String },
    mobileNumber: { type: String },
    state: { type: String },
    stateCode: { type: String },
    gstNumber: { type: String },
  },
  products: [
    {
      srNo: { type: Number },
      description: { type: String, required: true },
      hsn: { type: String },
      gstPercent: { type: Number, required: true },
      quantity: { type: Number, required: true },
      uom: { type: String },
      rate: { type: Number, required: true },
      amount: { type: Number, required: true },
    },
  ],
  subTotal: { type: Number, required: true },
  pandFCharges: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  taxAmountInWords: { type: String },
  netAmountInWords: { type: String },
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },
  },
  terms: { type: [String] },
  status: {
    type: String,
    enum: ['PAID', 'PENDING', 'OVERDUE'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for performance
InvoiceSchema.index({ user: 1, createdAt: -1 });
InvoiceSchema.index({ user: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ 'customerDetails.name': 1 });
InvoiceSchema.index({ date: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema, 'invoices');
