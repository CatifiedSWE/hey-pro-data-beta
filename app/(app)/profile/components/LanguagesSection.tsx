"use client"

import React from "react";
import { Edit, Speech } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddLanguageSection from "./Language";
import { useProfile } from "@/contexts/ProfileContext";

export default function LanguagesSection() {
  // Get languages directly from ProfileContext
  const { languages } = useProfile();
  const isEmpty = !languages || languages.length === 0;

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Languages</h2>
        <div className="flex items-center gap-1.5">
          <AddLanguageSection
            languages={languages || []}
            trigger={
              <Button size="icon" variant="default" className="rounded-full border border-[#31A7AC]/30 bg-[#31A7AC] text-[#ffffff] hover:bg-[#31A7AC]/90">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            }
          />
        </div>
      </div>
      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          <p>Add your language proficiency</p>
        </div>
      ) : (
        <div className="space-y-4">
          {languages.map((lang) => {
            const languageName = lang.language_name;
            const canSpeak = lang.can_speak;
            const canWrite = lang.can_write;
            
            return (
              <div key={lang.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-[400] text-[#000] sm:text-lg flex-1">
                    {languageName}
                  </h3>
                  <div className="flex items-center gap-2">
                    {canSpeak && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-[#FA6E80] text-white rounded-full text-xs font-medium">
                        <Speech className="h-3 w-3" />
                        <span>Speak</span>
                      </div>
                    )}
                    {canWrite && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-[#31A7AC] text-white rounded-full text-xs font-medium">
                        <Edit className="h-3 w-3" />
                        <span>Write</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
