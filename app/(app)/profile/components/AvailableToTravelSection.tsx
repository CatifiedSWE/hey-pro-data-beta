"use client"

import React from "react";
import { Globe, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import AvalableCountryForTravel from "./AvalableCountryForTravel";

interface AvailableToTravelSectionProps {
  travelCountries: string[];
  isVisible: boolean;
  onVisibilityToggle: () => void;
}

export default function AvailableToTravelSection({ travelCountries }: Omit<AvailableToTravelSectionProps, 'isVisible' | 'onVisibilityToggle'>) {
  const isEmpty = !travelCountries || travelCountries.length === 0;

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Available to Travel</h2>
        <div className="flex gap-1.5">
          <AvalableCountryForTravel
            availableCountries={travelCountries}
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
          <p>Add countries you're willing to travel to</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {travelCountries.map((country, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#31A7AC]/20 text-sm text-[#000]"
            >
              <Globe className="h-4 w-4 text-[#31A7AC]" />
              <span>{country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
