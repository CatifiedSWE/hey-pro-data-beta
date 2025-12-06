"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Calendar as CalendarIcon, Edit2, LinkIcon, MapPin, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProfileProgress } from "./profileProgress"
import { countries } from "@/lib/countries"
import { toast } from "sonner"
import { useProfile, type ProfileData, type LinkData, type RoleData, type RecommendationData, type VisaData } from "@/contexts/ProfileContext"
import { useAuth } from "@/contexts/AuthContext"

import AvalableDilog from "./Avalable"
import LinksDialog from "./Links"
import ProfileEditor from "./ProfileEdit"
import { CalendarDialog } from "./calendar"

interface ShortProfileProps {
  profile: ProfileData | null;
  links: LinkData[];
  roles?: RoleData[];
  visa?: VisaData | null;
  recommendations?: RecommendationData[];
  onPhotoUpload: (file: File, type: 'profile' | 'banner') => Promise<{ success: boolean; message?: string; url?: string }>;
  onLinksUpdate?: () => void;
}

export default function ShortProfile({ profile, links, roles = [], visa, recommendations = [], onPhotoUpload, onLinksUpdate }: ShortProfileProps) {
    const [coverImageHovered, setCoverImageHovered] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const [uploadingProfile, setUploadingProfile] = useState(false)
    const filterScrollRef = useRef<HTMLDivElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)
    const profileInputRef = useRef<HTMLInputElement>(null)
    
    // Local state for availability to ensure instant updates
    const [localAvailability, setLocalAvailability] = useState<string>(profile?.availability || "Available")

    const { user } = useAuth();
    const { updateProfile } = useProfile();

    // Sync local state when profile prop changes
    useEffect(() => {
        if (profile?.availability) {
            setLocalAvailability(profile.availability)
        }
    }, [profile?.availability])

    const displayName = profile?.alias_first_name && profile?.alias_surname
        ? `${profile.alias_first_name} ${profile.alias_surname}`
        : profile?.first_name && profile?.surname
            ? `${profile.first_name} ${profile.surname}`
            : 'User Profile';

    const nationality = countries.find((country) => country.code === profile?.country_code)?.name ?? profile?.country ?? "Unknown"
    const locationDescriptor = [nationality, profile?.city?.trim()].filter(Boolean).join(" • ");
    
    const highlightedRoles = roles.slice(0, 6)
    const extraRecommendations = Math.max(recommendations.length - 3, 0)
    
    const primaryLink = links[0]?.url ?? "";
    
    const linkSummary = (() => {
        if (!primaryLink) return "Tell the world about you"
        
        const icon = <LinkIcon className="h-5 w-5" color="#FA6E80" />
        let host = primaryLink
        try {
            host = new URL(primaryLink).hostname.replace(/^www\./, "")
        } catch {}
        
        const extra = links.length - 1
        
        return (
            <>
                {icon} 
                {host} 
                {extra > 0 && ` & ${extra} other link${extra > 1 ? "s" : ""}`}
            </>
        )
    })()

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, WebP)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        setUploadingBanner(true);
        try {
            const result = await onPhotoUpload(file, 'banner');
            if (result.success) {
                toast.success('Banner updated successfully!');
            } else {
                toast.error(result.message || 'Failed to upload banner');
            }
        } catch (error) {
            toast.error('Failed to upload banner');
        } finally {
            setUploadingBanner(false);
            if (bannerInputRef.current) {
                bannerInputRef.current.value = '';
            }
        }
    };

    const handleBannerRemove = async () => {
        if (!profile?.banner_url) {
            toast.error('No banner to remove');
            return;
        }

        setUploadingBanner(true);
        try {
            const result = await updateProfile({ banner_url: null });
            
            if (result.success) {
                toast.success('Banner removed successfully!');
                // Trigger parent refetch if available
                onLinksUpdate?.();
            } else {
                toast.error(result.message || 'Failed to remove banner');
            }
        } catch (error) {
            toast.error('Failed to remove banner');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, WebP)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        setUploadingProfile(true);
        try {
            const result = await onPhotoUpload(file, 'profile');
            if (result.success) {
                toast.success('Profile photo updated successfully!');
            } else {
                toast.error(result.message || 'Failed to upload profile photo');
            }
        } catch (error) {
            toast.error('Failed to upload profile photo');
        } finally {
            setUploadingProfile(false);
            if (profileInputRef.current) {
                profileInputRef.current.value = '';
            }
        }
    };

    const updateFilterScrollState = () => {
        const container = filterScrollRef.current
        if (!container) return
    }

    useEffect(() => {
        updateFilterScrollState()
        const container = filterScrollRef.current
        if (!container) return
        container.addEventListener("scroll", updateFilterScrollState)
        window.addEventListener("resize", updateFilterScrollState)
        return () => {
            container.removeEventListener("scroll", updateFilterScrollState)
            window.removeEventListener("resize", updateFilterScrollState)
        }
    }, [])
    
    const handleAvailabilityUpdate = (newStatus: string) => {
        setLocalAvailability(newStatus);
        onLinksUpdate?.();
    }

    const isAvailable = localAvailability === "Available";
    const dotColor = isAvailable ? "bg-[#34A353]" : "bg-[#FA6E80]";
    const statusTextColor = isAvailable ? "text-[#34A353]" : "text-[#FA6E80]";

    // Construct Visa string
    const visaDetails = [visa?.nationality, visa?.visa_type, visa?.visa_issued_by].filter(Boolean).join(" • ");

    return (
        <section className="relative w-full border-b  border-[#DADADA] pb-6 ">
            <div
                className="relative h-[228px]"
                onMouseEnter={() => setCoverImageHovered(true)}
                onMouseLeave={() => setCoverImageHovered(false)}
            >
                <div className="relative sm:h-[150px] h-[88px] w-full overflow-hidden rounded-[20px]">
                    <Image
                        src={profile?.banner_url || '/default-banner.png'}
                        alt="Cover image"
                        fill
                        sizes="600px"
                        className="object-cover"
                    />
                    <input 
                        ref={bannerInputRef}
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/webp" 
                        id="cover-image-upload" 
                        className="hidden" 
                        onChange={handleBannerUpload}
                    />
                    {/* Desktop hover overlay */}
                    <div
                        className={`absolute inset-0 hidden sm:flex flex-col items-center justify-center gap-3 rounded-[20px] bg-black/60 text-center text-white transition-opacity ${coverImageHovered ? "opacity-100" : "opacity-0"}`}
                    >
                        <p className="text-sm font-semibold">Replace Banner Image</p>
                        <span className="text-xs opacity-80">Optimal dimensions: 3000x759px (Max 2MB)</span>
                        <div className="flex gap-3">
                            <label htmlFor="cover-image-upload">
                                <Button 
                                    variant="default" 
                                    className="rounded-full bg-[#FA6E80] hover:bg-[#FA6E80] min-h-[44px] px-6" 
                                    disabled={uploadingBanner}
                                    asChild
                                >
                                    <span className="cursor-pointer">
                                        {uploadingBanner ? 'Uploading...' : 'Replace Image'}
                                    </span>
                                </Button>
                            </label>
                            {profile?.banner_url && (
                                <Button 
                                    variant="ghost" 
                                    className="rounded-full border border-white text-white hover:bg-white/20 min-h-[44px] px-6"
                                    onClick={handleBannerRemove}
                                    disabled={uploadingBanner}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>
                    {/* Mobile always-visible buttons */}
                    <div className="absolute sm:hidden bottom-2 right-2 flex gap-2">
                        <label htmlFor="cover-image-upload">
                            <Button 
                                variant="default" 
                                size="sm"
                                className="rounded-full bg-[#FA6E80] hover:bg-[#FA6E80] min-h-[44px] min-w-[44px] px-4 shadow-lg" 
                                disabled={uploadingBanner}
                                asChild
                            >
                                <span className="cursor-pointer text-xs sm:text-sm">
                                    {uploadingBanner ? 'Uploading...' : 'Edit'}
                                </span>
                            </Button>
                        </label>
                        {profile?.banner_url && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="rounded-full border border-white bg-black/40 text-white hover:bg-black/60 min-h-[44px] min-w-[44px] px-4 shadow-lg"
                                onClick={handleBannerRemove}
                                disabled={uploadingBanner}
                            >
                                <span className="text-xs sm:text-sm">Remove</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="absolute inset-x-0 top-[38px] sm:top-[108px] left-[9px] sm:left-[58px] flex justify-start">
                <div
                    className="relative flex h-[112px] w-[112px] items-center justify-center group cursor-pointer"
                    onClick={() => profileInputRef.current?.click()}
                >
                    <ProfileProgress 
                        value={profile?.profile_completion_percentage || 0} 
                        imageUrl={
                            profile?.profile_photo_url || 
                            user?.user_metadata?.avatar_url || 
                            '/default-profile.png'
                        } 
                        className="rounded-full" 
                    />
                     <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-6 w-6 text-white" />
                    </div>
                    <input 
                        ref={profileInputRef}
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/webp" 
                        className="hidden" 
                        onChange={handleProfilePhotoUpload}
                    />
                </div>
            </div>

            <div className="absolute right-4 top-[98px]  sm:top-[200px] flex items-center gap-3">
                <ProfileEditor
                    profile={profile}
                    trigger={
                        <Button
                            className="h-[28px] w-[28px] mt-2 rounded-full bg-[#31A7AC] text-white shadow-[0_4px_16px_rgba(49,167,172,0.35)] hover:bg-[#27939f]"
                            aria-label="Edit profile"
                        >
                            <Edit2 className="h-5 w-5" />
                        </Button>
                    }
                />
            </div>
            <div className="absolute inset-x-0 top-[160px] max-w-[367.8px] left-[200px] hidden justify-center font-[400] text-[11px] sm:flex ">
                <div className="flex items-center gap-2  px-4 py-2 text-[#393939] ">
                    <MapPin className="h-3.5 w-3.5 text-[#393939]" />
                    <span className="whitespace-nowrap">{locationDescriptor}</span>
                </div>
                <div className={`flex items-center gap-2 bg-white px-4 py-2 ${statusTextColor}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                     <AvalableDilog
                        initialProfile={{ availability: localAvailability }}
                        triggerClassName="h-auto border-none bg-transparent p-0 text-[11px] font-[400] hover:bg-transparent"
                        onUpdate={handleAvailabilityUpdate}
                    />
                </div>
                <CalendarDialog
                    triggerClassName="flex h-[40px] items-center gap-2 rounded-full border-none bg-[#31A7AC] px-4 py-0 text-[11px] font-[400] text-white  hover:bg-[#27939f]"
                    triggerLabel={
                        <>
                            <CalendarIcon className="h-4 w-4" />
                            View Calendar
                        </>
                    }
                />
            </div>
            <div className="flex sm:mt-4 -mt-10 flex-col gap-4 px-4 sm:px-[58px]">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-[22px] font-semibold leading-[33px] text-black">{displayName}</h1>
                        {recommendations.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    {recommendations.slice(0, 3).map((recommendation, index) => (
                                        <Image
                                            key={`${recommendation.id}-${index}`}
                                            src={recommendation.recommender_photo_url || '/default-profile.png'}
                                            alt={recommendation.recommender_name || "Recommender"}
                                            width={32}
                                            height={32}
                                            className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                        />
                                    ))}
                                    {extraRecommendations > 0 && (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-xs font-semibold text-[#444444]">
                                            +{extraRecommendations}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-[#FA6E80]">
                                    +{recommendations.length} Referrals
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Visa details */}
                    {visaDetails && (
                        <div className="text-sm font-medium text-[#181818]">
                            {visaDetails}
                        </div>
                    )}

                    {/* Work Identities Display - adapted to match design's text style if possible, or use pills */}
                    {profile?.work_identities && (
                         <div className="text-sm text-[#181818]">
                            {[
                                profile.work_identities.freelance && "Freelance",
                                profile.work_identities.employee?.enabled && `Employee at ${profile.work_identities.employee.company || 'Company'}`,
                                profile.work_identities.businessOwner?.enabled && `Business Owner at ${profile.work_identities.businessOwner.businessName || 'Business'}`
                            ].filter(Boolean).join(" • ")}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {highlightedRoles.map((role) => (
                        <span
                            key={role.id}
                            className="flex items-center rounded-[29px] h-[19px] bg-[#FA6E80] px-4 py-1 text-[10px] font-[400] tracking-wide text-white"
                        >
                            {role.role_name}
                        </span>
                    ))}
                </div>

                {profile?.bio && (
                     <p className="text-[14px] leading-[21px] text-[#181818] line-clamp-3">{profile.bio}</p>
                )}
               
                {/* Hardcoded award text from design */}

                <LinksDialog
                    links={links}
                    triggerClassName="h-auto justify-start p-0 -ml-4 text-[12px] font-medium text-[#31A7AC] hover:bg-transparent"
                    triggerLabel={linkSummary}
                    onUpdate={onLinksUpdate}
                />
            </div>
        </section>
    )
}
