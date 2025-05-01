'use server';
/**
 * @fileOverview Finalizes a potential diagnosis based on symptoms and clarifying answers.
 *
 * - finalizeDiagnosis - Analyzes all inputs and provides a refined potential diagnosis.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import schemas and types from the dedicated types file
import {
    FinalizeDiagnosisInputSchema,
    FinalizeDiagnosisOutputSchema,
    type FinalizeDiagnosisInput,
    type FinalizeDiagnosisOutput,
    type Answer // Also import Answer type if needed directly in this file
} from '../types/finalize-diagnosis-types';
// We also need PotentialDisease and ClarifyingQuestion types for the input schema definition.
// Ensure they are imported and used correctly in finalize-diagnosis-types.ts


// Prompt for finalizing the diagnosis - Uses imported schemas
const finalizeDiagnosisPrompt = ai.definePrompt({
  name: 'finalizeDiagnosisPrompt',
  input: {
    schema: FinalizeDiagnosisInputSchema, // Use imported schema
  },
  output: {
    schema: FinalizeDiagnosisOutputSchema, // Use imported schema
  },
  prompt: `You are an AI medical assistant providing informational suggestions. This is NOT a substitute for professional medical advice.

Synthesize all the provided information to refine the potential diagnosis:

1.  **Original Symptoms:**
    ---
    {{{symptoms}}}
    ---
2.  **Initial Potential Diseases:**
    ---
    {{#each initialPossibleDiseases}}
    - {{disease}} (Initial Probability: {{probability}})
    {{/each}}
    ---
3.  **Clarifying Questions Asked & Answers Given:**
    ---
    {{#each userAnswers}}
    Q: {{question}}
    A: {{answerText}} (Option {{selectedOption}})
    {{/each}}
    ---

**Task:**
- Re-evaluate the likelihood of the initial potential diseases based on the answers to the clarifying questions.
- Update the probabilities and reasoning for the top 1-3 most likely diseases ('refinedPossibleDiseases'). Sort them by the refined probability (highest first).
- Provide a concise 'finalAssessment' summarizing the findings, explaining how the answers influenced the refined probabilities. **MUST** start with the disclaimer: "Disclaimer: This is NOT a medical diagnosis. "
- Provide a general 'recommendation' based on the assessment (e.g., suggesting consultation, monitoring, or seeking urgent care if specific red flags are present based on symptoms and answers).

Return ONLY the JSON object adhering to the FinalizeDiagnosisOutput schema.

**Example Recommendation:** "Disclaimer: This is NOT a medical diagnosis. Based on your symptoms and answers, [Disease X] appears most likely. It is strongly recommended to consult a healthcare professional for an accurate diagnosis and treatment plan. Monitor for worsening symptoms like high fever or difficulty breathing."`,
});

// Exported function that calls the flow - ONLY export the async function
export async function finalizeDiagnosis(input: FinalizeDiagnosisInput): Promise<FinalizeDiagnosisOutput> {
  return finalizeDiagnosisFlow(input);
}


// The Genkit flow definition
const finalizeDiagnosisFlow = ai.defineFlow<
  typeof FinalizeDiagnosisInputSchema, // Use imported schema
  typeof FinalizeDiagnosisOutputSchema // Use imported schema
>(
  {
    name: 'finalizeDiagnosisFlow',
    inputSchema: FinalizeDiagnosisInputSchema, // Use imported schema
    outputSchema: FinalizeDiagnosisOutputSchema, // Use imported schema
  },
  async (input) => {
    console.log('Finalizing diagnosis based on symptoms and answers.');
    try {
      const response = await finalizeDiagnosisPrompt(input);
      const output = response.output;

      if (!output) {
        console.error('Finalize diagnosis prompt returned no output.');
        throw new Error('Failed to get final assessment from AI model.');
      }

       // Ensure disclaimer is present
       if (!output.finalAssessment.startsWith('Disclaimer:')) {
         output.finalAssessment = "Disclaimer: This is NOT a medical diagnosis. " + output.finalAssessment;
       }
       if (!output.recommendation.startsWith('Disclaimer:')) {
          // Although prompt asks for it, add redundancy
          output.recommendation = "Disclaimer: This information is not a substitute for professional medical advice. " + output.recommendation;
       }


      console.log('Final diagnosis assessment successful:', output.refinedPossibleDiseases);
      return output;
    } catch (error) {
      console.error('Error in finalizeDiagnosisFlow:', error);
      // Return a default error structure
       return {
           refinedPossibleDiseases: [],
           finalAssessment: "Disclaimer: This is NOT a medical diagnosis. An error occurred during the final analysis. Please consult a healthcare professional.",
           recommendation: "Disclaimer: This information is not a substitute for professional medical advice. Due to an error, specific recommendations cannot be provided. Please consult a healthcare professional."
       };
    }
  }
);
