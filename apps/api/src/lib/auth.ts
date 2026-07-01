import { Request } from "express";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export function getUser(req: Request): AuthUser {
  return {
    id: req.headers["x-user-id"] as string ?? "anon",
    name: req.headers["x-user-name"] as string ?? "Anonymous",
    role: req.headers["x-user-role"] as string ?? "STAKEHOLDER",
  };
}

export function isPM(role: string) {
  return ["PM", "ADMIN"].includes(role);
}

export function isStakeholder(role: string) {
  return ["CS", "SALES", "IMPLEMENTATION", "STAKEHOLDER"].includes(role);
}
