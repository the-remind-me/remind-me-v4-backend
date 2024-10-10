const express = require('express');
const router = express.Router();
const Holiday = require('../models/holiday.js');

// Add or update a holiday
router.post('/add', async (req, res) => {
    const { name, date } = req.body;
    if (!name || !date) {
        return res.status(400).json({ message: 'Name and date are required' });
    }

    try {
        const existingHoliday = await Holiday.findOneAndUpdate(
            { name, date },
            { name, date }, // Updated to save both fields
            { new: true, upsert: true }
        );
        res.json({ message: existingHoliday ? 'Holiday updated successfully' : 'Holiday added successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all holidays
router.get('/all', async (req, res) => {
    try {
        const holidays = await Holiday.find({});
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a holiday by ID
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Deleting holiday with ID:', id); // Log the received ID
    try {
        const result = await Holiday.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        res.json({ message: 'Holiday deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
