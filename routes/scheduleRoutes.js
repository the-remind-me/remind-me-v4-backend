// routes/scheduleRoutes.js
import express from 'express';
import Schedule from '../models/Schedule.js';
import Teacher from '../models/Teacher.js';

const router = express.Router();

// Function to extract teachers from schedule
const extractAndSaveTeachers = async (schedule, university, program) => {
    try {
        console.log("Extracting teachers from schedule...");

        const teachersSet = new Set();

        // Extract all instructors from each day's schedule
        // biome-ignore lint/complexity/noForEach: <explanation>
        Object.keys(schedule).forEach(day => {
            if (Array.isArray(schedule[day])) {
                // biome-ignore lint/complexity/noForEach: <explanation>
                schedule[day].forEach(period => {
                    if (period.Instructor) {
                        // Handle multiple instructors separated by '+'
                        const instructors = period.Instructor.split('+').map(name => name.trim());
                        // biome-ignore lint/complexity/noForEach: <explanation>
                        instructors.forEach(name => teachersSet.add(name));
                    }
                });
            }
        });

        // Save each unique instructor to the Teacher collection if they don't already exist
        const teacherPromises = Array.from(teachersSet).map(async (name) => {
            const existingTeacher = await Teacher.findOne({ name });
            if (!existingTeacher) {
                const newTeacher = new Teacher({
                    name,
                    university,
                    program,
                    // Other fields will be empty until updated
                });
                return newTeacher.save();
            }
            return Promise.resolve();
        });

        await Promise.all(teacherPromises);
        console.log(`Extracted and saved ${teachersSet.size} teachers`);
    } catch (error) {
        console.error('Error extracting teachers:', error);
    }
};

router.get('/teachers', async (req, res) => {
    try {
        const { university, program } = req.query;

        // Build the filter object based on provided query parameters
        const filter = {};
        if (university) filter.university = university;
        if (program) filter.program = program;

        // Find teachers that match the filter criteria
        const teachers = await Teacher.find(filter).select('-__v -_id');
        teachers.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name

        if (teachers.length > 0) {
            res.json(teachers);
        } else {
            res.status(404).json({
                message: 'No teachers found with the specified criteria',
                filters: filter
            });
        }
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add or update a schedule
router.post('/add', async (req, res) => {
    const { ID, semester, program, section, university, schedule } = req.body;
    console.log(schedule);
    try {
        const existingSchedule = await Schedule.findOne({ ID });
        if (existingSchedule) {
            existingSchedule.semester = semester;
            existingSchedule.program = program;
            existingSchedule.section = section;
            existingSchedule.schedule = schedule;
            existingSchedule.university = university;
            await existingSchedule.save();

            // Extract and save teachers from updated schedule
            await extractAndSaveTeachers(schedule, university, program);

            return res.json({ message: 'Schedule updated successfully' });
        }
        const newSchedule = new Schedule({ ID, semester, program, section, university, schedule });
        console.log(schedule);

        await newSchedule.save();

        // Extract and save teachers from new schedule
        await extractAndSaveTeachers(schedule, university, program);
        return res.json({ message: 'Schedule added successfully' });
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

export default router;
