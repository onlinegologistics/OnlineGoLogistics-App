require('dotenv').config();
require('./config/db')().then(async () => {
    const U = require('./models/User');
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('password123', salt);
    await U.updateOne({ username: 'admin' }, { password: hashed });
    console.log('Password reset!');
    process.exit();
});
