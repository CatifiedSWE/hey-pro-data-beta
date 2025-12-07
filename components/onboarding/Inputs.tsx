import React from 'react';
import { cn } from '@/lib/utils';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-[52px] px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-lg focus:bg-white focus:border-[var(--hp-accent)] focus:ring-2 focus:ring-[var(--hp-accent)]/20 focus:outline-none transition-all placeholder:text-gray-400",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 ml-1 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full min-h-[120px] p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-lg focus:bg-white focus:border-[var(--hp-accent)] focus:ring-2 focus:ring-[var(--hp-accent)]/20 focus:outline-none transition-all placeholder:text-gray-400 resize-y",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 ml-1 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};
