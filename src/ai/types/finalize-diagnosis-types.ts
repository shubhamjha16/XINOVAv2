/**
 * @fileOverview Types and Zod schemas for the finalize-diagnosis flow.
 */
import { z } from 'genkit';
// Import dependent schemas/types
import { PotentialDiseaseSchema } from './analyze-symptoms-types';
import { ClarifyingQuestionSchema } from './generate-clarifying-questions-types';

// Schema for user's answers to clarifying questions
export const AnswerSchema = z.object({
  question: z.string(),
  selectedOption: z.enum(['A', 'B', 'C', 'D']), // Assuming options are A, B, C, D
  answerText: z.string().describe('The text content of the selected option.'),
});
export type Answer = z.infer<typeof AnswerSchema>;

// Input schema for finalizing diagnosis
export const FinalizeDiagnosisInputSchema = z.object({
  symptoms: z.string().describe('The original symptoms provided by the user.'),
  initialPossibleDiseases: z.array(PotentialDiseaseSchema).describe('The list of potential diseases identified in the initial analysis.'),
  clarifyingQuestions: z.array(ClarifyingQuestionSchema).describe('The clarifying questions that were asked.'),
  userAnswers: z.array(AnswerSchema).describe('The user\'s answers to the clarifying questions.'),
});
export type FinalizeDiagnosisInput = z.infer<typeof FinalizeDiagnosisInputSchema>;

// Output schema for the final assessment
export const FinalizeDiagnosisOutputSchema = z.object({
  refinedPossibleDiseases: z.array(
      z.object({
        disease: z.string().describe('The name of the potential disease.'),
        probability: z.number().min(0).max(1).describe('The *refined* estimated probability (0 to 1) considering all information.'),
        reasoning: z.string().describe('Updated reasoning incorporating answers to clarifying questions.'),
      })
  ).max(3).describe('A refined list of the top 1-3 most likely diseases, sorted by probability (highest first).'),
  finalAssessment: z.string().describe('A summary assessment incorporating all information gathered. MUST start with the disclaimer.'),
  recommendation: z.string().describe('General advice, e.g., "Consult a doctor", "Monitor symptoms", "Seek urgent care if symptoms worsen".'),
});
export type FinalizeDiagnosisOutput = z.infer<typeof FinalizeDiagnosisOutputSchema>;
