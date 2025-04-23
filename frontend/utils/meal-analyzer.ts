import { GoogleGenerativeAI } from "@google/generative-ai"
import test from "node:test"

interface Ingredient {
  ingredient: string
  amount: string
  calories: number
  protein: number
  fat: number
  carbs: number
  box_2d: number[]
}

interface MealAnalysis {
  ingredients: Ingredient[]
}

// Helper function to convert Blob to Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // The result includes the data URL prefix (e.g., "data:image/jpeg;base64,"),
      // so we need to remove it.
      const base64String = reader.result?.toString().split(",")[1]
      if (base64String) {
        resolve(base64String)
      } else {
        reject(new Error("Failed to convert blob to base64"))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Helper function to extract JSON from the model's response
function extractJSON(text: string): Ingredient[] {
  try {
    // const lines = text.split('\n'); // Split on all line breaks
    // const jsonText = lines.slice(1, -1) // Exclude first and last lines
    // return JSON.parse(jsonText.join(''));
    const lines=text.slice(7,-3).replace(/'/g,'"');
    return JSON.parse(lines);
  } catch (error) {
    console.error("Error parsing JSON from text:", text, error)
    throw new Error("Failed to parse JSON response from AI.")
  }
}

async function mealAnalyzerFlow(imageUrl: string): Promise<MealAnalysis> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  if (!apiKey) {
    console.error("NEXT_PUBLIC_GOOGLE_API_KEY not set.")
    throw new Error("API key not configured.")
  }

  const ai = new GoogleGenerativeAI(apiKey)
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-001" }) // Using flash model as in test script

  const prompt = `
You are an expert food content analyzer and nutritioninst. You have a picture of a meal.
Determine the ingredients, estimate the amounts, calories per ingredient, protein, carbs,
and fat. Also find bounding boxes in the image for each ingredient.
Return a plain JSON object (an array of ingredients) with one key per ingredient. Keys should be 'ingredient' with sub-keys
'amount', 'calories','protein','fat','carbs','box_2d'. Example return schema is shown below:
[{
    'ingredient' : 'Proscuito',
    'amount':       '1 cup',
    'calories':     100,
    'protein':       20,
    'carbs': 30,
    'fat':          10,
    'box_2d': [393, 65, 560, 206]}]
Ensure the output is ONLY the JSON array, without any introductory text, markdown formatting (like \`\`\`json), or closing remarks.
    `

  try {
    // 1. Fetch the image blob from the object URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const imageBlob = await response.blob()

    // 2. Convert the blob to base64
    const base64ImageData = await blobToBase64(imageBlob)

    // 3. Prepare the content for the API
    const contents = [
      {
        inlineData: {
          mimeType: imageBlob.type, // Use the actual mime type from the blob
          data: base64ImageData,
        },
      },
      { text: prompt },
    ]

    // 4. Call the Generative AI API
    console.log("Sending request to Generative AI...")
    // Pass the contents array directly as per library examples/error message
    const result = await model.generateContent(contents)
    console.log("Received response from Generative AI.")

    // 5. Extract and parse the JSON response
    const ingredients = extractJSON(result.response.candidates[0].content.parts[0].text);

    return { ingredients }
  } catch (error) {
    console.error("Error in mealAnalyzerFlow:", error)
    // Re-throw the error so the calling function can handle it
    throw error
  }
}

export { mealAnalyzerFlow }
export type { MealAnalysis, Ingredient } // Export types if needed elsewhere
