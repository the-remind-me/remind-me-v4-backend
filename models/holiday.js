import mongoose, { Schema } from 'mongoose';

const holidaySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    });

const Holiday = mongoose.model('Holiday', holidaySchema);

export default Holiday;
