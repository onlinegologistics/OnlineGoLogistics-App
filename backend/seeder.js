const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        // Delete old users
        await User.deleteMany({ username: { $in: ['admin', 'panel_admin', 'user'] } });
        console.log('Old users deleted');

        // Create ADMIN (top level - all power)
        const adminUser = {
            name: 'Admin',
            email: 'admin@local.com',
            username: 'admin',
            password: 'password123',
            role: 'admin',
            isActive: true,
        };
        await User.create(adminUser);
        console.log('✅ Admin Created: admin@local.com / password123');

        // Create BRANCH PANEL (limited access)
        const branchUser = {
            name: 'Branch Panel',
            email: 'branch@local.com',
            username: 'panel_admin',
            password: 'password123',
            role: 'branch',
            isActive: true,
        };
        await User.create(branchUser);
        console.log('✅ Branch Panel Created: branch@local.com / password123');

        // Create regular USER
        const regularUser = {
            name: 'Staff User',
            username: 'user',
            password: 'password123',
            role: 'user',
            isActive: true,
        };
        await User.create(regularUser);
        console.log('✅ Regular User Created: user / password123');

        console.log('\n🎉 All users created successfully!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
};

importData();