"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HighlightSelectCard } from "./HighlightSelectCard";
import apiCalling from "@/lib/apiCalling";
import { toast } from "sonner";
import { Loader2, Clapperboard, LayoutGrid, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HighlightsSelectorProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  currentHighlights: Array<{
    id: string;
    source_type?: string;
    source_id?: string;
  }>;
}

interface SelectedItem {
  source_type: 'credit' | 'slate_post';
  source_id: string;
  sort_order: number;
}

export function HighlightsSelector({ 
  open,
  onClose, 
  onSave, 
  currentHighlights 
}: HighlightsSelectorProps) {
  const [credits, setCredits] = useState<any[]>([]);
  const [slatePosts, setSlatePosts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'credits' | 'slate'>('credits');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
      
      // Initialize selected items from current highlights
      const initialSelected = currentHighlights
        .filter(h => h.source_type && h.source_id)
        .map((h, index) => ({
          source_type: h.source_type as 'credit' | 'slate_post',
          source_id: h.source_id!,
          sort_order: index
        }));
      setSelectedItems(initialSelected);
    }
  }, [open, currentHighlights]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch credits
      const creditsResponse = await apiCalling({
        method: 'get',
        route: '/profile/credits'
      });
      if (creditsResponse.status && creditsResponse.data?.data) {
        setCredits(creditsResponse.data.data || []);
      }

      // Fetch slate posts
      const slateResponse = await apiCalling({
        method: 'get',
        route: '/slate/my'
      });
      if (slateResponse.status && slateResponse.data?.data) {
        setSlatePosts(slateResponse.data.data?.posts || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (type: 'credit' | 'slate_post', id: string): boolean => {
    return selectedItems.some(
      item => item.source_type === type && item.source_id === id
    );
  };

  const handleToggleSelect = (type: 'credit' | 'slate_post', id: string) => {
    const alreadySelected = isSelected(type, id);
    
    if (alreadySelected) {
      // Remove from selection
      setSelectedItems(prev => 
        prev.filter(item => !(item.source_type === type && item.source_id === id))
      );
    } else {
      // Check if we've reached the limit
      if (selectedItems.length >= 3) {
        toast.error('You can only select up to 3 highlights');
        return;
      }
      
      // Add to selection
      setSelectedItems(prev => [
        ...prev,
        {
          source_type: type,
          source_id: id,
          sort_order: prev.length
        }
      ]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing highlights
      for (const highlight of currentHighlights) {
        await apiCalling({
          method: 'delete',
          route: `/profile/highlights?id=${highlight.id}`
        });
      }

      // Create new highlights from selected items
      for (const item of selectedItems) {
        await apiCalling({
          method: 'post',
          route: '/profile/highlights',
          data: {
            source_type: item.source_type,
            source_id: item.source_id,
            sort_order: item.sort_order
          }
        });
      }

      toast.success('Highlights updated successfully');
      onSave();
    } catch (error: any) {
      console.error('Error saving highlights:', error);
      toast.error('Failed to save highlights');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 md:p-6 pb-4 border-b bg-white z-10">
            <DialogHeader className="space-y-2">
                <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#FA6E80]" />
                        Edit Heylights
                    </DialogTitle>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        {selectedItems.length}/3 Selected
                    </Badge>
                </div>
                <DialogDescription className="text-sm md:text-base text-gray-500">
                Showcase your best work. Choose up to 3 items.
                </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'credits' | 'slate')} className="mt-6">
                {/* 
                  Override default TabsList styles:
                  - sm:w-[680px] (default) -> sm:w-full (override) to prevent overflow/fixed width
                  - flex-col (default) -> grid grid-cols-2 to force equal width side-by-side
                */}
                <TabsList className="grid w-full sm:w-full grid-cols-2 bg-gray-100 p-1 h-12">
                <TabsTrigger 
                    value="credits" 
                    className="data-[state=active]:bg-white data-[state=active]:text-[#FA6E80] data-[state=active]:shadow-sm h-10 text-sm md:text-base font-medium transition-all"
                >
                    <Clapperboard className="w-4 h-4 mr-2" />
                    <span className="truncate">Credits ({credits.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="slate" 
                    className="hidden data-[state=active]:bg-white data-[state=active]:text-[#FA6E80] data-[state=active]:shadow-sm h-10 text-sm md:text-base font-medium transition-all"
                >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    <span className="truncate">Slate ({slatePosts.length})</span>
                </TabsTrigger>
                </TabsList>
            </Tabs>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-gray-50/50 relative">
                {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[#FA6E80]" />
                    <p className="text-sm text-gray-500 font-medium">Loading your content...</p>
                </div>
                ) : (
                    <ScrollArea className="h-full w-full">
                        <div className="p-4 md:p-6 max-w-3xl mx-auto">
                            {activeTab === 'credits' && (
                                <>
                                    {credits.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Clapperboard className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Ready to shine?</h3>
                                            <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                                Add credits to your profile first to feature them as heylights.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {credits.map(credit => (
                                                <HighlightSelectCard
                                                    key={credit.id}
                                                    type="credit"
                                                    item={credit}
                                                    isSelected={isSelected('credit', credit.id)}
                                                    onToggle={() => handleToggleSelect('credit', credit.id)}
                                                    disabled={selectedItems.length >= 3 && !isSelected('credit', credit.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'slate' && (
                                <>
                                    {slatePosts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <LayoutGrid className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Your canvas awaits</h3>
                                            <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                                Create posts on your Slate to feature them here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {slatePosts.map(post => (
                                                <HighlightSelectCard
                                                    key={post.id}
                                                    type="slate_post"
                                                    item={post}
                                                    isSelected={isSelected('slate_post', post.id)}
                                                    onToggle={() => handleToggleSelect('slate_post', post.id)}
                                                    disabled={selectedItems.length >= 3 && !isSelected('slate_post', post.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-white flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Selected items will appear at the top of your profile</span>
                </div>
                
                <div className="flex w-full sm:w-auto items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 sm:flex-none h-11 sm:h-10"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex-1 sm:flex-none bg-[#FA6E80] hover:bg-[#FA596E] text-white h-11 sm:h-10 min-w-[140px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            `Save Heylights (${selectedItems.length})`
                        )}
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
