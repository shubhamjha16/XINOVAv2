import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai'; // Keep GoogleAI available
// import {deepseek} from '@genkit-ai/deepseek'; // Comment out Deepseek

// Load environment variables if necessary (e.g., using dotenv)
// import dotenv from 'dotenv';
// dotenv.config();

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({ // Use GoogleAI as fallback
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
    // deepseek({ // Comment out Deepseek plugin
    //   apiKey: process.env.DEEPSEEK_API_KEY, // Make sure this key is in your .env
    // }),
  ],
  // Set the default model back to googleai or comment out if no key is available
  // model: 'deepseek/deepseek-chat', // Comment out Deepseek model
  model: 'googleai/gemini-1.5-flash', // Use Google model as fallback
});
