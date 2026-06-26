const express = require('express');
const router = express.Router();
const { getMyEnquiries } = require('../controllers/mobileUserEnquiryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMyEnquiries);

module.exports = router;
