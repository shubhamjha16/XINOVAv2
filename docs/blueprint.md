# **App Name**: Quiz Master

## Core Features:

- Question Generation: Generate multiple-choice questions based on user-provided topic and difficulty levels using a generative AI tool.
- Quiz Display: Display the generated questions with multiple choice options in a clear, user-friendly format.
- Answer Validation: Provide immediate feedback on selected answers, highlighting correct and incorrect choices.

## Style Guidelines:

- Primary color: Dark blue (#2c3e50) for a professional look.
- Secondary color: Light gray (#ecf0f1) for backgrounds and content separation.
- Accent: Teal (#3498db) for interactive elements and highlights.
- Clean and readable sans-serif fonts for questions and options.
- Simple icons for feedback (correct/incorrect) and navigation.
- Use a clear, single-column layout for easy readability.

## Original User Request:
Generate 10 multiple choice questions on the topic: "{{topic}}".

3 easy questions
4 medium questions
3 hard questions
Each question must have:

"question": The question text
"options": 4 answer choices (A, B, C, D)
"correct_answer": The correct option (A, B, C, or D)
"explanation": 1-line explanation of the correct answer
"difficulty": "easy", "medium", or "hard"
Return the result in the following format:

{ "quiz": [ { "question": "What is the capital of France?", "options": { "A": "Berlin", "B": "Madrid", "C": "Paris", "D": "Rome" }, "correct_answer": "C", "explanation": "Paris is the capital of France.", "difficulty": "easy" }, ... ] }
  