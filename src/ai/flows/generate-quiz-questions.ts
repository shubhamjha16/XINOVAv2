// src/ai/flows/generate-quiz-questions.ts
'use server';

/**
 * @fileOverview Generates a multiple-choice quiz on a given topic with varying difficulty levels.
 *
 * - generateQuizQuestions - A function that generates quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz. This could be a specific subject or a broader area.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  quiz: z.array(
    z.object({
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
    })
  ).describe('An array of quiz questions. If the topic is too broad or ambiguous to generate a meaningful quiz, this array might be empty.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {
    schema: z.object({
      topic: z.string().describe('The topic of the quiz. This could be a specific subject or a broader area.'),
    }),
  },
  output: {
    schema: GenerateQuizQuestionsOutputSchema, // Use the existing schema
  },
  prompt: `You are an expert quiz generator capable of creating engaging multiple-choice questions on a wide range of topics.

Generate exactly 10 multiple-choice questions based on the provided topic: "{{topic}}".

The topic might be broad (like "World History" or "Biology"). If the topic is broad, ensure the questions cover different key aspects or sub-topics within that area to provide a good overview. Try to formulate questions that require understanding and application of knowledge, rather than just simple recall, especially for medium and hard difficulties.

Maintain a balanced difficulty distribution:
- 3 easy questions
- 4 medium questions
- 3 hard questions

Each question MUST adhere strictly to the following format:
- "question": The text of the question.
- "options": An object containing exactly four answer choices, labeled "A", "B", "C", and "D".
- "correct_answer": A single letter ("A", "B", "C", or "D") indicating the correct option.
- "explanation": A concise, one-sentence explanation for why the correct answer is right.
- "difficulty": The difficulty level, strictly one of "easy", "medium", or "hard".

IMPORTANT: Ensure your response is ONLY the JSON object containing the "quiz" array, formatted exactly as specified in the output schema. Do not include any introductory text, explanations outside the question objects, or markdown formatting. If the topic seems too vague, ambiguous, nonsensical, or inappropriate for a quiz, return an empty quiz array: { "quiz": [] }.

Example structure for a single question object:
{
  "question": "What is the powerhouse of the cell?",
  "options": {
    "A": "Nucleus",
    "B": "Ribosome",
    "C": "Mitochondrion",
    "D": "Endoplasmic Reticulum"
  },
  "correct_answer": "C",
  "explanation": "Mitochondria are responsible for generating most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.",
  "difficulty": "easy"
}

Return the final result as a single JSON object: { "quiz": [ /* array of 10 question objects */ ] }`,
});


const generateQuizQuestionsFlow = ai.defineFlow<
  typeof GenerateQuizQuestionsInputSchema,
  typeof GenerateQuizQuestionsOutputSchema
>(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the output conforms to the schema, returning an empty array if null/undefined or if the quiz array is empty
    return output && output.quiz ? output : { quiz: [] };
  }
);
