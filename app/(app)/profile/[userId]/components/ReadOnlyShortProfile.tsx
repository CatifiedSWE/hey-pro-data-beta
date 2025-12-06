"use client"

import React, { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { LinkIcon, MapPin, Calendar as CalendarIcon, Heart, MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { countries } from "@/lib/countries"
import { ProfileShareModal } from "@/components/profile/ProfileShareModal"
import { saveProfile, unsaveProfile } from "@/lib/api/profile-save"
import { toast } from "sonner"

interface ReadOnlyShortProfileProps {
  profile: any;
  initialSaved?: boolean;
}

export default function ReadOnlyShortProfile({ profile, initialSaved = false }: ReadOnlyShortProfileProps) {
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const displayName = profile?.name || 'User Profile';
  const nationality = countries.find((country) => country.code === profile?.country)?.name ?? profile?.country ?? "Unknown"
  const locationDescriptor = [nationality, profile?.city?.trim()].filter(Boolean).join(" • ");
  
  const highlightedRoles = profile?.roles?.slice(0, 6) || [];
  const recommendations = profile?.recommendations || [];
  const links = profile?.links || [];
  const extraRecommendations = Math.max(recommendations.length - 3, 0);
  
  const primaryLink = links[0]?.url ?? "";
  
  const linkSummary = (() => {
    if (!primaryLink) return "Keeping it mysterious"
    
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

  const isAvailable = profile?.availableForWork;
  const dotColor = isAvailable ? "bg-[#34A353]" : "bg-[#FA6E80]";
  const statusText = isAvailable ? "Available" : "Not Available";
  const statusTextColor = isAvailable ? "text-[#34A353]" : "text-[#FA6E80]";

  // Handle save/unsave profile
  const handleSaveToggle = async () => {
    setSaveLoading(true);
    try {
      if (isSaved) {
        await unsaveProfile(profile.userId || profile.user_id);
        setIsSaved(false);
        toast.success('Profile removed from saved');
      } else {
        await saveProfile(profile.userId || profile.user_id);
        setIsSaved(true);
        toast.success('Profile saved successfully');
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update save');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle message button click
  const handleMessageClick = () => {
    toast.info('Preparing soon');
  };

  return (
    <section className="relative w-full border-b border-[#DADADA] pb-6">
      <div className="relative h-[228px]">
        <div className="relative sm:h-[150px] h-[88px] w-full overflow-hidden rounded-[20px]">
          <Image
            src={profile?.banner || '/default-banner.png'}
            alt="Cover image"
            fill
            sizes="600px"
            className="object-cover"
          />
        </div>
      </div>
      <div className="absolute inset-x-0 top-[38px] sm:top-[108px] left-[9px] sm:left-[58px] flex justify-start">
        <div className="relative flex h-[112px] w-[112px] items-center justify-center">
          <div className="relative h-[112px] w-[112px] rounded-full overflow-hidden border-4 border-white bg-gray-100">
            <Image
              src={profile?.avatar || '/default-profile.png'}
              alt={displayName}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <div className="absolute top-[160px] right-1 sm:right-4 hidden sm:flex items-start justify-end font-[400] text-[11px] gap-4 max-w-[calc(100%-250px)]">
        <div className="flex items-start gap-0">
          <div className="flex items-start gap-2 px-4 py-2 text-[#393939] max-w-[200px]">
            <MapPin className="h-3.5 w-3.5 text-[#393939] flex-shrink-0 mt-0.5" />
            <span className="break-words leading-relaxed">{locationDescriptor}</span>
          </div>
          <div className={`flex items-center gap-2 bg-white px-4 py-2 ${statusTextColor} flex-shrink-0 self-start`}>
            <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
            <span className="whitespace-nowrap">{statusText}</span>
          </div>
        </div>
        
        {/* Action buttons: Heart, Share, Message */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-[#FA6E80] hover:bg-[#FA6E80]/10 transition-colors disabled:opacity-50 border border-gray-200"
            title={isSaved ? "Unsave profile" : "Save profile"}
            data-testid="save-profile-button"
          >
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            )}
          </button>
          
          <ProfileShareModal
            profileUserId={profile.userId || profile.user_id}
            profileName={displayName}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-[#31A7AC] hover:bg-[#31A7AC]/10 transition-colors border border-gray-200"
          />
          
          <button 
            onClick={handleMessageClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-[#FA6E80] hover:bg-[#FA6E80]/10 transition-colors border border-gray-200"
            title="Send message"
            data-testid="message-button"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex sm:mt-10 -mt-10 flex-col gap-4 px-4 sm:px-[58px]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[22px] font-semibold leading-[33px] text-black">{displayName}</h1>
            {recommendations.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {recommendations.slice(0, 3).map((recommendation: any, index: number) => (
                    <Image
                      key={`${recommendation.id}-${index}`}
                      src={recommendation.recommenderPhotoUrl || '/default-profile.png'}
                      alt={recommendation.recommenderName || "Recommender"}
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
        </div>

        <div className="flex flex-wrap gap-2">
          {highlightedRoles.map((role: any) => (
            <span
              key={role.id}
              className="flex items-center rounded-[29px] h-[19px] bg-[#FA6E80] px-4 py-1 text-[10px] font-[400] tracking-wide text-white"
            >
              {role.roleName}
            </span>
          ))}
        </div>

        {profile?.bio && (
          <p className="text-[14px] leading-[21px] text-[#181818] line-clamp-3">{profile.bio}</p>
        )}

        {links.length > 0 && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#31A7AC]">
            {linkSummary}
          </div>
        )}

        {/* Mobile action buttons */}
        <div className="flex sm:hidden items-center gap-3 pt-4 border-t border-gray-200">
          <button 
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-gray-50 text-[#FA6E80] hover:bg-[#FA6E80]/10 transition-colors disabled:opacity-50 border border-gray-200 font-medium text-sm"
            data-testid="save-profile-button-mobile"
          >
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </>
            )}
          </button>
          
          <ProfileShareModal
            profileUserId={profile.userId || profile.user_id}
            profileName={displayName}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-gray-50 text-[#31A7AC] hover:bg-[#31A7AC]/10 transition-colors border border-gray-200 font-medium text-sm"
          />
          
          <button 
            onClick={handleMessageClick}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-gray-50 text-[#FA6E80] hover:bg-[#FA6E80]/10 transition-colors border border-gray-200 font-medium text-sm"
            data-testid="message-button-mobile"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </button>
        </div>
      </div>
    </section>
  )
}
