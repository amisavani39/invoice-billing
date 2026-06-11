const mongoose = require('mongoose');
require('dotenv').config();

async function checkTestDb() {
    try {
        const testUri = process.env.MONGO_URI.replace('/billing?', '/test?');
        console.log('Connecting to:', testUri);
        await mongoose.connect(testUri);
        
        const currentDb = mongoose.connection.db;
        console.log(`\nScanning DB: ${currentDb.databaseName}`);
        
        const collections = await currentDb.listCollections().toArray();
        for (const col of collections) {
            const count = await currentDb.collection(col.name).countDocuments();
            console.log(`- Collection: ${col.name} | Count: ${count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTestDb();
