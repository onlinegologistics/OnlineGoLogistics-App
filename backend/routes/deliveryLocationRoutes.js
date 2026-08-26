const express = require('express');
const router = express.Router();
const { getDeliveryLocations } = require('../controllers/deliveryLocationController');
const { protect } = require('../middleware/authMiddleware');

// Get all delivery locations - authenticated users
router.get('/', protect, getDeliveryLocations);

module.exports = router;
