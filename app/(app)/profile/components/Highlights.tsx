"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import HighlightsText from "./highlights-text";
import { useProfile, type HighlightData } from "@/contexts/ProfileContext";
import { HighlightsSelector } from "./HighlightsSelector";
import { Plus } from "lucide-react";

interface HighlightItem {
    id: string;
    title: string;
    description: string;
    images: string;
    type?: string;
}

interface HighlightsProps {
    // This prop is kept for backward compatibility but we'll use API data
    highlights?: HighlightItem[];
}

export function HighlightCard({
    highlight,
    className = "",
}: {
    highlight: HighlightItem;
    className?: string;
}) {
    const words = highlight.description.trim().split(/\s+/);
    const truncated = words.slice(0, 20).join(" ");
    const hasMore = words.length > 20;

    return (
        <article className={`space-y-3 ${className}`}>
            <div className="relative w-full lg:w-[275px] h-[263px] overflow-hidden rounded-[8px] bg-gray-100">
                <Image
                    src={highlight.images}
                    alt={highlight.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 275px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{highlight.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
                {truncated}
                {hasMore && (
                    <>
                        …<br /><Link href={'#'} className="ml-1 text-[#FA596E] font-medium hover:underline">Read more</Link>
                    </>
                )}
            </p>
        </article>
    );
}

export default function Highlights({ highlights: propHighlights }: HighlightsProps) {
    const { highlights: apiHighlights, fetchHighlights } = useProfile();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    
    // Transform highlight data based on source type
    const transformHighlight = (highlight: any): HighlightItem | null => {
        if (highlight.source_type === 'credit' && highlight.source_data) {
            const credit = highlight.source_data;
            return {
                id: highlight.id,
                title: credit.credit_title || 'Untitled Credit',
                description: credit.description || '',
                images: credit.image_url || '/placeholder.png',
                type: 'credit'
            };
        } else if (highlight.source_type === 'slate_post' && highlight.source_data) {
            const post = highlight.source_data;
            const firstMedia = post.media?.[0];
            return {
                id: highlight.id,
                title: 'Slate Post',
                description: post.content || '',
                images: firstMedia?.media_url || '/placeholder.png',
                type: 'slate'
            };
        } else if (highlight.title && highlight.description) {
            // Legacy format
            return {
                id: highlight.id,
                title: highlight.title,
                description: highlight.description,
                images: highlight.image_url || '/placeholder.png',
                type: 'legacy'
            };
        }
        return null;
    };

    // Use API highlights with enriched source data if available
    const displayHighlights = apiHighlights.length > 0 
        ? apiHighlights.map(h => transformHighlight(h)).filter((h): h is HighlightItem => h !== null)
        : propHighlights || [];

    const handleSelectorSave = () => {
        setIsSelectorOpen(false);
        fetchHighlights();
    };

    return (
        <section className="w-full">
            {/* Desktop View */}
            <div className="hidden lg:flex gap-6">
                <aside className="sticky top-24 self-start w-full max-w-[336px] space-y-6">
                    <Button
                        variant="outline"
                        className="w-full h-11 rounded-[10px] border-[#31A7AC] text-black hover:bg-[#31A7AC]/5 transition-colors"
                        onClick={() => setIsSelectorOpen(true)}
                    >
                        Edit Heylights
                    </Button>
                    
                    <div className="space-y-8">
                        {displayHighlights.length > 0 ? (
                            displayHighlights.map((highlight) => (
                                <HighlightCard key={highlight.id} highlight={highlight} />
                            ))
                        ) : (
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center gap-3 text-gray-500">
                                <p className="text-sm">It is time to flex with your masterpiece</p>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-[#FA6E80] hover:text-[#FA596E] hover:bg-pink-50"
                                    onClick={() => setIsSelectorOpen(true)}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Heylights
                                </Button>
                            </div>
                        )}
                    </div>
                </aside>

                <div className="flex flex-col items-center" style={{ gap: '15px' }}>
                    <HighlightsText />
                    <div
                        className="rounded-full"
                        style={{
                            width: '1px',
                            height: '1501px',
                            background: 'linear-gradient(180deg, #FA6E80 0%, #6A89BE 41.52%, #85AAB7 62.27%, #31A7AC 103.79%)',
                            opacity: 1
                        }}
                        aria-hidden
                    />
                </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden flex flex-col gap-6 pb-10">
                <HighlightsText className="w-full" />
                
                <Button
                    variant="outline"
                    className="w-full h-11 rounded-[10px] border-[#31A7AC] text-black hover:bg-transparent"
                    onClick={() => setIsSelectorOpen(true)}
                >
                    Edit Heylights
                </Button>

                <div className="flex flex-row overflow-x-auto gap-x-6 scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {displayHighlights.length > 0 ? (
                        displayHighlights.map((highlight) => (
                            <div key={highlight.id} className="flex-none w-[280px]">
                                <HighlightCard highlight={highlight} />
                            </div>
                        ))
                    ) : (
                         <div className="flex-none w-full p-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center gap-3 text-gray-500 bg-gray-50/50">
                            <p className="text-sm font-medium">Showcase your best work</p>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[#FA6E80] hover:text-[#FA596E]"
                                onClick={() => setIsSelectorOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Heylights
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Highlights Selector Dialog */}
            <HighlightsSelector 
                open={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSave={handleSelectorSave}
                currentHighlights={apiHighlights}
            />
        </section>
    );
}
