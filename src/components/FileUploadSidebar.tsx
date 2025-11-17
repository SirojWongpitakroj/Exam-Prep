import { Upload, File, X, ChevronLeft, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  checked: boolean;
  file: File;
  uploading?: boolean;
  uploadSuccess?: boolean;
}

interface FileUploadSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const FileUploadSidebar = ({ isCollapsed, onToggleCollapse }: FileUploadSidebarProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { user } = useAuth();

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

  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      checked: false,
      file: file,
      uploading: true,
      uploadSuccess: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Send files to webhook
    for (const uploadedFile of newFiles) {
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        formData.append('fileName', uploadedFile.name);
        formData.append('fileSize', uploadedFile.size);
        formData.append('fileType', uploadedFile.file.type);
        formData.append('user_id', user?.id || 'guest');
        formData.append('userPlan', user?.plan || 'free');
        
        const response = await fetch('https://siroj6253.app.n8n.cloud/webhook-test/5b30d074-175b-4407-90b0-e638ad0f5026', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Update file status to success
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, uploading: false, uploadSuccess: true, checked: true }
                : f
            )
          );
          toast.success(`${uploadedFile.name} uploaded successfully`);
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
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, checked: !file.checked } : file
      )
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
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
            PDF, DOCX, TXT up to 10MB
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileInput}
            accept=".pdf,.docx,.txt"
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
            <h3 className="text-sm font-medium text-foreground mb-3">Uploaded Files</h3>
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
                        {!file.uploading && !file.uploadSuccess && " • Failed"}
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
    </div>
  );
};
