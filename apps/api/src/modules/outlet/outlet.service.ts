import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";
import { listMeta } from "../../shared/utils/pagination.js";

import type { OutletItem, OutletStatus } from "./outlet.contract.js";
import type { OutletInput, OutletPatch } from "./outlet.schema.js";
import * as repo from "./outlet.repository.js";

export class NotFound extends Error {}

export async function listOutlets(
  supabase: SupabaseClient,
  query: ListQuery,
  filters: { status?: OutletStatus },
) {
  const { items, total } = await repo.list(supabase, query, filters);
  return { items, meta: listMeta(query, total) };
}

export async function getOutlet(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
): Promise<OutletItem> {
  const found = await repo.findById(supabase, id, locale);
  if (!found) throw new NotFound("Outlet tidak ditemukan.");
  return found;
}

export async function createOutlet(supabase: SupabaseClient, actor: AuthUser, input: OutletInput) {
  const id = await repo.create(supabase, input);
  await writeAudit(supabase, actor, "create", "outlet", id, `Outlet ${input.name} dibuat.`);
  return { id };
}

export async function updateOutlet(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  input: OutletPatch,
) {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Outlet tidak ditemukan.");
  await repo.update(supabase, id, input);
  await writeAudit(supabase, actor, "update", "outlet", id, `Outlet ${found.name} diubah.`);
}

export async function deleteOutlet(supabase: SupabaseClient, actor: AuthUser, id: string) {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Outlet tidak ditemukan.");
  await repo.remove(supabase, id);
  await writeAudit(supabase, actor, "delete", "outlet", id, `Outlet ${found.name} dihapus.`);
}
