import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import axios from 'axios';
import { promises as fs } from "fs";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "CwhRBWXzGAHq8TQ4Fs17";

const app = express();
app.use(express.json());

// CORS: Allow absolute connectivity between Vercel and Render
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

const port = process.env.PORT || 3000;
const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';

// Ensure audios directory exists on startup
fs.mkdir('audios', { recursive: true }).catch(() => {});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  try {
    const voices = await voice.getVoices(elevenLabsApiKey);
    res.send(voices);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch voices" });
  }
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command Failed: ${command}`);
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) console.warn(`Command Stderr: ${stderr}`);
      resolve(stdout);
    });
  });
};

// ---------------------------------------------------------------------------
// Rhubarb binary resolver — handles the nested Linux path correctly
// Actual Linux path: bin/rhubarb/rhubarb-lip-sync-1.13.0-linux/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb
// ---------------------------------------------------------------------------
const getRhubarbExecutable = async () => {
  // Windows
  const rhubarbPathWindows = path.join(process.cwd(), "bin", "rhubarb", "Rhubarb-Lip-Sync-1.14.0-Windows", "rhubarb.exe");
  // Linux (the binary is nested one extra level inside the zip-extracted folder)
  const rhubarbPathLinux = path.join(process.cwd(), "bin", "rhubarb", "rhubarb-lip-sync-1.13.0-linux", "Rhubarb-Lip-Sync-1.13.0-Linux", "rhubarb");
  // macOS
  const rhubarbPathMac = path.join(process.cwd(), "bin", "Rhubarb-Lip-Sync-1.13.0-macOS", "rhubarb");

  if (process.platform === "win32") {
    try { await fs.access(rhubarbPathWindows); return rhubarbPathWindows; } catch {}
  } else {
    // Try the correctly nested Linux path first
    try { await fs.access(rhubarbPathLinux); return rhubarbPathLinux; } catch {}
    try { await fs.access(rhubarbPathMac); return rhubarbPathMac; } catch {}
  }

  // Last resort: check if rhubarb is on PATH
  try {
    await execCommand("rhubarb --version");
    return "rhubarb";
  } catch {
    return null; // not found anywhere
  }
};

// ---------------------------------------------------------------------------
// edge-tts resolver — finds the correct binary regardless of Python install path
// ---------------------------------------------------------------------------
let resolvedEdgeTts = null;
const getEdgeTtsCommand = async () => {
  if (resolvedEdgeTts) return resolvedEdgeTts;

  // 1. Try system PATH (works if pip installed globally or venv is activated)
  try {
    const whichCmd = process.platform === 'win32' ? 'where edge-tts' : 'which edge-tts';
    const result = (await execCommand(whichCmd)).trim().split('\n')[0].trim();
    if (result) {
      resolvedEdgeTts = `"${result}"`;
      console.log(`edge-tts found at: ${result}`);
      return resolvedEdgeTts;
    }
  } catch {}

  // 2. Try using `python -m edge_tts` (always works if pip installed correctly)
  try {
    await execCommand('python3 -m edge_tts --version');
    resolvedEdgeTts = 'python3 -m edge_tts';
    console.log('edge-tts: using python3 -m edge_tts');
    return resolvedEdgeTts;
  } catch {}

  try {
    await execCommand('python -m edge_tts --version');
    resolvedEdgeTts = 'python -m edge_tts';
    console.log('edge-tts: using python -m edge_tts');
    return resolvedEdgeTts;
  } catch {}

  // 3. Local venv fallbacks
  const venvCmds = [
    process.platform === 'win32' ? '.\\venv\\Scripts\\edge-tts' : './venv/bin/edge-tts',
    '/opt/render/project/src/venv/bin/edge-tts',
    '/usr/local/bin/edge-tts',
    '/usr/bin/edge-tts',
  ];
  for (const cmd of venvCmds) {
    try {
      await fs.access(cmd.replace(/^"|"$/g, ''));
      resolvedEdgeTts = `"${cmd}"`;
      console.log(`edge-tts found at: ${cmd}`);
      return resolvedEdgeTts;
    } catch {}
  }

  return null; // not found
};

// Pre-resolve edge-tts path at startup
getEdgeTtsCommand().then(cmd => {
  if (!cmd) console.error('⚠️  WARNING: edge-tts not found. TTS will not work!');
  else console.log(`✅ edge-tts resolved: ${cmd}`);
});

const lipSyncMessage = async (message) => {
  const mp3FileName = `audios/message_${message}.mp3`;
  const wavFileName = `audios/message_${message}.wav`;
  const jsonFileName = `audios/message_${message}.json`;

  try {
    // Check if the MP3 file exists before attempting conversion
    await fs.access(mp3FileName);
    console.log(`Converting ${mp3FileName} to WAV for lip sync`);
    // ffmpeg-static provides a static binary — works on all platforms including Render
    await execCommand(`"${ffmpegStatic}" -y -i "${mp3FileName}" "${wavFileName}"`);
    console.log(`WAV conversion done`);

    const rhubarbExecutable = await getRhubarbExecutable();
    if (!rhubarbExecutable) {
      console.warn("⚠️  Rhubarb not found — writing empty mouthCues JSON");
      await fs.writeFile(jsonFileName, JSON.stringify({ mouthCues: [] }));
      return;
    }

    // Make the binary executable on Linux/macOS (idempotent)
    if (process.platform !== 'win32' && rhubarbExecutable !== 'rhubarb') {
      try { await execCommand(`chmod +x "${rhubarbExecutable}"`); } catch {}
    }

    await execCommand(`"${rhubarbExecutable}" -f json -o "${jsonFileName}" "${wavFileName}" -r phonetic`);
    console.log(`Lip sync JSON generated`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Audio file not found: ${mp3FileName}`);
    } else {
      console.error("Error in lipSyncMessage:", error.message);
    }
    // Always write a fallback JSON so the frontend doesn't crash
    try { await fs.writeFile(jsonFileName, JSON.stringify({ mouthCues: [] })); } catch {}
  }
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Hello. I am Sona, your professional interview assistant. I am ready to assist you.",
          audio: await audioFileToBase64("audios/intro_0.mp3"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "Please ask me a question or let's start a mock interview session.",
          audio: await audioFileToBase64("audios/intro_1.mp3"),
          lipsync: await readJsonTranscript("audios/intro_1.json"),
          facialExpression: "smile",
          animation: "Talking_2",
        },
      ],
    });
    return;
  }
  // edge-tts doesn't require an API key, so we can proceed directly to generation

  // Send request to FastAPI server
  let responseData;
  try {
    const response = await axios.post(`${aiBackendUrl}/generate`, { prompt: userMessage });
    responseData = response.data.text;
  } catch (apiError) {
    console.error("❌ FastAPI Connection Failed!");
    console.error("Target URL:", `${aiBackendUrl}/generate`);
    console.error("Error Message:", apiError.message);
    if (apiError.response) {
      console.error("Response Data:", apiError.response.data);
    }
    res.status(500).send({ 
      error: "LLM Backend connection failed",
      details: apiError.message 
    });
    return;
  }

  console.log("DEBUG: Raw Response from LLM:", responseData);

  try {
    // Sanitize LLM response by removing potential non-JSON noise if any remained
    let jsonString = responseData.trim();

    // Robust JSON extraction
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let messages;
    try {
      messages = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("DEBUG: JSON Parse failed for string:", jsonString);
      console.error("Original response was:", responseData);

      // Fallback: Create a professional message if parsing fails
      messages = {
        messages: [
          {
            text: "I apologize, but I encountered a technical issue processing your request. Could you please rephrase your question?",
            facialExpression: "sad",
            animation: "Talking_0"
          }
        ]
      };
    }

    if (messages.messages) {
      messages = messages.messages;
    } else if (Array.isArray(messages)) {
      // already an array
    } else {
      // unexpected format, wrap it
      messages = [messages];
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      // ensure basic fields exist
      if (!message.text) message.text = "...";
      if (!message.facialExpression) message.facialExpression = "default";
      if (!message.animation) message.animation = "Idle";

      // generate audio file
      const fileName = `audios/message_${i}.mp3`;
      const textInput = message.text;

      console.log(`[${i}] Text to Speech requested: "${textInput.substring(0, 20)}..."`);

      try {
        console.log(`[${i}] Cleaning up old audio file: ${fileName}`);
        await fs.unlink(fileName);
      } catch (e) { }

      try {
        // Using edge-tts for Text to Speech — dynamically resolve the binary
        const ttsVoice = "en-US-AvaNeural";
        const edgeTtsCmd = await getEdgeTtsCommand();
        if (!edgeTtsCmd) {
          throw new Error('edge-tts binary could not be located on this system');
        }
        // Safely escape the text for shell execution
        const safeText = textInput
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\$/g, '\\$')
          .replace(/`/g, '\\`')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '');
        console.log(`[${i}] TTS: ${edgeTtsCmd} --voice ${ttsVoice} --text "${safeText.substring(0, 40)}..."`);
        await execCommand(`${edgeTtsCmd} --text "${safeText}" --voice ${ttsVoice} --write-media ${fileName}`);
        console.log(`[${i}] ✅ Audio generated: ${fileName}`);
      } catch (voiceError) {
        console.error(`[${i}] ❌ edge-tts Error:`, voiceError.message);
      }

      // generate lipsync
      try {
        await lipSyncMessage(i);
      } catch (lipError) {
        console.error(`[${i}] LipSync Error:`, lipError.message);
      }

      try {
        message.audio = await audioFileToBase64(fileName);
        console.log(`[${i}] Audio converted to Base64 (length: ${message.audio.length})`);
      } catch (e) {
        console.warn(`[${i}] Audio file missing/failed, handling gracefully.`);
        // We might want a silent fallback audio if it's strictly required by frontend
        message.audio = "";
      }

      try {
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
      } catch (e) {
        message.lipsync = { mouthCues: [] };
      }
    }

    res.send({ messages });
  } catch (error) {
    console.error("Error processing response:", error);
    res.status(500).send({ error: "Failed to process AI response" });
  }

});

const readJsonTranscript = async (file) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON transcript from ${file}:`, error);
    throw error;
  }
};

const audioFileToBase64 = async (file) => {
  try {
    const data = await fs.readFile(file);
    console.log(`Read file ${file} successfully.`);
    return data.toString("base64");
  } catch (error) {
    console.error(`Error reading audio file ${file}:`, error);
    throw error;
  }
};

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});

