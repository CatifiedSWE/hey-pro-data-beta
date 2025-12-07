"use client"

import React from "react";

interface Language {
  id: string;
  language: string;
  proficiency?: string;
}

interface ReadOnlyLanguagesSectionProps {
  languages: Language[];
}

export default function ReadOnlyLanguagesSection({ languages }: ReadOnlyLanguagesSectionProps) {
  if (!languages || languages.length === 0) {
    return (
      <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
        <div className="mb-5">
          <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Languages</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No languages specified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Languages</h2>
      </div>
      <div className="space-y-4">
        {languages.map((lang) => (
          <div key={lang.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-[400] text-[#000] sm:text-lg flex-1">
                {lang.language}
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
        ))}
      </div>
    </div>
  )
}
