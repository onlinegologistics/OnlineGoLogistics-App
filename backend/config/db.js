const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb+srv://aibusin009_db_user:zIu0Qm1zNFLNMLHJ@cluster0.ggtm45i.mongodb.net/?appName=Cluster0";
        const dbName = process.env.DB_NAME || "luggage_billing";

        await mongoose.connect(uri, {
            dbName, // forces DB name even if URI doesn't include it
        });

        console.log("[Mongo DB Connected]", mongoose.connection.name);
        console.log("[Mongo Host]", mongoose.connection.host);
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
    }
};

module.exports = connectDB;
