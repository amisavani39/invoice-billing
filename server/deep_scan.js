const mongoose = require('mongoose');
require('dotenv').config();

async function deepScan() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('\nDatabases on this cluster:');
        dbs.databases.forEach(db => console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`));

        const currentDb = mongoose.connection.db;
        console.log(`\nScanning Current DB: ${currentDb.databaseName}`);
        
        const collections = await currentDb.listCollections().toArray();
        for (const col of collections) {
            const count = await currentDb.collection(col.name).countDocuments();
            console.log(`- Collection: ${col.name} | Count: ${count}`);
            
            if (col.name === 'invoices') {
                const sample = await currentDb.collection(col.name).find().limit(50).toArray();
                console.log(`  Sample IDs in 'invoices':`, sample.map(s => s._id));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error during scan:', err);
        process.exit(1);
    }
}

deepScan();
