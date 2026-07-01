const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const MobileUser = require('./models/MobileUser');
const User = require('./models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

mongoose.connect(process.env.MONGO_URI, { dbName: "luggage_billing" })
  .then(async () => {
    const user = await MobileUser.findOne({ role: 'mobile' });
    if (!user) {
        console.log("No mobile user found");
        process.exit(1);
    }
    
    console.log("Found user:", user.email || user.username);
    const token = generateToken(user._id);
    console.log("Generated token:", token);

    // Now let's try to simulate what authMiddleware does
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded ID:", decoded.id);
        
        let reqUser = await User.findById(decoded.id).select('-password');
        if (!reqUser) {
            reqUser = await MobileUser.findById(decoded.id).select('-password');
        }
        
        if (!reqUser) {
            console.log("authMiddleware: Not authorized, user not found");
        } else {
            console.log("authMiddleware: User found:", reqUser.email || reqUser.username);
        }
    } catch (e) {
        console.log("authMiddleware error:", e.message);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
