'use server';
/**
 * @fileOverview Generates clarifying questions based on initial symptom analysis.
 *
 * - generateClarifyingQuestions - Generates questions to refine diagnosis.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import schemas and types from the dedicated types file
import {
    GenerateClarifyingQuestionsInputSchema,
    GenerateClarifyingQuestionsOutputSchema,
    type GenerateClarifyingQuestionsInput,
    type GenerateClarifyingQuestionsOutput
} from '../types/generate-clarifying-questions-types';
// Need PotentialDisease type for input schema, import from its type file
// Note: This file doesn't directly use PotentialDisease, but the schema definition relies on it indirectly via GenerateClarifyingQuestionsInputSchema.
// Ensure the schema definition in generate-clarifying-questions-types.ts correctly imports and uses PotentialDiseaseSchema.


// Prompt to generate clarifying questions - Uses imported schemas
const generateClarifyingQuestionsPrompt = ai.definePrompt({
  name: 'generateClarifyingQuestionsPrompt',
  input: {
    schema: GenerateClarifyingQuestionsInputSchema, // Use imported schema
  },
  output: {
    schema: GenerateClarifyingQuestionsOutputSchema, // Use imported schema
  },
  prompt: `You are an AI medical assistant. Based on the initial symptoms and the list of potential diseases, generate 3-5 specific multiple-choice questions (MCQs) to help clarify the diagnosis.

Original Symptoms:
---
{{{symptoms}}}
---

Potential Diseases Identified:
---
{{#each possibleDiseases}}
- {{disease}} (Probability: {{probability}}, Reasoning: {{reasoning}})
{{/each}}
---

Focus the questions on:
1.  Differentiating factors between the top potential diseases.
2.  Severity or specific characteristics of the symptoms (e.g., "Is the cough dry or productive?", "Rate the pain on a scale of 1-10").
3.  Presence or absence of key associated symptoms not mentioned initially.
4.  Duration or onset of symptoms.

Each question MUST be in a multiple-choice format with 2-4 distinct options (A, B, C, D). Frame questions clearly.

Example Question Structure:
{
  "question": "How long have you had the fever?",
  "options": { "A": "Less than 2 days", "B": "2-5 days", "C": "More than 5 days", "D": "No fever" }
}

Return ONLY the JSON object containing the 'clarifyingQuestions' array, adhering to the output schema. Do not include explanations or introductory text. If the initial analysis was sufficient or no meaningful clarifying questions can be derived, return an empty array: { "clarifyingQuestions": [] }.`,
});


// Exported function that calls the flow - ONLY export the async function
export async function generateClarifyingQuestions(input: GenerateClarifyingQuestionsInput): Promise<GenerateClarifyingQuestionsOutput> {
  return generateClarifyingQuestionsFlow(input);
}


// The Genkit flow definition
const generateClarifyingQuestionsFlow = ai.defineFlow<
  typeof GenerateClarifyingQuestionsInputSchema, // Use imported schema
  typeof GenerateClarifyingQuestionsOutputSchema // Use imported schema
>(
  {
    name: 'generateClarifyingQuestionsFlow',
    inputSchema: GenerateClarifyingQuestionsInputSchema, // Use imported schema
    outputSchema: GenerateClarifyingQuestionsOutputSchema, // Use imported schema
  },
  async (input) => {
    console.log('Generating clarifying questions for:', input.possibleDiseases.map(d => d.disease));
    try {
      const response = await generateClarifyingQuestionsPrompt(input);
      const output = response.output;

      if (!output) {
        console.error('Clarifying questions prompt returned no output.');
        // Return empty array if generation fails
        return { clarifyingQuestions: [] };
      }

      console.log(`Generated ${output.clarifyingQuestions.length} clarifying questions.`);
      return output;
    } catch (error) {
      console.error('Error in generateClarifyingQuestionsFlow:', error);
      // Return empty array on error
      return { clarifyingQuestions: [] };
    }
  }
);
