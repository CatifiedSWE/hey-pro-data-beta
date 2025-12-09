"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { approveConversation } from "@/lib/api/chat";
import { toast } from "sonner";

interface ApprovalBannerProps {
  conversationId: string;
  isInitiator: boolean;
  isApproved: boolean;
  otherUserName: string;
  onApprovalSuccess?: () => void;
}

export default function ApprovalBanner({
  conversationId,
  isInitiator,
  isApproved,
  otherUserName,
  onApprovalSuccess,
}: ApprovalBannerProps) {
  const [loading, setLoading] = useState(false);

  // Don't show banner if already approved
  if (isApproved) {
    return null;
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveConversation(conversationId);
      toast.success(`You approved ${otherUserName}'s message request`);
      onApprovalSuccess?.();
    } catch (error: any) {
      console.error('Error approving conversation:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to approve conversation';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isInitiator) {
    // Initiator sees waiting state
    return (
      <div 
        className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 px-4 py-3 rounded-lg"
        data-testid="approval-banner-waiting"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Waiting for approval
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {otherUserName} needs to approve your message request before you can continue the conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Recipient sees approve button
  return (
    <div 
      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 px-4 py-3 rounded-lg"
      data-testid="approval-banner-recipient"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            Message request from {otherUserName}
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Approve this request to start a conversation and allow both of you to message freely.
          </p>
        </div>
        <Button
          onClick={handleApprove}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          data-testid="approve-button"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Approving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Approve</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
