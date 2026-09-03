import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";
import { listMeta, range } from "../../shared/utils/pagination.js";

import type { ContactMessage, ContactStatus } from "./contact.contract.js";

type Row = Record<string, unknown>;

export class NotFound extends Error {}

/**
 * Kotak masuk pesan kontak, sisi admin.
 *
 * `ip_hash` TIDAK PERNAH ikut di-select, dan itu disengaja. Ia ada untuk
 * menelusuri penyalahgunaan lewat query langsung saat benar-benar dibutuhkan,
 * bukan untuk ditampilkan di layar. Memunculkannya di panel berarti menyebarkan
 * data pribadi yang tidak dipakai siapa pun untuk bekerja.
 */
const COLUMNS = "id, name, email, message, status, created_at";

const toItem = (row: Row): ContactMessage => ({
  id: row.id as string,
  name: row.name as string,
  email: row.email as string,
  message: row.message as string,
  status: row.status as ContactStatus,
  createdAt: row.created_at as string,
});

export async function listMessages(
  supabase: SupabaseClient,
  query: ListQuery,
  status?: ContactStatus,
) {
  let builder = supabase.from("contact_message").select(COLUMNS, { count: "exact" });
  if (status) builder = builder.eq("status", status);
  if (query.q) builder = builder.or(`name.ilike.%${query.q}%,email.ilike.%${query.q}%`);

  const [from, to] = range(query);
  const { data, error, count } = await builder
    .order("created_at", { ascending: query.order === "asc" })
    .range(from, to);
  if (error) throw new Error(error.message);

  return {
    items: ((data ?? []) as unknown as Row[]).map(toItem),
    meta: listMeta(query, count ?? 0),
  };
}

export async function setStatus(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  status: ContactStatus,
): Promise<void> {
  const { data, error } = await supabase
    .from("contact_message")
    .update({ status })
    .eq("id", id)
    .select("id, email")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new NotFound("Pesan tidak ditemukan.");

  await writeAudit(supabase, actor, "update", "contact_message", id, `Pesan ditandai ${status}.`);
}

export async function removeMessage(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("contact_message")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new NotFound("Pesan tidak ditemukan.");
  await writeAudit(supabase, actor, "delete", "contact_message", id, "Pesan dihapus.");
}
