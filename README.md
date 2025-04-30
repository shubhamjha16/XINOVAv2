# Xinova - AI Quiz Generator

This is a Next.js application that uses Generative AI (Google AI via Genkit) to generate background information, flowcharts, and quizzes on Computer Science topics.

## Features

-   **Topic Input:** Enter any Computer Science topic.
-   **Information Generation:** Get detailed background information on the topic.
-   **Flowchart Generation:** Visualize the key steps or concepts with a textual flowchart.
-   **Quiz Generation:** Test your knowledge with 15 multiple-choice questions (including coding questions) sorted by difficulty.
-   **Interactive Quiz:** Get immediate feedback and explanations for your answers.

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

1.  The user enters a Computer Science topic on the main page (`src/app/page.tsx`).
2.  The `generateQuizQuestions` Genkit flow (`src/ai/flows/generate-quiz-questions.ts`) is invoked.
3.  This flow first calls the `generateTopicInfoPrompt` to generate background information using the AI model.
4.  Then, it calls `generateFlowchart` (`src/ai/flows/generate-flowchart.ts`) to create a textual flowchart from the information.
5.  Finally, it calls `generateQuizFromInfoPrompt` to generate 15 multiple-choice questions based on the information.
6.  The generated content (information, flowchart, and quiz) is returned to the frontend and displayed to the user.
7.  The quiz interface allows the user to answer questions, receive feedback, and track their score.

## Project Structure

-   `src/app/`: Next.js App Router pages and layout.
-   `src/ai/`: Contains Genkit configuration, flows, and prompts.
    -   `ai-instance.ts`: Configures the Genkit instance and AI model.
    -   `dev.ts`: Entry point for the Genkit development server.
    -   `flows/`: Contains the Genkit flows for generating content.
-   `src/components/`: Reusable UI components (mostly ShadCN).
-   `src/hooks/`: Custom React hooks (e.g., `useToast`, `useMobile`).
-   `src/lib/`: Utility functions.
-   `public/`: Static assets.
-   `styles/`: Global CSS and Tailwind configuration.