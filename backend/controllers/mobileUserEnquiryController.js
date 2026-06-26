const asyncHandler = require('express-async-handler');
const MobileUserEnquiry = require('../models/MobileUserEnquiry');

// @desc    Get logged in mobile user's enquiries
// @route   GET /api/mobile-user-enquiries
// @access  Private (Mobile User)
const getMyEnquiries = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const enquiries = await MobileUserEnquiry.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(enquiries);
});

module.exports = {
    getMyEnquiries,
};
