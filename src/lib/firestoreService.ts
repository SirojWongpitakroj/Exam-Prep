import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";

// Interface for uploaded file data in Firestore
export interface UploadedFileData {
  id?: string; // Firestore doc ID
  fileName: string;
  fileSize: string;
  fileType: string;
  user_id: string;
  userPlan: "free" | "pro";
  uploadedAt: Date;
  // Free tier constraints tracking
  fileSizeMB: number;
}

// Free tier limits
export const FREE_TIER_CONSTRAINTS = {
  pdf: { maxFiles: 3, maxSizeMB: 5 },
  image: { maxFiles: 5, maxSizeMB: 1 },
  csv: { maxFiles: 1, maxRows: 500 },
};

// Save uploaded file to Firestore
export const saveFileToFirestore = async (fileData: Omit<UploadedFileData, 'id' | 'uploadedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "uploaded_files"), {
      ...fileData,
      uploadedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving file to Firestore:", error);
    throw error;
  }
};

// Get all files for a specific user
export const getUserFiles = async (userId: string): Promise<UploadedFileData[]> => {
  try {
    const q = query(
      collection(db, "uploaded_files"),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const files: UploadedFileData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      files.push({
        id: doc.id,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        user_id: data.user_id,
        userPlan: data.userPlan,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        fileSizeMB: data.fileSizeMB,
      });
    });
    
    return files;
  } catch (error) {
    console.error("Error getting user files:", error);
    throw error;
  }
};

// Delete a file from Firestore
export const deleteFileFromFirestore = async (fileId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "uploaded_files", fileId));
  } catch (error) {
    console.error("Error deleting file from Firestore:", error);
    throw error;
  }
};

// Get file category from fileType
export const getFileCategoryFromType = (fileType: string): 'pdf' | 'image' | 'csv' | 'other' => {
  const mimeType = fileType.toLowerCase();
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'text/csv') return 'csv';
  return 'other';
};

// Check free tier constraints for a user
export const checkFreeTierConstraints = async (
  userId: string, 
  newFile: { fileType: string; fileSizeMB: number }
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const userFiles = await getUserFiles(userId);
    const category = getFileCategoryFromType(newFile.fileType);
    
    // Count existing files by category
    const existingFilesByCategory = userFiles.filter(
      f => getFileCategoryFromType(f.fileType) === category
    );
    
    if (category === 'pdf') {
      if (existingFilesByCategory.length >= FREE_TIER_CONSTRAINTS.pdf.maxFiles) {
        return { 
          allowed: false, 
          reason: `Free plan allows maximum ${FREE_TIER_CONSTRAINTS.pdf.maxFiles} PDF files` 
        };
      }
      if (newFile.fileSizeMB > FREE_TIER_CONSTRAINTS.pdf.maxSizeMB) {
        return { 
          allowed: false, 
          reason: `PDF files must be under ${FREE_TIER_CONSTRAINTS.pdf.maxSizeMB}MB on free plan` 
        };
      }
    } else if (category === 'image') {
      if (existingFilesByCategory.length >= FREE_TIER_CONSTRAINTS.image.maxFiles) {
        return { 
          allowed: false, 
          reason: `Free plan allows maximum ${FREE_TIER_CONSTRAINTS.image.maxFiles} image files` 
        };
      }
      if (newFile.fileSizeMB > FREE_TIER_CONSTRAINTS.image.maxSizeMB) {
        return { 
          allowed: false, 
          reason: `Image files must be under ${FREE_TIER_CONSTRAINTS.image.maxSizeMB}MB on free plan` 
        };
      }
    } else if (category === 'csv') {
      if (existingFilesByCategory.length >= FREE_TIER_CONSTRAINTS.csv.maxFiles) {
        return { 
          allowed: false, 
          reason: `Free plan allows maximum ${FREE_TIER_CONSTRAINTS.csv.maxFiles} CSV file` 
        };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("Error checking free tier constraints:", error);
    return { allowed: true }; // Allow on error to not block user
  }
};

// ============================================
// CHAT MESSAGES FUNCTIONS
// ============================================

export interface ChatMessage {
  id?: string; // Firestore doc ID
  user_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Save a chat message to Firestore
export const saveChatMessage = async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "chat_messages"), {
      ...messageData,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving chat message to Firestore:", error);
    throw error;
  }
};

// Get all chat messages for a specific user
export const getUserChatMessages = async (userId: string): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, "chat_messages"),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        user_id: data.user_id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
      });
    });
    
    // Sort by timestamp (oldest first)
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  } catch (error) {
    console.error("Error getting user chat messages:", error);
    throw error;
  }
};

// Delete a chat message from Firestore
export const deleteChatMessage = async (messageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "chat_messages", messageId));
  } catch (error) {
    console.error("Error deleting chat message from Firestore:", error);
    throw error;
  }
};

// Delete all chat messages for a user
export const deleteAllUserChatMessages = async (userId: string): Promise<void> => {
  try {
    const messages = await getUserChatMessages(userId);
    const deletePromises = messages.map(msg => {
      if (msg.id) {
        return deleteDoc(doc(db, "chat_messages", msg.id));
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting all user chat messages:", error);
    throw error;
  }
};

// ============================================
// QUIZ FUNCTIONS
// ============================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizData {
  id?: string; // Firestore doc ID
  user_id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: Date;
  userPlan: "free" | "pro";
}

// Save a quiz to Firestore
export const saveQuizToFirestore = async (quizData: Omit<QuizData, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log("🔄 saveQuizToFirestore called");
    console.log("📊 Quiz data to save:", {
      user_id: quizData.user_id,
      title: quizData.title,
      questionCount: quizData.questions.length,
      userPlan: quizData.userPlan,
    });
    
    // Validate data before saving
    if (!quizData.user_id) {
      throw new Error("user_id is required");
    }
    if (!quizData.questions || quizData.questions.length === 0) {
      throw new Error("questions array is empty");
    }
    
    console.log("✅ Data validation passed");
    
    // Serialize questions to ensure they're Firestore-compatible
    const serializedQuestions = quizData.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      ...(q.explanation && { explanation: q.explanation })
    }));
    
    const dataToSave = {
      user_id: quizData.user_id,
      title: quizData.title,
      questions: serializedQuestions,
      userPlan: quizData.userPlan,
      createdAt: Timestamp.now(),
    };
    
    console.log("📤 Sending to Firestore...");
    console.log("📋 Complete data structure:", JSON.stringify(dataToSave, null, 2));
    
    const docRef = await addDoc(collection(db, "quizzes"), dataToSave);
    
    console.log("✅ Firestore document created with ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error saving quiz to Firestore:", error);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    throw error;
  }
};

// Get all quizzes for a specific user (sorted by most recent first)
export const getUserQuizzes = async (userId: string): Promise<QuizData[]> => {
  try {
    const q = query(
      collection(db, "quizzes"),
      where("user_id", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const quizzes: QuizData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quizzes.push({
        id: doc.id,
        user_id: data.user_id,
        title: data.title,
        questions: data.questions,
        createdAt: data.createdAt?.toDate() || new Date(),
        userPlan: data.userPlan,
      });
    });

    // Sort by timestamp (newest first)
    return quizzes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error getting user quizzes:", error);
    throw error;
  }
};

// Get the latest quiz for a user
export const getLatestUserQuiz = async (userId: string): Promise<QuizData | null> => {
  try {
    const quizzes = await getUserQuizzes(userId);
    return quizzes.length > 0 ? quizzes[0] : null;
  } catch (error) {
    console.error("Error getting latest user quiz:", error);
    return null;
  }
};

// Delete a quiz from Firestore
export const deleteQuizFromFirestore = async (quizId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "quizzes", quizId));
  } catch (error) {
    console.error("Error deleting quiz from Firestore:", error);
    throw error;
  }
};

// Delete all quizzes for a user
export const deleteAllUserQuizzes = async (userId: string): Promise<void> => {
  try {
    const quizzes = await getUserQuizzes(userId);
    const deletePromises = quizzes.map(quiz => {
      if (quiz.id) {
        return deleteDoc(doc(db, "quizzes", quiz.id));
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting all user quizzes:", error);
    throw error;
  }
};

// ============================================
// USAGE TRACKING FUNCTIONS
// ============================================

export interface UserUsage {
  user_id: string;
  chatCount: number;
  quizCount: number;
  lastChatAt?: Date;
  lastQuizAt?: Date;
  // File upload tracking (cumulative, never decrements)
  totalPdfUploads: number;
  totalImageUploads: number;
  totalCsvUploads: number;
  userPlan: "free" | "pro";
  createdAt: Date;
  updatedAt: Date;
}

// Get or create user usage document
export const getUserUsage = async (userId: string): Promise<UserUsage | null> => {
  try {
    const q = query(
      collection(db, "user_usage"),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        user_id: data.user_id,
        chatCount: data.chatCount || 0,
        quizCount: data.quizCount || 0,
        lastChatAt: data.lastChatAt?.toDate(),
        lastQuizAt: data.lastQuizAt?.toDate(),
        totalPdfUploads: data.totalPdfUploads || 0,
        totalImageUploads: data.totalImageUploads || 0,
        totalCsvUploads: data.totalCsvUploads || 0,
        userPlan: data.userPlan || 'free',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user usage:", error);
    return null;
  }
};

// Initialize user usage document
export const initializeUserUsage = async (userId: string, userPlan: "free" | "pro"): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "user_usage"), {
      user_id: userId,
      chatCount: 0,
      quizCount: 0,
      totalPdfUploads: 0,
      totalImageUploads: 0,
      totalCsvUploads: 0,
      userPlan: userPlan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error initializing user usage:", error);
    throw error;
  }
};

// Increment chat count
export const incrementChatCount = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, "user_usage"),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, "user_usage", querySnapshot.docs[0].id);
      const currentData = querySnapshot.docs[0].data();
      
      await updateDoc(docRef, {
        chatCount: (currentData.chatCount || 0) + 1,
        lastChatAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error incrementing chat count:", error);
    throw error;
  }
};

// Increment quiz count
export const incrementQuizCount = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, "user_usage"),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, "user_usage", querySnapshot.docs[0].id);
      const currentData = querySnapshot.docs[0].data();
      
      await updateDoc(docRef, {
        quizCount: (currentData.quizCount || 0) + 1,
        lastQuizAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error incrementing quiz count:", error);
    throw error;
  }
};

// Check if user can chat (free tier limit: 3)
export const canUserChat = async (userId: string, userPlan: "free" | "pro"): Promise<{ allowed: boolean; remaining?: number; reason?: string }> => {
  try {
    // Pro users have unlimited chats
    if (userPlan === 'pro') {
      return { allowed: true };
    }
    
    // Get usage data
    let usage = await getUserUsage(userId);
    
    // Initialize if doesn't exist
    if (!usage) {
      await initializeUserUsage(userId, userPlan);
      usage = await getUserUsage(userId);
    }
    
    if (!usage) {
      return { allowed: true }; // Allow on error
    }
    
    const FREE_CHAT_LIMIT = 3;
    
    if (usage.chatCount >= FREE_CHAT_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        reason: `Free plan limit reached (${FREE_CHAT_LIMIT} messages). Upgrade to Pro for unlimited chats!`
      };
    }
    
    return {
      allowed: true,
      remaining: FREE_CHAT_LIMIT - usage.chatCount
    };
  } catch (error) {
    console.error("Error checking chat permission:", error);
    return { allowed: true }; // Allow on error
  }
};

// Check if user can generate quiz (free tier limit: 1)
export const canUserGenerateQuiz = async (userId: string, userPlan: "free" | "pro"): Promise<{ allowed: boolean; remaining?: number; reason?: string }> => {
  try {
    // Pro users have unlimited quizzes
    if (userPlan === 'pro') {
      return { allowed: true };
    }
    
    // Get usage data
    let usage = await getUserUsage(userId);
    
    // Initialize if doesn't exist
    if (!usage) {
      await initializeUserUsage(userId, userPlan);
      usage = await getUserUsage(userId);
    }
    
    if (!usage) {
      return { allowed: true }; // Allow on error
    }
    
    const FREE_QUIZ_LIMIT = 1;
    
    if (usage.quizCount >= FREE_QUIZ_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        reason: `Free plan limit reached (${FREE_QUIZ_LIMIT} quiz). Upgrade to Pro for unlimited quizzes!`
      };
    }
    
    return {
      allowed: true,
      remaining: FREE_QUIZ_LIMIT - usage.quizCount
    };
  } catch (error) {
    console.error("Error checking quiz permission:", error);
    return { allowed: true }; // Allow on error
  }
};

// Increment file upload count (cumulative, never decrements)
export const incrementFileUploadCount = async (
  userId: string, 
  fileType: 'pdf' | 'image' | 'csv'
): Promise<void> => {
  try {
    const q = query(
      collection(db, "user_usage"),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, "user_usage", querySnapshot.docs[0].id);
      const currentData = querySnapshot.docs[0].data();
      
      const fieldName = fileType === 'pdf' ? 'totalPdfUploads' 
                      : fileType === 'image' ? 'totalImageUploads'
                      : 'totalCsvUploads';
      
      await updateDoc(docRef, {
        [fieldName]: (currentData[fieldName] || 0) + 1,
        updatedAt: Timestamp.now(),
      });
      
      console.log(`📊 Incremented ${fieldName} for user ${userId}`);
    }
  } catch (error) {
    console.error("Error incrementing file upload count:", error);
    throw error;
  }
};

// Check if user can upload file (free tier limits - cumulative, never resets on delete)
export const canUserUploadFile = async (
  userId: string, 
  userPlan: "free" | "pro", 
  fileType: 'pdf' | 'image' | 'csv'
): Promise<{ allowed: boolean; remaining?: number; reason?: string }> => {
  try {
    // Pro users have unlimited uploads
    if (userPlan === 'pro') {
      return { allowed: true };
    }
    
    // Get usage data
    let usage = await getUserUsage(userId);
    
    // Initialize if doesn't exist
    if (!usage) {
      await initializeUserUsage(userId, userPlan);
      usage = await getUserUsage(userId);
    }
    
    if (!usage) {
      return { allowed: true }; // Allow on error
    }
    
    // Free tier limits (cumulative - counts all uploads ever, not just current files)
    const limits = {
      pdf: 3,
      image: 5,
      csv: 1,
    };
    
    const currentCount = fileType === 'pdf' ? usage.totalPdfUploads
                       : fileType === 'image' ? usage.totalImageUploads
                       : usage.totalCsvUploads;
    
    const limit = limits[fileType];
    
    if (currentCount >= limit) {
      const fileTypeName = fileType === 'pdf' ? 'PDF files'
                         : fileType === 'image' ? 'images'
                         : 'CSV files';
      
      return {
        allowed: false,
        remaining: 0,
        reason: `Free plan limit reached (${limit} ${fileTypeName} total). Upgrade to Pro for unlimited uploads!`
      };
    }
    
    return {
      allowed: true,
      remaining: limit - currentCount
    };
  } catch (error) {
    console.error("Error checking file upload permission:", error);
    return { allowed: true }; // Allow on error
  }
};

