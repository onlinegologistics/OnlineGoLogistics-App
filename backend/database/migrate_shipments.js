require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParcelRequest = require('../models/ParcelRequest');
const MobileUser = require('../models/MobileUser');
const User = require('../models/User');

const createTrackingId = () => `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;

async function migrate() {
    try {
        const dbName = process.env.DB_NAME || 'luggage_billing';
        console.log(`Connecting to database: ${dbName}...`);
        await mongoose.connect(process.env.MONGO_URI, { dbName });
        console.log('Connected to MongoDB successfully.');

        const db = mongoose.connection.db;

        // 1. Fetch all parcel requests
        const allParcels = await ParcelRequest.find({});
        console.log(`Found ${allParcels.length} parcel requests to process.`);

        let updatedParcelsCount = 0;

        for (const pr of allParcels) {
            let modified = false;

            // Determine customerModel
            const inMobile = await MobileUser.findById(pr.customer);
            if (inMobile) {
                if (pr.customerModel !== 'MobileUser') {
                    pr.customerModel = 'MobileUser';
                    modified = true;
                }
            } else {
                if (pr.customerModel !== 'User') {
                    pr.customerModel = 'User';
                    modified = true;
                }
            }

            // Ensure trackingId
            if (!pr.trackingId) {
                // If this is the latest shipment on MobileUser, reuse their trackingId
                if (inMobile && inMobile.parcelRequestId && inMobile.parcelRequestId.toString() === pr._id.toString() && inMobile.trackingId) {
                    pr.trackingId = inMobile.trackingId;
                } else {
                    pr.trackingId = createTrackingId();
                }
                modified = true;
            }

            // Ensure currentStatus
            if (!pr.currentStatus) {
                pr.currentStatus = pr.status || 'Pending';
                modified = true;
            }

            // Ensure currentBranch & currentLocation
            if (!pr.currentBranch) {
                pr.currentBranch = 'Central Hub';
                modified = true;
            }
            if (!pr.currentLocation) {
                pr.currentLocation = pr.pickupAddress || '';
                modified = true;
            }

            // Ensure trackingHistory
            if (!Array.isArray(pr.trackingHistory) || pr.trackingHistory.length === 0) {
                pr.trackingHistory = [{
                    status: pr.currentStatus || pr.status || 'Pending',
                    location: pr.pickupAddress || pr.pickupCity || 'Origin',
                    branchName: pr.currentBranch || 'Central Hub',
                    remark: 'Shipment registered',
                    updatedBy: 'System',
                    dateTime: pr.createdAt || new Date(),
                }];
                modified = true;
            }

            if (modified) {
                await pr.save();
                updatedParcelsCount++;
            }
        }
        console.log(`Updated ${updatedParcelsCount} parcel requests with tracking & customerModel.`);

        // 2. Sync all shipments into MobileUser.shipments
        const allMobileUsers = await MobileUser.find({});
        console.log(`Found ${allMobileUsers.length} mobile users to check for shipments.`);

        let syncedUsersCount = 0;

        for (const user of allMobileUsers) {
            // Find all parcel requests for this mobile user
            const userParcels = await ParcelRequest.find({ customer: user._id }).sort({ createdAt: 1 });

            if (userParcels.length > 0) {
                const shipmentsArray = userParcels.map((p) => ({
                    parcelRequestId: p._id,
                    trackingId: p.trackingId,
                    pickupAddress: p.pickupAddress,
                    deliveryAddress: p.deliveryAddress,
                    packageDescription: p.packageDescription || p.parcelType,
                    parcelType: p.parcelType || p.packageDescription,
                    weight: p.weight,
                    quantity: p.quantity,
                    remarks: p.remarks,
                    pickupCity: p.pickupCity,
                    deliveryCity: p.deliveryCity,
                    deliveryLocation: p.deliveryLocation,
                    transportType: p.transportType,
                    expectedDeliveryDate: p.expectedDeliveryDate,
                    customerName: p.customerName || user.name,
                    mobileNumber: p.mobileNumber || user.mobile,
                    currentBranch: p.currentBranch || 'Central Hub',
                    currentLocation: p.currentLocation || p.pickupAddress,
                    currentStatus: p.currentStatus || p.status || 'Pending',
                    assignedStaff: p.assignedStaff || '',
                    trackingHistory: p.trackingHistory || [],
                    createdAt: p.createdAt,
                }));

                const latestParcel = userParcels[userParcels.length - 1];

                user.shipments = shipmentsArray;
                // Sync top-level with latest parcel
                user.parcelRequestId = latestParcel._id;
                user.trackingId = latestParcel.trackingId;
                user.currentStatus = latestParcel.currentStatus;
                user.pickupAddress = latestParcel.pickupAddress;
                user.deliveryAddress = latestParcel.deliveryAddress;
                user.pickupCity = latestParcel.pickupCity;
                user.deliveryCity = latestParcel.deliveryCity;
                user.weight = latestParcel.weight;
                user.quantity = latestParcel.quantity;
                user.parcelType = latestParcel.parcelType;
                user.packageDescription = latestParcel.packageDescription;

                await user.save();
                syncedUsersCount++;
                console.log(`User "${user.name}" (${user.username}): Synced ${shipmentsArray.length} shipments.`);
            }
        }

        console.log(`Synced shipments for ${syncedUsersCount} mobile users.`);
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
