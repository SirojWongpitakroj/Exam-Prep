import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FilesContext";
import { toast } from "sonner";
import { saveChatMessage, getUserChatMessages } from "@/lib/firestoreService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm your Exam Prep Assistant. Upload your study materials and ask me anything - I can provide summaries, key takeaways, generate quizzes, and help you understand complex topics!",
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { user } = useAuth();
  const { checkedFiles } = useFiles();

  // Load chat history from Firestore when user logs in
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id) {
        setMessages([WELCOME_MESSAGE]);
        setLoadingHistory(false);
        return;
      }

      try {
        setLoadingHistory(true);
        const chatHistory = await getUserChatMessages(user.id);
        
        if (chatHistory.length > 0) {
          // Convert Firestore messages to Message format
          const loadedMessages: Message[] = chatHistory.map(msg => ({
            id: msg.id || Math.random().toString(36).substr(2, 9),
            role: msg.role,
            content: msg.content,
          }));
          
          // Add welcome message at the beginning if not present
          setMessages([WELCOME_MESSAGE, ...loadedMessages]);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Failed to load chat history");
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user?.id]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    // Add typing indicator (temporary message)
    const typingIndicatorId = "typing-" + Date.now();
    const typingMessage: Message = {
      id: typingIndicatorId,
      role: "assistant",
      content: "typing...",
    };

    setMessages((prev) => [...prev, userMessage, typingMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to Firestore
      await saveChatMessage({
        user_id: user.id,
        role: "user",
        content: currentInput,
      });

      // Send message to webhook and WAIT for response
      const response = await fetch('https://siroj6253.app.n8n.cloud/webhook-test/c5b0185d-0f9d-4d13-ad53-12aa607eedfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          user_id: user.id,
          userPlan: user.plan || 'free',
          timestamp: new Date().toISOString(),
          checkedFiles: checkedFiles.map(f => ({
            fileName: f.fileName,
            fileType: f.fileType,
            fileSize: f.fileSize,
            firestoreId: f.firestoreId,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Get the actual response from webhook
        const assistantContent = result.response || result.message || "I received your question and I'm processing it. I'll provide an answer based on your uploaded materials!";
        
        // Remove typing indicator and add actual response
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== typingIndicatorId);
          return [...filtered, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: assistantContent,
          }];
        });

        // Save assistant message to Firestore
        await saveChatMessage({
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove typing indicator and add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
      };
      
      setMessages((prev) => {
        const filtered = prev.filter(msg => msg.id !== typingIndicatorId);
        return [...filtered, errorMessage];
      });

      // Save error message to Firestore
      try {
        await saveChatMessage({
          user_id: user.id,
          role: "assistant",
          content: errorMessage.content,
        });
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Summarize the main points",
    "Create a quiz",
    "Explain key concepts",
    "Generate flashcards",
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {messages.length === 1 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(prompt)}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-chat-user text-primary-foreground"
                      : "bg-chat-assistant text-foreground"
                  }`}
                >
                  {message.content === "typing..." ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </Card>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="border-t border-border p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your study materials..."
            className="min-h-[60px] resize-none bg-secondary border-border"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end"
            size="lg"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
