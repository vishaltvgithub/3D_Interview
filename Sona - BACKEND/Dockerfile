# Use Node.js base image
FROM node:18-slim

# Install Python and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy requirements.txt
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Ensure scripts are executable
RUN chmod +x start.sh
RUN chmod +x bin/rhubarb/rhubarb-lip-sync-1.13.0-linux/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb

# Expose the ports
EXPOSE 3000
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Run the startup script
CMD ["bash", "start.sh"]
