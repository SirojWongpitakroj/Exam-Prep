import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FilesContext";
import { useQuiz } from "@/contexts/QuizContext";
import { toast } from "sonner";
import { saveChatMessage, getUserChatMessages, saveQuizToFirestore, canUserChat, canUserGenerateQuiz, incrementChatCount, incrementQuizCount } from "@/lib/firestoreService";
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
  const { setCurrentQuiz } = useQuiz();
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

    // Check if user can send chat message (free tier limit)
    const chatPermission = await canUserChat(user.id, user.plan || 'free');
    if (!chatPermission.allowed) {
      toast.error(chatPermission.reason || 'Chat limit reached');
      return;
    }

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

      // Increment chat count for usage tracking
      try {
        await incrementChatCount(user.id);
        console.log('📊 Chat count incremented');
      } catch (error) {
        console.error('Failed to increment chat count:', error);
      }

      // Send message to webhook and WAIT for response
      const response = await fetch('https://siroj6253.app.n8n.cloud/webhook/c5b0185d-0f9d-4d13-ad53-12aa607eedfa', {
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
        
        // Check for quiz in the response
        console.log('=== CHECKING FOR QUIZ ===');
        console.log('Is array?', Array.isArray(result));
        let quizDetected = false;
        let quizQuestions: any[] = [];
        
        if (Array.isArray(result)) {
          console.log('Array length:', result.length);
          for (const item of result) {
            console.log('Checking item:', item);
            if (item.output && typeof item.output === 'object') {
              console.log('Item has output, from field:', item.output.from);
              console.log('Has quizzes?', !!item.output.quizzes);
              
              // Check if "from" contains "Quiz"
              if (item.output.from && typeof item.output.from === 'string' && item.output.from.toLowerCase().includes('quiz')) {
                console.log('🎯 Quiz detected! From:', item.output.from);
                
                // Check if user can generate quiz (free tier limit)
                const quizPermission = await canUserGenerateQuiz(user.id, user.plan || 'free');
                if (!quizPermission.allowed) {
                  console.warn('⚠️ Quiz generation limit reached');
                  toast.error(quizPermission.reason || 'Quiz generation limit reached');
                  assistantContent = quizPermission.reason || 'You have reached your quiz generation limit. Upgrade to Pro for unlimited quizzes!';
                  break;
                }
                
                quizDetected = true;
                
                // Parse quiz data - handle different formats
                let rawQuizzes: any[] = [];
                
                // Format 1: item.output.quizzes array
                if (item.output.quizzes && Array.isArray(item.output.quizzes)) {
                  rawQuizzes = item.output.quizzes;
                  console.log('📋 Found quizzes in item.output.quizzes');
                }
                // Format 2: item.output itself has question/options
                else if (item.output.question && item.output.options) {
                  rawQuizzes = [item.output];
                  console.log('📋 Found quiz in item.output directly');
                }
                // Format 3: item has quizzes at root level
                else if (item.quizzes && Array.isArray(item.quizzes)) {
                  rawQuizzes = item.quizzes;
                  console.log('📋 Found quizzes in item.quizzes');
                }
                
                console.log('📋 Raw quizzes array:', JSON.stringify(rawQuizzes, null, 2));
                console.log('📋 Quizzes array length:', rawQuizzes.length);
                
                if (rawQuizzes.length > 0) {
                  try {
                    quizQuestions = rawQuizzes
                      .filter(q => q.question && q.options) // Only valid questions
                      .map((q: any, index: number) => {
                        console.log(`Processing question ${index}:`, JSON.stringify(q, null, 2));
                        
                        // Find correct answer index
                        let correctAnswerIndex = 0;
                        if (typeof q.answer === 'string') {
                          correctAnswerIndex = q.options.findIndex((opt: string) => 
                            opt.toLowerCase().trim() === q.answer.toLowerCase().trim()
                          );
                          if (correctAnswerIndex === -1) correctAnswerIndex = 0;
                        } else if (typeof q.answer === 'number') {
                          correctAnswerIndex = q.answer;
                        }
                        
                        return {
                          id: `q-${Date.now()}-${index}`,
                          question: q.question,
                          options: q.options,
                          correctAnswer: correctAnswerIndex,
                          explanation: q.explanation || undefined,
                        };
                      });
                    
                    console.log('📝 Parsed quiz questions:', quizQuestions.length);
                    
                    if (quizQuestions.length > 0) {
                      console.log('Quiz questions data:', JSON.stringify(quizQuestions, null, 2));
                      
                      // Get file names from checked files
                      const fileNames = checkedFiles.map(f => f.fileName).join(', ') || 'General Quiz';
                      
                      console.log('Attempting to save quiz to Firestore...');
                      console.log('User ID:', user.id);
                      console.log('Quiz title:', `Quiz - ${fileNames}`);
                      
                      // Prepare quiz data
                      const quizData = {
                        id: `quiz-${Date.now()}`,
                        user_id: user.id,
                        title: `Quiz - ${fileNames}`,
                        questions: quizQuestions,
                        createdAt: new Date(),
                        userPlan: user.plan || 'free',
                      };
                      
                      // Save to localStorage FIRST (always works)
                      try {
                        const storageKey = `quiz_${user.id}_latest`;
                        localStorage.setItem(storageKey, JSON.stringify(quizData));
                        console.log('💾 Quiz saved to localStorage');
                      } catch (storageError) {
                        console.error('Failed to save to localStorage:', storageError);
                      }
                      
                      // Try to save to Firestore with retry logic
                      let firestoreId = quizData.id;
                      let firestoreSaved = false;
                      
                      for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                          console.log(`📤 Attempting Firestore save (attempt ${attempt}/3)...`);
                          
                          firestoreId = await saveQuizToFirestore({
                            user_id: user.id,
                            title: `Quiz - ${fileNames}`,
                            questions: quizQuestions,
                            userPlan: user.plan || 'free',
                          });
                          
                          console.log('✅ Quiz saved to Firestore with ID:', firestoreId);
                          quizData.id = firestoreId; // Update with Firestore ID
                          firestoreSaved = true;
                          break; // Success, exit retry loop
                        } catch (saveError: any) {
                          console.error(`❌ Firestore save attempt ${attempt} failed:`, saveError);
                          console.error('Error details:', {
                            message: saveError?.message,
                            code: saveError?.code,
                            name: saveError?.name,
                          });
                          
                          if (attempt === 3) {
                            console.log('⚠️ All Firestore save attempts failed');
                            console.log('✅ Quiz still available from localStorage');
                          } else {
                            // Wait before retry
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                          }
                        }
                      }
                      
                      if (!firestoreSaved) {
                        console.warn('⚠️ Quiz saved to localStorage only, not Firestore');
                      }
                      
                      // Increment quiz count for usage tracking
                      try {
                        await incrementQuizCount(user.id);
                        console.log('📊 Quiz count incremented');
                      } catch (error) {
                        console.error('Failed to increment quiz count:', error);
                      }
                      
                      // Set current quiz in context (works either way)
                      setCurrentQuiz(quizData);
                      
                      toast.success('Quiz generated! Click "View Quiz" to start.');
                      
                      // Update assistant content to indicate quiz was generated
                      assistantContent = "I've generated a quiz for you based on your materials! Click the **View Quiz** button to start taking the quiz.";
                    } else {
                      console.warn('⚠️ No valid questions found in quiz data');
                    }
                  } catch (quizError) {
                    console.error('Error parsing quiz:', quizError);
                  }
                } else {
                  console.warn('⚠️ Quiz detected but quizzes array is empty');
                }
                break;
              }
            }
          }
        }
        
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
              <div className="mb-6 space-y-4">
                <div>
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
