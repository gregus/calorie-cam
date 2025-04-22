from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from genkit_flows import meal_analyzer_flow  # Import Genkit flow
import argparse
from genkit_flows import MealAnalysis
from rich import print

app = FastAPI()

# CORS middleware setup
origins = [
    "http://localhost:3000",  
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root():
    return {"message": "Calorie Cam Backend"}


@app.post("/estimate")
async def estimate_calories(image_file: UploadFile = File(...)):
    image_data = await image_file.read()
    result = await meal_analyzer_flow(image_data)
    return {"message": "Estimation endpoint", "filename": image_file.filename, "result": result}


def test_estimate_endpoint(image_filename: str):
    import httpx
    with open(image_filename, "rb") as image_file:
        image_data = image_file.read()
    files = {"image_file": ("test_image.jpg", image_data, "image/jpeg")}
    response = httpx.post("http://localhost:8000/estimate", files=files, timeout=60.0)
    response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
    result = MealAnalysis(**response.json()["result"])
    print(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the /estimate endpoint.")
    parser.add_argument("image_filename", help="Path to the image file to use for testing.")
    args = parser.parse_args()
    test_estimate_endpoint(args.image_filename)
