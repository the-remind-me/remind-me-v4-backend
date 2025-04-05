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
 * Waits for the given files to be active with progress updates.
 */
async function waitForFilesActive(files, res) {
    console.log("Waiting for file processing...");
    res.write(`data: ${JSON.stringify({ status: "processing", message: "Processing PDF file...", progress: 10 })}\n\n`);

    for (const name of files.map((file) => file.name)) {
        let file = await fileManager.getFile(name);
        let dotCount = 0;
        let progressPercent = 15;
        let progressStep = Math.floor(40 / (files.length * 3)); // Distribute progress from 15-55%

        while (file.state === "PROCESSING") {
            dotCount = (dotCount + 1) % 4;
            process.stdout.write(".");
            
            // Increment progress for real-time feeling
            progressPercent = Math.min(55, progressPercent + progressStep);
            
            res.write(`data: ${JSON.stringify({
                status: "processing",
                message: `Processing PDF${".".repeat(dotCount)}`,
                progress: progressPercent,
                detail: `Parsing page structures and content...`
            })}\n\n`);

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Reduced wait time for more updates
            file = await fileManager.getFile(name);
        }

        if (file.state !== "ACTIVE") {
            res.write(`data: ${JSON.stringify({
                status: "error",
                message: `File ${file.name} failed to process`,
                progress: 0
            })}\n\n`);
            throw Error(`File ${file.name} failed to process`);
        }
    }

    console.log("...all files ready\n");
    res.write(`data: ${JSON.stringify({
        status: "processed",
        message: "PDF processed successfully",
        progress: 60,
        detail: "Document structure analysis complete"
    })}\n\n`);
}

/**
 * POST /api/extract-pdf
 * Extract content from PDF using Gemini API with real-time updates
 */
router.post("/extract-pdf", upload.single("pdf"), async (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no' // Disable proxy buffering for Nginx
    });

    // Send initial connection established event
    res.write(`data: ${JSON.stringify({
        status: "connected",
        message: "Connection established",
        progress: 0
    })}\n\n`);

    try {
        if (!req.file) {
            res.write(`data: ${JSON.stringify({
                status: "error",
                message: "No PDF file uploaded",
                progress: 0
            })}\n\n`);
            res.end();
            return;
        }

        const filePath = req.file.path;
        res.write(`data: ${JSON.stringify({
            status: "uploading",
            message: "Uploading PDF to processing server...",
            progress: 5,
            detail: "Preparing document for analysis"
        })}\n\n`);

        // Upload to Gemini
        const uploadedFile = await uploadToGemini(filePath, "application/pdf");
        res.write(`data: ${JSON.stringify({
            status: "uploaded",
            message: "PDF uploaded successfully",
            progress: 10,
            detail: "Document uploaded to AI processing engine"
        })}\n\n`);

        // Wait for file processing with status updates
        await waitForFilesActive([uploadedFile], res);

        // Initialize model with system instructions
        res.write(`data: ${JSON.stringify({
            status: "analyzing",
            message: "Analyzing PDF content...",
            progress: 65,
            detail: "Identifying key information and document structure"
        })}\n\n`);

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
        res.write(`data: ${JSON.stringify({
            status: "extracting",
            message: "Extracting information from PDF...",
            progress: 75,
            detail: "Processing document content with AI"
        })}\n\n`);

        // Add intermediate progress update
        setTimeout(() => {
            res.write(`data: ${JSON.stringify({
                status: "extracting",
                message: "Extracting information from PDF...",
                progress: 85,
                detail: "Formatting extracted data"
            })}\n\n`);
        }, 2000);

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
        res.write(`data: ${JSON.stringify({
            status: "finalizing",
            message: "Finalizing extraction...",
            progress: 90,
            detail: "Generating structured data from document"
        })}\n\n`);
        
        const result = await chatSession.sendMessage("Dont cover it with ```json ```");
        const extractedText = result.response.text();

        // Clean up temporary file
        fs.unlinkSync(filePath);
        const cleanedText = extractedText.replace(/```json/g, "").replace(/```/g, "");

        // Parse JSON if possible and return
        try {
            const jsonData = JSON.parse(cleanedText);
            res.write(`data: ${JSON.stringify({
                status: "complete",
                message: "PDF extraction completed successfully",
                progress: 100,
                detail: "All data extracted and processed",
                data: jsonData
            })}\n\n`);
        } catch (error) {
            res.write(`data: ${JSON.stringify({
                status: "complete",
                message: "PDF extraction completed successfully",
                progress: 100,
                detail: "All data extracted and processed",
                data: cleanedText,
                type: "text"
            })}\n\n`);
        }

        // End the SSE stream
        res.end();

    } catch (error) {
        console.error("PDF extraction error:", error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.write(`data: ${JSON.stringify({
            status: "error",
            message: `Failed to extract PDF content: ${error.message}`
        })}\n\n`);

        res.end();
    }
});

export default router;