const express = require('express');
const router = express.Router();
const { trackShipment } = require('../controllers/shipmentController');

// GET tracking details by tracking ID
router.get('/track/:trackingId', trackShipment);

module.exports = router;
