"use client";
import { useState, useEffect, useRef, useCallback, use } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, EllipsisVertical, Paperclip, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getConversationMessages, sendConversationMessage, markMessageAsRead, type Message } from "@/lib/api/chat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ApprovalBanner from "../../../components/ApprovalBanner";
import axios from "@/lib/axios";

type paramsType = { id: string };

export default function MessageInbox({ params }: { params: Promise<paramsType> }) {
    const { id } = use(params);
    const { user } = useAuth();
    
    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);
    const lastMessageCount = useRef(0);

    // State
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);
    
    // ⭐ NEW: Approval state
    const [conversationData, setConversationData] = useState<any>(null);
    const [isApproved, setIsApproved] = useState(true);
    const [isInitiator, setIsInitiator] = useState(false);
    const [canSendMessage, setCanSendMessage] = useState(true);

    // ⭐ NEW: Fetch conversation details (approval status)
    const fetchConversationDetails = useCallback(async () => {
        try {
            const response = await axios.get(`/chat/conversations`);
            const conversations = response.data.data.conversations || [];
            const currentConv = conversations.find((c: any) => c.id === id);
            
            if (currentConv) {
                setConversationData(currentConv);
                setIsApproved(currentConv.isApproved);
                setOtherUser(currentConv.user);
                
                // Determine if current user is the initiator
                // The initiator sent the first message
                if (messages.length > 0) {
                    const firstMessage = messages[0];
                    const userIsInitiator = firstMessage.sender_id === user?.id;
                    setIsInitiator(userIsInitiator);
                    
                    // Can only send if approved OR (not approved AND user hasn't sent a message yet)
                    if (!currentConv.isApproved && userIsInitiator) {
                        setCanSendMessage(false);
                    } else {
                        setCanSendMessage(true);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching conversation details:', err);
        }
    }, [id, user, messages]);

    // Fetch messages
    const fetchMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            const data = await getConversationMessages(id, pageNum, 50);
            
            if (append) {
                // Prepend older messages for infinite scroll
                setMessages(prev => [...data.messages, ...prev]);
            } else {
                setMessages(data.messages);
            }
            
            setHasMore(data.pagination.hasMore);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [id]);

    // Initial fetch
    useEffect(() => {
        fetchMessages(1, false);
    }, [fetchMessages]);

    // ⭐ Fetch conversation details after messages are loaded
    useEffect(() => {
        if (messages.length >= 0 && user) {
            fetchConversationDetails();
        }
    }, [messages.length, user, fetchConversationDetails]);

    // Poll for new messages every 3 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getConversationMessages(id, 1, 50);
                if (data.messages.length > lastMessageCount.current) {
                    setMessages(data.messages);
                    lastMessageCount.current = data.messages.length;
                }
            } catch (err) {
                console.error('Error polling messages:', err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [id]);

    // Update last message count
    useEffect(() => {
        lastMessageCount.current = messages.length;
    }, [messages]);

    // ⭐ Mark unread messages as read when viewing conversation
    useEffect(() => {
        const markMessagesAsRead = async () => {
            if (!user || messages.length === 0) return;

            // Find unread messages from the other user
            const unreadMessages = messages.filter(
                msg => msg.sender_id !== user.id && msg.status !== 'read'
            );

            // Mark each unread message as read
            for (const msg of unreadMessages) {
                try {
                    await markMessageAsRead(msg.id);
                } catch (err) {
                    console.error('Error marking message as read:', err);
                }
            }

            // If any messages were marked as read, refresh the conversation list
            if (unreadMessages.length > 0) {
                fetchConversationDetails();
            }
        };

        markMessagesAsRead();
    }, [messages, user, fetchConversationDetails]);

    // Auto-scroll to bottom on new messages (but not when loading more)
    useEffect(() => {
        if (scrollRef.current && !loadingMore) {
            if (isInitialMount.current || messages.length > lastMessageCount.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: isInitialMount.current ? "auto" : "smooth",
                });
                isInitialMount.current = false;
            }
        }
    }, [messages, loadingMore]);

    // Infinite scroll - load older messages
    const handleScroll = useCallback(() => {
        if (scrollRef.current && hasMore && !loadingMore) {
            const { scrollTop } = scrollRef.current;
            // Load more when scrolled near top
            if (scrollTop < 100) {
                fetchMessages(page + 1, true);
            }
        }
    }, [hasMore, loadingMore, page, fetchMessages]);

    const handleSend = async () => {
        if (message.trim().length === 0 || sending || !canSendMessage) return;
        
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: id,
            sender_id: user?.id || '',
            content: message.trim(),
            status: 'sent',
            created_at: new Date().toISOString(),
        };

        // Optimistic update
        setMessages(prev => [...prev, optimisticMessage]);
        setMessage("");
        setSending(true);

        try {
            const sentMessage = await sendConversationMessage(id, message.trim());
            // Replace optimistic message with real one
            setMessages(prev => 
                prev.map(msg => msg.id === optimisticMessage.id ? sentMessage : msg)
            );
        } catch (err: any) {
            console.error('Error sending message:', err);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            
            // Check if it's an approval error
            const errorData = err?.response?.data;
            if (errorData?.details === 'APPROVAL_REQUIRED') {
                toast.error(errorData.error);
                setCanSendMessage(false);
            } else {
                toast.error('Failed to send message. Please try again.');
            }
        } finally {
            setSending(false);
        }
    };

    // ⭐ Handle approval success
    const handleApprovalSuccess = () => {
        setIsApproved(true);
        setCanSendMessage(true);
        fetchConversationDetails();
        toast.success('Conversation approved! You can now chat freely.');
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#31A7AC]"></div>
            </div>
        );
    }

    if (error && messages.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white gap-4">
                <p className="text-gray-500">{error}</p>
                <button 
                    onClick={() => fetchMessages(1, false)}
                    className="px-4 py-2 bg-[#31A7AC] text-white rounded-lg hover:bg-[#2a8f93]"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col bg-white overflow-hidden relative sm:h-[calc(100vh-80px)] h-[calc(100vh-80px)]">

            {/* Header - Fixed Height */}
            <div className="shrink-0 w-full flex flex-row justify-between items-center px-4 sm:px-6 bg-[#F8F8F8] border-b border-gray-100 h-[80px] z-10 relative">
                <div className="flex items-center gap-3 relative">
                    {/* Back Button only visible on Mobile */}
                    <Link href={"/inbox"} className="md:hidden flex p-2 -ml-2 rounded-full hover:bg-gray-200">
                        <ArrowLeft className="h-6 w-6 text-[#444444]" />
                    </Link>

                    <div className="relative">
                        <Image
                            src={otherUser?.avatar || "/default-profile.png"}
                            alt={otherUser?.name || "User"}
                            width={45}
                            height={45}
                            className="rounded-full object-cover w-[45px] h-[45px]"
                        />
                    </div>

                    <div className="flex flex-col">
                        <div className="text-black font-semibold text-[16px] sm:text-[18px] leading-tight">
                            {otherUser?.name || "User"}
                        </div>
                        <div className="text-[12px] sm:text-[14px] font-medium text-gray-500">
                            {messages.length > 0 ? 'Active' : 'No messages yet'}
                        </div>
                    </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-200">
                    <EllipsisVertical className="text-[#444444]" />
                </button>
            </div>

            {/* Messages Area - Grow to fill space */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 w-full overflow-y-auto px-2 sm:px-4 py-6 bg-white no-scrollbar"
            >
                {loadingMore && (
                    <div className="flex justify-center mb-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#31A7AC]"></div>
                    </div>
                )}
                
                {/* ⭐ NEW: Approval Banner */}
                {!isApproved && messages.length > 0 && (
                    <div className="mx-auto w-full max-w-3xl mb-4">
                        <ApprovalBanner
                            conversationId={id}
                            isInitiator={isInitiator}
                            isApproved={isApproved}
                            otherUserName={otherUser?.name || "User"}
                            onApprovalSuccess={handleApprovalSuccess}
                        />
                    </div>
                )}
                
                <div className="mx-auto w-full max-w-3xl flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                            <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isSender = msg.sender_id === user?.id;
                            const prevMsg = messages[index - 1];
                            const nextMsg = messages[index + 1];

                            const isPrevSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
                            const isNextSameSender = nextMsg && nextMsg.sender_id === msg.sender_id;

                            // Spacing logic
                            const marginBottom = isNextSameSender ? "mb-[2px]" : "mb-6";

                            // Border Radius Logic
                            let borderRadiusClass = "rounded-[18px]";
                            if (isSender) {
                                if (isNextSameSender && !isPrevSameSender) borderRadiusClass = "rounded-[18px] rounded-br-none";
                                else if (isPrevSameSender && isNextSameSender) borderRadiusClass = "rounded-[18px] rounded-tr-none rounded-br-none";
                                else if (isPrevSameSender && !isNextSameSender) borderRadiusClass = "rounded-[18px] rounded-tr-none";
                            } else {
                                if (isNextSameSender && !isPrevSameSender) borderRadiusClass = "rounded-[18px] rounded-bl-none";
                                else if (isPrevSameSender && isNextSameSender) borderRadiusClass = "rounded-[18px] rounded-tl-none rounded-bl-none";
                                else if (isPrevSameSender && !isNextSameSender) borderRadiusClass = "rounded-[18px] rounded-tl-none";
                            }

                            const showTime = !nextMsg || nextMsg.created_at !== msg.created_at || !isNextSameSender;
                            const formattedTime = format(new Date(msg.created_at), "h:mm a");

                            return (
                                <div key={msg.id} className={`flex w-full flex-col ${isSender ? 'items-end' : 'items-start'} ${marginBottom}`}>
                                    <div
                                        className={`
                                            max-w-[85%] sm:max-w-[65%] px-5 py-3 text-[14px] leading-relaxed break-words
                                            ${borderRadiusClass} 
                                            ${isSender
                                                ? 'bg-[#F2F2F2] text-[#181818]'
                                                : 'bg-[#31A7AC] text-white'
                                            }
                                        `}
                                    >
                                        {msg.content}
                                    </div>
                                    {showTime && (
                                        <span className={`text-[11px] text-gray-400 mt-1 px-1 ${isSender ? 'text-right' : 'text-left'}`}>
                                            {formattedTime}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Input Bar - Fixed at Bottom */}
            <div className="shrink-0 w-full bg-white px-4 pb-4 pt-2 z-10 relative">
                <div className="mx-auto w-full max-w-3xl bg-[#F0F0F0] border border-[#FA596E] rounded-full flex items-center gap-2 p-1 pl-4 h-[56px] shadow-sm">
                    <Input
                        placeholder={canSendMessage ? "Message ..." : "Waiting for approval..."}
                        className="border-none shadow-none text-[15px] font-normal flex-1 focus-visible:ring-0 px-0 bg-transparent placeholder:text-gray-500"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                        disabled={sending || !canSendMessage}
                    />
                    <div className="flex items-center gap-1 pr-1 shrink-0">
                        <Button
                            className="h-10 w-10 rounded-full flex items-center justify-center bg-[#FA596E] hover:bg-[#fa4059] transition-colors p-0"
                            type="button"
                            disabled
                        >
                            <Paperclip className="text-white h-5 w-5" />
                        </Button>
                        <Button
                            className="h-10 w-10 rounded-full flex items-center justify-center bg-[#FA596E] hover:bg-[#fa4059] transition-colors p-0 disabled:opacity-50"
                            type="button"
                            onClick={handleSend}
                            disabled={sending || message.trim().length === 0 || !canSendMessage}
                        >
                            <Send className="text-white h-5 w-5 ml-0.5" />
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
