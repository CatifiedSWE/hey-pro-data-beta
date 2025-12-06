"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Send, MapPin, Calendar, Users, Bookmark, ArrowRight, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { likePost, unlikePost, unsavePost, sharePost } from "@/lib/api/slate";
import { unsaveCollab } from "@/lib/api/collab";
import CommentsModal from "@/components/modules/slate/CommentsModal";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SavedSlate {
    id: string;
    content: string;
    slug: string;
    status: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    created_at: string;
    updated_at: string;
    saved_at: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    media: Array<{
        id: string;
        media_url: string;
        media_type: string;
        sort_order: number;
    }>;
    user_has_liked: boolean;
    user_has_saved: boolean;
}

interface SavedCollab {
    id: string;
    title: string;
    slug: string;
    summary: string;
    cover_image_url: string;
    status: string;
    tags: string[];
    interests: number;
    created_at: string;
    updated_at: string;
    saved_at: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    user_has_saved: boolean;
}

interface SavedEvent {
    id: string;
    title: string;
    slug: string;
    description: string;
    location: string;
    is_online: boolean;
    is_paid: boolean;
    price_amount: number;
    price_currency: string;
    thumbnail_url: string;
    hero_image_url: string;
    status: string;
    schedule: Array<{
        event_date: string;
        start_time: string;
        end_time: string;
        timezone: string;
    }>;
    tags: string[];
    rsvp_count: number;
    created_at: string;
    updated_at: string;
    saved_at: string;
    creator: {
        id: string;
        name: string;
        avatar: string;
    };
    user_has_saved: boolean;
}

interface SavedProfile {
    save_id: string;
    saved_at: string;
    user_id: string;
    profile: {
        id: string;
        user_id: string;
        name: string;
        avatar: string;
        bio: string;
        location: string;
        city: string;
        country: string;
    };
}

export default function SavedPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [savedSlates, setSavedSlates] = useState<SavedSlate[]>([]);
    const [savedCollabs, setSavedCollabs] = useState<SavedCollab[]>([]);
    const [savedWhatsOn, setSavedWhatsOn] = useState<SavedEvent[]>([]);
    const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
    const [loading, setLoading] = useState({
        slates: true,
        collabs: true,
        whatsOn: true,
        profiles: true
    });
    const [errors, setErrors] = useState({
        slates: null as string | null,
        collabs: null as string | null,
        whatsOn: null as string | null,
        profiles: null as string | null
    });
    const [commentsModal, setCommentsModal] = useState<{
        open: boolean;
        postId: string;
        postAuthor: { name: string; avatar: string };
        postContent: string;
        commentsCount: number;
    }>({
        open: false,
        postId: "",
        postAuthor: { name: "", avatar: "" },
        postContent: "",
        commentsCount: 0,
    });

    // Fetch saved slates
    useEffect(() => {
        const fetchSavedSlates = async () => {
            if (!user) return;
            
            try {
                setLoading(prev => ({ ...prev, slates: true }));
                const response = await axios.get('/slate/saved');
                setSavedSlates(response.data.data.posts || []);
                setErrors(prev => ({ ...prev, slates: null }));
            } catch (error: any) {
                console.error('Error fetching saved slates:', error);
                setErrors(prev => ({ ...prev, slates: error.response?.data?.error || 'Failed to load saved slates' }));
            } finally {
                setLoading(prev => ({ ...prev, slates: false }));
            }
        };
        
        fetchSavedSlates();
    }, [user]);

    // Fetch saved collabs
    useEffect(() => {
        const fetchSavedCollabs = async () => {
            if (!user) return;
            
            try {
                setLoading(prev => ({ ...prev, collabs: true }));
                const response = await axios.get('/collab/saved');
                setSavedCollabs(response.data.data.collabs || []);
                setErrors(prev => ({ ...prev, collabs: null }));
            } catch (error: any) {
                console.error('Error fetching saved collabs:', error);
                setErrors(prev => ({ ...prev, collabs: error.response?.data?.error || 'Failed to load saved collabs' }));
            } finally {
                setLoading(prev => ({ ...prev, collabs: false }));
            }
        };
        
        fetchSavedCollabs();
    }, [user]);

    // Fetch saved what's on events
    useEffect(() => {
        const fetchSavedWhatsOn = async () => {
            if (!user) return;
            
            try {
                setLoading(prev => ({ ...prev, whatsOn: true }));
                const response = await axios.get('/whatson/saved');
                setSavedWhatsOn(response.data.data.events || []);
                setErrors(prev => ({ ...prev, whatsOn: null }));
            } catch (error: any) {
                console.error('Error fetching saved events:', error);
                setErrors(prev => ({ ...prev, whatsOn: error.response?.data?.error || 'Failed to load saved events' }));
            } finally {
                setLoading(prev => ({ ...prev, whatsOn: false }));
            }
        };
        
        fetchSavedWhatsOn();
    }, [user]);

    // Fetch saved profiles
    useEffect(() => {
        const fetchSavedProfiles = async () => {
            if (!user) return;
            
            try {
                setLoading(prev => ({ ...prev, profiles: true }));
                const response = await axios.get('/profile/saved');
                setSavedProfiles(response.data.data.profiles || []);
                setErrors(prev => ({ ...prev, profiles: null }));
            } catch (error: any) {
                console.error('Error fetching saved profiles:', error);
                setErrors(prev => ({ ...prev, profiles: error.response?.data?.error || 'Failed to load saved profiles' }));
            } finally {
                setLoading(prev => ({ ...prev, profiles: false }));
            }
        };
        
        fetchSavedProfiles();
    }, [user]);

    // Format relative time
    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
            return format(date, 'MMM d, yyyy');
        } catch {
            return 'Recently';
        }
    };

    // Handle like/unlike post
    const handleLikeSlate = async (slateId: string, currentlyLiked: boolean) => {
        try {
            if (currentlyLiked) {
                const result = await unlikePost(slateId);
                setSavedSlates(prev => prev.map(slate => 
                    slate.id === slateId 
                        ? { ...slate, user_has_liked: false, likes_count: result.likes_count }
                        : slate
                ));
            } else {
                const result = await likePost(slateId);
                setSavedSlates(prev => prev.map(slate => 
                    slate.id === slateId 
                        ? { ...slate, user_has_liked: true, likes_count: result.likes_count }
                        : slate
                ));
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update like');
        }
    };

    // Handle open comments modal
    const handleOpenComments = (slate: SavedSlate) => {
        setCommentsModal({
            open: true,
            postId: slate.id,
            postAuthor: slate.author,
            postContent: slate.content,
            commentsCount: slate.comments_count,
        });
    };

    // Handle comment added
    const handleCommentAdded = () => {
        // Refresh the comments count for the post
        setSavedSlates(prev => prev.map(slate => 
            slate.id === commentsModal.postId 
                ? { ...slate, comments_count: slate.comments_count + 1 }
                : slate
        ));
    };

    // Handle unsave slate
    const handleUnsaveSlate = async (slateId: string) => {
        try {
            await unsavePost(slateId);
            setSavedSlates(prev => prev.filter(slate => slate.id !== slateId));
            toast.success('Post removed from saved');
        } catch (error: any) {
            toast.error(error.message || 'Failed to unsave post');
        }
    };

    // Handle share post
    const handleShareSlate = async (slateId: string) => {
        try {
            const result = await sharePost(slateId);
            setSavedSlates(prev => prev.map(slate => 
                slate.id === slateId 
                    ? { ...slate, shares_count: result.shares_count }
                    : slate
            ));
            toast.success('Post shared');
        } catch (error: any) {
            toast.error(error.message || 'Failed to share post');
        }
    };

    // Handle unsave collab
    const handleUnsaveCollab = async (collabId: string) => {
        try {
            await unsaveCollab(collabId);
            setSavedCollabs(prev => prev.filter(collab => collab.id !== collabId));
            toast.success('Collab removed from saved');
        } catch (error: any) {
            toast.error(error.message || 'Failed to unsave collab');
        }
    };

    // Handle unsave event
    const handleUnsaveEvent = async (eventId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Authentication required');

            const response = await fetch(`/api/whatson/${eventId}/save`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to unsave event');
            }

            setSavedWhatsOn(prev => prev.filter(event => event.id !== eventId));
            toast.success('Event removed from saved');
        } catch (error: any) {
            toast.error(error.message || 'Failed to unsave event');
        }
    };

    // Handle unsave profile
    const handleUnsaveProfile = async (userId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Authentication required');

            const response = await fetch(`/api/profile/${userId}/save`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to unsave profile');
            }

            setSavedProfiles(prev => prev.filter(profile => profile.user_id !== userId));
            toast.success('Profile removed from saved');
        } catch (error: any) {
            toast.error(error.message || 'Failed to unsave profile');
        }
    };

    // Handle view profile
    const handleViewProfile = (userId: string) => {
        router.push(`/profile/${userId}`);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen bg-gray-50/50">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] bg-clip-text text-transparent">
                    Saved Items
                </h1>
                <p className="text-gray-600 mt-2">Your personal collection of bookmarked content</p>
            </div>

            <Tabs defaultValue="profiles" className="w-full">
                  <TabsList
    className="
      grid 
      w-full 
      grid-cols-1
      sm:grid-cols-2
      md:grid-cols-3
      lg:grid-cols-4
      mb-8 
      bg-white 
      p-1 
      border 
      rounded-xl 
      shadow-sm 
      h-12
    "
    data-testid="saved-tabs"
  >
    {/* Example triggers – add back as needed */}
    {/* 
    <TabsTrigger 
      value="slates"
      className="data-[state=active]:bg-[#FA6E80]/10 data-[state=active]:text-[#FA6E80] rounded-lg transition-all"
    >
      Slates
    </TabsTrigger>
    */}

    <TabsTrigger
      value="profiles"
      className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600 rounded-lg transition-all"
      data-testid="profiles-tab"
    >
      Profiles
    </TabsTrigger>
  </TabsList>

                {/* Slates Tab */}
                {/* <TabsContent value="slates" data-testid="slates-content" className="mt-0">
                    {errors.slates && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.slates}</p>
                        </div>
                    )}
                    {loading.slates ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => <SlateSkeleton key={i} />)}
                        </div>
                    ) : savedSlates.length === 0 ? (
                        <EmptyState 
                            icon={<Bookmark className="h-12 w-12" />}
                            title="No saved slates yet"
                            description="Start saving slates to see them here"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {savedSlates.map((slate) => (
                                <Card 
                                    key={slate.id} 
                                    className="p-0 gap-0 border-0 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group bg-white" 
                                    data-testid="saved-slate-card"
                                >
                                    <div className="p-5 flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={slate.author.avatar || "/default-profile.png"}
                                                    alt={slate.author.name}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1">{slate.author.name || 'Anonymous'}</h3>
                                                    <p className="text-xs text-gray-500">Saved {formatRelativeTime(slate.saved_at)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnsaveSlate(slate.id)}
                                                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-[#FA6E80] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Remove from saved"
                                                data-testid="unsave-button"
                                            >
                                                <Bookmark className="h-5 w-5 fill-[#FA6E80] text-[#FA6E80]" />
                                            </button>
                                        </div>
                                        
                                        <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">{slate.content}</p>
                                        
                                        {slate.media && slate.media.length > 0 && (
                                            <div className="relative w-full h-56 rounded-lg overflow-hidden mb-4 bg-gray-100">
                                                <Image
                                                    src={slate.media[0].media_url}
                                                    alt="Slate content"
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <button 
                                                className="flex items-center gap-1.5 text-gray-500 hover:text-[#FA6E80] transition-colors"
                                                onClick={() => handleLikeSlate(slate.id, slate.user_has_liked)}
                                                data-testid="like-button"
                                            >
                                                <Heart className={`h-4 w-4 ${slate.user_has_liked ? 'fill-[#FA6E80] text-[#FA6E80]' : ''}`} />
                                                <span className="text-xs font-medium">{slate.likes_count}</span>
                                            </button>
                                            <button 
                                                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors"
                                                onClick={() => handleOpenComments(slate)}
                                                data-testid="comment-button"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                <span className="text-xs font-medium">{slate.comments_count}</span>
                                            </button>
                                            <button 
                                                className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors"
                                                onClick={() => handleShareSlate(slate.id)}
                                                data-testid="share-button"
                                            >
                                                <Send className="h-4 w-4" />
                                                <span className="text-xs font-medium">{slate.shares_count}</span>
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent> */}

                {/* Collabs Tab */}
                {/* <TabsContent value="collabs" data-testid="collabs-content" className="mt-0">
                    {errors.collabs && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.collabs}</p>
                        </div>
                    )}
                    {loading.collabs ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => <CollabSkeleton key={i} />)}
                        </div>
                    ) : savedCollabs.length === 0 ? (
                        <EmptyState 
                            icon={<Users className="h-12 w-12" />}
                            title="No saved collabs yet"
                            description="Start saving collaboration opportunities to see them here"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedCollabs.map((collab) => (
                                <Card 
                                    key={collab.id} 
                                    className="p-0 gap-0 border-0 shadow-sm hover:shadow-md transition-all duration-300 group bg-white overflow-hidden flex flex-col h-full" 
                                    data-testid="saved-collab-card"
                                >
                                    <div className="relative h-48 w-full overflow-hidden">
                                        <Image
                                            src={collab.cover_image_url || "/slate.png"}
                                            alt={collab.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                        <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white" variant="secondary">
                                            {collab.status}
                                        </Badge>
                                        <button
                                            onClick={() => handleUnsaveCollab(collab.id)}
                                            className="absolute top-3 right-3 bg-white/20 hover:bg-white/90 backdrop-blur-md rounded-full p-2 text-white hover:text-[#FA6E80] transition-all"
                                            title="Remove from saved"
                                            data-testid="unsave-collab-button"
                                        >
                                            <Bookmark className="h-4 w-4 fill-current" />
                                        </button>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                            {collab.tags.slice(0, 3).map((tag, idx) => (
                                                <span key={idx} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-[#6A89BE]/10 text-[#6A89BE]">
                                                    {tag}
                                                </span>
                                            ))}
                                            {collab.tags.length > 3 && (
                                                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-gray-100 text-gray-500">
                                                    +{collab.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-1 group-hover:text-[#6A89BE] transition-colors">{collab.title}</h3>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{collab.summary}</p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <Image
                                                    src={collab.author.avatar || "/default-profile.png"}
                                                    alt={collab.author.name}
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full object-cover ring-1 ring-gray-100"
                                                />
                                                <span className="text-xs font-medium text-gray-700">{collab.author.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                                <Users className="h-3 w-3" />
                                                <span>{collab.interests} Interested</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent> */}

                {/* What's On Tab */}
                {/* <TabsContent value="whats-on" data-testid="whats-on-content" className="mt-0">
                    {errors.whatsOn && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.whatsOn}</p>
                        </div>
                    )}
                    {loading.whatsOn ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => <EventSkeleton key={i} />)}
                        </div>
                    ) : savedWhatsOn.length === 0 ? (
                        <EmptyState 
                            icon={<Calendar className="h-12 w-12" />}
                            title="No saved events yet"
                            description="Start saving events to see them here"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {savedWhatsOn.map((event) => {
                                const firstSchedule = event.schedule?.[0];
                                const eventDate = firstSchedule ? format(new Date(firstSchedule.event_date), 'EEE, MMM d') : 'TBA';
                                const eventTime = firstSchedule ? `${firstSchedule.start_time}` : 'TBA';
                                const priceDisplay = event.is_paid ? `${event.price_currency} ${event.price_amount}` : 'Free';
                                
                                return (
                                    <Card 
                                        key={event.id} 
                                        className="p-0 gap-0 border-0 shadow-sm hover:shadow-md transition-all duration-300 group bg-white overflow-hidden flex flex-col h-full" 
                                        data-testid="saved-event-card"
                                    >
                                        <div className="relative h-56 w-full">
                                            <Image
                                                src={event.thumbnail_url || event.hero_image_url || "/whats-on.png"}
                                                alt={event.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 flex flex-col items-center shadow-sm">
                                                <span className="text-xs font-bold text-gray-500 uppercase">{firstSchedule ? format(new Date(firstSchedule.event_date), 'MMM') : 'DEC'}</span>
                                                <span className="text-lg font-bold text-gray-900">{firstSchedule ? format(new Date(firstSchedule.event_date), 'd') : '31'}</span>
                                            </div>
                                            <div className="absolute bottom-3 right-3">
                                                <Badge className={`${event.is_paid ? 'bg-[#FA6E80]' : 'bg-[#31A7AC]'} hover:${event.is_paid ? 'bg-[#FA6E80]/90' : 'bg-[#31A7AC]/90'} text-white border-0`}>
                                                    {priceDisplay}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#31A7AC] transition-colors line-clamp-1">{event.title}</h3>
                                                <button
                                                    onClick={() => handleUnsaveEvent(event.id)}
                                                    className="text-gray-300 hover:text-[#FA6E80] transition-colors -mt-1 -mr-1 p-1"
                                                    title="Remove from saved"
                                                    data-testid="unsave-event-button"
                                                >
                                                    <Bookmark className="h-5 w-5 fill-[#FA6E80] text-[#FA6E80]" />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span className="truncate">{event.is_online ? 'Online Event' : event.location}</span>
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{event.description}</p>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        {[...Array(3)].map((_, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white ring-1 ring-gray-50" />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500">+{event.rsvp_count} Going</span>
                                                </div>
                                                
                                                <Button variant="ghost" size="sm" className="h-8 text-xs group/btn">
                                                    Details <ArrowRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent> */}

                {/* Profiles Tab */}
                <TabsContent value="profiles" data-testid="profiles-content" className="mt-0">
                    {errors.profiles && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.profiles}</p>
                        </div>
                    )}
                    {loading.profiles ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => <ProfileSkeleton key={i} />)}
                        </div>
                    ) : savedProfiles.length === 0 ? (
                        <EmptyState 
                            icon={<User className="h-12 w-12" />}
                            title="No saved profiles yet"
                            description="Start saving profiles to see them here"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedProfiles.map((savedProfile) => (
                                <Card 
                                    key={savedProfile.save_id} 
                                    className="p-0 gap-0 border-0 shadow-sm hover:shadow-md transition-all duration-300 group bg-white overflow-hidden flex flex-col h-full" 
                                    data-testid="saved-profile-card"
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <Image
                                                    src={savedProfile.profile.avatar || "/default-profile.png"}
                                                    alt={savedProfile.profile.name}
                                                    width={56}
                                                    height={56}
                                                    className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                                                        {savedProfile.profile.name}
                                                    </h3>
                                                    {(savedProfile.profile.city || savedProfile.profile.country) && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            <span className="truncate">
                                                                {[savedProfile.profile.city, savedProfile.profile.country].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnsaveProfile(savedProfile.user_id)}
                                                className="text-gray-300 hover:text-[#FA6E80] transition-colors p-1 -mt-1 -mr-1"
                                                title="Remove from saved"
                                                data-testid="unsave-profile-button"
                                            >
                                                <Bookmark className="h-5 w-5 fill-purple-500 text-purple-500" />
                                            </button>
                                        </div>
                                        
                                        {savedProfile.profile.bio && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                                                {savedProfile.profile.bio}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                            <div className="text-xs text-gray-500">
                                                Saved {formatRelativeTime(savedProfile.saved_at)}
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 text-xs group/btn hover:bg-purple-50 hover:text-purple-600"
                                                onClick={() => handleViewProfile(savedProfile.user_id)}
                                                data-testid="view-profile-button"
                                            >
                                                View Profile <ArrowRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Comments Modal */}
            <CommentsModal
                open={commentsModal.open}
                onOpenChange={(open) => setCommentsModal(prev => ({ ...prev, open }))}
                postId={commentsModal.postId}
                postAuthor={commentsModal.postAuthor}
                postContent={commentsModal.postContent}
                commentsCount={commentsModal.commentsCount}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    );
}

function SlateSkeleton() {
    return (
        <Card className="p-0 gap-0 border-0 shadow-sm rounded-lg bg-white h-[450px] flex flex-col">
            <div className="p-6 flex-1">
                <div className="flex items-center mb-4">
                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="w-full h-48 rounded-lg mt-4" />
            </div>
            <div className="px-6 py-4 border-t bg-gray-50/50 flex gap-4">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
            </div>
        </Card>
    );
}

function CollabSkeleton() {
    return (
        <Card className="p-0 gap-0 border-0 shadow-sm rounded-lg overflow-hidden bg-white h-[350px] flex flex-col">
            <Skeleton className="w-full h-40" />
            <div className="p-5 space-y-3 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-auto pt-4 flex justify-between items-center">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
        </Card>
    );
}

function EventSkeleton() {
    return (
        <Card className="p-0 gap-0 border-0 shadow-sm rounded-lg overflow-hidden bg-white h-[400px] flex flex-col">
            <Skeleton className="w-full h-48" />
            <div className="p-5 space-y-3 flex-1">
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-6" />
                </div>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="mt-auto pt-4 flex justify-between items-center">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
        </Card>
    );
}

function ProfileSkeleton() {
    return (
        <Card className="p-0 gap-0 border-0 shadow-sm rounded-lg bg-white h-[220px] flex flex-col">
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-5 w-5 rounded" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            </div>
        </Card>
    );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <div className="p-4 bg-gray-50 rounded-full mb-4 text-gray-400">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-md mx-auto">{description}</p>
        </div>
    );
}