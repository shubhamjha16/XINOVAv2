'use client';

import * as React from 'react';
import { useState } from 'react';
import type { GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions';
import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type QuizQuestion = GenerateQuizQuestionsOutput['quiz'][0];
type AnswerOption = keyof QuizQuestion['options'];

export default function Home() {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
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
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);

    try {
      const result = await generateQuizQuestions({ topic });
      if (result.quiz && result.quiz.length > 0) {
        setQuiz(result.quiz);
      } else {
        toast({
          title: 'Error',
          description: 'Could not generate quiz. Please try a different topic.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while generating the quiz.',
        variant: 'destructive',
      });
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
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsLoading(false);
    setScore(0);
  };

  const currentQuestion = quiz.length > 0 ? quiz[currentQuestionIndex] : null;
  const isQuizFinished = quiz.length > 0 && currentQuestionIndex === quiz.length - 1 && showFeedback;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Quiz Master</CardTitle>
          <CardDescription>Generate multiple-choice quizzes on any topic!</CardDescription>
        </CardHeader>
        <CardContent>
          {!currentQuestion && !isLoading && (
            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-lg">Enter a Topic:</Label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Solar System, React Hooks, World War II"
                  className="text-base"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Quiz'
                )}
              </Button>
            </form>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="text-muted-foreground">Generating your quiz...</p>
            </div>
          )}

          {currentQuestion && !isLoading && (
            <div className="space-y-6">
              <div className="text-center">
                 <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {quiz.length}</p>
                 <p className={`text-xs font-semibold uppercase px-2 py-1 inline-block rounded ${
                   currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                   currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                   'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                 }`}>
                   {currentQuestion.difficulty}
                 </p>
              </div>

              <p className="text-xl font-semibold text-center">{currentQuestion.question}</p>

              <RadioGroup
                value={selectedAnswer ?? undefined}
                onValueChange={handleAnswerSelect}
                className="space-y-3"
                disabled={showFeedback}
              >
                {(Object.keys(currentQuestion.options) as AnswerOption[]).map((optionKey) => {
                  const isCorrect = optionKey === currentQuestion.correct_answer;
                  const isSelected = selectedAnswer === optionKey;

                  return (
                    <Label
                      key={optionKey}
                      htmlFor={optionKey}
                      className={cn(
                        "flex items-center space-x-3 rounded-md border p-4 transition-colors cursor-pointer",
                        showFeedback && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/30",
                        showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/30",
                        !showFeedback && isSelected && "border-accent bg-accent/10",
                        !showFeedback && "hover:bg-secondary/50",
                        showFeedback && "cursor-not-allowed opacity-70"
                      )}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} className="border-primary text-primary focus:ring-accent" />
                      <span>{currentQuestion.options[optionKey]}</span>
                      {showFeedback && isSelected && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600" />}
                      {showFeedback && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-red-600" />}
                      {showFeedback && !isSelected && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600" />}
                    </Label>
                  );
                })}
              </RadioGroup>

              {showFeedback && (
                <div className="mt-4 rounded-md border border-border bg-muted/50 p-4 text-sm dark:bg-muted/20">
                  <p className="font-semibold">Explanation:</p>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}

              {!showFeedback && (
                <Button
                  onClick={handleSubmitAnswer}
                  className="w-full"
                  disabled={!selectedAnswer || isLoading}
                >
                  Submit Answer
                </Button>
              )}

              {showFeedback && !isQuizFinished && (
                <Button onClick={handleNextQuestion} className="w-full">
                  Next Question
                </Button>
              )}

              {isQuizFinished && (
                 <div className="text-center space-y-4 pt-4">
                   <p className="text-2xl font-bold">Quiz Complete!</p>
                   <p className="text-lg">Your score: {score} / {quiz.length}</p>
                   <Button onClick={handleRestartQuiz} variant="outline">
                     Start New Quiz
                   </Button>
                 </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

// Helper function cn (from shadcn/ui)
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
