# Jangkar Coffee Industry

Monorepo untuk situs Jangkar Coffee Industry. Ditulis untuk sesi mendatang yang belum punya
konteks — baca ini sebelum menulis kode.

---

## Bisnisnya bukan kedai kopi

Ini **industri kopi terintegrasi vertikal** di Palembang, Sumatera Selatan:

```
kebun Semendo  →  roastery Sako  →  produk kemasan  →  outlet  →  armada keliling
  (sourcing)      (produksi)        (retail)          (gerai)    (distribusi)
```

Kata "Industry" pada namanya harfiah. Tiga dari delapan aset brand adalah **barang kemasan**,
bukan minuman. Ini alasan struktur informasinya memisahkan `/menu` (yang dipesan di gerai) dari
`/roastery` (yang dibeli dan dibawa pulang) — pemisahan itu rekomendasi IA yang paling substantif,
dan sisanya mengikuti dari situ.

Jangan pernah membuat situs ini terlihat seperti template kedai kopi. Itu kegagalan utama yang
dihindari seluruh fase desain.

---

## Struktur

```
apps/
  web/    Next.js 16 · situs publik + panel admin   :3000
  api/    Express 5  · REST API                     :4000
packages/ (belum ada — dibuat di M2)
docs/design/  dokumentasi fase 1–7, sumber kebenaran desain
```

**Panel admin ada di dalam `apps/web`, bukan app terpisah.** Rencananya sebagai route group:
`src/app/(site)/` untuk publik, `src/app/(admin)/admin/` untuk panel.

### Perintah

```bash
npm run dev          # web + api bersamaan lewat turbo
npm run build        # keduanya; run kedua harus FULL TURBO (cache)
npm run lint
npm run typecheck
npm i <pkg> -w apps/web      # tambah dependency ke satu workspace
```

npm workspaces + Turborepo. Semua dependency dipasang sekali dari root; `node_modules` hanya ada
di root. Node 24 (`.nvmrc`).

> **Dependency hantu.** npm workspaces melakukan hoisting longgar, jadi `import` dari paket yang
> tidak dideklarasikan bisa lolos di lokal lalu gagal di CI. Selalu deklarasikan apa yang dipakai
> di `package.json` workspace-nya sendiri.

---

## Desain terpilih

Client memilih konsep **06 Arus** dengan palet **Cap Jangkar 999** (`crest`).

Prototipe sumber: `prototypes/06-arus.html` — **di luar git repo ini** (repositori sendiri, lihat
di bawah). Homepage berupa satu halaman anchor-scroll dengan sembilan seksi; produksi memecahnya
jadi tujuh rute.

Arus adalah konsep **motion-first**: aurora, dock nav mengambang, split-text reveal, spotlight
bento, tilt card, magnet button, click spark. Semuanya dibangun dari `./reactbits` dan
`./lightswind` yang ditambahkan pemilik proyek.

### Palet crest — token ada di `apps/web/src/app/globals.css`

Nilai diambil dari piksel `jangkar-coffee-reference/logo-3.PNG`.
**Token ini adalah peran, bukan warna harfiah** — di palet terang ini `--ink-900` justru warna
paling terang, dan `--red` berisi **gold**, bukan merah.

| Token | Nilai | Peran |
|---|---|---|
| `--ink-900` | `#FBFAF8` | ground halaman |
| `--ink-800` | `#FCFAF9` | permukaan / kartu |
| `--ink-500` | `#CFBDB8` | hairline |
| `--ink-300` | `#7A4E44` | teks sekunder |
| `--ink-200` | `#5A2E24` | teks muted |
| `--paper` | `#320505` | teks utama (maroon crest) |
| `--red` | `#B08A16` | **aksen** — fill, rule, band |
| `--red-lift` | `#8A6C10` | aksen teks kecil |
| `--red-deep` | `#E8C244` | fill hover (lebih terang) |
| `--on-red` | `#320505` | fg di atas panel aksen |
| `--signal` | `#6B2218` | merah harfiah — punctuation & focus ring |

Dua hal yang dipaksa oleh warna aslinya, jangan "diperbaiki":

- **Gold crest asli `#F9DA72` hanya 1.4:1 di atas putih** — mustahil untuk fill atau teks. Karena
  itu gold antik `#B08A16` memegang fill/UI (3.10:1), dan gold cerah `#E8C244` jadi `--red-deep`.
- **Putih di atas gold hanya 3.3:1.** Fg di panel aksen adalah maroon `--on-red`, bukan putih.
  Jangan tulis `color: white` di atas `--red`.

---

## Aturan yang tidak boleh dilanggar

### Tipografi

- **Tidak ada font serif.** Inter (sans) + Geist Mono. Konsep Arus aslinya memakai JetBrains Mono,
  tapi font itu punya serif kecil pada beberapa glif — sudah diganti Geist Mono.
- **Ketebalan selalu dinyatakan eksplisit.** Jangan mengandalkan default browser atau default
  komponen. Display Arus = 800 dengan tracking negatif rapat; body = 400.

### Performa — ini menentukan, bukan preferensi

- **Tolak background WebGL dari reactbits.** Sebagian komponennya render lewat OGL/Three.js:
  bundle berat dan beban GPU terus-menerus. Trafik Indonesia didominasi Android kelas menengah —
  artinya baterai terkuras, thermal throttling, dan LCP lambat. Aurora di prototipe sengaja
  **CSS murni**. Pertahankan. Ini risiko nomor satu konsep Arus dan sudah dicatat sejak awal.
- Target: **LCP < 2.5s di 4G, CLS < 0.1, INP < 200ms.** Uji di lebar **360px**.
- Font di-self-host lewat `next/font`, bukan CDN Google. Sudah terpasang.
- Static generation untuk semua halaman konten; **ISR untuk jadwal Keliling.**

### Aksesibilitas

- Body ≥ **4.5:1**, teks besar & UI ≥ **3:1**.
- `prefers-reduced-motion: reduce` **wajib** mendegradasi ke halaman statis bersih. Prototipe
  sudah melakukannya sepenuhnya; ini biasanya hal pertama yang hilang di produksi — jangan.
- **Warna tidak pernah jadi satu-satunya pembawa makna.** Item habis dicoret **dan** dilabeli,
  bukan sekadar diredupkan.
- Focus selalu terlihat: `2px solid var(--signal)`. Jangan `outline: none`.
- Target sentuh ≥ 44px; tombol utama 52px di mobile.

### Penyimpangan sistem yang disengaja

Arus melanggar dua aturan `docs/design/design-system.md`: `radius: 0` (§5) dan budget motion
"dua benda bergerak per layar" (§6). Keduanya **sengaja** — tapi sudah dicatat bahwa sistemnya
harus **diamandemen formal**, bukan diabaikan diam-diam. Kalau menyentuh dokumen itu, perbarui
§5 dan §6 sekalian.

---

## Celah yang sudah diketahui

- **Navigasi mobile belum ada.** Dock nav prototipe memakai
  `@media(max-width:1000px){.dock nav{display:none}}` tanpa pengganti hamburger. Harus dirancang,
  bukan diport apa adanya. Ini mayoritas trafik.
- **Efek pointer tidak terlihat di layar sentuh.** Spotlight, tilt, dan magnet tidak melakukan
  apa pun tanpa mouse. Tidak boleh ada informasi yang hanya disampaikan lewat efek itu.
- **Prototipe tidak punya blok jadwal Keliling** meski IA mewajibkannya. Itu penambahan, bukan port.

---

## Aturan komponen

`./reactbits` dan `./lightswind` ditambahkan **pemilik proyek** ke dalam `apps/web`. Bangun UI
dari komponen-komponen itu.

> **Setelah semuanya selesai, hapus komponen yang tidak terpakai.** Diminta eksplisit.

---

## Data & rahasia

**Supabase** — project ref `fylxkwqwuaidbfpmdwhu`. Saat M0 ditulis: kosong total, nol tabel
`public`, nol migrasi, nol bucket.

Aturan dari `secrets/ACCESS.md`:

- Secret **hanya** lewat environment variable. Jangan pernah hardcode.
- Jangan pernah mencetak key ke chat, log, atau commit.
- Prioritaskan read-only; menulis hanya dengan persetujuan eksplisit.
- Jangan membuat migrasi tanpa review.

`sb_secret_…` adalah key **rahasia** — tidak boleh menyentuh browser, tidak boleh diberi prefix
`NEXT_PUBLIC_`. Yang boleh ke browser hanya key *publishable*.

### Tiga folder di luar git

`.gitignore` memblokir ketiganya:

| Folder | Alasan |
|---|---|
| `prototypes/` | repositori git tersendiri dengan remote sendiri — jangan di-commit ke sini |
| `secrets/` | memuat kredensial |
| `jangkar-coffee-reference/` | aset sumber mentah (~9MB) |

Ketiganya tetap ada di disk dan boleh dibaca sebagai referensi — hanya tidak dilacak git.

---

## Dokumen desain

`docs/design/` adalah sumber kebenaran, dan isinya **beropini** — baca alasannya, bukan cuma
kesimpulannya.

| File | Isi |
|---|---|
| `brand-analysis.md` | Analisis aset. Tiga mark, bukan satu. Warna hasil sampling. |
| `design-system.md` | Token, tipografi, spasi, grid, motion, lantai aksesibilitas. §1b memuat keenam palet. |
| `information-architecture.md` | Tujuh rute, urutan homepage, model konten |
| `future-scope.md` | Entitas domain, cakupan admin, SEO, performa |
| `design-comparison.md` | Keenam konsep dibandingkan; §06 memuat peringatan Arus |

Catatan: `future-scope.md` §9 mengusulkan `web` + `admin` sebagai dua app tanpa Express. Repo ini
menyimpang — satu app Next.js (publik + admin) plus API Express. Dokumen belum diperbarui.
