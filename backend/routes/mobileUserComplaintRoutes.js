const express = require('express');
const router = express.Router();
const { getMyComplaints } = require('../controllers/mobileUserComplaintController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMyComplaints);

module.exports = router;
