const mongoose = require('mongoose');
require('dotenv').config();

async function globalScan() {
    try {
        const baseUri = process.env.MONGO_URI.split('?')[0].replace(/\/[^/]+$/, '');
        console.log('Connecting to cluster...');
        await mongoose.connect(process.env.MONGO_URI);
        
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        for (const dbInfo of dbs.databases) {
            console.log(`\n--- DATABASE: ${dbInfo.name} ---`);
            const db = mongoose.connection.client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  - ${col.name}: ${count}`);
                if (col.name.includes('invoice')) {
                    const sample = await db.collection(col.name).find().limit(1).toArray();
                    console.log(`    Sample:`, sample);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

globalScan();
