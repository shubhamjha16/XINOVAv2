// src/ai/flows/generate-quiz-questions.ts
'use server';

/**
 * @fileOverview Generates background information, a flowchart, and a multiple-choice quiz on a given topic.
 * First generates background information, then uses that information to create the flowchart and the quiz.
 *
 * - generateQuizQuestions - A function that generates background info, flowchart, and quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function, including info, flowchart, and quiz.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { generateFlowchart, GenerateFlowchartInput, GenerateFlowchartOutput } from './generate-flowchart'; // Import the new flow

// Input schema remains the same for the user-facing function
const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz and information. This should be a specific Computer Science topic.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

// Output schema for quiz questions remains the same
const QuizQuestionSchema = z.object({
    question: z.string().describe('The question text.'),
    options: z.object({
      A: z.string().describe('Option A.'),
      B: z.string().describe('Option B.'),
      C: z.string().describe('Option C.'),
      D: z.string().describe('Option D.'),
    }).describe('The answer choices.'),
    correct_answer: z.enum(['A', 'B', 'C', 'D']).describe('The correct option.'),
    explanation: z.string().describe('A brief explanation of the correct answer.'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
  });

// Updated Output schema for the user-facing function to include background information and flowchart
const GenerateQuizQuestionsOutputSchema = z.object({
  information: z.string().optional().describe('Generated background information about the topic. This might be empty if generation failed.'),
  flowchart: z.string().optional().describe('A textual representation of a flowchart summarizing the information. This might be empty if not applicable or generation failed.'),
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions. If the topic is too broad or ambiguous, or if info generation failed, this array might be empty.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;


// Schema for the intermediate step of generating topic information
const GenerateTopicInfoInputSchema = z.object({
  topic: z.string().describe('The Computer Science topic to generate information about.'),
});
const GenerateTopicInfoOutputSchema = z.object({
  information: z.string().describe('Generated background information about the Computer Science topic, focusing on key definitions, algorithms, data structures, principles, and concepts suitable for quiz questions. Provide a detailed overview (around 300-500 words).'),
});

// Schema for the final step of generating the quiz using topic + information
const GenerateQuizFromInfoInputSchema = z.object({
  topic: z.string().describe('The original Computer Science topic of the quiz.'),
  information: z.string().describe('The generated background information to use as context for the quiz questions.'),
});

// Schema for the output of the quiz generation prompt (only the quiz part)
const GenerateQuizFromInfoOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions derived from the Computer Science information. If the provided information is insufficient, this array might be empty.'),
});


// Prompt to generate background information
const generateTopicInfoPrompt = ai.definePrompt({
  name: 'generateTopicInfoPrompt',
  input: {
    schema: GenerateTopicInfoInputSchema,
  },
  output: {
    schema: GenerateTopicInfoOutputSchema,
  },
  prompt: `You are an expert Computer Science educator. Generate detailed background information (around 300-500 words) about the specific Computer Science topic: "{{topic}}".

Cover key definitions, core concepts, relevant algorithms or data structures, important principles, and practical examples where applicable. The information should be accurate, clear, and comprehensive enough to serve as a basis for creating multiple-choice quiz questions across easy, medium, and hard difficulty levels. Structure the information logically.

Return the information as a single string in the "information" field of the JSON output. If you cannot generate meaningful information for the topic, return an empty string for "information".`,
});


// Prompt to generate the quiz using the topic and generated information
const generateQuizFromInfoPrompt = ai.definePrompt({
  name: 'generateQuizFromInfoPrompt',
  input: {
    schema: GenerateQuizFromInfoInputSchema,
  },
  output: {
    schema: GenerateQuizFromInfoOutputSchema, // Use the intermediate quiz-only output schema
  },
  prompt: `You are an expert Computer Science quiz generator.

Use the following background information to generate exactly 10 multiple-choice questions about the Computer Science topic "{{topic}}".

Background Information:
---
{{{information}}}
---

Ensure the questions are directly derived from the provided background information, testing understanding of the definitions, concepts, algorithms, and principles discussed.

Maintain a balanced difficulty distribution:
- 3 easy questions (testing basic recall and definitions)
- 4 medium questions (testing comprehension and application of concepts)
- 3 hard questions (testing analysis, comparison, or deeper understanding)

Each question MUST adhere strictly to the following format:
- "question": The text of the question.
- "options": An object containing exactly four answer choices, labeled "A", "B", "C", and "D". One option must be clearly correct based *only* on the provided information. The others should be plausible but incorrect distractors.
- "correct_answer": A single letter ("A", "B", "C", or "D") indicating the correct option.
- "explanation": A concise, one-sentence explanation for why the correct answer is right, referencing the provided information.
- "difficulty": The difficulty level, strictly one of "easy", "medium", or "hard".

IMPORTANT: Ensure your response is ONLY the JSON object containing the "quiz" array, formatted exactly as specified in the output schema. Do not include any introductory text, explanations outside the question objects, or markdown formatting. If the provided information is insufficient or nonsensical, return an empty quiz array: { "quiz": [] }.

Example structure for a single question object:
{
  "question": "According to the info, what is the time complexity of binary search on a sorted array?",
  "options": {
    "A": "O(n)",
    "B": "O(log n)",
    "C": "O(n log n)",
    "D": "O(1)"
  },
  "correct_answer": "B",
  "explanation": "The information states that binary search divides the search interval in half with each step, resulting in logarithmic time complexity.",
  "difficulty": "medium"
}

Return the final result as a single JSON object: { "quiz": [ /* array of 10 question objects */ ] }`,
});


// Exported function - calls the flow
export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

// The main flow orchestrating the three steps: info -> flowchart & quiz
const generateQuizQuestionsFlow = ai.defineFlow<
  typeof GenerateQuizQuestionsInputSchema,
  typeof GenerateQuizQuestionsOutputSchema
>(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    // Step 1: Generate background information
    let information: string | undefined = '';
    try {
      const infoResponse = await generateTopicInfoPrompt({ topic: input.topic });
      information = infoResponse.output?.information;
    } catch (error) {
      console.error(`Error generating information for topic "${input.topic}":`, error);
      // Proceed without information, flowchart, or quiz if info generation fails hard
      return { information: '', flowchart: '', quiz: [] };
    }


    if (!information || information.trim() === '') {
      console.warn(`Could not generate sufficient information for topic: ${input.topic}`);
      // Return with empty info, flowchart and quiz if info generation yields nothing
      return { information: '', flowchart: '', quiz: [] };
    }

    // Step 2 (Parallel): Generate Flowchart and Quiz using the information
    let flowchart = '';
    let quiz: QuizQuestion[] = [];

    try {
      // Use Promise.all to run flowchart and quiz generation concurrently
      const [flowchartResult, quizResult] = await Promise.allSettled([
        generateFlowchart({ topic: input.topic, information: information }),
        generateQuizFromInfoPrompt({ topic: input.topic, information: information })
      ]);

      // Handle flowchart result
      if (flowchartResult.status === 'fulfilled') {
        flowchart = flowchartResult.value.output?.flowchart ?? '';
      } else {
        console.error(`Error generating flowchart for topic "${input.topic}":`, flowchartResult.reason);
        // Proceed without flowchart if it fails
      }

      // Handle quiz result
      if (quizResult.status === 'fulfilled') {
        quiz = quizResult.value.output?.quiz ?? [];
         if (quiz.length === 0) {
           console.warn(`Quiz generation yielded an empty array for topic "${input.topic}", possibly due to insufficient info detail.`);
         }
      } else {
        console.error(`Error generating quiz for topic "${input.topic}":`, quizResult.reason);
        // Proceed without quiz if it fails
      }

    } catch (error) {
        // Catch any unexpected error during the parallel execution phase
        console.error(`Unexpected error during parallel generation for topic "${input.topic}":`, error);
        // Attempt to return info only if something goes wrong here
        return { information, flowchart: '', quiz: [] };
    }


    // Return all generated components
    return { information, flowchart, quiz };
  }
);
