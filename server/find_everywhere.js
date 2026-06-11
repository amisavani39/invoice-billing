const mongoose = require('mongoose');
require('dotenv').config();

async function findInvoicesEverywhere() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        let totalFound = 0;
        for (const dbInfo of dbs.databases) {
            const db = mongoose.connection.client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments({
                    $or: [
                        { invoiceNumber: { $exists: true } },
                        { invoiceNo: { $exists: true } }
                    ]
                });
                if (count > 0) {
                    console.log(`Found ${count} invoice-like docs in ${dbInfo.name}.${col.name}`);
                    totalFound += count;
                }
            }
        }
        console.log('\nGrand Total across Cluster:', totalFound);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findInvoicesEverywhere();
