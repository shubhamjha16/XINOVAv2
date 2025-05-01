/**
 * @fileOverview Types and Zod schemas for the analyze-symptoms flow.
 */
import { z } from 'genkit';

// Input schema for the user's symptoms
export const AnalyzeSymptomsInputSchema = z.object({
  symptoms: z.string().min(10).describe('A detailed description of the patient\'s symptoms.'),
});
export type AnalyzeSymptomsInput = z.infer<typeof AnalyzeSymptomsInputSchema>;

// Output schema for potential diseases
export const PotentialDiseaseSchema = z.object({
  disease: z.string().describe('The name of the potential disease.'),
  probability: z.number().min(0).max(1).describe('The estimated probability (0 to 1) of this disease given the symptoms.'),
  reasoning: z.string().describe('A brief explanation linking the symptoms to this potential disease.'),
});
export type PotentialDisease = z.infer<typeof PotentialDiseaseSchema>;

export const AnalyzeSymptomsOutputSchema = z.object({
  possibleDiseases: z.array(PotentialDiseaseSchema).max(5).describe('A list of the top 3-5 most likely diseases based on the symptoms, sorted by probability (highest first).'),
  needsMoreInfo: z.boolean().describe('Indicates if more information is needed for a better assessment.'),
  initialAssessment: z.string().optional().describe('A brief summary assessment based on the provided symptoms.')
});
export type AnalyzeSymptomsOutput = z.infer<typeof AnalyzeSymptomsOutputSchema>;
