"use client"
import React, { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useProfile, type VisaData } from "@/contexts/ProfileContext";

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

interface VisaSectionProps {
    onUpdate?: () => void;
}

export default function VisaSection({ onUpdate }: VisaSectionProps) {
    const { visa, updateVisa, fetchVisa } = useProfile();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [nationality, setNationality] = useState("");
    const [visaType, setVisaType] = useState("");
    const [issuedBy, setIssuedBy] = useState("");
    const [passportExpiryDate, setPassportExpiryDate] = useState<Date | undefined>(undefined);
    const [visaExpiryDate, setVisaExpiryDate] = useState<Date | undefined>(undefined);

    const [passportMonth, setPassportMonth] = useState<Date | undefined>(undefined);
    const [visaMonth, setVisaMonth] = useState<Date | undefined>(undefined);
    const [passportPopoverOpen, setPassportPopoverOpen] = useState(false);
    const [visaPopoverOpen, setVisaPopoverOpen] = useState(false);

    const nationalityOptions = ["United States", "Canada", "United Kingdom", "Australia", "India", "Germany", "France", "United Arab Emirates", "Saudi Arabia", "Egypt"];
    const visaTypes = ["H1B", "L1", "O1", "TN", "E3", "F1", "J1", "B1/B2", "Work Visa", "Tourist Visa", "Resident Visa", "UAE Golden Visa"];

    // Load visa data when component mounts or when visa changes
    useEffect(() => {
        if (visa) {
            setNationality(visa.nationality || "");
            setVisaType(visa.visa_type || "");
            setIssuedBy(visa.visa_issued_by || "");
            
            const passportDate = visa.passport_expiry_date ? new Date(visa.passport_expiry_date) : undefined;
            const visaDate = visa.visa_expiry_date ? new Date(visa.visa_expiry_date) : undefined;
            
            setPassportExpiryDate(passportDate);
            setPassportMonth(passportDate);
            setVisaExpiryDate(visaDate);
            setVisaMonth(visaDate);
        }
    }, [visa]);

    const resetForm = () => {
        if (visa) {
            setNationality(visa.nationality || "");
            setVisaType(visa.visa_type || "");
            setIssuedBy(visa.visa_issued_by || "");
            
            const passportDate = visa.passport_expiry_date ? new Date(visa.passport_expiry_date) : undefined;
            const visaDate = visa.visa_expiry_date ? new Date(visa.visa_expiry_date) : undefined;
            
            setPassportExpiryDate(passportDate);
            setPassportMonth(passportDate);
            setVisaExpiryDate(visaDate);
            setVisaMonth(visaDate);
        } else {
            setNationality("");
            setVisaType("");
            setIssuedBy("");
            setPassportExpiryDate(undefined);
            setPassportMonth(undefined);
            setVisaExpiryDate(undefined);
            setVisaMonth(undefined);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const hasChanges = [
            nationality !== (visa?.nationality || ""),
            passportExpiryDate?.getTime() !== (visa?.passport_expiry_date ? new Date(visa.passport_expiry_date).getTime() : undefined),
            visaType !== (visa?.visa_type || ""),
            issuedBy !== (visa?.visa_issued_by || ""),
            visaExpiryDate?.getTime() !== (visa?.visa_expiry_date ? new Date(visa.visa_expiry_date).getTime() : undefined),
        ].some(Boolean);

        if (!hasChanges) {
            toast.info("No changes were made.");
            setIsDialogOpen(false);
            return;
        }

        // Prevent multiple simultaneous saves
        if (saving) return;

        setSaving(true);
        try {
            const result = await updateVisa({
                nationality: nationality || undefined,
                passport_expiry_date: passportExpiryDate ? passportExpiryDate.toISOString().split('T')[0] : undefined,
                visa_type: visaType || undefined,
                visa_issued_by: issuedBy || undefined,
                visa_expiry_date: visaExpiryDate ? visaExpiryDate.toISOString().split('T')[0] : undefined,
            });

            if (result.success) {
                toast.success(result.message);
                setIsDialogOpen(false);
                onUpdate?.();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Visa update error:', error);
            toast.error('Failed to update visa information');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setIsDialogOpen(false);
    };

    const renderDatePicker = ({
        id,
        placeholder,
        value,
        onSelect,
        month,
        onMonthChange,
        popoverOpen,
        setPopoverOpen,
    }: {
        id: string;
        placeholder: string;
        value: Date | undefined;
        onSelect: (date: Date | undefined) => void;
        month: Date | undefined;
        onMonthChange: (date: Date | undefined) => void;
        popoverOpen: boolean;
        setPopoverOpen: (state: boolean) => void;
    }) => (
        <div className="relative">
            <Input
                id={id}
                value={value ? formatDate(value) : ""}
                placeholder={placeholder}
                className="h-[41px] rounded-[15px] border border-[#31A7AC] pr-12 text-sm text-black focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                readOnly
            />
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#31A7AC] hover:bg-transparent"
                    >
                        <CalendarIcon className="size-4" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="end" alignOffset={-8} sideOffset={10}>
                    <Calendar
                        mode="single"
                        selected={value}
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 10}
                        month={month}
                        onMonthChange={onMonthChange}
                        onSelect={(date) => {
                            onSelect(date);
                            setPopoverOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );


    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <div
                    className="flex flex-row gap-5 h-[44px] w-auto text-base font-medium rounded-[15px]  bg-transparent border px-9 justify-center items-center cursor-pointer hover:bg-muted/50 border-[#444444] "
                >
                    VISA
                </div>
            </DialogTrigger>
            <DialogContent className="w-full overflow-x-auto border-none bg-transparent no-scrollbar p-0">
                <VisuallyHidden>
                    <DialogTitle>Passport and Visa details</DialogTitle>
                </VisuallyHidden>
                <form onSubmit={handleSubmit}>
                    <div className="mx-auto flex h-full w-full flex-col bg-white px-5 pb-6 pt-[25px] shadow-[0_8px_18px_rgba(0,0,0,0.1)]">
                        <div className="mx-auto mb-6 h-[5px] w-[150px] rounded-full bg-[#868686]" />
                        <div className="flex flex-col gap-[25px]">
                            <div className="space-y-2">
                                <h2 className="text-[22px] font-normal leading-[33px] text-black">Passport and Visa details</h2>
                                <p className="text-xs leading-[18px] text-[#181818]">
                                    This information may help enhance your visibility for location-based roles or eligibility-specific opportunities.
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <Select value={nationality} onValueChange={setNationality}>
                                        <SelectTrigger className="h-[41px] w-full rounded-[16px] border border-transparent bg-[#31A7AC] px-[21px] text-sm font-semibold text-white shadow-none focus:ring-2 focus:ring-[#31A7AC]/40 focus:ring-offset-0">
                                            <SelectValue placeholder="Nationality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {nationalityOptions.map((country) => (
                                                    <SelectItem key={country} value={country}>
                                                        {country}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {renderDatePicker({
                                        id: "passport-expiry",
                                        placeholder: "Passport expiry date",
                                        value: passportExpiryDate,
                                        onSelect: setPassportExpiryDate,
                                        month: passportMonth,
                                        onMonthChange: setPassportMonth,
                                        popoverOpen: passportPopoverOpen,
                                        setPopoverOpen: setPassportPopoverOpen,
                                    })}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Select value={visaType} onValueChange={setVisaType}>
                                        <SelectTrigger className="h-[41px] w-full rounded-[16px] border border-transparent bg-[#31A7AC] px-[21px] text-sm font-semibold text-white shadow-none focus:ring-2 focus:ring-[#31A7AC]/40 focus:ring-offset-0">
                                            <SelectValue placeholder="Visa type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {visaTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        placeholder="Visa issued by"
                                        className="h-[41px] rounded-[15px] border border-[#31A7AC] px-5 text-sm focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                                        value={issuedBy}
                                        onChange={(e) => setIssuedBy(e.target.value)}
                                    />
                                    {renderDatePicker({
                                        id: "visa-expiry",
                                        placeholder: "Visa expiry date",
                                        value: visaExpiryDate,
                                        onSelect: setVisaExpiryDate,
                                        month: visaMonth,
                                        onMonthChange: setVisaMonth,
                                        popoverOpen: visaPopoverOpen,
                                        setPopoverOpen: setVisaPopoverOpen,
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex w-full gap-3 pt-6">
                            <Button
                                type="button"
                                onClick={handleCancel}
                                variant="outline"
                                className="h-11 flex-1 rounded-[16px] border border-[#31A7AC] text-base font-medium text-[#31A7AC]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-11 flex-1 rounded-[16px] bg-[#31A7AC] text-base font-medium text-white hover:bg-[#2b9497]"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}