import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";

import type { ContentSection, PublicContent } from "./content.contract.js";
import type { ContentPatch } from "./content.schema.js";
import * as repo from "./content.repository.js";

export class NotFound extends Error {}

export const listSections = (supabase: SupabaseClient): Promise<ContentSection[]> =>
  repo.listSections(supabase);

export const getPublicContent = (
  supabase: SupabaseClient,
  locale: Locale,
): Promise<PublicContent> => repo.publicContent(supabase, locale);

export async function getSection(supabase: SupabaseClient, key: string): Promise<ContentSection> {
  const found = await repo.findSection(supabase, key);
  if (!found) throw new NotFound("Seksi konten tidak ditemukan.");
  return found;
}

export async function updateSection(
  supabase: SupabaseClient,
  actor: AuthUser,
  key: string,
  input: ContentPatch,
): Promise<void> {
  const section = await repo.findSection(supabase, key);
  if (!section) throw new NotFound("Seksi konten tidak ditemukan.");

  /* Medan yang dikirim harus benar-benar MILIK seksi ini. Tanpa pemeriksaan
     ini, satu permintaan ke /content/hero bisa menulis medan milik seksi lain
     hanya dengan menyebut id-nya, dan pagar peran per seksi jadi tak berarti. */
  const owned = new Set(section.fields.map((f) => f.id));
  const stray = input.fields.filter((f) => !owned.has(f.id));
  if (stray.length > 0) throw new NotFound("Medan tidak ada di seksi ini.");

  await repo.writeValues(supabase, input.fields);
  await writeAudit(
    supabase,
    actor,
    "update",
    "page_section",
    section.id,
    `Konten seksi ${section.key} diubah, ${input.fields.length} medan.`,
  );
}
