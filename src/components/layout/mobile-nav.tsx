"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { MobileDiscoverSheet } from "@/components/layout/mobile-discover-sheet";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadCount(!!session);
  const { data: unreadMsgData } = useUnreadMessages(!!session);

  const profileHref = session?.user?.username
    ? `/${session.user.username}`
    : session
    ? "/onboarding"
    : "/sign-in";

  // Determine active tab from pathname
  const isHome = pathname === "/";
  const isSearch = pathname === "/search";
  const isNotifications = pathname === "/notifications";
  const isMessages = pathname.startsWith("/messages");
  const isProfile =
    !!session?.user?.username && pathname === `/${session.user.username}`;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const navLinkClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-3 transition-colors",
      active ? "text-cyan" : "text-muted active:text-foreground"
    );

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden safe-area-bottom">
      <div className="flex">
        {/* Home */}
        <Link href="/" className={navLinkClass(isHome)}>
          <svg className="h-6 w-6" fill={isHome ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isHome ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Search */}
        <Link href="/search" className={navLinkClass(isSearch)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={isSearch ? 2.5 : 2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-medium">Search</span>
        </Link>

        {/* Notifications (auth only) */}
        {session && (
          <Link href="/notifications" className={cn(navLinkClass(isNotifications), "relative")}>
            <svg className="h-6 w-6" fill={isNotifications ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isNotifications ? 0 : 2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] font-medium">Alerts</span>
            {(unreadData?.count ?? 0) > 0 && (
              <span className="absolute right-1/4 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-0.5 text-[9px] font-bold text-black">
                {unreadData!.count > 99 ? "99+" : unreadData!.count}
              </span>
            )}
          </Link>
        )}

        {/* Messages (auth only) */}
        {session && (
          <Link href="/messages" className={cn(navLinkClass(isMessages), "relative")}>
            <svg className="h-6 w-6" fill={isMessages ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isMessages ? 0 : 2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-[10px] font-medium">Messages</span>
            {(unreadMsgData?.count ?? 0) > 0 && (
              <span className="absolute right-1/4 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-0.5 text-[9px] font-bold text-black">
                {unreadMsgData!.count > 99 ? "99+" : unreadMsgData!.count}
              </span>
            )}
          </Link>
        )}

        {/* Profile tab with avatar (auth) / Sign in (non-auth) */}
        {session?.user ? (
          <div ref={menuRef} className="relative flex flex-1 items-center justify-center">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-3 transition-colors",
                isProfile || menuOpen ? "text-cyan" : "text-muted active:text-foreground"
              )}
            >
              {session.user.image ? (
                <div className={cn(
                  "h-6 w-6 overflow-hidden rounded-full ring-2",
                  isProfile || menuOpen ? "ring-cyan" : "ring-transparent"
                )}>
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                    unoptimized={session.user.image.startsWith("/api/")}
                  />
                </div>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span className="text-[10px] font-medium">Profile</span>
            </button>
            {menuOpen && (
              <div className="absolute bottom-full mb-2 right-0 min-w-[200px] rounded-2xl border border-border bg-background py-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Link
                  href={profileHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setDiscoverOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Discover
                </button>
                <Link
                  href="/marketplace"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Marketplace
                </Link>
                <div className="mx-3 my-1 border-t border-border" />
                <Link
                  href="/governance"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Governance
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                <Link
                  href="/extension"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                  Extension
                </Link>
                {session?.user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-card-hover active:bg-card-hover"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin
                  </Link>
                )}
                <div className="mx-3 my-1 border-t border-border" />
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-card-hover active:bg-card-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/sign-in"
            className={navLinkClass(false)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </nav>

    <MobileDiscoverSheet open={discoverOpen} onClose={() => setDiscoverOpen(false)} />
    </>
  );
}
