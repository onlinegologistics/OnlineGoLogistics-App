const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const MobileUser = require('../models/MobileUser');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

    // For all notifications, enrich with live currentStatus from respective collections
    const enriched = await Promise.all(
        notifications.map(async (notif) => {
            const obj = notif.toObject();
            
            if (obj.type === 'shipment' && obj.referenceId) {
                // Fetch from MobileUser
                const mobileUser = await MobileUser.findOne(
                    { parcelRequestId: obj.referenceId, _id: req.user._id }
                ).select('currentStatus');
                if (mobileUser && mobileUser.currentStatus) {
                    obj.currentStatus = mobileUser.currentStatus;
                }
            } else if (obj.type === 'complaint' && obj.referenceId) {
                // Fetch from MobileUserComplaint
                const MobileUserComplaint = require('../models/MobileUserComplaint');
                const complaint = await MobileUserComplaint.findById(obj.referenceId).select('status');
                if (complaint && complaint.status) {
                    obj.currentStatus = complaint.status;
                }
            } else if (obj.type === 'enquiry' && obj.referenceId) {
                // Fetch from MobileUserEnquiry
                const MobileUserEnquiry = require('../models/MobileUserEnquiry');
                const enquiry = await MobileUserEnquiry.findById(obj.referenceId).select('status');
                if (enquiry && enquiry.status) {
                    obj.currentStatus = enquiry.status;
                }
            }
            
            return obj;
        })
    );

    res.json(enriched);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }
    if (notification.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read', notification });
});

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
