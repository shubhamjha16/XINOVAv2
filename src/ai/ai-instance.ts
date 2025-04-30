import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Load environment variables if necessary (e.g., using dotenv)
// import dotenv from 'dotenv';
// dotenv.config();

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // Ensure the Google API key is available in environment variables
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
    // Remove any other AI provider plugins if not used (e.g., OpenAI, Deepseek)
  ],
  // Set the default model back to a Google model
  model: 'googleai/gemini-1.5-flash', // Changed back to Google's model
});
