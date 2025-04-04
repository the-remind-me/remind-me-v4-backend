import mongoose, { Schema } from "mongoose";

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    university: {
        type: String,
    },
    program: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
});

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;