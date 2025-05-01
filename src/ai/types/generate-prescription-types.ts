/**
 * @fileOverview Types and Zod schemas for the generate-prescription flow.
 */
import { z } from 'genkit';
// Import dependent schema/type
import { FinalizeDiagnosisOutputSchema } from './finalize-diagnosis-types';

// Input schema: Requires the finalized diagnosis output
export const GeneratePrescriptionInputSchema = z.object({
  finalAssessment: FinalizeDiagnosisOutputSchema.describe('The finalized assessment object, including refined diseases and recommendations.'),
});
export type GeneratePrescriptionInput = z.infer<typeof GeneratePrescriptionInputSchema>;


// Output schema for the suggested prescription
export const GeneratePrescriptionOutputSchema = z.object({
  suggestedPrescription: z.string().describe('A textual description of general, non-pharmacological advice and lifestyle recommendations based on the most likely condition(s). MUST emphasize that this is not a real prescription and professional medical advice is necessary. Include advice on rest, hydration, diet, symptom monitoring, and when to seek further medical help based on the final assessment recommendation.'),
  importantDisclaimer: z.string().describe('A prominent disclaimer stating this is not a real prescription and cannot replace a doctor\'s consultation.')
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;
