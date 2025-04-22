# Calorie Cam Application Plan

## Phase 1: Project Setup

1.  **Directory Structure:**
    *   Create `backend` and `frontend` directories in the project root (`/home/gregus/calorie-cam`).
2.  **Backend Setup (FastAPI):**
    *   Navigate to `backend`.
    *   Create Python virtual environment: `python3 -m venv venv`.
    *   Activate environment: `source venv/bin/activate`.
    *   Install dependencies: `pip install fastapi uvicorn python-multipart google-cloud-aiplatform google-generativeai pillow python-dotenv genkit`.
    *   Create basic FastAPI app: `backend/main.py`.
3.  **Frontend Setup (React + shadcn/ui + Tailwind):**
    *   Navigate to `frontend`.
    *   Initialize React project (Vite + TS): `npm create vite@latest . -- --template react-ts`.
    *   Install dependencies: `npm install`.
    *   Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`.
    *   Initialize Tailwind config: `npx tailwindcss init -p`.
    *   Configure Tailwind `tailwind.config.js`.
    *   Configure Tailwind `src/index.css`.
    *   Configure `tsconfig.json` for path aliases (`@/*`).
    *   Initialize shadcn/ui: `npx shadcn@latest init`. (Answer prompts).
    *   Install shadcn/ui components: `npx shadcn@latest add button input card label`.
    *   Install `axios`: `npm install axios`.

## Phase 2: Backend Development

1.  **API Endpoint (`/estimate`):**
    *   Define POST endpoint in `backend/main.py`.
    *   Accept image file uploads (`UploadFile`).
2.  **Genkit Integration:**
    *   Configure Genkit (e.g., Gemini Pro Vision via `.env` file).
    *   Define `meal_analyzer_flow` taking image data.
    *   Create prompt for model to return JSON: `{ "calories": number, "protein": number, "carbohydrates": number, "fat": number }`.
3.  **Endpoint Logic:**
    *   Read uploaded image data.
    *   Invoke `meal_analyzer_flow`.
    *   Handle errors.
    *   Return JSON response.
4.  **CORS:** Configure FastAPI CORS middleware for frontend origin (e.g., `http://localhost:5173`).
5.  **Run Backend:** `uvicorn backend.main:app --reload --port 8000`.

## Phase 3: Frontend Development

1.  **UI Components (`frontend/src/components`):**
    *   `ImageUploader.tsx`: File input (`<Input type="file">`), image preview.
    *   `ResultDisplay.tsx`: Display results using `<Card>`.
2.  **Main App (`frontend/src/App.tsx`):**
    *   Manage state (`useState`): selected file, results, loading, errors.
    *   Integrate `ImageUploader` and `ResultDisplay`.
    *   Add submit `<Button>`.
3.  **API Interaction:**
    *   Handle form submission.
    *   Set loading state.
    *   Create `FormData` with image.
    *   Use `axios` POST to `http://localhost:8000/estimate`.
    *   Update state on success/error.
4.  **Styling:** Use shadcn/ui components and Tailwind CSS.
5.  **Run Frontend:** `npm run dev` (usually runs on `http://localhost:5173`).

## Key Considerations

*   **API Keys:** Store securely (e.g., `backend/.env`).
*   **Error Handling:** Implement user-friendly error display on frontend.
*   **Result Format:** Confirm JSON structure is sufficient.
