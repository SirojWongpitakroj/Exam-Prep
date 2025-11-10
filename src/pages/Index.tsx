import { FileUploadSidebar } from "@/components/FileUploadSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { QuizPanel } from "@/components/QuizPanel";
import { Button } from "@/components/ui/button";
import { ListChecks, Sparkles, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";

const Index = () => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarResize = (size: number) => {
    // Auto-collapse when resized below 10%
    if (size < 10 && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal">
        {!isSidebarCollapsed && (
          <>
            <ResizablePanel 
              defaultSize={20} 
              minSize={10} 
              maxSize={35}
              onResize={handleSidebarResize}
            >
              <FileUploadSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(true)}
              />
            </ResizablePanel>
            <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          </>
        )}
        
        <ResizablePanel defaultSize={80}>
          <div className="flex-1 flex flex-col h-full">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="mr-2 h-9 w-9 p-0"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </Button>
                )}
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold text-foreground">Exam Prep Assistant</h1>
              </div>
              {!isQuizOpen && (
                <Button
                  onClick={() => setIsQuizOpen(true)}
                  size="default"
                >
                  <ListChecks className="w-4 h-4 mr-2" />
                  Open Quiz
                </Button>
              )}
            </div>
            <ChatInterface />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      <QuizPanel isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </div>
  );
};

export default Index;
