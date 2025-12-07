"use client"

import React from "react";
import { Globe } from "lucide-react";

interface TravelCountry {
  id?: string;
  country_name?: string;
  country?: string;
}

interface ReadOnlyAvailableToTravelSectionProps {
  travelCountries: (TravelCountry | string)[];
}

export default function ReadOnlyAvailableToTravelSection({ travelCountries }: ReadOnlyAvailableToTravelSectionProps) {
  const isEmpty = !travelCountries || travelCountries.length === 0;

  // Normalize the travel countries to strings
  const countryNames = travelCountries.map((tc) => {
    if (typeof tc === 'string') {
      return tc;
    }
    return tc.country_name || tc.country || 'Unknown';
  });

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Available to Travel</h2>
      </div>
      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          <p>Not available to travel</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {countryNames.map((country, index) => (
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
