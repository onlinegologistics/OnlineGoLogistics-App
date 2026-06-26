const express = require('express');
const router = express.Router();
const { createAgentParcel, getAgentParcels, reviewAgentParcel, deleteAgentParcel } = require('../controllers/agentParcelController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createAgentParcel)
    .get(protect, getAgentParcels);

router.route('/:id/review')
    .put(protect, reviewAgentParcel);

router.route('/:id')
    .delete(protect, deleteAgentParcel);

module.exports = router;
