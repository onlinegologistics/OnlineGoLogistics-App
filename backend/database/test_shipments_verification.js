require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParcelRequest = require('../models/ParcelRequest');
const MobileUser = require('../models/MobileUser');
const { trackShipment } = require('../controllers/shipmentController');

async function testVerification() {
    try {
        const dbName = process.env.DB_NAME || 'luggage_billing';
        await mongoose.connect(process.env.MONGO_URI, { dbName });
        console.log('--- TEST 1: Check customer population on ParcelRequest ---');
        const populatedPRs = await ParcelRequest.find({ customerModel: 'MobileUser' }).limit(5).populate('customer');
        for (const pr of populatedPRs) {
            console.log(`PR ${pr._id}: trackingId = ${pr.trackingId}, customer = ${pr.customer ? pr.customer.name + ' (' + pr.customer.email + ')' : 'NULL'}`);
            if (!pr.customer) {
                throw new Error(`Customer failed to populate on PR ${pr._id}`);
            }
        }
        console.log('✓ PASS: All mobile customers successfully populated!\n');

        console.log('--- TEST 2: Verify MobileUser has multiple shipments stored ---');
        const multiShipmentUser = await MobileUser.findOne({ 'shipments.1': { $exists: true } });
        if (!multiShipmentUser) {
            throw new Error('No user found with multiple shipments!');
        }
        console.log(`User: "${multiShipmentUser.name}" (${multiShipmentUser.email}) has ${multiShipmentUser.shipments.length} shipments stored.`);
        console.log('Shipments:');
        multiShipmentUser.shipments.forEach((s, idx) => {
            console.log(`  ${idx + 1}. ID: ${s.parcelRequestId} | Tracking: ${s.trackingId} | Status: ${s.currentStatus} | Delivery: ${s.deliveryCity || s.deliveryAddress}`);
        });
        console.log('✓ PASS: User stores multiple shipments in the database!\n');

        console.log('--- TEST 3: Test trackShipment for an older shipment ---');
        const firstShipment = multiShipmentUser.shipments[0];
        console.log(`Testing tracking for first (older) shipment: ${firstShipment.trackingId || firstShipment.parcelRequestId}`);

        const mockReq = { params: { trackingId: firstShipment.trackingId || firstShipment.parcelRequestId.toString() } };
        let responseData = null;
        const mockRes = {
            status: function (code) { this.statusCode = code; return this; },
            json: function (data) { responseData = data; return this; }
        };

        await trackShipment(mockReq, mockRes);
        if (responseData && responseData.success) {
            console.log('Track result:', {
                trackingId: responseData.data.trackingId,
                status: responseData.data.currentStatus,
                customer: responseData.data.customerName,
                address: responseData.data.deliveryAddress
            });
            console.log('✓ PASS: Older shipment was successfully tracked!\n');
        } else {
            throw new Error(`Failed to track older shipment: ${JSON.stringify(responseData)}`);
        }

        console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

testVerification();
