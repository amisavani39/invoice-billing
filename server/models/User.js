const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: {
    type: String, // Clerk User ID (user_...)
    required: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  companyDetails: {
    name: { type: String, default: 'SHREE SHYAM FAB' },
    address: { type: String, default: 'ROAD - 3, PLOt NO - 2048 2TH FLOOR DIAMOND INDUSTRIAL PARK, SACHIN GIDC, SURAT, GUJARAT, INDIA - 394230' },
    gstNumber: { type: String },
    phone: { type: String },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { _id: false });

module.exports = mongoose.model('user', UserSchema);
