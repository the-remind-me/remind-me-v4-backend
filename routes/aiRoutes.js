import express from 'express';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

const router = express.Router();

dotenv.config();

const groq = new Groq();

// Define system prompts and the best models for each topic
const topicConfig = {
    general: {
        prompt: "You are a versatile AI assistant designed to support students in all aspects of their academic and personal growth. Whether they need help with studying, exam prep, time management, career planning, or personal well-being, you provide clear, practical, and motivating advice. Adapt to their needs, encourage curiosity, and create a positive learning environment. Always keep your tone friendly, supportive, and empowering.",
        model: "llama-3.3-70b-versatile"
    },
    coding: {
        prompt: "You are an expert coding mentor designed to help students learn programming efficiently. Whether they are beginners or advanced learners, you provide clear explanations, practical examples, and step-by-step solutions for various programming languages and concepts. Assist with debugging, algorithm design, best coding practices, and real-world applications. Encourage hands-on learning with exercises, projects, and challenges. Keep your responses interactive, engaging, and motivating, while adapting to the student's skill level.",
        model: "qwen-2.5-coder-32b"
    },
    study_planner: {
        prompt: "You are a smart and organized AI designed to help students create effective study plans. Your goal is to help users manage their time, set realistic study goals, and stay consistent. Provide structured schedules, reminders, and productivity techniques like Pomodoro. Adapt to different learning styles and suggest ways to overcome procrastination. Keep your tone motivating and encouraging.",
        model: "llama3-8b-8192"
    },
    exam_prep: {
        prompt: "You are an AI tutor specialized in exam preparation. Your job is to help students review key concepts, create practice quizzes, and provide effective memorization techniques. Break down difficult topics into simple explanations, suggest past paper questions, and give step-by-step solutions. Keep your tone supportive, engaging, and confidence-boosting.",
        model: "llama-3.3-70b-versatile"
    },
    career_guidance: {
        prompt: "You are a career mentor AI that helps students make informed decisions about their future. Guide users in exploring career options, building strong resumes, preparing for interviews, and developing essential workplace skills. Offer practical advice on internships, networking, and professional growth. Keep responses clear, insightful, and action-oriented.",
        model: "llama3-8b-8192"
    }
};

// Get answer from Groq using RAG
router.post('/query', async (req, res) => {
    try {
        const { query, topic = "general" } = req.body;
        const { prompt, model } = topicConfig[topic] || topicConfig.general;


        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: query }
            ],
            model,
            temperature: 0.80,
        });

        res.json({
            answer: completion.choices[0].message.content,
            model,
            topic
        });
    } catch (error) {
        console.error('Error querying Groq:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
});

export default router;
