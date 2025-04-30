import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {deepseek} from '@genkit-ai/deepseek'; // Keep Deepseek import commented out for now

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
    // deepseek({ // Keep Deepseek plugin configuration commented out
    //   apiKey: process.env.DEEPSEEK_API_KEY, // Make sure this key is in your .env if you use Deepseek
    // }),
  ],
  // Set the default model back to a Google model capable of handling the complexity
  model: 'googleai/gemini-1.5-flash', // Using Flash for potentially faster responses, consider 1.5 Pro if needed
  // model: 'deepseek/deepseek-chat', // Keep Deepseek model commented out
});
