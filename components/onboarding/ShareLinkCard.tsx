import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareLinkCardProps {
  url: string;
  title?: string;
  subtitle?: string;
}

export const ShareLinkCard: React.FC<ShareLinkCardProps> = ({ 
  url, 
  title = "Easy. Here’s a link you can share with anyone who works in production:",
  subtitle = "You can also just tell them: HeyProData. For people who make things happen in film, media and events."
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="w-full bg-gray-50 rounded-xl p-6 border border-gray-200">
      <h3 className="font-bold text-lg mb-4 text-gray-900">{title}</h3>
      
      <div 
        onClick={handleCopy}
        className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[var(--hp-accent)] transition-colors group"
      >
        <span className="text-gray-600 font-medium truncate mr-3">{url}</span>
        <button className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-[var(--hp-accent)] group-hover:text-white transition-colors">
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </div>
      
      {subtitle && (
        <p className="mt-4 text-sm text-gray-500 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
