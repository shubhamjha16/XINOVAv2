/**
 * @fileOverview Types and Zod schemas for the generate-clarifying-questions flow.
 */
import { z } from 'genkit';
// Import dependent schema/type
import { PotentialDiseaseSchema } from './analyze-symptoms-types';

// Input schema: Requires original symptoms and the list of potential diseases
export const GenerateClarifyingQuestionsInputSchema = z.object({
  symptoms: z.string().describe('The original symptoms provided by the user.'),
  possibleDiseases: z.array(PotentialDiseaseSchema).describe('The list of potential diseases identified in the initial analysis.'),
});
export type GenerateClarifyingQuestionsInput = z.infer<typeof GenerateClarifyingQuestionsInputSchema>;

// Schema for a single clarifying question (MCQ format)
export const ClarifyingQuestionSchema = z.object({
  question: z.string().describe('The text of the clarifying question.'),
  options: z.object({
    A: z.string().describe('Option A (e.g., Yes, No, Specific symptom detail).'),
    B: z.string().describe('Option B.'),
    C: z.string().optional().describe('Option C (optional).'),
    D: z.string().optional().describe('Option D (optional).'),
  }).describe('The answer choices for the question.'),
   // Note: We don't have a 'correct_answer' here as it depends on the user's actual condition.
   // The 'final diagnosis' step will interpret the answers.
});
export type ClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;

// Output schema for the list of questions
export const GenerateClarifyingQuestionsOutputSchema = z.object({
  clarifyingQuestions: z.array(ClarifyingQuestionSchema).max(5).describe('A list of 3-5 multiple-choice questions to help differentiate between the possible diseases or gather crucial missing details.'),
});
export type GenerateClarifyingQuestionsOutput = z.infer<typeof GenerateClarifyingQuestionsOutputSchema>;
