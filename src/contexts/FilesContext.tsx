import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface CheckedFile {
  fileName: string;
  fileType: string;
  fileSize: string;
  firestoreId?: string;
}

interface FilesContextType {
  checkedFiles: CheckedFile[];
  updateCheckedFiles: (files: CheckedFile[]) => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checkedFiles, setCheckedFiles] = useState<CheckedFile[]>([]);
  const { user } = useAuth();

  // Reset checked files when user changes
  useEffect(() => {
    if (!user?.id) {
      setCheckedFiles([]);
    }
  }, [user?.id]);

  const updateCheckedFiles = (files: CheckedFile[]) => {
    setCheckedFiles(files);
  };

  return (
    <FilesContext.Provider value={{ checkedFiles, updateCheckedFiles }}>
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error("useFiles must be used within a FilesProvider");
  }
  return context;
};

