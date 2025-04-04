// models/Schedule.js
import mongoose, { Schema } from 'mongoose';

const classSchema = new Schema({
  Period: Number,
  Start_Time: { type: String, match: /^\d{2}:\d{2}$/ }, // HH:MM (24-hour)
  End_Time: { type: String, match: /^\d{2}:\d{2}$/ }, // HH:MM (24-hour)
  Course_Name: String,
  Instructor: String,
  Building: String, // e.g., "VI", "Main"
  Room: String, // e.g., "301", "Lab 2"
  Group: {
    type: String,
    enum: ['Group 1', 'Group 2', 'All'],
  },
  Class_Duration: Number,
  Class_Count: Number,
  Class_type: {
    type: String,
    enum: ['Theory', 'Lab', 'Extra', 'Seminar', 'Free'],
    required: true,
  },
},
  { _id: false }, // Disable automatic _id generation for subdocuments
);


const scheduleSchema = new Schema({
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

export default Schedule;