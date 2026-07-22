import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv
load_dotenv()

async def test():
    client = AsyncOpenAI()
    try:
        await client.chat.completions.create(model='gpt-5.5', messages=[{'role': 'user', 'content': 'hi'}])
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
