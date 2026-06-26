const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const MobileUserComplaint = require('../models/MobileUserComplaint');

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = asyncHandler(async (req, res) => {
    const { userId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build filter query
    const query = {};
    // Role-based data isolation
    if (req.user) {
        if (req.user.role === 'branch') {
            // Branch sees complaints created by them OR by their agents
            query.$or = [{ user: req.user._id }, { branch: req.user._id }];
        } else if (req.user.role === 'agent' || req.user.role === 'customer') {
            // Agents/Customers only see their own
            query.user = req.user._id;
        }
    }
    
    // Explicit filter by user if provided (mostly for admin)
    if (userId && (!req.user || req.user.role === 'admin')) {
        query.user = userId;
    }
    
    // Date filtering
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            // Add 23:59:59 to include the entire end date
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            query.createdAt.$lte = endDateTime;
        }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalComplaints = await Complaint.countDocuments(query);
    const totalPages = Math.ceil(totalComplaints / limitNum);

    // Fetch complaints with filters and pagination
    const complaints = await Complaint.find(query)
        .populate('user', 'name username mobile role')
        .populate('branch', 'name username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    res.json({
        complaints,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalComplaints,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        }
    });
});

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Public
const createComplaint = asyncHandler(async (req, res) => {
    const { subject, description, priority, contactName, contactMobile, receiptNo } = req.body;

    if (!subject || !description || !receiptNo) {
        res.status(400);
        throw new Error('Please add subject, description, and receipt number');
    }

    if (req.user && req.user.role === 'mobile') {
        const complaint = await MobileUserComplaint.create({
            user: req.user._id,
            name: req.user.name,
            receiptNo,
            subject,
            description,
        });
        return res.status(201).json(complaint);
    }

    // If user is logged in, use their ID but also save contact info to ensure we have it
    let complaintData = {
        subject,
        description,
        receiptNo,
        priority: priority || 'Medium',
        contactName,
        contactMobile
    };

    if (req.user) {
        complaintData.user = req.user._id;
        // If an agent or customer created this, assign their branch
        if (req.user.role === 'agent' || req.user.role === 'customer') {
            complaintData.branch = req.user.createdByUser || req.user.createdBy;
        } else if (req.user.role === 'branch') {
            complaintData.branch = req.user._id;
        }
    } else {
        if (!contactName || !contactMobile) {
            res.status(400);
            throw new Error('Please provide Name and Mobile Number for guest tickets');
        }
    }

    const complaint = await Complaint.create(complaintData);

    res.status(201).json(complaint);
});

// @desc    Update complaint status/details
// @route   PUT /api/complaints/:id
// @access  Private (Admin mostly)
const updateComplaint = asyncHandler(async (req, res) => {
    let isMobileComplaint = false;
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        complaint = await MobileUserComplaint.findById(req.params.id);
        if (!complaint) {
            res.status(404);
            throw new Error('Complaint not found');
        }
        isMobileComplaint = true;
    }

    const oldStatus = complaint.status;

    let updatedComplaint;
    if (isMobileComplaint) {
        updatedComplaint = await MobileUserComplaint.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
    } else {
        updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
    }

    // Create notification if status changed and it's a mobile user complaint
    if (isMobileComplaint && oldStatus !== req.body.status && complaint.user) {
        const Notification = require('../models/Notification');
        await Notification.create({
            user: complaint.user,
            title: 'Complaint Status Updated',
            message: `Your complaint for LR ${complaint.receiptNo} status has been updated to "${req.body.status}".`,
            type: 'complaint',
            referenceId: complaint._id.toString(),
        });
    }

    res.json(updatedComplaint);
});

module.exports = {
    getComplaints,
    createComplaint,
    updateComplaint
};
