import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OnboardingStorage } from '@/lib/onboarding-storage';
import { toast } from 'sonner';

interface FileUploadCardProps {
  label: string;
  onFileSelect: (url: string | null) => void;
  error?: string;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({ label, onFileSelect, error }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      // Upload to API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/onboarding/upload-file', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Success - store URL
      setFileName(file.name);
      setFileUrl(result.url);
      
      // Pass URL to parent component
      onFileSelect(result.url);
      
      // Save URL to localStorage
      OnboardingStorage.save({ trade_license_url: result.url });
      
      toast.success('File uploaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      console.error('[FileUploadCard] Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFileName(null);
    setFileUrl(null);
    setUploadError(null);
    onFileSelect(null);
    OnboardingStorage.save({ trade_license_url: null });
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
        {label}
      </label>
      
      <AnimatePresence mode="wait">
        {!fileName ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
              isDragging ? "border-[var(--hp-accent)] bg-[var(--hp-accent)]/5" : "border-gray-300",
              isUploading ? "cursor-wait bg-gray-100" : "cursor-pointer bg-gray-50 hover:bg-gray-100",
              (error || uploadError) && "border-red-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.jpg,.png"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--hp-accent)]">
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Upload size={24} />
                )}
              </div>
              <div>
                {isUploading ? (
                  <>
                    <p className="font-semibold text-gray-700">Uploading...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-700">Click to upload or drag here</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, DOCX, JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="bg-white border-2 border-[var(--hp-accent)] rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--hp-accent)]/10 flex items-center justify-center text-[var(--hp-accent)]">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800 truncate max-w-[200px]">{fileName}</p>
                <div className="flex items-center gap-1 text-xs text-[var(--hp-accent)] font-medium">
                  <CheckCircle2 size={12} />
                  <span>Uploaded successfully</span>
                </div>
              </div>
            </div>
            <button 
              onClick={removeFile}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {(error || uploadError) && (
        <p className="mt-1 ml-1 text-sm text-red-500 font-medium">
          {uploadError || error}
        </p>
      )}
    </div>
  );
};
