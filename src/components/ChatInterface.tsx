import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FilesContext";
import { toast } from "sonner";
import { saveChatMessage, getUserChatMessages } from "@/lib/firestoreService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        
        console.log('=== WEBHOOK RESPONSE ===');
        console.log('Full response:', JSON.stringify(result, null, 2));
        console.log('Response type:', Array.isArray(result) ? 'array' : typeof result);
        
        let assistantContent = "";
        
        // Handle array format with nested output
        if (Array.isArray(result)) {
          console.log('Response is an array with', result.length, 'items');
          
          // Look for Summarization output
          for (const item of result) {
            console.log('Item structure:', Object.keys(item));
            
            if (item.output && typeof item.output === 'object') {
              console.log('Processing output item, from:', item.output.from);
              console.log('Has output.output?', !!item.output.output);
              
              // Check if it's from Summarization
              if (item.output.from === 'Summarization' && item.output.output) {
                console.log('✅ Found Summarization output, length:', item.output.output.length);
                assistantContent = item.output.output;
                break; // Use first Summarization found
              }
              // Fallback to model output
              else if (item.output.from === 'model' && item.output.output && !assistantContent) {
                console.log('Found model output');
                assistantContent = item.output.output;
              }
            }
          }
        }
        // Handle single object format
        else if (result.output && typeof result.output === 'object') {
          console.log('Response is a single object with output');
          console.log('Output from:', result.output.from);
          
          if (result.output.from === 'Summarization' && result.output.output) {
            console.log('✅ Found Summarization in single object');
            assistantContent = result.output.output;
          } else if (result.output.output) {
            console.log('Found output in single object');
            assistantContent = result.output.output;
          }
        }
        // Handle old format
        else if (result.response || result.message) {
          console.log('Using old format (response/message)');
          assistantContent = result.response || result.message;
        }
        
        // Fallback if no content found
        if (!assistantContent || assistantContent.trim() === "") {
          console.log('⚠️ No content found, using fallback');
          assistantContent = "I received your question and I'm processing it. I'll provide an answer based on your uploaded materials!";
        }
        
        console.log('✅ Final content length:', assistantContent.length);
        console.log('First 100 chars:', assistantContent.substring(0, 100));
        
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
                  ) : message.role === "assistant" ? (
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-white prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-200 prose-strong:text-white prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:text-gray-200 prose-code:text-cyan-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-cyan-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
