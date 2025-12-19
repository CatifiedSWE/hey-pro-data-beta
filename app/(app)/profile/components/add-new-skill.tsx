/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { toast } from "sonner";
import SkillFormCard from "./SkillFormCard";
import { useProfile } from "@/contexts/ProfileContext";

/**
 * Robust rate parser that handles multiple input formats
 * Formats supported:
 * - "AED 1000" or "AED1000" - Currency first
 * - "1000 AED" or "1000AED" - Amount first
 * - "1000" - Amount only (no currency)
 * - "AED 1,000 per day" - With separators and extra text
 * - "1,000.50 USD/day" - With decimals and symbols
 */
function parseRateString(rateStr: string): { amount: number; currency?: string } | null {
    if (!rateStr || !rateStr.trim()) return null;
    
    const cleaned = rateStr.trim();
    
    // Try to find currency code (3 uppercase letters)
    // Patterns: word boundary, before number, or after number
    const currencyMatch = cleaned.match(/\b([A-Z]{3})\b|([A-Z]{3})(?=[\d,])|(?<=[\d,])([A-Z]{3})/);
    const currency = currencyMatch ? (currencyMatch[1] || currencyMatch[2] || currencyMatch[3]) : undefined;
    
    // Try to find numeric value (supports decimals, commas)
    // Matches: 1000, 1,000, 1000.50, 1,000.50
    const numberMatch = cleaned.match(/([\d,]+\.?\d*)/);
    
    if (!numberMatch) return null;
    
    // Clean and parse the number
    const amountStr = numberMatch[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) return null;
    
    return { amount, currency };
}

export interface Skill {
    id: string;
    department: string;
    role: string;
    description: string;
    experience?: { value: string; title: string; description: string; };
    rate?: string;
    isPublic?: boolean;
}

const experienceOptions = [
    {
        value: "intern",
        title: "Intern",
        description: "helped on set, shadowed role",
    },
    {
        value: "learning",
        title: "Learning | Assisted",
        description: "assisted the role under supervision",
    },
    {
        value: "competent",
        title: "Competent | Independent",
        description: "can handle role solo",
    },
    {
        value: "expert",
        title: "Expert | Lead",
        description: "leads team, multiple projects",
    },
]

const primarySkillOptions = [
    "Camera",
    "Lighting",
    "Sound",
    "Production",
    "Cinematography",
    "Color Grading",
    "Editing",
]

const specialtyOptions = [
    "Camera Operator",
    "Assistant",
    "Director of Photography",
    "Producer",
    "Editor",
]



interface AddNewSkillProps {
    trigger: React.ReactNode;
    onUpdate?: () => void;
}

export default function AddNewSkill({ trigger, onUpdate }: AddNewSkillProps) {
    const hydrateSkill = (skill: Skill): Skill => ({
        ...skill,
        experience: skill.experience ?? { value: "intern", title: "Intern", description: "helped on set, shadowed role" },
        rate: skill.rate ?? "",
        isPublic: skill.isPublic ?? true,
    });

    const generateSkillId = () => `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const createBlankSkill = (): Skill =>
        hydrateSkill({
            id: generateSkillId(),
            department: "",
            role: "",
            description: "",
        });

    const [skills, setSkills] = useState<Skill[]>([createBlankSkill()]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [experienceVisibility, setExperienceVisibility] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    
    // Get profile methods
    const { addSkill, fetchSkills } = useProfile();

    const handleAddSkill = () => {
        setSkills((prev) => [...prev, createBlankSkill()]);
    };

    const handleRemoveSkill = (id: string) => {
        toast.success("Skill removed!");
        setSkills((prev) => {
            const updated = prev.filter((skill) => skill.id !== id);
            return updated.length ? updated : [createBlankSkill()];
        });
    };

    const handleSkillChange = <K extends keyof Skill>(
        id: string,
        field: K,
        value: Skill[K]
    ) => {
        setSkills(
            skills.map((skill) =>
                skill.id === id ? { ...skill, [field]: value } : skill
            )
        );
    };

    const toggleExperienceSection = (id: string) => {
        setExperienceVisibility((prev) => ({
            ...prev,
            [id]: !(prev[id] ?? true),
        }));
    };
    const resetForm = () => {
        setSkills([createBlankSkill()]);
        setExperienceVisibility({});
    };

    const handleSaveChanges = async () => {
        // Validate that all skills have required fields
        const invalidSkills = skills.filter(skill => !skill.department || !skill.role);
        if (invalidSkills.length > 0) {
            toast.error('Please fill in department and role for all skills');
            return;
        }

        // Validate rate and currency
        const skillsWithInvalidRates: string[] = [];
        for (const skill of skills) {
            if (skill.rate && skill.rate.trim()) {
                const parsedRate = parseRateString(skill.rate);
                
                // If rate is provided but no currency is detected
                if (parsedRate && !parsedRate.currency) {
                    skillsWithInvalidRates.push(skill.role || skill.department || 'Unknown skill');
                }
            }
        }

        if (skillsWithInvalidRates.length > 0) {
            toast.error(
                `Please specify currency type (e.g., AED, USD, EUR) for: ${skillsWithInvalidRates.join(', ')}`,
                { duration: 5000 }
            );
            return;
        }

        // Prevent multiple simultaneous saves
        if (saving) return;

        setSaving(true);
        try {
            // Add all new skills
            for (const skill of skills) {
                // Parse rate if it exists to extract currency and amount
                let dayRate = undefined;
                let dayRateCurrency = undefined;
                
                if (skill.rate && skill.rate.trim()) {
                    const parsedRate = parseRateString(skill.rate);
                    if (parsedRate) {
                        dayRate = parsedRate.amount;
                        dayRateCurrency = parsedRate.currency;
                    } else {
                        // Show warning but continue with save
                        console.warn('Could not parse rate for skill:', skill.role, skill.rate);
                    }
                }

                const skillData = {
                    skill_name: `${skill.department} - ${skill.role}`,
                    department: skill.department,
                    role: skill.role,
                    description: skill.description || undefined,
                    experience_level: skill.experience?.title || undefined,
                    day_rate: dayRate,
                    day_rate_currency: dayRateCurrency,
                    is_public: skill.isPublic ?? true,
                    sort_order: skills.indexOf(skill),
                };
                
                await addSkill(skillData);
            }

            // Refresh skills data
            await fetchSkills();
            
            toast.success("Skills added successfully!");
            setIsDialogOpen(false);
            resetForm();
            onUpdate?.();
        } catch (error) {
            console.error('Skill save error:', error);
            toast.error('Failed to add skills');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setIsDialogOpen(false);
    };

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="w-[560px] max-h-[80vh] flex flex-col rounded-[15px] border-0 p-0 shadow-[2px_3px_8px_rgba(0,0,0,0.09)]">
                    <VisuallyHidden>
                        <DialogTitle>Add Skills</DialogTitle>
                    </VisuallyHidden>
                    <div className="flex flex-col h-full max-h-[80vh]">
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            <div className="flex flex-col gap-[35px] bg-white p-[30px]">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h1 className="text-[22px] font-normal leading-[33px] text-black">
                                                Add Skills
                                            </h1>
                                            <p className="mt-1 max-w-[484px] text-xs leading-[18px] text-[#181818]">
                                                Add skill details like your core department, specialty, experience, and visibility preference.
                                            </p>
                                        </div>

                                    </div>
                                </div>

                                <div className="space-y-8 pb-20">
                                    {skills.map((skill) => (
                                        <SkillFormCard
                                            key={skill.id}
                                            skill={skill}
                                            isExperienceOpen={experienceVisibility[skill.id] ?? true}
                                            experienceOptions={experienceOptions}
                                            primarySkillOptions={primarySkillOptions}
                                            specialtyOptions={specialtyOptions}
                                            onFieldChange={(field, value) => handleSkillChange(skill.id, field, value)}
                                            onToggleExperience={() => toggleExperienceSection(skill.id)}
                                            onRemove={() => handleRemoveSkill(skill.id)}
                                        />
                                    ))}
                                    <Button
                                        onClick={handleAddSkill}
                                        variant="ghost"
                                        className="w-full justify-center rounded-[10px] border border-dashed border-[#C8C8C8] text-sm text-[#31A7AC] hover:bg-[#F3F4F6]"
                                    >
                                        + Add another skill
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-none flex items-center justify-end gap-6 border-t border-[#C8C8C8] bg-white px-[30px] py-4 z-20 mt-auto">
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="h-[47px] min-w-[120px] rounded-[10px] border border-[#FA6E80] px-6 text-sm font-semibold text-[#FA6E80] hover:bg-[#FFF3F5]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveChanges}
                                className="h-[47px] min-w-[120px] rounded-[10px] bg-[#FA6E80] px-6 text-sm font-semibold text-white hover:bg-[#f2576b]"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
