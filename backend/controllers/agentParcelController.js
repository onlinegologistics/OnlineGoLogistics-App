const AgentParcelRequest = require('../models/AgentParcelRequest');
const User = require('../models/User');

// @desc    Create agent parcel request
// @route   POST /api/agent-parcels
// @access  Private (Agent)
const createAgentParcel = async (req, res) => {
    try {
        const { senderName, senderMobile, senderAddress, receiverName, receiverMobile, receiverAddress, packageDescription, weight, quantity, remarks } = req.body;

        if (!senderName || !senderMobile || !receiverName || !receiverMobile) {
            return res.status(400).json({ message: 'Sender and receiver name/mobile are required' });
        }

        // Find which branch created this agent
        const agent = await User.findById(req.user._id);
        if (!agent || agent.role !== 'agent') {
            return res.status(403).json({ message: 'Only agents can create parcel requests' });
        }

        const parcel = await AgentParcelRequest.create({
            agent: req.user._id,
            branch: agent.createdByUser,
            senderName, senderMobile, senderAddress,
            receiverName, receiverMobile, receiverAddress,
            packageDescription, weight, quantity, remarks,
        });

        res.status(201).json(parcel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get agent parcel requests (agent sees own, branch sees from their agents, admin sees all)
// @route   GET /api/agent-parcels
// @access  Private
const getAgentParcels = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'agent') {
            filter.agent = req.user._id;
        } else if (req.user.role === 'branch') {
            filter.branch = req.user._id;
        }
        // admin sees all

        const parcels = await AgentParcelRequest.find(filter)
            .populate('agent', 'name username mobile')
            .populate('branch', 'name')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(parcels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Reject agent parcel request
// @route   PUT /api/agent-parcels/:id/review
// @access  Private (Branch/Admin)
const reviewAgentParcel = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Approved or Rejected' });
        }

        const parcel = await AgentParcelRequest.findById(req.params.id);
        if (!parcel) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        // Branch can only review their own branch's parcels
        if (req.user.role === 'branch' && parcel.branch.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this request' });
        }

        parcel.status = status;
        parcel.reviewedBy = req.user._id;
        parcel.reviewedAt = new Date();
        if (status === 'Rejected' && rejectionReason) {
            parcel.rejectionReason = rejectionReason;
        }

        await parcel.save();
        
        const updated = await AgentParcelRequest.findById(parcel._id)
            .populate('agent', 'name username mobile')
            .populate('branch', 'name')
            .populate('reviewedBy', 'name');

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete agent parcel request
// @route   DELETE /api/agent-parcels/:id
// @access  Private
const deleteAgentParcel = async (req, res) => {
    try {
        const parcel = await AgentParcelRequest.findById(req.params.id);
        if (!parcel) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        // Only the agent who created it (if pending) or admin can delete
        if (req.user.role === 'agent' && parcel.agent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await parcel.deleteOne();
        res.json({ message: 'Parcel request removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createAgentParcel, getAgentParcels, reviewAgentParcel, deleteAgentParcel };
