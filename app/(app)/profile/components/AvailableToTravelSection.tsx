"use client"

import React from "react";
import { Globe, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import AvalableCountryForTravel from "./AvalableCountryForTravel";
import { Flag } from "@/components/ui/flag";
import { countries } from "@/lib/countries";

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
        <div className="flex items-center gap-1.5">
          <AvalableCountryForTravel
            availableCountries={travelCountries}
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
          <p>Add countries you're willing to travel to</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {travelCountries.map((countryName, index) => {
            // Find the country code for the flag
            const countryData = countries.find(c => 
              c.name.toLowerCase() === countryName.toLowerCase()
            );
            
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#31A7AC]/20 text-sm text-[#000]"
              >
                {countryData ? (
                  <Flag countryCode={countryData.code} size="sm" />
                ) : (
                  <Globe className="h-4 w-4 text-[#31A7AC]" />
                )}
                <span>{countryName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
