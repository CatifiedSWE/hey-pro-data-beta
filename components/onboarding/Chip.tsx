import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  onClick?: () => void;
  label: string;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onClick, icon, className }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer px-4 py-3 rounded-full border-2 text-base font-medium transition-all flex items-center justify-center gap-2 select-none",
        selected 
          ? "bg-[var(--hp-accent)]/10 border-[var(--hp-accent)] text-[var(--hp-accent)]" 
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </motion.div>
  );
};
