import type { Role } from "../../shared/middleware/auth.js";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type { Role };
