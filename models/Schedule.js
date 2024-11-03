// models/Schedule.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  Period: Number,
  Start_Time: String,
  End_Time: String,
  Course_Name: String,
  Instructor: String,
  Building: String,
  Room: String,
  Group: String,
  Class_Duration: Number,
  Class_Count: Number,
  Class_type: String,
});

const scheduleSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  semester: { type: String, required: true },
  program: { type: String, required: true },
  section: { type: String, required: true },
  university: { type: String, required: true },
  schedule: {
    Monday: [classSchema],
    Tuesday: [classSchema],
    Wednesday: [classSchema],
    Thursday: [classSchema],
    Friday: [classSchema],
    Saturday: [classSchema],
  }
},
  {
    timestamps: true
  });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
