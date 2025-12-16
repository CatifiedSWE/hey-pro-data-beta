"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  X,
  Bell,
  Briefcase,
  MessageCircleMore,
  Compass,
  Calendar,
  NewspaperIcon,
  SatelliteDishIcon,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { useNotifications } from "@/hooks/useNotifications"
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount"
import { formatDistanceToNow } from "date-fns"
import supabase from "@/lib/supabase/client"

interface NavigationMenuItem {
  title: string;
  href: string;
}
const navigationMenuItems: NavigationMenuItem[] = [
  { title: "Gigs", href: "/gigs" },
  { title: "What’s on", href: "/whats-on" },
  { title: "Collab", href: "/collab" },
]

function CrewIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
      <path d="M360-240ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q32 0 64.5 3.5T489-425q-13 17-22.5 35.5T451-351q-23-5-45.5-7t-45.5-2q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32h323q4 22 11 42t18 38H40Zm320-320q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113Zm-400 80q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm320 440q34 0 56.5-20t23.5-60q1-34-22.5-57T680-360q-34 0-57 23t-23 57q0 34 23 57t57 23Zm0 80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 43.5T818-198L920-96l-56 56-102-102q-18 11-38.5 16.5T680-120Z"/>
    </svg>
  )
}

export default function Header() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead } = useNotifications()
  const { unreadCount: chatUnreadCount } = useChatUnreadCount()
  const router = useRouter()
  const pathname = usePathname()

  const isProfilePage = pathname === '/profile'

  // Refresh notifications when dropdown opens (with debouncing)
  useEffect(() => {
    if (notificationOpen) {
      // Small delay to prevent immediate refetch if already fetched recently
      const timer = setTimeout(() => {
        fetchNotifications()
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationOpen]) // Removed fetchNotifications dependency to prevent unnecessary refetches

  // Optional: Real-time notification updates via Supabase Realtime
  // OPTIMIZED: Only subscribe once per user, not on every fetchNotifications change
  useEffect(() => {
    if (!user) return
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Fetch notifications when a new one arrives
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh when notifications are updated (e.g., marked as read)
          fetchNotifications()
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only re-subscribe when user ID changes

  const handleSignOut = async () => {
    await signOut()
    router.push('/onboarding')
  }

  // Determine display values
  const displayName = profile?.first_name && profile?.surname
    ? `${profile.first_name} ${profile.surname}`
    : user?.user_metadata?.full_name || 'User'

  const avatarUrl = profile?.profile_photo_url || user?.user_metadata?.avatar_url || '/default-profile.png'

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <nav className="fixed top-0  h-[80px] z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-[1080px]">
          <div className="flex h-18 items-center justify-between gap-2">
            {/* Logo & Search Group */}
            <div className="flex items-center gap-2">
              {/* Logo */}
              <Link href="/profile" className="flex items-center shrink-0">
                <img 
                  src="/logo/web-app-manifest-461x161.png" 
                  alt="HeyProData" 
                  className="h-[50px] w-auto object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <NavigationMenu>
                <NavigationMenuList className="flex-wrap flex-nowrap">
                  {/* <NavigationMenuItem>
                    <div className="flex">
                      {navigationMenuItems.map((item) => (
                        <NavigationMenuLink
                          key={item.title}
                          asChild
                          className={navigationMenuTriggerStyle()}
                        >
                          <Link href={item.href}>{item.title}</Link>
                        </NavigationMenuLink>
                      ))}
                    </div>

                  </NavigationMenuItem> */}
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-white hover:text-white px-4 py-2 rounded-full"
                    >
                      {/* <Link href="/slate">Slate</Link> */}
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                </NavigationMenuList>
              </NavigationMenu>



            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Link href="/crew" className="relative cursor-pointer text-muted-foreground hover:text-foreground">
                 <CrewIcon className="h-9 w-9" />
              </Link>

              <div
                className="relative"
                onMouseLeave={() => setChatOpen(false)}
              >
                <Link href="/inbox"
                  className="relative cursor-pointer"
                >
                  <MessageCircleMore className="h-9 w-9" />
                  {chatUnreadCount > 0 && (
                    <Badge className="absolute top-6 right-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-xs bg-[#FA596E] text-white">
                    </Badge>
                  )}
                </Link>
              </div>

              <div
                className="relative"
                onMouseLeave={() => setNotificationOpen(false)}
              >
                <div
                  onMouseEnter={() => setNotificationOpen(true)}
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  aria-label="Notifications"
                  className="relative h-9 w-9 cursor-pointer"
                >
                  <Bell className="h-9 w-9" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#FA596E] text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </div>

                {notificationOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-50">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">Notifications</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setNotificationOpen(false)}
                            aria-label="Close notifications"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                        <Separator className="mb-2" />
                        {loading ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                        ) : notifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
                        ) : (
                          notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={
                                notification.metadata?.conversation_id
                                  ? `/inbox/c/${notification.metadata.conversation_id}`
                                  : '#'
                              }
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsRead(notification.id)
                                }
                                setNotificationOpen(false)
                              }}
                              className={`block p-3 rounded-lg mb-2 cursor-pointer hover:bg-secondary/50 ${
                                !notification.isRead ? "bg-accent/10" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {notification.actor?.avatar && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={notification.actor.avatar} alt={notification.actor.name} />
                                    <AvatarFallback>{notification.actor.name?.[0] || 'U'}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">
                                    {notification.title || notification.type.replace(/_/g, ' ')}
                                  </h4>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {notification.message}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                {!notification.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                                )}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div
                className="relative"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                {/* Desktop: Hover for menu, Click for profile */}
                <div className="hidden md:block">
                    <div
                        onMouseEnter={() => setUserMenuOpen(true)}
                        className="cursor-pointer"
                    >
                        <Link href="/profile">
                            <Avatar className="h-[50px] w-[50px] rounded-full border-[#000000] border-[2px]">
                                <AvatarImage src={avatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                            </Avatar>
                        </Link>
                    </div>
                </div>

                {/* Mobile: Logic based on page */}
                <div className="md:hidden">
                    {isProfilePage ? (
                        <div 
                            onClick={() => setUserMenuOpen((prev) => !prev)}
                            className="cursor-pointer flex items-center justify-center h-[50px] w-[50px]"
                        >
                            <MoreVertical className="h-6 w-6" />
                        </div>
                    ) : (
                        <Link href="/profile">
                            <Avatar className="h-[50px] w-[50px] rounded-full border-[#000000] border-[2px]">
                                <AvatarImage src={avatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                            </Avatar>
                        </Link>
                    )}
                </div>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-0 w-[199px] h-[358px]  bg-background border border-border rounded-[15px] shadow-lg z-50 p-4">
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserMenuOpen(false)}
                          aria-label="Close user menu"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex flex-col items-center  ">
                        <div className="relative -mt-3 ">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-1 right-10 block h-[10px] w-[10px] border-[1px] rounded-full bg-[#34A353] ring-2 ring-background" />
                        </div>
                        <p className="font-[500] text-lg text-center truncate w-full px-2">{displayName}</p>
                      </div>
                      <div className="-space-y-5">
                        {!isProfilePage && (
                            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base" asChild>
                            <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="">
                                <span className="font-[400]">
                                Profile
                                </span>

                            </Link>
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base" asChild>
                          <Link href="/saved" onClick={() => setUserMenuOpen(false)}>
                            <span className="font-[400]">
                              Saved
                            </span>
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base" asChild>
                          <Link href="/help" onClick={() => setUserMenuOpen(false)}>
                            <span className="font-[400]">
                              Help
                            </span>
                          </Link>
                        </Button>

                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base" asChild>
                          <Link href="/settings" onClick={() => setUserMenuOpen(false)}>
                            <span className="font-[400]">
                              Settings
                            </span>
                          </Link>
                        </Button>
                        
                        
                        
                        <Separator className="mt-2 mb-0" />
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 text-base"
                          onClick={() => {
                            setUserMenuOpen(false)
                            handleSignOut()
                          }}
                        >
                          <span className="font-[400]">
                            Sign Out
                          </span>


                        </Button>
                      </div>
                      {/* <div className="group relative flex w-[141px] h-[41px] items-center mx-auto justify-center overflow-hidden rounded-[10px] p-[1px]">
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC]" />
                        <Button className="relative flex h-full w-full items-center justify-center gap-3 rounded-[inherit] bg-white text-transparent shadow-none hover:bg-gray-50 dark:bg-slate-950 dark:hover:bg-slate-900">
                          <span className="bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] bg-clip-text text-transparent">
                            Send Invite
                          </span>

                        </Button>
                      </div> */}
                    </div>
                  </>
                )}
              </div>
            </div>


          </div>
        </div>
      </nav>
    </>
  )
}
