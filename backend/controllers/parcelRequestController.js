const ParcelRequest = require('../models/ParcelRequest');
const mongoose = require('mongoose');
const MobileUser = require('../models/MobileUser');

const createTrackingId = () => `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;

const findParcelRequestByTrackingId = async (trackingId) => {
    const normalized = String(trackingId || '').trim();
    if (!normalized) return null;

    let pr = null;
    if (mongoose.Types.ObjectId.isValid(normalized)) {
        pr = await ParcelRequest.findById(normalized)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');
    }

    if (!pr) {
        const suffix = normalized.replace(/^ONL-/i, '').toLowerCase();
        pr = await ParcelRequest.findOne({
            $or: [
                { trackingId: { $regex: new RegExp(`^${normalized}$`, 'i') } },
                {
                    $expr: {
                        $eq: [
                            { $substr: [{ $toLower: { $toString: '$_id' } }, 18, 6] },
                            suffix,
                        ],
                    },
                },
            ],
        })
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');
    }

    return pr;
};

// @desc    Create new parcel request
// @route   POST /api/parcel-requests
// @access  Private (Customer)
const createParcelRequest = async (req, res) => {
    try {
        const isMobileDoc = req.user.role === 'mobile' || (await MobileUser.exists({ _id: req.user._id }));
        const customerModel = isMobileDoc ? 'MobileUser' : 'User';
        const trackingId = createTrackingId();
        const initialTrackingHistory = [{
            status: 'Pending',
            location: req.body.pickupAddress || req.body.pickupCity || 'Origin',
            branchName: req.body.currentBranch || 'Central Hub',
            remark: 'Shipment created',
            updatedBy: req.user.name || 'Customer',
            dateTime: new Date(),
        }];

        const parcelRequest = new ParcelRequest({
            ...req.body,
            customer: req.user._id,
            customerModel,
            trackingId,
            currentStatus: 'Pending',
            currentBranch: req.body.currentBranch || 'Central Hub',
            currentLocation: req.body.pickupAddress || '',
            assignedStaff: req.body.assignedStaff || '',
            trackingHistory: initialTrackingHistory,
        });

        const created = await parcelRequest.save();

        const shipmentItem = {
            parcelRequestId: created._id,
            trackingId,
            pickupAddress: req.body.pickupAddress,
            deliveryAddress: req.body.deliveryAddress,
            packageDescription: req.body.packageDescription || req.body.parcelType,
            parcelType: req.body.parcelType || req.body.packageDescription,
            weight: req.body.weight,
            quantity: req.body.quantity,
            remarks: req.body.remarks,
            pickupCity: req.body.pickupCity,
            deliveryCity: req.body.deliveryCity,
            deliveryLocation: req.body.deliveryLocation || null,
            customerName: req.body.customerName || req.user.name,
            mobileNumber: req.body.mobileNumber || req.user.mobile,
            transportType: req.body.transportType || '',
            expectedDeliveryDate: req.body.expectedDeliveryDate || null,
            currentBranch: req.body.currentBranch || 'Central Hub',
            currentLocation: req.body.pickupAddress || '',
            currentStatus: 'Pending',
            assignedStaff: req.body.assignedStaff || '',
            trackingHistory: initialTrackingHistory,
            createdAt: new Date(),
        };

        // If user is a mobile user, store shipment in their shipments array and update latest defaults
        if (isMobileDoc) {
            await MobileUser.findByIdAndUpdate(req.user._id, {
                $push: { shipments: shipmentItem },
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
                    deliveryLocation: req.body.deliveryLocation || null,
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
                    trackingId,
                    assignedStaff: req.body.assignedStaff || '',
                }
            });
        }

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

        // Fetch userDoc for mobile user to cross-check status updates
        let userDoc = null;
        if (req.user.role === 'mobile') {
            userDoc = await MobileUser.findById(req.user._id);
        }

        const enrichedRequests = await Promise.all(
            parcelRequests.map(async (pr) => {
                const prObj = pr.toObject();

                // If customer is not populated, resolve from MobileUser or User
                if (!prObj.customer && pr.customer) {
                    const rawCustId = pr.customer._id || pr.customer;
                    let foundCust = await MobileUser.findById(rawCustId).select('name username email mobile company');
                    if (!foundCust) {
                        const User = require('../models/User');
                        foundCust = await User.findById(rawCustId).select('name username email mobile company');
                    }
                    if (foundCust) {
                        prObj.customer = foundCust;
                    }
                }

                // Check if MobileUser.shipments has a newer/richer status or tracking history
                if (userDoc && Array.isArray(userDoc.shipments)) {
                    const muMatch = userDoc.shipments.find(s => 
                        (s.parcelRequestId && String(s.parcelRequestId) === String(pr._id)) ||
                        (s.trackingId && pr.trackingId && s.trackingId.toLowerCase() === pr.trackingId.toLowerCase())
                    );
                    if (muMatch) {
                        const muHistLen = Array.isArray(muMatch.trackingHistory) ? muMatch.trackingHistory.length : 0;
                        const prHistLen = Array.isArray(pr.trackingHistory) ? pr.trackingHistory.length : 0;

                        if (muHistLen > prHistLen || (muMatch.currentStatus && muMatch.currentStatus !== pr.currentStatus && muMatch.currentStatus !== 'Pending')) {
                            prObj.currentStatus = muMatch.currentStatus || muMatch.status || prObj.currentStatus;
                            prObj.status = prObj.currentStatus;
                            prObj.trackingHistory = muMatch.trackingHistory || prObj.trackingHistory;

                            // Sync back to ParcelRequest model asynchronously
                            ParcelRequest.updateOne(
                                { _id: pr._id },
                                {
                                    $set: {
                                        currentStatus: prObj.currentStatus,
                                        status: prObj.currentStatus,
                                        trackingHistory: prObj.trackingHistory,
                                    }
                                }
                            ).catch(err => console.error("Error updating ParcelRequest status from MobileUser:", err.message));
                        }
                    }
                }

                prObj.currentStatus = prObj.currentStatus || pr.currentStatus || pr.status || 'Pending';
                prObj.trackingId = pr.trackingId || `ONL-${String(pr._id).slice(-6).toUpperCase()}`;

                return prObj;
            })
        );

        // Self-healing auto-sync: Ensure MobileUser document always has all shipments with up-to-date statuses
        if (req.user.role === 'mobile' && userDoc) {
            const syncItems = enrichedRequests.map(p => ({
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
                customerName: p.customerName || userDoc.name,
                mobileNumber: p.mobileNumber || userDoc.mobile,
                currentBranch: p.currentBranch || 'Central Hub',
                currentLocation: p.currentLocation || p.pickupAddress,
                currentStatus: p.currentStatus || 'Pending',
                assignedStaff: p.assignedStaff || '',
                trackingHistory: p.trackingHistory || [],
                createdAt: p.createdAt,
            }));
            MobileUser.findByIdAndUpdate(req.user._id, { $set: { shipments: syncItems } })
                .catch(e => console.error("Error auto-syncing mobile user shipments:", e.message));
        }

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
        if (!prObj.customer && customerIdStr) {
            let foundCust = await MobileUser.findById(customerIdStr).select('name username email mobile company');
            if (!foundCust) {
                const User = require('../models/User');
                foundCust = await User.findById(customerIdStr).select('name username email mobile company');
            }
            if (foundCust) prObj.customer = foundCust;
        }

        prObj.currentStatus = parcelRequest.currentStatus || parcelRequest.status || 'Pending';
        prObj.trackingId = parcelRequest.trackingId || `ONL-${String(parcelRequest._id).slice(-6).toUpperCase()}`;

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
        const newStatus = req.body.status;
        parcelRequest.status = newStatus;
        parcelRequest.currentStatus = newStatus;
        parcelRequest.updatedBy = req.user._id;

        const historyEntry = {
            status: newStatus,
            location: req.body.location || parcelRequest.currentLocation || '',
            branchName: req.body.branchName || parcelRequest.currentBranch || '',
            remark: req.body.remarks || req.body.remark || `Status updated to "${newStatus}"`,
            updatedBy: req.user.name || 'Admin',
            dateTime: new Date(),
        };

        if (!Array.isArray(parcelRequest.trackingHistory)) {
            parcelRequest.trackingHistory = [];
        }
        parcelRequest.trackingHistory.push(historyEntry);

        const updated = await parcelRequest.save();

        const customerId = parcelRequest.customer ? (parcelRequest.customer._id || parcelRequest.customer) : null;

        if (customerId) {
            const trackingId = parcelRequest.trackingId || `ONL-${String(parcelRequest._id).slice(-6).toUpperCase()}`;

            // 1. Update in MobileUser shipments array
            await MobileUser.updateOne(
                {
                    _id: customerId,
                    $or: [
                        { 'shipments.parcelRequestId': parcelRequest._id },
                        { 'shipments.trackingId': trackingId },
                    ]
                },
                {
                    $set: {
                        'shipments.$.currentStatus': newStatus,
                        'shipments.$.currentBranch': historyEntry.branchName,
                        'shipments.$.currentLocation': historyEntry.location,
                        'shipments.$.trackingHistory': parcelRequest.trackingHistory,
                    }
                }
            );

            // 2. If top-level parcelRequestId or trackingId matches, update top-level as well
            await MobileUser.updateOne(
                {
                    _id: customerId,
                    $or: [
                        { parcelRequestId: parcelRequest._id },
                        { trackingId: trackingId }
                    ]
                },
                {
                    $set: {
                        currentStatus: newStatus,
                        currentBranch: historyEntry.branchName,
                        currentLocation: historyEntry.location,
                        trackingHistory: parcelRequest.trackingHistory,
                    }
                }
            );

            // 3. Create notification for the mobile user if status changed
            if (oldStatus !== newStatus) {
                const Notification = require('../models/Notification');
                const bookingId = parcelRequest.trackingId || parcelRequest.manualLrNo || `ONL-${String(parcelRequest._id).slice(-6).toUpperCase()}`;
                await Notification.create({
                    user: customerId,
                    title: 'Shipment Status Updated',
                    message: `Your shipment ${bookingId} status has been updated to "${newStatus}".`,
                    type: 'shipment',
                    referenceId: parcelRequest._id.toString(),
                });
            }
        }

        const populated = await ParcelRequest.findById(updated._id)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');

        const populatedObj = populated.toObject();
        if (!populatedObj.customer && customerId) {
            let foundCust = await MobileUser.findById(customerId).select('name username email mobile company');
            if (!foundCust) {
                const User = require('../models/User');
                foundCust = await User.findById(customerId).select('name username email mobile company');
            }
            if (foundCust) populatedObj.customer = foundCust;
        }

        res.json(populatedObj);
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
            'deliveryLocation',
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
