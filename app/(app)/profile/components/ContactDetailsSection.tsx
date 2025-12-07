"use client"

import React from "react";
import { Eye, EyeOff, Mail, Phone, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhatupNumbers from "./WhatAppNumber";

interface ContactDetailsSectionProps {
  email?: string;
  phone?: string;
  countryCode?: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
}

export default function ContactDetailsSection({ email, phone, countryCode, isVisible, onVisibilityToggle }: ContactDetailsSectionProps) {
  const isEmpty = !email && !phone;

  // Parse phone number for display
  const parsePhoneNumber = (phoneStr?: string, storedCountryCode?: string) => {
    if (!phoneStr) return { countryCode: undefined, phoneNumber: undefined };
    
    if (storedCountryCode && phoneStr.startsWith(storedCountryCode)) {
      return {
        countryCode: storedCountryCode,
        phoneNumber: phoneStr.substring(storedCountryCode.length).replace(/\D/g, '')
      };
    }
    
    const match = phoneStr.match(/^(\+\d{1,3}?)(\d+)$/);
    if (match) {
      return {
        countryCode: match[1],
        phoneNumber: match[2].replace(/\D/g, '')
      };
    }
    
    return {
      countryCode: undefined,
      phoneNumber: phoneStr.replace(/\D/g, '')
    };
  };

  const parsedPhone = parsePhoneNumber(phone, countryCode);

  return (
    <div className="w-full rounded-[20px] bg-[#FAFAFA] px-6 py-7 shadow-[0_1px_10px_rgba(0,0,0,0.1)] sm:px-10 sm:py-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-[33px] text-[#000]">Contact Details</h2>
        <div className="flex gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={onVisibilityToggle}
            className="rounded-full border border-[#31A7AC]/30 bg-white hover:bg-white"
            title={isVisible ? "Hide from public" : "Show to public"}
          >
            {isVisible ? (
              <Eye className="h-5 w-5 text-[#31A7AC]" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-400" />
            )}
          </Button>
          <WhatupNumbers
            countryCode={parsedPhone.countryCode}
            phoneNumber={parsedPhone.phoneNumber}
            email={email}
          />
        </div>
      </div>
      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          <p>Add your contact details</p>
        </div>
      ) : (
        <div className="space-y-4">
          {email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#31A7AC]" />
              <span className="text-base text-[#000]">{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#31A7AC]" />
              <span className="text-base text-[#000]">{phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
