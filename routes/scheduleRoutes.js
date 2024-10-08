// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule.js');

// Add or update a schedule
router.post('/add', async (req, res) => {
    const { ID, semester, program, section, university, schedule } = req.body;
    console.log(schedule);
    try {
        let existingSchedule = await Schedule.findOne({ ID });
        if (existingSchedule) {
            existingSchedule.semester = semester;
            existingSchedule.program = program;
            existingSchedule.section = section;
            existingSchedule.schedule = schedule;
            existingSchedule.university = university;
            await existingSchedule.save();
            return res.json({ message: 'Schedule updated successfully' });
        } else {
            const newSchedule = new Schedule({ ID, semester, program, section, university, schedule });
            console.log(schedule);

            await newSchedule.save();
            return res.json({ message: 'Schedule added successfully' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/ids', async (req, res) => {
    try {
        const schedules = await Schedule.find({}, { ID: 1, _id: 0 });
        const Allids = schedules.map(schedule => schedule.ID);
        res.json({ ids: Allids });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Get a schedule by ID
router.get('/find/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ ID: req.params.id });
        if (schedule) {
            res.json(schedule);
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Schedule.deleteOne({ ID: id });
        if (result.deletedCount === 0) {
            res.status(404).json({ message: 'Schedule Not Found' });
        } else {
            res.status(200).json({ message: 'Schedule deleted' });
        }
    } catch (error) {
        console.log("Error deleting Document", error.message);
        res.status(500).json({ message: error.message });
    }
})

module.exports = router;
