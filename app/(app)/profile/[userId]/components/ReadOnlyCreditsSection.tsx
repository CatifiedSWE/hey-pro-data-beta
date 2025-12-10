"use client"

import React from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Credit {
  id: string;
  creditTitle: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  imgUrl?: string;
  productionType?: string;
  role: string;
  projectTitle?: string;
  brandClient?: string;
  localCompany?: string;
  internationalCompany?: string;
  country?: string;
  releaseYear?: string;
  headlineStats?: string;
  awards?: Array<{ title: string; detail?: string }>;
}

interface ReadOnlyCreditsSectionProps {
  credits: Credit[];
}

export default function ReadOnlyCreditsSection({ credits }: ReadOnlyCreditsSectionProps) {
  if (!credits || credits.length === 0) {
    return (
      <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
        <div className="mb-5">
          <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Credits</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Fresh seed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Credits & Work History</h2>
      </div>
      <div className="space-y-6">
        {credits.map((credit) => {
          const heading = credit.brandClient || credit.projectTitle || credit.creditTitle || "Untitled";
          const displayYear = credit.releaseYear;
          const roleLine = [credit.role, credit.localCompany || credit.internationalCompany, credit.country]
            .filter(Boolean)
            .join(" • ");
          const companyLine = null; // Country is now shown in roleLine
          
          return (
            <article
              key={credit.id}
              className="relative flex flex-col gap-4 border-b border-[#E6E6E6] pb-6 last:border-b-0"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-[#181818]">
                      {heading}
                      {displayYear && ` (${displayYear})`}
                    </p>
                    {credit.headlineStats && (
                      <p className="text-xs font-semibold text-[#31A7AC]">{credit.headlineStats}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 lg:flex-row">
                <div className="relative sm:w-[190px] flex-shrink-0">
                  {credit.imgUrl ? (
                    <Image
                      src={credit.imgUrl}
                      alt={credit.creditTitle}
                      width={190}
                      height={225}
                      className="sm:h-[225px] h-[346px] sm:w-[190px] w-full rounded-[5px] object-cover"
                    />
                  ) : (
                    <div className="relative h-[346px] sm:h-[225px] sm:w-[190px] w-full rounded-[5px] bg-[#ffffff] shadow-[4px_4px_6.4px_rgba(0,0,0,0.03)]">
                      <div className="absolute left-3 top-3 flex items-center gap-[6px]">
                        <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#25C9D0] bg-white" />
                        <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#FF5168] bg-white" />
                      </div>
                      <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xl font-medium text-[#444444]">
                        Too busy to take a pic..!
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  <div className="space-y-0 text-[#181818]">
                    {roleLine && <p className="text-sm leading-[21px]">{roleLine}</p>}
                    {companyLine && <p className="text-xs text-[#444444]">{companyLine}</p>}
                    {credit.productionType && <p className="text-[10px] font-semibold text-[#444444] uppercase">{credit.productionType}</p>}
                  </div>
                  {credit.description && (
                    <p className="text-sm font-normal leading-[18px] text-[#393939]">
                      {credit.description}
                    </p>
                  )}
                  {credit.awards && credit.awards.length > 0 && (
                    <div className="relative isolate rounded-r-[5px] bg-white px-2 py-2">
                      <ScrollArea className="max-h-[85px] p-2 pr-2">
                        <ul className="space-y-1">
                          {credit.awards.map((award, index) => (
                            <li key={`${credit.id}-award-${index}`} className="text-[10px] font-semibold text-[#31A7AC]">
                              <span>{award.title}</span>
                              {award.detail && <span className="text-[#6B6B6B]"> {award.detail}</span>}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  )
}
