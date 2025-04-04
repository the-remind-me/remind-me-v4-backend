import mongoose, { Schema } from "mongoose";

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    university: {
        type: String,
        trim: true,
    },
    program: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
});
// Compound index to quickly find unique teachers per university/program
teacherSchema.index({ name: 1, university: 1, program: 1 }, { unique: true });

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;