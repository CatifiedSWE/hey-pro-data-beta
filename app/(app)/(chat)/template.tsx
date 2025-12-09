"use client";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getConversations, getGroups, type Conversation, type Group } from '@/lib/api/chat';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Logic to determine if a specific chat is open
    const isChatOpen = pathname?.includes('/inbox/c/') || pathname?.includes('/inbox/g/');

    // Fetch conversations and groups - wrapped in useCallback for optimization
    const fetchData = useCallback(async () => {
        // Don't fetch if auth is still loading or user is not authenticated
        if (authLoading || !user) {
            return;
        }

        try {
            setError(null);
            const [conversationsData, groupsData] = await Promise.all([
                getConversations(),
                getGroups(),
            ]);
            setConversations(conversationsData);
            setGroups(groupsData);
        } catch (err: any) {
            console.error('Error fetching chat data:', err);
            
            // Check if it's an authentication error (401) or empty response
            const isAuthError = err?.response?.status === 401;
            const isNotFound = err?.response?.status === 404;
            
            // For auth errors or not found, treat as empty data (no error message)
            if (isAuthError || isNotFound) {
                setConversations([]);
                setGroups([]);
                setError(null);
            } else {
                // Only show error for actual server errors
                setError('Failed to load chats');
            }
        } finally {
            setLoading(false);
        }
    }, [authLoading, user]);

    // Initial fetch - only after auth is ready and user is authenticated
    // Also refetch when pathname changes (navigation to /inbox)
    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            // Auth is ready but no user - stop loading
            setLoading(false);
        }
    }, [authLoading, user, fetchData, pathname]);

    // Poll for updates every 5 seconds - only if user is authenticated
    useEffect(() => {
        if (authLoading || !user) return;

        const interval = setInterval(() => {
            fetchData();
        }, 5000);

        return () => clearInterval(interval);
    }, [authLoading, user, fetchData]);

    return (
        <div className="w-full h-screen bg-[#F8F8F8] md:bg-white overflow-hidden flex flex-col md:flex-row justify-center items-stretch gap-4 p-0 md:p-6 max-w-[1600px] mx-auto">

            {/* SIDEBAR SECTION 
              - Hidden on Mobile if a chat is open
              - Always Block/Flex on Desktop (md:flex)
            */}
            <div
                className={`${isChatOpen ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[400px] lg:w-[450px] shrink-0 h-full sm:h-[calc(100vh-100px)]`}
            >
                <div
                    className="flex flex-col gap-6 border w-full h-full bg-white/70 md:bg-white/40 md:backdrop-blur-[10px] rounded-none md:rounded-[25px] p-[1px] shadow-lg"
                    style={{
                        background: "linear-gradient(90deg, #FA6E80 0%, #6A89BE 41.52%, #85AAB7 62.27%, #31A7AC 103.79%)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                    }}
                >
                    <div className="flex flex-col h-full w-full bg-white rounded-none md:rounded-[24px] shadow-md overflow-hidden">
                        <Tabs defaultValue="chat" className="w-full h-full sm:w-[] flex flex-col">

                            {/* Tabs Header */}
                            <div className="p-4 shrink-0">
                                <TabsList className="flex flex-row w-full gap-2 mx-auto sm:w-96 justify-center">
                                    <TabsTrigger
                                        value="chat"
                                        className="flex justify-center items-center px-[25px] py-[10px] h-[47px] rounded-[20px] cursor-pointer border-none relative bg-white data-[state=active]:bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] w-48"
                                    >
                                        <span className="font-medium text-[18px] leading-[27px] text-black data-[state=active]:text-white z-10">
                                            Chats
                                        </span>
                                        {/* Gradient Border for inactive state */}
                                        <span
                                            className="absolute inset-0 rounded-[20px] pointer-events-none data-[state=active]:hidden"
                                            style={{
                                                padding: "1px",
                                                background: "linear-gradient(90deg, #FA6E80 0%, #6A89BE 41.52%, #85AAB7 62.27%, #31A7AC 103.79%)",
                                                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                                WebkitMaskComposite: "xor",
                                                maskComposite: "exclude",
                                            }}
                                        />
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="groups"
                                        className="hidden flex-1 flex justify-center items-center px-[25px] py-[10px] h-[47px] rounded-[20px] cursor-pointer border-none relative bg-white data-[state=active]:bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC]"
                                    >
                                        <span className="font-medium text-[18px] leading-[27px] text-black data-[state=active]:text-white z-10">
                                            Groups
                                        </span>
                                        <span
                                            className="absolute inset-0 rounded-[20px] pointer-events-none data-[state=active]:hidden"
                                            style={{
                                                padding: "1px",
                                                background: "linear-gradient(90deg, #FA6E80 0%, #6A89BE 41.52%, #85AAB7 62.27%, #31A7AC 103.79%)",
                                                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                                WebkitMaskComposite: "xor",
                                                maskComposite: "exclude",
                                            }}
                                        />
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Chat List Scrollable Area */}
                            <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-4 sm:mb-0 mb-30">
                                <TabsContent value="chat" className="mt-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-40">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#31A7AC]"></div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                            <p className="text-sm">{error}</p>
                                            <button 
                                                onClick={fetchData}
                                                className="mt-2 text-[#31A7AC] text-sm hover:underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="flex items-center justify-center h-40 text-gray-500">
                                            <p className="text-sm">No conversations yet</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start gap-[5px] w-full">
                                            {conversations.map((conv, index) => (
                                                <React.Fragment key={conv.id}>
                                                    <Link href={`/inbox/c/${conv.id}`} className="flex flex-row items-center p-[10px] gap-[19px] w-full h-[70px] rounded-[10px] hover:bg-gray-50 transition-colors cursor-pointer">
                                                        <Image
                                                            src={conv.user.avatar || '/default-profile.png'}
                                                            alt={conv.user.name}
                                                            className="w-[48px] h-[48px] rounded-full object-cover bg-[#D9D9D9] shrink-0"
                                                            width={48}
                                                            height={48}
                                                        />
                                                        <div className="flex flex-row items-center gap-[7px] flex-1 min-w-0">
                                                            <div className="flex flex-col justify-center items-start gap-[1px] flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <span className="font-medium text-[16px] leading-[24px] text-black truncate">
                                                                        {conv.user.name}
                                                                    </span>
                                                                    {!conv.isApproved && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                                                            Pending
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="w-full font-medium text-[12px] leading-[15px] text-[#444444] truncate">
                                                                    {conv.lastMessage?.content || 'No messages yet'}
                                                                </span>
                                                            </div>
                                                            {conv.unreadCount > 0 && (
                                                                <div className="w-[20px] h-[20px] bg-[#31A7AC] border-2 border-white rounded-full flex items-center justify-center shrink-0">
                                                                    <span className="font-medium text-[10px] leading-[15px] text-white">
                                                                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    {index < conversations.length - 1 && (
                                                        <div className="w-full h-[1px] border-t border-[#CDCDCD]" />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="groups" className="mt-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-40">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#31A7AC]"></div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                            <p className="text-sm">{error}</p>
                                            <button 
                                                onClick={fetchData}
                                                className="mt-2 text-[#31A7AC] text-sm hover:underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : groups.length === 0 ? (
                                        <div className="flex items-center justify-center h-40 text-gray-500">
                                            <p className="text-sm">No groups yet</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start gap-[5px] w-full">
                                            {groups.map((group, index) => {
                                                const avatarUrls = group.avatarUrls || [];
                                                return (
                                                    <React.Fragment key={group.id}>
                                                        <Link href={`/inbox/g/${group.id}`} className="flex flex-row items-center p-[10px] gap-[19px] w-full h-[70px] rounded-[10px] hover:bg-gray-50 transition-colors cursor-pointer">
                                                            {avatarUrls.length > 0 ? (
                                                                <div className="flex -space-x-4 shrink-0">
                                                                    {avatarUrls.slice(0, 2).map((imgSrc, imgIdx) => (
                                                                        <Image
                                                                            key={imgIdx}
                                                                            src={imgSrc || '/default-profile.png'}
                                                                            alt={group.name}
                                                                            className="w-[35px] h-[35px] rounded-full object-cover bg-[#D9D9D9] border-2 border-white"
                                                                            width={35}
                                                                            height={35}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="w-[40px] h-[41px] rounded-full bg-[#D9D9D9] flex items-center justify-center shrink-0">
                                                                    <span className="text-white font-semibold text-sm">
                                                                        {group.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-row items-center gap-[7px] flex-1 min-w-0">
                                                                <div className="flex flex-col justify-center items-start gap-[1px] flex-1 min-w-0">
                                                                    <span className="w-full font-medium text-[16px] leading-[24px] text-black truncate">
                                                                        {group.name}
                                                                    </span>
                                                                    <span className="w-full font-medium text-[12px] leading-[15px] text-[#444444] truncate">
                                                                        {group.lastMessage?.content || 'No messages yet'}
                                                                    </span>
                                                                </div>
                                                                {group.unreadCount > 0 && (
                                                                    <div className="w-[20px] h-[20px] bg-[#31A7AC] border-2 border-white rounded-full flex items-center justify-center shrink-0">
                                                                        <span className="font-medium text-[10px] leading-[15px] text-white">
                                                                            {group.unreadCount > 9 ? '9+' : group.unreadCount}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Link>
                                                        {index < groups.length - 1 && (
                                                            <div className="w-full h-[1px] border-t border-[#CDCDCD]" />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT SECTION 
              - Hidden on Mobile if NO chat is open (root /inbox)
              - Always Flex on Desktop
            */}
            <div
                className={`${!isChatOpen ? 'hidden' : 'flex'} md:flex flex-1 w-full sm:h-[calc(100vh-100px)] h-full`}
            >
                <div
                    className="w-full h-full p-[1px] overflow-hidden rounded-none md:rounded-[25px] shadow-xl flex flex-col"
                    style={{
                        background: "linear-gradient(90deg, #FA6E80 0%, #6A89BE 41.52%, #85AAB7 62.27%, #31A7AC 103.79%)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                    }}
                >
                    <div className="flex-1 w-full h-full bg-[#F8F8F8] rounded-none md:rounded-[24px] overflow-hidden flex flex-col relative">
                        {children}
                    </div>
                </div>
            </div>

        </div>
    )
}