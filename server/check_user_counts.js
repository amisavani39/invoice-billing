const mongoose = require('mongoose');
require('dotenv').config();
const Invoice = require('./models/Invoice');

async function checkCounts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const counts = await Invoice.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        console.log('Counts per user:', counts);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCounts();
