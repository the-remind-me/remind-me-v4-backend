// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import scheduleRoutes from './routes/scheduleRoutes.js';
import holidayroute from './routes/holidayroute.js';
import aiRoutes from './routes/aiRoutes.js';
import extractorRoutes from './routes/extractPdf.js';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(morgan('combined'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error('Could not connect to MongoDB:', err));

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Use schedule routes
app.use('/api/schedule', scheduleRoutes);
app.use('/api/holiday', holidayroute);
app.use("/api/ai", aiRoutes);
app.use("/api", extractorRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Server running on http://localhost:5000");
});