const express = require('express');
const router = express.Router();
const { createAgent, getAgents, deleteAgent } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../config/roles');

// Add agent - sirf admin aur superadmin
router.post('/',
    protect,
    checkPermission(PERMISSIONS.ADD_AGENT),
    createAgent
);

// View agents - sab dekh sakte hain
router.get('/',
    protect,
    checkPermission(PERMISSIONS.VIEW_AGENT),
    getAgents
);

// Delete agent - sirf superadmin
router.delete('/:id',
    protect,
    checkPermission(PERMISSIONS.DELETE_AGENT),
    deleteAgent
);

// Update agent - sirf admin aur superadmin
router.put('/:id',
    protect,
    checkPermission(PERMISSIONS.UPDATE_AGENT),
    async (req, res) => {
        try {
            const Agent = require('../models/Agent');
            const agent = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(agent);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;