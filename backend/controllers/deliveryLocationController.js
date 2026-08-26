const DeliveryLocation = require('../models/DeliveryLocation');

const initialLocations = [
    { city: "Ahmadnagar", address: "Syndicate Travels, 8087879117" },
    { city: "Nasik", address: "Shreenath Cargo, 8767144753" },
    { city: "Waluj", address: "Himalaya travels, 99219 41234" },
    { city: "Yavatmal", address: "Kanchan Tr. Chintamani Hotel, 9405687231" },
    { city: "Sambhaji Nagar", address: "Westline Travels, 8857986983" },
    { city: "Chandrapur", address: "Mahakali Tr Bus Stand, 9422453211" },
    { city: "Jalna", address: "Vikas Cargo, 9860572369" },
    { city: "Nagpur", address: "Global Travels, 9975301551" },
    { city: "Indore", address: "Sanjay Travels, 9827545199" },
    { city: "Lonar", address: "Vighnaharta Travels, 9067869495" },
    { city: "Mehkar", address: "Chintamani Travels, 9923112933" },
    { city: "Shegaon", address: "Avinash Travels, 9422255577" },
    { city: "Washim", address: "Khushi Travels, 9146261298" },
    { city: "Karanjalad", address: "Vaishnavi Travels, 9226995151" },
    { city: "Akola", address: "Ekviara Travels, 7709946996" },
    { city: "Shirdi", address: "Om Sai Ram Travels, 9373347671" },
    { city: "Amravati", address: "Vidharbha Travels, 9860155510" },
    { city: "Dhule", address: "Atharva Travels, 8055524055" },
    { city: "Hydrabad", address: "Bharat Travels, 7875660954" },
    { city: "Khamgaon", address: "Mahendra Disha Trvls, 98223 48034" },
    { city: "Chikhli", address: "Ashok Tr. Neri Naka Parking, 9704895060" },
    { city: "Jalgaon", address: "Ashok Tr. Neri Naka Parking, 9704895060" },
    { city: "Risod", address: "Online Go, 9209061234" },
    { city: "Bhandara", address: "Online Go, 9209061234" },
    { city: "Jalgaon", address: "Online Go, 9209061234" },
    { city: "Indore", address: "Online Go, 9209061234" },
    { city: "Raipur", address: "Online Go, 9209061234" },
    { city: "Surat", address: "Online Go, 9209061234" },
    { city: "Shegaon", address: "Online Go, 9209061234" },
    { city: "Sillod", address: "Online Go, 9209061234" },
    { city: "Panjim", address: "Online Go, 9209061234" },
    { city: "Madgaon", address: "Online Go, 9209061234" },
    { city: "Manora", address: "Online Go, 9209061234" },
    { city: "Bhilai", address: "Online Go, 9209061234" },
    { city: "Bhopal", address: "Online Go, 9209061234" },
    { city: "Ujjain", address: "Online Go, 9209061234" },
    { city: "Hyderabad", address: "Online Go, 9209061234" },
    { city: "Khamgaon", address: "Online Go, 9209061234" },
    { city: "Arni", address: "Online Go, 9209061234" },
    { city: "Pritampur", address: "Online Go, 9209061234" },
    { city: "Mapusa (Goa)", address: "Online Go, 9209061234" },
    { city: "Burhanpur", address: "Online Go, 9209061234" },
    { city: "Dharni", address: "Online Go, 9209061234" }
];

const seedDeliveryLocationsIfNeeded = async () => {
    try {
        const count = await DeliveryLocation.countDocuments();
        if (count === 0) {
            await DeliveryLocation.insertMany(initialLocations);
            console.log("[Seeding] Inserted delivery location data successfully.");
        }
    } catch (error) {
        console.error("Failed to seed delivery location data:", error.message);
    }
};

const getDeliveryLocations = async (req, res) => {
    try {
        await seedDeliveryLocationsIfNeeded();
        const locations = await DeliveryLocation.find({}).sort({ city: 1 });
        res.status(200).json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch delivery locations" });
    }
};

module.exports = {
    getDeliveryLocations,
    seedDeliveryLocationsIfNeeded
};
