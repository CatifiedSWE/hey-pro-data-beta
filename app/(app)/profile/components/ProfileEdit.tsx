"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { useProfile, ProfileData, WorkIdentities, VisaData } from "@/contexts/ProfileContext"
import LocationAutocomplete from "@/components/LocationAutocomplete"
import { Plus, X, CalendarIcon } from "lucide-react"

interface EditProfileInfoProps {
    trigger: React.ReactNode;
}

export default function ProfileEditor({ trigger }: EditProfileInfoProps) {
    const { profile, roles, visa, updateProfile, addRole, deleteRole, updateVisa, refetch } = useProfile();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[800px] max-w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4 pb-2 shrink-0 w-full flex justify-center">
                        <TabsList className="inline-flex flex-wrap justify-center gap-3 bg-transparent p-0 h-auto max-w-full">
                            <TabsTrigger 
                                value="info" 
                                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:border-[#FA6E80] data-[state=active]:bg-[#FA6E80] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                            >
                                Profile Info
                            </TabsTrigger>
                            <TabsTrigger 
                                value="role" 
                                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:border-[#FA6E80] data-[state=active]:bg-[#FA6E80] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                            >
                                Role
                            </TabsTrigger>
                            <TabsTrigger 
                                value="work" 
                                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:border-[#FA6E80] data-[state=active]:bg-[#FA6E80] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                            >
                                Work Status
                            </TabsTrigger>
                            <TabsTrigger 
                                value="visa" 
                                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:border-[#FA6E80] data-[state=active]:bg-[#FA6E80] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                            >
                                Visa
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <TabsContent value="info" className="h-full m-0 p-0">
                            <ProfileInfoTab profile={profile} onSuccess={() => setIsDialogOpen(false)} />
                        </TabsContent>
                        <TabsContent value="role" className="h-full m-0 p-0">
                            <RoleTab roles={roles} onAdd={addRole} onDelete={deleteRole} />
                        </TabsContent>
                        <TabsContent value="work" className="h-full m-0 p-0">
                            <WorkStatusTab profile={profile} onUpdate={updateProfile} onSuccess={() => setIsDialogOpen(false)} />
                        </TabsContent>
                        <TabsContent value="visa" className="h-full m-0 p-0">
                            <VisaTab visa={visa} onUpdate={updateVisa} refetch={refetch} onSuccess={() => setIsDialogOpen(false)} />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

// --- Profile Info Tab ---
function ProfileInfoTab({ profile, onSuccess }: { profile: ProfileData | null, onSuccess: () => void }) {
    const [saving, setSaving] = useState(false);
    const { updateProfile } = useProfile();
    
    const [firstName, setFirstName] = useState(profile?.first_name || '')
    const [surname, setSurname] = useState(profile?.surname || '')
    const [aliasFirstName, setAliasFirstName] = useState(profile?.alias_first_name || '')
    const [aliasSurname, setAliasSurname] = useState(profile?.alias_surname || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [city, setCity] = useState(profile?.city || '')
    const [country, setCountry] = useState(profile?.country || '')

    // Update local state when profile changes
    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setSurname(profile.surname || '');
            setAliasFirstName(profile.alias_first_name || '');
            setAliasSurname(profile.alias_surname || '');
            setBio(profile.bio || '');
            setCity(profile.city || '');
            setCountry(profile.country || '');
        }
    }, [profile]);

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const result = await updateProfile({
                first_name: firstName,
                surname: surname,
                alias_first_name: aliasFirstName || null,
                alias_surname: aliasSurname || null,
                bio: bio,
                city: city,
                country: country
            });

            if (result.success) {
                toast.success("Profile updated successfully!");
                onSuccess();
            } else {
                toast.error(result.message || "Failed to update profile");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-6">
                <div className="space-y-2 flex flex-col">
                    <label className="text-base font-normal">First Name</label>
                    <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 rounded-2xl border-gray-400 focus:border-none focus:outline-none focus:ring-none text-base"
                        placeholder="Enter your first name"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-base font-normal">Surname</label>
                    <Input
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="h-12 rounded-2xl border-gray-400 text-base"
                        placeholder="Enter your surname"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-base font-normal">Alias First Name (Optional)</label>
                    <Input
                        value={aliasFirstName}
                        onChange={(e) => setAliasFirstName(e.target.value)}
                        className="h-12 rounded-2xl border-gray-400 text-base"
                        placeholder="Enter display name if different"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-base font-normal">Alias Surname (Optional)</label>
                    <Input
                        value={aliasSurname}
                        onChange={(e) => setAliasSurname(e.target.value)}
                        className="h-12 rounded-2xl border-gray-400 text-base"
                        placeholder="Enter display surname if different"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-base font-normal">Country</label>
                    <LocationAutocomplete
                        value={country}
                        onChange={(value) => {
                            setCountry(value);
                            if (country !== value) setCity('');
                        }}
                        placeholder="Enter your country"
                        type="country"
                        className="h-12 rounded-2xl border border-input bg-background text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-base font-normal">City</label>
                    <LocationAutocomplete
                        value={city}
                        onChange={setCity}
                        placeholder="Enter your city"
                        type="city"
                        selectedCountry={country}
                        className="h-12 rounded-2xl border border-input bg-background text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-base font-normal">Bio</label>
                    <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="min-h-[100px] rounded-2xl border-gray-400 text-base resize-none"
                        placeholder="Tell us about yourself..."
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                    onClick={() => onSuccess()}
                    variant="outline"
                    className="flex-1 py-3 h-12 text-base border-2 border-[#FA6E80] text-[#FA6E80] rounded-2xl bg-transparent"
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveChanges}
                    className="flex-1 py-3 h-12 text-base bg-[#FA6E80] text-white rounded-2xl hover:bg-[#fa5a6e]"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

// --- Role Tab ---
function RoleTab({ roles, onAdd, onDelete }: { roles: any[], onAdd: (role: string) => Promise<any>, onDelete: (id: string) => Promise<any> }) {
    const [newRole, setNewRole] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddRole = async () => {
        const value = newRole.trim()
        if (!value) return
        
        if (roles.some(r => r.role_name.toLowerCase() === value.toLowerCase())) {
            toast.error("Role already exists")
            setNewRole("")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await onAdd(value)
            if (result.success) {
                toast.success("Role added successfully")
                setNewRole("")
            } else {
                toast.error(result.message)
            }
        } catch(e) {
            toast.error("Failed to add role")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveRole = async (id: string) => {
        try {
            const result = await onDelete(id)
            if (result.success) {
                toast.success("Role removed successfully")
            } else {
                toast.error(result.message)
            }
        } catch(e) {
            toast.error("Failed to remove role")
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Add your professional roles (e.g. Director, Photographer).</p>
                <div className="flex flex-row items-center gap-2 w-full border border-[#31A7AC] h-[48px] rounded-[15px] px-3">
                    <Input
                        value={newRole}
                        onChange={(event) => setNewRole(event.target.value)}
                        placeholder="e.g. Cinematographer"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                handleAddRole()
                            }
                        }}
                        className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent h-full px-0 text-base"
                        disabled={isSubmitting}
                    />
                    <Button 
                        type="button" 
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 hover:bg-transparent"
                        onClick={handleAddRole}
                        disabled={isSubmitting}
                    >
                        <Plus className="h-6 w-6 text-[#31A7AC]" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[40px] pt-4">
                    {roles.length === 0 && (
                        <p className="text-sm text-slate-400 w-full text-center py-4">No roles yet.</p>
                    )}
                    {roles.map((role) => (
                        <span
                            key={role.id}
                            className="inline-flex items-center gap-2 rounded-[10px] bg-[#FA6E80] px-3 py-2 text-sm font-medium text-white"
                        >
                            {role.role_name}
                            <button
                                type="button"
                                className="text-white/80 hover:text-white ml-1"
                                onClick={() => handleRemoveRole(role.id)}
                                aria-label={`Remove ${role.role_name}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

// --- Work Status Tab ---
function WorkStatusTab({ profile, onUpdate, onSuccess }: { profile: ProfileData | null, onUpdate: (data: any) => Promise<any>, onSuccess: () => void }) {
    const [saving, setSaving] = useState(false);
    
    const defaultIdentities: WorkIdentities = {
        freelance: false,
        employee: { enabled: false, company: "", designation: "" },
        businessOwner: { enabled: false, designation: "", businessName: "", businessType: "" },
    };

    const [identities, setIdentities] = useState<WorkIdentities>(defaultIdentities);

    useEffect(() => {
        if (profile?.work_identities) {
            setIdentities({
                freelance: profile.work_identities.freelance || false,
                employee: {
                    enabled: profile.work_identities.employee?.enabled || false,
                    company: profile.work_identities.employee?.company || "",
                    designation: profile.work_identities.employee?.designation || "",
                },
                businessOwner: {
                    enabled: profile.work_identities.businessOwner?.enabled || false,
                    designation: profile.work_identities.businessOwner?.designation || "",
                    businessName: profile.work_identities.businessOwner?.businessName || "",
                    businessType: profile.work_identities.businessOwner?.businessType || "",
                },
            });
        }
    }, [profile]);

    const handleToggle = (key: keyof WorkIdentities) => (checked: boolean) => {
        if (key === "freelance") {
            setIdentities((prev) => ({ ...prev, freelance: checked }));
        } else {
            setIdentities((prev) => ({
                ...prev,
                [key]: {
                    ...(prev[key] as any),
                    enabled: checked,
                },
            }));
        }
    };

    const handleFieldChange = (key: "employee" | "businessOwner", field: string, value: string) => {
        setIdentities((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const result = await onUpdate({
                work_identities: identities
            });

            if (result.success) {
                toast.success("Work identities updated successfully!");
                onSuccess();
            } else {
                toast.error(result.message || "Failed to update work identities");
            }
        } catch (error) {
            toast.error("Failed to update work identities");
        } finally {
            setSaving(false);
        }
    };

    const inputClasses = "h-[48px] rounded-[15px] border border-[#31A7AC] px-5 text-sm text-black focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/15";

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <p className="text-sm text-[#181818]">
                    Select your applicable work identities within film, media and events production.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-4 text-base text-black">
                        <Checkbox
                            checked={identities.freelance}
                            onCheckedChange={(checked) => handleToggle("freelance")(Boolean(checked))}
                            className="h-[24px] w-[24px] rounded-[6px] border border-[#FA6E80] data-[state=checked]:bg-[#FA6E80] data-[state=checked]:text-white"
                        />
                        Freelancer
                    </label>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl">
                    <label className="flex items-center gap-4 text-base text-black mb-2">
                        <Checkbox
                            checked={identities.employee.enabled}
                            onCheckedChange={(checked) => handleToggle("employee")(Boolean(checked))}
                            className="h-[24px] w-[24px] rounded-[6px] border border-[#FA6E80] data-[state=checked]:bg-[#FA6E80] data-[state=checked]:text-white"
                        />
                        Employee
                    </label>
                    {identities.employee.enabled && (
                        <div className="pl-10 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Input
                                placeholder="Company"
                                className={inputClasses}
                                value={identities.employee.company}
                                onChange={(e) => handleFieldChange("employee", "company", e.target.value)}
                            />
                            <Input
                                placeholder="Designation"
                                className={inputClasses}
                                value={identities.employee.designation}
                                onChange={(e) => handleFieldChange("employee", "designation", e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl">
                    <label className="flex items-center gap-4 text-base text-black mb-2">
                        <Checkbox
                            checked={identities.businessOwner.enabled}
                            onCheckedChange={(checked) => handleToggle("businessOwner")(Boolean(checked))}
                            className="h-[24px] w-[24px] rounded-[6px] border border-[#FA6E80] data-[state=checked]:bg-[#FA6E80] data-[state=checked]:text-white"
                        />
                        Business Owner
                    </label>
                    {identities.businessOwner.enabled && (
                        <div className="pl-10 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Input
                                placeholder="Designation"
                                className={inputClasses}
                                value={identities.businessOwner.designation}
                                onChange={(e) => handleFieldChange("businessOwner", "designation", e.target.value)}
                            />
                            <Input
                                placeholder="Business Name"
                                className={inputClasses}
                                value={identities.businessOwner.businessName}
                                onChange={(e) => handleFieldChange("businessOwner", "businessName", e.target.value)}
                            />
                            <Input
                                placeholder="Business Type"
                                className={inputClasses}
                                value={identities.businessOwner.businessType}
                                onChange={(e) => handleFieldChange("businessOwner", "businessType", e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                    onClick={() => onSuccess()}
                    variant="outline"
                    className="flex-1 py-3 h-12 text-base border-2 border-[#FA6E80] text-[#FA6E80] rounded-2xl bg-transparent"
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="flex-1 py-3 h-12 text-base bg-[#FA6E80] text-white rounded-2xl hover:bg-[#fa5a6e]"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

// --- Visa Tab ---
function VisaTab({ visa, onUpdate, refetch, onSuccess }: { visa: VisaData | null, onUpdate: (data: Partial<VisaData>) => Promise<any>, refetch: () => Promise<void>, onSuccess: () => void }) {
    const [saving, setSaving] = useState(false);
    
    const [nationality, setNationality] = useState("");
    const [visaType, setVisaType] = useState("");
    const [customVisaName, setCustomVisaName] = useState("");
    const [issuedBy, setIssuedBy] = useState("");
    const [passportExpiryDate, setPassportExpiryDate] = useState<Date | undefined>(undefined);
    const [visaExpiryDate, setVisaExpiryDate] = useState<Date | undefined>(undefined);

    const visaTypes = ["Employment Visa", "Family Visa", "Investor Visa", "Partner Visa", "Resident Visa", "Sponsor Visa", "Tourist Visa", "UAE Golden Visa", "Other"];

    useEffect(() => {
        if (visa) {
            setNationality(visa.nationality || "");
            const savedVisaType = visa.visa_type || "";
            
            // Check if saved visa type is in the predefined list
            if (visaTypes.includes(savedVisaType)) {
                setVisaType(savedVisaType);
                setCustomVisaName("");
            } else if (savedVisaType) {
                // If not in list, treat it as "Other" with custom name
                setVisaType("Other");
                setCustomVisaName(savedVisaType);
            } else {
                setVisaType("");
                setCustomVisaName("");
            }
            
            setIssuedBy(visa.visa_issued_by || "");
            setPassportExpiryDate(visa.passport_expiry_date ? new Date(visa.passport_expiry_date) : undefined);
            setVisaExpiryDate(visa.visa_expiry_date ? new Date(visa.visa_expiry_date) : undefined);
        }
    }, [visa]);

    const handleSubmit = async () => {
        // Validate that if "Other" is selected, custom visa name is provided
        if (visaType === "Other" && !customVisaName.trim()) {
            toast.error("Please enter a visa name for 'Other' type");
            return;
        }

        // Determine the final visa type value to save
        const finalVisaType = visaType === "Other" ? customVisaName.trim() : visaType;

        setSaving(true);
        try {
            const result = await onUpdate({
                nationality: nationality || undefined,
                passport_expiry_date: passportExpiryDate ? passportExpiryDate.toISOString().split('T')[0] : undefined,
                visa_type: finalVisaType || undefined,
                visa_issued_by: issuedBy || undefined,
                visa_expiry_date: visaExpiryDate ? visaExpiryDate.toISOString().split('T')[0] : undefined,
            });

            if (result.success) {
                toast.success(result.message);
                // Refetch complete profile to ensure data is synced
                await refetch();
                onSuccess();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Failed to update visa information');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return ""
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <p className="text-sm text-[#181818]">
                    This information may help enhance your visibility for location-based roles or eligibility-specific opportunities.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <label className="text-base font-medium">Nationality & Passport</label>
                    <Input
                        placeholder="Enter your nationality"
                        className="h-[48px] rounded-[15px] border border-[#31A7AC] px-5 text-sm focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                    />
                    
                    <div className="relative">
                        <Input
                            value={passportExpiryDate ? formatDate(passportExpiryDate) : ""}
                            placeholder="Passport expiry date"
                            className="h-[48px] rounded-[15px] border border-[#31A7AC] pr-12 text-sm text-black focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                            readOnly
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#31A7AC] hover:bg-transparent"
                                >
                                    <CalendarIcon className="size-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={passportExpiryDate}
                                    onSelect={setPassportExpiryDate}
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-base font-medium">Visa Details</label>
                    <Select value={visaType} onValueChange={(value) => {
                        setVisaType(value);
                        // Clear custom visa name when switching away from "Other"
                        if (value !== "Other") {
                            setCustomVisaName("");
                        }
                    }}>
                        <SelectTrigger className="h-[48px] w-full rounded-[16px] border border-transparent bg-[#31A7AC] px-[21px] text-sm font-semibold text-white shadow-none focus:ring-2 focus:ring-[#31A7AC]/40 focus:ring-offset-0">
                            <SelectValue placeholder="Select Visa Type" />
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
                    {visaType === "Other" && (
                        <Input
                            placeholder="Enter visa name"
                            className="h-[48px] rounded-[15px] border border-[#31A7AC] px-5 text-sm focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                            value={customVisaName}
                            onChange={(e) => setCustomVisaName(e.target.value)}
                        />
                    )}
                    <Input
                        placeholder="Visa issued by"
                        className="h-[48px] rounded-[15px] border border-[#31A7AC] px-5 text-sm focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                        value={issuedBy}
                        onChange={(e) => setIssuedBy(e.target.value)}
                    />
                    
                    <div className="relative">
                        <Input
                            value={visaExpiryDate ? formatDate(visaExpiryDate) : ""}
                            placeholder="Visa expiry date"
                            className="h-[48px] rounded-[15px] border border-[#31A7AC] pr-12 text-sm text-black focus-visible:border-[#31A7AC] focus-visible:ring-[#31A7AC]/20"
                            readOnly
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#31A7AC] hover:bg-transparent"
                                >
                                    <CalendarIcon className="size-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={visaExpiryDate}
                                    onSelect={setVisaExpiryDate}
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                    onClick={() => onSuccess()}
                    variant="outline"
                    className="flex-1 py-3 h-12 text-base border-2 border-[#FA6E80] text-[#FA6E80] rounded-2xl bg-transparent"
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="flex-1 py-3 h-12 text-base bg-[#FA6E80] text-white rounded-2xl hover:bg-[#fa5a6e]"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}
