import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Test Email Button Component
 * 
 * This button allows you to manually trigger the daily email reminder
 * without waiting for the scheduled time (7 AM).
 * 
 * Usage:
 * - Add this button to your Profile page or Settings page
 * - Only visible to authenticated users
 * - Sends quiz reminder emails to all users with quizzes
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
      console.log("🔔 Triggering manual email reminder...");
      
      const functions = getFunctions();
      const sendReminders = httpsCallable(functions, "sendQuizRemindersManual");
      
      const result = await sendReminders();
      
      console.log("✅ Email test result:", result);
      
      if (result.data && typeof result.data === 'object' && 'success' in result.data) {
        const data = result.data as { success: boolean; message: string };
        if (data.success) {
          toast.success(data.message || "Test emails sent successfully!");
        } else {
          toast.error("Failed to send test emails");
        }
      } else {
        toast.success("Test email function triggered successfully!");
      }
    } catch (error: any) {
      console.error("❌ Error sending test emails:", error);
      
      if (error.code === "functions/not-found") {
        toast.error("Email function not deployed yet. Please deploy functions first.");
      } else if (error.code === "functions/unauthenticated") {
        toast.error("Please sign in to test emails");
      } else {
        toast.error(error.message || "Failed to send test emails");
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

