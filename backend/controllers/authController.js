const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MobileUser = require('../models/MobileUser');
const OtpVerification = require('../models/OtpVerification');
const PickupAddress = require('../models/PickupAddress');
const ParcelRequest = require('../models/ParcelRequest');
const Luggage = require('../models/Luggage');
const transporter = require('../config/mailer');
const mongoose = require('mongoose');
const firebaseAdmin = require('../config/firebaseAdmin');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const publicUserResponse = (user) => ({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    company: user.company,
    role: user.role,
    token: generateToken(user._id),
});

const profileResponse = (user) => ({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    company: user.company,
    role: user.role,
    isActive: user.isActive,
    profilePhoto: user.profilePhoto,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const buildMobileUserDataDoc = (user) => ({
    userId: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    company: user.company,
    role: user.role,
    isActive: user.isActive,
    pickupAddress: user.address,
    customerName: user.name,
    mobileNumber: user.mobile,
    currentLocation: user.address,
    currentStatus: 'Pending',
    updatedAt: new Date(),
});

const upsertMobileUserData = async (user) => {
    // Deprecated: We don't maintain a separate mobile data doc anymore since mobile users are in MobileUser.
};

const getMobileUserData = async (userId) => {
    return await MobileUser.findById(userId);
};

const mergedProfileResponse = async (user) => {
    const mobileData = await getMobileUserData(user._id);
    return {
        ...profileResponse(user),
        name: mobileData?.name || user.name,
        username: mobileData?.username || user.username,
        email: mobileData?.email || user.email,
        mobile: mobileData?.mobile || user.mobile,
        address: mobileData?.address || user.address,
        company: mobileData?.company || user.company,
        profilePhoto: mobileData?.profilePhoto || user.profilePhoto,
    };
};

const https = require('https');

const sendOtpFast2SMS = async ({ mobile, otp }) => {
    console.log(`[Fast2SMS] Attempting to send OTP to ${mobile}: ${otp}`);
    
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
        console.log(`[Fast2SMS] API key missing in .env. Skipping real SMS transmission.`);
        return false;
    }

    // Format phone number (remove +91 if present for Fast2SMS as it expects 10 digits)
    let formattedMobile = mobile.trim();
    if (formattedMobile.startsWith('+91')) {
        formattedMobile = formattedMobile.substring(3);
    } else if (formattedMobile.startsWith('91') && formattedMobile.length === 12) {
        formattedMobile = formattedMobile.substring(2);
    }

    return new Promise((resolve) => {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=otp&variables_values=${encodeURIComponent(otp)}&numbers=${encodeURIComponent(formattedMobile)}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.return === true) {
                        console.log(`[Fast2SMS] SMS sent successfully:`, response.message);
                        resolve(true);
                    } else {
                        console.error(`[Fast2SMS] API failed to send SMS:`, response.message);
                        resolve(false);
                    }
                } catch (err) {
                    console.error(`[Fast2SMS] Failed to parse API response:`, data);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error(`[Fast2SMS] Connection error:`, err.message);
            resolve(false);
        });
    });
};

const sendOtpEmail = async ({ email, otp, subject }) => {
    if (!email || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    try {
        await transporter.sendMail({
            from: `"Online Go Logistics" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #0f172a;">Online Go Logistics OTP</h2>
                    <p style="color: #6b7280;">Use this OTP to continue.</p>
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otp}</span>
                    </div>
                    <p style="color: #6b7280;">This OTP is valid for <strong>10 minutes</strong>.</p>
                </div>
            `,
        });
        return true;
    } catch (error) {
        console.error('Nodemailer failed to send email:', error.message);
        return false;
    }
};

const buildOtpResponse = (message, otp, extra = {}) => {
    return { message, ...extra };
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    // Find all matching users and try each one
    const adminUsers = await User.find({
        $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
    });
    const mobileUsers = await MobileUser.find({
        $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
    });
    
    const users = [...adminUsers, ...mobileUsers];
    
    // Try to match password with each found user (prefer admin/branch roles)
    const sortedUsers = users.sort((a, b) => {
        const priority = { admin: 0, branch: 1, user: 2, customer: 3 };
        return (priority[a.role] || 99) - (priority[b.role] || 99);
    });

    for (const user of sortedUsers) {
        if (await user.matchPassword(password)) {
            return res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }
    }

    res.status(401).json({ message: 'Invalid email/username or password' });
};

// @desc    Request OTP before public user registration
// @route   POST /api/auth/register/request-otp
// @access  Public
const requestRegistrationOtp = async (req, res) => {
    try {
        const { name, email, mobile, alternateMobile, password, address } = req.body;

        if (!name || !email || !mobile || !password || !address) {
            return res.status(400).json({ message: 'Name, email, mobile, password and address are required' });
        }

        const existingUser = await MobileUser.findOne({
            $or: [{ username: email.toLowerCase() }, { email: email.toLowerCase() }, { mobile }],
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase() || existingUser.username === email.toLowerCase()) {
                return res.status(400).json({ message: 'This email is already registered. Please login.' });
            }
            if (existingUser.mobile === mobile) {
                return res.status(400).json({ message: 'This mobile number is already registered. Please login.' });
            }
            return res.status(400).json({ message: 'Account already exists. Please login.' });
        }

        const otp = createOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OtpVerification.findOneAndUpdate(
            { purpose: 'registration', mobile },
            {
                purpose: 'registration',
                mobile,
                email: email.toLowerCase(),
                otp,
                expiresAt,
                payload: {
                    name,
                    email: email.toLowerCase(),
                    mobile,
                    alternateMobile,
                    password,
                    address,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const emailSent = await sendOtpEmail({
            email,
            otp,
            subject: 'OTP for Online Go Logistics Registration',
        });

        console.log(`Registration OTP for ${mobile}: ${otp}`);
        res.json(buildOtpResponse('OTP sent for registration', otp, { emailSent }));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify registration OTP and create user
// @route   POST /api/auth/register/verify
// @access  Public
const verifyRegistrationOtp = async (req, res) => {
    console.log(`\n[DEBUG] API HIT: ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG] BODY:`, req.body);
    try {
        const { mobile, otp } = req.body;

        if (!mobile || !otp) {
            return res.status(400).json({ message: 'Mobile and OTP are required' });
        }

        const record = await OtpVerification.findOne({
            purpose: 'registration',
            mobile,
            otp,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        const { name, email, password, address, alternateMobile } = record.payload || {};
        if (!name || !email || !password || !address) {
            return res.status(400).json({ message: 'Registration data expired. Please request OTP again.' });
        }

        const existingUser = await MobileUser.findOne({
            $or: [{ username: email }, { email }, { mobile }],
        });

        if (existingUser) {
            await record.deleteOne();
            return res.status(400).json({ message: 'User with this email or mobile already exists' });
        }

        const user = await MobileUser.create({
            name,
            username: email,
            email,
            mobile,
            alternateMobile,
            password,
            address,
            role: 'mobile',
            isActive: true,
            
            // Mobile app account data fields
            customerName: name,
            mobileNumber: mobile,
            pickupAddress: address,
            currentLocation: address,
            currentStatus: 'Pending',
        });

        // Also create a PickupAddress record
        await PickupAddress.create({
            user: user._id,
            address,
            isPrimary: true,
        });
        await upsertMobileUserData(user);

        await record.deleteOne();
        console.log(`[DEBUG] SUCCESS: MobileUser officially created and saved to mobileusers collection. User ID: ${user._id}`);
        res.status(201).json(publicUserResponse(user));
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'Username/Email';
            return res.status(409).json({
                message: `${field} is already registered. Please login or use another value.`
            });
        }
        res.status(500).json({ message: err.message });
    }
};

// @desc    Request OTP for login
// @route   POST /api/auth/login/request-otp
// @access  Public
const requestLoginOtp = async (req, res) => {
    try {
        const { identifier, mobile, email, username } = req.body;
        const loginIdentifier = identifier || mobile || email || username;

        if (!loginIdentifier) {
            return res.status(400).json({ message: 'Mobile, email or username is required' });
        }

        let user = await MobileUser.findOne({
            $or: [
                { mobile: loginIdentifier },
                { email: loginIdentifier.toLowerCase?.() || loginIdentifier },
                { username: loginIdentifier.toLowerCase?.() || loginIdentifier },
            ],
        });

        if (!user) {
            user = await User.findOne({
                $or: [
                    { mobile: loginIdentifier },
                    { email: loginIdentifier.toLowerCase?.() || loginIdentifier },
                    { username: loginIdentifier.toLowerCase?.() || loginIdentifier },
                ],
            });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = createOtp();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const emailSent = await sendOtpEmail({
            email: user.email,
            otp,
            subject: 'OTP for Online Go Logistics Login',
        });

        console.log(`Login OTP for ${user.mobile || user.email || user.username}: ${otp}`);
        res.json(buildOtpResponse('OTP sent for login', otp, { emailSent }));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify login OTP
// @route   POST /api/auth/login/verify-otp
// @access  Public
const verifyLoginOtp = async (req, res) => {
    try {
        const { identifier, mobile, email, username, otp } = req.body;
        const loginIdentifier = identifier || mobile || email || username;

        if (!loginIdentifier || !otp) {
            return res.status(400).json({ message: 'Identifier and OTP are required' });
        }

        const normalized = loginIdentifier.toLowerCase?.() || loginIdentifier;
        let user = await MobileUser.findOne({
            $or: [
                { mobile: loginIdentifier },
                { email: normalized },
                { username: normalized },
            ],
        });

        if (!user) {
            user = await User.findOne({
                $or: [
                    { mobile: loginIdentifier },
                    { email: normalized },
                    { username: normalized },
                ],
            });
        }

        if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json(publicUserResponse(user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
    const { name, username, password, role, email, mobile, address, company } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }
    const user = await User.create({
        name, username, password, role, email, mobile, address, company,
        createdByUser: req.user._id,
    });
    if (user) {
        await upsertMobileUserData(user);
        res.status(201).json({
            _id: user._id, name: user.name, username: user.username,
            role: user.role, email: user.email, mobile: user.mobile,
            address: user.address, company: user.company,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    let filter = {};
    if (req.user && req.user.role === 'branch') {
        filter = { $or: [{ _id: req.user._id }, { createdByUser: req.user._id }] };
    }
    const users = await User.find(filter).populate('createdByUser', 'name username');
    res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/auth/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    console.log(`\n[DEBUG] API HIT: DELETE ${req.originalUrl}`);
    console.log(`[DEBUG] USER ATTEMPTING DELETE: ${req.user?._id}`);
    console.log(`[DEBUG] TARGET USER ID: ${req.params.id}`);
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update user
// @route   PUT /api/auth/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.name = req.body.name || user.name;
        user.username = req.body.username || user.username;
        user.role = req.body.role || user.role;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.password) user.password = req.body.password;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id, name: updatedUser.name,
            username: updatedUser.username, role: updatedUser.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get customers (branch sees own, admin sees all)
// @route   GET /api/auth/customers
// @access  Private/AdminOrUser
const getCustomers = async (req, res) => {
    try {
        const filter = { role: 'customer' };
        // Branch users only see their own customers
        if (req.user.role === 'branch') {
            filter.createdByUser = req.user._id;
        }
        const customers = await User.find(filter).populate('createdByUser', '_id name role');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send OTP to admin email
// @route   POST /api/auth/send-otp
// @access  Private
const sendOTP = async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        if (!user) {
            user = await MobileUser.findById(req.user._id);
        }
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.email) {
            return res.status(400).json({ message: 'No email found on your account.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        let emailSent = false;
        try {
            await transporter.sendMail({
                from: `"Online Go Logistics" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'OTP for Profile Update',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                        <h2 style="color: #0f172a;">Profile Update OTP</h2>
                        <p style="color: #6b7280;">You requested to update your profile on <strong>Online Go Logistics</strong>.</p>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otp}</span>
                        </div>
                        <p style="color: #6b7280;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
                    </div>
                `,
            });
            emailSent = true;
        } catch (error) {
            console.error('Nodemailer failed to send profile OTP:', error.message);
        }

        console.log(`Profile Update OTP for ${user.email}: ${otp}`);
        res.json({ 
            message: emailSent ? `OTP sent to ${user.email}` : 'Failed to send OTP email, but OTP is generated', 
            emailSent,
            devOtp: emailSent ? undefined : otp 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get own profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user._id).select('-password -otp -otpExpiry');
        if (!user) {
            user = await MobileUser.findById(req.user._id).select('-password -otp -otpExpiry');
        }
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(await mergedProfileResponse(user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update own profile after OTP verification
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    console.log(`\n[DEBUG] API HIT: ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG] USER ID: ${req.user._id}`);
    console.log(`[DEBUG] BODY:`, req.body);
    try {
        let isMobileUser = false;
        let user = await User.findById(req.user._id);
        if (!user) {
            user = await MobileUser.findById(req.user._id);
            isMobileUser = true;
        }
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        console.log(`[DEBUG] Mongo document BEFORE update:`, JSON.stringify(user, null, 2));

        const needsOtp = Boolean(req.body.newPassword);

        if (needsOtp) {
            if (!req.body.otp) return res.status(400).json({ message: 'OTP is required' });
            if (user.otp !== req.body.otp) return res.status(401).json({ message: 'Invalid OTP' });
            if (!user.otpExpiry || user.otpExpiry < new Date()) {
                return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
            }
        }

        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.username !== undefined) {
            const username = req.body.username.trim().toLowerCase();
            if (!username) return res.status(400).json({ message: 'Username is required' });
            const existingUsername = await User.findOne({ username, _id: { $ne: user._id } });
            if (existingUsername) return res.status(400).json({ message: 'Username already exists' });
            user.username = username;
        }
        if (req.body.email !== undefined) {
            const email = req.body.email.trim().toLowerCase();
            if (email) {
                const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
                if (existingEmail) return res.status(400).json({ message: 'Email already exists' });
            }
            user.email = email;
        }
        if (req.body.mobile !== undefined) user.mobile = req.body.mobile;
        if (req.body.address !== undefined) user.address = req.body.address;
        if (req.body.company !== undefined) user.company = req.body.company;
        if (req.body.profilePhoto !== undefined) user.profilePhoto = req.body.profilePhoto;

        if (req.body.newPassword) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Current password required' });
            }
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
            user.password = req.body.newPassword;
        }

        if (needsOtp) {
            user.otp = undefined;
            user.otpExpiry = undefined;
        }

        if (isMobileUser) {
            if (req.body.name !== undefined) user.customerName = req.body.name;
            if (req.body.mobile !== undefined) user.mobileNumber = req.body.mobile;
            if (req.body.address !== undefined) {
                user.pickupAddress = req.body.address;
                user.currentLocation = req.body.address;
            }
        }

        const updated = await user.save();
        console.log(`[DEBUG] Mongo document AFTER update:`, JSON.stringify(updated, null, 2));

        if (!isMobileUser) {
            await upsertMobileUserData(updated);
        }

        // --- Sync Profile Updates to Shipments ---
        if (req.body.name !== undefined || req.body.mobile !== undefined) {
            const updateFieldsPR = {};
            const updateFieldsLuggage = {};
            
            if (req.body.name !== undefined) {
                updateFieldsPR.customerName = req.body.name;
                updateFieldsLuggage.senderName = req.body.name;
            }
            if (req.body.mobile !== undefined) {
                updateFieldsPR.mobileNumber = req.body.mobile;
                updateFieldsLuggage.senderMobile = req.body.mobile;
            }

            try {
                // Update all ParcelRequests for this customer
                await ParcelRequest.updateMany(
                    { customer: updated._id },
                    { $set: updateFieldsPR }
                );
                
                // Update all Luggage shipments for this customer
                await Luggage.updateMany(
                    { customer: updated._id },
                    { $set: updateFieldsLuggage }
                );
            } catch (syncErr) {
                console.error("Error syncing profile to shipments:", syncErr);
            }
        }
        // -----------------------------------------

        res.json({ message: 'Profile updated successfully!', user: await mergedProfileResponse(updated) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all pickup addresses of the authenticated user
// @route   GET /api/auth/pickup-addresses
// @access  Private
const getPickupAddresses = async (req, res) => {
    try {
        const addresses = await PickupAddress.find({ user: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Add a new pickup address (archives old active address)
// @route   POST /api/auth/pickup-addresses
// @access  Private
const addPickupAddress = async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ message: 'Address is required' });
        }

        // Set all existing pickup addresses of the user to non-primary
        await PickupAddress.updateMany({ user: req.user._id }, { isPrimary: false });

        // Update the user's primary address field in the User document (acting as active location)
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { address }, { new: true });
        if (updatedUser) await upsertMobileUserData(updatedUser);

        // Add the new address to the PickupAddress collection as primary
        const newAddress = await PickupAddress.create({
            user: req.user._id,
            address,
            isPrimary: true,
        });

        res.status(201).json(newAddress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify Firebase ID token and login/register mobile user
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Firebase ID Token is required' });
        }

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            return res.status(500).json({ message: 'Firebase Admin credentials are not configured on the server' });
        }

        // Verify Firebase ID Token
        let decodedToken;
        try {
            decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        } catch (verifyError) {
            console.error('Firebase ID token verification failed:', verifyError.message);
            return res.status(401).json({ message: 'Invalid or expired Firebase ID token' });
        }

        const uid = decodedToken.uid;
        const phone = decodedToken.phone_number;

        if (!phone) {
            return res.status(400).json({ message: 'Firebase token verified but does not contain a phone number' });
        }

        // Search for user in database by matching verified phone number
        // Extract 10-digit number from phone if needed, since in MobileUser, mobile might be stored without +91 or with it.
        let mobileDigits = phone.replace(/^\+91/, '').trim(); // Remove +91 code if present
        
        let user = await MobileUser.findOne({
            $or: [
                { mobile: phone },
                { mobile: mobileDigits },
                { mobileNumber: phone },
                { mobileNumber: mobileDigits }
            ]
        });

        if (!user) {
            // New user, create user record in MongoDB
            user = await MobileUser.create({
                name: `User ${mobileDigits}`,
                username: `user_${mobileDigits}`,
                email: `phone_${mobileDigits}@onlinegologistics.com`,
                mobile: mobileDigits,
                role: 'mobile',
                isActive: true,
                customerName: `User ${mobileDigits}`,
                mobileNumber: mobileDigits,
                currentStatus: 'Pending',
                firebaseUid: uid,
            });

            // Create a PickupAddress record
            await PickupAddress.create({
                user: user._id,
                address: 'Please set your address',
                isPrimary: true,
            });
        } else {
            // Update firebaseUid if not set
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
            }
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            isNewUser: user.currentStatus === 'Pending' || user.name.startsWith('User '),
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error('Firebase Login Controller Error:', err.message);
        res.status(500).json({ message: 'Internal server error during Firebase authentication' });
    }
};

module.exports = {
    loginUser,
    requestRegistrationOtp,
    verifyRegistrationOtp,
    requestLoginOtp,
    verifyLoginOtp,
    registerUser,
    getUsers,
    deleteUser,
    updateUser,
    getCustomers,
    sendOTP,
    getProfile,
    updateProfile,
    getPickupAddresses,
    addPickupAddress,
    firebaseLogin,
};
