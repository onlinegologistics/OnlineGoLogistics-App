const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../config/roles');
const { protect } = require('../middleware/authMiddleware'); // FIX - authMiddleware use kar

// Import your existing controllers
const { 
    addCustomer, 
    getCustomers, 
    updateCustomer, 
    deleteCustomer 
} = require('../controllers/customerController');

// Add customer - sirf admin aur superadmin
router.post('/', 
    protect,
    checkPermission(PERMISSIONS.ADD_CUSTOMER),
    addCustomer
);

// View customers - sab dekh sakte hain
router.get('/',
    protect,
    checkPermission(PERMISSIONS.VIEW_CUSTOMER),
    getCustomers
);

// Update customer
router.put('/:id',
    protect,
    checkPermission(PERMISSIONS.UPDATE_CUSTOMER),
    updateCustomer
);

// Delete customer - sirf superadmin
router.delete('/:id',
    protect,
    checkPermission(PERMISSIONS.DELETE_CUSTOMER),
    deleteCustomer
);

module.exports = router;