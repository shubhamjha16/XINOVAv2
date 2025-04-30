// src/app/page.tsx
'use client';

import * as React from 'react';
import { useState } from 'react';
import type { GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions';
import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Info } from 'lucide-react'; // Added Info icon
import { cn } from "@/lib/utils";
import { Separator } from '@/components/ui/separator'; // Import Separator

type QuizQuestion = GenerateQuizQuestionsOutput['quiz'][0];
type AnswerOption = keyof QuizQuestion['options'];

export default function Home() {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [backgroundInfo, setBackgroundInfo] = useState<string | null>(null); // State for background info
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const handleGenerateQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setQuiz([]); // Clear previous quiz
    setBackgroundInfo(null); // Clear previous info
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);

    try {
      const result = await generateQuizQuestions({ topic });

      // Always set the background info, even if it's empty
      setBackgroundInfo(result.information || null);

      if (result.quiz && result.quiz.length > 0) {
        setQuiz(result.quiz);
      } else if (result.information && result.information.trim() !== '') {
        // Info generated, but no quiz
         toast({
           title: 'Quiz Generation Issue',
           description: `Generated background information for "${topic}", but couldn't create quiz questions. The information might be too complex or lack specific details for quiz generation.`,
           variant: 'warning', // Use warning variant
         });
      }
       else {
        // Neither info nor quiz generated
        toast({
          title: 'Generation Failed',
          description: `Could not generate information or a quiz for the topic "${topic}". The AI might not have enough information or the topic might be too specific/broad. Please try a different topic.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'An unexpected error occurred while generating the quiz.';
      if (error instanceof Error) {
        errorMessage = `Error generating quiz: ${error.message}. Please check the console for more details.`;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
       setBackgroundInfo(null); // Ensure info is cleared on error
       setQuiz([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value as AnswerOption);
    setShowFeedback(false); // Hide feedback until submitted
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = quiz[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore(score + 1);
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleRestartQuiz = () => {
    setTopic('');
    setQuiz([]);
    setBackgroundInfo(null); // Clear info on restart
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsLoading(false);
    setScore(0);
  };

  const currentQuestion = quiz.length > 0 ? quiz[currentQuestionIndex] : null;
  const isQuizFinished = quiz.length > 0 && currentQuestionIndex === quiz.length - 1 && showFeedback;
  const showQuizArea = quiz.length > 0 && !isLoading;
  const showInfoArea = backgroundInfo && !isLoading;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg overflow-hidden"> {/* Increased max-width */}
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold">Quiz Master</CardTitle>
          <CardDescription className="text-primary-foreground/80">Generate background info & quizzes on any topic!</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8"> {/* Added space-y */}
          {!showQuizArea && !showInfoArea && !isLoading && (
            <form onSubmit={handleGenerateQuiz} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-lg font-medium">Enter a Topic:</Label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Solar System, React Hooks, World War II"
                  className="text-base"
                />
              </div>
              <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Info & Quiz'
                )}
              </Button>
            </form>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="text-muted-foreground text-lg">Generating background info and quiz on "{topic}"...</p>
            </div>
          )}

          {showInfoArea && (
             <div className="space-y-4 p-6 rounded-md border bg-card">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Info className="h-5 w-5 text-accent" />
                  Background Information on "{topic}"
                </h3>
                <Separator />
                <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                  {backgroundInfo}
                </p>
             </div>
          )}


          {showQuizArea && (
            <div className="space-y-6">
               {/* Separator between info and quiz if both exist */}
              {showInfoArea && <Separator className="my-8"/>}

              {/* Quiz Title */}
              <h3 className="text-2xl font-semibold text-center text-primary">Quiz Time!</h3>

              <div className="flex justify-between items-center mb-4">
                 <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {quiz.length}</p>
                 <Badge
                    variant={
                      currentQuestion!.difficulty === 'easy' ? 'success' :
                      currentQuestion!.difficulty === 'medium' ? 'warning' :
                      'destructive'
                    }
                    className="uppercase text-xs px-2 py-1"
                 >
                   {currentQuestion!.difficulty}
                 </Badge>
              </div>

              <p className="text-xl font-semibold text-center text-foreground">{currentQuestion!.question}</p>

              <RadioGroup
                value={selectedAnswer ?? undefined}
                onValueChange={handleAnswerSelect}
                className="space-y-4"
                disabled={showFeedback}
              >
                {(Object.keys(currentQuestion!.options) as AnswerOption[]).map((optionKey) => {
                  const isCorrect = optionKey === currentQuestion!.correct_answer;
                  const isSelected = selectedAnswer === optionKey;

                  return (
                    <Label
                      key={optionKey}
                      htmlFor={optionKey}
                      className={cn(
                        "flex items-center space-x-3 rounded-md border p-4 transition-all duration-150 ease-in-out cursor-pointer",
                        "bg-card hover:bg-secondary/30", // Base and hover
                        !showFeedback && isSelected && "border-accent bg-accent/10 ring-2 ring-accent", // Selected but not submitted
                        showFeedback && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/50 ring-2 ring-green-500", // Correct answer shown
                        showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950/50 ring-2 ring-red-500", // Incorrect answer selected
                        showFeedback && "cursor-not-allowed opacity-80 hover:bg-card", // Disabled after feedback
                        showFeedback && !isSelected && !isCorrect && "opacity-60" // Dim unselected, incorrect options
                      )}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} className="border-primary text-primary focus:ring-accent shrink-0" />
                      <span className="flex-1">{currentQuestion!.options[optionKey]}</span>
                      {showFeedback && isSelected && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600 shrink-0" />}
                      {showFeedback && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-red-600 shrink-0" />}
                      {showFeedback && !isSelected && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600 shrink-0 opacity-50" />}
                    </Label>
                  );
                })}
              </RadioGroup>

              {showFeedback && (
                <div className="mt-4 rounded-md border border-muted bg-muted/30 p-4 text-sm dark:bg-muted/20">
                  <p className="font-semibold mb-1 text-foreground">Explanation:</p>
                  <p className="text-muted-foreground">{currentQuestion!.explanation}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {!showFeedback && (
                  <Button
                    onClick={handleSubmitAnswer}
                    className="flex-1 text-base py-2.5" // Use flex-1 for equal width potential
                    disabled={!selectedAnswer || isLoading}
                  >
                    Submit Answer
                  </Button>
                )}

                {showFeedback && !isQuizFinished && (
                  <Button onClick={handleNextQuestion} className="flex-1 text-base py-2.5">
                    Next Question
                  </Button>
                )}

                {/* Always show Restart Quiz button when quiz is displayed */}
                <Button onClick={handleRestartQuiz} variant="outline" className="flex-1 text-base py-2.5">
                  Restart Quiz
                </Button>
              </div>

              {isQuizFinished && (
                 <div className="text-center space-y-6 pt-6 border-t mt-6">
                   <p className="text-2xl font-bold text-primary">Quiz Complete!</p>
                   <p className="text-xl text-foreground">Your final score: <span className="font-bold">{score}</span> / {quiz.length}</p>
                   {/* Restart button is now always visible during quiz */}
                 </div>
              )}
            </div>
          )}

           {/* Message when only info is available */}
           {showInfoArea && !showQuizArea && !isLoading && (
              <div className="text-center space-y-4 pt-6 border-t mt-6">
                  <p className="text-muted-foreground">Background information generated, but no quiz questions could be created for this topic.</p>
                  <Button onClick={handleRestartQuiz} variant="outline" className="text-base py-2.5 px-6">
                      Try a Different Topic
                  </Button>
              </div>
           )}
        </CardContent>
        {/* Optional Footer for general actions or information */}
        {/* <CardFooter className="p-4 bg-muted/50 border-t">
           <p className="text-xs text-muted-foreground">Powered by AI</p>
        </CardFooter> */}
      </Card>
    </main>
  );
}
