const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const MobileUser = require('./models/MobileUser');

mongoose.connect(process.env.MONGO_URI, { dbName: "luggage_billing" })
  .then(async () => {
    const users = await User.find({}).select('username role email');
    console.log('USERS:', users);
    const mobileUsers = await MobileUser.find({}).select('username role email');
    console.log('MOBILE USERS:', mobileUsers);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
