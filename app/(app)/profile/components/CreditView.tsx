import Image from "next/image"
import Link from "next/link"
import { Calendar, Edit, Plus } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProfileDataTypes } from "@/types"
import { useProfile, CreditData } from "@/contexts/ProfileContext"

import CreditsEditor from "./CreditsEditor"

type CreditType = ProfileDataTypes["credits"][number]

const formatDate = (value?: Date | string) => {
    if (!value) return ""
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString("en-US", { month: "short", year: "numeric" })
}

const formatRange = (start?: Date | string, end?: Date | string) => {
    const startLabel = formatDate(start)
    const endLabel = formatDate(end)
    if (!startLabel && !endLabel) return "--"
    if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
    return startLabel || endLabel
}

function CreditCard({ credit, onEdit }: { credit: CreditType; onEdit: () => void }) {
    const headingParts = [credit.brandClient || credit.creditTitle]
    if (credit.projectTitle && credit.projectTitle !== credit.brandClient) {
        headingParts.push(credit.projectTitle)
    }
    const heading = headingParts.filter(Boolean).join(" • ") || credit.creditTitle
    const releaseSuffix = credit.releaseYear ? ` (${credit.releaseYear}${credit.isUnreleased ? " • Unreleased" : ""})` : ""

    const roleLine = [credit.role, credit.localCompany || credit.internationalCompany, credit.country]
        .filter(Boolean)
        .join(" • ")
    const companyLine = null; // Country is now shown in roleLine
    const productionTimeline = [credit.productionType, formatRange(credit.startDate, credit.endDate)].filter(Boolean).join(" • ")
    const awards = credit.awards ?? []

    return (
        <>
            <article className="relative flex w-full mb-5 flex-col gap-4 border-b border-[#E6E6E6] pb-6 last:border-b-0 group">
                <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <p className="text-[18px] font-semibold text-[#181818]">
                                {heading}
                                {releaseSuffix}
                            </p>
                            {credit.headlineStats && (
                                <p className="text-[12px] font-semibold text-[#31A7AC]">{credit.headlineStats}</p>
                            )}
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={onEdit}
                        >
                            <Edit className="h-4 w-4 text-[#31A7AC]" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row w-full">
                    <div className="relative flex-shrink-0 w-full sm:w-[190px]">
                        {credit.imgUrl ? (
                            <Image
                                src={credit.imgUrl}
                                alt={credit.creditTitle}
                                width={190}
                                height={285}
                                className="w-full sm:w-[190px] h-auto sm:h-[285px] rounded-[5px] object-cover"
                            />
                        ) : (
                            <div className="relative w-full sm:w-[190px] h-[400px] sm:h-[285px] rounded-[5px] bg-[#ffffff] shadow-[4px_4px_6.4px_rgba(0,0,0,0.03)]">
                                <div className="absolute left-3 top-3 flex items-center gap-[6px]">
                                    <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#25C9D0] bg-white" />
                                    <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#FF5168] bg-white" />
                                </div>
                                <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-[20px] font-medium text-[#444444]">
                                    Too busy to take a pic..!
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col gap-4 w-full min-w-0">
                        <div className="space-y-0 text-[#181818]">
                            {roleLine && <p className="text-sm leading-[21px]">{roleLine}</p>}
                            {companyLine && <p className="text-xs text-[#444444]">{companyLine}</p>}
                            {productionTimeline && <p className="text-[10px] font-semibold text-[#444444] uppercase">{productionTimeline}</p>}
                        </div>
                        <p className="text-sm font-[400] leading-[18px] text-[#393939]">{credit.description}</p>
                        {awards.length > 0 && (
                            <div className="relative isolate rounded-r-[5px] bg-white px-2 py-2 w-full">
                                <ScrollArea className="max-h-[85px] w-full">
                                    <ul className="space-y-1 pr-4">
                                        {awards.map((award, index) => (
                                            <li key={`${credit.id}-award-${index}`} className="text-[10px] font-semibold text-[#31A7AC] break-words">
                                                <span>{award.title}</span>
                                                {award.detail && <span className="text-[#6B6B6B]"> {award.detail}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>

                            </div>
                        )}
                        {/* 
                    {credit.awardsSummary && (
                        <p className="text-sm font-semibold text-[#31A7AC]">{credit.awardsSummary}</p>
                    )}

                    <div className="mt-auto flex items-center gap-3 text-xs text-[#000000]">
                        <Calendar className="h-4 w-4" />
                        <span>{formatRange(credit.startDate, credit.endDate)}</span>
                    </div> */}
                    </div>
                </div>
            </article>
        </>
    )
}

export default function CreditsSection() {
    // Use credits from ProfileContext instead of making separate API call
    const { credits: profileCredits, loading: profileLoading, fetchCredits } = useProfile();
    const [selectedCredit, setSelectedCredit] = useState<CreditType | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    
    // Map the API response to match the expected CreditType format
    const credits = profileCredits.map((credit: CreditData) => ({
        id: credit.id,
        creditTitle: credit.credit_title || '',
        startDate: credit.start_date || '',
        endDate: credit.end_date || '',
        description: credit.description || '',
        imgUrl: credit.image_url || '',
        productionType: credit.production_type || '',
        role: credit.role || '',
        projectTitle: credit.project_title || '',
        brandClient: credit.brand_client || '',
        localCompany: credit.local_company || '',
        internationalCompany: credit.international_company || '',
        country: credit.country || '',
        releaseYear: credit.release_year || '',
        isUnreleased: credit.is_unreleased || false,
        headlineStats: credit.headline_stats || '',
        awardsSummary: '',
        awards: credit.awards || []
    }));

    const loading = profileLoading;
    const error = null; // Error is handled at ProfileContext level

    const handleEditCredit = (credit: CreditType) => {
        setSelectedCredit(credit);
        setEditDialogOpen(true);
    };

    const handleEditDialogChange = (open: boolean) => {
        setEditDialogOpen(open);
        if (!open) {
            setSelectedCredit(null);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <section className="isolate w-full max-w-[600px] rounded-[20px] bg-[#FAFAFA] p-[29px] shadow-[0px_1px_10px_rgba(0,0,0,0.1)]">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="isolate w-full max-w-[600px] rounded-[20px] bg-[#FAFAFA] p-[29px] shadow-[0px_1px_10px_rgba(0,0,0,0.1)]">
            <header className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-[22px] font-semibold leading-[33px] text-black">Credits</h2>
                </div>
                <CreditsEditor
                    mode="add"
                    trigger={
                        <Button 
                            size="icon" 
                            className="h-10 w-10 rounded-2xl bg-[#FA6E80] text-white hover:bg-[#fa6e80]/90"
                            data-testid="add-credit-button"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    }
                    onUpdate={fetchCredits}
                />
            </header>

            {/* Edit dialog controlled by state */}
            {selectedCredit && (
                <CreditsEditor
                    mode="edit"
                    creditToEdit={selectedCredit}
                    trigger={<div />}
                    open={editDialogOpen}
                    onOpenChange={handleEditDialogChange}
                    onUpdate={fetchCredits}
                />
            )}

            {error && (
                <div className="text-center py-8 text-red-500">
                    <p>{error}</p>
                </div>
            )}

            {!error && credits.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>Showcase your art works that won the world</p>
                </div>
            )}

            {!error && credits.length > 0 && (
                <div className="flex flex-col gap-8">
                    {credits.map((credit, index) => (
                        <div key={credit.id}>
                            <CreditCard credit={credit} onEdit={() => handleEditCredit(credit)} />
                            {index < credits.length - 1 && (
                                <div
                                    className="h-0 w-full rounded-full mt-8"
                                    style={{
                                        border: '1px solid transparent',
                                        backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #FA6E80 0%, #6A89BE 33%, #85AAB7 66%, #31A7AC 100%)',
                                        backgroundOrigin: 'border-box',
                                        backgroundClip: 'padding-box, border-box'
                                    }}
                                    aria-hidden
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

           

        </section>
    )
}
