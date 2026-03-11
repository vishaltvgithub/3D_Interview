#!/bin/bash
# Render Production Startup Script
set -e

echo "=== Sona Backend Startup ==="

# Create audios directory if it doesn't exist
mkdir -p audios

# Make Rhubarb executable
RHUBARB_LINUX="./bin/rhubarb/rhubarb-lip-sync-1.13.0-linux/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb"
if [ -f "$RHUBARB_LINUX" ]; then
  chmod +x "$RHUBARB_LINUX"
  echo "✅ Rhubarb binary permissions set: $RHUBARB_LINUX"
else
  echo "⚠️  Rhubarb binary not found at: $RHUBARB_LINUX"
fi

# Verify edge-tts is available
if command -v edge-tts &> /dev/null; then
  echo "✅ edge-tts found in PATH: $(which edge-tts)"
elif python3 -m edge_tts --version &> /dev/null 2>&1; then
  echo "✅ edge-tts available via python3 -m edge_tts"
else
  echo "⚠️  edge-tts not found — installing now..."
  pip3 install --upgrade edge-tts
fi

# Start the Python FastAPI AI server in the background
echo "Starting Python FastAPI server..."
python3 main.py &
PYTHON_PID=$!

# Wait for FastAPI to be ready (up to 30 seconds)
echo "Waiting for FastAPI to be ready..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8000/docs > /dev/null 2>&1; then
    echo "✅ FastAPI server is ready!"
    break
  fi
  echo "  Attempt $i/30: FastAPI not ready yet, waiting 2s..."
  sleep 2
done

# Start the Node.js server (the main Render process)
echo "Starting Node.js server..."
node index.js
