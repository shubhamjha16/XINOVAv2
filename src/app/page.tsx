'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Info, HelpCircle, FileText, Activity, AlertTriangle, Stethoscope, Pill } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea for symptoms
import { Progress } from "@/components/ui/progress"; // Import Progress
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert

// Import AI flow functions
import { analyzeSymptoms } from '@/ai/flows/analyze-symptoms';
import { generateClarifyingQuestions } from '@/ai/flows/generate-clarifying-questions';
import { finalizeDiagnosis } from '@/ai/flows/finalize-diagnosis';
import { generatePrescription } from '@/ai/flows/generate-prescription';

// Import AI flow types from their dedicated type files
import type { AnalyzeSymptomsInput, AnalyzeSymptomsOutput, PotentialDisease } from '@/ai/types/analyze-symptoms-types';
import type { GenerateClarifyingQuestionsInput, GenerateClarifyingQuestionsOutput, ClarifyingQuestion } from '@/ai/types/generate-clarifying-questions-types';
import type { FinalizeDiagnosisInput, FinalizeDiagnosisOutput, Answer } from '@/ai/types/finalize-diagnosis-types';
import type { GeneratePrescriptionInput, GeneratePrescriptionOutput } from '@/ai/types/generate-prescription-types';


// Define types for the multi-step process
type Step = 'input_symptoms' | 'show_analysis' | 'ask_questions' | 'show_final_diagnosis' | 'show_prescription';
type AnswerOptionKey = 'A' | 'B' | 'C' | 'D';
type UserAnswersMap = { [questionIndex: number]: { selectedOption: AnswerOptionKey; answerText: string } };


export default function Home() {
  const [step, setStep] = useState<Step>('input_symptoms');
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // State for each step's data
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSymptomsOutput | null>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswersMap>({});
  const [finalDiagnosisResult, setFinalDiagnosisResult] = useState<FinalizeDiagnosisOutput | null>(null);
  const [prescriptionResult, setPrescriptionResult] = useState<GeneratePrescriptionOutput | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOptionKey | null>(null); // For current question

  const totalSteps = 5; // Define total number of steps for progress bar

  const getCurrentStepNumber = (): number => {
    switch (step) {
      case 'input_symptoms': return 1;
      case 'show_analysis': return 2;
      case 'ask_questions': return 3;
      case 'show_final_diagnosis': return 4;
      case 'show_prescription': return 5;
      default: return 0;
    }
  };

  const progressValue = (getCurrentStepNumber() / totalSteps) * 100;

  // Reset function
  const handleRestart = () => {
    setStep('input_symptoms');
    setSymptoms('');
    setIsLoading(false);
    setAnalysisResult(null);
    setClarifyingQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFinalDiagnosisResult(null);
    setPrescriptionResult(null);
    setSelectedAnswer(null);
    toast({ title: "Process Restarted", description: "You can enter new symptoms now.", variant: "info" });
  };

  // Handle Symptom Submission
  const handleAnalyzeSymptoms = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!symptoms.trim() || symptoms.length < 10) {
      toast({
        title: 'Error',
        description: 'Please provide a detailed description of your symptoms (at least 10 characters).',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null); // Clear previous results

    try {
      const result = await analyzeSymptoms({ symptoms });
      setAnalysisResult(result);

      if (result.possibleDiseases.length > 0) {
        setStep('show_analysis');
        toast({ title: 'Analysis Complete', description: 'Review the potential conditions.', variant: 'success' });

        // Automatically trigger question generation if needed
        if (result.needsMoreInfo) {
           await triggerQuestionGeneration(result);
        } else {
            // If no more info needed, might skip directly to final (though less likely with this setup)
             console.log("Sufficient info, potentially skipping questions.");
             // For now, we always proceed to ask questions if analysis is successful
             await triggerQuestionGeneration(result);
        }

      } else {
        toast({
          title: 'Analysis Inconclusive',
          description: result.initialAssessment || 'Could not determine potential conditions based on the symptoms provided. Please consult a healthcare professional.',
          variant: 'warning',
          duration: 7000
        });
         // Stay on input step or allow restart
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: 'Analysis Error',
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or consult a healthcare professional.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Trigger Question Generation (called after analysis)
  const triggerQuestionGeneration = async (currentAnalysis: AnalyzeSymptomsOutput) => {
      setIsLoading(true); // Indicate loading for question generation
      setClarifyingQuestions([]);
      try {
          const questionInput: GenerateClarifyingQuestionsInput = {
              symptoms: symptoms,
              possibleDiseases: currentAnalysis.possibleDiseases,
          };
          const questionsResult = await generateClarifyingQuestions(questionInput);
          if (questionsResult.clarifyingQuestions.length > 0) {
              setClarifyingQuestions(questionsResult.clarifyingQuestions);
              setCurrentQuestionIndex(0); // Reset index for new questions
              setSelectedAnswer(null);
              // setStep('ask_questions'); // Transition happens in proceedToQuestions
              toast({ title: 'Clarification Needed', description: 'Please answer the following questions.', variant: 'info'});
          } else {
              toast({ title: 'No Further Questions', description: 'Proceeding to final assessment based on initial symptoms.', variant: 'info'});
              // If no questions, trigger final diagnosis immediately
              await triggerFinalDiagnosis([]); // Pass empty answers array
          }
      } catch (error) {
          console.error('Error generating clarifying questions:', error);
          toast({
              title: 'Question Generation Error',
              description: `Could not generate clarifying questions: ${error instanceof Error ? error.message : 'Unknown error'}. Proceeding based on initial info.`,
              variant: 'warning',
          });
           // Attempt final diagnosis even if questions fail
           await triggerFinalDiagnosis([]);
      } finally {
          setIsLoading(false);
      }
  };

   // Proceed from Analysis to Questions
   const proceedToQuestions = () => {
    if (clarifyingQuestions.length > 0) {
      setStep('ask_questions');
    } else {
      // This case should ideally be handled by triggerQuestionGeneration,
      // but as a fallback, trigger final diagnosis here too.
      toast({ title: 'Proceeding', description: 'Moving to final assessment.', variant: 'info' });
      triggerFinalDiagnosis([]);
    }
  };


  // Handle Answer Selection for Clarifying Questions
  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value as AnswerOptionKey);
  };

  // Handle Submission of a Clarifying Question Answer
  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !clarifyingQuestions[currentQuestionIndex]) return;

    const currentQ = clarifyingQuestions[currentQuestionIndex];
    const answerText = currentQ.options[selectedAnswer];

    if (answerText === undefined) {
        console.error("Selected option text is undefined");
        toast({ title: "Error", description: "Invalid option selected.", variant: "destructive"});
        return;
    }


    const updatedAnswers: UserAnswersMap = {
      ...userAnswers,
      [currentQuestionIndex]: { selectedOption: selectedAnswer, answerText: answerText },
    };
    setUserAnswers(updatedAnswers);

    // Move to next question or finalize
    if (currentQuestionIndex < clarifyingQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null); // Reset selection for next question
    } else {
      // Last question answered, trigger final diagnosis
      toast({ title: 'Questions Complete', description: 'Finalizing assessment...', variant: 'info'});
      const finalAnswersArray = Object.keys(updatedAnswers).map(key => {
          const index = parseInt(key, 10);
          return {
              question: clarifyingQuestions[index].question,
              selectedOption: updatedAnswers[index].selectedOption,
              answerText: updatedAnswers[index].answerText,
          };
      });
      triggerFinalDiagnosis(finalAnswersArray);
    }
  };

   // Trigger Final Diagnosis (called after questions or if no questions)
   const triggerFinalDiagnosis = async (finalAnswers: Answer[]) => {
       if (!analysisResult) {
           toast({ title: "Error", description: "Initial analysis data is missing.", variant: "destructive"});
           handleRestart(); // Go back to start if essential data is lost
           return;
       }
       setIsLoading(true);
       setFinalDiagnosisResult(null);
       try {
           const finalInput: FinalizeDiagnosisInput = {
               symptoms: symptoms,
               initialPossibleDiseases: analysisResult.possibleDiseases,
               clarifyingQuestions: clarifyingQuestions, // Send the questions asked
               userAnswers: finalAnswers,
           };
           const finalResult = await finalizeDiagnosis(finalInput);
           setFinalDiagnosisResult(finalResult);
           setStep('show_final_diagnosis');
           toast({ title: 'Assessment Finalized', description: 'Review the refined assessment and recommendations.', variant: 'success' });

           // Trigger prescription generation automatically
           await triggerPrescriptionGeneration(finalResult);

       } catch (error) {
           console.error('Error finalizing diagnosis:', error);
           toast({
               title: 'Final Assessment Error',
               description: `Could not finalize the assessment: ${error instanceof Error ? error.message : 'Unknown error'}. Please consult a healthcare professional.`,
               variant: 'destructive',
           });
            // Optionally show restart button or partial results
       } finally {
           setIsLoading(false);
       }
   };

   // Trigger Prescription Generation
   const triggerPrescriptionGeneration = async (finalDiagnosisData: FinalizeDiagnosisOutput) => {
        setIsLoading(true); // Indicate loading for prescription
        setPrescriptionResult(null);
        try {
            const prescriptionInput: GeneratePrescriptionInput = {
                finalAssessment: finalDiagnosisData,
            };
            const presResult = await generatePrescription(prescriptionInput);
            setPrescriptionResult(presResult);
            // setStep('show_prescription'); // Transition happens in proceedToPrescription
            toast({title: "Suggestions Ready", description: "General advice has been generated.", variant: "info"});

        } catch (error) {
             console.error('Error generating prescription:', error);
             toast({
                 title: 'Suggestion Error',
                 description: `Could not generate advice: ${error instanceof Error ? error.message : 'Unknown error'}. Please rely on the final assessment recommendation.`,
                 variant: 'warning',
             });
             // Still allow proceeding to show the disclaimer even if suggestions fail
        } finally {
             setIsLoading(false);
        }
   }

    // Proceed from Final Diagnosis to Prescription
    const proceedToPrescription = () => {
        if (prescriptionResult) {
            setStep('show_prescription');
        } else {
            // Fallback if prescription failed but we want to show something
             setStep('show_prescription'); // Show the prescription step anyway to display disclaimer
             setPrescriptionResult({ // Set a default safe message
                 suggestedPrescription: "General Advice (Not a Medical Prescription): Could not generate specific advice due to an error. Please follow the recommendations provided in the final assessment and consult a healthcare professional.",
                 importantDisclaimer: "IMPORTANT: This is general information ONLY and NOT a medical prescription. It does not replace consultation with a qualified healthcare professional. Do not use this information to self-diagnose or self-treat. Follow your doctor's specific instructions."
             });
        }
    };


  // Helper to get current question object
  const currentClarifyingQuestion = clarifyingQuestions.length > 0 && step === 'ask_questions'
    ? clarifyingQuestions[currentQuestionIndex]
    : null;


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-center gap-2">
             <Stethoscope className="h-8 w-8" />
             <CardTitle className="text-3xl font-bold">Iksir</CardTitle> {/* Updated name */}
          </div>
          <CardDescription className="text-primary-foreground/80">Enter symptoms for a preliminary analysis (Informational Use Only)</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">

          {/* Progress Bar */}
           {step !== 'input_symptoms' && (
               <div className="space-y-2">
                   <Progress value={progressValue} className="w-full h-2" />
                   <p className="text-sm text-muted-foreground text-center">Step {getCurrentStepNumber()} of {totalSteps}</p>
               </div>
           )}


          {/* Step 1: Input Symptoms */}
          {step === 'input_symptoms' && (
            <form onSubmit={handleAnalyzeSymptoms} className="space-y-6 animate-in fade-in duration-500">
              <Alert variant="warning">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Disclaimer</AlertTitle>
                 <AlertDescription>
                   This tool provides informational suggestions based on AI analysis and is **NOT** a substitute for professional medical diagnosis or advice. Always consult a qualified healthcare provider for any health concerns.
                 </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-lg font-medium">Describe your symptoms in detail:</Label>
                <Textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., I have a high fever (102°F), persistent dry cough for 3 days, headache, and body aches. No sore throat or runny nose."
                  className="text-base min-h-[150px] transition-colors duration-200 focus:border-accent focus:ring-accent"
                  rows={5}
                  required
                  minLength={10}
                />
                 <p className="text-xs text-muted-foreground">Please be descriptive. Minimum 10 characters.</p>
              </div>
              <Button type="submit" className="w-full text-lg py-3 transition-transform duration-150 ease-in-out hover:scale-[1.02]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Symptoms...
                  </>
                ) : (
                  'Analyze Symptoms'
                )}
              </Button>
            </form>
          )}

           {/* Loading Indicator (General) */}
           {isLoading && (step !== 'input_symptoms') && (
             <div className="flex flex-col items-center justify-center space-y-4 p-8">
               <Loader2 className="h-12 w-12 animate-spin text-accent" />
               <p className="text-muted-foreground text-lg">Processing...</p>
                {step === 'show_analysis' && <p className="text-muted-foreground">Generating clarifying questions...</p>}
                {step === 'ask_questions' && <p className="text-muted-foreground">Finalizing assessment...</p>}
                 {step === 'show_final_diagnosis' && <p className="text-muted-foreground">Generating advice...</p>}
             </div>
           )}


          {/* Step 2: Show Initial Analysis */}
          {step === 'show_analysis' && analysisResult && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <Activity className="h-5 w-5 text-accent" />
                 Initial Symptom Analysis Results
               </h3>
               <Separator />
               <Alert variant="info">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Preliminary Findings</AlertTitle>
                    <AlertDescription>
                        {analysisResult.initialAssessment || "Based on your symptoms, here are some possibilities. Remember, this is not a diagnosis."}
                    </AlertDescription>
               </Alert>

               {analysisResult.possibleDiseases.length > 0 ? (
                 <div className="space-y-3">
                   <Label className="font-medium">Potential Conditions (Probabilities based on initial info):</Label>
                   {analysisResult.possibleDiseases.map((disease, index) => (
                     <Card key={index} className="bg-card border p-4 rounded-md">
                       <div className="flex justify-between items-center mb-1">
                         <span className="font-semibold text-card-foreground">{disease.disease}</span>
                         <Badge variant={disease.probability > 0.6 ? 'destructive' : disease.probability > 0.3 ? 'warning' : 'secondary'} className="text-xs">
                           ~{(disease.probability * 100).toFixed(0)}% chance
                         </Badge>
                       </div>
                       <p className="text-sm text-muted-foreground">{disease.reasoning}</p>
                     </Card>
                   ))}
                 </div>
               ) : (
                 <p className="text-muted-foreground">Could not identify specific potential conditions with high confidence based on the information provided.</p>
               )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button onClick={proceedToQuestions} className="flex-1 text-base py-2.5" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (clarifyingQuestions.length > 0 ? 'Answer Questions' : 'Proceed to Assessment')}
                   </Button>
                   <Button onClick={handleRestart} variant="outline" className="flex-1 text-base py-2.5">
                       Start Over
                   </Button>
              </div>
            </div>
          )}


            {/* Step 3: Ask Clarifying Questions */}
           {step === 'ask_questions' && currentClarifyingQuestion && !isLoading && (
             <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-accent" />
                  Clarifying Questions ({currentQuestionIndex + 1} of {clarifyingQuestions.length})
                </h3>
                <Separator />

                <p className="text-lg font-medium text-center">{currentClarifyingQuestion.question}</p>

                <RadioGroup
                  value={selectedAnswer ?? undefined}
                  onValueChange={handleAnswerSelect}
                  className="space-y-4"
                >
                  {(Object.keys(currentClarifyingQuestion.options) as AnswerOptionKey[]).map((optionKey) => {
                    const optionText = currentClarifyingQuestion.options[optionKey];
                     if (!optionText) return null; // Skip if option is undefined (e.g., optional C or D not present)
                     return (
                        <Label
                          key={optionKey}
                          htmlFor={`${currentQuestionIndex}-${optionKey}`}
                          className={cn(
                            "flex items-start space-x-3 rounded-md border p-4 transition-all duration-150 ease-in-out cursor-pointer",
                            "bg-card hover:bg-secondary/30 transform hover:scale-[1.01]",
                            selectedAnswer === optionKey && "border-accent bg-accent/10 ring-2 ring-accent"
                          )}
                        >
                          <RadioGroupItem value={optionKey} id={`${currentQuestionIndex}-${optionKey}`} className="border-primary text-primary focus:ring-accent shrink-0 mt-1" />
                          <span className="flex-1">{optionText}</span>
                        </Label>
                     );
                  })}
                </RadioGroup>

               <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <Button onClick={handleSubmitAnswer} className="flex-1 text-base py-2.5" disabled={!selectedAnswer || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (currentQuestionIndex < clarifyingQuestions.length - 1 ? 'Next Question' : 'Submit Answers')}
                 </Button>
                  <Button onClick={handleRestart} variant="outline" className="flex-1 text-base py-2.5">
                     Start Over
                  </Button>
               </div>
             </div>
           )}


            {/* Step 4: Show Final Diagnosis */}
            {step === 'show_final_diagnosis' && finalDiagnosisResult && !isLoading && (
               <div className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                   <FileText className="h-5 w-5 text-accent" />
                   Refined Assessment Results
                 </h3>
                 <Separator />

                 <Alert variant="info">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Final Assessment</AlertTitle>
                    <AlertDescription>
                        {finalDiagnosisResult.finalAssessment || "Assessment complete based on your symptoms and answers."}
                    </AlertDescription>
                 </Alert>


                 {finalDiagnosisResult.refinedPossibleDiseases.length > 0 ? (
                   <div className="space-y-3">
                      <Label className="font-medium">Refined Potential Conditions:</Label>
                      {finalDiagnosisResult.refinedPossibleDiseases.map((disease, index) => (
                        <Card key={index} className="bg-card border p-4 rounded-md">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-card-foreground">{disease.disease}</span>
                             <Badge variant={disease.probability > 0.7 ? 'destructive' : disease.probability > 0.4 ? 'warning' : 'secondary'} className="text-xs">
                               ~{(disease.probability * 100).toFixed(0)}% chance
                             </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{disease.reasoning}</p>
                        </Card>
                      ))}
                   </div>
                 ) : (
                    <p className="text-muted-foreground">Could not determine a likely condition with high confidence, even with clarifying answers.</p>
                 )}

                 <div className="space-y-2">
                    <Label className="font-medium">Recommendation:</Label>
                    <p className="text-base text-foreground">{finalDiagnosisResult.recommendation}</p>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                     <Button onClick={proceedToPrescription} className="flex-1 text-base py-2.5" disabled={isLoading}>
                         {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Show General Advice'}
                     </Button>
                     <Button onClick={handleRestart} variant="outline" className="flex-1 text-base py-2.5">
                         Start Over
                     </Button>
                 </div>
               </div>
            )}


           {/* Step 5: Show Prescription/Advice */}
           {step === 'show_prescription' && prescriptionResult && !isLoading && (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                   <Pill className="h-5 w-5 text-accent" />
                   General Advice & Suggestions
                 </h3>
                 <Separator />

                 <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Crucial Disclaimer</AlertTitle>
                     <AlertDescription>
                         {prescriptionResult.importantDisclaimer || "IMPORTANT: This is general information ONLY and NOT a medical prescription. Consult a qualified healthcare professional."}
                     </AlertDescription>
                 </Alert>

                 <div className="space-y-2">
                     <Label className="font-medium">Suggested Prescription:</Label>
                     {/* Using whitespace-pre-wrap to respect formatting from AI potentially */}
                     <p className="text-base text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md border">
                         {prescriptionResult.suggestedPrescription}
                     </p>
                 </div>

                  <div className="flex justify-center pt-4">
                     <Button onClick={handleRestart} variant="default" className="text-base py-2.5 px-8">
                         Start Over
                     </Button>
                  </div>
              </div>
           )}

            {/* Fallback/Error state */}
            {!isLoading && step !== 'input_symptoms' && !analysisResult && !finalDiagnosisResult && (
                 <div className="text-center space-y-4 p-8">
                     <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                     <p className="text-lg text-destructive">An error occurred, or no results could be generated.</p>
                     <p className="text-muted-foreground">Please try again with more detailed symptoms or consult a healthcare professional directly.</p>
                     <Button onClick={handleRestart} variant="outline">Start Over</Button>
                 </div>
             )}


        </CardContent>
      </Card>
    </main>
  );
}
