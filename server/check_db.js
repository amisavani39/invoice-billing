const mongoose = require('mongoose');
require('dotenv').config();
const Invoice = require('./models/Invoice');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const invoiceCount = await Invoice.countDocuments();
        console.log('Total Invoices:', invoiceCount);
        
        const invoices = await Invoice.find();
        console.log('Invoices detail:');
        invoices.forEach(inv => console.log(`Invoice: ${inv.invoiceNumber}, GrandTotal: ${inv.grandTotal}, Type: ${typeof inv.grandTotal}, User: ${inv.user}`));
        
        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log('Total Users:', users.length);
        users.forEach(u => console.log(`User: ${u.name} (${u.email}) - ID: ${u._id}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
