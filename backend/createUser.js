const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAllRoles = async () => {
    try {
        const uri = process.env.MONGO_URI;
        const dbName = process.env.DB_NAME || "luggage_billing";
        await mongoose.connect(uri, { dbName });
        console.log(`Connected to MongoDB (db: ${dbName})`);

        const rolesToCreate = [
            { name: 'Test Admin', email: 'admin_test@gmail.com', role: 'admin', password: 'admin123' },
            { name: 'Test Branch', email: 'branch_test@gmail.com', role: 'branch', password: 'branch123' },
            { name: 'Test Agent', email: 'agent_test@gmail.com', role: 'agent', password: 'agent123' },
            { name: 'Test Customer', email: 'customer_test@gmail.com', role: 'customer', password: 'customer123' },
            { name: 'Test User', email: 'user_test@gmail.com', role: 'user', password: 'user123' }
        ];

        for (const data of rolesToCreate) {
            const userData = {
                name: data.name,
                username: data.email,
                email: data.email,
                password: data.password,
                role: data.role,
                isActive: true
            };

            const existingUser = await User.findOne({ username: userData.username });
            if (existingUser) {
                // Update password if exists to ensure we know it
                existingUser.name = userData.name;
                existingUser.email = userData.email;
                existingUser.role = userData.role;
                existingUser.password = userData.password;
                existingUser.isActive = true;
                await existingUser.save();
                console.log(`🔄 Updated existing user: ${userData.username} (${userData.role})`);
            } else {
                const newUser = new User(userData);
                await newUser.save();
                console.log(`✅ Created new user: ${userData.username} (${userData.role})`);
            }
        }

        console.log('\n🚀 All role-based users are ready!');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAllRoles();
