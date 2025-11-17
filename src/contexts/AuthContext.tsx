import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface User {
  email: string;
  name: string;
  id: string;
  plan: "free" | "pro";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name: string, id: string) => void;
  logout: () => void;
  updatePlan: (plan: "free" | "pro") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        const email = firebaseUser.email || "user@example.com";
        const name = firebaseUser.displayName || "User";
        const id = firebaseUser.uid;
        const storedPlan = localStorage.getItem("userPlan") as "free" | "pro" | null;
        const plan = storedPlan || "free";
        
        setUser({ email, name, id, plan });
        setIsAuthenticated(true);
        
        // Also store in localStorage as backup
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", name);
        localStorage.setItem("userId", id);
        if (!storedPlan) {
          localStorage.setItem("userPlan", "free");
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        
        // Clear localStorage
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("userPlan");
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = (email: string, name: string, id: string) => {
    const storedPlan = localStorage.getItem("userPlan") as "free" | "pro" | null;
    const plan = storedPlan || "free";
    
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);
    localStorage.setItem("userId", id);
    localStorage.setItem("userPlan", plan);
    setUser({ email, name, id, plan });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local state (but keep uploaded files in localStorage)
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      localStorage.removeItem("userPlan");
      
      // Note: We keep uploaded_files_{userId} in localStorage
      // so files persist across login/logout sessions
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updatePlan = (plan: "free" | "pro") => {
    if (user) {
      const updatedUser = { ...user, plan };
      setUser(updatedUser);
      localStorage.setItem("userPlan", plan);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updatePlan }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

