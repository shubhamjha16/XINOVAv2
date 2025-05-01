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
  suggestedPrescription: z.string().describe('A textual description of general wellness advice (rest, hydration, etc.), symptom management tips, and guidance on monitoring symptoms. MAY include suggestions for common, generic OVER-THE-COUNTER medication categories or names (e.g., acetaminophen, ibuprofen) **strictly for symptom relief**, heavily emphasizing that this is NOT a medical prescription and consultation with a healthcare professional is required before taking ANY medication. MUST NOT include prescription medications, antibiotics, antivirals, or any treatment targeting the underlying disease cause. MUST reiterate the final assessment recommendation. MUST start with "General Advice (Not a Medical Prescription): ".'),
  importantDisclaimer: z.string().describe('A prominent disclaimer stating this is not a real prescription, cannot replace a doctor\'s consultation, professional advice is needed before taking any medication (even OTC), and symptom relief medication does not cure the illness.')
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;
