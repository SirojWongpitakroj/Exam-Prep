import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FilesProvider } from "./contexts/FilesContext";
import { QuizProvider } from "./contexts/QuizContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FilesProvider>
        <QuizProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QuizProvider>
      </FilesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
