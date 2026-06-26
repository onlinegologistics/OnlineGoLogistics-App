const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');

// Default categories when creating for the first time
const DEFAULT_CATEGORIES = [
    { name: 'Box', price: 180 },
    { name: 'Goni', price: 0 },
    { name: 'Parcel', price: 0 },
    { name: 'Other', price: 0 }
];

// @desc    Get Global Pricing (with categories)
// @route   GET /api/pricing
// @access  Public
router.get('/', async (req, res) => {
    try {
        let pricing = await Pricing.findOne({ type: 'GLOBAL' });
        if (!pricing) {
            pricing = await Pricing.create({
                type: 'GLOBAL',
                categories: DEFAULT_CATEGORIES
            });
        } else if (!pricing.categories || pricing.categories.length === 0) {
            // Migrate from old fixed fields to categories array
            pricing.categories = [
                { name: 'Box', price: pricing.boxPrice || 180 },
                { name: 'Goni', price: pricing.goniPrice || 0 },
                { name: 'Parcel', price: pricing.parcelPrice || 0 },
                { name: 'Other', price: pricing.otherPrice || 0 }
            ];
            await pricing.save();
        }
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a new category
// @route   POST /api/pricing/category
// @access  Private/Admin
router.post('/category', async (req, res) => {
    const { name, price } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Category name is required' });
    }
    try {
        let pricing = await Pricing.findOne({ type: 'GLOBAL' });
        if (!pricing) {
            pricing = await Pricing.create({ type: 'GLOBAL', categories: DEFAULT_CATEGORIES });
        }
        // Check duplicate name
        const exists = pricing.categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
        if (exists) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        pricing.categories.push({ name: name.trim(), price: parseFloat(price) || 0 });
        const updated = await pricing.save();
        res.status(201).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a category by subdoc _id
// @route   PUT /api/pricing/category/:id
// @access  Private/Admin
router.put('/category/:id', async (req, res) => {
    const { name, price } = req.body;
    try {
        const pricing = await Pricing.findOne({ type: 'GLOBAL' });
        if (!pricing) return res.status(404).json({ message: 'Pricing not found' });

        const cat = pricing.categories.id(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Category not found' });

        if (name !== undefined) cat.name = name.trim();
        if (price !== undefined) cat.price = parseFloat(price) || 0;

        const updated = await pricing.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a category by subdoc _id
// @route   DELETE /api/pricing/category/:id
// @access  Private/Admin
router.delete('/category/:id', async (req, res) => {
    try {
        const pricing = await Pricing.findOne({ type: 'GLOBAL' });
        if (!pricing) return res.status(404).json({ message: 'Pricing not found' });

        const cat = pricing.categories.id(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Category not found' });

        cat.deleteOne();
        const updated = await pricing.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
