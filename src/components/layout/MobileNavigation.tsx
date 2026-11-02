
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  House,
  Compass,
  PlusSquare,
  MessageCircle,
  UserRound,
  Menu,
  X,
  Bell,
  Bookmark,
  Settings,
  Users,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export function MobileNavigation() {
  const path = usePathname();
  const { user, requireAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const profileHref = user ? `/profile/${user.username}` : "/login";

  const items = [
    { href: "/", label: "Home", icon: House },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/upload", label: "Create", icon: PlusSquare },
    { href: "/messages", label: "Inbox", icon: MessageCircle },
    { href: profileHref, label: "You", icon: UserRound },
  ];

  function closeMenu() {
    setMenuOpen(false);
  }

  function protectRoute(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (!user && ["/upload", "/messages", "/following"].includes(href)) {
      event.preventDefault();
      closeMenu();
      requireAuth(href);
    }
  }

  return (
    <>
      {menuOpen && (
        <>
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />

          <section className="mobile-menu-panel" aria-label="More navigation">
            <div className="mobile-menu-heading">
              <strong>More</strong>
              <button
                type="button"
                className="icon-button"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {[
              { href: "/following", label: "Following", icon: Users },
              { href: "/notifications", label: "Notifications", icon: Bell },
              { href: "/saved", label: "Saved moments", icon: Bookmark },
              { href: "/settings", label: "Settings and privacy", icon: Settings },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="mobile-menu-link"
                onClick={(event) => {
                  protectRoute(event, href);
                  if (!event.defaultPrevented) closeMenu();
                }}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}

            {!user && (
              <Link
                href="/login"
                className="mobile-menu-link"
                onClick={closeMenu}
              >
                <UserRound size={20} />
                Sign in
              </Link>
            )}
          </section>
        </>
      )}

      <nav className="mobile-bottom" aria-label="Mobile navigation">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

          return (
            <Link
              key={label}
              href={href}
              onClick={(event) => {
                protectRoute(event, href);
              }}
              className={`mobile-nav-item ${active ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`mobile-nav-item mobile-more-trigger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label="More options"
        >
          <Menu size={21} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
