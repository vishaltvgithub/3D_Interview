import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You MUST respond with a valid JSON object strictly following this schema: {\"messages\": [{\"text\": \"...\"}]}"
            },
            {
                "role": "user",
                "content": "Hello",
            }
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
    )
    print("Groq working with JSON!")
    print(chat_completion.choices[0].message.content)
except Exception as e:
    print(f"Groq failed with JSON: {e}")
