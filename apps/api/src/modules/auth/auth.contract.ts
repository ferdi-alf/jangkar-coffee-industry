/**
 * Tipe yang DIBAGI dengan apps/web. Kalau bentuk di sini berubah, typecheck di
 * sisi web ikut berteriak, dan itu memang tujuannya.
 */
export type Role = "owner" | "staff";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  /** Detik sampai access token kedaluwarsa. */
  expiresIn: number;
}
