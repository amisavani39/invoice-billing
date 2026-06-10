const mongoose = require('mongoose');

const ChallanSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  challanType: {
    type: String,
    enum: ['ORIGINAL', 'DUPLICATE', 'TRIPLICATE', 'OFFICE COPY'],
    default: 'ORIGINAL'
  },
  fromDetails: {
    companyName: { type: String, required: true },
    plotNo: { type: String },
    roadNo: { type: String },
    area: { type: String }, // Diamond Ind
    cityRegion: { type: String }, // Chachhi M
  },
  toDetails: {
    companyName: { type: String, required: true },
    locationBranch: { type: String },
    mobileNumber: { type: String },
  },
  poNo: {
    type: String,
  },
  chNo: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  gstin: {
    type: String,
  },
  items: [
    {
      particulars: { type: String, required: true },
      quantity: { type: Number, required: true },
      quantityUnit: { type: String, default: 'pcs' },
      rate: { type: Number },
      per: { type: String },
    },
  ],
  preparedBySignature: {
    type: String,
    default: ''
  },
  receivedBySignature: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for performance
ChallanSchema.index({ user: 1, createdAt: -1 });
ChallanSchema.index({ user: 1 });
ChallanSchema.index({ chNo: 1 });
ChallanSchema.index({ date: -1 });

module.exports = mongoose.model('Challan', ChallanSchema, 'challans');
