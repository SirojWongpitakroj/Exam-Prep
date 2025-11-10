import { X, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface QuizPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QuizPanel = ({ isOpen, onClose }: QuizPanelProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  const quizQuestions: Question[] = [
    {
      id: "1",
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
    },
    {
      id: "2",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
    },
    {
      id: "3",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
    },
  ];

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

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-quiz border-l border-border h-screen flex flex-col animate-in slide-in-from-right">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Quiz</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {showResults ? (
          <div className="space-y-4">
            <Card className="p-6 bg-card border-border text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">Quiz Complete!</h3>
              <p className="text-4xl font-bold text-primary my-4">
                {calculateScore()}/{quizQuestions.length}
              </p>
              <p className="text-muted-foreground">
                You got {calculateScore()} out of {quizQuestions.length} questions correct
              </p>
            </Card>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Review Answers:</h4>
              {quizQuestions.map((q, index) => {
                const isCorrect = selectedAnswers[index] === q.correctAnswer;
                return (
                  <Card key={q.id} className="p-4 bg-card border-border">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm text-foreground">{q.question}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      Correct: {q.options[q.correctAnswer]}
                    </p>
                  </Card>
                );
              })}
            </div>

            <Button onClick={resetQuiz} className="w-full">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
            </div>

            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
                }}
              />
            </div>

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">
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
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="w-full"
            >
              {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
