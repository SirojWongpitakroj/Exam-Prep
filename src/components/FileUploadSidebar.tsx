import { Upload, File, X, ChevronLeft, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FilesContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { saveFileToFirestore, deleteFileFromFirestore } from "@/lib/firestoreService";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  fileType: string;
  checked: boolean;
  file?: File; // Optional - only present during upload
  uploading?: boolean;
  uploadSuccess?: boolean;
  limitExceeded?: boolean;
  firestoreId?: string; // Firestore document ID
}

// Interface for persisted file data (without File object)
interface PersistedFileData {
  id: string;
  name: string;
  size: string;
  fileType: string;
  checked: boolean;
  uploadSuccess: boolean;
}

// Free tier limits
const FREE_TIER_LIMITS = {
  pdf: { maxFiles: 3, maxSizeMB: 5 },
  image: { maxFiles: 5, maxSizeMB: 1 },
  csv: { maxFiles: 1, maxRows: 500 },
};

interface FileUploadSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const FileUploadSidebar = ({ isCollapsed, onToggleCollapse }: FileUploadSidebarProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { user } = useAuth();
  const { updateCheckedFiles } = useFiles();
  const navigate = useNavigate();

  // Get localStorage key for current user
  const getUserFilesKey = () => {
    return user?.id ? `uploaded_files_${user.id}` : null;
  };

  // Save files to localStorage
  const saveFilesToStorage = (filesToSave: UploadedFile[]) => {
    const key = getUserFilesKey();
    if (!key) return;

    const persistedData: PersistedFileData[] = filesToSave
      .filter(f => f.uploadSuccess) // Only save successfully uploaded files
      .map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        fileType: f.fileType,
        checked: f.checked,
        uploadSuccess: f.uploadSuccess || false,
      }));

    localStorage.setItem(key, JSON.stringify(persistedData));
  };

  // Load files from localStorage
  const loadFilesFromStorage = (): UploadedFile[] => {
    const key = getUserFilesKey();
    if (!key) return [];

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const persistedData: PersistedFileData[] = JSON.parse(stored);
      return persistedData.map(data => ({
        ...data,
        file: undefined, // No File object for persisted files
        uploading: false,
        limitExceeded: false,
      }));
    } catch (error) {
      console.error('Error loading files from storage:', error);
      return [];
    }
  };

  // Load persisted files on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      const persistedFiles = loadFilesFromStorage();
      setFiles(persistedFiles);
    } else {
      setFiles([]);
    }
  }, [user?.id]);

  // Delete all files when plan changes
  useEffect(() => {
    if (!user?.id || !user?.plan) return;

    // Check if plan has changed
    const storedPlan = localStorage.getItem(`user_plan_${user.id}`);
    
    if (storedPlan && storedPlan !== user.plan) {
      console.log(`Plan changed from ${storedPlan} to ${user.plan}, clearing all files`);
      
      // Delete all files from Firestore
      const deletePromises = files
        .filter(f => f.firestoreId)
        .map(f => deleteFileFromFirestore(f.firestoreId!));
      
      Promise.all(deletePromises).catch(error => {
        console.error('Error deleting files from Firestore:', error);
      });

      // Clear local state and storage
      setFiles([]);
      const key = getUserFilesKey();
      if (key) {
        localStorage.removeItem(key);
      }

      toast.info(`Plan changed to ${user.plan}. All uploaded files have been cleared.`);
    }

    // Store current plan
    localStorage.setItem(`user_plan_${user.id}`, user.plan);
  }, [user?.plan, user?.id]);

  // Update context whenever checked files change
  useEffect(() => {
    const checkedFilesList = files
      .filter(f => f.checked && f.uploadSuccess)
      .map(f => ({
        fileName: f.name,
        fileType: f.fileType,
        fileSize: f.size,
        firestoreId: f.firestoreId,
      }));
    
    updateCheckedFiles(checkedFilesList);
  }, [files, updateCheckedFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Helper function to get file type category from File object
  const getFileCategory = (file: File): 'pdf' | 'image' | 'csv' | 'other' => {
    const mimeType = file.type.toLowerCase();
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'text/csv' || file.name.endsWith('.csv')) return 'csv';
    return 'other';
  };

  // Helper function to get file type category from fileType string
  const getFileCategoryFromType = (fileType: string): 'pdf' | 'image' | 'csv' | 'other' => {
    const mimeType = fileType.toLowerCase();
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'text/csv') return 'csv';
    return 'other';
  };

  // Check if file upload would exceed free tier limits
  const checkFreeTierLimits = (newFile: File): { allowed: boolean; reason?: string } => {
    // Pro users have no limits
    if (user?.plan === 'pro') {
      return { allowed: true };
    }

    const category = getFileCategory(newFile);
    const fileSizeMB = newFile.size / (1024 * 1024);

    // Count existing files by category
    const existingFilesByCategory = files.filter(f => 
      f.uploadSuccess && getFileCategoryFromType(f.fileType) === category
    );

    if (category === 'pdf') {
      // Check file count
      if (existingFilesByCategory.length >= FREE_TIER_LIMITS.pdf.maxFiles) {
        return { 
          allowed: false, 
          reason: `Free plan allows maximum ${FREE_TIER_LIMITS.pdf.maxFiles} PDF files` 
        };
      }
      // Check file size
      if (fileSizeMB > FREE_TIER_LIMITS.pdf.maxSizeMB) {
        return { 
          allowed: false, 
          reason: `PDF files must be under ${FREE_TIER_LIMITS.pdf.maxSizeMB}MB on free plan` 
        };
      }
    } else if (category === 'image') {
      // Check file count
      if (existingFilesByCategory.length >= FREE_TIER_LIMITS.image.maxFiles) {
        return { 
          allowed: false, 
          reason: `Free plan allows maximum ${FREE_TIER_LIMITS.image.maxFiles} image files` 
        };
      }
      // Check file size
      if (fileSizeMB > FREE_TIER_LIMITS.image.maxSizeMB) {
        return { 
          allowed: false, 
          reason: `Image files must be under ${FREE_TIER_LIMITS.image.maxSizeMB}MB on free plan` 
        };
      }
    } else if (category === 'csv') {
      // Check file count
      if (existingFilesByCategory.length >= FREE_TIER_LIMITS.csv.maxFiles) {
        return { 
          allowed: false, 
          reason: `Free plan allows maximum ${FREE_TIER_LIMITS.csv.maxFiles} CSV file` 
        };
      }
      // Note: Row count check would need to parse CSV, skipping for now
    }

    return { allowed: true };
  };

  const handleFiles = async (fileList: FileList) => {
    let hasLimitExceeded = false;
    let hasInvalidFileType = false;
    
    // Allowed file types for all users
    const ALLOWED_TYPES = [
      'application/pdf',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => {
      // Check file type first (for all users)
      if (!ALLOWED_TYPES.includes(file.type)) {
        hasInvalidFileType = true;
        toast.error(`${file.name} - Invalid file type. Only PDF, CSV, PNG, and JPG files are allowed.`);
        return null; // Skip this file
      }
      
      // Check free tier limits for each file
      const limitCheck = checkFreeTierLimits(file);
      
      if (!limitCheck.allowed) {
        hasLimitExceeded = true;
        // Mark file as limit exceeded
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
          fileType: file.type,
          checked: false,
          file: file,
          uploading: false,
          uploadSuccess: false,
          limitExceeded: true,
        };
      }
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        fileType: file.type,
        checked: false,
        file: file,
        uploading: true,
        uploadSuccess: false,
        limitExceeded: false,
      };
    }).filter((file) => file !== null) as UploadedFile[]; // Filter out null values from invalid file types
    
    // Early return if all files were invalid
    if (newFiles.length === 0) {
      return;
    }
    
    setFiles((prev) => [...prev, ...newFiles]);

    // Show upgrade dialog if any file exceeded limits
    if (hasLimitExceeded) {
      setShowUpgradeDialog(true);
    }

    // Send files to webhook (only non-exceeded files)
    for (const uploadedFile of newFiles) {
      // Skip files that exceeded limits
      if (uploadedFile.limitExceeded) {
        continue;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        formData.append('fileName', uploadedFile.name);
        formData.append('fileSize', uploadedFile.size);
        formData.append('fileType', uploadedFile.file.type);
        formData.append('user_id', user?.id || 'guest');
        formData.append('userPlan', user?.plan || 'free');
        
        const response = await fetch('https://siroj6253.app.n8n.cloud/webhook/5b30d074-175b-4407-90b0-e638ad0f5026', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Save to Firestore
          try {
            const fileSizeMB = uploadedFile.file ? uploadedFile.file.size / (1024 * 1024) : 0;
            const firestoreId = await saveFileToFirestore({
              fileName: uploadedFile.name,
              fileSize: uploadedFile.size,
              fileType: uploadedFile.fileType,
              user_id: user?.id || 'guest',
              userPlan: user?.plan || 'free',
              fileSizeMB,
            });
            
            // Update file status to success with Firestore ID
            setFiles((prev) => {
              const updatedFiles = prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, uploading: false, uploadSuccess: true, checked: false, firestoreId }
                  : f
              );
              // Save to localStorage after successful upload
              saveFilesToStorage(updatedFiles);
              return updatedFiles;
            });
            toast.success(`${uploadedFile.name} uploaded successfully`);
          } catch (firestoreError) {
            console.error('Error saving to Firestore:', firestoreError);
            // Still mark as success even if Firestore fails
            setFiles((prev) => {
              const updatedFiles = prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, uploading: false, uploadSuccess: true, checked: false }
                  : f
              );
              saveFilesToStorage(updatedFiles);
              return updatedFiles;
            });
            toast.success(`${uploadedFile.name} uploaded successfully`);
          }
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        // Update file status to failed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, uploading: false, uploadSuccess: false }
              : f
          )
        );
        toast.error(`Failed to upload ${uploadedFile.name}`);
      }
    }
  };

  const toggleFileCheck = (id: string) => {
    setFiles((prev) => {
      const fileToToggle = prev.find(f => f.id === id);
      if (!fileToToggle) return prev;

      const isChecking = !fileToToggle.checked;

      // All users can only select 1 file at a time
      if (isChecking) {
        const currentlyCheckedCount = prev.filter(f => f.checked && f.id !== id).length;

        if (currentlyCheckedCount >= 1) {
          toast.error('Only 1 file can be selected at a time.');
          return prev;
        }
      }

      const updatedFiles = prev.map((file) =>
        file.id === id ? { ...file, checked: !file.checked } : file
      );
      saveFilesToStorage(updatedFiles);
      return updatedFiles;
    });
  };

  const removeFile = async (id: string) => {
    // Find the file to get Firestore ID
    const fileToRemove = files.find(f => f.id === id);
    
    // Delete from Firestore if it has a Firestore ID
    if (fileToRemove?.firestoreId) {
      try {
        await deleteFileFromFirestore(fileToRemove.firestoreId);
      } catch (error) {
        console.error('Error deleting from Firestore:', error);
      }
    }
    
    // Update local state
    setFiles((prev) => {
      const updatedFiles = prev.filter((file) => file.id !== id);
      saveFilesToStorage(updatedFiles);
      return updatedFiles;
    });
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-sidebar border-r border-sidebar-border h-screen flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-sidebar border-r border-sidebar-border h-screen flex flex-col w-full">
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">Study Materials</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload your documents</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-foreground mb-2">
            Drag & drop your files here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            PDF, CSV, PNG, JPG only
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileInput}
            accept=".pdf,.csv,.png,.jpg,.jpeg"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            Browse Files
          </Button>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Uploaded Files</h3>
              {user?.plan === 'free' && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>PDF: {files.filter(f => f.uploadSuccess && getFileCategoryFromType(f.fileType) === 'pdf').length}/{FREE_TIER_LIMITS.pdf.maxFiles}</div>
                  <div>Images: {files.filter(f => f.uploadSuccess && getFileCategoryFromType(f.fileType) === 'image').length}/{FREE_TIER_LIMITS.image.maxFiles}</div>
                  <div>CSV: {files.filter(f => f.uploadSuccess && getFileCategoryFromType(f.fileType) === 'csv').length}/{FREE_TIER_LIMITS.csv.maxFiles}</div>
                </div>
              )}
            </div>
            {files.map((file) => (
              <Card key={file.id} className="p-3 bg-card border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {file.uploading ? (
                      <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin text-primary" />
                    ) : file.uploadSuccess ? (
                      <Checkbox
                        checked={file.checked}
                        onCheckedChange={() => toggleFileCheck(file.id)}
                        className="mt-0.5 flex-shrink-0"
                      />
                    ) : (
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
                    )}
                    <File className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size}
                        {file.uploading && " • Uploading..."}
                        {!file.uploading && file.uploadSuccess && " • Ready"}
                        {!file.uploading && file.limitExceeded && " • Limit Exceeded"}
                        {!file.uploading && !file.uploadSuccess && !file.limitExceeded && " • Failed"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                    disabled={file.uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Free Plan Limit Exceeded</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You've reached the upload limits for the free plan:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>PDF: Maximum {FREE_TIER_LIMITS.pdf.maxFiles} files (each &lt; {FREE_TIER_LIMITS.pdf.maxSizeMB}MB)</li>
                <li>Images: Maximum {FREE_TIER_LIMITS.image.maxFiles} files (each &lt; {FREE_TIER_LIMITS.image.maxSizeMB}MB)</li>
                <li>CSV: Maximum {FREE_TIER_LIMITS.csv.maxFiles} file</li>
              </ul>
              <p className="pt-2">Upgrade to Pro for unlimited uploads!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/pricing')}>
              View Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
