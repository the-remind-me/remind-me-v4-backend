import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "node:fs";

const router = express.Router();
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set in the environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Set up multer for handling PDF file uploads
const upload = multer({
    dest: "uploads/", // Temporary directory for uploads
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

/**
 * Uploads the given file to Gemini.
 */
async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
        mimeType,
        displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
}

/**
 * Waits for the given files to be active.
 */
async function waitForFilesActive(files) {
    console.log("Waiting for file processing...");
    for (const name of files.map((file) => file.name)) {
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".")
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            file = await fileManager.getFile(name)
        }
        if (file.state !== "ACTIVE") {
            throw Error(`File ${file.name} failed to process`);
        }
    }
    console.log("...all files ready\n");
}

/**
 * POST /api/extract-pdf
 * Extract content from PDF using Gemini API
 */
router.post("/extract-pdf", upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No PDF file uploaded" });
        }

        const filePath = req.file.path;

        // Upload to Gemini
        const uploadedFile = await uploadToGemini(filePath, "application/pdf");

        // Wait for file processing
        await waitForFilesActive([uploadedFile]);

        // Initialize model with system instructions
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro-exp-03-25",
            systemInstruction: fs.readFileSync("prompt.txt", "utf-8"),
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 65536,
            responseModalities: [],
            responseMimeType: "text/plain",
        };

        // Start chat session with the PDF
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            fileData: {
                                mimeType: uploadedFile.mimeType,
                                fileUri: uploadedFile.uri,
                            },
                        },
                    ],
                },
            ],
        });

        // Send extraction prompt
        const result = await chatSession.sendMessage("Dont cover it with ```json ```");
        const extractedText = result.response.text();

        // Clean up temporary file
        fs.unlinkSync(filePath);
        const cleanedText = extractedText.replace(/```json/g, "").replace(/```/g, "");
        // Parse JSON if possible and return
        try {
            const jsonData = JSON.parse(cleanedText);
            return res.status(200).json(jsonData);
        } catch {
            return res.status(200).json(cleanedText);
        }

    } catch (error) {
        console.error("PDF extraction error:", error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: "Failed to extract PDF content",
            error: error.message
        });
    }
});

export default router;