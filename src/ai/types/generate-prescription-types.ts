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
  suggestedPrescription: z.string().describe('A textual description of general advice, lifestyle recommendations, and symptom management tips based on the most likely condition(s). May include suggestions for common, generic OTC medications for symptom relief ONLY, heavily emphasizing that this is NOT a medical prescription and consultation with a healthcare professional is required before taking any medication. MUST include advice on rest, hydration, diet, symptom monitoring, and reiterate the final assessment recommendation. MUST start with "General Advice (Not a Medical Prescription): ".'),
  importantDisclaimer: z.string().describe('A prominent disclaimer stating this is not a real prescription, cannot replace a doctor\'s consultation, and professional advice is needed before taking any medication.')
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;
