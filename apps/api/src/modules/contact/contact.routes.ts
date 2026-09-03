import { createHash } from "node:crypto";

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { sendData, sendError, sendList, type ErrorDetail } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";
import { parseListQuery } from "../../shared/utils/pagination.js";

import type { ContactStatus } from "./contact.contract.js";
import { NotFound, listMessages, removeMessage, setStatus } from "./contact.inbox.js";

export const contactRouter: Router = Router();

/**
 * Form kontak publik.
 *
 * Batasnya jauh lebih ketat daripada 100 per menit yang disebut PROJECT-SPEC
 * untuk endpoint umum, dan itu disengaja: ini satu-satunya endpoint yang bisa
 * ditulis TANPA login, jadi ia permukaan spam yang paling terbuka. Lima kali
 * per sepuluh menit per IP masih longgar untuk manusia yang salah ketik lalu
 * mengirim ulang, tapi tidak berguna bagi skrip.
 */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.");
  },
});

/**
 * Batas panjangnya sengaja sama persis dengan yang dipakai form di sisi web.
 * Kalau berbeda, pengunjung bisa lolos validasi klien lalu ditolak server tanpa
 * tahu sebabnya. Validasi klien untuk kenyamanan, validasi ini yang mengikat.
 */
/**
 * Pesan galatnya KODE, bukan kalimat.
 *
 * Bawaan zod adalah prosa Inggris seperti "Too small: expected string to have
 * >=10 characters". Situs ini dwibahasa dan API tidak tahu bahasa pengunjung,
 * jadi mengirim kalimat dari sini berarti mengirim kalimat yang salah bahasa
 * separuh waktu. Kode ini stabil dan bisa dipetakan ke kamus oleh klien mana
 * pun, termasuk panel admin nanti.
 */
const ContactInput = z.object({
  name: z.string({ error: "name.required" }).trim().min(1, "name.required").max(80, "name.tooLong"),
  email: z.email("email.invalid").max(160, "email.tooLong"),
  message: z
    .string({ error: "message.required" })
    .trim()
    .min(10, "message.tooShort")
    .max(2000, "message.tooLong"),
});

/**
 * IP disimpan sebagai hash, bukan apa adanya.
 *
 * Yang dibutuhkan untuk menelusuri penyalahgunaan hanyalah kemampuan melihat
 * dua pesan datang dari sumber yang sama, dan hash sudah cukup untuk itu.
 * Menyimpan alamat aslinya menambah data pribadi ke basis data tanpa menambah
 * satu pun kemampuan yang benar-benar dipakai.
 */
function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256")
    .update(`${ip}${process.env.CONTACT_IP_SALT ?? ""}`)
    .digest("hex");
}

contactRouter.post("/", limiter, requireCsrf, async (req, res) => {
  const parsed = ContactInput.safeParse(req.body);
  if (!parsed.success) {
    const details: ErrorDetail[] = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    sendError(res, 422, "VALIDATION_ERROR", "Isian belum lengkap atau belum benar.", details);
    return;
  }

  const db = getSupabase();
  if (!db) {
    /* Env belum dipasang. Ini dijawab jujur sebagai galat server, BUKAN
       dijawab sukses lalu pesannya dibuang diam-diam. Form yang menelan pesan
       pengunjung tanpa ada yang menerimanya lebih buruk daripada tidak ada
       form sama sekali. */
    sendError(res, 503, "NOT_CONFIGURED", "Layanan pesan belum aktif.");
    return;
  }

  const { name, email, message } = parsed.data;
  const { error } = await db.from("contact_message").insert({
    name,
    email,
    message,
    ip_hash: hashIp(req.ip),
  });

  if (error) {
    /* Pesan galat dari basis data TIDAK diteruskan ke klien, ia bisa memuat
       nama tabel dan kolom. Yang keluar hanya kode umum. */
    if (process.env.NODE_ENV !== "production") console.error("[contact] insert gagal:", error.message);
    sendError(res, 502, "STORAGE_ERROR", "Pesan gagal disimpan. Coba lagi.");
    return;
  }

  sendData(res, 201, { received: true });
});

/* ── kotak masuk, sisi admin ─────────────────────────────────────────────────
   POST di atas terbuka untuk publik, seluruh bagian di bawah ini tidak. Pesan
   pengunjung memuat nama, email, dan tulisan mereka sendiri, jadi membacanya
   selalu butuh sesi. Tabelnya juga memakai RLS tanpa policy, jadi tidak ada
   jalur lain menuju isinya selain lewat kunci rahasia di server ini. */
const StatusInput = z.object({ status: z.enum(["new", "read", "replied", "spam"]) });

function inbox(res: Parameters<typeof sendData>[0]) {
  const db = getSupabase();
  if (!db) {
    sendError(res, 503, "NOT_CONFIGURED", "Layanan basis data belum dikonfigurasi.");
    return null;
  }
  return db;
}

contactRouter.get("/messages", requireAuth, async (req, res) => {
  const db = inbox(res);
  if (!db) return;
  const raw = req.query as Record<string, unknown>;
  const query = parseListQuery(raw, ["created_at"], "created_at");
  const status = typeof raw.status === "string" ? (raw.status as ContactStatus) : undefined;
  const { items, meta } = await listMessages(db, query, status);
  sendList(res, items, { ...meta });
});

contactRouter.patch("/messages/:id", requireAuth, requireCsrf, async (req, res) => {
  const db = inbox(res);
  if (!db) return;
  const parsed = StatusInput.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "VALIDATION_ERROR", "Status tidak dikenali.", [
      { field: "status", message: "status.invalid" },
    ]);
    return;
  }
  try {
    await setStatus(db, req.user!, param(req, "id"), parsed.data.status);
    sendData(res, 200, { id: param(req, "id"), status: parsed.data.status });
  } catch (error) {
    if (error instanceof NotFound) {
      sendError(res, 404, "NOT_FOUND", error.message);
      return;
    }
    throw error;
  }
});

/* Menghapus pesan hanya owner. Ia menghilangkan tulisan orang lain untuk
   selamanya, dan itu bukan keputusan operasional harian. */
contactRouter.delete("/messages/:id", requireAuth, requireRole("owner"), requireCsrf, async (req, res) => {
  const db = inbox(res);
  if (!db) return;
  try {
    await removeMessage(db, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    if (error instanceof NotFound) {
      sendError(res, 404, "NOT_FOUND", error.message);
      return;
    }
    throw error;
  }
});
