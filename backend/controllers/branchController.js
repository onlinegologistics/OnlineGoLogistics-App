const Branch = require('../models/Branch');

const dummyBranches = [
    { name: "Sangamwadi Branch", city: "Pune", address: "Online Go Parking 3, Sangamwadi Rd, Sangamvadi, Pune, Maharashtra 411003" },
    { name: "Talawade Branch", city: "Pune", address: "Business Park Jyotiba Nagar, Talwade, Pune, Pimpri-Chinchwad, Maharashtra 411062" }
];

const seedBranchesIfNeeded = async () => {
    try {
        const count = await Branch.countDocuments();
        // If there are other branches, force overwrite to keep only the two requested
        const otherBranchExists = await Branch.findOne({ name: { $nin: ["Sangamwadi Branch", "Talawade Branch"] } });
        if (count === 0 || otherBranchExists) {
            await Branch.deleteMany({});
            await Branch.insertMany(dummyBranches);
            console.log("[Seeding] Synchronized branch data successfully (Sangamwadi & Talawade only).");
        }
    } catch (error) {
        console.error("Failed to seed dummy branch data:", error.message);
    }
};

const getBranches = async (req, res) => {
    try {
        await seedBranchesIfNeeded();
        const { city } = req.query;
        let query = {};
        if (city) {
            query.city = { $regex: new RegExp(`^${city}$`, 'i') };
        }
        const branches = await Branch.find(query);
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch branches" });
    }
};

const getCities = async (req, res) => {
    try {
        await seedBranchesIfNeeded();
        const cities = await Branch.distinct('city');
        // Sort alphabetically
        cities.sort();
        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch cities" });
    }
};

module.exports = {
    getBranches,
    getCities,
    seedBranchesIfNeeded
};
