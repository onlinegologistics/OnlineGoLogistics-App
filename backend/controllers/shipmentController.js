const mongoose = require('mongoose');
const ParcelRequest = require('../models/ParcelRequest');
const MobileUser = require('../models/MobileUser');
const User = require('../models/User');

// @desc    Track shipment by tracking ID
// @route   GET /api/shipments/track/:trackingId
// @access  Public
const trackShipment = async (req, res) => {
    try {
        const { trackingId } = req.params;
        console.log("Requested trackingId:", trackingId);

        const trimmedId = String(trackingId || '').trim();
        if (!trimmedId) {
            return res.status(400).json({ success: false, message: 'Tracking ID is required' });
        }

        const { ObjectId } = require('mongodb');

        // ----------------------------------------------------
        // 1. Search in ParcelRequest collection first
        // ----------------------------------------------------
        let prQuery = {
            $or: [
                { trackingId: { $regex: new RegExp(`^${trimmedId}$`, 'i') } }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(trimmedId)) {
            prQuery.$or.push({ _id: new ObjectId(trimmedId) });
        }

        if (/^ONL-[0-9A-Fa-f]{6}$/i.test(trimmedId)) {
            const suffix = trimmedId.substring(4).toLowerCase();
            prQuery.$or.push({
                $expr: {
                    $eq: [
                        { $substr: [{ $toLower: { $toString: '$_id' } }, 18, 6] },
                        suffix
                    ]
                }
            });
        }

        let parcel = await ParcelRequest.findOne(prQuery)
            .populate('customer', 'name username email mobile company');

        // Additional suffix check if not matched
        if (!parcel && /^ONL-[0-9A-Fa-f]{6}$/i.test(trimmedId)) {
            const suffix = trimmedId.substring(4).toLowerCase();
            parcel = await ParcelRequest.findOne({
                $expr: {
                    $eq: [
                        { $substr: [{ $toLower: { $toString: '$_id' } }, 18, 6] },
                        suffix
                    ]
                }
            }).populate('customer', 'name username email mobile company');
        }

        if (parcel) {
            const prObj = parcel.toObject();
            let custName = prObj.customerName;
            let custMobile = prObj.mobileNumber;

            // Resolve customer details if missing
            const rawCustId = prObj.customer ? (prObj.customer._id || prObj.customer) : null;
            if (!prObj.customer && rawCustId) {
                let foundCust = await MobileUser.findById(rawCustId).select('name username email mobile company');
                if (!foundCust) {
                    foundCust = await User.findById(rawCustId).select('name username email mobile company');
                }
                if (foundCust) {
                    prObj.customer = foundCust;
                    custName = custName || foundCust.name;
                    custMobile = custMobile || foundCust.mobile || foundCust.username;
                }
            } else if (prObj.customer) {
                custName = custName || prObj.customer.name;
                custMobile = custMobile || prObj.customer.mobile || prObj.customer.username;
            }

            // Cross-check if MobileUser document has richer trackingHistory or newer status
            const muQuery = rawCustId 
                ? { _id: rawCustId } 
                : { 'shipments.parcelRequestId': prObj._id };
            const muDoc = await MobileUser.findOne(muQuery);
            if (muDoc && Array.isArray(muDoc.shipments)) {
                const muMatch = muDoc.shipments.find(s => 
                    (s.parcelRequestId && String(s.parcelRequestId) === String(prObj._id)) ||
                    (s.trackingId && prObj.trackingId && s.trackingId.toLowerCase() === prObj.trackingId.toLowerCase())
                );
                if (muMatch) {
                    const muHistLen = Array.isArray(muMatch.trackingHistory) ? muMatch.trackingHistory.length : 0;
                    const prHistLen = Array.isArray(prObj.trackingHistory) ? prObj.trackingHistory.length : 0;
                    if (muHistLen > prHistLen || (muMatch.currentStatus && muMatch.currentStatus !== prObj.currentStatus && muMatch.currentStatus !== 'Pending')) {
                        prObj.currentStatus = muMatch.currentStatus || muMatch.status || prObj.currentStatus;
                        prObj.status = prObj.currentStatus;
                        prObj.trackingHistory = muMatch.trackingHistory || prObj.trackingHistory;
                        prObj.currentBranch = muMatch.currentBranch || prObj.currentBranch;
                        prObj.currentLocation = muMatch.currentLocation || prObj.currentLocation;
                    }
                }
            }

            const formattedShipment = {
                _id: prObj._id,
                parcelRequestId: prObj._id,
                trackingId: prObj.trackingId || `ONL-${String(prObj._id).slice(-6).toUpperCase()}`,
                currentStatus: prObj.currentStatus || prObj.status || 'Pending',
                status: prObj.status || 'Pending',
                currentBranch: prObj.currentBranch || 'Central Hub',
                currentLocation: prObj.currentLocation || prObj.pickupAddress || '',
                pickupCity: prObj.pickupCity || '',
                deliveryCity: prObj.deliveryCity || '',
                pickupAddress: prObj.pickupAddress || '',
                deliveryAddress: prObj.deliveryAddress || '',
                parcelType: prObj.parcelType || prObj.packageDescription || 'Parcel',
                packageDescription: prObj.packageDescription || prObj.parcelType || '',
                weight: prObj.weight || 0,
                quantity: prObj.quantity || 1,
                remarks: prObj.remarks || '',
                customerName: custName || '',
                mobileNumber: custMobile || '',
                transportType: prObj.transportType || '',
                expectedDeliveryDate: prObj.expectedDeliveryDate || null,
                assignedStaff: prObj.assignedStaff || '',
                trackingHistory: Array.isArray(prObj.trackingHistory) && prObj.trackingHistory.length > 0 
                    ? prObj.trackingHistory 
                    : [{
                        status: prObj.currentStatus || prObj.status || 'Pending',
                        location: prObj.currentLocation || prObj.pickupAddress || '',
                        branchName: prObj.currentBranch || 'Central Hub',
                        remark: 'Shipment registered',
                        updatedBy: 'System',
                        dateTime: prObj.createdAt || new Date(),
                    }],
                createdAt: prObj.createdAt,
                updatedAt: prObj.updatedAt,
            };

            console.log("Found shipment in ParcelRequest:", formattedShipment.trackingId, "Status:", formattedShipment.currentStatus);
            return res.json({ success: true, data: formattedShipment });
        }

        // ----------------------------------------------------
        // 2. Fallback: Search in MobileUser collection
        // ----------------------------------------------------
        let muQuery = {
            $or: [
                { trackingId: { $regex: new RegExp(`^${trimmedId}$`, 'i') } },
                { 'shipments.trackingId': { $regex: new RegExp(`^${trimmedId}$`, 'i') } }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(trimmedId)) {
            muQuery.$or.push(
                { _id: new ObjectId(trimmedId) },
                { parcelRequestId: new ObjectId(trimmedId) },
                { 'shipments.parcelRequestId': new ObjectId(trimmedId) }
            );
        }

        let mobileUser = await MobileUser.findOne(muQuery);

        if (!mobileUser && /^ONL-[0-9A-Fa-f]{6}$/i.test(trimmedId)) {
            const suffix = trimmedId.substring(4).toLowerCase();
            mobileUser = await MobileUser.findOne({
                $expr: {
                    $or: [
                        { $eq: [{ $substr: [{ $toLower: { $toString: "$_id" } }, 18, 6] }, suffix] },
                        { $eq: [{ $substr: [{ $toLower: { $toString: "$parcelRequestId" } }, 18, 6] }, suffix] }
                    ]
                }
            });
        }

        if (mobileUser) {
            // Check if matched one in shipments array
            let matchedItem = null;
            if (Array.isArray(mobileUser.shipments)) {
                matchedItem = mobileUser.shipments.find(s => {
                    if (s.trackingId && s.trackingId.toLowerCase() === trimmedId.toLowerCase()) return true;
                    if (s.parcelRequestId && s.parcelRequestId.toString() === trimmedId) return true;
                    if (/^ONL-[0-9A-Fa-f]{6}$/i.test(trimmedId)) {
                        const suffix = trimmedId.substring(4).toLowerCase();
                        if (s.parcelRequestId && String(s.parcelRequestId).toLowerCase().endsWith(suffix)) return true;
                    }
                    return false;
                });
            }

            const source = matchedItem || mobileUser;

            const formattedShipment = {
                _id: source.parcelRequestId || mobileUser._id,
                parcelRequestId: source.parcelRequestId || mobileUser.parcelRequestId,
                trackingId: source.trackingId || mobileUser.trackingId || `ONL-${String(mobileUser._id).slice(-6).toUpperCase()}`,
                currentStatus: source.currentStatus || mobileUser.currentStatus || 'Pending',
                status: source.currentStatus || mobileUser.currentStatus || 'Pending',
                currentBranch: source.currentBranch || mobileUser.currentBranch || 'Central Hub',
                currentLocation: source.currentLocation || mobileUser.currentLocation || source.pickupAddress || '',
                pickupCity: source.pickupCity || mobileUser.pickupCity || '',
                deliveryCity: source.deliveryCity || mobileUser.deliveryCity || '',
                pickupAddress: source.pickupAddress || mobileUser.pickupAddress || '',
                deliveryAddress: source.deliveryAddress || mobileUser.deliveryAddress || '',
                parcelType: source.parcelType || mobileUser.parcelType || 'Parcel',
                packageDescription: source.packageDescription || mobileUser.packageDescription || '',
                weight: source.weight !== undefined ? source.weight : mobileUser.weight,
                quantity: source.quantity !== undefined ? source.quantity : mobileUser.quantity,
                remarks: source.remarks || mobileUser.remarks || '',
                customerName: source.customerName || mobileUser.customerName || mobileUser.name || '',
                mobileNumber: source.mobileNumber || mobileUser.mobileNumber || mobileUser.mobile || '',
                transportType: source.transportType || mobileUser.transportType || '',
                expectedDeliveryDate: source.expectedDeliveryDate || mobileUser.expectedDeliveryDate || null,
                assignedStaff: source.assignedStaff || mobileUser.assignedStaff || '',
                trackingHistory: Array.isArray(source.trackingHistory) && source.trackingHistory.length > 0
                    ? source.trackingHistory
                    : (Array.isArray(mobileUser.trackingHistory) && mobileUser.trackingHistory.length > 0 
                        ? mobileUser.trackingHistory 
                        : [{
                            status: source.currentStatus || 'Pending',
                            location: source.pickupAddress || '',
                            branchName: source.currentBranch || 'Central Hub',
                            remark: 'Shipment registered',
                            updatedBy: 'System',
                            dateTime: source.createdAt || new Date(),
                        }]),
                createdAt: source.createdAt || mobileUser.createdAt,
                updatedAt: source.updatedAt || mobileUser.updatedAt,
            };

            console.log("Found shipment in MobileUser:", formattedShipment.trackingId);
            return res.json({ success: true, data: formattedShipment });
        }

        console.log("Shipment not found for trackingId:", trackingId);
        return res.status(404).json({ success: false, message: 'Shipment not found' });
    } catch (error) {
        console.error("Error in trackShipment:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { trackShipment };
