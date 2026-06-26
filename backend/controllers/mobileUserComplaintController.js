const asyncHandler = require('express-async-handler');
const MobileUserComplaint = require('../models/MobileUserComplaint');

// @desc    Get logged in mobile user's complaints
// @route   GET /api/mobile-user-complaints
// @access  Private (Mobile User)
const getMyComplaints = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const complaints = await MobileUserComplaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
});

module.exports = {
    getMyComplaints,
};
