require('dotenv').config();
require('./config/db')().then(async () => {
    const U = require('./models/User');
    const user = await U.findOne({ username: 'admin' });
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    process.exit();
});
