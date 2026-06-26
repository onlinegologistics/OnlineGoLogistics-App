const Customer = require('../models/Customer'); // ya apna customer model

// Add customer
exports.addCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({ message: 'Customer already exists' });
        }

        const customer = new Customer({
            name,
            email,
            phone,
            address,
            createdBy: req.user._id
        });

        await customer.save();
        res.status(201).json({ message: 'Customer added successfully', data: customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all customers
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().populate('createdBy', 'name email');
        res.json({ data: customers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ data: customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update customer
exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer updated successfully', data: customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};