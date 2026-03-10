from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Prompt(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(prompt: Prompt):
    try:
        # Using Groq with Llama 3 for faster and reliable responses
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are Sona, a highly experienced Technical Interviewer and Professional Assistant. 
            You are assisting the user with interview preparation or conducting a mock interview.
            
            Your responses must be:
            1. Professional and Formal: Use business-appropriate language. Avoid casual slang.
            2. Structured and Clear: Use bullet points or numbered lists where appropriate.
            3. Insightful: Provide depth in your technical or behavioral answers/questions.
            4. Concise: Do not ramble.

            You MUST respond with a valid JSON object strictly following this schema:
            {
                "messages": [
                    {
                        "text": "Your professional response text here",
                        "facialExpression": "smile", 
                        "animation": "Talking_1" 
                    }
                ]
            }
            
            Valid facialExpression options: smile, sad, angry, surprised, funnyFace, default
            Valid animation options: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, Angry
            
            Key Rules:
            - Output ONLY the JSON object. 
            - No markdown formatting (like ```json), just the raw JSON string.
            - No internal thought process or "thinking" tags in the final output.
            - Max 3 messages in the array."""
                },
                {
                    "role": "user",
                    "content": prompt.prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        
        clean_content = chat_completion.choices[0].message.content
        
        import time
        print(f"LLM Generation Time: {time.time()} - Timestamp") # Simple logging

        return {"text": clean_content}
    except Exception as e:
        print(f"Groq Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
