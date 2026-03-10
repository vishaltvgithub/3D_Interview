# Sona: Professional Interview Assistant 🎙️🤖

Sona is a state-of-the-art 3D Virtual AI Assistant designed to help professionals and students prepare for technical and behavioral interviews. Combining the power of local LLMs with advanced 3D character animation and high-quality voice synthesis, Sona provides an immersive mock interview experience.

---

## ✨ Features

- **Professional Persona**: Highly experienced technical interviewer persona powered by Groq (Llama 3).
- **3D Interactive Avatar**: Realistic 3D character with lip-sync and dynamic facial expressions.
- **Voice Synthesis**: Premium AI voices powered by Microsoft Azure (Neural via edge-tts).
- **Fast Response**: Low-latency responses using Groq Cloud.
- **Responsive Web UI**: Built with React, Three.js, and TailwindCSS for a premium feel.

---

## 🏗️ Architecture Layer

- **Frontend (UI)**: React app with **Three.js** rendering the interactive 3D avatar.
- **Orchestration (Middle)**: Node.js/Express server that handles:
    - Voice synthesis (`edge-tts`).
    - Lip-sync data generation (`Rhubarb`).
- **Intelligence (Core)**: FastAPI server managing the LLM responses via **Groq**.

---

## 🛠️ Technology Stack

- **Frontend**: React, React Three Fiber (Three.js), TailwindCSS, Vite.
- **Backend (Orchestrator)**: Node.js (Express) handles audio generation and lip-sync processing.
- **Backend (AI Core)**: FastAPI (Python) for LLM orchestration.
- **Intelligence**: Llama 3.3 (via Groq Cloud).
- **Voice**: edge-tts (Neural Voice Synthesis).
- **Lip-Sync**: Rhubarb Lip Sync (Automated phonetic mapping).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **Rhubarb Lip-Sync**: Included in `Sona - BACKEND/bin/`.
- **FFmpeg**: Required on the system for audio conversion.

### 2. Backend Setup

```bash
cd "Sona - BACKEND"

# 1. Setup Python Virtual Environment
python -m venv venv
.\venv\Scripts\activate # Windows
# source venv/bin/activate # Mac/Linux

# 2. Install Python Packages
pip install -r requirements.txt

# 3. Install Node.js Dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in `Sona - BACKEND`:

```properties
# REQUIRED: Get yours from https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# For Production Hosting (Leave empty for localhost)
AI_BACKEND_URL=
PORT=3000
```

---

## 🚀 Deployment Guide (Public URL)

To share Sona with others, host the parts as follows:

### **A. FastAPI AI Server (Render / Railway)**
- **Root Directory**: `Sona - BACKEND`
- **Build**: `pip install -r requirements.txt`
- **Start**: `python main.py`
- **Env**: `GROQ_API_KEY`

### **B. Node Orchestrator (Render / Railway)**
- **Root Directory**: `Sona - BACKEND`
- **Build**: `npm install`
- **Start**: `node index.js`
- **Env**: 
    - `AI_BACKEND_URL` = [Your FastAPI URL from Step A]
    - `NODE_ENV` = `production`

### **C. Frontend (Vercel / Netlify)**
- **Root Directory**: `Sona - FRONTEND`
- **Framework**: `Vite`
- **Env**:
    - `VITE_BACKEND_URL` = [Your Node URL from Step B]

---

## 🚦 Running Locally

You need to start three services in separate terminals:

1. **Python AI Server**:
   ```bash
   cd "Sona - BACKEND"
   .\venv\Scripts\python.exe main.py
   ```

2. **Node Orchestrator**:
   ```bash
   cd "Sona - BACKEND"
   node index.js
   ```

3. **Web Interface**:
   ```bash
   cd "Sona - FRONTEND"
   npm run dev
   ```

Open **[http://localhost:5173](http://localhost:5173)** to start your interview practice!

---

## 📸 Screenshots & Demo

[![Sona Demo Video](https://github.com/Addhithya/Sona/blob/main/Sona%20-%20FRONTEND/public/Screenshot%202024-08-10%20at%2022.29.15.png)](https://github.com/Addhithya/Sona/blob/main/Sona%20-%20FRONTEND/public/3D%20chatbot%20demo720p.mp4)

---

## 📄 License
This project is licensed under the MIT License.
