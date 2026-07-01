"use client";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: "pm-1", name: "Sarah Mitchell", email: "sarah.mitchell@tcpsoftware.com", role: "PM", roleLabel: "Product Manager" },
  { id: "pm-2", name: "Alex Kim", email: "alex.kim@tcpsoftware.com", role: "PM", roleLabel: "Product Manager" },
  { id: "eng-1", name: "Ryan Chen", email: "ryan.chen@tcpsoftware.com", role: "ENGINEERING", roleLabel: "Engineering" },
  { id: "exec-1", name: "Dana Wu", email: "dana.wu@tcpsoftware.com", role: "ADMIN", roleLabel: "Admin" },
  { id: "cs-1", name: "Jessica Torres", email: "jessica.torres@tcpsoftware.com", role: "CS", roleLabel: "Customer Success" },
  { id: "sales-1", name: "Mark Johnson", email: "mark.johnson@tcpsoftware.com", role: "SALES", roleLabel: "Sales" },
  { id: "impl-1", name: "Priya Patel", email: "priya.patel@tcpsoftware.com", role: "IMPLEMENTATION", roleLabel: "Implementation" },
];

const KEY = "tcp_backlog_user";

export function getCurrentUser(): DemoUser {
  if (typeof window === "undefined") return DEMO_USERS[0];
  const stored = localStorage.getItem(KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* ignore */ }
  }
  return DEMO_USERS[0];
}

export function setCurrentUser(user: DemoUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("userChange"));
}

export function isStakeholder(role: string) {
  return ["CS", "SALES", "IMPLEMENTATION"].includes(role);
}

export function isPM(role: string) {
  return ["PM", "ADMIN"].includes(role);
}
