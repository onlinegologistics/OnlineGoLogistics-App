const asyncHandler = require("express-async-handler");
const Enquiry = require("../models/Enquiry");
const MobileUserEnquiry = require("../models/MobileUserEnquiry");

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin/Staff)
const getEnquiries = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  // Build filter query
  const filter = {};

  // Role-based data isolation
  if (req.user) {
      if (req.user.role === 'branch') {
          // Branch sees enquiries created by them OR by their agents
          filter.$or = [{ user: req.user._id }, { branch: req.user._id }];
      } else if (req.user.role === 'agent' || req.user.role === 'customer') {
          // Agents/Customers only see their own
          filter.user = req.user._id;
      }
  }

  // Date filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Add 23:59:59 to include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDateTime;
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination
  const totalEnquiries = await Enquiry.countDocuments(filter);
  const totalPages = Math.ceil(totalEnquiries / limitNum);

  // Fetch enquiries with filters and pagination
  const enquiries = await Enquiry.find(filter)
    .populate('user', 'name username role')
    .populate('branch', 'name username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    enquiries,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalEnquiries,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  });
});

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = asyncHandler(async (req, res) => {
  const { name, mobile, message, enquiryType, subject } = req.body;

  if (req.user && req.user.role === 'mobile') {
    if (!message || !enquiryType || !subject) {
      res.status(400);
      throw new Error("Please add enquiryType, subject and message");
    }

    const mobileEnquiry = await MobileUserEnquiry.create({
      user: req.user._id,
      name: req.user.name,
      enquiryType,
      subject,
      message,
    });
    return res.status(201).json(mobileEnquiry);
  }

  if (!name || !mobile || !message) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const enquiryData = {
    name,
    mobile,
    message,
  };

  if (req.user) {
      enquiryData.user = req.user._id;
      // If an agent or customer created this, assign their branch
      if (req.user.role === 'agent' || req.user.role === 'customer') {
          enquiryData.branch = req.user.createdByUser || req.user.createdBy;
      } else if (req.user.role === 'branch') {
          enquiryData.branch = req.user._id;
      }
  }

  const enquiry = await Enquiry.create(enquiryData);

  res.status(201).json(enquiry);
});

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
// @access  Private (Admin/Staff)
const updateEnquiry = asyncHandler(async (req, res) => {
  let isMobileEnquiry = false;
  let enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    enquiry = await MobileUserEnquiry.findById(req.params.id);
    if (!enquiry) {
      res.status(404);
      throw new Error("Enquiry not found");
    }
    isMobileEnquiry = true;
  }

  const oldStatus = enquiry.status;

  let updatedEnquiry;
  if (isMobileEnquiry) {
    updatedEnquiry = await MobileUserEnquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
  } else {
    updatedEnquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
  }

  // Create notification if status changed and it's a mobile user enquiry
  if (isMobileEnquiry && oldStatus !== req.body.status && enquiry.user) {
    const Notification = require('../models/Notification');
    await Notification.create({
      user: enquiry.user,
      title: 'Enquiry Status Updated',
      message: `Your enquiry "${enquiry.subject}" status has been updated to "${req.body.status}".`,
      type: 'enquiry',
      referenceId: enquiry._id.toString(),
    });
  }

  res.json(updatedEnquiry);
});

module.exports = {
  getEnquiries,
  createEnquiry,
  updateEnquiry,
};
