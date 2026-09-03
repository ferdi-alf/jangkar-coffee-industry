"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { useContentSections, useSaveContent, type ContentSection } from "@/modules/content/hooks/useContent";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Teks yang tampil di halaman publik, dua bahasa.
 *
 * FORMNYA DIBANGKITKAN DARI DATA, bukan ditulis medan per medan. Tabel
 * page_content mendaftar medan apa saja yang dimiliki tiap seksi beserta
 * jenisnya, dan halaman ini merender apa yang ditemukannya di sana. Akibatnya
 * menambah satu medan teks ke beranda cukup dilakukan lewat basis data, tanpa
 * menyentuh berkas ini sama sekali.
 *
 * KEDUA BAHASA SELALU BERDAMPINGAN lewat LocaleTabs, dan panel yang tidak aktif
 * tetap ada di DOM. Itu bukan detail sepele di sini: kalau panel EN dilepas saat
 * tab ID dibuka, isian EN yang belum disimpan akan hilang begitu pengguna
 * berpindah tab.
 *
 * HALAMAN INI HANYA UNTUK OWNER. Aturan produk: barista boleh mengubah penanda
 * habis, tidak boleh mengubah teks beranda. Pagarnya di router Express, dan
 * menu ini juga sudah disembunyikan dari staff di sidebar.
 */
type Draft = Record<string, Record<"id" | "en", string>>;

function seed(section: ContentSection): Draft {
  const draft: Draft = {};
  for (const field of section.fields) draft[field.id] = { ...field.values };
  return draft;
}

/**
 * Editor satu seksi. DIPISAH DAN DI-KEY per seksi dengan sengaja.
 *
 * Versi pertama menyimpan draft di komponen halaman lalu meresetnya lewat
 * useEffect setiap seksi aktif berubah. ESLint menangkapnya sebagai setState
 * sinkron di dalam efek, dan keluhannya benar: berpindah seksi menyebabkan dua
 * render berturut-turut, satu untuk seksi barunya dan satu lagi untuk draft
 * yang baru direset, dan di antara keduanya form sempat menampilkan isi seksi
 * yang lama.
 *
 * Dengan `key={section.key}` di pemanggilnya, React melepas dan memasang ulang
 * komponen ini setiap seksi berganti, jadi `useState` di bawah lahir langsung
 * dari seksi yang benar. Tidak ada efek, tidak ada render antara, tidak ada
 * kedipan isi lama.
 */
function SectionEditor({
  section,
  onSave,
  saving,
}: {
  section: ContentSection;
  onSave: (fields: { id: string; values: Record<"id" | "en", string> }[]) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => seed(section));

  function setValue(fieldId: string, locale: "id" | "en", value: string): void {
    setDraft((previous) => ({ ...previous, [fieldId]: { ...previous[fieldId], [locale]: value } }));
  }

  function renderFields(locale: "id" | "en") {
    return section.fields.map((field) => {
      const id = `content-${field.id}-${locale}`;
      const value = draft[field.id]?.[locale] ?? "";
      const label = `${field.key} (${locale === "id" ? "Indonesia" : "English"})`;

      return (
        <div className="adm-field" key={id}>
          <label htmlFor={id}>{label}</label>
          {field.kind === "text" ? (
            <input
              id={id}
              className="adm-input"
              value={value}
              onChange={(event) => setValue(field.id, locale, event.target.value)}
            />
          ) : (
            <textarea
              id={id}
              className="adm-textarea"
              rows={field.kind === "list" ? 5 : 4}
              value={value}
              onChange={(event) => setValue(field.id, locale, event.target.value)}
            />
          )}
          {field.kind === "list" ? (
            <p className="adm-hint">Satu butir per baris.</p>
          ) : null}
        </div>
      );
    });
  }

  return (
    <div className="adm-card" data-fixed="true">
      <div className="adm-card-head">
        <div>
          <h2>{section.label}</h2>
          <p>Kunci: {section.key}</p>
        </div>
        <div className="adm-card-actions">
          <button
            type="button"
            className="adm-btn"
            data-variant="primary"
            disabled={saving}
            onClick={() => onSave(Object.entries(draft).map(([id, values]) => ({ id, values })))}
          >
            {saving ? "Menyimpan..." : "Simpan seksi"}
          </button>
        </div>
      </div>
      <div className="adm-card-body">
        <LocaleTabs id={<>{renderFields("id")}</>} en={<>{renderFields("en")}</>} />
      </div>
    </div>
  );
}

export default function ContentPage() {
  const { data, isLoading, error } = useContentSections();
  const save = useSaveContent();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const sections = data ?? [];
  const active = sections.find((section) => section.key === activeKey) ?? sections[0];

  return (
    <AdminShell>
      {error ? (
        <div className="adm-card">
          <div className="adm-card-body">
            <p className="adm-error">
              Konten belum bisa dimuat. Pastikan API berjalan dan migrasi konten sudah dijalankan.
            </p>
          </div>
        </div>
      ) : null}

      <div className="adm-row" data-split="30-70">
        <div className="adm-card" data-fixed="true">
          <div className="adm-card-head">
            <div>
              <h2>Seksi halaman</h2>
              <p>Pilih seksi untuk mengubah teksnya.</p>
            </div>
          </div>
          <div className="adm-card-body" data-flush="true">
            {isLoading ? (
              <div style={{ padding: 14, display: "grid", gap: 8 }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="adm-skel" />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <p className="adm-empty">Belum ada seksi konten.</p>
            ) : (
              <nav>
                {sections.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    className="adm-nav-item"
                    aria-current={active?.key === section.key ? "page" : undefined}
                    onClick={() => setActiveKey(section.key)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: active?.key === section.key ? "var(--a-accent-soft)" : "transparent",
                      color: "var(--a-text)",
                      boxShadow: active?.key === section.key ? "inset 3px 0 0 var(--a-accent)" : undefined,
                      borderRadius: 0,
                      font: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ flex: 1 }}>{section.label}</span>
                    <span className="adm-badge" data-tone={section.status === "published" ? "ok" : "warn"}>
                      {section.fields.length}
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>

        {active ? (
          <SectionEditor
            key={active.key}
            section={active}
            saving={save.isPending}
            onSave={(fields) =>
              save.mutate(
                { key: active.key, fields },
                {
                  onSuccess: () => toast.success("Konten disimpan."),
                  onError: (apiError) =>
                    toast.error(
                      apiError instanceof ApiError && apiError.status === 403
                        ? "Hanya owner yang boleh mengubah teks halaman."
                        : "Gagal menyimpan konten.",
                    ),
                },
              )
            }
          />
        ) : (
          <div className="adm-card" data-fixed="true">
            <div className="adm-card-body">
              <p className="adm-empty">Pilih seksi di sebelah kiri.</p>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
