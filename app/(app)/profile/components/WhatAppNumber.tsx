/** @format */

"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronsUpDown, Check } from "lucide-react";
import { useState } from "react";
import { countries, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfile } from "@/contexts/ProfileContext";
import { Flag } from "@/components/ui/flag";

export default function WhatupNumbers({
    countryCode: initialCountryCode,
    phoneNumber: initialPhoneNumber,
    email: initialEmail,
    trigger,
}: {
    countryCode?: string;
    phoneNumber?: string;
    email?: string;
    trigger?: React.ReactNode;
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Get profile methods
    const { updateProfile, refetch } = useProfile();

    // Find country by dial_code if provided (e.g., "+971"), otherwise default to India
    const defaultCountry =
        countries.find((c) => c.dial_code === initialCountryCode) ||
        countries.find((c) => c.code === "IN") ||
        countries[0];
    const [selectedCountry, setSelectedCountry] =
        useState<Country>(defaultCountry);
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
    const [email, setEmail] = useState(initialEmail || "");

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
        if (value.length <= 15) {
            setPhoneNumber(value);
        }
    };
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!phoneNumber || phoneNumber.length < 5) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const countryChanged =
            selectedCountry.code !== (initialCountryCode || "IN");
        const numberChanged = phoneNumber !== (initialPhoneNumber || "");
        const emailChanged = email !== (initialEmail || "");

        if (!countryChanged && !numberChanged && !emailChanged) {
            toast.info("No changes were made.");
            setIsDialogOpen(false);
            return;
        }

        // Prevent multiple simultaneous saves
        if (saving) return;

        setSaving(true);
        try {
            // Construct full phone number with country code
            const fullPhoneNumber = `${selectedCountry.dial_code}${phoneNumber}`;
            
            // Prepare update data
            const updateData: any = {
                phone: fullPhoneNumber,
                country_code: selectedCountry.dial_code
            };

            // Only include email if it's provided
            if (email) {
                updateData.email = email;
            }
            
            // Call API to update profile with phone number and email
            const result = await updateProfile(updateData);

            if (result.success) {
                toast.success("Contact details updated successfully!");
                setIsDialogOpen(false);
                
                // Refresh profile data
                await refetch();
            } else {
                toast.error(result.message || "Failed to update contact details");
            }
        } catch (error) {
            console.error('Error updating contact details:', error);
            toast.error("Failed to update contact details");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <div className="flex flex-row gap-5 h-[44px] w-auto text-base font-medium rounded-[15px]  bg-transparent border px-9 justify-center items-center cursor-pointer hover:bg-muted/50 border-[#444444] ">
                        Contact Details
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Contact</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col items-center gap-4">
                            <div className="col-span-3 flex items-center w-full gap-2">
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-[80px] justify-between bg-transparent border rounded-full h-11 border-[#31A7AC]"
                                        >
                                            <Flag countryCode={selectedCountry.code} size="lg" />
                                            <ChevronsUpDown
                                                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                                                color="#31A7AC"
                                            />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 overflow-hidden" sideOffset={4}>
                                        <Command className="flex flex-col h-full">
                                            <CommandInput
                                                placeholder="Search country..."
                                                className="border-b"
                                            />
                                            <CommandList className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                                                <CommandEmpty>No country found.</CommandEmpty>
                                                <CommandGroup>
                                                    {countries.map((country) => (
                                                        <CommandItem
                                                            key={country.code}
                                                            value={`${country.name} ${country.code}`}
                                                            onSelect={() => {
                                                                setSelectedCountry(country);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                color="#31A7AC"
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedCountry.code === country.code
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex justify-between w-full items-center">
                                                                <span className="flex items-center gap-2">
                                                                    <Flag countryCode={country.code} size="sm" /> {country.name}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {country.dial_code}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sm text-muted-foreground">
                                        {selectedCountry.dial_code} |
                                    </div>
                                    <Input
                                        className="pl-14 border border-[#31A7AC] focus-visible:border-[#31A7AC] focus-visible:ring-ring/10 rounded-[15px] h-11 w-full"
                                        id="phone"
                                        type="tel"
                                        placeholder="000-000-0000"
                                        value={phoneNumber}
                                        onChange={handlePhoneNumberChange}
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Input
                                className="pl-3 border border-[#31A7AC] focus-visible:border-[#31A7AC] focus-visible:ring-ring/10 rounded-[15px] h-11 w-full"
                                id="email"
                                type="email"
                                placeholder="example@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                maxLength={50}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flexl flex-row">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="border-[#31A7AC] h-[44px] w-[128px] text-[#31A7AC] rounded-xl"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="bg-[#31A7AC] h-[44px] hover:bg-[#31A7AC] text-[#FFFFFF] rounded-xl"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}