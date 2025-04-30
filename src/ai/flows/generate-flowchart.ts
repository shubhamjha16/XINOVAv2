// src/ai/flows/generate-flowchart.ts
'use server';

/**
 * @fileOverview Generates a textual representation of a flowchart based on provided information.
 *
 * - generateFlowchart - A function that generates a flowchart description.
 * - GenerateFlowchartInput - The input type for the generateFlowchart function.
 * - GenerateFlowchartOutput - The return type for the generateFlowchart function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const GenerateFlowchartInputSchema = z.object({
  topic: z.string().describe('The main topic the information is about.'),
  information: z.string().describe('The background information to be converted into a flowchart.'),
});
export type GenerateFlowchartInput = z.infer<typeof GenerateFlowchartInputSchema>;

const GenerateFlowchartOutputSchema = z.object({
  flowchart: z.string().describe('A textual description representing the key steps or concepts from the information in a flowchart format. Use simple text like "Step 1: [Action] -> Step 2: [Action]" or similar structures. If a flowchart is not applicable, return an empty string.'),
});
export type GenerateFlowchartOutput = z.infer<typeof GenerateFlowchartOutputSchema>;

// Prompt to generate the flowchart description
const generateFlowchartPrompt = ai.definePrompt({
  name: 'generateFlowchartPrompt',
  input: {
    schema: GenerateFlowchartInputSchema,
  },
  output: {
    schema: GenerateFlowchartOutputSchema,
  },
  prompt: `You are an expert at summarizing complex information into simple, sequential flowcharts.

Based on the following background information about "{{topic}}", create a textual flowchart outlining the key steps, processes, or concepts.

Use a simple text format like:
"Start -> [Concept/Step A] -> [Concept/Step B] -> [Decision Point? Yes -> Step C, No -> Step D] -> End"
or
"1. [Action/Concept]
 2. [Next Action/Concept]
 3. [Final Outcome]"

Keep the flowchart concise and focus on the main flow derived from the information. If the information doesn't lend itself well to a sequential flowchart (e.g., it's purely descriptive or a list of unrelated facts), return an empty string for the "flowchart" field.

Background Information:
---
{{{information}}}
---

Return the result ONLY as a JSON object with the "flowchart" field containing the textual representation.`,
});

// Exported function - calls the flow
export async function generateFlowchart(input: GenerateFlowchartInput): Promise<GenerateFlowchartOutput> {
  return generateFlowchartFlow(input);
}

// The flow definition
const generateFlowchartFlow = ai.defineFlow<
  typeof GenerateFlowchartInputSchema,
  typeof GenerateFlowchartOutputSchema
>(
  {
    name: 'generateFlowchartFlow',
    inputSchema: GenerateFlowchartInputSchema,
    outputSchema: GenerateFlowchartOutputSchema,
  },
  async (input) => {
    const response = await generateFlowchartPrompt(input);
    return response.output ?? { flowchart: '' }; // Ensure we return an object even on failure
  }
);
