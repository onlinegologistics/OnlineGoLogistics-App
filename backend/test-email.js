require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Testing email configuration...");
console.log("User:", process.env.EMAIL_USER);
console.log("Pass length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function testEmail() {
    try {
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // send to itself
            subject: 'Test Email',
            text: 'This is a test email to verify credentials.',
        });
        console.log("Email sent successfully! Message ID:", info.messageId);
    } catch (error) {
        console.error("Failed to send email. Error details:");
        console.error(error);
    }
}

testEmail();
