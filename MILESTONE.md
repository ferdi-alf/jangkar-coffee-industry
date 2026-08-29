# Milestone — Jangkar Coffee Industry

Konsep desain **06 Arus**, palet **Cap Jangkar 999** (`crest`).
Isi tiap milestone diturunkan dari `docs/design/information-architecture.md` dan
`docs/design/future-scope.md`.

| M | Isi | Status |
|---|---|---|
| **M0** | Scaffolding monorepo | **selesai** |
| **M1** | Dependensi tambahan + `./reactbits` & `./lightswind` | **giliran pemilik proyek** |
| **M2** | Design system & fondasi UI | |
| **M3** | Skema Supabase | |
| **M4** | Homepage — port Arus | |
| **M5** | Rute dalam | |
| **M6** | Express API | |
| **M7** | Panel admin | |
| **M8** | SEO, performa, aksesibilitas | |
| **M9** | Deploy Vercel | |

---

## Keputusan yang harus diambil sebelum M3

Ini bukan detail — jawabannya mengubah bentuk skema dan melipatgandakan cakupan panel admin.

**1 · Apakah situs berjualan online?**
`future-scope.md` menyebutnya *"the fork in the road"*. Kalau ya, `order`, `order_item`,
`customer`, `shipping_zone`, dan `payment` masuk skema, `/roastery` jadi etalase belanja, dan
panel admin bertambah pengelolaan pesanan. Kalau tidak, `/roastery` cuma katalog dengan tombol
keluar ke WhatsApp / Shopee / Tokopedia. **Harus dijawab sebelum pekerjaan skema dimulai.**

**2 · Bilingual atau tidak?**
Kalau ya, rute berubah jadi `/id/*` dan `/en/*`, dan itu keputusan sebelum build, bukan sesudah.

**3 · Berapa outlet yang benar-benar beroperasi?**
Baru satu yang terkonfirmasi (HQ Sako). Di bawah tiga, `/outlet` mungkin cukup jadi seksi di
homepage dan bukan rute tersendiri.

---

## M0 · Scaffolding — selesai

- npm workspaces + Turborepo; `node_modules` hanya di root
- `apps/web` — Next.js 16.3.3, React 19.2.8, App Router, TypeScript, Tailwind 4, ESLint
- `apps/api` — Express 5.2.1, TypeScript, tsx watch, helmet + cors, `GET /health`
- Palet crest sebagai token CSS di `apps/web/app/globals.css`, dipetakan ke `@theme` Tailwind
- Font: Inter + Geist Mono lewat `next/font` (self-host, bukan CDN Google)
- `CLAUDE.md`, `MILESTONE.md`, `.env.example`, `.nvmrc`
- git init + commit pertama. `prototypes/`, `secrets/`, `jangkar-coffee-reference/` di-ignore

Tailwind ikut dipasang karena reactbits dan lightswind dikirim sebagai komponen React ber-class
Tailwind — tanpa itu komponen di M1 tidak akan ter-style.

---

## M1 · Dependensi tambahan — giliran pemilik proyek

Pemilik proyek memasang dependensi tambahan dan menaruh `./reactbits` dan `./lightswind` di dalam
`apps/web`. Kandidat yang kemungkinan dibutuhkan: `@supabase/supabase-js`, `zod`,
`@tanstack/react-query`, `motion`, `clsx`, `tailwind-merge`.

Pasang dengan `npm i <pkg> -w apps/web` supaya masuk ke workspace yang benar, bukan ke root.

---

## M2 · Design system & fondasi UI

- `packages/ui` — komponen bersama; `packages/types` — tipe hasil generate Supabase;
  `packages/config` — tsconfig & eslint bersama. Daftarkan di `transpilePackages` pada
  `next.config.ts`.
- Skala tipografi Arus: `h1` 800 / `clamp(3rem,9vw,7rem)` / tracking `-.045em` / leading `.95`;
  `h2` 800 / `clamp(2rem,5vw,3.6rem)` / `-.035em`; meta mono `.68rem` / `.14em` / uppercase
- Primitif: `Section`, `Container`, `Button` (primary / secondary / ghost), `Pill`, `MonoLabel`
- Susun ulang komponen reactbits/lightswind ke palet crest — **cek kontras setiap kali**,
  komponen bawaan library dirancang untuk ground gelap
- **Amandemen `design-system.md` §5 dan §6** untuk mencatat penyimpangan radius dan motion Arus
- Rancang **navigasi mobile** — dock hanya menyembunyikan nav di bawah 1000px tanpa pengganti

---

## M3 · Skema Supabase

Entitas dari `future-scope.md` §1.

**Inti**

- `product` — **satu katalog melayani dua kanal.** Menu Keliling adalah subset harga-identik dari
  menu outlet, jadi ini satu daftar produk dengan flag ketersediaan per kanal, bukan dua menu.
  Dokumen menandainya: *"getting this wrong is the most expensive mistake available at this stage."*
  Field: name, slug, **sku**, description, category, base price, signature flag, availability per
  channel, sort order, image ref.
  *`sku` tidak ada di dokumen tapi ada di prototipe (`RST-080`, `RST-200`, `RST-G250`, `RST-BEAN`) —
  tambahkan.*
- `category` — lima yang sudah ada di menu cetak, **urutan bermakna**: Signature Series,
  Black & White Coffee, Non-Coffee, Snacks, Roastery Corner. Signature memimpin.
- `product_variant` — 80gr / 200gr / 250gr / 1 Liter. Beans dihargai **per satuan berat**
  (`RST-BEAN` Rp 15.000 per 100gr), jadi model harus bisa menyatakan keduanya.
- `modifier` — `Upgrade to Oatside +4K`, `FREE Extra Shot`. Berharga, opsional, menempel ke produk.
- `channel` — `outlet` dan `keliling` hari ini. Menambah `online` nanti tidak boleh menuntut
  restrukturisasi.

**Tempat**

- `outlet` — name, address, koordinat, jam, flag HQ, foto, status. Satu terkonfirmasi:
  HQ Sako, Jln Siaran No 745B.
- `keliling_unit` — armadanya. Jumlah belum diketahui.
- `keliling_schedule` — satu-satunya entitas berdimensi waktu: unit, lokasi, hari/tanggal, jam
  mulai & selesai, status. **Harus menangani "tidak ada jadwal minggu ini" dengan anggun.**

**Konten & admin**

- `page_section` — konten homepage yang harus bisa diubah pemilik tanpa developer
- `media` — setiap gambar, **alt text sebagai field wajib**, bukan opsional
- `admin_user` — Supabase Auth. Peran minimal `owner` dan `staff`: barista yang mengubah flag
  habis tidak boleh bisa mengedit teks homepage.
- `audit_log` — murah ditambahkan sekarang, merepotkan ditambahkan belakangan

`event` dan `promotion` **di luar build pertama** kecuali pemilik mengonfirmasi programnya nyata.

Deliverable: migrasi, kebijakan RLS, seed dari menu asli, tipe TypeScript hasil generate.

---

## M4 · Homepage — port Arus

Sembilan seksi, urutan dari IA §3. Dua aturan struktural: **seksi 2 sebelum seksi 3** (rantai
mengalahkan daftar produk), dan **seksi 6 boleh melanggar sistem**.

| # | Seksi | Isi |
|---|---|---|
| 1 | Hero | Pill Palembang · h1 "Kopi yang **bergerak** dari kebun ke gelas" · dua CTA · 4 counter |
| 2 | Rantai | Empat tahap: Kebun Semendo · Roastery Sako · Outlet · Keliling |
| 3 | Signature | 4 minuman berharga; Kopi Susu Jangkar 8K memimpin |
| 4 | Roastery | 4 SKU + blok heritage Cap Jangkar 999 |
| 5 | Outlet | HQ Sako lebih dulu; kartu kedua adalah empty state "Segera" |
| 6 | Keliling | Register visual sendiri + slot "di mana hari ini" |
| 7 | Origin | Semendo, Sumatera Selatan. Robusta. *Prototipe melewatkan ini — tambahkan.* |
| 8 | CTA | Satu aksi, bukan empat. WhatsApp adalah konversi yang realistis. |
| 9 | Footer | Kontak, jam, sosial, alamat |

Efek yang diport: aurora (**CSS, bukan WebGL**), dot grid, dock, split-text, shiny text,
star border, magnet, scroll reveal, count-up, spotlight bento, tilt card, marquee, scroll
progress, click spark. API atribut dari prototipe yang dipertahankan: `data-spot`, `data-tilt`,
`data-magnet`, `data-count`, `data-ph`, dan konvensi delay `--d`.

---

## M5 · Rute dalam

Tujuh tujuan dari IA §2, lima di nav utama. Slug Bahasa Indonesia.

```
/                    Home
/industri            Rantai. Bukan halaman About — tanpa potret pendiri.
                     Crest Cap Jangkar 999 ditempatkan di sini sebagai artefak heritage.
/menu                Minuman + snack, difilter per kanal: Semua / Outlet / Keliling
/roastery            Kopi kemasan
/roastery/[slug]     Detail produk
/outlet              Index outlet
/outlet/[slug]       Detail outlet
/keliling            Operasi keliling + jadwal
/kontak              Kontak
```

`Kontak` **tidak** masuk nav utama — ia CTA kanan yang persisten (`Hubungi` / WhatsApp) plus
footer. Lima item disengaja: enam atau lebih memaksa hamburger di mobile untuk situs sekecil ini.

`/menu` harus membawa lima kategori, tingkat harga, varian ukuran, catatan modifier, flag
signature, dan status habis.

---

## M6 · Express API

`apps/api` sudah punya pola dua-mode: `src/app.ts` **tidak pernah** memanggil `listen()`;
`src/server.ts` untuk lokal, `api/index.ts` mengekspor app untuk Vercel. Pertahankan — tanpa
pemisahan ini deploy menggantung.

- Klien Supabase server-side memakai secret key (jangan pernah dikirim ke browser)
- Validasi request dengan zod
- Endpoint: produk & kategori, outlet, jadwal keliling, submit kontak
- Error handler sudah ada; Express 5 meneruskan rejection async otomatis, jadi route tidak perlu
  membungkus try/catch sendiri

Pertanyaan yang perlu dijawab: mana yang lewat Express dan mana yang langsung dari Server
Component Next.js ke Supabase. Jangan bangun dua jalur untuk data yang sama.

---

## M7 · Panel admin

Di dalam `apps/web` sebagai route group `(admin)`, bukan app terpisah.

Prinsip dari `future-scope.md` §2: **pemilik tidak boleh butuh developer untuk mengubah sesuatu
yang berubah tiap minggu.**

| Area | Yang berubah | Frekuensi |
|---|---|---|
| Produk | Harga, ketersediaan, habis, deskripsi, foto | Mingguan |
| Kategori | Urutan, penamaan | Jarang |
| Varian & modifier | Ukuran, add-on, harga | Bulanan |
| Outlet | Alamat, jam, foto, tutup sementara | Bulanan |
| **Jadwal keliling** | Di mana armada, kapan | **Harian** |
| Konten homepage | Hero, tahap rantai, produk unggulan | Bulanan |
| Media | Upload, ganti, alt text | Terus-menerus |

Dua prioritas yang disebut namanya:

1. **Toggle habis harus jadi aksi tercepat di panel** — satu ketuk dari home panel, di ponsel,
   oleh barista.
2. **Jadwal Keliling** satu-satunya konten yang berubah harian — layak dapat tampilan mingguan
   khusus, bukan tabel CRUD generik.

Auth lewat Supabase Auth dengan peran `owner` / `staff`.

Di luar cakupan fase satu: dashboard analitik, akun pelanggan, loyalty, manajemen inventaris,
integrasi POS, konten multi-bahasa.

---

## M8 · SEO, performa, aksesibilitas

**Pencarian lokal adalah seluruh permainannya.** Target: *kopi Palembang*, *kopi susu Sako*,
*kopi keliling Palembang*, *kopi bubuk Semendo*.

- Structured data `LocalBusiness` per outlet, `Product` untuk SKU roastery, `BreadcrumbList` di
  rute bersarang
- `title` dan `meta description` unik per rute; `sitemap.xml`; `robots.txt`; kartu OG/Twitter
- Alamat sebagai teks HTML asli. **Harga sebagai teks yang bisa di-crawl, jangan pernah gambar** —
  keunggulan nyata di pasar ini.
- Gambar: `next/image` AVIF/WebP; tidak ada yang lebih lebar dari 1920px; cutout produk 1200px;
  rasio tetap 4:5 produk, 16:9 lingkungan, 1:1 potret. Aset sumber sekarang 4.4MB / 7087².
- Audit aksesibilitas penuh; verifikasi `prefers-reduced-motion` masih mendegradasi bersih
- Uji di 360px pada Android kelas menengah, bukan cuma DevTools

---

## M9 · Deploy Vercel

Dua project Vercel dari repo yang sama:

| Project | Root Directory | Catatan |
|---|---|---|
| web | `apps/web` | situs publik + panel admin |
| api | `apps/api` | `vercel.json` me-rewrite semua path ke `/api` |

Environment variable diatur per project di dashboard Vercel, tidak pernah di-commit.
`SUPABASE_SECRET_KEY` hanya di project api dan di runtime server web — **tidak pernah** dengan
prefix `NEXT_PUBLIC_`.

Sebelum go-live: verifikasi Core Web Vitals di perangkat nyata, konfirmasi
`prefers-reduced-motion` masih berfungsi di produksi, dan **hapus komponen reactbits/lightswind
yang tidak terpakai** — diminta eksplisit oleh pemilik proyek.
