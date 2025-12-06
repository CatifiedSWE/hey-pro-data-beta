"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, Link as LinkIcon } from "lucide-react";
import { countries } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Interfaces ---

interface UserProfileData {
  id: number;
  userId: string;
  name: string;
  displayName: string;
  avatar: string;
  banner: string;
  bio: string;
  country: string;
  city: string;
  location: string;
  email: string;
  phone: string;
  portfolioUrl?: string;
  imdbUrl?: string;
  dayRate?: number;
  currency: string;
  experienceLevel?: string;
  availableForWork: boolean;
  profileCompletionPercentage: number;
  work_identities?: {
    freelance?: boolean;
    employee?: {
      enabled: boolean;
      company: string;
      designation: string;
    };
    businessOwner?: {
      enabled: boolean;
      designation: string;
      businessName: string;
      businessType: string;
    };
  };
  roles: Array<{
    id: string;
    roleName: string;
    category?: string;
    sortOrder: number;
  }>;
  skills: Array<{
    id: string;
    skillName: string;
    proficiencyLevel?: string;
    description?: string;
    department?: string;
    experienceLevel?: string;
    sortOrder: number;
  }>;
  links: Array<{
    id: string;
    platform: string;
    url: string;
    label?: string;
    sortOrder: number;
  }>;
  credits: Array<{
    id: string;
    creditTitle?: string;
    title?: string;
    role?: string;
    year?: number;
    description?: string;
    imdbUrl?: string;
    imgUrl?: string;
    startDate?: string;
    endDate?: string;
    productionType?: string;
    projectTitle?: string;
    brandClient?: string;
    localCompany?: string;
    internationalCompany?: string;
    country?: string;
    releaseYear?: string;
    isUnreleased?: boolean;
    headlineStats?: string;
    awards?: Array<{
      title: string;
      detail?: string;
    }>;
  }>;
  highlights: Array<{
    id: string;
    highlight?: string;
    sortOrder: number;
    sourceType?: string;
    sourceId?: string;
    sourceData?: any;
    title?: string;
    description?: string;
    imageUrl?: string;
  }>;
  recommendations: Array<{
    id: string;
    recommenderName: string;
    recommenderRole?: string;
    recommendation: string;
    createdAt: string;
    recommenderPhotoUrl?: string;
  }>;
}

interface ReadOnlyProfileProps {
  profile: UserProfileData;
}

// --- Main Component ---

export default function ReadOnlyProfileContent({ profile }: ReadOnlyProfileProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "slate">("profile");

  return (
    <section className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-3 xs:px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12 pt-6 pb-20">
      {/* Main Column */}
      <main className="flex w-full max-w-[600px] flex-col space-y-4">
        {/* Header (ShortProfile) */}
        <ReadOnlyShortProfile profile={profile} />

        <div className="w-full bg-slate-200 h-px sm:h-[1px] mb-5" />

        {/* Tabs & Content */}
        <div className="space-y-2 mx-auto w-full">
          {/* Tabs Buttons */}
          <div className="flex flex-row gap-3 sm:gap-6 text-black mb-6 sm:mb-8">
            <Button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 min-h-[44px] text-sm sm:text-base font-semibold rounded-[12px] sm:rounded-[15px] ${
                activeTab === "profile"
                  ? "bg-[#FA6E80] text-white hover:bg-[#FA6E80] hover:text-white hover:opacity-100"
                  : "bg-[#f3f4f6] shadow-sm text-foreground hover:bg-[#f3f4f6] hover:text-foreground hover:opacity-100"
              }`}
            >
              Profile
            </Button>
            <Button
              onClick={() => setActiveTab("slate")}
              className={`flex-1 min-h-[44px] text-sm sm:text-base font-semibold rounded-[12px] sm:rounded-[15px] ${
                activeTab === "slate"
                  ? "bg-[#FA6E80] text-white hover:bg-[#FA6E80] hover:text-white hover:opacity-100"
                  : "bg-[#ffffff] shadow-sm text-foreground hover:bg-[#ffffff] hover:text-foreground hover:opacity-100"
              }`}
            >
              Slate
            </Button>
          </div>

          {activeTab === "profile" ? (
            <div className="max-w-[600px]">
              
              {/* Mobile Highlights */}
              <div className="lg:hidden mb-8">
                <ReadOnlyHighlights highlights={profile.highlights} mobile />
              </div>
              
              <div className="space-y-8">
                {/* About */}
                <ReadOnlyAbout bio={profile.bio} />

                {/* Skills */}
                <ReadOnlySkills skills={profile.skills} />

                {/* Credits */}
                <ReadOnlyCredits credits={profile.credits} />
              </div>
            </div>
          ) : (
            <div className="w-full py-12 text-center text-gray-500">
               <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-200">
                 <p>No visible slate posts.</p>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar (Highlights) - Desktop */}
      <div className="hidden lg:block w-full max-w-[336px]">
        <ReadOnlyHighlights highlights={profile.highlights} />
      </div>
    </section>
  );
}

// --- Sub-Components ---

function ReadOnlyShortProfile({ profile }: { profile: UserProfileData }) {
  const nationality = countries.find((country) => country.code === profile.country)?.name ?? profile.country ?? "Unknown";
  const locationDescriptor = [nationality, profile.city?.trim()].filter(Boolean).join(" • ");
  
  const highlightedRoles = profile.roles.slice(0, 6);
  const extraRecommendations = Math.max(profile.recommendations.length - 3, 0);
  
  const primaryLink = profile.links[0]?.url ?? "";
  
  const linkSummary = (() => {
    if (!primaryLink) return "No links added";
    
    let host = primaryLink;
    try {
      host = new URL(primaryLink).hostname.replace(/^www\./, "");
    } catch {}
    
    const extra = profile.links.length - 1;
    
    return (
      <>
        <LinkIcon className="h-5 w-5" color="#FA6E80" />
        {host} 
        {extra > 0 && ` & ${extra} other link${extra > 1 ? "s" : ""}`}
      </>
    );
  })();

  const isAvailable = profile.availableForWork;
  const dotColor = isAvailable ? "bg-[#34A353]" : "bg-[#FA6E80]";
  const statusTextColor = isAvailable ? "text-[#34A353]" : "text-[#FA6E80]";
  const statusText = isAvailable ? "Available" : "Not Available";

  const workIdentities = profile.work_identities ? [
    profile.work_identities.freelance && "Freelance",
    profile.work_identities.employee?.enabled && `Employee at ${profile.work_identities.employee.company || 'Company'}`,
    profile.work_identities.businessOwner?.enabled && `Business Owner at ${profile.work_identities.businessOwner.businessName || 'Business'}`
  ].filter(Boolean).join(" • ") : "";

  return (
    <section className="relative w-full border-b border-[#DADADA] pb-6">
      <div className="relative h-[228px]">
        <div className="relative sm:h-[150px] h-[88px] w-full overflow-hidden rounded-[20px]">
          {profile.banner ? (
            <Image
              src={profile.banner}
              alt="Cover image"
              fill
              sizes="600px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC]" />
          )}
        </div>
      </div>

      {/* Profile Avatar */}
      <div className="absolute inset-x-0 top-[38px] sm:top-[108px] left-[9px] sm:left-[58px] flex justify-start">
        <div className="relative flex h-[112px] w-[112px] items-center justify-center">
           <div className="relative h-[112px] w-[112px] rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
             <Image
                src={profile.avatar || '/default-profile.png'}
                alt={profile.displayName}
                fill
                sizes="112px"
                className="object-cover"
             />
           </div>
        </div>
      </div>

      {/* Location & Status - Desktop */}
      <div className="absolute inset-x-0 top-[160px] max-w-[450px] left-[200px] hidden justify-start font-[400] text-[11px] sm:flex items-start">
        <div className="flex items-start gap-2 px-4 py-2 text-[#393939] max-w-[200px]">
          <MapPin className="h-3.5 w-3.5 text-[#393939] flex-shrink-0 mt-0.5" />
          <span className="break-words leading-relaxed">{locationDescriptor}</span>
        </div>
        <div className={`flex items-center gap-2 bg-white px-4 py-2 ${statusTextColor} flex-shrink-0 self-start`}>
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <span className="whitespace-nowrap">{statusText}</span>
        </div>
      </div>

      <div className="flex sm:mt-10 mt-4 flex-col gap-4 px-4 sm:px-[58px]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[22px] font-semibold leading-[33px] text-black">{profile.displayName}</h1>
            {profile.recommendations.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {profile.recommendations.slice(0, 3).map((rec, index) => (
                    <Image
                        key={`${rec.id}-${index}`}
                        src={rec.recommenderPhotoUrl || '/default-profile.png'}
                        alt={rec.recommenderName || "Recommender"}
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
                  +{profile.recommendations.length} Referrals
                </span>
              </div>
            )}
          </div>

          {workIdentities && (
             <div className="text-sm text-[#181818]">{workIdentities}</div>
          )}
        </div>

        {/* Location/Status for Mobile */}
        <div className="flex sm:hidden flex-wrap items-center gap-3 text-[11px]">
           <div className="flex items-center gap-1.5 text-[#393939]">
               <MapPin className="h-3.5 w-3.5 text-[#393939]" />
               <span>{locationDescriptor}</span>
           </div>
           <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${isAvailable ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
               {statusText}
           </div>
        </div>

        {/* Roles */}
        <div className="flex flex-wrap gap-2">
          {highlightedRoles.map((role) => (
            <span
              key={role.id}
              className="flex items-center rounded-[29px] h-[19px] bg-[#FA6E80] px-4 py-1 text-[10px] font-[400] tracking-wide text-white"
            >
              {role.roleName}
            </span>
          ))}
        </div>

        {/* Bio Preview */}
        {profile.bio && (
          <p className="text-[14px] leading-[21px] text-[#181818] line-clamp-3">{profile.bio}</p>
        )}

        {/* Links */}
        {profile.links.length > 0 && (
             <div className="flex items-center gap-2 h-auto justify-start p-0 -ml-4 text-[12px] font-medium text-[#31A7AC]">
                 {linkSummary}
             </div>
        )}
      </div>
    </section>
  );
}

function ReadOnlyAbout({ bio }: { bio: string }) {
  if (!bio) return null;
  
  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">About</h2>
      </div>
      <div className="space-y-4 text-sm leading-[21px] text-[#181818] sm:text-base whitespace-pre-wrap">
        {bio}
      </div>
    </div>
  );
}

function ReadOnlySkills({ skills }: { skills: UserProfileData['skills'] }) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Skills</h2>
      </div>
      <div className="space-y-4">
        {skills.map((skill) => (
          <div key={skill.id} className="space-y-2 group relative">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-[400] text-[#000] sm:text-lg flex-1">
                {skill.department || 'General'} <span className="text-5xl">.</span> {skill.skillName}
              </h3>
            </div>
            {skill.description && <p className="text-sm leading-relaxed text-[#444444]">{skill.description}</p>}
            {skill.experienceLevel && (
              <div className="space-y-2 ml-10">
                <div className="flex flex-wrap items-center justify-start gap-x-1 px-4 bg-[#FFFFFF] h-[31px] w-[233px] rounded-[5px]">
                  <h4 className="text-sm font-[600] text-[#000]">{skill.experienceLevel}</h4>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadOnlyCredits({ credits }: { credits: UserProfileData['credits'] }) {
  if (!credits || credits.length === 0) return null;

  const formatDate = (value?: Date | string) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
  };

  const formatRange = (start?: Date | string, end?: Date | string) => {
    const startLabel = formatDate(start);
    const endLabel = formatDate(end);
    if (!startLabel && !endLabel) return "--";
    if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
    return startLabel || endLabel;
  };

  return (
    <section className="isolate w-full rounded-[20px] bg-[#FAFAFA] p-[29px] shadow-[0px_1px_10px_rgba(0,0,0,0.1)]">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
           <h2 className="text-[22px] font-[400] leading-[33px] text-black">Credits</h2>
        </div>
      </header>
      
      <div className="flex flex-col gap-8">
        {credits.map((credit, index) => {
          const headingParts = [credit.brandClient || credit.creditTitle];
          if (credit.projectTitle && credit.projectTitle !== credit.brandClient) {
            headingParts.push(credit.projectTitle);
          }
          const heading = headingParts.filter(Boolean).join(" • ") || credit.creditTitle || "Untitled";
          const releaseSuffix = credit.releaseYear ? ` (${credit.releaseYear}${credit.isUnreleased ? " • Unreleased" : ""})` : "";

          const roleLine = [credit.role, credit.localCompany || credit.internationalCompany]
            .filter(Boolean)
            .join(" • ");
          const companyLine = [credit.internationalCompany, credit.country].filter(Boolean).join(" • ");
          const productionTimeline = [credit.productionType, formatRange(credit.startDate, credit.endDate)].filter(Boolean).join(" • ");
          const awards = credit.awards ?? [];

          return (
            <div key={credit.id}>
              <article className="relative flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-[18px] font-semibold text-[#181818]">
                        {heading}
                        {releaseSuffix}
                    </p>
                    {credit.headlineStats && (
                        <p className="text-[12px] font-semibold text-[#31A7AC]">{credit.headlineStats}</p>
                    )}
                </div>

                <div className="flex flex-col gap-5 lg:flex-row">
                    <div className="relative sm:w-[190px] flex-shrink-0">
                        {credit.imgUrl ? (
                            <Image
                                src={credit.imgUrl}
                                alt={credit.creditTitle || "Credit"}
                                width={190}
                                height={225}
                                className="sm:h-[225px] h-[346px] sm:w-[190px] w-[293px] rounded-[5px] object-cover"
                            />
                        ) : (
                            <div className="relative h-[346px] sm:h-[225px] sm:w-[190px] w-full rounded-[5px] bg-[#ffffff] shadow-[4px_4px_6.4px_rgba(0,0,0,0.03)]">
                                <div className="absolute left-3 top-3 flex items-center gap-[6px]">
                                    <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#25C9D0] bg-white" />
                                    <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#FF5168] bg-white" />
                                </div>
                                <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-[20px] font-medium text-[#444444]">
                                    Too busy to take a pic..!
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-0 text-[#181818]">
                            {roleLine && <p className="text-sm leading-[21px]">{roleLine}</p>}
                            {companyLine && <p className="text-xs text-[#444444]">{companyLine}</p>}
                            {productionTimeline && <p className="text-[10px] font-semibold text-[#444444] uppercase">{productionTimeline}</p>}
                        </div>
                        <p className="text-sm font-[400] leading-[18px] text-[#393939]">{credit.description}</p>
                        {awards.length > 0 && (
                            <div className="relative isolate rounded-r-[5px] bg-white px-2 py-2">
                                <ul className="space-y-1">
                                    {awards.map((award, idx) => (
                                        <li key={`${credit.id}-award-${idx}`} className="text-[10px] font-semibold text-[#31A7AC]">
                                            <span>{award.title}</span>
                                            {award.detail && <span className="text-[#6B6B6B]"> {award.detail}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
              </article>
              {index < credits.length - 1 && (
                 <div
                    className="h-0 w-full rounded-full mt-8 mb-6"
                    style={{
                        border: '1px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #FA6E80 0%, #6A89BE 33%, #85AAB7 66%, #31A7AC 100%)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}
                 />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReadOnlyHighlights({ highlights, mobile }: { highlights: UserProfileData['highlights'], mobile?: boolean }) {
    const displayHighlights = highlights || [];

    if (displayHighlights.length === 0) return null;

    const transformHighlight = (highlight: any) => {
        if (highlight.sourceType === 'credit' && highlight.sourceData) {
            const credit = highlight.sourceData;
            return {
                title: credit.creditTitle || credit.credit_title || 'Untitled Credit',
                description: credit.description || '',
                imageUrl: credit.imgUrl || credit.image_url || '/placeholder.png'
            };
        } else if (highlight.sourceType === 'slate_post' && highlight.sourceData) {
            const post = highlight.sourceData;
            const firstMedia = post.media?.[0];
            return {
                title: 'Slate Post',
                description: post.content || '',
                imageUrl: firstMedia?.media_url || firstMedia?.mediaUrl || '/placeholder.png'
            };
        }
        return {
            title: highlight.title || 'Highlight',
            description: highlight.description || highlight.highlight || '',
            imageUrl: highlight.imageUrl || '/placeholder.png'
        };
    };

    return (
        <div className={cn(mobile ? "w-full" : "sticky top-24 self-start space-y-6")}>
            {/* Highlight Text & Line (Desktop Only) */}
            {!mobile && (
                 <div className="flex flex-col items-center" style={{ gap: '15px' }}>
                     {/* Highlight Text Graphic */}
                    <div className="relative w-full h-[100px] flex items-center justify-center">
                        <Image src="/heylights-vertical.png" alt="Highlights" width={40} height={200} className="h-full w-auto object-contain" />
                    </div>
                    {/* Vertical Gradient Line */}
                    <div
                        className="rounded-full"
                        style={{
                            width: '1px',
                            height: '1000px', 
                            background: 'linear-gradient(180deg, #FA6E80 0%, #6A89BE 41.52%, #85AAB7 62.27%, #31A7AC 103.79%)',
                        }}
                    />
                </div>
            )}

            {/* Sidebar Card Container */}
            <div className={cn("space-y-8", !mobile && "absolute top-0 left-12 w-[275px]")}>
                {displayHighlights.map((item) => {
                    const data = transformHighlight(item);
                    const words = data.description.trim().split(/\s+/);
                    const truncated = words.slice(0, 20).join(" ");
                    const hasMore = words.length > 20;

                    return (
                        <article key={item.id} className="space-y-3">
                            <div className="relative w-full h-[263px] overflow-hidden rounded-[8px] bg-gray-100">
                                {data.imageUrl && (
                                    <Image
                                        src={data.imageUrl}
                                        alt={data.title}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 275px"
                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {truncated}
                                {hasMore && "..."}
                            </p>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
