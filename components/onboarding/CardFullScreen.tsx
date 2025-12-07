import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardFullScreenProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFullScreen: React.FC<CardFullScreenProps> = ({ children, className }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -20 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "w-full max-w-md md:max-w-lg bg-white rounded-[var(--card-radius)] shadow-[var(--hp-shadow)] p-6 md:p-8 flex flex-col mx-auto min-h-[400px] md:min-h-[500px] relative overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("mb-6 text-center", className)}>{children}</div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex-1 flex flex-col gap-4", className)}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("mt-8 flex flex-col gap-3", className)}>{children}</div>
);
