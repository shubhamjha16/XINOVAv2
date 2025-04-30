// src/ai/flows/generate-quiz-questions.ts
'use server';

/**
 * @fileOverview Generates background information, a flowchart, and a multiple-choice/coding quiz on a given topic.
 * First generates background information, then uses that information to create the flowchart and the quiz.
 *
 * - generateQuizQuestions - A function that generates background info, flowchart, and quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function, including info, flowchart, and quiz.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { generateFlowchart, GenerateFlowchartInput, GenerateFlowchartOutput } from './generate-flowchart'; // Import the flowchart flow

// Input schema remains the same for the user-facing function
const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz and information. This should be a specific Computer Science topic.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

// Updated Output schema for quiz questions to include coding question flag
const QuizQuestionSchema = z.object({
    question: z.string().describe('The question text. For coding questions, this might describe a problem or ask to analyze a snippet.'),
    options: z.object({
      A: z.string().describe('Option A.'),
      B: z.string().describe('Option B.'),
      C: z.string().describe('Option C.'),
      D: z.string().describe('Option D.'),
    }).describe('The answer choices. For coding questions, options might be code snippets, outputs, or conceptual statements. It remains a multiple-choice question.'),
    correct_answer: z.enum(['A', 'B', 'C', 'D']).describe('The correct option (A, B, C, or D).'),
    explanation: z.string().describe('A brief explanation of the correct answer.'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
    isCodingQuestion: z.boolean().optional().describe('Set to true if this is a coding-related question/problem.'),
  });
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Updated Output schema for the user-facing function to reflect 15 questions
const GenerateQuizQuestionsOutputSchema = z.object({
  information: z.string().optional().describe('Generated background information about the topic. This might be empty if generation failed.'),
  flowchart: z.string().optional().describe('A textual representation of a flowchart summarizing the information. This might be empty if not applicable or generation failed.'),
  quiz: z.array(QuizQuestionSchema).describe('An array of 15 quiz questions (10 multiple-choice, 5 coding), sorted by difficulty (easy, medium, hard) then coding questions. If the topic is too broad or ambiguous, or if info generation failed, this array might be empty.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;


// Schema for the intermediate step of generating topic information remains the same
const GenerateTopicInfoInputSchema = z.object({
  topic: z.string().describe('The Computer Science topic to generate information about.'),
});
const GenerateTopicInfoOutputSchema = z.object({
  information: z.string().describe('Generated, in-depth background information about the Computer Science topic (approx. 500-700 words). Focus on key definitions, algorithms, data structures, principles, core concepts, historical context, variations, and practical applications. Use well-structured, longer paragraphs suitable for detailed understanding and quiz generation.'),
});

// Schema for the final step of generating the quiz using topic + information remains the same
const GenerateQuizFromInfoInputSchema = z.object({
  topic: z.string().describe('The original Computer Science topic of the quiz.'),
  information: z.string().describe('The generated background information to use as context for the quiz questions.'),
});

// Updated schema for the output of the quiz generation prompt (only the quiz part, now 15 questions)
const GenerateQuizFromInfoOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of 15 quiz questions derived from the Computer Science information (10 multiple-choice, 5 coding). If the provided information is insufficient, this array might be empty.'),
});


// Prompt to generate background information remains the same
const generateTopicInfoPrompt = ai.definePrompt({
  name: 'generateTopicInfoPrompt',
  input: {
    schema: GenerateTopicInfoInputSchema,
  },
  output: {
    schema: GenerateTopicInfoOutputSchema,
  },
  prompt: `You are an expert Computer Science educator tasked with creating comprehensive educational content.

Generate **in-depth background information** (approximately 500-700 words) about the specific Computer Science topic: "{{topic}}".

Your explanation should be detailed and cover the following aspects where applicable:
- **Core Definitions:** Clearly define the key terms associated with the topic.
- **Fundamental Concepts:** Explain the underlying principles and ideas.
- **Algorithms/Data Structures:** Detail relevant algorithms or data structures, including their purpose, steps, and characteristics (like time/space complexity).
- **Key Principles:** Discuss important rules, guidelines, or theories related to the topic.
- **Variations/Types:** If applicable, describe different types or variations of the concept.
- **Historical Context:** Briefly mention the origin or evolution of the topic if relevant.
- **Practical Applications/Examples:** Provide real-world examples or use cases where this topic is applied.
- **Advantages and Disadvantages:** Discuss the pros and cons or trade-offs involved.

**Structure:** Organize the information logically using **well-structured, longer paragraphs** to provide depth. Ensure the content flows smoothly and is easy to understand despite its detail. Use Markdown for code blocks if necessary within the information.

**Goal:** The generated information should be accurate, clear, and substantially detailed to serve as a solid foundation for creating challenging multiple-choice and coding quiz questions across easy, medium, and hard difficulty levels.

**Output:** Return the information as a single string within the "information" field of the JSON output. If you cannot generate meaningful, in-depth information for the topic (e.g., it's too obscure or ill-defined), return an empty string for "information".`,
});


// Updated Prompt to generate the quiz (now 15 questions including coding)
const generateQuizFromInfoPrompt = ai.definePrompt({
  name: 'generateQuizFromInfoPrompt',
  input: {
    schema: GenerateQuizFromInfoInputSchema,
  },
  output: {
    schema: GenerateQuizFromInfoOutputSchema, // Use the updated quiz-only output schema
  },
  prompt: `You are an expert Computer Science quiz generator.

Use the following detailed background information to generate exactly 15 questions about the Computer Science topic "{{topic}}".

Background Information:
---
{{{information}}}
---

The quiz should consist of two parts:
1.  **10 Multiple-Choice Questions:** Derived directly from the provided background information, testing understanding of definitions, concepts, algorithms, principles, applications, and trade-offs.
2.  **5 Coding Questions:** These should be practical problems, code analysis tasks, or conceptual coding questions related to the topic. **Crucially, these coding questions MUST still be in multiple-choice format (MCQ)**, with four options (A, B, C, D) and one correct answer. The options might contain code snippets, outputs, or conceptual statements about code. Set the "isCodingQuestion" field to \`true\` for these 5 questions.

Ensure the non-coding questions are directly derived from the provided background information where applicable.

Maintain a balanced difficulty distribution for the 10 multiple-choice (non-coding) questions:
- 3 easy questions (testing basic recall and definitions)
- 4 medium questions (testing comprehension and application of concepts)
- 3 hard questions (testing analysis, comparison, or deeper understanding)

The 5 coding questions (questions 11-15) should generally be of medium to hard difficulty and MUST test practical application or analysis related to the topic, presented in a multiple-choice format.

Each question MUST adhere strictly to the following format:
- "question": The text of the question. For coding questions, this might describe a problem, ask to predict output, find a bug, or complete a snippet. Use markdown code formatting (like \`inline code\` or \`\`\`code blocks\`\`\`) within the question string if necessary.
- "options": An object containing exactly four answer choices, labeled "A", "B", "C", and "D". One option must be clearly correct based on CS principles and the provided information (if applicable). Options for coding questions might be code snippets, outputs, or explanations, but the format remains multiple-choice. Use markdown code formatting in options if needed.
- "correct_answer": A single letter ("A", "B", "C", or "D") indicating the correct option.
- "explanation": A concise, one-sentence explanation for why the correct answer is right, referencing the information or core CS concepts.
- "difficulty": The difficulty level, strictly one of "easy", "medium", or "hard".
- "isCodingQuestion": (Optional) Boolean. Set this to \`true\` ONLY for the 5 coding questions (questions 11-15). Omit or set to \`false\` for the first 10 multiple-choice questions.

IMPORTANT: Ensure your response is ONLY the JSON object containing the "quiz" array with exactly 15 questions, formatted exactly as specified in the output schema. Do not include any introductory text, explanations outside the question objects, or markdown formatting *around* the JSON. If the provided information is insufficient or nonsensical for generating 15 questions (including coding ones), return an empty quiz array: { "quiz": [] }.

Example structure for a non-coding question object:
{
  "question": "According to the info, what is the time complexity of binary search on a sorted array?",
  "options": { "A": "O(n)", "B": "O(log n)", "C": "O(n log n)", "D": "O(1)" },
  "correct_answer": "B",
  "explanation": "The information states that binary search divides the search interval in half, resulting in logarithmic time complexity.",
  "difficulty": "medium"
}

Example structure for a coding question object (still MCQ):
{
  "question": "What is the output of the following Python code snippet related to {topic}?\\n\`\`\`python\\n# code relevant to topic here\\nresult = ... \\nprint(result)\\n\`\`\`",
  "options": { "A": "Output A", "B": "Output B", "C": "Error", "D": "Output D" },
  "correct_answer": "A",
  "explanation": "The code executes [brief explanation of logic] resulting in the output 'Output A'.",
  "difficulty": "medium",
  "isCodingQuestion": true
}


Return the final result as a single JSON object: { "quiz": [ /* array of 15 question objects */ ] }`,
});


// Exported function - calls the flow
export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

// Helper function to sort quiz questions
function sortQuizQuestions(quiz: QuizQuestion[]): QuizQuestion[] {
  const difficultyOrder = ['easy', 'medium', 'hard'];

  const nonCodingQuestions = quiz.filter(q => !q.isCodingQuestion);
  const codingQuestions = quiz.filter(q => q.isCodingQuestion);

  nonCodingQuestions.sort((a, b) => {
    const diffAIndex = difficultyOrder.indexOf(a.difficulty);
    const diffBIndex = difficultyOrder.indexOf(b.difficulty);
    return diffAIndex - diffBIndex;
  });

  return [...nonCodingQuestions, ...codingQuestions];
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
      console.log(`Generating info for topic: ${input.topic}`);
      const infoResponse = await generateTopicInfoPrompt({ topic: input.topic });
      information = infoResponse.output?.information;
       console.log(`Info generated successfully for: ${input.topic}`);
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
      console.log(`Generating flowchart and quiz (15 questions) for topic: ${input.topic}`);
      // Use Promise.allSettled to run flowchart and quiz generation concurrently
      const [flowchartResult, quizResult] = await Promise.allSettled([
        generateFlowchart({ topic: input.topic, information: information }),
        generateQuizFromInfoPrompt({ topic: input.topic, information: information })
      ]);

      // Handle flowchart result
      if (flowchartResult.status === 'fulfilled') {
        flowchart = flowchartResult.value.flowchart ?? ''; // Access flowchart directly from output
         console.log(`Flowchart generated for: ${input.topic}`);
      } else {
        console.error(`Error generating flowchart for topic "${input.topic}":`, flowchartResult.reason);
        // Proceed without flowchart if it fails
      }

      // Handle quiz result
      if (quizResult.status === 'fulfilled') {
        quiz = quizResult.value.output?.quiz ?? [];
         if (quiz.length === 0) {
           console.warn(`Quiz generation yielded an empty array for topic "${input.topic}".`);
         } else {
             // Sort the quiz questions before returning
             quiz = sortQuizQuestions(quiz);
             console.log(`Quiz (${quiz.length} questions) generated and sorted successfully for: ${input.topic}`);
             if (quiz.length < 15) {
                 console.warn(`Quiz generation yielded only ${quiz.length} questions (expected 15).`);
             }
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


    // Return all generated components (with sorted quiz)
    return { information, flowchart, quiz };
  }
);
