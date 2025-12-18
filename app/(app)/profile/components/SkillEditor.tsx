/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Menu, GripVertical } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import SkillFormCard from "./SkillFormCard";
import { useProfile } from "@/contexts/ProfileContext";

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

function SortableSkillItem({ skill }: { skill: Skill }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: skill.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1">
                <p className="font-medium text-gray-900">{skill.role}</p>
                <p className="text-sm text-gray-500 line-clamp-1">
                    {skill.description || "No description"}
                </p>
            </div>
        </div>
    );
}

interface SkillEditorProps {
    initialSkills: Skill[];
    trigger: React.ReactNode;
    onUpdate?: () => void;
    initialSelectedSkillId?: string | null;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function SkillEditor({ 
    initialSkills, 
    trigger, 
    onUpdate,
    initialSelectedSkillId = null,
    isOpen: controlledIsOpen,
    onOpenChange: controlledOnOpenChange
}: SkillEditorProps) {
    const hydrateSkill = (skill: Skill): Skill => ({
        ...skill,
        experience: skill.experience ?? { value: "intern", title: "Intern", description: "helped on set, shadowed role" },
        rate: skill.rate ?? "",
        isPublic: skill.isPublic ?? true,
    });

    const [skills, setSkills] = useState<Skill[]>(initialSkills.map(hydrateSkill));
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isReorderOpen, setIsReorderOpen] = useState(false);
    const [tempSkills, setTempSkills] = useState<Skill[]>([]);
    const [selectedSkillId, setSelectedSkillId] = useState<string>(initialSkills[0]?.id || '');
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [experienceVisibility, setExperienceVisibility] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    
    // Get profile methods
    const { updateSkill, deleteSkill, fetchSkills } = useProfile();

    // Use controlled or internal state for dialog open
    const isDialogOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsDialogOpen = controlledOnOpenChange || setInternalIsOpen;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setTempSkills((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleReorderClick = () => {
        setTempSkills([...skills]);
        setIsReorderOpen(true);
    };

    const handleReorderSave = () => {
        setSkills(tempSkills);
        setIsReorderOpen(false);
        toast.success("Skill order saved!");
    };

    const handleRemoveSkill = async (id: string) => {
        // Prevent multiple simultaneous deletes
        if (deletingIds.has(id)) return;
        
        setDeletingIds(prev => new Set(prev).add(id));
        
        try {
            const result = await deleteSkill(id);
            
            if (result.success) {
                // Remove from local state
                const updatedSkills = skills.filter((skill) => skill.id !== id);
                setSkills(updatedSkills);
                
                // If the deleted skill was selected, select the first remaining skill
                if (selectedSkillId === id && updatedSkills.length > 0) {
                    setSelectedSkillId(updatedSkills[0].id);
                    setEditingSkill(updatedSkills[0]);
                } else if (updatedSkills.length === 0) {
                    // If no skills left, close the dialog
                    setIsDialogOpen(false);
                }
                
                toast.success("Skill removed successfully!");
                
                // Refresh skills data
                await fetchSkills();
                onUpdate?.();
            } else {
                toast.error(result.message || "Failed to remove skill");
            }
        } catch (error) {
            console.error('Error removing skill:', error);
            toast.error("Failed to remove skill");
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleSkillChange = <K extends keyof Skill>(
        field: K,
        value: Skill[K]
    ) => {
        if (editingSkill) {
            setEditingSkill({ ...editingSkill, [field]: value });
        }
    };

    const toggleExperienceSection = () => {
        setExperienceVisibility((prev) => ({
            ...prev,
            [selectedSkillId]: !(prev[selectedSkillId] ?? true),
        }));
    };

    const handleSkillSelect = (skillId: string) => {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
            setSelectedSkillId(skillId);
            setEditingSkill({ ...skill });
        }
    };

    const handleSaveChanges = async () => {
        // Validate that the editing skill has required fields
        if (!editingSkill || !editingSkill.department || !editingSkill.role) {
            toast.error('Please fill in department and role');
            return;
        }

        // Prevent multiple simultaneous saves
        if (saving) return;

        setSaving(true);
        try {
            // Parse rate if it exists to extract currency and amount
            let dayRate = undefined;
            let dayRateCurrency = undefined;
            if (editingSkill.rate) {
                // Try to extract currency and number from rate string (e.g., "AED 1000 per day")
                const rateMatch = editingSkill.rate.match(/([A-Z]{3})\s*([\d,]+)/);
                if (rateMatch) {
                    dayRateCurrency = rateMatch[1];
                    dayRate = parseFloat(rateMatch[2].replace(/,/g, ''));
                }
            }

            // Update only the currently editing skill
            const skillData = {
                skill_name: `${editingSkill.department} - ${editingSkill.role}`,
                description: editingSkill.description || undefined,
                experience_level: editingSkill.experience?.title || undefined,
                day_rate: dayRate,
                day_rate_currency: dayRateCurrency,
                is_public: editingSkill.isPublic ?? true,
            };
            
            await updateSkill(editingSkill.id, skillData);

            // Update local state
            setSkills(skills.map(skill => 
                skill.id === editingSkill.id ? editingSkill : skill
            ));

            // Refresh skills data
            await fetchSkills();
            
            toast.success("Skill updated successfully!");
            setIsDialogOpen(false);
            onUpdate?.();
        } catch (error) {
            console.error('Skill update error:', error);
            toast.error('Failed to update skill');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to initial state
        setSkills(initialSkills.map(hydrateSkill));
        setEditingSkill(null);
        setIsDialogOpen(false);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (open && skills.length > 0) {
            // If initialSelectedSkillId is provided, use it; otherwise use the first skill
            let skillToEdit: Skill | undefined;
            
            if (initialSelectedSkillId) {
                skillToEdit = skills.find(s => s.id === initialSelectedSkillId);
            }
            
            if (!skillToEdit) {
                skillToEdit = skills.find(s => s.id === selectedSkillId) || skills[0];
            }
            
            setSelectedSkillId(skillToEdit.id);
            setEditingSkill({ ...skillToEdit });
        } else {
            setEditingSkill(null);
        }
    };

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="w-[560px] max-h-[80vh] flex flex-col rounded-[15px] border-0 p-0 shadow-[2px_3px_8px_rgba(0,0,0,0.09)]">
                    <div className="flex flex-col h-full max-h-[80vh]">
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            <div className="flex flex-col gap-[35px] bg-white p-[30px]">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h1 className="text-[22px] font-normal leading-[33px] text-black">
                                                Edit Skill
                                            </h1>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleReorderClick}
                                                variant="outline"
                                                className="flex items-center gap-2 rounded-xl border border-[#31A7AC] px-4 py-2 text-sm text-[#31A7AC] hover:bg-[#E7FAFC]"
                                            >
                                                <Menu className="h-4 w-4" />
                                                Reorder
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Skill Selector */}
                                    <div className="space-y-2">
                                        <select
                                            value={selectedSkillId}
                                            onChange={(e) => handleSkillSelect(e.target.value)}
                                            className="w-full rounded-[15px] border border-[#828282] px-5 py-3 text-sm text-black focus:border-[#31A7AC] focus:outline-none"
                                        >
                                            {skills.map((skill) => (
                                                <option key={skill.id} value={skill.id}>
                                                    {skill.role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-8 pb-20">
                                    {editingSkill && (
                                        <SkillFormCard
                                            key={editingSkill.id}
                                            skill={editingSkill}
                                            isExperienceOpen={experienceVisibility[selectedSkillId] ?? true}
                                            experienceOptions={experienceOptions}
                                            primarySkillOptions={primarySkillOptions}
                                            specialtyOptions={specialtyOptions}
                                            onFieldChange={handleSkillChange}
                                            onToggleExperience={toggleExperienceSection}
                                            onRemove={() => handleRemoveSkill(editingSkill.id)}
                                        />
                                    )}
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
                                disabled={saving}
                                className="h-[47px] min-w-[120px] rounded-[10px] bg-[#FA6E80] px-6 text-sm font-semibold text-white hover:bg-[#f2576b]"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reorder Dialog */}
            <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
                <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                    <DialogHeader className="flex-none">
                        <DialogTitle className="text-2xl font-bold">
                            Reorder Skills
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={tempSkills.map((s) => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {tempSkills.map((skill) => (
                                        <SortableSkillItem
                                            key={skill.id}
                                            skill={skill}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={() => setIsReorderOpen(false)}
                            variant="outline"
                            className="flex-1 border-2 border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReorderSave}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            Save Order
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
