const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MobileUser = require('../models/MobileUser');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (jwtErr) {
                console.error('[Auth] JWT verify failed:', jwtErr.message);
                return res.status(401).json({ message: 'Not authorized, token failed', error: jwtErr.message });
            }

            // Try users collection first (admin/branch/user), then mobileusers (mobile app)
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                req.user = await MobileUser.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                console.error('[Auth] User not found for id:', decoded.id);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('[Auth] Middleware error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
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
