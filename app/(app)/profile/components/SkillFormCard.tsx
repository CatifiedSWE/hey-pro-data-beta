/** @format */

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Globe, X } from "lucide-react"
import type { Skill } from "./SkillEditor"
import React from "react"

type Experience = {
    value: string
    title: string
    description: string
}

type SkillFormCardProps = {
    skill: Skill
    isExperienceOpen: boolean
    experienceOptions: Experience[]
    primarySkillOptions: string[]
    specialtyOptions: string[]
    onFieldChange: <K extends keyof Skill>(field: K, value: Skill[K]) => void
    onToggleExperience: () => void
    onRemove: () => void
}

export default function SkillFormCard({
    skill,
    isExperienceOpen,
    experienceOptions,
    primarySkillOptions,
    specialtyOptions,
    onFieldChange,
    onToggleExperience,
    onRemove,
}: SkillFormCardProps) {
    const [isPublic, setIsPublic] = React.useState(skill.isPublic ?? true)
    
    // Sync local state with prop changes
    React.useEffect(() => {
        setIsPublic(skill.isPublic ?? true);
    }, [skill.isPublic]);
    
    // Only show remove button if skill has been filled (has department or role)
    const showRemoveButton = skill.department || skill.role
    
    return (
        <div className="space-y-5 rounded-[15px] border  bg-[#4444]/10 p-6 shadow-sm">
            <div className="space-y-4">
                <select
                    value={skill.department}
                    onChange={(e) => onFieldChange("department", e.target.value)}
                    className="w-full rounded-[15px] border border-[#828282] px-5 py-3 text-sm text-black focus:border-[#31A7AC] focus:outline-none"
                >
                    <option value="">Select skill family</option>
                    {primarySkillOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                    {skill.department && !primarySkillOptions.includes(skill.department) && (
                        <option value={skill.department}>{skill.department}</option>
                    )}
                </select>

                <select
                    value={skill.role}
                    onChange={(e) => onFieldChange("role", e.target.value)}
                    className="w-full rounded-[15px] border border-[#828282] px-5 py-3 text-sm text-black focus:border-[#31A7AC] focus:outline-none"
                >
                    <option value="">Select specialty</option>
                    {specialtyOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                    {skill.role && !specialtyOptions.includes(skill.role) && (
                        <option value={skill.role}>{skill.role}</option>
                    )}
                </select>

                <Textarea
                    value={skill.description}
                    onChange={(e) => onFieldChange("description", e.target.value)}
                    placeholder="Some random description will be here"
                    className="min-h-[110px] rounded-[15px] border border-[#828282] px-5 py-4 text-sm text-black focus:border-[#31A7AC] focus:outline-none"
                />
            </div>

            <div className="rounded-[10px]  bg-white px-4 py-3">
                <button
                    type="button"
                    onClick={onToggleExperience}
                    className="flex w-full items-center justify-between rounded-[10px] bg-[#31A7AC] px-4 py-2 text-left text-sm font-medium text-white"
                >
                    Experience
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExperienceOpen ? "rotate-180" : "rotate-0"}`} />
                </button>
                {isExperienceOpen && (
                    <div className="mt-4 space-y-3">
                        {experienceOptions.map((option) => {
                            const selected = skill.experience?.value === option.value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onFieldChange("experience", option)}
                                    className={`w-full rounded-[10px] px-3 py-2 text-left transition ${selected ? "border border-[#31A7AC] bg-[#E7FAFC]" : "border border-transparent hover:border-[#D8D8D8]"}`}
                                >
                                    <p className={`text-sm font-semibold ${selected ? "text-black" : "text-[#181818]"}`}>{option.title}</p>
                                    <p className="text-xs text-[#6B6B6B]">{option.description}</p>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <input
                        value={skill.rate}
                        onChange={(e) => onFieldChange("rate", e.target.value)}
                        placeholder="e.g., AED 1000 per day or USD 500"
                        className="w-full rounded-[15px] border border-[#828282] px-5 py-3 text-sm text-[#444] focus:border-[#31A7AC] focus:outline-none"
                    />
                    <p className="text-xs text-[#6B6B6B] px-2">
                        Include currency code (AED, USD, EUR, etc.) with your rate
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setIsPublic(!isPublic);
                        onFieldChange("isPublic", !isPublic);
                    }}
                    className={`flex w-full items-center gap-3  px-3 py-2 text-left ${isPublic ? '' : ''}`}
                >
                    <span className={`flex h-10 w-10  items-center justify-center rounded-full ${isPublic ? 'bg-[#31A7AC] text-white' : "bg-[#444444] text-white"}`}>
                        <Globe className="h-6 w-6" />
                    </span>
                    <div className={`text-sm font-semibold max-w-[365px] ${isPublic ? 'text-[#31A7AC]' : 'text-[#444444]'}`}>
                        <span>{skill.isPublic ? "Your rate card is Public" : "Your rate card can remain private, but you can still included it when applying for gigs."}</span>
                    </div>
                </button>
            </div>

            {showRemoveButton && (
                <div className="flex justify-center pt-2">
                    <Button
                        onClick={onRemove}
                        variant="outline"
                        className="w-full sm:w-auto px-6 py-2 h-10 rounded-[10px] border-2 border-[#FA6E80] text-[#FA6E80] hover:bg-[#FFF3F5] text-sm font-medium"
                    >
                        Clear Skill
                    </Button>
                </div>
            )}
        </div>
    )
}