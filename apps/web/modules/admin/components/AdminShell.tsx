"use client";

import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";

import { ADMIN_NAV, ADMIN_PAGE_TITLE } from "@/modules/admin/constants/nav";
import { useSession } from "@/modules/admin/hooks/useSession";
import { api } from "@/shared/lib/api-client";

/** Kunci localStorage untuk grup sidebar yang sedang tertutup. */
const NAV_CLOSED_KEY = "jangkar.nav.closed";

/* Rujukan tetap untuk keadaan kosong. useSyncExternalStore membandingkan
   snapshot dengan Object.is, jadi mengembalikan array baru tiap panggilan akan
   membuat React menganggapnya selalu berubah dan render tanpa henti. */
const EMPTY: string[] = [];

/**
 * Store kecil di atas localStorage.
 *
 * Snapshotnya di-cache dan hanya dibuat ulang saat isinya benar-benar berubah,
 * karena `getSnapshot` dipanggil di setiap render dan harus stabil.
 */
const navClosedStore = {
  cache: EMPTY as string[],
  raw: null as string | null,
  listeners: new Set<() => void>(),

  subscribe(listener: () => void): () => void {
    navClosedStore.listeners.add(listener);
    return () => navClosedStore.listeners.delete(listener);
  },

  get(): string[] {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(NAV_CLOSED_KEY);
    } catch {
      /* Mode privat dan setelan yang memblokir penyimpanan situs melempar di
         sini. Sidebar yang selalu terbuka jauh lebih baik daripada panel yang
         gagal render. */
      return EMPTY;
    }
    if (raw === navClosedStore.raw) return navClosedStore.cache;
    navClosedStore.raw = raw;
    try {
      navClosedStore.cache = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    } catch {
      navClosedStore.cache = EMPTY;
    }
    return navClosedStore.cache;
  },

  toggle(key: string): void {
    const current = navClosedStore.get();
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    try {
      window.localStorage.setItem(NAV_CLOSED_KEY, JSON.stringify(next));
    } catch {
      /* Gagal menyimpan tidak boleh berarti gagal membuka. Keadaannya tetap
         diperbarui di memori, hanya tidak bertahan sampai muat berikutnya. */
    }
    navClosedStore.raw = JSON.stringify(next);
    navClosedStore.cache = next;
    for (const listener of navClosedStore.listeners) listener();
  },
};

/**
 * Kerangka panel: sidebar, topbar, dan penjaga sesi di sisi klien.
 *
 * DUA LAPIS PENJAGA, dan keduanya perlu.
 *
 *   1. `middleware.ts` menolak lebih awal, sebelum halaman dirender, hanya
 *      dengan melihat ADA atau TIDAKNYA cookie sesi. Murah, tapi ia tidak
 *      memverifikasi apa pun: cookie basi tetap lolos.
 *   2. Komponen ini menanyakan GET /auth/me ke server. Inilah yang benar-benar
 *      memverifikasi, dan yang menangkap sesi yang sudah dicabut atau akun yang
 *      baru dinonaktifkan.
 *
 * Lapis pertama tanpa lapis kedua akan menampilkan panel kepada siapa pun yang
 * mengarang cookie. Lapis kedua tanpa lapis pertama membuat setiap navigasi
 * berkedip di halaman kosong lebih dulu.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, unauthenticated } = useSession();
  const [open, setOpen] = useState(false);
  const navId = useId();

  /**
   * Grup sidebar yang sedang TERTUTUP.
   *
   * Yang disimpan adalah daftar tertutup, bukan terbuka, dan itu punya satu
   * sifat penting: grup baru yang ditambahkan nanti otomatis TERBUKA, karena
   * kuncinya belum pernah tercatat di mana pun. Kalau yang disimpan daftar
   * terbuka, tiap grup baru lahir tersembunyi bagi setiap pemakai lama dan
   * tidak ada yang tahu ia sudah ada.
   *
   * `useSyncExternalStore`, BUKAN useState plus useEffect. localStorage tidak
   * ada di server, jadi membacanya sebagai nilai awal useState akan membuat
   * markup server dan klien berbeda; membacanya di dalam effect lalu setState
   * memicu render bertingkat, yang memang ditolak lint proyek ini. Hook ini
   * dibuat persis untuk keadaan itu: ia punya snapshot server sendiri, dan
   * React yang mengurus penyelarasannya setelah hidrasi.
   */
  const closed = useSyncExternalStore(navClosedStore.subscribe, navClosedStore.get, () => EMPTY);

  const toggleGroup = useCallback((key: string) => {
    navClosedStore.toggle(key);
  }, []);

  useEffect(() => {
    if (unauthenticated) router.replace("/login");
  }, [unauthenticated, router]);

  const page = ADMIN_PAGE_TITLE[pathname] ?? { title: "Panel", sub: "" };

  async function signOut() {
    try {
      await api.post("/auth/logout");
    } finally {
      /* Muat dokumen penuh, bukan router.push. Cache TanStack memuat data milik
         pengguna yang baru saja keluar, dan hanya muat ulang yang benar-benar
         membuangnya dari memori. */
      /* MUAT DOKUMEN PENUH, bukan router.push, dan ini disengaja meski Next
         menyarankan sebaliknya. Cache TanStack masih memuat data milik pengguna
         yang baru saja keluar; navigasi sisi klien mempertahankan proses yang
         sama sehingga data itu tetap ada di memori. Hanya muat ulang penuh yang
         benar-benar membuangnya. */
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }

  if (isLoading) {
    return (
      <div className="adm-shell">
        <aside className="adm-side" aria-label="Memuat" />
        <div className="adm-main">
          <div className="adm-body">
            <div className="adm-skel" style={{ height: 32, maxWidth: 220 }} />
            <div className="adm-skel" style={{ height: 180 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(user.role)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="adm-shell">
      {open ? (
        <div className="adm-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}

      <aside className="adm-side" data-open={open} aria-label="Navigasi panel">
        <Link className="adm-brand" href="/dashboard">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <span className="adm-brand-name">Jangkar</span>
            <span className="adm-brand-sub">Panel Admin</span>
          </span>
        </Link>

        {groups.map((group) => {
          const holdsActive = group.items.some((item) => item.href === pathname);
          /* Grup yang memuat halaman aktif DIPAKSA TERBUKA, apa pun isi
             localStorage. Tanpa ini, membuka /menu lewat tautan langsung atau
             muat ulang akan menampilkan sidebar yang menyembunyikan halaman
             yang sedang dibaca, dan tidak ada satu pun petunjuk di layar bahwa
             ia ada di dalam grup yang tertutup. */
          const expanded = !group.collapsible || holdsActive || !closed.includes(group.key);
          const panelId = `${navId}-${group.key}`;

          return (
            <div key={group.key}>
              {group.collapsible ? (
                <button
                  type="button"
                  className="adm-nav-toggle"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.key)}
                >
                  <span className="adm-nav-label">{group.label}</span>
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className="adm-nav-chevron"
                    data-open={expanded}
                  />
                </button>
              ) : (
                <p className="adm-nav-label">{group.label}</p>
              )}

              {/* `hidden`, bukan dilepas dari DOM. Tautan yang tetap ada
                  membuat prefetch Next tetap bekerja, dan `hidden` sudah
                  mengeluarkannya dari urutan tab maupun dari pembaca layar. */}
              <nav id={panelId} hidden={!expanded}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      className="adm-nav-item"
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      /* Menu mobile ditutup DI SINI, bukan lewat efek yang
                         mengamati pathname. Efek itu adalah setState sinkron di
                         dalam efek, yang memicu render bertingkat setiap kali
                         halaman berpindah. Menutupnya di tempat kejadian lebih
                         murah dan lebih jelas sebabnya. */
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}

        <div className="adm-side-foot">
          <div className="adm-user">
            <b>{user.name}</b>
            <span>
              {user.email} &middot; {user.role === "owner" ? "Owner" : "Staff"}
            </span>
          </div>
          <button
            type="button"
            className="adm-nav-item"
            style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}
            onClick={() => {
              toast.info("Keluar dari panel.");
              void signOut();
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <button
            type="button"
            className="adm-burger"
            aria-expanded={open}
            aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
          <div>
            <h1>{page.title}</h1>
            {page.sub ? <p className="adm-top-sub">{page.sub}</p> : null}
          </div>
        </header>

        <main className="adm-body">{children}</main>
      </div>
    </div>
  );
}
