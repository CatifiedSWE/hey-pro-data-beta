"use client"

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import ProfileSkeleton from "../components/ProfileSkeleton";
import ReadOnlyShortProfile from "./components/ReadOnlyShortProfile";
import ReadOnlyAboutSection from "./components/ReadOnlyAboutSection";
import ReadOnlySkillsSection from "./components/ReadOnlySkillsSection";
import ReadOnlyCreditsSection from "./components/ReadOnlyCreditsSection";
import ReadOnlyHighlights from "./components/ReadOnlyHighlights";
import UserSlateView from "./components/UserSlateView";
import ReadOnlyLanguagesSection from "./components/ReadOnlyLanguagesSection";
import ReadOnlyContactDetailsSection from "./components/ReadOnlyContactDetailsSection";
import ReadOnlyAvailableToTravelSection from "./components/ReadOnlyAvailableToTravelSection";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [activeTab, setActiveTab] = useState<"profile" | "slate">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Fetch visibility settings for this user
  const { visibility, loading: visibilityLoading } = useSectionVisibility(userId);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/explore/${userId}`);
        
        if (response.data.success) {
          setProfile(response.data.data);
          // Check if profile is saved (if available in response)
          if (response.data.data.userHasSaved !== undefined) {
            setIsSaved(response.data.data.userHasSaved);
          }
        } else {
          setError(response.data.error || 'Failed to load profile');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <section className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-3 xs:px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12 pt-6 pb-20">
        <div className="flex w-full max-w-[600px] flex-col space-y-4">
          <div className="text-center p-8">
            <p className="text-red-500">{error || 'Profile not found'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-3 xs:px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12 pt-6 pb-20">
      <main className="flex w-full max-w-[600px] flex-col space-y-4">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="self-start flex items-center gap-2 text-[#FA6E80] hover:text-[#fa5a6e] hover:bg-[#FA6E80]/10 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Crew</span>
        </Button>
        
        <ReadOnlyShortProfile profile={profile} initialSaved={isSaved} />

        <div className="space-y-2 mx-auto w-full">
          {/* Profile and Slate buttons - Hidden */}
          <div className="flex flex-row gap-3 sm:gap-6 text-black mb-6 sm:mb-8" style={{ display: 'none' }}>
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
              {/* Highlights Section - Shows on mobile above other sections */}
              <div className="lg:hidden mb-8">
                <ReadOnlyHighlights highlights={profile.highlights} />
              </div>
              
              {/* About Section */}
              {visibility.about && profile.about && (
                <>
                  <ReadOnlyAboutSection about={profile.about} />
                  <div className="my-8" />
                </>
              )}
              
              {/* Skills Section */}
              {visibility.skills && profile.skills && profile.skills.length > 0 && (
                <>
                  <ReadOnlySkillsSection skills={profile.skills} />
                  <div className="my-8" />
                </>
              )}
              
              {/* Credits Section */}
              {visibility.credits && profile.credits && profile.credits.length > 0 && (
                <>
                  <ReadOnlyCreditsSection credits={profile.credits} />
                  <div className="my-8" />
                </>
              )}
              
              {/* Languages Section */}
              {visibility.languages && profile.languages && profile.languages.length > 0 && (
                <>
                  <ReadOnlyLanguagesSection languages={profile.languages} />
                  <div className="my-8" />
                </>
              )}
              
              {/* Contact Details Section */}
              {visibility.contact_details && (profile.email || profile.phone) && (
                <>
                  <ReadOnlyContactDetailsSection email={profile.email} phone={profile.phone} />
                  <div className="my-8" />
                </>
              )}
              
              {/* Available to Travel Section */}
              {visibility.available_to_travel && profile.travelCountries && profile.travelCountries.length > 0 && (
                <>
                  <ReadOnlyAvailableToTravelSection travelCountries={profile.travelCountries} />
                </>
              )}
            </div>
          ) : (
            <UserSlateView userId={userId} userName={profile.name} />
          )}
        </div>
      </main>
      
      {/* Highlights Section - Shows on desktop as sidebar */}
      <div className="hidden lg:block w-full max-w-[336px]">
        <ReadOnlyHighlights highlights={profile.highlights} />
      </div>
    </section>
  );
}
