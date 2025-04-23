import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from "node:fs";

// Get the prompt from command line arguments
const fname = process.argv[2] || '../backend/test_image.jpg';

// Load API key from .env
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('API_KEY not set in .env file.');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);
const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

const prompt = `
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
    'box_2d': [393, 65, 560, 206]}]
    `;

function extractJSON(text) {
  const lines = text.split(/\r?\n/); // Split on all line breaks
  const jsonText = lines.length > 2 
    ? lines.slice(1, -1) // Exclude first and last lines
    : []; // Return empty array for 2 or fewer lines

  return JSON.parse(jsonText.join(" "));

}

async function main() {
  const base64ImageFile = fs.readFileSync(fname, {
    encoding: "base64",
  });
  
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64ImageFile,
      },
    },
    { text: prompt },
  ];
  
  const result = await model.generateContent(contents);
  const jsonObj = extractJSON(result.response.candidates[0].content.parts[0].text);
  console.log(jsonObj);

}


main();
