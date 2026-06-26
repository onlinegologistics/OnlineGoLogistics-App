const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function check() {
    const dbName = process.env.DB_NAME || 'luggage_billing';
    await mongoose.connect(process.env.MONGO_URI, { dbName });

    // Find all users with this email
    const byEmail = await User.find({ email: 'surajkurrey601@gmail.com' }).select('name username email role _id');
    console.log('Users with email surajkurrey601@gmail.com:');
    byEmail.forEach(u => console.log('  ' + u.name + ' (' + u.username + ') - role: ' + u.role));

    // Find nashik branch
    const nashik = await User.findOne({ username: 'nashik_branch' });
    if (nashik) {
        console.log('\nNashik branch found:');
        console.log('  Name:', nashik.name);
        console.log('  Username:', nashik.username);
        console.log('  Email:', nashik.email);
        console.log('  Role:', nashik.role);
        const match = await nashik.matchPassword('1234567890');
        console.log('  Password "1234567890" matches:', match);
    } else {
        console.log('\nNo user with username nashik_branch found');
    }

    // Show all branch users
    const branches = await User.find({ role: 'branch' }).select('name username email role');
    console.log('\nAll branch users:');
    branches.forEach(b => console.log('  ' + b.name + ' (' + b.username + ') email: ' + (b.email || 'NONE')));

    process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
