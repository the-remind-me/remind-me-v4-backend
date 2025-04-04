import mongoose, { Schema } from 'mongoose';

const holidaySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            // Store as YYYY-MM-DD string for simplicity, or use Date type if timezones are critical
            type: String,
            required: true,
            unique: true, // Assuming only one holiday name per date
            match: /^\d{2}-\d{2}-\d{4}$/,
            index: true,
        },
    },
    { timestamps: true }
);

const Holiday = mongoose.model('Holiday', holidaySchema);

export default Holiday;
