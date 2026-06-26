const express = require('express');
const router = express.Router();
const {
    createParcelRequest,
    getParcelRequests,
    getMobileUserDefaults,
    getParcelRequestById,
    updateParcelRequest,
    updateParcelRequestStatus,
} = require('../controllers/parcelRequestController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../config/roles');

// Create parcel request - sab authenticated users
router.post('/',
    protect,
    createParcelRequest
);

// View all parcel requests - sab dekh sakte hain
router.get('/',
    protect,
    getParcelRequests
);

// Latest mobile_user defaults for new shipment form
router.get('/mobile-user/defaults',
    protect,
    getMobileUserDefaults
);

// View parcel request by ID
router.get('/:id',
    protect,
    getParcelRequestById
);

// Update parcel request details
router.put('/:id',
    protect,
    updateParcelRequest
);

// Update parcel request status - sirf admin aur superadmin
router.put('/:id/status',
    protect,
    checkPermission(PERMISSIONS.UPDATE_PARCEL),
    updateParcelRequestStatus
);

module.exports = router;
