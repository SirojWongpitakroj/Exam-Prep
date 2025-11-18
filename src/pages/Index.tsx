import { FileUploadSidebar } from "@/components/FileUploadSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Sparkles, PanelLeftOpen, User, Zap, BookOpen } from "lucide-react";
import React, { useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Link, useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarPanelRef = React.useRef<any>(null);
  const { hasActiveQuiz, currentQuiz } = useQuiz();
  const navigate = useNavigate();

  const handleToggleSidebar = () => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      // Wait for state update, then resize to 25%
      setTimeout(() => {
        if (sidebarPanelRef.current) {
          sidebarPanelRef.current.resize(25);
        }
      }, 0);
    } else {
      setIsSidebarCollapsed(true);
    }
  };

  const handleViewQuiz = () => {
    navigate('/quiz');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel 
          ref={sidebarPanelRef}
          defaultSize={25} 
          minSize={isSidebarCollapsed ? 0 : 15} 
          maxSize={isSidebarCollapsed ? 0 : 40}
          collapsible={true}
          collapsedSize={0}
        >
          {!isSidebarCollapsed && (
            <FileUploadSidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(true)}
            />
          )}
        </ResizablePanel>
        
        {!isSidebarCollapsed && (
          <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
        )}
        
        <ResizablePanel defaultSize={80}>
          <div className="flex flex-col h-full relative">
            <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                {isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSidebar}
                    className="mr-2 h-9 w-9 p-0"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </Button>
                )}
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold text-foreground">Exam Prep Assistant</h1>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleViewQuiz}
                  className="text-white ml-3 gap-2 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 font-bold brightness-110"
                >
                  <BookOpen className="w-4 h-4 text-white opacity-100" />
                  <span className="text-white">View Quiz</span>
                  {currentQuiz?.questions && (
                    <span className="ml-1 text-xs text-white opacity-100">
                      ({currentQuiz.questions.length})
                    </span>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="gap-2"
                >
                  <Link to="/pricing">
                    <Zap className="w-4 h-4" />
                    <span>Upgrade</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                >
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
