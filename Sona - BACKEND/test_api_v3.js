import axios from 'axios';

async function testChat() {
    try {
        console.log("Sending request to chat endpoint...");
        const response = await axios.post('http://localhost:3000/chat', {
            message: "Hello Sona, I'm ready to start the technical interview. Can you ask me a question about React hooks?"
        });
        console.log("Response received!");
        console.log("Number of messages:", response.data.messages.length);
        
        response.data.messages.forEach((msg, i) => {
            console.log(`\nMessage ${i}:`);
            console.log("Text:", msg.text);
            console.log("Facial Expression:", msg.facialExpression);
            console.log("Animation:", msg.animation);
            console.log("Audio Base64 length:", msg.audio ? msg.audio.length : 0);
            console.log("LipSync cues count:", msg.lipsync && msg.lipsync.mouthCues ? msg.lipsync.mouthCues.length : 0);
        });
    } catch (error) {
        console.error("Test failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testChat();
