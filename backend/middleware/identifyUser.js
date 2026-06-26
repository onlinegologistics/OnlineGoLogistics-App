const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const identifyUser = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                const MobileUser = require('../models/MobileUser');
                req.user = await MobileUser.findById(decoded.id).select('-password');
            }
        } catch (error) {
            console.log("Token verification failed in identifyUser, treating as guest");
            // Do nothing, req.user will be undefined, which is fine for guest access
        }
    }

    next();
});

module.exports = identifyUser;
