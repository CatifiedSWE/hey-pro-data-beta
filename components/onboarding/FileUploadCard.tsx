import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FileUploadCardProps {
  label: string;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({ label, onFileSelect, error }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const removeFile = () => {
    setFileName(null);
    onFileSelect(null);
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
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-gray-50 hover:bg-gray-100",
              isDragging ? "border-[var(--hp-accent)] bg-[var(--hp-accent)]/5" : "border-gray-300",
              error && "border-red-500"
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
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--hp-accent)]">
                <Upload size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Click to upload or drag here</p>
                <p className="text-sm text-gray-500 mt-1">PDF, DOCX, JPG (Max 5MB)</p>
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
                  <span>Ready to submit</span>
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
      
      {error && <p className="mt-1 ml-1 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};
