import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Test Email Button Component
 * 
 * This button sends a test email reminder to the CURRENT USER ONLY (not all users).
 * The email is sent immediately when clicked.
 * 
 * Usage:
 * - Add this button to your Profile page or Settings page
 * - Only visible to authenticated users
 * - Sends quiz reminder email to the user who clicks it
 * 
 * To use:
 * 1. Import this component: import { TestEmailButton } from "@/components/TestEmailButton";
 * 2. Add to your page: <TestEmailButton />
 */
export const TestEmailButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleTestEmail = async () => {
    if (!user) {
      toast.error("Please sign in to test emails");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("📧 Sending test email to current user...");
      
      const functions = getFunctions();
      const sendTestEmail = httpsCallable(functions, "sendTestEmailToMe");
      
      const result = await sendTestEmail();
      
      console.log("✅ Email test result:", result);
      
      if (result.data && typeof result.data === 'object' && 'success' in result.data) {
        const data = result.data as { 
          success: boolean; 
          message: string; 
          email?: string;
          quizTitle?: string;
        };
        
        if (data.success) {
          toast.success(data.message || "Test email sent successfully!");
          if (data.email) {
            console.log(`📨 Email sent to: ${data.email}`);
          }
          if (data.quizTitle) {
            console.log(`📚 Quiz: ${data.quizTitle}`);
          }
        } else {
          toast.error(data.message || "Failed to send test email");
        }
      } else {
        toast.success("Test email sent successfully!");
      }
    } catch (error: any) {
      console.error("❌ Error sending test email:", error);
      
      if (error.code === "functions/not-found") {
        toast.error("Email function not deployed yet. Please deploy functions first.");
      } else if (error.code === "functions/unauthenticated") {
        toast.error("Please sign in to test emails");
      } else if (error.code === "functions/failed-precondition") {
        toast.error(error.message || "Cannot send email");
      } else {
        toast.error(error.message || "Failed to send test email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={handleTestEmail}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sending...</span>
        </>
      ) : (
        <>
          <Mail className="w-4 h-4" />
          <span>Test Email Reminder</span>
        </>
      )}
    </Button>
  );
};

