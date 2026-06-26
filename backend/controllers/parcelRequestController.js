const ParcelRequest = require('../models/ParcelRequest');
const mongoose = require('mongoose');
const MobileUser = require('../models/MobileUser');

const createTrackingId = () => `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;

const findParcelRequestByTrackingId = async (trackingId) => {
    const normalized = String(trackingId || '').trim();
    if (!normalized) return null;

    if (mongoose.Types.ObjectId.isValid(normalized)) {
        return ParcelRequest.findById(normalized)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');
    }

    const suffix = normalized.replace(/^ONL-/i, '').toLowerCase();
    return ParcelRequest.findOne({
        $expr: {
            $eq: [
                { $substr: [{ $toLower: { $toString: '$_id' } }, 18, 6] },
                suffix,
            ],
        },
    })
        .populate('customer', 'name username email mobile company')
        .populate('updatedBy', 'name');
};

// @desc    Create new parcel request
// @route   POST /api/parcel-requests
// @access  Private (Customer)
const createParcelRequest = async (req, res) => {
    try {
        const parcelRequest = new ParcelRequest({
            ...req.body,
            customer: req.user._id,
        });

        const created = await parcelRequest.save();

        await MobileUser.findByIdAndUpdate(req.user._id, {
            $set: {
                pickupAddress: req.body.pickupAddress,
                deliveryAddress: req.body.deliveryAddress,
                packageDescription: req.body.packageDescription || req.body.parcelType,
                parcelType: req.body.parcelType || req.body.packageDescription,
                weight: req.body.weight,
                quantity: req.body.quantity,
                remarks: req.body.remarks,
                pickupCity: req.body.pickupCity,
                deliveryCity: req.body.deliveryCity,
                customerName: req.body.customerName || req.user.name,
                mobileNumber: req.body.mobileNumber || req.user.mobile,
                transportType: req.body.transportType || '',
                expectedDeliveryDate: req.body.expectedDeliveryDate || null,
                parcelRequestId: created._id,
                customer: req.user._id,
                currentBranch: req.body.currentBranch || 'Central Hub',
                currentLocation: req.body.pickupAddress,
                currentStatus: 'Pending',
                isActive: true,
                trackingId: createTrackingId(),
                assignedStaff: req.body.assignedStaff || '',
            }
        });

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all parcel requests
// @route   GET /api/parcel-requests
// @access  Private (Customer sees own, Admin/User sees all)
const getParcelRequests = async (req, res) => {
    try {
        let query = {};

        // Customers and mobile users only see their own requests
        if (req.user.role === 'customer' || req.user.role === 'mobile') {
            query.customer = req.user._id;
        }

        const parcelRequests = await ParcelRequest.find(query)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name')
            .sort({ createdAt: -1 });

        const enrichedRequests = await Promise.all(
            parcelRequests.map(async (pr) => {
                const prObj = pr.toObject();
                // Find MobileUser doc associated with this parcelRequestId
                const mobileUserDoc = await MobileUser.findOne({ parcelRequestId: pr._id });
                if (mobileUserDoc) {
                    prObj.currentStatus = mobileUserDoc.currentStatus;
                } else {
                    prObj.currentStatus = pr.status;
                }
                return prObj;
            })
        );

        res.json(enrichedRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get latest mobile user shipment defaults
// @route   GET /api/parcel-requests/mobile-user/defaults
// @access  Private
const getMobileUserDefaults = async (req, res) => {
    try {
        const data = await MobileUser.findById(req.user._id);

        res.json({
            customerName: data?.customerName || data?.name || req.user.name || '',
            mobileNumber: data?.mobileNumber || data?.mobile || req.user.mobile || '',
            pickupAddress: data?.pickupAddress || data?.address || req.user.address || '',
            pickupCity: data?.pickupCity || '',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get parcel request by ID
// @route   GET /api/parcel-requests/:id
// @access  Private
const getParcelRequestById = async (req, res) => {
    try {
        const parcelRequest = await findParcelRequestByTrackingId(req.params.id);

        if (!parcelRequest) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        const customerId = parcelRequest.customer && parcelRequest.customer._id 
            ? parcelRequest.customer._id 
            : (typeof parcelRequest.populated === 'function' ? parcelRequest.populated('customer') : null) || parcelRequest.customer;
        const customerIdStr = customerId ? customerId.toString() : '';

        // Customers and mobile users can only view their own
        if ((req.user.role === 'customer' || req.user.role === 'mobile') && customerIdStr !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this request' });
        }

        const prObj = parcelRequest.toObject();
        const mobileUserDoc = await MobileUser.findOne({ parcelRequestId: parcelRequest._id });
        if (mobileUserDoc) {
            prObj.currentStatus = mobileUserDoc.currentStatus;
        } else {
            prObj.currentStatus = parcelRequest.status;
        }

        res.json(prObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateParcelRequestStatus = async (req, res) => {
    try {
        const parcelRequest = await ParcelRequest.findById(req.params.id);

        if (!parcelRequest) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        const oldStatus = parcelRequest.status;
        parcelRequest.status = req.body.status;
        parcelRequest.updatedBy = req.user._id;

        const updated = await parcelRequest.save();

        // Also update matching MobileUser's currentStatus and get their _id for notification
        const mobileUserForNotif = await MobileUser.findOneAndUpdate(
            { parcelRequestId: parcelRequest._id },
            { $set: { currentStatus: req.body.status } },
            { new: true }
        );

        // Create a notification for the mobile user if status changed
        if (oldStatus !== req.body.status && mobileUserForNotif) {
            const Notification = require('../models/Notification');
            const bookingId = parcelRequest.manualLrNo || parcelRequest.bookingId || `ONL-${String(parcelRequest._id).slice(-6).toUpperCase()}`;
            await Notification.create({
                user: mobileUserForNotif._id,
                title: 'Shipment Status Updated',
                message: `Your shipment ${bookingId} status has been updated to "${req.body.status}".`,
                type: 'shipment',
                referenceId: parcelRequest._id.toString(),
            });
        }

        const populated = await ParcelRequest.findById(updated._id)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update parcel request details
// @route   PUT /api/parcel-requests/:id
// @access  Private (Owner/Admin/Branch)
const updateParcelRequest = async (req, res) => {
    try {
        const parcelRequest = await ParcelRequest.findById(req.params.id);

        if (!parcelRequest) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        const customerId = parcelRequest.customer && parcelRequest.customer._id 
            ? parcelRequest.customer._id 
            : (typeof parcelRequest.populated === 'function' ? parcelRequest.populated('customer') : null) || parcelRequest.customer;
        const customerIdStr = customerId ? customerId.toString() : '';
        const isOwner = customerIdStr === req.user._id.toString();
        const canManage = ['admin', 'branch'].includes(req.user.role);

        if (!isOwner && !canManage) {
            return res.status(403).json({ message: 'Not authorized to update this request' });
        }

        const editableFields = [
            'customerName',
            'mobileNumber',
            'pickupAddress',
            'deliveryAddress',
            'pickupCity',
            'deliveryCity',
            'parcelType',
            'transportType',
            'packageDescription',
            'weight',
            'quantity',
            'expectedDeliveryDate',
            'remarks',
        ];

        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                parcelRequest[field] = req.body[field];
            }
        });

        parcelRequest.updatedBy = req.user._id;
        const updated = await parcelRequest.save();

        const populated = await ParcelRequest.findById(updated._id)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createParcelRequest,
    getParcelRequests,
    getMobileUserDefaults,
    getParcelRequestById,
    updateParcelRequest,
    updateParcelRequestStatus,
};
