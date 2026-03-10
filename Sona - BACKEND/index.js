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
app.use(cors());
const port = process.env.PORT || 3000;
const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';

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

const lipSyncMessage = async (message) => {
  const mp3FileName = `audios/message_${message}.mp3`;
  const wavFileName = `audios/message_${message}.wav`;
  const jsonFileName = `audios/message_${message}.json`;

  try {
    // Check if the MP3 file exists
    await fs.access(mp3FileName);
    console.log(`Converting ${mp3FileName} to WAV`);
    await execCommand(`"${ffmpegStatic}" -y -i ${mp3FileName} ${wavFileName}`);
    console.log(`Conversion done`);

    // Check for Rhubarb binary (Windows or Mac)
    const rhubarbPathWindows = path.join(process.cwd(), "bin", "rhubarb", "Rhubarb-Lip-Sync-1.14.0-Windows", "rhubarb.exe");
    const rhubarbPathMac = path.join(process.cwd(), "bin", "Rhubarb-Lip-Sync-1.13.0-macOS", "rhubarb");
    let rhubarbExecutable = rhubarbPathWindows;
    const rhubarbPathLinux = path.join(process.cwd(), "bin", "rhubarb", "rhubarb-lip-sync-1.13.0-linux", "rhubarb");

    try {
      if (process.platform === "win32") {
        await fs.access(rhubarbPathWindows);
        rhubarbExecutable = rhubarbPathWindows;
      } else {
        await fs.access(rhubarbPathLinux);
        rhubarbExecutable = rhubarbPathLinux;
      }
    } catch {
      try {
        await fs.access(rhubarbPathMac);
        rhubarbExecutable = rhubarbPathMac;
      } catch {
        // Fallback to searching in PATH if not found in bin
        try {
          await execCommand("rhubarb --version");
          rhubarbExecutable = "rhubarb";
        } catch {
          console.warn("Rhubarb binary not found. Skipping lip sync generation.");
          // Create a dummy JSON file so the frontend doesn't break
          await fs.writeFile(jsonFileName, JSON.stringify({ mouthCues: [] }));
          return;
        }
      }
    }

    await execCommand(`"${rhubarbExecutable}" -f json -o "${jsonFileName}" "${wavFileName}" -r phonetic`);
    console.log(`Lip sync done`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Audio file not found: ${mp3FileName}`);
      return { error: "Audio file not generated" };
    } else {
      console.error("Error in lipSyncMessage:", error);
      // Ensure a file exists preventing frontend crash
      try { await fs.writeFile(jsonFileName, JSON.stringify({ mouthCues: [] })); } catch { }
    }
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
    console.error("FastAPI Error:", apiError.message);
    res.status(500).send({ error: "LLM Backend connection failed" });
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
        // Using edge-tts CLI for Text to Speech
        // Professional voice: en-US-AvaNeural (or en-US-EmmaNeural, en-GB-SoniaNeural)
        const voice = "en-US-AvaNeural";
        // In production (Linux), edge-tts is usually in the PATH after npm install (via python)
        const edgeTtsCmd = process.env.NODE_ENV === 'production' ? 'edge-tts' : (process.platform === 'win32' ? '.\\venv\\Scripts\\edge-tts' : './venv/bin/edge-tts');
        const safeText = textInput.replace(/[\\"$]/g, '\\$&').replace(/\n/g, ' ');
        console.log(`[${i}] Executing TTS command: ${edgeTtsCmd} --text "${safeText.substring(0, 30)}..."`);
        await execCommand(`${edgeTtsCmd} --text "${safeText}" --voice ${voice} --write-media ${fileName}`);
        console.log(`[${i}] Audio generated via edge-tts at ${fileName}`);

      } catch (voiceError) {
        console.error(`[${i}] edge-tts Error:`, voiceError.message);
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

