const express = require('express');
const router = express.Router();
const {
    createLuggage,
    getLuggage,
    getLuggageById,
    deleteLuggage,
    updateLuggage,
} = require('../controllers/luggageController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../config/roles');

// Add luggage - sirf admin aur superadmin
router.post('/',
    protect,
    checkPermission(PERMISSIONS.ADD_LUGGAGE),
    createLuggage
);

// View all luggage - sab dekh sakte hain
router.get('/',
    protect,
    checkPermission(PERMISSIONS.VIEW_LUGGAGE),
    getLuggage
);

// View luggage by ID
router.get('/:id',
    protect,
    getLuggageById
);

// Update luggage - sirf admin aur superadmin
router.put('/:id',
    protect,
    checkPermission(PERMISSIONS.UPDATE_LUGGAGE),
    updateLuggage
);

// Delete luggage - sirf superadmin
router.delete('/:id',
    protect,
    checkPermission(PERMISSIONS.DELETE_LUGGAGE),
    deleteLuggage
);

module.exports = router;