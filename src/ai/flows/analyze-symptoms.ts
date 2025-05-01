'use server';
/**
 * @fileOverview Analyzes user symptoms and suggests potential diseases.
 *
 * - analyzeSymptoms - Analyzes symptoms and returns potential diseases with probabilities.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import schemas and types from the dedicated types file
import {
  AnalyzeSymptomsInputSchema,
  AnalyzeSymptomsOutputSchema,
  type AnalyzeSymptomsInput,
  type AnalyzeSymptomsOutput,
} from '../types/analyze-symptoms-types';


// Prompt for analyzing symptoms - Uses imported schemas
const analyzeSymptomsPrompt = ai.definePrompt({
  name: 'analyzeSymptomsPrompt',
  input: {
    schema: AnalyzeSymptomsInputSchema, // Use imported schema
  },
  output: {
    schema: AnalyzeSymptomsOutputSchema, // Use imported schema
  },
  prompt: `You are an AI medical assistant designed to analyze patient symptoms and suggest potential diagnoses for informational purposes ONLY. You MUST NOT provide definitive diagnoses or replace a professional medical consultation.

Analyze the following symptoms described by the user:
---
{{{symptoms}}}
---

Based ONLY on these symptoms, identify the top 3-5 most probable diseases. For each disease:
1.  Provide the disease name.
2.  Estimate a probability (between 0.0 and 1.0) representing the likelihood based *solely* on the provided symptoms. Be conservative with high probabilities unless symptoms are highly specific.
3.  Provide a brief reasoning connecting the symptoms to the potential disease.

Determine if the provided symptoms are sufficient for a preliminary assessment or if more clarifying questions would be highly beneficial ('needsMoreInfo').

Provide a brief 'initialAssessment' summarizing the situation based on the symptoms (e.g., "Symptoms suggest a possible respiratory infection, but more information is needed to differentiate.").

Return the result ONLY as a JSON object adhering to the AnalyzeSymptomsOutput schema. Ensure the 'possibleDiseases' array is sorted by 'probability' in descending order.

**IMPORTANT DISCLAIMER:** Include this exact text at the beginning of the 'initialAssessment' field: "Disclaimer: This is NOT a medical diagnosis. Consult a healthcare professional for accurate advice. "`,
});

// Exported function that calls the flow - ONLY export the async function
export async function analyzeSymptoms(input: AnalyzeSymptomsInput): Promise<AnalyzeSymptomsOutput> {
  return analyzeSymptomsFlow(input);
}

// The Genkit flow definition
const analyzeSymptomsFlow = ai.defineFlow<
  typeof AnalyzeSymptomsInputSchema, // Use imported schema
  typeof AnalyzeSymptomsOutputSchema // Use imported schema
>(
  {
    name: 'analyzeSymptomsFlow',
    inputSchema: AnalyzeSymptomsInputSchema, // Use imported schema
    outputSchema: AnalyzeSymptomsOutputSchema, // Use imported schema
  },
  async (input) => {
    console.log('Analyzing symptoms:', input.symptoms);
    try {
      const response = await analyzeSymptomsPrompt(input);
      const output = response.output;

      if (!output) {
        console.error('Symptom analysis prompt returned no output.');
        throw new Error('Failed to get analysis from AI model.');
      }
      // Ensure disclaimer is present, add if missing
      if (output.initialAssessment && !output.initialAssessment.startsWith('Disclaimer:')) {
        output.initialAssessment = "Disclaimer: This is NOT a medical diagnosis. Consult a healthcare professional for accurate advice. " + output.initialAssessment;
      } else if (!output.initialAssessment) {
         output.initialAssessment = "Disclaimer: This is NOT a medical diagnosis. Consult a healthcare professional for accurate advice. Analysis based on provided symptoms.";
      }

      console.log('Symptom analysis successful:', output.possibleDiseases);
      return output;
    } catch (error) {
      console.error('Error in analyzeSymptomsFlow:', error);
      // Return a default error structure
       return {
           possibleDiseases: [],
           needsMoreInfo: true,
           initialAssessment: "Disclaimer: This is NOT a medical diagnosis. Consult a healthcare professional for accurate advice. An error occurred during analysis. Please try again or provide more detailed symptoms."
       };
    }
  }
);
