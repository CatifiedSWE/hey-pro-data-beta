"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

const notifications = [
  {
    id: 1,
    title: "New job match",
    description: "Senior Frontend Developer at TechCorp matches your profile",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "Event reminder",
    description: "Tech Networking Meetup starts tomorrow at 6 PM",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    title: "Application update",
    description: "Your application for Product Manager role is under review",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    title: "New message",
    description: "Sarah from HR team sent you a message",
    time: "2 days ago",
    read: true,
  },
  {
    id: 5,
    title: "Profile view",
    description: "5 recruiters viewed your profile this week",
    time: "3 days ago",
    read: true,
  },
]

interface NavigationMenuItem {
  title: string;
  href: string;
}
const navigationMenuItems: NavigationMenuItem[] = [
  { title: "Gigs", href: "/gigs" },
  { title: "What’s on", href: "/whats-on" },
  { title: "Collab", href: "/collab" },
]

export default function Header() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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
              <Link href="/" className="flex items-center shrink-0">
                <img 
                  src="/logo/web-app-manifest-461x161.png" 
                  alt="HeyProData" 
                  className="h-[50px] w-auto object-contain"
                />
              </Link>

              {/* Search Bar - Collapsible */}
              {/* <div className="hidden md:flex items-center shrink-0 ml-2">
                <div className={`relative flex items-center transition-all duration-300 ease-in-out ${searchOpen ? 'w-[160px]' : 'w-[40px]'}`}>
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 h-[34px] w-[34px] bg-[#FA6E80] hover:bg-[#f95569] text-white rounded-full flex items-center justify-center cursor-pointer z-20 ${searchOpen ? 'right-2' : 'right-1'}`}
                    onClick={() => setSearchOpen(!searchOpen)}
                  >
                    <Search className="h-[18px] w-[18px]" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search..."
                    className={`
                      w-full h-[48px] rounded-full text-sm bg-secondary/80 border-none focus-visible:ring-accent
                      transition-all duration-300 ease-in-out
                      ${searchOpen ? 'pl-3 pr-10 opacity-100' : 'pl-0 pr-0 opacity-0 pointer-events-none'}
                    `}
                  />
                </div>
              </div> */}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <NavigationMenu>
                <NavigationMenuList className="flex-wrap flex-nowrap">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/crew">Crew</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
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
              <div
                className="relative"
                onMouseLeave={() => setChatOpen(false)}
              >
                <Link href="/inbox"

                  className="relative cursor-pointer"
                >
                  <MessageCircleMore className="h-9 w-9" />
                  <Badge className="absolute top-6 right-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-xs bg-[#FA596E] text-white">

                  </Badge>
                </Link>


              </div>

              <div
                className="relative hidden md:block"
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
                        {notifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No notifications</p>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg mb-2 cursor-pointer hover:bg-secondary/50 ${!notification.read ? "bg-accent/10" : ""
                                }`}
                            >
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground">{notification.description}</p>
                              <span className="text-xs text-muted-foreground">{notification.time}</span>
                            </div>
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
                <div
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  onMouseEnter={() => setUserMenuOpen(true)}
                  className="cursor-pointer"
                >
                  <Avatar className="h-[50px] w-[50px] rounded-full border-[#000000] border-[2px]">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
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
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base" asChild>
                          <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="">
                            <span className="font-[400]">
                              Profile
                            </span>

                          </Link>
                        </Button>
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
{/*  settings
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base" asChild>
                          <Link href="/settings" onClick={() => setUserMenuOpen(false)}>
                            <span className="font-[400]">
                              Settings
                            </span>
                          </Link>
                        </Button>
                         */}
                        
                        
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

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around px-6 py-3">
          <Link
            href="/crew"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChatOpen(false)
              setNotificationOpen(false)
              setUserMenuOpen(false)
            }}
          >
            <Compass className="h-6 w-6" />
          </Link>

          {/* <Link
            href="/gigs"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChatOpen(false)
              setNotificationOpen(false)
              setUserMenuOpen(false)
            }}
          >
            <Briefcase className="h-6 w-6" />
          </Link>
          <Link
            href="/collab"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChatOpen(false)
              setNotificationOpen(false)
              setUserMenuOpen(false)
            }}
          >
            <Calendar className="h-6 w-6" />
          </Link>
          <Link
            href="/whats-on"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChatOpen(false)
              setNotificationOpen(false)
              setUserMenuOpen(false)
            }}
          >
            <NewspaperIcon className="h-6 w-6" />
          </Link>
          <Link
            href="/slate"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChatOpen(false)
              setNotificationOpen(false)
              setUserMenuOpen(false)
            }}
          >
            <SatelliteDishIcon className="h-6 w-6" />
          </Link> */}
        </div>
      </div>
    </>
  )
}
