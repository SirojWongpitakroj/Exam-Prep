import React, { createContext, useContext, useState } from "react";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title?: string;
  questions: QuizQuestion[];
  createdAt: Date;
}

interface QuizContextType {
  currentQuiz: Quiz | null;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  isQuizPanelOpen: boolean;
  openQuizPanel: () => void;
  closeQuizPanel: () => void;
  hasActiveQuiz: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isQuizPanelOpen, setIsQuizPanelOpen] = useState(false);

  const openQuizPanel = () => setIsQuizPanelOpen(true);
  const closeQuizPanel = () => setIsQuizPanelOpen(false);

  return (
    <QuizContext.Provider
      value={{
        currentQuiz,
        setCurrentQuiz,
        isQuizPanelOpen,
        openQuizPanel,
        closeQuizPanel,
        hasActiveQuiz: currentQuiz !== null,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};

