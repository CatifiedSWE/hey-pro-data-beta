"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import apiCalling from "@/lib/apiCalling"
import type { ProfileData } from "@/contexts/ProfileContext"
import LocationAutocomplete from "@/components/LocationAutocomplete"

interface EditProfileInfoProps {
    profile: ProfileData | null;
    trigger: React.ReactNode;
}

export default function ProfileEditor({ profile, trigger }: EditProfileInfoProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [firstName, setFirstName] = useState(profile?.first_name || '')
    const [surname, setSurname] = useState(profile?.surname || '')
    const [aliasFirstName, setAliasFirstName] = useState(profile?.alias_first_name || '')
    const [aliasSurname, setAliasSurname] = useState(profile?.alias_surname || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [city, setCity] = useState(profile?.city || '')
    const [country, setCountry] = useState(profile?.country || '')

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const response = await apiCalling({
                method: 'patch',
                route: '/profile',
                data: {
                    first_name: firstName,
                    surname: surname,
                    alias_first_name: aliasFirstName || null,
                    alias_surname: aliasSurname || null,
                    bio: bio,
                    city: city,
                    country: country
                }
            });

            if (response.status) {
                toast.success("Profile updated successfully!");
                setIsDialogOpen(false);
                // Refresh the page to show updated data
                window.location.reload();
            } else {
                toast.error(response.message || "Failed to update profile");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    }

    const handleCancel = () => {
        // Reset state to initial values
        setFirstName(profile?.first_name || '');
        setSurname(profile?.surname || '');
        setAliasFirstName(profile?.alias_first_name || '');
        setAliasSurname(profile?.alias_surname || '');
        setBio(profile?.bio || '');
        setCity(profile?.city || '');
        setCountry(profile?.country || '');
        setIsDialogOpen(false);
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[500px] mx-auto h-[90vh] flex flex-col">
                <DialogHeader className="p-2 sm:p-3 md:p-5 pb-1">
                    <DialogTitle className="text-2xl font-normal">Edit Profile info</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        You can write about your years of experience, industry, or skills. People also talk about their
                        achievements or previous job experiences.
                    </p>
                </DialogHeader>

                <div className="flex-1  overflow-y-auto px-6 sm:px-8 md:px-10">
                    <div className="space-y-6">
                        {/* First Name */}
                        <div className="space-y-2 flex flex-col">
                            <label className="text-base font-normal">First Name</label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="h-12 rounded-2xl border-gray-400 focus:border-none focus:outline-none focus:ring-none text-base"
                                placeholder="Enter your first name"
                            />
                        </div>

                        {/* Surname */}
                        <div className="space-y-2">
                            <label className="text-base font-normal">Surname</label>
                            <Input
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                className="h-12 rounded-2xl border-gray-400 text-base"
                                placeholder="Enter your surname"
                            />
                        </div>

                        {/* Alias First Name */}
                        <div className="space-y-2">
                            <label className="text-base font-normal">Alias First Name (Optional)</label>
                            <Input
                                value={aliasFirstName}
                                onChange={(e) => setAliasFirstName(e.target.value)}
                                className="h-12 rounded-2xl border-gray-400 text-base"
                                placeholder="Enter display name if different"
                            />
                        </div>

                        {/* Alias Surname */}
                        <div className="space-y-2">
                            <label className="text-base font-normal">Alias Surname (Optional)</label>
                            <Input
                                value={aliasSurname}
                                onChange={(e) => setAliasSurname(e.target.value)}
                                className="h-12 rounded-2xl border-gray-400 text-base"
                                placeholder="Enter display surname if different"
                            />
                        </div>

                        {/* Country */}
                        <div className="space-y-2">
                            <label className="text-base font-normal">Country</label>
                            <LocationAutocomplete
                                value={country}
                                onChange={(value) => {
                                    setCountry(value);
                                    // Clear city when country changes
                                    if (country !== value) {
                                        setCity('');
                                    }
                                }}
                                placeholder="Enter your country"
                                type="country"
                                className="h-12 rounded-2xl border-2 border-gray-400 text-base focus:outline-none focus:border-[#FA6E80] focus:ring-2 focus:ring-[#FA6E80]/20 transition-colors"
                            />
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <label className="text-base font-normal">City</label>
                            <LocationAutocomplete
                                value={city}
                                onChange={setCity}
                                placeholder="Enter your city"
                                type="city"
                                selectedCountry={country}
                                className="h-12 rounded-2xl border-2 border-gray-400 text-base focus:outline-none focus:border-[#FA6E80] focus:ring-2 focus:ring-[#FA6E80]/20 transition-colors"
                            />
                        </div>

                        {/* Bio */}
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
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 p-2 sm:p-3 md:p-4 pt-6 ">
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1 py-3 h-15 text-lg border-2 border-[#FA6E80] text-[#FA6E80]  rounded-2xl bg-transparent"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveChanges}
                        className="flex-1 py-3 h-15 text-lg bg-[#FA6E80] text-white rounded-2xl"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
