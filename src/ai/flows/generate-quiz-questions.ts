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
  topic: z.string().describe('The topic of the quiz.'),
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
  ).describe('An array of quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {
    schema: z.object({
      topic: z.string().describe('The topic of the quiz.'),
    }),
  },
  output: {
    schema: z.object({
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
      ).describe('An array of quiz questions.'),
    }),
  },
  prompt: `You are a quiz generator. Generate 10 multiple choice questions on the topic: "{{topic}}".

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

{ "quiz": [ { "question": "What is the capital of France?", "options": { "A": "Berlin", "B": "Madrid", "C": "Paris", "D": "Rome" }, "correct_answer": "C", "explanation": "Paris is the capital of France.", "difficulty": "easy" }, ... ] }`,
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
    return output!;
  }
);
