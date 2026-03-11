# Sona: Professional Interview Assistant 🎙️🤖

Sona is a premium 3D Virtual AI Assistant designed to help professionals and students master their technical and behavioral interviews. By combining local LLM intelligence with real-time 3D character animation and high-fidelity neural voice synthesis, Sona provides a deeply immersive and realistic mock interview experience.

---

## ✨ Features

- **Professional Persona**: Powered by **Groq (Llama 3)**, Sona acts as a seasoned technical recruiter with a sharp, professional tone.
- **3D Living Avatar**: A fully interactive character with automated phonetic lip-sync and dynamic facial expressions.
- **Neural Voice Synthesis**: Crystal-clear professional voices using **Edge-TTS** (Microsoft Azure Neural technology).
- **Blazing Fast Responses**: Optimized for low-latency interactions via the Groq Cloud API.
- **Modern Web Interface**: Built with **React**, **Three.js (R3F)**, and **TailwindCSS** for a high-end desktop experience.

---

## 🏗️ System Architecture

Sona operates through a three-tier architecture:

1.  **Frontend (The Face)**: A Vite-powered React application using **Three.js** to render a high-quality 60FPS digital avatar.
2.  **Orchestrator (The Voice)**: A Node.js Express server that manages:
    *   **Text-to-Speech (TTS)**: Dynamic generation of neural audio files.
    *   **Lip-Sync Processing**: Real-time phonetic analysis via **Rhubarb Lip Sync**.
3.  **Intelligence (The Brain)**: A FastAPI Python server that orchestrates LLM prompts and ensures professional response formatting.

---

## 🛠️ Technology Stack

*   **Frontend**: React, React Three Fiber, Three.js, TailwindCSS, Vite.
*   **Backend (Node)**: Express.js, FFmpeg, Rhubarb Lip-Sync.
*   **Backend (Python)**: FastAPI, Uvicorn, Groq AI.
*   **Deployment**: Docker (Backend), Vercel (Frontend).

---

## 🚀 Getting Started

### 1. Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **FFmpeg**: Installed and available in system PATH.

### 2. Backend Setup
```bash
cd "Sona - BACKEND"

# Setup Python Virtual Environment
python -m venv venv
.\venv\Scripts\activate # Windows
# source venv/bin/activate # Mac/Linux

# Install all dependencies
pip install -r requirements.txt
npm install
```

### 3. Environment Configuration
Create a `.env` file in `Sona - BACKEND`:
```properties
GROQ_API_KEY=your_key_here
PORT=3000
```

---

## 🌐 Deployment Guide (Production)

We have optimized the deployment process to handle the complex Python + Node dependency chain using **Docker**.

### **Step 1: Backend (Render.com)**
1.  **Create Service**: New **Web Service** on Render.
2.  **Environment**: Select **Docker**.
3.  **Config**: Render will automatically use the `Sona - BACKEND/Dockerfile`.
4.  **Env Variables**:
    *   `GROQ_API_KEY`: Your Groq API Key.
5.  **Why this works**: The Docker container bundles Node, Python, and FFmpeg together, ensuring Sona's voice works perfectly in the cloud.

### **Step 2: Frontend (Vercel)**
1.  **Connect Repo**: Point Vercel to the `Sona - FRONTEND` folder.
2.  **Env Variables**:
    *   `VITE_BACKEND_URL`: Your Render service URL (e.g., `https://sona-api.onrender.com`).
3.  **Deploy**.

---

## 🏆 Deployment Wins (Fixes Applied)

We recently resolved several critical deployment issues that were preventing Sona from speaking:
*   ✅ **Dynamic edge-tts pathing**: The backend now automatically locates the TTS binary on both Linux (Render) and Windows.
*   ✅ **Nested Rhubarb fix**: Resolved a pathing issue where the lip-sync binary was not being found on Linux due to nested folder structures.
*   ✅ **FFmpeg Integration**: Switched to a robust static binary approach for audio conversion.
*   ✅ **CORS Security**: Implemented modern CORS policies to allow seamless communication between Vercel and Render.
*   ✅ **Asset Persistence**: Fixed gitignore rules to ensure critical "Intro" audio files are preserved during deployment.

---

## 🚦 Local Development

Start these three services in separate terminals:

1.  **AI Server**: `cd "Sona - BACKEND" && .\venv\Scripts\python main.py`
2.  **Orchestrator**: `cd "Sona - BACKEND" && node index.js`
3.  **Frontend**: `cd "Sona - FRONTEND" && npm run dev`

Open **[http://localhost:5173](http://localhost:5173)** to start your session.

---

## 📄 License
This project is licensed under the MIT License.

