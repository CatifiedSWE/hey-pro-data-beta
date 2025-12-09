"use client";
import { ChevronDown, ChevronUp, Filter, Search, MapPin, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";

const toSlug = (s: string) =>
    s
        .toLowerCase()
        .replace(/[\|\(\)]/g, "") // remove | and parentheses
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

type FilterValue = { label: string; href: string };
type FilterOption = { label: string; value: FilterValue[] };

const makeValues = (arr: string[]): FilterValue[] =>
    arr.map(label => ({ label, href: `/crew?role=${encodeURIComponent(label)}` })); 

const filterOptions: FilterOption[] = [
    {
        label: "Animation",
        value: makeValues([
            "Animator",
            "2D Animation",
            "3D Animation",
            "AI Video AD Creator"
        ])
    },
    {
        label: "Art",
        value: makeValues([
            "Art Director",
            "Art PA",
            "Production Designer",
            "Set Design | Production Design Assistant",
            "Set Dresser"
        ])
    },
    {
        label: "Camera",
        value: makeValues([
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
            "Video Technician"
        ])
    },
    {
        label: "Casting",
        value: makeValues([
            "Casting",
            "Casting Director",
            "Artist Liaison",
            "Model Agent",
            "Talent Manager"
        ])
    },
    {
        label: "Design",
        value: makeValues([
            "Graphic Designer",
            "Infographics",
            "Storyboarding"
        ])
    },
    {
        label: "Direction",
        value: makeValues([
            "Director",
            "Director | Commercial",
            "Assistant Director",
            "Assistant Director | TV",
            "1st Assistant Director (1st AD)",
            "2nd Assistant Director (2nd AD)",
            "3rd Assistant Director (3rd AD)",
            "Action Director"
        ])
    },
    {
        label: "Events",
        value: makeValues([
            "Event Manager",
            "Event Organizer",
            "Fashion Show Director",
            "Fashion Backstage Director"
        ])
    },
    {
        label: "Grip",
        value: makeValues([
            "Grip"
        ])
    },
    {
        label: "Hair",
        value: makeValues([
            "Hair Stylist"
        ])
    },
    {
        label: "Lighting",
        value: makeValues([
            "Gaffer"
        ])
    },
    {
        label: "Locations",
        value: makeValues([
            "Location Manager",
            "Location Assistant",
            "Location PA"
        ])
    },
    {
        label: "Makeup",
        value: makeValues([
            "Makeup Artist",
            "Makeup Artist | SFX",
            "Makeup Artist | Body Painter",
            "Makeup Artist | Face Painter",
            "Image Consultant"
        ])
    },
    {
        label: "Media & Content",
        value: makeValues([
            "Content Creator",
            "Media Consultant",
            "Prompt Alchemist",
            "Spreadsheet Whisperer"
        ])
    },
    {
        label: "Photography",
        value: makeValues([
            "Photographer",
            "Photographer | Aerial",
            "Photographer | BTS"
        ])
    },
    {
        label: "Post-Production",
        value: makeValues([
            "Editor",
            "Editor | Offline",
            "Editor | Senior",
            "Colorist",
            "Post Producer",
            "Post Production Coordinator"
        ])
    },
    {
        label: "Production",
        value: makeValues([
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
            "Stage Manager"
        ])
    },
    {
        label: "SFX",
        value: makeValues([
            "SFX Selection"
        ])
    },
    {
        label: "Sound",
        value: makeValues([
            "Sound Engineer",
            "Sound Mixer",
            "Sound | Boom Pole Operator",
            "Sound | Field Sound Mixer",
            "Music Composer"
        ])
    },
    {
        label: "Stunts",
        value: makeValues([
            "Fight Choreographer"
        ])
    },
    {
        label: "Sustainability",
        value: makeValues([
            "Sustainable Film Advisor",
            "Sustainable On Set Coordinator"
        ])
    },
    {
        label: "Transport & Logistics",
        value: makeValues([
            "Logistics Manager",
            "Transport Event Materials"
        ])
    },
    {
        label: "VFX",
        value: makeValues([
            "VFX",
            "VFX Artist",
            "VFX Coordinator"
        ])
    },
    {
        label: "Videography",
        value: makeValues([
            "Videographer",
            "Videographer | BTS"
        ])
    },
    {
        label: "Wardrobe",
        value: makeValues([
            "Costume Designer",
            "Wardrobe Stylist",
            "Wardrobe Stylist | Avant-Garde",
            "Wardrobe Supervisor",
            "Wardrobe PA",
            "Fashion Stylist",
            "Fashion Stylist | Assistant",
            "Fashion Assistant | Celebrity"
        ])
    },
    {
        label: "Writing",
        value: makeValues([
            "Novelist",
            "Screenwriter",
            "Scriptwriter",
            "Script Supervisor",
            "Writer | Horror",
            "Writer | Non-Fiction",
            "Writer | Young Adult Fiction"
        ])
    }
];

const experienceOptions = [
    { title: "Intern", description: "helped on set, shadowed role" },
    { title: "Learning | Assisted", description: "assisted the role under supervision" },
    { title: "Competent | Independent", description: "can handle role solo" },
    { title: "Expert | Lead", description: "leads team, multiple projects" },
];

const initialFilterState = {
    keyword: "",
    availability: "",
    productionType: "",
    location: "",
    experience: "",
    minRate: 0,
    maxRate: 5000,
};

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [filterForm, setFilterForm] = React.useState<typeof initialFilterState>(initialFilterState);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [activeFilterCount, setActiveFilterCount] = React.useState(0);
    const [activeRole, setActiveRole] = React.useState<string>("");
    // Track if user is actively typing to prevent URL sync from overwriting input
    const isTypingRef = React.useRef(false);

    // Initialize form from URL params
    useEffect(() => {
        const keyword = searchParams.get('keyword') || "";
        const availability = searchParams.get('availability') || "";
        const productionType = searchParams.get('productionType') || "";
        const location = searchParams.get('location') || "";
        const experience = searchParams.get('experience') || "";
        const minRate = parseInt(searchParams.get('minRate') || "0");
        const maxRate = parseInt(searchParams.get('maxRate') || "5000");
        const role = searchParams.get('role') || "";

        setFilterForm({
            keyword,
            availability,
            productionType,
            location,
            experience,
            minRate,
            maxRate
        });
        // Only update searchTerm from URL if user is not actively typing
        // This prevents the circular update that causes letters to stack
        if (!isTypingRef.current) {
            setSearchTerm(keyword);
        }
        setActiveRole(role);

        // Calculate active filters count
        let count = 0;
        if (availability) count++;
        if (productionType) count++;
        if (location) count++;
        if (experience) count++;
        if (minRate > 0) count++;
        if (maxRate < 5000) count++;
        if (role) count++;
        setActiveFilterCount(count);

    }, [searchParams]);

    // Update URL with current filters
    const updateUrl = useCallback((newFilters: typeof initialFilterState) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (newFilters.keyword) params.set('keyword', newFilters.keyword);
        else params.delete('keyword');

        if (newFilters.availability) params.set('availability', newFilters.availability);
        else params.delete('availability');

        if (newFilters.productionType) params.set('productionType', newFilters.productionType);
        else params.delete('productionType');

        if (newFilters.location) params.set('location', newFilters.location);
        else params.delete('location');

        if (newFilters.experience) params.set('experience', newFilters.experience);
        else params.delete('experience');

        if (newFilters.minRate > 0) params.set('minRate', newFilters.minRate.toString());
        else params.delete('minRate');

        if (newFilters.maxRate < 5000) params.set('maxRate', newFilters.maxRate.toString());
        else params.delete('maxRate');

        // Reset page to 1 when filtering
        params.set('page', '1');

        router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    // Handle search input debounce
    useEffect(() => {
        // Mark that user is typing
        isTypingRef.current = true;
        
        const timer = setTimeout(() => {
            if (searchTerm !== filterForm.keyword) {
                const newFilters = { ...filterForm, keyword: searchTerm };
                setFilterForm(newFilters);
                updateUrl(newFilters);
            }
            // After debounce completes, user is no longer typing
            isTypingRef.current = false;
        }, 500);
        
        return () => {
            clearTimeout(timer);
            // Reset typing flag on cleanup
            isTypingRef.current = false;
        };
    }, [searchTerm, filterForm, updateUrl]);

    const handleFilterChange = (field: keyof typeof initialFilterState, value: string | number) => {
        const newFilters = { ...filterForm, [field]: value };
        setFilterForm(newFilters);
        updateUrl(newFilters);
    };

    const handleRateRangeReset = () => {
        const newFilters = { ...filterForm, minRate: 0, maxRate: 5000 };
        setFilterForm(newFilters);
        updateUrl(newFilters);
    };

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsFilterOpen(false);
    };

    const handleSearchSubmit = () => {
        if (searchTerm !== filterForm.keyword) {
             const newFilters = { ...filterForm, keyword: searchTerm };
             setFilterForm(newFilters);
             updateUrl(newFilters);
        }
    }

    const handleClearRoleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('role');
        params.set('page', '1');
        setActiveRole("");
        router.push(`${pathname}?${params.toString()}`);
    }

    const handleClearAllFilters = () => {
        // Reset all filters to initial state
        setFilterForm(initialFilterState);
        setSearchTerm("");
        setActiveRole("");
        
        // Clear all URL params except keep the base path
        router.push(pathname);
    }

    return (
        <>
            <div className="max-w-7xl mx-auto">
                <span className="hidden p-2 md:inline-block bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] bg-clip-text text-transparent text-2xl font-semibold">Crew</span>
                <div className="sticky top-0 z-20 flex w-full flex-row gap-2 bg-white/90 p-4 backdrop-blur sm:flex-row sm:items-center">

                    <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className={`flex h-12 w-auto items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${isFilterOpen || activeFilterCount > 0 ? 'bg-[#FA6E80] text-white border-[#FA6E80] sm:w-[281px] ' : 'bg-transparent text-[#FA6E80] border-[#FA6E80]'}`}
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <span>Filter {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                                    <Filter className="h-4 w-4" />
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[273px] border-none" align="start">
                            <form onSubmit={handleFilterSubmit} className=" space-y-2 rounded-[10px] bg-[#F8F8F8] p-4 text-[#017A7C]">
                                {/* Clear Filters Button */}
                                {activeFilterCount > 0 && (
                                    <div className="flex justify-end mb-2">
                                        <button
                                            type="button"
                                            onClick={handleClearAllFilters}
                                            className="text-xs text-[#FA6E80] hover:text-[#fa5a6e] font-medium underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                                
                                <div className="space-y-1 rounded-[5.71px]  border border-[#017A7C]/30 px-4 py-2 justify-center items-center flex ">
                                    <label className="text-sm font-[400] w-full">Availability</label>
                                    <select 
                                        value={filterForm.availability} 
                                        onChange={(e) => handleFilterChange("availability", e.target.value)}
                                        className="bg-transparent outline-none text-sm text-right"
                                    >
                                        <option value="">Any</option>
                                        <option value="available">Available</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <select
                                        value={filterForm.productionType}
                                        onChange={(e) => handleFilterChange("productionType", e.target.value)}
                                        className="w-full rounded-[5.71px] border border-[#017A7C]/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#31A7AC]"
                                    >
                                        <option value="">Select production type</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="tv">TV</option>
                                        <option value="film">Film</option>
                                        <option value="social">Social / Digital</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 rounded-xl border border-[#017A7C]/30 px-4 py-2 bg-white">
                                        <MapPin className="h-4 w-4 text-[#017A7C]" />
                                        <input
                                            value={filterForm.location}
                                            onChange={(e) => handleFilterChange("location", e.target.value)}
                                            className="w-full border-none text-sm outline-none"
                                            placeholder="Location"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-[400]">Experience</label>
                                        {filterForm.experience && (
                                            <button
                                                type="button"
                                                onClick={() => handleFilterChange("experience", "")}
                                                className="text-xs text-[#FA6E80] hover:text-[#fa5a6e] font-medium"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3 rounded-xl border border-[#017A7C]/20 px-4 py-3 bg-white">
                                        {experienceOptions.map((exp) => (
                                            <button
                                                key={exp.title}
                                                type="button"
                                                onClick={() => {
                                                    // Toggle: if already selected, deselect; otherwise select
                                                    const newValue = filterForm.experience === exp.title ? "" : exp.title;
                                                    handleFilterChange("experience", newValue);
                                                }}
                                                className={`w-full text-left text-sm transition-colors ${
                                                    filterForm.experience === exp.title 
                                                        ? "text-[#017A7C] font-semibold" 
                                                        : "text-gray-700 hover:text-[#017A7C]"
                                                }`}
                                            >
                                                <div className="font-bold">{exp.title}</div>
                                                <div className="text-xs text-gray-500">{exp.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-700">Rate Range</p>
                                        {(filterForm.minRate > 0 || filterForm.maxRate < 5000) && (
                                            <button
                                                type="button"
                                                onClick={handleRateRangeReset}
                                                className="text-xs text-[#FA6E80] hover:text-[#fa5a6e] font-medium"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-semibold">
                                        <span className="text-[#FA6E80]">{filterForm.minRate}</span>
                                        <span className="text-[#31A7AC]">{filterForm.maxRate}</span>
                                    </div>
                                    <div className="relative pt-2 h-8">
                                        <style jsx>{`
                                            .range-slider-min {
                                                -webkit-appearance: none;
                                                -moz-appearance: none;
                                                appearance: none;
                                                background: transparent;
                                                pointer-events: none;
                                            }
                                            .range-slider-min::-webkit-slider-thumb {
                                                -webkit-appearance: none;
                                                appearance: none;
                                                width: 18px;
                                                height: 18px;
                                                border-radius: 50%;
                                                background: #FA6E80;
                                                border: 2px solid white;
                                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                                cursor: pointer;
                                                pointer-events: auto;
                                            }
                                            .range-slider-min::-moz-range-thumb {
                                                width: 18px;
                                                height: 18px;
                                                border-radius: 50%;
                                                background: #FA6E80;
                                                border: 2px solid white;
                                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                                cursor: pointer;
                                                pointer-events: auto;
                                            }
                                            .range-slider-max {
                                                -webkit-appearance: none;
                                                -moz-appearance: none;
                                                appearance: none;
                                                background: transparent;
                                                pointer-events: none;
                                            }
                                            .range-slider-max::-webkit-slider-thumb {
                                                -webkit-appearance: none;
                                                appearance: none;
                                                width: 18px;
                                                height: 18px;
                                                border-radius: 50%;
                                                background: #31A7AC;
                                                border: 2px solid white;
                                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                                cursor: pointer;
                                                pointer-events: auto;
                                            }
                                            .range-slider-max::-moz-range-thumb {
                                                width: 18px;
                                                height: 18px;
                                                border-radius: 50%;
                                                background: #31A7AC;
                                                border: 2px solid white;
                                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                                cursor: pointer;
                                                pointer-events: auto;
                                            }
                                        `}</style>
                                        <input
                                            type="range"
                                            min={0}
                                            max={5000}
                                            step={100}
                                            value={filterForm.minRate}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                if (value < filterForm.maxRate) {
                                                    handleFilterChange("minRate", value);
                                                }
                                            }}
                                            className="range-slider-min absolute w-full h-2"
                                            style={{ zIndex: 3 }}
                                        />
                                        <input
                                            type="range"
                                            min={0}
                                            max={5000}
                                            step={100}
                                            value={filterForm.maxRate}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                if (value > filterForm.minRate) {
                                                    handleFilterChange("maxRate", value);
                                                }
                                            }}
                                            className="range-slider-max absolute w-full h-2"
                                            style={{ zIndex: 4 }}
                                        />
                                        <div className="absolute w-full h-2 bg-gray-200 rounded-full top-2">
                                            <div
                                                className="absolute h-2 bg-gradient-to-r from-[#FA6E80] to-[#31A7AC] rounded-full"
                                                style={{
                                                    left: `${(filterForm.minRate / 5000) * 100}%`,
                                                    right: `${100 - (filterForm.maxRate / 5000) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear All Filters Button - visible when filters are active */}
                    {activeFilterCount > 0 && (
                        <Button
                            onClick={handleClearAllFilters}
                            className="flex h-12 items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}

                    <div className="flex h-12 flex-row w-full items-center justify-between rounded-full border px-3 py-2">
                        <input
                            type="text"
                            placeholder="Search by name, role, or department..."
                            className="border-none w-[calc(100%-3rem)] text-sm outline-none focus:ring-0 ml-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearchSubmit();
                                }
                            }}
                        />
                        <button 
                            onClick={handleSearchSubmit}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FA6E80] cursor-pointer hover:bg-[#fa5a6e] transition-colors flex-shrink-0"
                        >
                            <Search className="h-4 w-4 text-white" />
                        </button>
                    </div>

                </div>
                <div className="flex w-full flex-col gap-6 lg:flex-row">
                    <div className={`${isFilterOpen ? 'sm:flex hidden' : 'hidden lg:flex'} w-full flex-col gap-4 rounded-2xl bg-white/50 p-4 lg:max-w-[280px] lg:overflow-y-auto h-[calc(100vh-200px)]`}>

                        {filterOptions.map(opt => {
                            // Check if any role in this category is active
                            const hasActiveRole = opt.value.some(v => v.label === activeRole);
                            
                            return (
                                <details key={opt.label} className="group  rounded-[10px]  border-[1px] border-[#989898]/10  bg-white" open={hasActiveRole}>
                                    <summary className={`cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-3 py-2 text-sm font-[400] ${hasActiveRole ? 'bg-[#FA6E80] text-white rounded-t-[10px]' : ''}`}>
                                        <span>{opt.label}</span>
                                        <span className="flex items-center gap-2">
                                            {hasActiveRole && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleClearRoleFilter();
                                                    }}
                                                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                                    title="Clear filter"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <span className="group-open:hidden"><ChevronDown className="h-4 w-4 text-[#FA6E80]" /></span>
                                            <span className="hidden group-open:inline"><ChevronUp className={`h-4 w-4 ${hasActiveRole ? 'text-white' : 'text-[#FA6E80]'}`} /></span>
                                        </span>
                                    </summary>
                                    <ul className="px-3 pb-2 space-y-1 bg-[#FAFAFA]">
                                        {opt.value.map(v => (
                                            <li key={v.label}>
                                                <Link
                                                    href={v.href}
                                                    className={`text-xs cursor-pointer block py-1 flex items-center justify-between group/item ${
                                                        activeRole === v.label 
                                                            ? 'text-[#FA6E80] font-semibold' 
                                                            : 'text-[#444444] hover:text-[#FA6E80]'
                                                    }`}
                                                >
                                                    <span>{v.label}</span>
                                                    {activeRole === v.label && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleClearRoleFilter();
                                                            }}
                                                            className="hover:bg-[#FA6E80]/10 rounded-full p-0.5 transition-colors"
                                                            title="Clear filter"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            );
                        })
                        }
                    </div>
                    <div className="w-full flex-1 overflow-x-hidden p-2 sm:p-4 min-h-[600px]">{children}</div>
                </div>

            </div>
        </>
    )
}
