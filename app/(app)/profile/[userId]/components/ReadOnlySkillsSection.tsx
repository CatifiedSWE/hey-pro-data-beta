"use client"

import React from "react";

interface Skill {
  id: string;
  skillName: string;
  description?: string;
  proficiencyLevel?: string;
  experienceLevel?: string;
  dayRate?: number;
  dayRateCurrency?: string;
  isPublic?: boolean;
}

interface ReadOnlySkillsSectionProps {
  skills: Skill[];
}

export default function ReadOnlySkillsSection({ skills }: ReadOnlySkillsSectionProps) {
  if (!skills || skills.length === 0) {
    return (
      <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
        <div className="mb-5">
          <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Skills</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Life long learner</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Skills</h2>
      </div>
      <div className="space-y-4">
        {skills.map((skill) => {
          // Properly check for rate data - use != null to check for both null and undefined
          const hasRate = skill.dayRate != null && skill.dayRateCurrency != null;
          const shouldShowRate = hasRate && (skill.isPublic !== false);
          
          return (
            <div key={skill.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-[400] text-[#000] sm:text-lg flex-1">
                  {skill.skillName}
                </h3>
              </div>
              {skill.description && (
                <p className="text-sm leading-relaxed text-[#444444]">{skill.description}</p>
              )}
              {skill.experienceLevel && (
                <div className="space-y-2 ml-10">
                  <div className="flex flex-wrap items-center justify-start gap-x-1 px-4 bg-[#FFFFFF] h-[31px] w-[233px] rounded-[5px]">
                    <h4 className="text-sm font-[600] text-[#000]">{skill.experienceLevel}</h4>
                  </div>
                </div>
              )}
              {shouldShowRate && (
                <div className="ml-10">
                  <div className="inline-flex items-center px-4 py-1.5 bg-[#E7FAFC] rounded-[5px]">
                    <p className="text-sm font-[600] text-[#31A7AC]">
                      {skill.dayRateCurrency} {Number(skill.dayRate).toFixed(2)} per day
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}
