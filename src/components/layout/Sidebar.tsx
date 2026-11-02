
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  Compass,
  Users,
  MessageCircle,
  Bookmark,
  Bell,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const mainLinks = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/following", label: "Following", icon: Users },
];

const personalLinks = [
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setMoreOpen(false);

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Could not sign out:", error);
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}
      aria-label="Main navigation"
    >
      <button
        type="button"
        className="sidebar-collapse-button"
        onClick={() => {
          setCollapsed((value) => !value);
          setMoreOpen(false);
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={19}
          className={collapsed ? "sidebar-expand-icon" : ""}
        />
      </button>

      <nav className="nav-list" aria-label="Main">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-section">
        <p className="nav-label">YOUR SPACE</p>

        <nav className="nav-list" aria-label="Your space">
          {personalLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            href="/settings"
            className={`nav-link ${isActive("/settings") ? "active" : ""}`}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={21} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      <div className="sidebar-more-wrapper">
        {moreOpen && (
          <>
            <button
              type="button"
              className="sidebar-menu-backdrop"
              aria-label="Close menu"
              onClick={() => setMoreOpen(false)}
            />

            <div className="sidebar-more-menu">
              <Link
                href="/settings"
                onClick={() => setMoreOpen(false)}
              >
                <Settings size={18} />
                Settings
              </Link>

              <Link
                href="/saved"
                onClick={() => setMoreOpen(false)}
              >
                <Bookmark size={18} />
                Saved moments
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                >
                  <LogOut size={18} />
                  {loggingOut ? "Signing out..." : "Log out"}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMoreOpen(false)}
                >
                  <LogOut size={18} />
                  Sign in
                </Link>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          className={`nav-link sidebar-more-button ${
            moreOpen ? "active" : ""
          }`}
          onClick={() => setMoreOpen((value) => !value)}
          aria-expanded={moreOpen}
          aria-label="More options"
          title={collapsed ? "More" : undefined}
        >
          {moreOpen ? <X size={21} /> : <MoreHorizontal size={21} />}
          <span>More</span>
        </button>
      </div>
    </aside>
  );
}
