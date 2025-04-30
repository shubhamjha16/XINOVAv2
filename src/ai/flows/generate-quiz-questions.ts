// src/ai/flows/generate-quiz-questions.ts
'use server';

/**
 * @fileOverview Generates a multiple-choice quiz on a given topic with varying difficulty levels.
 * First generates background information on the topic, then uses that information to create the quiz.
 *
 * - generateQuizQuestions - A function that generates quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema remains the same for the user-facing function
const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz. This could be a specific subject or a broader area.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

// Output schema remains the same for the user-facing function
const QuizQuestionSchema = z.object({
    question: z.string().describe('The question text.'),
    options: z.object({
      A: z.string().describe('Option A.'),
      B: z.string().describe('Option B.'),
      C: z.string().describe('Option C.'),
      D: z.string().describe('Option D.'),
    }).describe('The answer choices.'),
    correct_answer: z.enum(['A', 'B', 'C', 'D']).describe('The correct option.'),
    explanation: z.string().describe('A brief explanation of the correct answer.'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
  });

const GenerateQuizQuestionsOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions. If the topic is too broad or ambiguous to generate a meaningful quiz, this array might be empty.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;


// Schema for the intermediate step of generating topic information
const GenerateTopicInfoInputSchema = z.object({
  topic: z.string().describe('The topic to generate information about.'),
});
const GenerateTopicInfoOutputSchema = z.object({
  information: z.string().describe('Generated background information about the topic, focusing on key facts, concepts, and sub-topics suitable for quiz questions. Provide a concise overview (around 200-300 words).'),
});

// Schema for the final step of generating the quiz using topic + information
const GenerateQuizFromInfoInputSchema = z.object({
  topic: z.string().describe('The original topic of the quiz.'),
  information: z.string().describe('The generated background information to use as context for the quiz questions.'),
});


// Prompt to generate background information
const generateTopicInfoPrompt = ai.definePrompt({
  name: 'generateTopicInfoPrompt',
  input: {
    schema: GenerateTopicInfoInputSchema,
  },
  output: {
    schema: GenerateTopicInfoOutputSchema,
  },
  prompt: `You are an expert researcher. Generate concise background information (around 200-300 words) about the topic: "{{topic}}".

Focus on key facts, important concepts, relevant sub-topics, and details that would be suitable for creating multiple-choice quiz questions across easy, medium, and hard difficulty levels. Ensure the information is accurate and covers the core aspects of the topic.

Return the information as a single string in the "information" field of the JSON output.`,
});


// Prompt to generate the quiz using the topic and generated information
const generateQuizFromInfoPrompt = ai.definePrompt({
  name: 'generateQuizFromInfoPrompt',
  input: {
    schema: GenerateQuizFromInfoInputSchema,
  },
  output: {
    schema: GenerateQuizQuestionsOutputSchema, // Use the final output schema
  },
  prompt: `You are an expert quiz generator capable of creating engaging multiple-choice questions.

Use the following background information to generate exactly 10 multiple-choice questions about the topic "{{topic}}".

Background Information:
---
{{{information}}}
---

Ensure the questions are derived from or directly related to the provided background information.

Maintain a balanced difficulty distribution:
- 3 easy questions
- 4 medium questions
- 3 hard questions

Each question MUST adhere strictly to the following format:
- "question": The text of the question.
- "options": An object containing exactly four answer choices, labeled "A", "B", "C", and "D".
- "correct_answer": A single letter ("A", "B", "C", or "D") indicating the correct option.
- "explanation": A concise, one-sentence explanation for why the correct answer is right, based on the provided information.
- "difficulty": The difficulty level, strictly one of "easy", "medium", or "hard".

IMPORTANT: Ensure your response is ONLY the JSON object containing the "quiz" array, formatted exactly as specified in the output schema. Do not include any introductory text, explanations outside the question objects, or markdown formatting. If the provided information is insufficient or nonsensical, return an empty quiz array: { "quiz": [] }.

Example structure for a single question object:
{
  "question": "Based on the info, what is the powerhouse of the cell?",
  "options": {
    "A": "Nucleus",
    "B": "Ribosome",
    "C": "Mitochondrion",
    "D": "Endoplasmic Reticulum"
  },
  "correct_answer": "C",
  "explanation": "Mitochondria generate most of the cell's ATP energy supply.",
  "difficulty": "easy"
}

Return the final result as a single JSON object: { "quiz": [ /* array of 10 question objects */ ] }`,
});


// Exported function - calls the flow
export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

// The main flow orchestrating the two steps
const generateQuizQuestionsFlow = ai.defineFlow<
  typeof GenerateQuizQuestionsInputSchema,       // Takes the original topic input
  typeof GenerateQuizQuestionsOutputSchema     // Returns the final quiz output
>(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    // Step 1: Generate background information
    const infoResponse = await generateTopicInfoPrompt({ topic: input.topic });
    const information = infoResponse.output?.information;

    if (!information || information.trim() === '') {
      console.warn(`Could not generate sufficient information for topic: ${input.topic}`);
      return { quiz: [] }; // Return empty quiz if info generation fails
    }

    // Step 2: Generate quiz using the topic and the generated information
    const quizResponse = await generateQuizFromInfoPrompt({
      topic: input.topic,
      information: information,
    });

    // Ensure the output conforms to the schema, returning an empty array if null/undefined or if the quiz array is empty
    return quizResponse.output && quizResponse.output.quiz ? quizResponse.output : { quiz: [] };
  }
);
