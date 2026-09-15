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
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123', {
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
    alternateMobile: user.alternateMobile || "",
    whatsappMobile: user.whatsappMobile || "",
    address: user.address,
    company: user.company,
    role: user.role,
    isActive: user.isActive,
    profilePhoto: user.profilePhoto,
    pickupAddress: user.pickupAddress,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const buildMobileUserDataDoc = (user) => ({
    userId: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    alternateMobile: user.alternateMobile,
    whatsappMobile: user.whatsappMobile,
    address: user.address,
    company: user.company,
    role: user.role,
    isActive: user.isActive,
    pickupAddress: user.pickupAddress || user.address,
    customerName: user.name,
    mobileNumber: user.mobile,
    currentLocation: user.pickupAddress || user.address,
    currentStatus: 'Pending',
    updatedAt: new Date(),
});



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
        alternateMobile: mobileData?.alternateMobile || user.alternateMobile || "",
        whatsappMobile: mobileData?.whatsappMobile || user.whatsappMobile || "",
        address: mobileData?.address || user.address,
        pickupAddress: mobileData?.pickupAddress || user.pickupAddress || mobileData?.address || user.address,
        company: mobileData?.company || user.company,
        profilePhoto: mobileData?.profilePhoto || user.profilePhoto,
    };
};

const https = require('https');

const sendOtpDreamzTechnology = async ({ mobile, otp }) => {
    console.log(`[DreamzSMS] Attempting to send OTP to ${mobile}: ${otp}`);
    
    const apiUrl = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;
    const senderId = process.env.SMS_SENDER_ID;
    const templateId = process.env.SMS_TEMPLATE_ID;

    if (!apiUrl || !username || !password) {
        console.log(`[DreamzSMS] SMS credentials missing in .env. Skipping real SMS transmission.`);
        return false;
    }

    let formattedMobile = mobile.trim();
    if (formattedMobile.startsWith('+91')) {
        formattedMobile = formattedMobile.substring(3);
    } else if (formattedMobile.startsWith('91') && formattedMobile.length === 12) {
        formattedMobile = formattedMobile.substring(2);
    }

    return new Promise((resolve) => {
        // As per the provided template, the message will be "Your OTP is <otp>". Adjust if the actual template requires a different format.
        const msg = `Your OTP is ${otp}`;
        // Usually, DreamzTechnology accepts parameters like user/pass or username/password.
        // Assuming: mobile, pass, senderid, to, msg based on the test
        const url = `${apiUrl}?mobile=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}&senderid=${encodeURIComponent(senderId)}&to=${encodeURIComponent(formattedMobile)}&msg=${encodeURIComponent(msg)}&templateid=${encodeURIComponent(templateId)}`;
        
        const http = require('http');
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`[DreamzSMS] API Response:`, data);
                if (data && data.toLowerCase().includes('sent')) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error(`[DreamzSMS] Connection error:`, err.message);
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
        
        const smsSent = mobile ? await sendOtpDreamzTechnology({ mobile, otp }) : false;

        console.log(`Registration OTP for ${mobile}: ${otp}`);
        res.json(buildOtpResponse('OTP sent for registration', otp, { emailSent, smsSent }));
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


        await record.deleteOne();
        console.log(`[DEBUG] SUCCESS: MobileUser officially created and saved to mobileusers collection. User ID: ${user._id}`);
        console.log("[VERIFY OTP] Creating MobileUser in mobileusers:", user._id);
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

        let emailSent = false;
        let smsSent = false;

        // Clean identifier to check if it's a mobile number
        const cleanedIdentifier = String(loginIdentifier).replace(/[\s\-]/g, '');
        const isMobile = /^\+?\d{7,15}$/.test(cleanedIdentifier);
        const targetMobile = user.mobile || (isMobile ? cleanedIdentifier : null);

        console.log(`[OTP Request] identifier: ${loginIdentifier}, isMobile: ${isMobile}, targetMobile: ${targetMobile}`);

        if (isMobile && targetMobile) {
            smsSent = await sendOtpDreamzTechnology({ mobile: targetMobile, otp });
            console.log(`[OTP Request] Sent SMS to ${targetMobile}. Result: ${smsSent}`);
            
            // Optional: fallback to email ONLY if SMS failed and user has email
            if (!smsSent && user.email) {
                console.log(`[OTP Request] SMS failed, falling back to email ${user.email}`);
                emailSent = await sendOtpEmail({
                    email: user.email,
                    otp,
                    subject: 'OTP for Online Go Logistics Login',
                });
            }
        } else if (user.email) {
            emailSent = await sendOtpEmail({
                email: user.email,
                otp,
                subject: 'OTP for Online Go Logistics Login',
            });
            console.log(`[OTP Request] Sent Email to ${user.email}. Result: ${emailSent}`);
        }

        console.log(`Login OTP for ${loginIdentifier}: ${otp}`);
        res.json(buildOtpResponse('OTP sent for login', otp, { emailSent, smsSent }));
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

// @desc    Delete own user account (only removes user from mobileusers or users collection without touching other collections)
// @route   DELETE /api/auth/profile or DELETE /api/auth/delete-account
// @access  Private
const deleteOwnAccount = async (req, res) => {
    console.log(`\n[DEBUG] API HIT: DELETE OWN ACCOUNT ${req.originalUrl}`);
    console.log(`[DEBUG] USER ATTEMPTING DELETE OWN ACCOUNT: ${req.user?._id}`);
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized, user ID not found' });
        }

        let deleted = false;
        let collectionName = '';

        // Check and delete from MobileUser collection first (mobile app user)
        const mobileUser = await MobileUser.findById(userId);
        if (mobileUser) {
            await MobileUser.findByIdAndDelete(userId);
            deleted = true;
            collectionName = 'mobileusers';
        } else {
            // Check and delete from User collection
            const user = await User.findById(userId);
            if (user) {
                await User.findByIdAndDelete(userId);
                deleted = true;
                collectionName = 'users';
            }
        }

        if (!deleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[DEBUG] User ${userId} successfully removed from ${collectionName} collection ONLY. No other collection affected.`);
        res.json({ message: 'Account deleted successfully', success: true });
    } catch (err) {
        console.error('[ERROR] Error deleting own account:', err.message);
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

        const smsSent = user.mobile ? await sendOtpDreamzTechnology({ mobile: user.mobile, otp }) : false;

        console.log(`Profile Update OTP for ${user.email}: ${otp}`);
        res.json({ 
            message: emailSent || smsSent ? `OTP sent to ${user.email || user.mobile}` : 'Failed to send OTP email or SMS, but OTP is generated', 
            emailSent,
            smsSent,
            devOtp: (emailSent || smsSent) ? undefined : otp 
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
        if (req.body.alternateMobile !== undefined) user.alternateMobile = req.body.alternateMobile;
        if (req.body.whatsappMobile !== undefined) user.whatsappMobile = req.body.whatsappMobile;
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
        // Removed upsertMobileUserData

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
                password: `firebase_${Math.random().toString(36).slice(-8)}`,
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

const registerMobileUser = async (req, res) => {
  try {
    const { name, email, mobileNumber, password, address, firebaseUid, company } = req.body;
    console.log("[REGISTER MOBILE] API body:", req.body);

    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanMobile = mobileNumber ? mobileNumber.trim() : undefined;
    const cleanAddress = address ? address.trim() : undefined;

    const existingUser = await MobileUser.findOne({
      $or: [
        { email: normalizedEmail },
        { mobileNumber: cleanMobile }
      ].filter(cond => Object.values(cond)[0] !== undefined)
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await MobileUser.create({
      name,
      username: normalizedEmail || `user_${cleanMobile}`,
      email: normalizedEmail,
      mobile: cleanMobile,
      mobileNumber: cleanMobile,
      address: cleanAddress,
      pickupAddress: cleanAddress,
      company: company ? company.trim() : undefined,
      password,
      firebaseUid,
      role: "mobile",
      customerName: name,
      currentLocation: cleanAddress,
      currentStatus: 'Pending'
    });

    if (cleanAddress) {
      const PickupAddress = require('../models/PickupAddress');
      await PickupAddress.create({
          user: user._id,
          address: cleanAddress,
          isPrimary: true,
      });
    }

    console.log("[REGISTER MOBILE] Saved in collection: mobileusers");
    console.log("[REGISTER MOBILE] User ID:", user._id);
    console.log("[REGISTER MOBILE] Saved in mobileusers:", user._id);

    res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Search in User collection
        let user = await User.findOne({ email: normalizedEmail });
        let userModel = 'User';

        // 2. Search in MobileUser collection if not found in User
        if (!user) {
            user = await MobileUser.findOne({ email: normalizedEmail });
            userModel = 'MobileUser';
        }

        if (!user) {
            return res.status(404).json({ message: 'No registered account found with this email' });
        }

        // 3. Generate password reset token (15 mins expiry)
        const token = jwt.sign({ id: user._id, model: userModel }, process.env.JWT_SECRET, {
            expiresIn: '15m'
        });

        // 4. Construct reset URL
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const resetLink = `${protocol}://${req.get('host')}/api/auth/reset-password?token=${token}`;

        // 5. Send email (in the background, no await so it doesn't block response)
        transporter.sendMail({
            from: `"Online Go Logistics" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Reset Password - Online Go Logistics',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #0f172a; text-align: center; margin-top: 0;">Reset Your Password</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.5;">You requested to reset the password for your Online Go Logistics account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetLink}" style="background-image: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 30px; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">Reset Password</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 0;">If you did not request a password reset, please ignore this email. This link will expire in <strong>15 minutes</strong>.</p>
                </div>
            `,
        }).catch(err => console.error('[BACKGROUND EMAIL ERROR]', err.message));

        res.status(200).json({ message: 'Password reset link has been sent to your registered email' });
    } catch (error) {
        console.error('[FORGOT PASSWORD ERROR]', error);
        res.status(500).json({ message: error.message || 'Something went wrong' });
    }
};

const renderResetPassword = async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('<h1>Invalid Reset Link</h1><p>Reset token is missing.</p>');
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Reset Password - Online Go Logistics</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background-color: #0b1329;
                        color: #ffffff;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .card {
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 40px;
                        width: 100%;
                        max-width: 400px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                        box-sizing: border-box;
                    }
                    h2 {
                        margin-top: 0;
                        margin-bottom: 24px;
                        color: #ffffff;
                        text-align: center;
                        font-weight: 600;
                    }
                    p {
                        color: #94a3b8;
                        font-size: 14px;
                        line-height: 1.5;
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .form-group {
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-size: 13px;
                        font-weight: 500;
                        color: #94a3b8;
                    }
                    input {
                        width: 100%;
                        padding: 12px 16px;
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: rgba(255, 255, 255, 0.08);
                        color: #ffffff;
                        font-size: 15px;
                        box-sizing: border-box;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    input:focus {
                        border-color: #3b82f6;
                    }
                    button {
                        width: 100%;
                        padding: 14px;
                        border: none;
                        border-radius: 8px;
                        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-top: 10px;
                        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
                        transition: opacity 0.2s;
                    }
                    button:hover {
                        opacity: 0.9;
                    }
                    .error {
                        color: #ef4444;
                        font-size: 13px;
                        margin-top: 5px;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Reset Password</h2>
                    <p>Please enter your new password below.</p>
                    <form id="resetForm" action="/api/auth/reset-password?token=${token}" method="POST" onsubmit="return validateForm()">
                        <div class="form-group">
                            <label for="password">New Password</label>
                            <input type="password" id="password" name="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" required minlength="6">
                            <div id="errorMsg" class="error">Passwords do not match</div>
                        </div>
                        <button type="submit">Update Password</button>
                    </form>
                </div>
                <script>
                    function validateForm() {
                        const pass = document.getElementById('password').value;
                        const confirmPass = document.getElementById('confirmPassword').value;
                        const error = document.getElementById('errorMsg');
                        if (pass !== confirmPass) {
                            error.style.display = 'block';
                            return false;
                        }
                        error.style.display = 'none';
                        return true;
                    }
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        return res.status(400).send('<h1>Link Expired or Invalid</h1><p>The password reset link is invalid or has expired.</p>');
    }
};

const handleResetPassword = async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || !password) {
        return res.status(400).send('<h1>Bad Request</h1><p>Missing token or password.</p>');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, model } = decoded;

        let user;
        if (model === 'User') {
            user = await User.findById(id);
        } else if (model === 'MobileUser') {
            user = await MobileUser.findById(id);
        }

        if (!user) {
            return res.status(404).send('<h1>User Not Found</h1><p>No user found for this token.</p>');
        }

        user.password = password;
        await user.save();

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Password Reset Successful</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background-color: #0b1329;
                        color: #ffffff;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .card {
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 40px;
                        width: 100%;
                        max-width: 400px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                        box-sizing: border-box;
                        text-align: center;
                    }
                    h2 {
                        color: #22c55e;
                        margin-top: 0;
                        margin-bottom: 16px;
                    }
                    p {
                        color: #94a3b8;
                        font-size: 15px;
                        line-height: 1.5;
                        margin-bottom: 24px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Success!</h2>
                    <p>Your password has been reset successfully.<br><br>Please go back to the app and login with your new password.</p>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        return res.status(400).send('<h1>Link Expired or Invalid</h1><p>The password reset link is invalid or has expired.</p>');
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
    deleteOwnAccount,
    getPickupAddresses,
    addPickupAddress,
    firebaseLogin,
    registerMobileUser,
    forgotPassword,
    renderResetPassword,
    handleResetPassword,
};
