const mongoose = require('mongoose');

const ChallanSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  poNo: {
    type: String,
  },
  challanNo: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  fromDetails: {
    name: { type: String },
    address: { type: String },
  },
  toDetails: {
    clientName: { type: String, required: true },
    gstin: { type: String },
  },
  items: [
    {
      particulars: { type: String, required: true },
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },
      per: { type: String },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('challan', ChallanSchema);
