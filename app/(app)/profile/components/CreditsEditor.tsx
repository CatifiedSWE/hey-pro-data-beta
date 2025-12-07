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
import { CalendarIcon, Upload, ChevronDownIcon, Edit } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import apiCalling from "@/lib/apiCalling";
import { ImageCropper } from "@/components/ui/image-cropper";

interface CreditsEditorProps {
    trigger: React.ReactNode;
    mode?: 'add' | 'edit';
    creditToEdit?: {
        id: string;
        creditTitle: string;
        description: string;
        startDate: Date | string;
        endDate: Date | string;
        imgUrl?: string;
        productionType?: string;
        role?: string;
        projectTitle?: string;
        brandClient?: string;
        localCompany?: string;
        internationalCompany?: string;
        country?: string;
        releaseYear?: string;
        isUnreleased?: boolean;
        headlineStats?: string;
        awards?: Array<{ title: string; detail?: string }>;
    };
    onUpdate?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
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
export default function CreditsEditor({ trigger, mode = 'add', creditToEdit, onUpdate, open: controlledOpen, onOpenChange }: CreditsEditorProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    
    // Use controlled state if provided, otherwise use internal state
    const isDialogOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsDialogOpen = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open);
        } else {
            setInternalOpen(open);
        }
    };
    const [creditForm, setCreditForm] = useState(defaultCreditForm);
    const [accoladeForm, setAccoladeForm] = useState(defaultAccoladeForm);
    const [startDateOpen, setStartDateOpen] = React.useState(false)
    const [endDateOpen, setEndDateOpen] = React.useState(false)
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
    const [accolades, setAccolades] = React.useState<Accolade[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [saving, setSaving] = useState(false);
    const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string>("");

    useEffect(() => {
        if (isDialogOpen && mode === 'edit' && creditToEdit) {
            // Populate form with credit data for editing
            setCreditForm({
                productionType: creditToEdit.productionType || "",
                role: creditToEdit.role || "",
                projectTitle: creditToEdit.projectTitle || "",
                brandClient: creditToEdit.brandClient || "",
                localCompany: creditToEdit.localCompany || "",
                internationalCompany: creditToEdit.internationalCompany || "",
                country: creditToEdit.country || "",
                releaseYear: creditToEdit.releaseYear || "",
                isUnreleased: creditToEdit.isUnreleased || false,
                startDate: "",
                endDate: "",
                description: creditToEdit.description || "",
                image: creditToEdit.imgUrl || "",
            });

            // Set dates
            if (creditToEdit.startDate) {
                const parsedStartDate = typeof creditToEdit.startDate === 'string' 
                    ? new Date(creditToEdit.startDate) 
                    : creditToEdit.startDate;
                setStartDate(parsedStartDate);
            }
            
            if (creditToEdit.endDate) {
                const parsedEndDate = typeof creditToEdit.endDate === 'string' 
                    ? new Date(creditToEdit.endDate) 
                    : creditToEdit.endDate;
                setEndDate(parsedEndDate);
            }

            // Set accolades/awards
            if (creditToEdit.awards && creditToEdit.awards.length > 0) {
                const mappedAwards = creditToEdit.awards.map((award, index) => {
                    // Parse the award title and detail
                    const titleParts = award.title?.split(' - ') || [];
                    const detailParts = award.detail?.split(' ') || [];
                    return {
                        id: `award-${index}`,
                        type: titleParts[0] || '',
                        category: titleParts[1] || '',
                        by: detailParts.slice(0, -1).join(' ') || '',
                        year: detailParts[detailParts.length - 1] || '',
                    };
                });
                setAccolades(mappedAwards);
            }

            setEditingCreditId(creditToEdit.id);
        } else if (isDialogOpen && mode === 'add') {
            // Reset form for adding new credit
            setCreditForm(defaultCreditForm);
            setStartDate(undefined);
            setEndDate(undefined);
            setAccolades([]);
            setEditingCreditId(null);
        }
    }, [isDialogOpen, mode, creditToEdit]);

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
            // Open cropper with the uploaded image
            setImageToCrop(reader.result as string);
            setCropperOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedImage: string) => {
        handleCreditChange("image", croppedImage);
        toast.success("Image uploaded");
    };

    const handleEditImage = () => {
        if (creditForm.image) {
            setImageToCrop(creditForm.image);
            setCropperOpen(true);
        }
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

    const handleSave = async () => {
        // Validate required fields
        if (!creditForm.productionType || !creditForm.role) {
            toast.error("Please fill in production type and role");
            return;
        }

        if (!startDate) {
            toast.error("Please select a start date");
            return;
        }

        // Prevent multiple simultaneous saves
        if (saving) return;

        setSaving(true);
        try {
            // Format dates
            const formatDate = (date: Date | undefined) => {
                if (!date) return undefined;
                return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            };

            // Prepare credit data according to API specification
            const creditData: any = {
                credit_title: creditForm.projectTitle || `${creditForm.productionType} - ${creditForm.role}`,
                start_date: formatDate(startDate),
                end_date: endDate ? formatDate(endDate) : undefined,
                description: creditForm.description || undefined,
                image_url: creditForm.image || undefined,
                production_type: creditForm.productionType || undefined,
                role: creditForm.role || undefined,
                project_title: creditForm.projectTitle || undefined,
                brand_client: creditForm.brandClient || undefined,
                local_company: creditForm.localCompany || undefined,
                international_company: creditForm.internationalCompany || undefined,
                country: creditForm.country || undefined,
                release_year: creditForm.releaseYear || undefined,
                is_unreleased: creditForm.isUnreleased,
                headline_stats: undefined, // Can be added later if needed
                awards: accolades.length > 0 ? accolades.map(acc => ({
                    title: `${acc.type} - ${acc.category}`,
                    detail: `${acc.by} ${acc.year}`
                })) : undefined
            };

            // Add ID for edit mode
            if (mode === 'edit' && editingCreditId) {
                creditData.id = editingCreditId;
            }

            // Debug: Log data being sent
            console.log('Sending credit data:', JSON.stringify(creditData, null, 2));

            // Call API to create or update credit
            const response = await apiCalling({
                method: mode === 'edit' ? 'patch' : 'post',
                route: '/profile/credits',
                data: creditData
            });

            // Debug: Log response
            console.log('API Response:', response);

            if (response.status) {
                toast.success(mode === 'edit' ? "Credit updated successfully!" : "Credit added successfully!");
                setIsDialogOpen(false);
                
                // Reset form
                setCreditForm(defaultCreditForm);
                setAccoladeForm(defaultAccoladeForm);
                setStartDate(undefined);
                setEndDate(undefined);
                setAccolades([]);
                setEditingCreditId(null);
                
                // Trigger parent update
                onUpdate?.();
            } else {
                // Show more detailed error message
                const errorMsg = response.data?.error || response.message || `Failed to ${mode === 'edit' ? 'update' : 'add'} credit`;
                console.error('API Error:', errorMsg, response.data);
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error saving credit:', error);
            toast.error(`Failed to ${mode === 'edit' ? 'update' : 'add'} credit`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setCreditForm(defaultCreditForm);
        setAccoladeForm(defaultAccoladeForm);
        setStartDate(undefined);
        setEndDate(undefined);
        setAccolades([]);
        setEditingCreditId(null);
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
                    <DialogTitle>{mode === 'edit' ? 'Edit Credit' : 'Add New Credit'}</DialogTitle>
                </VisuallyHidden>
                <div className="px-[30px] pt-[30px] pb-6 flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <section className="flex-1 rounded-[20px] space-y-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-[22px] leading-[34px] font-[400] text-[#211536]">
                                        {mode === 'edit' ? 'Edit Credit' : 'Manage Credits'}
                                    </h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <select
                                        value={creditForm.productionType}
                                        onChange={(e) => handleCreditChange("productionType", e.target.value)}
                                        className={`${baseInputClasses} appearance-none`}
                                    >
                                        <option value="">Production type</option>
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
                                        <option value="">Roles</option>
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
                                        placeholder="Project title"
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

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.localCompany}
                                        onChange={(e) => handleCreditChange("localCompany", e.target.value)}
                                        placeholder="Local Production Company"
                                        className={baseInputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <input
                                        value={creditForm.internationalCompany}
                                        onChange={(e) => handleCreditChange("internationalCompany", e.target.value)}
                                        placeholder="International Production Company"
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
                                                {creditForm.releaseYear || "Release year"}
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
                                        Yet To Be Released
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
                                                        {startDate ? startDate.toLocaleDateString() : "Start date"}
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
                                                        {endDate ? endDate.toLocaleDateString() : "End date"}
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
                                    placeholder="Description"
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
                                        <p className="text-sm text-[#211536] font-medium mb-2">Upload image (Max 5 MB)</p>
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

                        <section className="flex-1 rounded-[20px] text-[#211536] space-y-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-[22px] leading-[34px] font-[400] text-[#211536]">My Accolades</h2>
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
                                            className="w-full justify-start rounded-[15px] h-[41px] border border-[#DCDCDC] bg-[#FBFBFB] px-4 text-sm font-normal text-[#211536]"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-[#9F9F9F]" />
                                            {accoladeForm.year || "Year"}
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
                                    className="border h-[41px] rounded-[15px]"
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
                                            <AccordionTrigger className="flex w-full items-center justify-between py-3 text-left gap-3">
                                                <div className="text-sm text-[#211536] flex flex-row gap-2.5">
                                                    <span className="font-[600]">{award.type || "N/A"}</span>
                                                    <span>-</span>
                                                    <span>{award.category || "N/A"}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4 text-sm text-[#3A3A3A]">
                                                <div className="text-sm text-[#444444] flex flex-row gap-2.5"><span className="font-[600]">Accolade Type </span> <span>{award.type || "N/A"}</span></div>
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
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : (mode === 'edit' ? 'Update Credit' : 'Add Credit')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}