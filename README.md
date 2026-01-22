Migdalor
The system consists of two main components:

The Exam Generator (Admin): Uses computer vision (OCR) and LLMs to read PDF manuals and existing multiple-choice exams, converting them into open-ended questions with "Ground Truth" answers extracted directly from the source text.

The Study Portal (Client): An interactive interface where users answer open-ended questions. Their answers are graded in real-time by AI (Gemini), which compares them against the official doctrine and provides specific feedback.

✨ Key Features
🎓 For Students (Study Portal)
AI Grading: receive immediate, granular feedback (0-100 score) on open-ended answers.

Real-time Feedback: The AI highlights exactly what was missing from the answer compared to the official text.

Dynamic UI: Clean, Hebrew-first interface with progress tracking and grade summaries.

Supabase Integration: Fetches the latest tests directly from the cloud.

🛠 For Instructors (Generator Tool)
PDF Ingestion: Upload full PDF manuals (Volumes B & C) and existing PDF exams.

Smart Conversion: Uses Gemini 2.5 Flash (Vision capabilities) to read question images, remove multiple-choice options, and rephrase them as open-ended questions.

Source Extraction: Automatically finds the "Ground Truth" answer within the reference manuals.

Exam Editor: A built-in JSON editor to refine questions before publishing.

One-Click Deploy: Uploads generated exams directly to the Supabase database.

🛠 Tech Stack
Frontend: React, TypeScript, Tailwind CSS

AI & LLM: Google Gemini API (Gemini 2.5 Flash Preview)

Backend & DB: Supabase (PostgreSQL)

PDF Processing: PDF.js (Client-side parsing and rendering)

Icons: Lucide React

🚀 Getting Started
To run this project locally, follow these steps.

Prerequisites
Node.js (v16 or higher)

npm or yarn

Installation
Clone the repository

Bash

git clone https://github.com/ReemKish/Migdalor.git
cd Migdalor
Install dependencies

Bash

npm install
Environment Configuration Create a .env file in the root directory. Do not hardcode keys in the files.

Code snippet

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_gemini_key
Run the App

Bash

npm run dev
🎮 Usage Guide
1. Generating a New Test (Admin)
Navigate to the Generator view (managed in App.jsx).

Upload Reference Material: Select the PDF manuals (e.g., "Vol B - Attack").

Upload Questions: Select a PDF containing the exam questions.

Process: Click "Generate JSON". The AI will analyze the images and text.

Edit & Save: Review the generated questions in the dashboard. Fix any OCR errors.

Upload: Click "Upload to Cloud" to save the test to Supabase.

2. Taking a Test (Student)
Open the main application (App.tsx).

Enter your personal API Key in the settings (if required by local config) or use the system default.

Select a test from the main dashboard.

Answer the questions in your own words.

Submit the test to receive an AI-generated grade and specific corrections based on the doctrine.

🤝 Contributing
Contributions are welcome! This is currently an open_test branch.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request
