"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DEMO_USERS, DemoUser, getCurrentUser, setCurrentUser } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/backlog", label: "Backlog" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/backlog/rank", label: "Stack Ranking" },
  { href: "/backlog/activity", label: "Activity" },
  { href: "/backlog/import", label: "Import" },
  { href: "/backlog/admin", label: "Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  PM: "bg-blue-600",
  ADMIN: "bg-purple-600",
  ENGINEERING: "bg-green-700",
  CS: "bg-amber-600",
  SALES: "bg-rose-600",
  IMPLEMENTATION: "bg-cyan-700",
};

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const handler = () => setUser(getCurrentUser());
    window.addEventListener("userChange", handler);
    return () => window.removeEventListener("userChange", handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectUser(u: DemoUser) {
    setCurrentUser(u);
    setUser(u);
    setOpen(false);
    window.dispatchEvent(new Event("storage"));
  }

  function isActive(href: string) {
    if (href === "/backlog") return pathname === "/backlog";
    return pathname.startsWith(href);
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        {/* Logo */}
        <Link href="/backlog" className="text-blue-400 font-bold text-lg tracking-tight shrink-0">
          TCP Backlog
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive(link.href)
                  ? "text-blue-400 border-blue-400"
                  : "text-slate-400 border-transparent hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User switcher */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <span className="text-sm text-slate-200 font-medium">{user.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${ROLE_COLORS[user.role] ?? "bg-slate-600"}`}
            >
              {user.roleLabel}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
                Switch user
              </div>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700 transition-colors ${
                    u.id === user.id ? "bg-slate-700/60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 font-medium truncate">{u.name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full text-white font-medium shrink-0 ${ROLE_COLORS[u.role] ?? "bg-slate-600"}`}
                  >
                    {u.roleLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
