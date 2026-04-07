import os
import asyncio
from dotenv import load_dotenv
from media_processor import AIProcessor

async def test():
    load_dotenv()
    proc = AIProcessor()
    # Check if there is a file in uploads to test with
    upload_dir = "uploads"
    files = os.listdir(upload_dir)
    if not files:
        print("No files in uploads/ to test.")
        return
    
    test_file = os.path.join(upload_dir, files[0])
    print(f"Testing with file: {test_file}")
    
    result = await proc.process_image(test_file)
    print("AI Result:")
    print(result)

if __name__ == "__main__":
    asyncio.run(test())
