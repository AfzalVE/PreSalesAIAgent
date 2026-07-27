import os
from openai import OpenAI

# Set your API key
# export MOONSHOT_API_KEY="your_api_key"  # Linux/Mac
# set MOONSHOT_API_KEY=your_api_key       # Windows CMD
# $env:MOONSHOT_API_KEY="your_api_key"    # PowerShell

client = OpenAI(
    api_key="sk-YhzvJwh98XmxuhSygNZ6HLuwIpyh8a6uiulafuf9dpqStBmO",
    base_url="https://api.moonshot.ai/v1"
)

response = client.chat.completions.create(
    model="kimi-k3",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful AI assistant."
        },
        {
            "role": "user",
            "content": "Write a Python function to reverse a linked list."
        }
    ],
    max_completion_tokens=1024
)

print(response.choices[0].message.content)