"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Save, Mail, Phone, Bell, Shield, Send, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/supabase/client";
import axios from "axios";

interface NotificationPreferences {
    emailNotifications: boolean;
    applicationUpdates: boolean;
    collabInvites: boolean;
    eventReminders: boolean;
}

interface PrivacySettings {
    profileVisibility: 'public' | 'private' | 'connections';
    showEmail: boolean;
    showPhone: boolean;
}

export default function SettingsPage() {
    const router = useRouter();

    // Loading States
    const [loading, setLoading] = useState(true);
    const [savingAccount, setSavingAccount] = useState(false);
    const [sendingResetEmail, setSendingResetEmail] = useState(false);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Account Information State
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [firstName, setFirstName] = useState("");
    const [surname, setSurname] = useState("");
    const [isEditingAccount, setIsEditingAccount] = useState(false);

    // Notification Preferences State
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
        emailNotifications: true,
        applicationUpdates: true,
        collabInvites: true,
        eventReminders: true,
    });

    // Privacy Settings State
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
    });

    // Account Deletion State
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    // Fetch user settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            
            if (!token) {
                toast.error("Authentication required");
                router.push("/login");
                return;
            }

            const response = await axios.get("/api/settings", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                const data = response.data.data;
                setEmail(data.email || "");
                setPhone(data.phone || "");
                setFirstName(data.firstName || "");
                setSurname(data.surname || "");
                setNotificationPreferences(data.notificationPreferences);
                setPrivacySettings(data.privacySettings);
            }
        } catch (error: any) {
            console.error("Failed to fetch settings:", error);
            toast.error(error.response?.data?.error || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAccountInfo = async () => {
        try {
            setSavingAccount(true);
            const token = await getAccessToken();
            
            if (!token) {
                toast.error("Authentication required");
                return;
            }

            const response = await axios.patch(
                "/api/settings",
                { email, phone },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Account information updated successfully!");
                setIsEditingAccount(false);
            }
        } catch (error: any) {
            console.error("Failed to update account:", error);
            toast.error(error.response?.data?.error || "Failed to update account information");
        } finally {
            setSavingAccount(false);
        }
    };

    const handleRequestPasswordReset = async () => {
        try {
            setSendingResetEmail(true);
            const token = await getAccessToken();
            
            if (!token) {
                toast.error("Authentication required");
                return;
            }

            const response = await axios.post(
                "/api/settings/request-password-reset",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Password reset link sent to your email!");
            }
        } catch (error: any) {
            console.error("Failed to send reset email:", error);
            toast.error(error.response?.data?.error || "Failed to send password reset email");
        } finally {
            setSendingResetEmail(false);
        }
    };

    const handleSavePreferences = async () => {
        try {
            setSavingPreferences(true);
            const token = await getAccessToken();
            
            if (!token) {
                toast.error("Authentication required");
                return;
            }

            const response = await axios.patch(
                "/api/settings",
                {
                    notificationPreferences,
                    privacySettings,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Preferences updated successfully!");
            }
        } catch (error: any) {
            console.error("Failed to update preferences:", error);
            toast.error(error.response?.data?.error || "Failed to update preferences");
        } finally {
            setSavingPreferences(false);
        }
    };

    const handleAccountDeletion = async () => {
        if (deleteConfirmation !== "DELETE") {
            toast.error('Please type "DELETE" to confirm');
            return;
        }

        try {
            setDeletingAccount(true);
            const token = await getAccessToken();
            
            if (!token) {
                toast.error("Authentication required");
                return;
            }

            const response = await axios.delete("/api/settings/delete-account", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    confirmation: deleteConfirmation,
                },
            });

            if (response.data.success) {
                toast.success("Account deleted successfully");
                // Redirect to home page after a short delay
                setTimeout(() => {
                    router.push("/");
                }, 2000);
            }
        } catch (error: any) {
            console.error("Failed to delete account:", error);
            toast.error(error.response?.data?.error || "Failed to delete account");
        } finally {
            setDeletingAccount(false);
            setDeleteConfirmation("");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#6A89BE]" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] bg-clip-text text-transparent">
                    Settings
                </h1>
                <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
            </div>

            <div className="space-y-6">
                {/* Account Information */}
                <Card className="p-6 border-gray-200 bg-white" data-testid="account-info-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Account Information</h2>
                        {!isEditingAccount && (
                            <Button
                                onClick={() => setIsEditingAccount(true)}
                                variant="outline"
                                size="sm"
                                className="border-[#6A89BE] text-[#6A89BE] hover:bg-[#6A89BE] hover:text-white"
                                data-testid="edit-account-button"
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email Address
                            </Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!isEditingAccount}
                                    className="pl-10 disabled:bg-[#F8F8F8] disabled:cursor-not-allowed"
                                    data-testid="email-input"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Note: Changing your email will require verification
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                Phone Number
                            </Label>
                            <div className="relative mt-1">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!isEditingAccount}
                                    className="pl-10 disabled:bg-[#F8F8F8] disabled:cursor-not-allowed"
                                    data-testid="phone-input"
                                />
                            </div>
                        </div>

                        {isEditingAccount && (
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={handleSaveAccountInfo}
                                    disabled={savingAccount}
                                    className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-white hover:opacity-90"
                                    data-testid="save-account-button"
                                >
                                    {savingAccount ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsEditingAccount(false);
                                        fetchSettings(); // Reset to original values
                                    }}
                                    variant="outline"
                                    disabled={savingAccount}
                                    data-testid="cancel-edit-button"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Password Management */}
                <Card className="p-6 border-gray-200 bg-white" data-testid="password-management-card">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Password Management
                    </h2>
                    <Separator className="mb-4" />
                    
                    {/* Send Password Reset Email */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700">Reset Your Password</h3>
                        <p className="text-sm text-gray-600">
                            We'll send a password reset link to your email address
                        </p>
                        <Button
                            onClick={handleRequestPasswordReset}
                            disabled={sendingResetEmail}
                            className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-white hover:opacity-90"
                            data-testid="send-reset-email-button"
                        >
                            {sendingResetEmail ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Password Reset Email
                        </Button>
                    </div>
                </Card>

                {/* Notification Preferences */}
                <Card className="p-6 border-gray-200 bg-white" data-testid="notification-preferences-card">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </h2>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-notifications" className="text-sm font-medium">
                                    Email Notifications
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Receive notifications via email
                                </p>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={notificationPreferences.emailNotifications}
                                onCheckedChange={(checked) =>
                                    setNotificationPreferences({
                                        ...notificationPreferences,
                                        emailNotifications: checked,
                                    })
                                }
                                data-testid="email-notifications-switch"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="application-updates" className="text-sm font-medium">
                                    Application Updates
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Get notified about job application status changes
                                </p>
                            </div>
                            <Switch
                                id="application-updates"
                                checked={notificationPreferences.applicationUpdates}
                                onCheckedChange={(checked) =>
                                    setNotificationPreferences({
                                        ...notificationPreferences,
                                        applicationUpdates: checked,
                                    })
                                }
                                data-testid="application-updates-switch"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="collab-invites" className="text-sm font-medium">
                                    Collaboration Invites
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Receive notifications for collaboration opportunities
                                </p>
                            </div>
                            <Switch
                                id="collab-invites"
                                checked={notificationPreferences.collabInvites}
                                onCheckedChange={(checked) =>
                                    setNotificationPreferences({
                                        ...notificationPreferences,
                                        collabInvites: checked,
                                    })
                                }
                                data-testid="collab-invites-switch"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="event-reminders" className="text-sm font-medium">
                                    Event Reminders
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Get reminders for upcoming events you've RSVP'd to
                                </p>
                            </div>
                            <Switch
                                id="event-reminders"
                                checked={notificationPreferences.eventReminders}
                                onCheckedChange={(checked) =>
                                    setNotificationPreferences({
                                        ...notificationPreferences,
                                        eventReminders: checked,
                                    })
                                }
                                data-testid="event-reminders-switch"
                            />
                        </div>

                        <Button
                            onClick={handleSavePreferences}
                            disabled={savingPreferences}
                            className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-white hover:opacity-90 mt-4"
                            data-testid="save-preferences-button"
                        >
                            {savingPreferences ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Preferences
                        </Button>
                    </div>
                </Card>

                {/* Privacy Settings */}
                <Card className="p-6 border-gray-200 bg-white" data-testid="privacy-settings-card">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy Settings
                    </h2>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="profile-visibility" className="text-sm font-medium">
                                Profile Visibility
                            </Label>
                            <select
                                id="profile-visibility"
                                value={privacySettings.profileVisibility}
                                onChange={(e) =>
                                    setPrivacySettings({
                                        ...privacySettings,
                                        profileVisibility: e.target.value as 'public' | 'private' | 'connections',
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6A89BE]"
                                data-testid="profile-visibility-select"
                            >
                                <option value="public">Public - Anyone can view your profile</option>
                                <option value="connections">Connections Only - Only your connections can view</option>
                                <option value="private">Private - Only you can view your profile</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="show-email" className="text-sm font-medium">
                                    Show Email on Profile
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Make your email address visible to others
                                </p>
                            </div>
                            <Switch
                                id="show-email"
                                checked={privacySettings.showEmail}
                                onCheckedChange={(checked) =>
                                    setPrivacySettings({
                                        ...privacySettings,
                                        showEmail: checked,
                                    })
                                }
                                data-testid="show-email-switch"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="show-phone" className="text-sm font-medium">
                                    Show Phone on Profile
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Make your phone number visible to others
                                </p>
                            </div>
                            <Switch
                                id="show-phone"
                                checked={privacySettings.showPhone}
                                onCheckedChange={(checked) =>
                                    setPrivacySettings({
                                        ...privacySettings,
                                        showPhone: checked,
                                    })
                                }
                                data-testid="show-phone-switch"
                            />
                        </div>

                        <Button
                            onClick={handleSavePreferences}
                            disabled={savingPreferences}
                            className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-white hover:opacity-90 mt-4"
                            data-testid="save-privacy-button"
                        >
                            {savingPreferences ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Privacy Settings
                        </Button>
                    </div>
                </Card>

                {/* Account Deletion */}
                <Card className="p-6 border-red-200 bg-red-50/50" data-testid="account-deletion-card">
                    <h2 className="text-xl font-semibold text-red-700 mb-4">Danger Zone</h2>
                    <Separator className="mb-4 bg-red-200" />
                    
                    <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <p className="text-sm text-gray-700 font-semibold">
                            This will permanently delete:
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                            <li>Your profile and personal information</li>
                            <li>All your gig postings and applications</li>
                            <li>Collaboration posts and projects</li>
                            <li>Social media posts and interactions</li>
                            <li>Event RSVPs and created events</li>
                            <li>All associated data</li>
                        </ul>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700 mt-4"
                                    data-testid="delete-account-trigger"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-testid="delete-account-dialog">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-3">
                                        <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
                                        <div className="pt-2">
                                            <Label htmlFor="delete-confirm" className="text-sm font-medium text-gray-700">
                                                Type <span className="font-bold">DELETE</span> to confirm
                                            </Label>
                                            <Input
                                                id="delete-confirm"
                                                value={deleteConfirmation}
                                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                placeholder="Type DELETE"
                                                className="mt-2"
                                                data-testid="delete-confirmation-input"
                                            />
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel 
                                        onClick={() => setDeleteConfirmation("")} 
                                        disabled={deletingAccount}
                                        data-testid="cancel-delete-button"
                                    >
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleAccountDeletion}
                                        disabled={deletingAccount}
                                        className="bg-red-600 hover:bg-red-700"
                                        data-testid="confirm-delete-button"
                                    >
                                        {deletingAccount ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : null}
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            </div>
        </div>
    );
}
