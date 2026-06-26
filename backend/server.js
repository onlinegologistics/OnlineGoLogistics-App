const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send('Luggage Billing API is running');
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Customer routes - ADD THIS
app.use('/api/customers', require('./routes/customer'));

// Agent routes
app.use('/api/agents', require('./routes/agentRoutes'));

// Luggage routes
app.use('/api/luggage', require('./routes/luggageRoutes'));

// Parcel request routes
app.use('/api/parcel-requests', require('./routes/parcelRequestRoutes'));

// Complaint routes
app.use('/api/complaints', require('./routes/complaintRoutes'));

// Enquiry routes
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/mobile-user-enquiries', require('./routes/mobileUserEnquiryRoutes'));
app.use('/api/mobile-user-complaints', require('./routes/mobileUserComplaintRoutes'));

// Notification routes
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Credit office routes
app.use('/api/credit-offices', require('./routes/creditOfficeRoutes'));

// Pricing routes
app.use('/api/pricing', require('./routes/pricingRoutes'));

// Agent Parcel Request routes
app.use('/api/agent-parcels', require('./routes/agentParcelRoutes'));

// User management routes - ADD THIS
app.use('/api/users', require('./routes/userRoutes'));

// Shipment tracking routes
app.use('/api/shipments', require('./routes/shipmentRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode);
    res.json({
        message: err.message || 'Something went wrong',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});