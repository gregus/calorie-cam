# backend/genkit_flows.py

import os
from dotenv import load_dotenv
import google.generativeai as genai
import base64
import json
from pydantic import BaseModel
from typing import List

class Ingredient(BaseModel):
    ingredient: str
    amount: str
    calories: float
    protein: float
    fat: float
    carbs: float
    box_2d: List[float]

class MealAnalysis(BaseModel):
    ingredients: List[Ingredient]

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# @title Parsing JSON output
def parse_json(json_output: str):
    # Parsing out the markdown fencing
    lines = json_output.splitlines()
    for i, line in enumerate(lines):
        if line == "```json":
            json_output = "\n".join(lines[i+1:])  # Remove everything before "```json"
            json_output = json_output.split("```")[0]  # Remove everything after the closing "```"
            break  # Exit the loop once "```json" is found
    return json_output

async def meal_analyzer_flow(image: bytes):
    model = genai.GenerativeModel('gemini-2.0-flash-001')
    image_base64 = base64.b64encode(image).decode('utf-8')
  
    # prompt = f"""What is the estimated calorie, protein, carbs, and fat content of the food in this image? 
    #               Also, what are the ingredients. Return a plain JSON object with keys 'ingredients', 'calories', 
    #               'protein', 'carbs', and 'fat'. Do not include any additional text or markdown formatting."""

    prompt = """
        You are an expert food content analyzer and nutritioninst. You have a picture of a meal.
        Determine the ingredients, estimate the amounts, calories per ingredient, protein, carbs, 
        and fat. Also find bounding boxes in the image for each ingredient.
        Return a plain JSON object with one key per ingredient.  Keys should be 'ingredient' with sub-keys 
        'amount', 'calories','protein','fat','carbs','box_2d'. Example return schema is shown below:
        [{
            'ingredient' : 'Proscuito',
            'amount':       '1 cup',
            'calories':     100,
            'protein':       20,
            'carbs': 30,
            'fat':          10,
            'box_2d': [393, 65, 560, 206]}]"""

    response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_base64}])
    json_data = json.loads(parse_json(response.text))
    ingredients = [Ingredient(**item) for item in json_data]
    meal_analysis = MealAnalysis(ingredients=ingredients)
    return meal_analysis
