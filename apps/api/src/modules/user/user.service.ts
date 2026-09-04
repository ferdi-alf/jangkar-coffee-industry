import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";

import type { AdminUser } from "./user.contract.js";
import type { ProfilePatch, UserInput, UserPatch } from "./user.schema.js";
import * as repo from "./user.repository.js";

export class NotFound extends Error {}
export class Conflict extends Error {}
export class Forbidden extends Error {}
export class BadRequest extends Error {}

export function listUsers(supabase: SupabaseClient): Promise<AdminUser[]> {
  return repo.list(supabase);
}

export async function getUser(supabase: SupabaseClient, id: string): Promise<AdminUser> {
  const found = await repo.findById(supabase, id);
  if (!found) throw new NotFound("Pengguna tidak ditemukan.");
  return found;
}

export async function createUser(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: UserInput,
): Promise<{ id: string }> {
  const existing = await repo.findByEmail(supabase, input.email);
  if (existing) throw new Conflict("Alamat surel itu sudah dipakai akun panel lain.");

  const id = await repo.createUser(supabase, input);
  await writeAudit(
    supabase,
    actor,
    "create",
    "admin_user",
    id,
    `Akun ${input.role} untuk ${input.email} dibuat.`,
  );
  return { id };
}

/**
 * TIGA PAGAR, dan ketiganya ada karena panel ini bisa mengunci pemiliknya
 * sendiri di luar.
 *
 *   1. Tidak bisa menurunkan peran diri sendiri.
 *   2. Tidak bisa menonaktifkan diri sendiri.
 *   3. Owner AKTIF TERAKHIR tidak bisa diturunkan maupun dinonaktifkan.
 *
 * Pagar ketiga yang paling penting dan paling mudah terlewat. Dua owner yang
 * saling menurunkan peran, atau satu owner yang menonaktifkan owner lain lalu
 * dirinya sendiri dinonaktifkan orang lain, menghasilkan basis data tanpa satu
 * pun owner aktif. Setelah itu tidak ada seorang pun yang bisa mengembalikannya
 * lewat panel, karena mengembalikannya butuh peran owner. Satu-satunya jalan
 * keluar adalah SQL langsung ke basis data produksi.
 */
export async function updateUser(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  input: UserPatch,
): Promise<void> {
  const target = await repo.findById(supabase, id);
  if (!target) throw new NotFound("Pengguna tidak ditemukan.");

  const losesOwner = input.role !== undefined && input.role !== "owner" && target.role === "owner";
  const getsDeactivated = input.isActive === false && target.isActive;

  if (id === actor.id && losesOwner) {
    throw new Forbidden("Anda tidak bisa menurunkan peran akun Anda sendiri.");
  }
  if (id === actor.id && getsDeactivated) {
    throw new Forbidden("Anda tidak bisa menonaktifkan akun Anda sendiri.");
  }

  if (losesOwner || getsDeactivated) {
    const owners = await repo.activeOwnerCount(supabase);
    if (target.role === "owner" && target.isActive && owners <= 1) {
      throw new Forbidden(
        "Ini owner aktif terakhir. Angkat owner lain lebih dulu, kalau tidak panel akan terkunci untuk semua orang.",
      );
    }
  }

  await repo.updateProfileRow(supabase, id, {
    name: input.name,
    role: input.role,
    isActive: input.isActive,
  });

  if (input.password) await repo.setPassword(supabase, id, input.password);

  /* Ringkasan audit TIDAK PERNAH memuat kata sandinya, hanya fakta bahwa ia
     disetel ulang. */
  const changes = [
    input.name !== undefined ? "nama" : null,
    input.role !== undefined ? `peran jadi ${input.role}` : null,
    input.isActive !== undefined ? (input.isActive ? "diaktifkan" : "dinonaktifkan") : null,
    input.password ? "kata sandi disetel ulang" : null,
  ].filter(Boolean);

  await writeAudit(
    supabase,
    actor,
    "update",
    "admin_user",
    id,
    `Akun ${target.email} diubah: ${changes.join(", ") || "tidak ada perubahan"}.`,
  );
}

export async function deleteUser(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
): Promise<void> {
  const target = await repo.findById(supabase, id);
  if (!target) throw new NotFound("Pengguna tidak ditemukan.");

  if (id === actor.id) throw new Forbidden("Anda tidak bisa menghapus akun Anda sendiri.");

  if (target.role === "owner" && target.isActive) {
    const owners = await repo.activeOwnerCount(supabase);
    if (owners <= 1) {
      throw new Forbidden(
        "Ini owner aktif terakhir. Angkat owner lain lebih dulu, kalau tidak panel akan terkunci untuk semua orang.",
      );
    }
  }

  await repo.removeUser(supabase, id);
  await writeAudit(supabase, actor, "delete", "admin_user", id, `Akun ${target.email} dihapus.`);
}

/**
 * Profil sendiri.
 *
 * Mengganti kata sandi WAJIB menyertakan yang lama, dan itu bukan formalitas:
 * sesi panel hidup di cookie, jadi layar yang ditinggal terbuka di gerai adalah
 * skenario nyata. Tanpa pemeriksaan ini siapa pun yang lewat bisa mengunci
 * pemiliknya keluar dari akunnya sendiri dalam sepuluh detik.
 */
export async function updateProfile(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: ProfilePatch,
): Promise<void> {
  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new BadRequest("Masukkan kata sandi Anda saat ini untuk menggantinya.");
    }
    const ok = await repo.verifyPassword(actor.email, input.currentPassword);
    if (!ok) throw new BadRequest("Kata sandi saat ini salah.");
    if (input.newPassword === input.currentPassword) {
      throw new BadRequest("Kata sandi baru harus berbeda dari yang sekarang.");
    }
    await repo.setPassword(supabase, actor.id, input.newPassword);
  }

  if (input.name !== undefined) {
    await repo.updateProfileRow(supabase, actor.id, { name: input.name });
  }

  const changes = [
    input.name !== undefined ? "nama" : null,
    input.newPassword ? "kata sandi" : null,
  ].filter(Boolean);

  if (changes.length > 0) {
    await writeAudit(
      supabase,
      actor,
      "update",
      "admin_user",
      actor.id,
      `Profil sendiri diubah: ${changes.join(", ")}.`,
    );
  }
}
