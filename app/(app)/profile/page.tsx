"use client"

import { Edit, List, GripVertical, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import React, { useState, useRef, useEffect, useMemo } from "react";
import AboutSectionComponent from "./components/About";
import AddLanguageSection from "./components/Language";
import WhatupNumbers from "./components/WhatAppNumber";
import AvalableCountryForTravel from "./components/AvalableCountryForTravel";
import SkillEditor from "@/app/(app)/profile/components/SkillEditor";
import { Button } from "@/components/ui/button";
import ShortProfile from "./components/ShortProfiel";
import Highlights from "./components/Highlights";
import CreditsSection from "./components/CreditView";
import ResumePortfolio from "./components/ResumePortfolio";
import SlateView from "./components/slate";
import AddNewSkill from "./components/add-new-skill";
import { useProfile, ProfileData } from "@/contexts/ProfileContext";
import { toast } from "sonner";
import ProfileSkeleton from "./components/ProfileSkeleton";

type SectionType = "about" | "skills" | "credits"

// Extended profile type to include additional fields not in the base ProfileData
interface ExtendedProfileData extends ProfileData {
  persionalDetails?: {
    availability?: string;
  };
  language?: Array<{ code: string; name: string; proficiency?: string }>;
  countryCode?: string;
  phoneNumber?: string;
  AvailableCountriesForTravel?: string[];
  skills?: Array<{
    id: string;
    department: string;
    role: string;
    description: string;
    experience?: {
      value: string;
      title: string;
      description: string;
    };
  }>;
}


export default function Profile() {
  // ALL HOOKS MUST BE CALLED AT THE TOP BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState<"profile" | "slate">("profile")
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  // Updated section order to match design (no separate recommendations section)
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(["about", "skills", "credits"])
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false)
  
  // Use the profile hook for real data
  const { profile, links, recommendations, roles, skills, visa, loading, error, uploadPhoto, refetch, fetchLinks, fetchRecommendations, addRole, deleteRole, fetchSkills } = useProfile();

  // Drag and drop sensors - MUST be called before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (scrollOffset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    handleScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoize section components to prevent unnecessary re-creation and unmounting
  // MUST be before conditional returns to maintain hook call order
  const sectionComponents = useMemo(() => ({
    about: <AboutSection key="about" bio={profile?.bio || ''} onUpdate={refetch} />,
    skills: <SkillsSectionWrapper key="skills" skills={skills} onUpdate={fetchSkills} />,
    credits: <CreditsSection key="credits" />,
    // Recommendations removed from main sections as per design
  }), [profile?.bio, skills, fetchSkills, refetch]);

  // Non-hook data and functions
  const handlePhotoUpload = async (file: File, type: 'profile' | 'banner') => {
    const result = await uploadPhoto(file, type);
    if (!result.success) {
      toast.error(result.message || 'Failed to upload photo');
    }
    return result;
  };

  // Helper function to parse phone number
  const parsePhoneNumber = (phone?: string, storedCountryCode?: string) => {
    if (!phone) return { countryCode: undefined, phoneNumber: undefined };
    
    // If we have a stored country code, use it to parse the phone number
    if (storedCountryCode && phone.startsWith(storedCountryCode)) {
      return {
        countryCode: storedCountryCode,
        phoneNumber: phone.substring(storedCountryCode.length).replace(/\D/g, '')
      };
    }
    
    // Fallback: Match pattern with non-greedy regex for country code
    const match = phone.match(/^(\+\d{1,3}?)(\d+)$/);
    if (match) {
      return {
        countryCode: match[1], // e.g., "+971"
        phoneNumber: match[2].replace(/\D/g, '') // Remove any non-digit characters from the number part
      };
    }
    
    // If no match, return the full phone as number
    return {
      countryCode: undefined,
      phoneNumber: phone.replace(/\D/g, '')
    };
  };

  // Show loading state - AFTER all hooks are called
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Show error state - AFTER all hooks are called
  if (error) {
    return (
      <section className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-3 xs:px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12 pt-6 pb-20">
        <div className="flex w-full max-w-[600px] flex-col space-y-4">
          <div className="text-center p-8">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as SectionType)
        const newIndex = items.indexOf(over.id as SectionType)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <section className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-3 xs:px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12 pt-6 pb-20">
      <main className="flex w-full max-w-[600px] flex-col space-y-4">
        <ShortProfile 
            profile={profile} 
            links={links} 
            roles={roles} 
            visa={visa}
            recommendations={recommendations}
            onPhotoUpload={handlePhotoUpload} 
            onLinksUpdate={fetchLinks} 
        />
        {/* Separator line hidden */}
        {/* <div className="w-full bg-slate-200 h-px sm:h-[1px] mb-5" /> */}

        <div className="space-y-2 mx-auto w-full">
          {/* Profile/Slate Tabs hidden */}
          <div className="hidden flex-row gap-3 sm:gap-6 text-black mb-6 sm:mb-8">
            <Button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 min-h-[44px] text-sm sm:text-base font-semibold rounded-[12px] sm:rounded-[15px] ${activeTab === "profile"
                ? "bg-[#FA6E80] text-white hover:bg-[#FA6E80] hover:text-white hover:opacity-100"
                : "bg-[#f3f4f6] shadow-sm text-foreground hover:bg-[#f3f4f6] hover:text-foreground hover:opacity-100"
                }`}
            >
              Profile
            </Button>
            <Button
              onClick={() => setActiveTab("slate")}
              className={`flex-1 min-h-[44px] text-sm sm:text-base font-semibold rounded-[12px] sm:rounded-[15px] ${activeTab === "slate"
                ? "bg-[#FA6E80] text-white hover:bg-[#FA6E80] hover:text-white hover:opacity-100"
                : "bg-[#ffffff] shadow-sm text-foreground hover:bg-[#ffffff] hover:text-foreground hover:opacity-100"
                }`}
            >
              Slate
            </Button>
          </div>

          {activeTab === "profile" ? (
            <div className=" max-w-[600px]">
              <div className="relative">
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex flex-row overflow-x-auto gap-x-4 mb-6 sm:mb-7 scrollbar-hide -mx-2 xs:-mx-1 sm:mx-0 px-2 xs:px-1 sm:px-0"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex-none ">
                    <AboutSectionComponent title="About" about={profile?.bio || ''} onUpdate={refetch} />
                  </div>
                  
                  {/* Removed VisaSection, WorkStatusSection, RoleDialog from here as they are moved to ProfileEdit */}

                  <div className="flex-none ">
                    <AddLanguageSection languages={(profile as ExtendedProfileData)?.language || []} />
                  </div>
                  <div className="flex-none ">
                    <WhatupNumbers
                      countryCode={parsePhoneNumber(profile?.phone, profile?.country_code).countryCode}
                      phoneNumber={parsePhoneNumber(profile?.phone, profile?.country_code).phoneNumber}
                      email={profile?.email}
                    />
                  </div>
                  
                  <div className="flex-none ">
                    <AvalableCountryForTravel availableCountries={(profile as ExtendedProfileData)?.AvailableCountriesForTravel || []} />
                  </div>
                </div>
                {showLeftArrow && (
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute sm:flex hidden left-1 sm:left-0 top-1/2 -translate-y-1/2 transform bg-[#FA6E80] rounded-full shadow-md z-10"
                    onClick={() => scroll(-200)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                {showRightArrow && (
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute sm:flex hidden right-1 sm:right-0 top-1/2 -translate-y-1/2 transform bg-[#FA6E80] rounded-full shadow-md z-10"
                    onClick={() => scroll(200)}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>

              <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full gap-2 rounded-full border-[#31A7AC] bg-white text-sm text-[#31A7AC] sm:w-auto sm:text-base"
                  >
                    <List className="h-5 w-5" />
                    Reorder sections
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md w-[90vw] sm:w-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-bold">Reorder Sections</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {sectionOrder.map((section) => (
                            <SortableItem key={section} id={section} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                    <Button
                      onClick={() => setIsReorderDialogOpen(false)}
                      className="bg-coral-500 hover:bg-coral-600 w-full sm:w-auto"
                    >
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Highlights Section - Shows on mobile, positioned above about/skills/credits */}
              <div className="lg:hidden mb-8">
                <Highlights />
              </div>
              
              <div className="my-8" />
              {sectionOrder.map((section, index) => (
                <div key={section}>
                  {sectionComponents[section]}
                  {index < sectionOrder.length - 1 && <div className="my-8" />}
                </div>
              ))}
            </div>
          ) : (
            <SlateView />
          )}
        </div>
      </main>
      {/* Highlights Section - Shows on desktop as sidebar */}
      <div className="hidden lg:block w-full max-w-[336px]">
        <Highlights />
      </div>
    </section>
  )
}

function SkillItem({ 
  id,
  department, 
  role, 
  description, 
  experience,
  onEdit 
}: { 
  id: string;
  department: string; 
  role: string; 
  description?: string; 
  experience?: { value: string; title: string; description: string; };
  onEdit?: () => void;
}) {
  return (
    <div className="space-y-2 group relative">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-[400] text-[#000] sm:text-lg flex-1">{department} <span className="text-5xl">.</span> {role}</h3>
        {onEdit && (
          <Button
            onClick={onEdit}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-[#31A7AC] hover:bg-[#E7FAFC]"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      {description && <p className="text-sm leading-relaxed text-[#444444]">{description}</p>}
      {experience && (
        <div className="space-y-2 ml-10 ">
          <div className="flex flex-wrap items-center justify-start gap-x-1 px-4 bg-[#FFFFFF] h-[31px] w-[233px] rounded-[5px]">
            <h4 className="text-sm font-[600] text-[#000]">{experience.title}</h4>
            <p className="text-[10px] leading-relaxed text-[#444444]">{experience.description}</p>

          </div>
        </div>
      )}
    </div>
  )
}



function SortableItem({ id }: { id: SectionType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const sectionNames = {
    about: "About",
    skills: "Skills",
    credits: "Credits",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 sm:p-4 bg-secondary/50 rounded-lg border border-border hover:bg-secondary cursor-move"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground" />
      <span className="font-medium text-sm sm:text-base">{sectionNames[id]}</span>
    </div>
  )
}

function AboutSection({ bio, onUpdate }: { bio: string; onUpdate: () => void }) {
  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">About</h2>
        <AboutSectionComponent 
          title="About" 
          about={bio}
          onUpdate={onUpdate}
          trigger={
            <Button size="icon" variant="ghost" className="rounded-full border border-[#31A7AC]/30 bg-white text-[#31A7AC] hover:bg-white">
              <Edit className="h-5 w-5" />
            </Button>
          }
        />
      </div>
      <div className="space-y-4 text-sm leading-[21px] text-[#181818] sm:text-base">
        {bio}
      </div>
    </div>
  )
}

function SkillsSectionWrapper({ skills, onUpdate }: { skills: any[]; onUpdate: () => void }) {
  // If skills is empty, show a placeholder
  if (!skills || skills.length === 0) {
    return (
      <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Skills</h2>
          <div className="flex gap-1.5">
            <AddNewSkill
              onUpdate={onUpdate}
              trigger={
                <Button size="icon" variant="default" className="rounded-full border border-[#31A7AC]/30 bg-[#FA6E80] text-[#ffffff]">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              }
            />
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Showcase your skills by adding one</p>
        </div>
      </div>
    );
  }

  // Transform skills data from API format to UI format
  const transformedSkills = skills.map(skill => ({
    id: skill.id,
    department: skill.department || 'General',
    role: skill.skill_name,
    description: skill.description || '',
    experience: skill.experience_level ? {
      value: skill.experience_level,
      title: skill.experience_level,
      description: ''
    } : undefined
  }));

  return <SkillsSection skills={transformedSkills} onUpdate={onUpdate} />;
}

function SkillsSection({ skills, onUpdate }: { skills: { id: string, department: string, role: string, description: string, experience?: { value: string; title: string; description: string; } }[]; onUpdate: () => void }) {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleEditSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    setIsEditorOpen(true);
  };

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Skills</h2>
        <div className="flex gap-1.5">
          <AddNewSkill
            onUpdate={onUpdate}
            trigger={
              <Button size="icon" variant="default" className="rounded-full border border-[#31A7AC]/30 bg-[#FA6E80] text-[#ffffff]">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            }
          />
          <SkillEditor
            initialSkills={skills}
            onUpdate={onUpdate}
            initialSelectedSkillId={selectedSkillId}
            isOpen={isEditorOpen}
            onOpenChange={setIsEditorOpen}
            trigger={
              <Button size="icon" variant="default" className="rounded-full border border-[#31A7AC]/30 bg-[#31A7AC] text-[#ffffff]">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            }
          />

        </div>
      </div>
      <div className="space-y-4">
        {skills.map((skill, index) => (
          <SkillItem 
            key={skill.id || index} 
            id={skill.id}
            department={skill.department} 
            role={skill.role} 
            description={skill.description} 
            experience={skill.experience}
            onEdit={() => handleEditSkill(skill.id)}
          />
        ))}
      </div>
    </div>
  )
}
