import React from 'react';
import { Edit2 } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  items: { label: string; value: string; step: string }[];
  onEdit: (step: string) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, items, onEdit }) => {
  return (
    <div className="w-full">
      <h3 className="font-bold text-2xl mb-6 text-center">{title}</h3>
      
      <div className="flex flex-col gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
              <p className="font-semibold text-gray-900 text-lg">{item.value || "—"}</p>
            </div>
            <button 
              onClick={() => onEdit(item.step)}
              className="p-2 text-[var(--hp-accent)] hover:bg-[var(--hp-accent)]/10 rounded-lg transition-colors"
            >
              <Edit2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
