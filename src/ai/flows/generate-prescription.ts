'use server';
/**
 * @fileOverview Suggests a general, non-pharmacological prescription based on the finalized potential diagnosis, potentially including common OTC symptom relief suggestions.
 *
 * - generatePrescription - Suggests general advice based on the assessed condition.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import schemas and types from the dedicated types file
import {
    GeneratePrescriptionInputSchema,
    GeneratePrescriptionOutputSchema,
    type GeneratePrescriptionInput,
    type GeneratePrescriptionOutput,
} from '../types/generate-prescription-types';
// Need FinalizeDiagnosisOutputSchema for input schema definition.
// Ensure it is imported correctly in generate-prescription-types.ts


// Prompt to generate the prescription suggestions - Uses imported schemas
const generatePrescriptionPrompt = ai.definePrompt({
  name: 'generatePrescriptionPrompt',
  input: {
    schema: GeneratePrescriptionInputSchema, // Use imported schema
  },
  output: {
    schema: GeneratePrescriptionOutputSchema, // Use imported schema
  },
  prompt: `You are an AI medical assistant providing informational suggestions. **You CANNOT provide medical prescriptions.**

Based on the following final assessment, generate general wellness advice relevant to the most likely condition(s). You may suggest common over-the-counter (OTC) medications STRICTLY for symptom relief where appropriate, but you MUST emphasize these are NOT prescriptions and professional consultation is required before taking anything.

Final Assessment:
---
Most Likely Disease(s):
{{#each finalAssessment.refinedPossibleDiseases}}
- {{disease}} (Refined Probability: {{probability}})
{{/each}}

Assessment Summary: {{finalAssessment.finalAssessment}}
Recommendation: {{finalAssessment.recommendation}}
---

**Task:**
1.  Create a 'suggestedPrescription' text. This should include:
    *   General wellness advice (e.g., rest, hydration, appropriate diet if relevant).
    *   Symptom management tips (e.g., cool compresses for fever).
    *   If relevant and appropriate for **symptom relief only**, you may mention **common, generic OTC medication names** (e.g., "acetaminophen or ibuprofen for fever/pain relief"). **Crucially, always follow such suggestions with a strong warning to consult a doctor or pharmacist before taking any medication.**
    *   Guidance on monitoring symptoms based on the assessment.
    *   Reiteration of the recommendation provided in the final assessment (e.g., "As recommended, please consult your doctor...").
    *   **MUST start this text with:** "General Advice (Not a Medical Prescription): "
2.  Create an 'importantDisclaimer' text: "IMPORTANT: This is general information ONLY and NOT a medical prescription. It does not replace consultation with a qualified healthcare professional. Do not use this information to self-diagnose or self-treat. Always consult your doctor or pharmacist before taking any medication, even over-the-counter ones. Follow your doctor's specific instructions."

Return ONLY the JSON object containing 'suggestedPrescription' and 'importantDisclaimer', adhering to the output schema. Ensure any mention of OTC medication is heavily caveated.`,
});


// Exported function that calls the flow - ONLY export the async function
export async function generatePrescription(input: GeneratePrescriptionInput): Promise<GeneratePrescriptionOutput> {
  // Add basic check to prevent calling if no likely disease was found
  if (!input.finalAssessment || input.finalAssessment.refinedPossibleDiseases.length === 0) {
      console.log("Skipping prescription generation as no likely disease was identified.");
       return {
           suggestedPrescription: "General Advice (Not a Medical Prescription): No specific advice can be given as a likely condition was not determined. Please consult a healthcare professional based on the initial recommendation.",
           importantDisclaimer: "IMPORTANT: This is general information ONLY and NOT a medical prescription. It does not replace consultation with a qualified healthcare professional. Do not use this information to self-diagnose or self-treat. Always consult your doctor or pharmacist before taking any medication, even over-the-counter ones. Follow your doctor's specific instructions."
       };
  }
  return generatePrescriptionFlow(input);
}


// The Genkit flow definition
const generatePrescriptionFlow = ai.defineFlow<
  typeof GeneratePrescriptionInputSchema, // Use imported schema
  typeof GeneratePrescriptionOutputSchema // Use imported schema
>(
  {
    name: 'generatePrescriptionFlow',
    inputSchema: GeneratePrescriptionInputSchema, // Use imported schema
    outputSchema: GeneratePrescriptionOutputSchema, // Use imported schema
  },
  async (input) => {
    console.log('Generating general suggestions for:', input.finalAssessment.refinedPossibleDiseases[0]?.disease);
    const defaultDisclaimer = "IMPORTANT: This is general information ONLY and NOT a medical prescription. It does not replace consultation with a qualified healthcare professional. Do not use this information to self-diagnose or self-treat. Always consult your doctor or pharmacist before taking any medication, even over-the-counter ones. Follow your doctor's specific instructions.";
    const defaultSuggestion = "General Advice (Not a Medical Prescription): Please follow the recommendations provided in the final assessment and consult a healthcare professional.";

    try {
      const response = await generatePrescriptionPrompt(input);
      const output = response.output;

      if (!output) {
        console.error('Generate prescription prompt returned no output.');
        // Return default safe message
        return {
            suggestedPrescription: defaultSuggestion,
            importantDisclaimer: defaultDisclaimer
        };
      }

       // Ensure suggestions start correctly and disclaimer is present
       if (!output.suggestedPrescription.startsWith("General Advice (Not a Medical Prescription):")) {
           output.suggestedPrescription = "General Advice (Not a Medical Prescription): " + output.suggestedPrescription;
       }
       if (!output.importantDisclaimer || output.importantDisclaimer.length < 10) { // Basic check
           output.importantDisclaimer = defaultDisclaimer;
       }


      console.log('General suggestions generated.');
      return output;
    } catch (error) {
      console.error('Error in generatePrescriptionFlow:', error);
      // Return default safe message on error
       return {
           suggestedPrescription: defaultSuggestion,
           importantDisclaimer: defaultDisclaimer
       };
    }
  }
);
