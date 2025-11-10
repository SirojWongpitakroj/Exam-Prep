import { FileUploadSidebar } from "@/components/FileUploadSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { QuizPanel } from "@/components/QuizPanel";
import { Button } from "@/components/ui/button";
import { ListChecks } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <FileUploadSidebar />
      <div className="flex-1 flex flex-col relative">
        <ChatInterface />
        
        {!isQuizOpen && (
          <Button
            onClick={() => setIsQuizOpen(true)}
            className="fixed right-4 bottom-4 h-14 px-6 shadow-lg"
            size="lg"
          >
            <ListChecks className="w-5 h-5 mr-2" />
            Open Quiz
          </Button>
        )}
      </div>
      <QuizPanel isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </div>
  );
};

export default Index;
