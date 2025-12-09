"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"
import { cn } from "@/lib/utils";
import apiCalling from "@/lib/apiCalling";

export default function AboutSectionComponent({ icon, title, about: initialAbout, className, onUpdate, trigger }: { icon?: React.ReactNode, title: string, about: string, className?: string, onUpdate?: () => void, trigger?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [about, setAbout] = useState(initialAbout || "This is the about section. It contains information about the user. It can be edited by clicking the edit button.");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const finalTitle = title

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 1. Check if data has changed
        if (about.trim() === (initialAbout || "").trim()) {
            toast.info("No changes were made.");
            setIsOpen(false);
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // Save to API - using 'about' field instead of 'bio'
            const response = await apiCalling({
                method: 'patch',
                route: '/profile',
                data: { about: about }
            });

            if (response.status) {
                toast.success(`${finalTitle} updated successfully!`);
                setIsOpen(false);
                // Call onUpdate callback to refresh profile data
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                toast.error(response.message || 'Failed to update about section');
            }
        } catch (err) {
            console.error('Error updating about:', err);
            toast.error('Failed to update about section');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <div
                        className={cn(
                            "flex flex-row gap-5 h-[44px] w-auto text-base font-medium rounded-[15px]  bg-transparent border px-9 justify-center items-center cursor-pointer hover:bg-muted/50 border-[#444444]",
                            className
                        )}
                    >
                        {finalTitle}{ }
                        {icon}
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="flex flex-col items-start justify-start ">
                        <DialogTitle>Edit {finalTitle}</DialogTitle>
                        <div className="text-start text-[12px] font-[400]">
                            Let people see how you show up and what you bring to the production world
                        </div>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-3">
                            <Textarea
                                id="about-textarea"
                                placeholder="Go on, tell us..."
                                value={about}
                                onChange={(e) => {
                                    setAbout(e.target.value);
                                    if (error) setError(null); // Clear error when user starts typing
                                }}
                                className={`h-72 rounded-[15px] ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                        </div>
                    </div>
                    <DialogFooter className="flex flex-row ">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="rounded-[16px] h-[44px] w-[128px]" disabled={isLoading}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" className="rounded-[16px] h-[44px]" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}