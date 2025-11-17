import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  doc,
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

