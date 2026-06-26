const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MobileUser = require('../models/MobileUser');
// Trigger reload

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try users collection first (admin/branch/user), then mobileusers (mobile app)
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                req.user = await MobileUser.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'branch')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const adminOrUser = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'user' || req.user.role === 'branch' || req.user.role === 'agent')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Admin or User role required.' });
    }
};

module.exports = { protect, admin, adminOrUser };
