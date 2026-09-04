import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";

import type { TimelineEntry } from "./timeline.contract.js";
import type { TimelineInput, TimelinePatch } from "./timeline.schema.js";
import * as repo from "./timeline.repository.js";

export class NotFound extends Error {}

export function listEntries(
  supabase: SupabaseClient,
  locale: Locale,
  onlyPublished: boolean,
): Promise<TimelineEntry[]> {
  return repo.list(supabase, locale, onlyPublished);
}

export async function getEntry(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
): Promise<TimelineEntry> {
  const found = await repo.findById(supabase, id, locale);
  if (!found) throw new NotFound("Tonggak tidak ditemukan.");
  return found;
}

export async function createEntry(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: TimelineInput,
): Promise<{ id: string }> {
  const id = await repo.create(supabase, input);
  await writeAudit(
    supabase,
    actor,
    "create",
    "timeline",
    id,
    `Tonggak ${input.year} "${input.translations.id.title}" dibuat.`,
  );
  return { id };
}

export async function updateEntry(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  input: TimelinePatch,
): Promise<void> {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Tonggak tidak ditemukan.");
  await repo.update(supabase, id, input);
  await writeAudit(supabase, actor, "update", "timeline", id, `Tonggak ${found.year} diubah.`);
}

export async function deleteEntry(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
): Promise<void> {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Tonggak tidak ditemukan.");
  await repo.remove(supabase, id);
  await writeAudit(
    supabase,
    actor,
    "delete",
    "timeline",
    id,
    `Tonggak ${found.year} "${found.title}" dihapus.`,
  );
}
