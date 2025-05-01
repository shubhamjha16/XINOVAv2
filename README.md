# Xinova - AI Symptom Checker (Informational Use Only)

This is a Next.js application that uses Generative AI (Google AI via Genkit) to provide a preliminary analysis of user-described symptoms. **This tool is for informational purposes only and does NOT provide medical diagnoses or replace professional medical advice.**

## Features

-   **Symptom Input:** Describe your symptoms in detail.
-   **Initial Analysis:** Get a list of potential conditions based on your symptoms, including estimated probabilities and reasoning (AI-generated, not a diagnosis).
-   **Clarifying Questions:** Answer AI-generated multiple-choice questions to help refine the analysis.
-   **Refined Assessment:** View an updated list of potential conditions based on your answers.
-   **General Advice:** Receive general, non-pharmacological suggestions related to the potential conditions (e.g., rest, hydration).

**IMPORTANT DISCLAIMER:** This application uses AI and is not a substitute for professional medical evaluation. Always consult a qualified healthcare provider for diagnosis and treatment.

## Tech Stack

-   **Frontend:** Next.js (App Router), React, TypeScript
-   **UI:** ShadCN UI, Tailwind CSS
-   **AI:** Genkit, Google Generative AI (Gemini)
-   **Styling:** Tailwind CSS

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm, yarn, or pnpm

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    *   Create a `.env` file in the root of the project.
    *   Add your Google Generative AI API key:
        ```env
        # .env
        GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_API_KEY_HERE
        ```
    *   You can obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   *(Optional)* If you configure other models (like Deepseek), add their keys:
        ```env
        # DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
        ```

### Running the Development Server

1.  **Start the Genkit development server (in a separate terminal):**
    *   This runs the AI flows locally.
    ```bash
    npm run genkit:dev
    # Or for automatic reloading on changes:
    # npm run genkit:watch
    ```

2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:9002](http://localhost:9002) (or the specified port) in your browser to see the application.

## How it Works

1.  The user describes their symptoms on the main page (`src/app/page.tsx`).
2.  The `analyzeSymptoms` Genkit flow (`src/ai/flows/analyze-symptoms.ts`) is invoked. It identifies potential conditions and probabilities based solely on the input.
3.  If the AI determines more information is needed, the `generateClarifyingQuestions` flow (`src/ai/flows/generate-clarifying-questions.ts`) creates multiple-choice questions.
4.  The user answers these questions on the frontend.
5.  The `finalizeDiagnosis` flow (`src/ai/flows/finalize-diagnosis.ts`) takes the original symptoms, initial analysis, questions, and answers to provide a refined assessment and general recommendations.
6.  The `generatePrescription` flow (`src/ai/flows/generate-prescription.ts`) generates general, non-pharmacological advice based on the final assessment.
7.  Each step's results are displayed sequentially to the user, emphasizing the informational nature and the need for professional consultation.

## Project Structure

-   `src/app/`: Next.js App Router pages and layout.
    -   `page.tsx`: The main UI for the symptom checker workflow.
-   `src/ai/`: Contains Genkit configuration, flows, and prompts.
    -   `ai-instance.ts`: Configures the Genkit instance and AI model.
    -   `dev.ts`: Entry point for the Genkit development server.
    -   `flows/`: Contains the Genkit flows for symptom analysis, question generation, final assessment, and advice generation.
-   `src/components/`: Reusable UI components (mostly ShadCN).
-   `src/hooks/`: Custom React hooks (e.g., `useToast`, `useMobile`).
-   `src/lib/`: Utility functions.
-   `public/`: Static assets.
-   `styles/`: Global CSS and Tailwind configuration.

## Disclaimer

This project is intended for educational and illustrative purposes only. It demonstrates the use of generative AI but should **NEVER** be used for actual medical diagnosis or treatment decisions. Medical AI requires rigorous validation, ethical considerations, and regulatory compliance not implemented here.
