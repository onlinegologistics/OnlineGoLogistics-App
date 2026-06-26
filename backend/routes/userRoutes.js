const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkRole } = require('../middleware/roleAuth');
const { ROLES } = require('../config/roles');
const { protect } = require('../middleware/authMiddleware'); // FIX - ye line add kar

// Delete user - sirf admin
router.delete('/:id',
    protect,
    checkRole([ROLES.ADMIN]),
    async (req, res) => {
        try {
            const userToDelete = await User.findById(req.params.id);
            
            if (!userToDelete) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Apne aap ko delete nahi kar sakta
            if (userToDelete.role === ROLES.ADMIN && 
                req.user._id.toString() === userToDelete._id.toString()) {
                return res.status(403).json({ 
                    message: 'Cannot delete yourself' 
                });
            }

            await User.findByIdAndDelete(req.params.id);
            res.json({ message: 'User deleted' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;