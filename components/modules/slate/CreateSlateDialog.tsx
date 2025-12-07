"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Image as ImageIcon, MapPin, Tag, Loader2, Edit } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { ImageCropper } from "@/components/ui/image-cropper";

interface CreateSlateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateSlateDialog({ open, onOpenChange }: CreateSlateDialogProps) {
    const [content, setContent] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [location, setLocation] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // simple validation
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
        if (!type) {
            toast.error("Only images and videos are supported");
            return;
        }

        setMediaFile(file);
        setMediaType(type);
        
        const url = URL.createObjectURL(file);
        setMediaPreview(url);
    };

    const clearMedia = () => {
        setMediaFile(null);
        if (mediaPreview) URL.revokeObjectURL(mediaPreview);
        setMediaPreview(null);
        setMediaType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/^#/, '');
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
                setTagInput("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
        if (!content.trim() && !mediaFile) {
            toast.error("Please add some content or media");
            return;
        }

        setLoading(true);
        try {
            // 1. Get Auth Token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Please login to create a post");
                return;
            }
            const token = session.access_token;

            let mediaUrl = "";

            // 2. Upload Media if exists
            if (mediaFile) {
                const formData = new FormData();
                formData.append('file', mediaFile);

                const uploadResponse = await fetch('/api/upload/slate-media', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || "Failed to upload media");
                }
                
                mediaUrl = uploadResult.data.url;
            }

            // 3. Create Post
            // Append tags and location to content for now as per schema limitations
            // or structure it if we want to enhance later. 
            // The API takes `content` and `media_urls`.
            
            let finalContent = content;
            if (location) finalContent += `\n\n📍 ${location}`;
            if (tags.length > 0) finalContent += `\n\n${tags.map(t => `#${t}`).join(' ')}`;

            const postPayload = {
                content: finalContent,
                media_urls: mediaUrl ? [mediaUrl] : [],
                status: 'published'
            };

            const createResponse = await fetch('/api/slate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postPayload)
            });

            const createResult = await createResponse.json();

            if (!createResult.success) {
                throw new Error(createResult.error || "Failed to create post");
            }

            toast.success("Slate created successfully!");
            
            // Reset form
            setContent("");
            clearMedia();
            setTags([]);
            setLocation("");
            onOpenChange(false);

            // Optional: Refresh feed or redirect
            window.location.reload(); 

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="p-4 border-b border-gray-100 flex flex-row items-center justify-between">
                    <DialogTitle className="text-base font-semibold text-center flex-1">Create new slate</DialogTitle>
                    {/* Close button handled by Dialog Primitive, but we can add custom action button if needed */}
                </DialogHeader>
                
                <div className="flex flex-col h-full max-h-[80vh] overflow-y-auto">
                    {/* Media Section */}
                    <div className="w-full bg-[#FAFAFA] min-h-[200px] flex flex-col items-center justify-center border-b border-gray-100 relative">
                        {mediaPreview ? (
                            <div className="relative w-full h-full min-h-[300px] bg-black flex items-center justify-center">
                                {mediaType === 'image' ? (
                                    <Image 
                                        src={mediaPreview} 
                                        alt="Preview" 
                                        width={600} 
                                        height={400} 
                                        className="max-h-[400px] w-auto object-contain"
                                    />
                                ) : (
                                    <video src={mediaPreview} controls className="max-h-[400px] w-auto" />
                                )}
                                <button 
                                    onClick={clearMedia}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="mb-4">
                                    <svg width="66" height="58" viewBox="0 0 66 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M39.375 28.5L30.5 39.625L24.625 32.375L15.75 44H51.25L39.375 28.5ZM63 46.5V11.5C63 9.51088 62.2098 7.60322 60.8033 6.1967C59.3968 4.79018 57.4891 4 55.5 4H10.5C8.51088 4 6.60322 4.79018 5.1967 6.1967C3.79018 7.60322 3 9.51088 3 11.5V46.5C3 48.4891 3.79018 50.3968 5.1967 51.8033C6.60322 53.2098 8.51088 54 10.5 54H55.5C57.4891 54 59.3968 53.2098 60.8033 51.8033C62.2098 50.3968 63 48.4891 63 46.5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <p className="text-lg font-light mb-4">Drag photos and videos here</p>
                                <Button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-[#FA6E80] hover:bg-[#FA6E80]/90 text-white font-semibold text-sm h-8 px-4 rounded-md"
                                >
                                    Select from device
                                </Button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-4 space-y-4 flex-1">
                        {/* Description */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Textarea 
                                    placeholder="Write a caption..." 
                                    className="border-none resize-none p-0 focus-visible:ring-0 min-h-[100px] text-sm"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                                <div className="flex justify-between items-center mt-2 border-t pt-2">
                                    <div className="flex gap-4 text-gray-500">
                                        {/* Emojis or other tools could go here */}
                                    </div>
                                    <span className="text-xs text-gray-400">{content.length}/2,200</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 -mx-4"></div>

                        {/* Location */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-5 w-5" />
                                <Input 
                                    placeholder="Add Location" 
                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm placeholder:text-gray-500"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 -mx-4"></div>

                        {/* Tags */}
                        <div className="py-2">
                             <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Tag className="h-5 w-5" />
                                <Input 
                                    placeholder="Add tags (press enter)" 
                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm placeholder:text-gray-500"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs flex items-center gap-1 text-gray-700">
                                            #{tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer/Action */}
                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-white px-8"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Share
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
