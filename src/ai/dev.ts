// Import all flows to register them with Genkit
import '@/ai/flows/analyze-symptoms';
import '@/ai/flows/generate-clarifying-questions';
import '@/ai/flows/finalize-diagnosis';
import '@/ai/flows/generate-prescription';
// Remove import for generate-quiz-questions as it's not part of the symptom checker
// import '@/ai/flows/generate-quiz-questions';
// Remove import for generate-flowchart as it's not part of the symptom checker
// import '@/ai/flows/generate-flowchart';
