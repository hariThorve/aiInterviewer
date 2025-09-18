# AI Interview Platform - Frontend

This is the frontend for the AI Interview Platform built with Vite + React. The frontend is currently standalone (not connected to the backend) and integrates with Vapi Web SDK to run an interview-like voice experience.

## Prerequisites
- Node.js 18+ and npm
- A Vapi Web SDK public API key
- A Vapi Assistant ID

## 1) Clone the repository
```bash
git clone <your-repo-url>
cd aiInterviewPlatform/frontend
```

## 2) Install dependencies
```bash
npm install
```

## 3) Configure environment variables
Copy the example env file and fill in your values:
```bash
cp .env.example .env
```
Set the following values in `.env`:
- `VITE_VAPI_API_KEY` — your Vapi Web SDK public key
- `VITE_VAPI_ASSISTANT_ID` — your Vapi Assistant ID

Example `.env`:
```env
VITE_VAPI_API_KEY=pk_live_xxxxxxxxxxxxxxxxx
VITE_VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxx
```

## 4) Run the app (development)
```bash
npm run dev
```
Then open the local URL shown in your terminal (typically `http://localhost:5173`).

## 5) Build for production
```bash
npm run build
```
The build output will be in `dist/`.

## Features
- Modern, dark neon UI for the interview screen
- Two-party layout (You vs. AI Assistant)
- Live transcript panel

## Notes
- The backend is not required for local usage of the voice interview demo. The form is currently local-only and does not submit to the backend.
- Ensure your browser allows microphone access.
