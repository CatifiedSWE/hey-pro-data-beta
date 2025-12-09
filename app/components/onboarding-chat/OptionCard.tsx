import React from 'react';
import { Option } from '@/lib/onboarding-chat/types';
import { 
  Clapperboard, Truck, UserCheck, Briefcase, Compass,
  Check, Edit2, Share2, Eye, HelpCircle, RotateCcw,
  RefreshCcw, LogIn, Link, ListOrdered, Send, X, ArrowRight
} from 'lucide-react';

const IconMap: Record<string, React.FC<any>> = {
  Clapperboard, Truck, UserCheck, Briefcase, Compass,
  Check, Edit2, Share2, Eye, HelpCircle, RotateCcw,
  RefreshCcw, LogIn, Link, ListOrdered, Send, X
};

interface OptionCardProps {
  option: Option;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({ option, selected, onClick, disabled }) => {
  const Icon = option.icon ? IconMap[option.icon] : null;
  
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex flex-row md:flex-col items-center md:items-start p-4 md:p-5 rounded-xl border-[3px] w-full text-left transition-all duration-150 active:scale-[0.98]
        ${
          selected 
            ? 'border-[#25c9d0] bg-cyan-50 shadow-none translate-y-[4px]' 
            : 'border-slate-200 bg-white shadow-[0_4px_0_0_#cbd5e1] hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#cbd5e1]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {Icon && (
        <div className={`
          mr-3 md:mr-0 md:mb-3 p-3 rounded-lg flex-shrink-0 transition-colors
          ${
            selected 
              ? 'bg-white text-[#25c9d0] shadow-sm' 
              : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#ff5168]'
          }
        `}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
      )}
      
      <div className="flex-1">
        <span className={`text-lg md:text-xl font-bold leading-tight block ${
          selected ? 'text-[#1da8ae]' : 'text-slate-700 group-hover:text-slate-900'
        }`}>
          {option.label}
        </span>
        {option.description && (
          <span className="text-xs md:text-sm text-slate-400 font-medium mt-1 block">
            {option.description}
          </span>
        )}
      </div>
      
      <div className={`hidden md:block absolute bottom-5 right-5 transition-all duration-300 ${
        selected || 'group-hover:translate-x-1 opacity-0 group-hover:opacity-100'
      }`}>
        <ArrowRight size={20} className={selected ? 'text-[#25c9d0]' : 'text-slate-300'} strokeWidth={3} />
      </div>
    </button>
  );
};
