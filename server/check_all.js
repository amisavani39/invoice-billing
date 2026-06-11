const mongoose = require('mongoose');
require('dotenv').config();
const Invoice = require('./models/Invoice');

async function checkAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const all = await Invoice.find().lean();
        console.log('Total documents found by Invoice model:', all.length);
        console.log('User IDs in those documents:', [...new Set(all.map(a => a.user))]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkAll();
