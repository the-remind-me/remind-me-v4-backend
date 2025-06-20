# Remind Me All v4 - Backend API

## Overview

Remind Me All v4 Backend is a comprehensive Node.js API built with Express.js and MongoDB. It serves as the backend for an academic scheduling and reminder application, providing endpoints for managing class schedules, holidays, teacher information, extracting timetables from PDFs using AI, and offering AI-powered assistance to students.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Schedule Management](#schedule-management)
  - [Teacher Management](#teacher-management)
  - [Holiday Management](#holiday-management)
  - [PDF Extraction](#pdf-extraction)
  - [AI Assistant](#ai-assistant)
- [Data Models](#data-models)
  - [Schedule Schema](#schedule-schema)
  - [Teacher Schema](#teacher-schema)
  - [Holiday Schema](#holiday-schema)
- [PDF Extraction Workflow](#pdf-extraction-workflow)
- [AI Assistant Integration](#ai-assistant-integration)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **Schedule Management**: CRUD operations for class schedules.
- **Holiday Management**: Add, list, and remove academic holidays.
- **Teacher Directory**: Automatically extracts and manages teacher information derived from schedules.
- **AI-Powered PDF Processing**: Extracts structured timetable data from PDF files using Google Gemini AI.
- **AI Assistant**: Provides context-aware responses to student queries using GROQ language models.
- **Real-time PDF Status**: Uses Server-Sent Events (SSE) to update clients on the PDF processing progress.

## Technologies Used

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **AI Services**:
  - Google Generative AI (Gemini Pro) for PDF extraction
  - GROQ SDK for AI assistant functionality
- **Middleware & Libraries**:
  - `cors`: Cross-Origin Resource Sharing
  - `multer`: File upload handling (for PDFs)
  - `morgan`: HTTP request logging
  - `dotenv`: Environment variable management
  - `mongoose`: MongoDB object modeling

## Project Structure

```py
remind-me-v4-backend/
├── .env                    # Environment variables (create this file, not committed)
├── .gitignore              # Specifies intentionally untracked files
├── index.js                # Application entry point and server setup
├── prompt.txt              # Gemini AI prompt used for PDF timetable extraction
├── package.json            # Project dependencies and scripts
├── models/                 # Mongoose database schemas
│ ├── Schedule.js           # Schedule data model
│ ├── Teacher.js            # Teacher data model
│ └── holiday.js            # Holiday data model
├── routes/                 # API route definitions
│ ├── aiRoutes.js           # Endpoints for the AI assistant
│ ├── extractPdf.js         # Endpoint for PDF extraction and SSE status
│ ├── holidayroute.js       # Endpoints for holiday management
│ └── scheduleRoutes.js     # Endpoints for schedule and teacher management
└── uploads/                # Temporary storage for uploaded PDF files (should be in .gitignore)
```

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js**: Version 16 or higher recommended.
- **npm** or **yarn**: Package manager for Node.js.
- **MongoDB**: A running instance (local or cloud-based like MongoDB Atlas).
- **Google Generative AI API Key**: Obtain from Google AI Studio or Google Cloud.
- **GROQ API Key**: Obtain from the GROQ console.

## Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/the-remind-me/remind-me-v4-backend.git
    cd remind-me-v4-backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Create Environment File**:
    Create a `.env` file in the project root directory. Copy the contents from the [Environment Variables](#environment-variables) section below and fill in your actual credentials.

## Environment Variables

Create a `.env` file in the project root and add the following variables:

```py
# MongoDB Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority"

# Server Port
PORT=5000

# API Keys
GROQ_API_KEY="your_groq_api_key_here"
GOOGLE_API_KEY="your_google_api_key_here"
```

## Running the Application

Development Mode (with Nodemon for auto-restarts):

```bash
npm run dev
```

Production Mode:

```bash
npm start
```

The server will start on the port specified in your .env file (or 5000 by default).

## API Endpoints

All endpoints are prefixed with **/api**.

### Schedule Management

- **POST /schedule/add**: Add a new schedule or update an existing one based on ID.

  **Request Body:**

  ```json
  {
    "ID": "unique_schedule_id_string",
    "semester": "I - IX",
    "program": "Computer Engineering",
    "section": "B",
    "university": "Example University",
    "schedule": {
      "Monday": [
        /* Array of class objects, see Schema */
      ],
      "Tuesday": [
        /* ... */
      ],
      "Wednesday": [
        /* ... */
      ],
      "Thursday": [
        /* ... */
      ],
      "Friday": [
        /* ... */
      ],
      "Saturday": [
        /* ... */
      ]
    }
  }
  ```

  **Response:** 201 Created or 200 OK with success message. 500 Internal Server Error on failure.

- **GET /schedule/find/:id**: Retrieve a specific schedule by its ID.

  - **URL Parameter:** id (The unique schedule ID).

  **Response:** 200 OK with the schedule object. 404 Not Found if ID doesn't exist.

<br>

- **GET /schedule/ids**: Get a list of all available schedule IDs.

  **Response:** 200 OK with an array of strings: `["id1", "id2", ...]`.

<br>

- **DELETE /schedule/delete/:id**: Delete a schedule by its ID.

  - **URL Parameter:** id (The unique schedule ID).

  **Response:** 200 OK with success message. 404 Not Found or 500 Internal Server Error.

### Teacher Management

- **GET /schedule/teachers**: Retrieve a list of unique teachers, optionally filtered.

  **Query Parameters:**

  - university (optional): Filter teachers by university.
  - program (optional): Filter teachers by program.

  **Response:** 200 OK with an array of teacher objects (name, university, program).

### Holiday Management

- **POST /holiday/add**: Add a new holiday or update if the date already exists.

  **Request Body:**

  ```json
  {
    "name": "Spring Break",
    "date": "YYYY-MM-DD" // e.g., "2024-03-15"
  }
  ```

  **Response:** 201 Created or 200 OK with the holiday object. 500 Internal Server Error.

- **GET /holiday/all**: Retrieve all holidays.

  **Response:** 200 OK with an array of holiday objects.

- **DELETE /holiday/delete/:id**: Delete a holiday by its MongoDB \_id.

  **URL Parameter:** id (The MongoDB ObjectId of the holiday).

  **Response:** 200 OK with success message. 404 Not Found or 500 Internal Server Error.

### PDF Extraction

- **POST /extract-pdf**: Upload a PDF timetable and initiate the AI extraction process. This endpoint uses Server-Sent Events (SSE) for progress updates.

  **Request:** multipart/form-data with a single field named pdf containing the PDF file.

  **Response:**

  - An initial 200 OK establishing the SSE connection (Content-Type: text/event-stream).
  - A stream of SSE messages indicating the processing status (see PDF Processing States).
  - The final event (type: complete or type: error) will contain the extracted schedule JSON data (if successful) or an error message in the data field.

```json
{
  event: status
  data: {"status":"uploading","message":"Uploading PDF..."}

  event: status
  data: {"status":"processing","message":"Processing PDF with AI..."}

  event: complete
  data: {"ID":"extracted_id", "semester": "...", "program": "...", ... schedule: {...}} // Full schedule object
}
```

### OR on error

```json
{
  event: error
  data: {"status":"error","message":"Failed to extract data: Internal server error."}
}
```

### AI Assistant

- **POST /ai/query**: Send a query to the AI assistant for context-aware help.

  **Request Body:**

  ```json
  {
    "query": "What are the best ways to study for algorithms?",
    "topic": "exam_prep" // Optional, defaults to "general". See valid topics below.
  }
  ```

  **Valid Topics:** general, coding, study_planner, exam_prep, career_guidance

  **Response:** 200 OK

  ```json
  {
    "answer": "Here are some effective strategies for studying algorithms...",
    "model": "llama-3.3-70b-versatile", // Model used for the response
    "topic": "exam_prep" // Topic context used
  }
  ```

  **Error Response:** 500 Internal Server Error on failure.

## PDF Extraction Workflow

The PDF extraction process leverages Google Gemini AI for accurate data parsing:

1. **Upload**: The client sends a PDF file via a multipart/form-data request to the `/api/extract-pdf` endpoint.
2. **SSE Connection**: The server establishes a Server-Sent Events (SSE) connection with the client to provide real-time status updates.
3. **File Handling**: The server temporarily saves the uploaded PDF to the `/uploads` directory.
4. **AI Processing**: The PDF content is sent to the Google Generative AI (Gemini) API along with a detailed prompt (`prompt.txt`) instructing it how to parse the timetable structure, identify class details (time, course, instructor, location), handle subgroups (Group 1/2/All), and format the output as JSON.
5. **Status Updates**: Throughout the process, the server sends status messages via SSE (e.g., uploading, processing, analyzing, extracting).
6. **Data Parsing & Validation**: The AI's JSON response is received, parsed, and validated against the expected Schedule schema structure. Teacher information is also extracted.
7. **Database Storage**: If the extraction is successful, the structured schedule data is saved to the MongoDB `schedules` collection, and unique teacher information is saved/updated in the `teachers` collection.
8. **Final Response**: An SSE event (`complete` or `error`) is sent to the client containing either the successfully extracted and saved schedule data (as JSON) or an error message.
9. **Cleanup**: The temporary PDF file in the `/uploads` directory is deleted.

### PDF Processing States (via SSE)

Clients listening to the SSE stream will receive events with the following statuses:

- **uploading**: PDF is being received by the server.
- **uploaded**: PDF upload complete, preparing for AI processing.
- **processing**: PDF data sent to Google Gemini AI.
- **processed**: Response received from AI.
- **analyzing**: Analyzing the AI's response structure.
- **extracting**: Extracting and formatting data into the schedule schema.
- **saving**: Saving the extracted data to the database.
- **complete**: Process finished successfully. Final data included in the event.
- **error**: An error occurred at some stage. Error details included in the event.

## AI Assistant Integration

The AI assistant uses the GROQ SDK to provide fast responses from various large language models, tailored to specific academic topics.

### Topic Configurations

The `/api/ai/query` endpoint uses different models and system prompts based on the `topic` parameter:

- **general** (Default): Broad academic advice, study tips, personal growth.
  - **Model**: llama-3.3-70b-versatile (or similar powerful general model)
- **coding**: Help with programming concepts, debugging, computer science topics.
  - **Model**: qwen-2.5-coder-32b (or similar code-focused model)
- **study_planner**: Assistance with time management, creating study schedules, organizational tips.
  - **Model**: llama3-8b-8192 (or similar efficient model suitable for planning)
- **exam_prep**: Strategies for test preparation, content review guidance, managing exam stress.
  - **Model**: llama-3.3-70b-versatile (or similar powerful general model)
- **career_guidance**: Advice on career paths, job searching, skill development, resume building.
  - **Model**: llama3-8b-8192 (or similar efficient model)

Each topic configuration includes a specific system prompt sent to the LLM to prime it for relevant and helpful responses within that context.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name` or `bugfix/issue-description`).
3. Make your changes and commit them with clear, descriptive messages (`git commit -m 'feat: Add X functionality'`). Adhere to conventional commit messages if possible.
4. Push your changes to your forked repository (`git push origin feature/your-feature-name`).
5. Open a Pull Request (PR) against the main branch of the original repository.
6. Ensure your PR description clearly explains the changes and addresses any related issues.

Please open an issue first to discuss significant changes or new features.

## License

This project is licensed under the MIT License.

## Contact

Project Maintainer: [Biplab Roy](https://github.com/biplabroy-1)

Email: [biplabr119201@gmail.com]
