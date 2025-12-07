"use client"

import React from "react";
import { Mail, Phone } from "lucide-react";

interface ReadOnlyContactDetailsSectionProps {
  email?: string;
  phone?: string;
}

export default function ReadOnlyContactDetailsSection({ email, phone }: ReadOnlyContactDetailsSectionProps) {
  if (!email && !phone) {
    return (
      <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
        <div className="mb-5">
          <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Contact Details</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No contact details available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Contact Details</h2>
      </div>
      <div className="space-y-4">
        {email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-[#31A7AC]" />
            <a href={`mailto:${email}`} className="text-base text-[#000] hover:text-[#31A7AC] transition-colors">
              {email}
            </a>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-[#31A7AC]" />
            <a href={`tel:${phone}`} className="text-base text-[#000] hover:text-[#31A7AC] transition-colors">
              {phone}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
