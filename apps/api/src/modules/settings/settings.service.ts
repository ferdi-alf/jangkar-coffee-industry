import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";

import type {
  ContactSettings,
  PublicSettings,
  SeoSettings,
  SocialLink,
} from "./settings.contract.js";
import type { ContactPatch, SeoPatch, SocialInput, SocialPatch } from "./settings.schema.js";
import * as repo from "./settings.repository.js";

export class NotFound extends Error {}
export class Conflict extends Error {}

export function getSeo(supabase: SupabaseClient): Promise<SeoSettings> {
  return repo.findSeo(supabase);
}

export async function updateSeo(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: SeoPatch,
): Promise<void> {
  await repo.writeSeo(supabase, input);
  await writeAudit(supabase, actor, "update", "settings", "seo", "Setelan SEO diubah.");
}

export function getContact(supabase: SupabaseClient): Promise<ContactSettings> {
  return repo.findContact(supabase);
}

export async function updateContact(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: ContactPatch,
): Promise<void> {
  await repo.writeContact(supabase, input);
  await writeAudit(supabase, actor, "update", "settings", "contact", "Kontak situs diubah.");
}

export function listSocial(supabase: SupabaseClient): Promise<SocialLink[]> {
  return repo.listSocial(supabase);
}

/**
 * Satu platform hanya boleh punya SATU tautan, dipaksa oleh UNIQUE di migrasi.
 * Ditangkap di sini lebih dulu supaya pemakai panel membaca kalimat yang bisa
 * dimengerti, bukan pesan pelanggaran constraint dari Postgres.
 */
export async function createSocial(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: SocialInput,
): Promise<{ id: string }> {
  const existing = await repo.listSocial(supabase);
  if (existing.some((link) => link.platform === input.platform)) {
    throw new Conflict(`Tautan ${input.platform} sudah ada. Ubah yang lama, jangan tambah baru.`);
  }

  const id = await repo.createSocial(supabase, input);
  await writeAudit(
    supabase,
    actor,
    "create",
    "social_link",
    id,
    `Tautan ${input.platform} ditambahkan.`,
  );
  return { id };
}

export async function updateSocial(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  input: SocialPatch,
): Promise<void> {
  const found = await repo.findSocial(supabase, id);
  if (!found) throw new NotFound("Tautan tidak ditemukan.");

  if (input.platform && input.platform !== found.platform) {
    const existing = await repo.listSocial(supabase);
    if (existing.some((link) => link.platform === input.platform && link.id !== id)) {
      throw new Conflict(`Tautan ${input.platform} sudah ada.`);
    }
  }

  await repo.updateSocial(supabase, id, input);
  await writeAudit(
    supabase,
    actor,
    "update",
    "social_link",
    id,
    `Tautan ${found.platform} diubah.`,
  );
}

export async function deleteSocial(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
): Promise<void> {
  const found = await repo.findSocial(supabase, id);
  if (!found) throw new NotFound("Tautan tidak ditemukan.");
  await repo.removeSocial(supabase, id);
  await writeAudit(
    supabase,
    actor,
    "delete",
    "social_link",
    id,
    `Tautan ${found.platform} dihapus.`,
  );
}

export function getPublic(supabase: SupabaseClient, locale: Locale): Promise<PublicSettings> {
  return repo.publicSettings(supabase, locale);
}
