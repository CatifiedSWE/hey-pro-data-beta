/** @format */

"use client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Upload, ChevronDownIcon, Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import React from "react";
interface CreditsEditorProps {
    trigger: React.ReactNode;
    initialCredits?: {
        id: string;
        creditTitle: string;
        description: string;
        startDate: Date;
        endDate: Date;
        imgUrl?: string;
    }[];
}

const defaultCreditForm = {
    productionType: "",
    role: "",
    projectTitle: "",
    brandClient: "",
    localCompany: "",
    internationalCompany: "",
    country: "",
    releaseYear: "",
    isUnreleased: false,
    startDate: "",
    endDate: "",
    description: "",
    image: "",
};

const defaultAccoladeForm = {
    type: "",
    category: "",
    by: "",
    year: "",
    awardGroup: "",
    date: "",
};

const PRODUCTION_TYPES = [
    "Audio Production",
    "Animation",
    "Commercial",
    "Corporate Video",
    "Docuseries",
    "Documentary",
    "Educational Video",
    "Training Video",
    "Experimental Film",
    "Feature Film",
    "Fashion Show",
    "Live Event",
    "Micro Film",
    "Music Video",
    "Online Content",
    "Promotional Video",
    "Trailers",
    "Reality TV",
    "Competition Show",
    "Short Film",
    "Short-form Social Media Content (TikTok, Reels, Shorts)",
    "Stage Production",
    "Student Film",
    "TV",
    "VFX Project",
    "Web Series",
];

const ROLES_BY_CATEGORY = [
    {
        category: "Direction",
        roles: [
            "Director",
            "Director | Commercial",
            "Assistant Director",
            "Assistant Director | TV",
            "1st Assistant Director (1st AD)",
            "2nd Assistant Director (2nd AD)",
            "3rd Assistant Director (3rd AD)",
            "Action Director",
        ],
    },
    {
        category: "Production",
        roles: [
            "Line Producer",
            "Producer",
            "Producer | Creative",
            "Producer | Executive",
            "Producer | Senior",
            "Associate Producer",
            "Assistant Producer",
            "Program Producer",
            "Project Coordinator",
            "Project Manager",
            "Operation Manager",
            "Production",
            "Production Manager",
            "Production Coordinator",
            "Production Consultant",
            "Production Assistant",
            "Production Runner",
            "Show Runner",
            "Show Caller",
            "Stage Manager",
        ],
    },
    {
        category: "Camera",
        roles: [
            "DOP",
            "DOP | Assistant",
            "DOP | Associate",
            "Camera Operator",
            "Camera Operator | Remote Head",
            "Camera Operator | Steadicam",
            "Camera Operator | Trinity 2",
            "Camera Assistant",
            "Camera Assistant | Junior",
            "Camera Trainee",
            "2nd AC",
            "Drone",
            "Aerial Filming",
            "DIT",
            "Data Wrangler",
            "Qtake Assistant",
            "Video Assist",
            "Video Assist | Streaming",
            "Video Assist | Utility",
            "Video Streaming",
            "Video Technician",
        ],
    },
    {
        category: "Lighting",
        roles: ["Gaffer"],
    },
    {
        category: "Grip",
        roles: ["Grip"],
    },
    {
        category: "Art",
        roles: [
            "Art Director",
            "Art PA",
            "Production Designer",
            "Set Design | Production Design Assistant",
            "Set Dresser",
        ],
    },
    {
        category: "Wardrobe",
        roles: [
            "Costume Designer",
            "Wardrobe Stylist",
            "Wardrobe Stylist | Avant-Garde",
            "Wardrobe Supervisor",
            "Wardrobe PA",
            "Fashion Stylist",
            "Fashion Stylist | Assistant",
            "Fashion Assistant | Celebrity",
        ],
    },
    {
        category: "Hair",
        roles: ["Hair Stylist"],
    },
    {
        category: "Makeup",
        roles: [
            "Makeup Artist",
            "Makeup Artist | SFX",
            "Makeup Artist | Body Painter",
            "Makeup Artist | Face Painter",
            "Image Consultant",
        ],
    },
    {
        category: "Casting",
        roles: [
            "Casting",
            "Casting Director",
            "Artist Liaison",
            "Model Agent",
            "Talent Manager",
        ],
    },
    {
        category: "Stunts",
        roles: ["Fight Choreographer"],
    },
    {
        category: "Post-Production",
        roles: [
            "Editor",
            "Editor | Offline",
            "Editor | Senior",
            "Colorist",
            "Post Producer",
            "Post Production Coordinator",
        ],
    },
    {
        category: "Animation",
        roles: [
            "Animator",
            "2D Animation",
            "3D Animation",
            "AI Video AD Creator",
        ],
    },
    {
        category: "VFX",
        roles: [
            "VFX",
            "VFX Artist",
            "VFX Coordinator",
        ],
    },
    {
        category: "Design",
        roles: [
            "Graphic Designer",
            "Infographics",
            "Storyboarding",
        ],
    },
    {
        category: "Sound",
        roles: [
            "Sound Engineer",
            "Sound Mixer",
            "Sound | Boom Pole Operator",
            "Sound | Field Sound Mixer",
            "Music Composer",
        ],
    },
    {
        category: "Locations",
        roles: [
            "Location Manager",
            "Location Assistant",
            "Location PA",
        ],
    },
    {
        category: "SFX",
        roles: ["SFX Selection"],
    },
    {
        category: "Photography",
        roles: [
            "Photographer",
            "Photographer | Aerial",
            "Photographer | BTS",
        ],
    },
    {
        category: "Videography",
        roles: [
            "Videographer",
            "Videographer | BTS",
        ],
    },
    {
        category: "Writing",
        roles: [
            "Novelist",
            "Screenwriter",
            "Scriptwriter",
            "Script Supervisor",
            "Writer | Horror",
            "Writer | Non-Fiction",
            "Writer | Young Adult Fiction",
        ],
    },
    {
        category: "Media & Content",
        roles: [
            "Content Creator",
            "Media Consultant",
            "Prompt Alchemist",
            "Spreadsheet Whisperer",
        ],
    },
    {
        category: "Sustainability",
        roles: [
            "Sustainable Film Advisor",
            "Sustainable On Set Coordinator",
        ],
    },
    {
        category: "Transport & Logistics",
        roles: [
            "Logistics Manager",
            "Transport Event Materials",
        ],
    },
    {
        category: "Events",
        roles: [
            "Event Manager",
            "Event Organizer",
            "Fashion Show Director",
            "Fashion Backstage Director",
        ],
    },
];

interface YearPickerProps {
    value: string;
    onChange: (year: string) => void;
    fromYear?: number;
    toYear?: number;
}

function YearPicker({ value, onChange, fromYear = 1980, toYear = new Date().getFullYear() + 5 }: YearPickerProps) {
    const years = useMemo(() => {
        const list: number[] = [];
        for (let year = toYear; year >= fromYear; year -= 1) {
            list.push(year);
        }
        return list;
    }, [fromYear, toYear]);

    return (
        <div className="grid grid-cols-3 gap-2 p-3">
            {years.map((year) => (
                <button
                    type="button"
                    key={year}
                    onClick={() => onChange(year.toString())}
                    className={`rounded-[10px] border px-3 py-2 text-sm font-medium transition-colors ${value === year.toString()
                        ? "border-[#31A7AC] bg-[#E6FFFE] text-[#0C4A4F]"
                        : "border-[#E4E4E7] text-[#211536] hover:border-[#31A7AC]"
                        }`}
                >
                    {year}
                </button>
            ))}
        </div>
    );
}
interface Accolade {
    id: string;
    type: string;
    category: string;
    by: string;
    year: string;
}
export default function CreditsEditor({ trigger, initialCredits }: CreditsEditorProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creditForm, setCreditForm] = useState(defaultCreditForm);
    const [accoladeForm, setAccoladeForm] = useState(defaultAccoladeForm);
    const [startDateOpen, setStartDateOpen] = React.useState(false)
    const [endDateOpen, setEndDateOpen] = React.useState(false)
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
    const [open, setOpen] = useState(false);
    const [accolades, setAccolades] = React.useState<Accolade[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isDialogOpen && initialCredits?.length) {
            const first = initialCredits[0];
            setCreditForm((prev) => ({
                ...prev,
                productionType: prev.productionType || "Feature Film",
                role: prev.role || "Director",
                projectTitle: first.creditTitle || "",
                description: first.description || "",
            }));
        }
    }, [isDialogOpen, initialCredits]);

    const handleCreditChange = (field: keyof typeof creditForm, value: string | boolean) => {
        setCreditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAccoladeChange = (field: keyof typeof accoladeForm, value: string) => {
        setAccoladeForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            handleCreditChange("image", reader.result as string);
            toast.success("Image uploaded");
        };
        reader.readAsDataURL(file);
    };
    useEffect(() => {
        setOpen(false);
    }, [accoladeForm]);
    const handelOpenChange = () => {
        setOpen(!open);
    };
    const handleAddAward = () => {
        if (!accoladeForm.type || !accoladeForm.category) {
            toast.error("Please fill at least type and category");
            return;
        }
        const newAward = {
            id: Date.now().toString(),
            type: accoladeForm.type,
            category: accoladeForm.category,
            by: accoladeForm.by || "Unknown",
            year: accoladeForm.year || "--",
        };
        setAccolades((prev) => [...prev, newAward]);
        setAccoladeForm(defaultAccoladeForm);
        toast.success("Award added");
    };

    const handleSave = () => {
        console.log("Credit form", creditForm);
        console.log("Accolades", accolades);
        toast.success("Credits saved");
        setIsDialogOpen(false);
    };

    const handleCancel = () => {
        setCreditForm(defaultCreditForm);
        setAccoladeForm(defaultAccoladeForm);
        setIsDialogOpen(false);
    };

    const baseInputClasses =
        "w-full h-[41px] rounded-[15px] border border-[#828282] bg-white px-5 text-sm text-[#211536] placeholder:text-[#A3A3A3] focus-visible:outline-[#31A7AC]";


    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                className="w-full border border-[#EFEFEF] rounded-[15px] p-0 overflow-x-auto sm:max-w-[65rem] h-[80vh]"
            >
                <VisuallyHidden>
                    <DialogTitle>Manage Credits</DialogTitle>
                </VisuallyHidden>
                <div className="px-[30px] pt-[30px] pb-6 flex flex-col gap-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-[20px] leading-[34px] font-[400]  text-[#211536]">Manage Credits</h2>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <section className=" rounded-[20px] p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <select
                                        value={creditForm.productionType}
                                        onChange={(e) => handleCreditChange("productionType", e.target.value)}
                                        className={`${baseInputClasses} appearance-none`}
                                    >
                                        <option value="">Select type</option>
                                        <option value="Feature Film">Feature Film</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Music Video">Music Video</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <select
                                        value={creditForm.role}
                                        onChange={(e) => handleCreditChange("role", e.target.value)}
                                        className={`${baseInputClasses} appearance-none`}
                                    >
                                        <option value="">Select Role</option>
                                        <option value="Feature Film">Feature Film</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Music Video">Music Video</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.projectTitle}
                                        onChange={(e) => handleCreditChange("projectTitle", e.target.value)}
                                        placeholder="City of Echoes"
                                        className={baseInputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.brandClient}
                                        onChange={(e) => handleCreditChange("brandClient", e.target.value)}
                                        placeholder="Brand/Client"
                                        className={baseInputClasses}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1  gap-4">
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.localCompany}
                                        onChange={(e) => handleCreditChange("localCompany", e.target.value)}
                                        placeholder="Local Production company"
                                        className={baseInputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.internationalCompany}
                                        onChange={(e) => handleCreditChange("internationalCompany", e.target.value)}
                                        placeholder="International Production company"
                                        className={baseInputClasses}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.country}
                                        onChange={(e) => handleCreditChange("country", e.target.value)}
                                        placeholder="Country"
                                        className={baseInputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-[41px] rounded-[15px] border border-[#828282] bg-white px-5 text-sm font-normal text-[#211536]"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-[#9F9F9F]" />
                                                {creditForm.releaseYear || "Select year"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-[260px] bg-white p-2">
                                            <ScrollArea className="h-64">
                                                <YearPicker
                                                    value={creditForm.releaseYear}
                                                    onChange={(year) => {
                                                        handleCreditChange("releaseYear", year);
                                                    }}
                                                    fromYear={1970}
                                                    toYear={new Date().getFullYear() + 2}
                                                />
                                            </ScrollArea>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs text-[#494949] font-medium">
                                        <Checkbox
                                            checked={creditForm.isUnreleased}
                                            onCheckedChange={(checked) => handleCreditChange("isUnreleased", checked)}
                                            className="h-[20px] w-[20px] rounded-[3px] border-[#828282] text-[#211536] focus:ring-[#211536]"
                                        />
                                        Yet to be released
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen} >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    id="date"
                                                    className="w-[200px] rounded-[15px] h-[38px] justify-between font-normal border border-[#828282]"
                                                >
                                                    <span className="text-[#494949]">
                                                        {startDate ? startDate.toLocaleDateString() : "Select date"}
                                                    </span>

                                                    <ChevronDownIcon className="h-4 w-4 text-[#9F9F9F]" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        setStartDate(date)
                                                        setStartDateOpen(false)
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    id="date"
                                                    className="w-[200px] justify-between rounded-[15px] h-[38px] font-normal border border-[#828282]"
                                                >
                                                    <span className="text-[#494949]">
                                                        {endDate ? endDate.toLocaleDateString() : "Select date"}
                                                    </span>
                                                    <ChevronDownIcon className="h-4 w-4 text-[#9F9F9F]" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={endDate}
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        setEndDate(date)
                                                        setEndDateOpen(false)
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <textarea
                                    value={creditForm.description}
                                    onChange={(e) => handleCreditChange("description", e.target.value)}
                                    placeholder="Write about this project..."
                                    className="w-full min-h-[104px] rounded-[20px] border border-[#828282] bg-white px-5 py-3 text-sm text-[#211536] placeholder:text-[#A3A3A3] focus-visible:outline-[#31A7AC]"
                                />
                            </div>

                            <div className="space-y-3">
                                {creditForm.image ? (
                                    <div className="relative rounded-[20px] overflow-hidden border border-[#E5E5E5]">
                                        <Image
                                            src={creditForm.image}
                                            alt="Credit artwork"
                                            className="w-full h-48 object-cover"
                                            height={100}
                                            width={100}
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-white text-[#211536] hover:bg-white/90"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="h-4 w-4 mr-2" /> Replace image
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleCreditChange("image", "")}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[20px] border border-dashed border-[#31A7AC] bg-white/80 px-6 py-8 text-center">
                                        <p className="text-sm text-[#211536] font-medium mb-2">Upload artwork / press stills</p>
                                        <p className="text-xs text-[#8D8D8D] mb-4">PNG, JPG up to 5MB</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full border-[#31A7AC] text-[#31A7AC] px-5"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="h-4 w-4 mr-2" /> Upload image
                                        </Button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </section>

                        <div className="hidden lg:block w-px bg-gradient-to-b from-[#31A7AC] via-[#FA6E80] to-[#F8B661] rounded-full" aria-hidden />

                        <section className="flex-1 rounded-[20px] bg-white text-[#211536] p-6 space-y-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[22px] text-[#000000]">My Accolades</p>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-3">
                                    <select
                                        value={accoladeForm.type}
                                        onChange={(e) => handleAccoladeChange("type", e.target.value)}
                                        className="w-full h-[41px] rounded-[15px] border border-[#DCDCDC] bg-[#FBFBFB] px-4 font-[400] text-sm text-[#211536] placeholder:text-[#9F9F9F] focus-visible:outline-[#31A7AC]"
                                    >
                                        <option value="">Accolade Type</option>
                                        <option value="Best Director">Best Director</option>
                                        <option value="Best Cinematography">Best Cinematography</option>
                                        <option value="Best Screenplay">Best Screenplay</option>
                                        <option value="Best Editing">Best Editing</option>
                                        <option value="Best Visual Effects">Best Visual Effects</option>
                                        <option value="Best Sound Design">Best Sound Design</option>
                                        <option value="Best Production Design">Best Production Design</option>
                                        <option value="Best Original Score">Best Original Score</option>
                                        <option value="Best Actor">Best Actor</option>
                                        <option value="Best Actress">Best Actress</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        value={accoladeForm.category}
                                        onChange={(e) => handleAccoladeChange("category", e.target.value)}
                                        placeholder="Accolade Category"
                                        className="w-full h-[41px] rounded-[15px] border border-[#DCDCDC] bg-[#FBFBFB] px-4 text-sm text-[#211536] placeholder:text-[#9F9F9F] focus-visible:outline-[#31A7AC]"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <input
                                        value={accoladeForm.by}
                                        onChange={(e) => handleAccoladeChange("by", e.target.value)}
                                        placeholder="Accolade by:"
                                        className="w-full h-[41px] rounded-[15px] border border-[#DCDCDC] bg-[#FBFBFB] px-4 text-sm text-[#211536] placeholder:text-[#9F9F9F] focus-visible:outline-[#31A7AC]"
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start rounded-[15px] h-[41px] border border-[#828282] bg-white px-5 text-sm font-normal text-[#211536]"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-[#9F9F9F]" />
                                            {accoladeForm.year || "Select year"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[260px] bg-white p-2">
                                        <ScrollArea className="h-64">
                                            <YearPicker
                                                value={accoladeForm.year}
                                                onChange={(year) => {
                                                    handleAccoladeChange("year", year);
                                                }}
                                                fromYear={1970}
                                                toYear={new Date().getFullYear() + 2}

                                            />
                                        </ScrollArea>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    onClick={handleAddAward}
                                    size="sm"
                                    className="border h-[41px] rounded-[15px] "
                                    variant="default"
                                >
                                    Add new award
                                </Button>
                            </div>
                            <div className="h-px w-full bg-gradient-to-b from-[#31A7AC] via-[#FA6E80] to-[#F8B661] rounded-full" aria-hidden />


                            <Accordion type="multiple" className="space-y-3">
                                {accolades.length > 0 && (
                                    accolades.map((award) => (
                                        <AccordionItem value={award.id} key={award.id} className="border border-[#E3E3E3] rounded-[18px] px-4">
                                            <AccordionTrigger className="flex w-full items-center justify-between py-3 text-left gap-3" onClick={handelOpenChange}>
                                                <div className="text-sm text-[#211536] flex flex-row gap-2.5 transition-opacity duration-200 data-[state=open]:opacity-0 data-[state=open]:pointer-events-none">
                                                    {open && <span>{` ${award.type}` || "N/A"}</span>}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4 text-sm text-[#3A3A3A]">
                                                <div className="text-sm text-[#444444] flex flex-row gap-2.5"><span className="font-[600]">Accolade Type </span> <span>{` ${award.type}` || "N/A"}</span></div>
                                                <div className="text-sm text-[#444444] flex flex-row gap-2.5 font-[600]">Accolade Category <span className="font-[400]">{award.category || "N/A"}</span></div>
                                                <div className="text-sm text-[#444444] flex flex-row gap-2.5 font-[600] ">Accolade by <span className="font-[400]">{award.by || "Unknown presenter"}</span></div>
                                                <div className="text-sm text-[#444444] flex flex-row gap-2.5 font-[600]">Year <span className="font-[400]">{award.year || "--"}</span></div>

                                            </AccordionContent>
                                        </AccordionItem>
                                    ))
                                )
                                }
                            </Accordion>
                        </section>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-[30px] py-4 border-t bg-[#FDFDFD]">
                    <Button
                        variant="outline"
                        className="rounded-[15px] h-[47px] border-[#FA6E80] text-[#FA6E80] px-8"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="rounded-[15px] h-[47px] px-8"
                        onClick={handleSave}
                    >
                        Save changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
