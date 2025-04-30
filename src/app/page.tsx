// src/app/page.tsx
'use client';

import * as React from 'react';
import { useState } from 'react';
import type { GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions';
import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Info, Workflow, Code } from 'lucide-react'; // Added Code icon
import { cn } from "@/lib/utils";
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // Import SyntaxHighlighter
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style

type QuizQuestion = GenerateQuizQuestionsOutput['quiz'][0];
type AnswerOption = keyof QuizQuestion['options'];

// Custom renderer for code blocks in Markdown
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <SyntaxHighlighter
      style={a11yDark} // Use the imported style
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={cn("bg-muted px-1 py-0.5 rounded font-mono text-sm", className)} {...props}>
      {children}
    </code>
  );
};


export default function Home() {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [backgroundInfo, setBackgroundInfo] = useState<string | null>(null);
  const [flowchart, setFlowchart] = useState<string | null>(null); // State for flowchart
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
        description: 'Please enter a Computer Science topic.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setQuiz([]);
    setBackgroundInfo(null);
    setFlowchart(null); // Clear previous flowchart
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);

    try {
      const result = await generateQuizQuestions({ topic });

      // Set info and flowchart (they might be empty strings or null/undefined)
      setBackgroundInfo(result.information || null);
      setFlowchart(result.flowchart || null);

      if (result.quiz && result.quiz.length > 0) {
        setQuiz(result.quiz);
         toast({
           title: 'Success!',
           description: `Generated info, flowchart, and ${result.quiz.length}-question quiz for "${topic}".`,
           variant: 'success',
         });
         if (result.quiz.length < 15) {
            toast({
                title: 'Note',
                description: `Only generated ${result.quiz.length} questions. Some coding questions might be missing.`,
                variant: 'warning',
                duration: 5000,
            })
         }
      } else if (result.information && result.information.trim() !== '') {
        // Info generated, maybe flowchart, but no quiz
         toast({
           title: 'Quiz Generation Issue',
           description: `Generated background information${result.flowchart ? ' and a flowchart' : ''} for "${topic}", but couldn't create quiz questions. The information might lack specific details needed for quiz generation.`,
           variant: 'warning',
         });
      }
       else {
        // Neither info nor quiz generated (implies flowchart likely also failed or wasn't applicable)
        toast({
          title: 'Generation Failed',
          description: `Could not generate sufficient information, a flowchart, or a quiz for the topic "${topic}". Please try a different or more specific Computer Science topic.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'An unexpected error occurred while generating the content.';
      if (error instanceof Error) {
        // Check for specific overload error or API errors
        if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
            errorMessage = `The AI model is currently overloaded. Please wait a moment and try again.`;
        } else if (error.message.toLowerCase().includes('api key')) {
             errorMessage = `There seems to be an issue with the AI service API key. Please check configuration.`;
        }
         else {
            errorMessage = `Error generating content: ${error.message}. Please check the console for more details.`;
        }
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
       setBackgroundInfo(null);
       setFlowchart(null);
       setQuiz([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value as AnswerOption);
    setShowFeedback(false);
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
    setBackgroundInfo(null);
    setFlowchart(null); // Clear flowchart on restart
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
  const showFlowchartArea = flowchart && !isLoading;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold">Xinova</CardTitle>
          <CardDescription className="text-primary-foreground/80">Generate info, flowcharts & quizzes on CS topics!</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          {!showQuizArea && !showInfoArea && !showFlowchartArea && !isLoading && (
            <form onSubmit={handleGenerateQuiz} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-lg font-medium">Enter a Computer Science Topic:</Label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Binary Search Trees, TCP/IP, Big O Notation"
                  className="text-base transition-colors duration-200 focus:border-accent focus:ring-accent"
                />
              </div>
              <Button type="submit" className="w-full text-lg py-3 transition-transform duration-150 ease-in-out hover:scale-[1.02]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Content'
                )}
              </Button>
            </form>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="text-muted-foreground text-lg">Generating info, flowchart & quiz on "{topic}"...</p>
            </div>
          )}

           {/* Display Areas */}
          <div className="space-y-8">
              {showInfoArea && (
                 <div className="space-y-4 p-6 rounded-md border bg-card animate-in fade-in duration-500">
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Info className="h-5 w-5 text-accent" />
                      Background Information on "{topic}"
                    </h3>
                    <Separator />
                    {/* Render background info using ReactMarkdown */}
                    <ReactMarkdown
                      className="prose dark:prose-invert max-w-none text-base text-foreground leading-relaxed"
                       components={{ code: CodeBlock }} // Use custom code renderer
                     >
                      {backgroundInfo}
                    </ReactMarkdown>
                 </div>
              )}

              {showFlowchartArea && (
                 <div className="space-y-4 p-6 rounded-md border bg-card animate-in fade-in duration-500 delay-100">
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-accent" />
                      Flowchart / Key Steps for "{topic}"
                    </h3>
                    <Separator />
                    {/* Use pre-wrap to preserve formatting from the AI */}
                    <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap font-mono">
                      {flowchart}
                    </p>
                 </div>
              )}


              {showQuizArea && currentQuestion && ( // Ensure currentQuestion is not null
                <div className="space-y-6 animate-in fade-in duration-500 delay-200">
                  {/* Quiz Title */}
                  <h3 className="text-2xl font-semibold text-center text-primary">Quiz Time!</h3>

                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                     <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {quiz.length}</p>
                     <div className="flex items-center gap-2">
                        {currentQuestion.isCodingQuestion && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                                <Code className="h-3 w-3 mr-1" /> Coding
                            </Badge>
                        )}
                         <Badge
                            variant={
                              currentQuestion.difficulty === 'easy' ? 'success' :
                              currentQuestion.difficulty === 'medium' ? 'warning' :
                              'destructive'
                            }
                            className="uppercase text-xs px-2 py-1"
                         >
                           {currentQuestion.difficulty}
                         </Badge>
                     </div>
                  </div>

                  {/* Render question using ReactMarkdown */}
                   <ReactMarkdown
                     className="prose dark:prose-invert max-w-none text-xl font-semibold text-center text-foreground"
                     components={{ code: CodeBlock }} // Use custom code renderer
                   >
                     {currentQuestion.question}
                   </ReactMarkdown>


                  <RadioGroup
                    value={selectedAnswer ?? undefined}
                    onValueChange={handleAnswerSelect}
                    className="space-y-4"
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
                            "flex items-start space-x-3 rounded-md border p-4 transition-all duration-150 ease-in-out cursor-pointer", // Use items-start for better alignment with markdown
                            "bg-card hover:bg-secondary/30 transform hover:scale-[1.01]", // Base and hover with slight scale
                            !showFeedback && isSelected && "border-accent bg-accent/10 ring-2 ring-accent", // Selected but not submitted
                            showFeedback && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/50 ring-2 ring-green-500", // Correct answer shown
                            showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950/50 ring-2 ring-red-500", // Incorrect answer selected
                            showFeedback && "cursor-not-allowed opacity-80 hover:bg-card hover:scale-100", // Disabled after feedback, remove scale
                            showFeedback && !isSelected && !isCorrect && "opacity-60" // Dim unselected, incorrect options
                          )}
                        >
                          <RadioGroupItem value={optionKey} id={optionKey} className="border-primary text-primary focus:ring-accent shrink-0 mt-1" /> {/* Added mt-1 for alignment */}
                           {/* Render option using ReactMarkdown */}
                           <ReactMarkdown
                             className="prose dark:prose-invert max-w-none flex-1" // Added flex-1
                             components={{ code: CodeBlock }} // Use custom code renderer
                           >
                             {currentQuestion.options[optionKey]}
                           </ReactMarkdown>
                          {showFeedback && isSelected && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600 shrink-0 mt-1 animate-in zoom-in duration-300" />}
                          {showFeedback && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-red-600 shrink-0 mt-1 animate-in zoom-in duration-300" />}
                          {showFeedback && !isSelected && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600 shrink-0 opacity-50 mt-1" />}
                        </Label>
                      );
                    })}
                  </RadioGroup>

                  {showFeedback && (
                    <div className="mt-4 rounded-md border border-muted bg-muted/30 p-4 text-sm dark:bg-muted/20 animate-in fade-in duration-300">
                      <p className="font-semibold mb-1 text-foreground">Explanation:</p>
                      {/* Render explanation using ReactMarkdown */}
                      <ReactMarkdown
                        className="prose dark:prose-invert max-w-none text-muted-foreground"
                        components={{ code: CodeBlock }}
                      >
                        {currentQuestion.explanation}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    {!showFeedback && (
                      <Button
                        onClick={handleSubmitAnswer}
                        className="flex-1 text-base py-2.5 transition-transform duration-150 ease-in-out hover:scale-[1.02]"
                        disabled={!selectedAnswer || isLoading}
                      >
                        Submit Answer
                      </Button>
                    )}

                    {showFeedback && !isQuizFinished && (
                      <Button onClick={handleNextQuestion} className="flex-1 text-base py-2.5 transition-transform duration-150 ease-in-out hover:scale-[1.02]">
                        Next Question
                      </Button>
                    )}

                    {/* Show Restart Button if any content (info, flowchart, or quiz) is displayed */}
                    {(showInfoArea || showFlowchartArea || showQuizArea) && (
                        <Button onClick={handleRestartQuiz} variant="outline" className="flex-1 text-base py-2.5 transition-transform duration-150 ease-in-out hover:scale-[1.02]">
                            Start Over
                        </Button>
                    )}
                  </div>

                  {isQuizFinished && (
                     <div className="text-center space-y-6 pt-6 border-t mt-6 animate-in fade-in duration-500">
                       <p className="text-2xl font-bold text-primary">Quiz Complete!</p>
                       <p className="text-xl text-foreground">Your final score: <span className="font-bold">{score}</span> / {quiz.length}</p>
                       {/* Restart button is now part of the conditional rendering above */}
                     </div>
                  )}
                </div>
              )}

              {/* Message when only info/flowchart is available */}
              {!showQuizArea && (showInfoArea || showFlowchartArea) && !isLoading && (
                  <div className="text-center space-y-4 pt-6 border-t mt-6 animate-in fade-in duration-500">
                      <p className="text-muted-foreground">Background content generated, but no quiz questions could be created for this topic.</p>
                      <Button onClick={handleRestartQuiz} variant="outline" className="text-base py-2.5 px-6 transition-transform duration-150 ease-in-out hover:scale-[1.02]">
                          Try a Different Topic
                      </Button>
                  </div>
               )}
            </div> {/* End of Display Areas wrapper */}

        </CardContent>
      </Card>
    </main>
  );
}
