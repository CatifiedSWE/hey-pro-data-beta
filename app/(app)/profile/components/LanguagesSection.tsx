"use client"

import React, { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddLanguageSection from "./Language";
import axios from "axios";
import { toast } from "sonner";

interface Language {
  code?: string;
  name?: string;
  language?: string;
  proficiency?: string;
}

interface LanguagesSectionProps {
  languages: Language[];
  isVisible: boolean;
  onVisibilityToggle: () => void;
}

export default function LanguagesSection({ languages }: Omit<LanguagesSectionProps, 'isVisible' | 'onVisibilityToggle'>) {
  const displayLanguages = languages || [];
  const isEmpty = displayLanguages.length === 0;

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Languages</h2>
        <div className="flex gap-1.5">
          <AddLanguageSection
            languages={displayLanguages}
            trigger={
              <Button size="icon" variant="ghost" className="rounded-full border border-[#31A7AC]/30 bg-white text-[#31A7AC] hover:bg-white">
                <Edit className="h-5 w-5" />
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
          {displayLanguages.map((lang, index) => {
            const languageName = lang.language || lang.name || 'Unknown';
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-[400] text-[#000] sm:text-lg flex-1">
                    {languageName}
                  </h3>
                </div>
                {lang.proficiency && (
                  <div className="space-y-2 ml-10">
                    <div className="flex flex-wrap items-center justify-start gap-x-1 px-4 bg-[#FFFFFF] h-[31px] rounded-[5px] inline-block">
                      <h4 className="text-sm font-[600] text-[#000]">{lang.proficiency}</h4>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
