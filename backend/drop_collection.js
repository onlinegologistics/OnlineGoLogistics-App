require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luggage_billing');
        console.log('Connected to DB');
        const db = mongoose.connection.db;
        try {
            await db.dropCollection('mobileusers_data');
            console.log('Dropped mobileusers_data');
        } catch (e) {
            console.log('Collection might not exist or drop failed: ', e.message);
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
run();
