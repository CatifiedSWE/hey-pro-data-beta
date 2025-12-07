import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  totalSteps: number;
  currentStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ totalSteps, currentStep }) => {
  // Calculate percentage based on steps
  const progress = Math.min(100, Math.max(0, ((currentStep + 1) / totalSteps) * 100));

  return (
    <div className="w-full max-w-md mx-auto mb-6 px-2">
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
        <motion.div
          className="absolute top-0 left-0 h-full bg-[var(--hp-accent)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
        >
           <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-1.5 bg-white/30 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
};
