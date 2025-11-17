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

