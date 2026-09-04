/** Sepadan dengan apps/api/src/modules/user/user.contract.ts. */
export type Role = "owner" | "staff";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  staff: "Staff",
};

export const USER_ERROR: Record<string, string> = {
  "email.invalid": "Alamat surel tidak valid.",
  "email.tooLong": "Alamat surel terlalu panjang.",
  "name.required": "Nama wajib diisi.",
  "name.tooLong": "Nama terlalu panjang.",
  "password.tooShort": "Kata sandi minimal 12 karakter.",
  "password.tooLong": "Kata sandi terlalu panjang.",
  "currentPassword.required": "Kata sandi saat ini wajib diisi.",
};
