const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Add timeouts so it doesn't hang indefinitely (fixes 504 Gateway Timeout)
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
});

module.exports = transporter;