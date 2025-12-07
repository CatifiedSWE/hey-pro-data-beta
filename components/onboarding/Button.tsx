import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  fullWidth = true, 
  className, 
  icon,
  ...props 
}) => {
  const baseStyles = "relative font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[var(--hp-primary)] text-white shadow-lg hover:shadow-xl hover:brightness-110 border-b-4 border-[color-mix(in_srgb,var(--hp-primary),#000_20%)] active:border-b-0 active:translate-y-[4px]",
    secondary: "bg-[var(--hp-accent)] text-white shadow-lg hover:shadow-xl hover:brightness-110 border-b-4 border-[color-mix(in_srgb,var(--hp-accent),#000_20%)] active:border-b-0 active:translate-y-[4px]",
    outline: "bg-white text-[var(--hp-base)] border-2 border-[var(--hp-base)] hover:bg-gray-50",
    ghost: "bg-transparent text-[var(--hp-base)] hover:bg-gray-100 border-none shadow-none",
  };

  const radius = "rounded-[var(--btn-radius)]";
  const size = "h-[52px] md:h-[60px] px-6 text-[18px]";

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        baseStyles,
        variants[variant],
        radius,
        size,
        fullWidth ? "w-full" : "w-auto",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </motion.button>
  );
};

export const PrimaryButton = (props: ButtonProps) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props: ButtonProps) => <Button variant="secondary" {...props} />;
