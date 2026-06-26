const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerUser,
    getUsers,
    deleteUser,
    updateUser,
    getCustomers,
    sendOTP,
    getProfile,
    updateProfile,
    requestRegistrationOtp,
    verifyRegistrationOtp,
    requestLoginOtp,
    verifyLoginOtp,
    getPickupAddresses,
    addPickupAddress,
} = require('../controllers/authController');
const { protect, admin, adminOrUser } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/login/request-otp', requestLoginOtp);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/register/request-otp', requestRegistrationOtp);
router.post('/register/verify', verifyRegistrationOtp);
router.post('/send-otp', protect, sendOTP);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/pickup-addresses').get(protect, getPickupAddresses).post(protect, addPickupAddress);
router.route('/register').post(protect, adminOrUser, registerUser);
router.route('/users').get(protect, admin, getUsers);
router.route('/customers').get(protect, adminOrUser, getCustomers);
router
    .route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, adminOrUser, updateUser);

module.exports = router;
