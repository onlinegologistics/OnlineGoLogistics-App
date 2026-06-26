require('dotenv').config();
require('./config/db')().then(async () => {
    const U = require('./models/User');
    await U.updateOne({ username: 'admin' }, { 
        email: 'aibus.in009@gmail.com',
    });
    console.log('Email reset!');
    process.exit();
});
