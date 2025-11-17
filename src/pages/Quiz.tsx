import { X, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const Quiz = () => {
  const navigate = useNavigate();
  const { currentQuiz } = useQuiz();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  // Redirect to home if no quiz available
  useEffect(() => {
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
      navigate('/');
    }
  }, [currentQuiz, navigate]);

  if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
    return null;
  }

  const quizQuestions: Question[] = currentQuiz.questions;

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: parseInt(value),
    });
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const handleBackToChat = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToChat}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Chat</span>
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold text-foreground">
              {currentQuiz.title || "Quiz"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToChat}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Quiz Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {showResults ? (
              <div className="space-y-6">
                <Card className="p-8 bg-card border-border text-center">
                  <h3 className="text-3xl font-bold text-foreground mb-4">Quiz Complete!</h3>
                  <p className="text-6xl font-bold text-primary my-6">
                    {calculateScore()}/{quizQuestions.length}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    You got {calculateScore()} out of {quizQuestions.length} questions correct
                  </p>
                  <p className="text-2xl font-semibold text-foreground mt-4">
                    {Math.round((calculateScore() / quizQuestions.length) * 100)}%
                  </p>
                </Card>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">Review Answers:</h4>
                  {quizQuestions.map((q, index) => {
                    const isCorrect = selectedAnswers[index] === q.correctAnswer;
                    return (
                      <Card key={q.id} className="p-6 bg-card border-border">
                        <div className="flex items-start gap-3 mb-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground mb-2">
                              Question {index + 1}: {q.question}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p className="text-muted-foreground">
                                Your answer: <span className={isCorrect ? "text-green-500" : "text-destructive"}>
                                  {q.options[selectedAnswers[index]] || "Not answered"}
                                </span>
                              </p>
                              {!isCorrect && (
                                <p className="text-green-500">
                                  Correct answer: {q.options[q.correctAnswer]}
                                </p>
                              )}
                              {q.explanation && (
                                <p className="text-muted-foreground mt-2 pt-2 border-t border-border">
                                  <span className="font-medium">Explanation:</span> {q.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button onClick={resetQuiz} variant="outline" className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={handleBackToChat} className="flex-1">
                    Back to Chat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="text-lg">Question {currentQuestion + 1} of {quizQuestions.length}</span>
                  <span className="text-lg font-medium">{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
                </div>

                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{
                      width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
                    }}
                  />
                </div>

                <Card className="p-8 bg-card border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-6">
                    {quizQuestions[currentQuestion].question}
                  </h3>

                  <RadioGroup
                    value={selectedAnswers[currentQuestion]?.toString()}
                    onValueChange={handleAnswerSelect}
                    className="space-y-3"
                  >
                    {quizQuestions[currentQuestion].options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={selectedAnswers[currentQuestion] === undefined}
                    className="flex-1"
                  >
                    {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;

