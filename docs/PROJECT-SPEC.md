# Spesifikasi Proyek Jangkar Coffee Industry

Dokumen ini adalah hasil "susunlah semua ini dulu sebelum mulai coding". Belum ada kode yang
ditulis dan belum ada kredit yang dibelanjakan.

---

## Serah terima ke sesi berikutnya, kerjakan paling awal

Berkas rencana ini berada di `~/.claude/plans/`, **di luar repositori proyek**. Sesi baru tidak
membacanya sendiri. Yang dimuat otomatis setiap sesi hanyalah `CLAUDE.md` di akar proyek.

Karena itu, tindakan pertama saat eksekusi dimulai, sebelum menulis kode apa pun:

1. Salin seluruh isi dokumen ini menjadi `docs/PROJECT-SPEC.md` di dalam repositori.
2. Tambahkan blok berikut di bagian atas `CLAUDE.md` yang sudah ada, supaya sesi mana pun langsung
   tahu di mana posisinya dan ke mana harus membaca:

   > **Status:** Tahap A. Menunggu MCP Higgsfield dan 21st.dev terdaftar.
   > Spesifikasi lengkap ada di `docs/PROJECT-SPEC.md`. Baca sebelum menulis kode.
   > Aturan yang tidak boleh dilanggar ada di bagian "Aturan produk" dan "Animasi dan anggaran
   > performa" pada dokumen itu.

3. Commit keduanya. Setelah itu konteks proyek hidup di dalam git, bukan di dalam satu sesi.

### Cara sesi baru memeriksa MCP dengan cepat

```bash
cat .mcp.json                       # harus memuat higgsfield dan 21st.dev, bukan supabase saja
claude mcp list                     # bila tersedia di lingkungan itu
```

Bila keduanya sudah muncul sebagai tool, jalankan smoke test satu gambar termurah sesuai aturan
Higgsfield di bawah. Bila belum, jangan mulai membangun apa pun yang membutuhkan aset visual;
lanjutkan ke Tahap B yang tidak bergantung gambar.

---

## Context

Monorepo sudah berdiri (M0 dan M1 selesai): `apps/web` Next.js 16 App Router tanpa `src/`,
`apps/api` Express 5, npm workspaces plus Turborepo, Supabase kosong, git dua commit tanpa remote.
Pemilik proyek sudah memasang 211 komponen lightswind dan 166 komponen reactbits.

Sekarang masuk fase membangun situs sungguhan: web publik dua bahasa yang seluruh isinya dikendalikan
dari panel admin, hero sinematik yang digerakkan scroll dengan aset dari Higgsfield, lalu dashboard
admin. Dokumen ini mengunci aturan, arsitektur, dan urutan kerjanya lebih dulu supaya tidak ada
keputusan besar yang diambil diam-diam saat menulis kode.

---

## Penghalang yang harus dibereskan lebih dulu

**Higgsfield dan 21st.dev tidak terhubung ke sesi ini.**

```
.mcp.json          mcpServers: { supabase } saja
~/.claude.json     mcpServers global: []
daftar tool        nol tool higgsfield, nol tool 21st.dev
```

Akibatnya seluruh langkah 1 sampai 5 pada rencana Anda belum bisa dimulai: tidak ada
`list models`, tidak ada `get_cost`, tidak ada generasi gambar maupun video. Sampai keduanya
terdaftar dan saya bisa melihat tool-nya, pekerjaan yang mungkin dijalankan hanyalah yang tidak
membutuhkan aset visual.

Yang perlu Anda lakukan: daftarkan kedua server itu di `.mcp.json` atau lewat `claude mcp add`,
lalu mulai ulang sesi supaya tool-nya termuat. Setelah itu saya jalankan smoke test satu gambar
termurah sesuai instruksi Anda.

---

## Misi, sebagaimana saya memahaminya

Kita membangun satu situs sinematik secara bertahap, satu prompt bernomor pada satu waktu.

| Langkah | Isi |
|---|---|
| 1 | Verifikasi koneksi Higgsfield lewat satu smoke test gambar termurah |
| 2 | Anda menaruh gambar situs yang Anda inginkan di folder referensi |
| 3 | Saya bangun ulang sebagai halaman statis, seluruh visualnya dari Higgsfield |
| 4 | Hero dihidupkan jadi film yang digerakkan scroll: draft 480p dulu, kualitas penuh hanya setelah Anda setujui |
| 5 | Halaman diperluas dengan seksi sisanya dalam arah seni yang sama |

Alur besar proyek: web utama dulu sampai selesai, baru dashboard admin. Hero mendapat satu prompt
khusus dari Anda. Setelah hero beres, sisa web diselesaikan dalam satu prompt yang Anda koreksi
bersama saya.

---

## Aturan tetap sepanjang proyek

1. Bekerja setapak demi setapak. Tidak pernah mendahului prompt yang sedang berjalan.
2. Setelah situs ada, ambil backup **sebelum** setiap perubahan: salin file situs saat ini ke
   subfolder bertanda waktu di dalam folder `backups/` di proyek, baru ubah apa pun.
3. Hemat kredit. Selalu sebutkan biayanya sebelum generasi apa pun dijalankan.
4. Verifikasi pekerjaan sendiri lewat screenshot sungguhan sebelum menyatakan sesuatu selesai.
5. Saat sebuah langkah selesai, sebutkan dengan jelas apa yang dikerjakan dan apa yang sedang ditunggu.

### Aturan khusus Higgsfield

- Sebelum generasi apa pun: periksa skema model lewat model explorer, lalu preflight biayanya.
- Jika sebuah prompt menyebut model tertentu, pakai model itu persis. Tidak pernah menggantinya.
- Satu pengecualian: bila model gambar yang disebut tersangkut di antrean lebih dari sekitar
  10 menit, beralih ke Seedream 5.0 Pro (`seedream_v5_pro`) untuk sisa generasi gambar sesi ini,
  dan beri tahu Anda sekali bahwa saya beralih beserta alasannya. Model yang disebut tetap jadi
  default di sesi berikutnya.
- Keluaran tool bisa memuat informasi akun. Tidak pernah saya ulang dalam balasan.

### Catatan tentang folder backups

`backups/` harus masuk `.gitignore`. Kalau tidak, setiap salinan bertanda waktu ikut masuk riwayat
git dan repo membengkak dengan cepat.

---

## Keputusan yang sudah dikunci sesi ini

| Topik | Keputusan |
|---|---|
| Lapisan data | Hybrid. Web publik RSC plus ISR, admin TanStack Query terhadap Express |
| WebGL | Diizinkan dengan pagar yang eksplisit, angkanya bisa disesuaikan nanti |
| Auth | Supabase Auth, sesi lewat cookie httpOnly, Express memverifikasi JWT |
| Acuan visual | Prototipe 06 Arus yang menang. Gambar referensi jadi inspirasi, bukan cetak biru |

---

## Aturan produk yang Anda tetapkan

### Penulisan

- **Tidak ada em dash di seluruh teks.** Berlaku untuk teks situs, teks admin, komentar kode,
  dan pesan commit. Pakai koma, titik dua, tanda kurung, atau kalimat terpisah.
- **Ikon resmi, bukan emoji.** `lucide-react` sudah terpasang dan sudah jadi `iconLibrary` di
  `components.json`.

### Rute admin

Tidak pernah diawali `/admin`. Langsung `/dashboard`, `/product`, `/management-product`, dan
seterusnya.

### Input di admin

| Situasi | Bentuk |
|---|---|
| Sampai 3 field | Dialog atau modal |
| Field banyak | Drawer dari kanan ke kiri, berhenti di batas sidebar pada desktop |
| Melihat detail data yang banyak | Drawer dari bawah ke atas, tinggi 85 persen layar |
| Berhasil atau gagal | Toast sonner, posisi kiri atas |

Drawer kanan memiliki tombol ikon di kiri atas berupa panah kiri. Diklik, drawer menutup dan
tertarik kembali ke kanan. Berlaku sama untuk mode tambah maupun edit.

Drawer bawah dapat ditutup dengan klik di luar, ditarik, atau tombol tutup.

### Input khusus

- Input password selalu memiliki ikon mata untuk mengatur keterlihatan teks.
- Input berkas selalu drag and drop, dengan ikon berkas di tengah, keterangan jenis yang boleh
  diunggah beserta ukuran maksimum, dan kontainer berpembatas garis putus putus.

### Dua bahasa

- Situs publik berbahasa Indonesia dan Inggris.
- URL selalu berprefiks locale: `/id/...` dan `/en/...`. Locale awal diambil dari bahasa peramban
  pengunjung.
- Panel admin **tidak** berprefiks locale.
- Pemilih bahasa di navbar menampilkan bendera negara di sebelah kiri nama bahasa, format
  `(gambar bendera) ID`. Bendera memakai aset gambar, bukan emoji.
- Setiap input admin yang berisi teks tampil publik dibungkus dua tab, tab ID dan tab EN. Input
  yang tidak bergantung bahasa, misalnya tautan produk, diletakkan di bawah blok tab. Pola ini
  berlaku di semua form, bukan hanya form produk.

### Konteks bisnis

Jangkar bukan marketplace. Situs hanya menampilkan **3 produk** yang dijual di ecommerce, dan
hanya ke **Shopee** dan **Tokopedia**. Admin punya form untuk mengisi tautan tiap produk.

Catatan ketidakcocokan yang perlu diselesaikan saat mengisi data: prototipe 06 Arus menampilkan
4 SKU roastery (`RST-080`, `RST-200`, `RST-G250`, `RST-BEAN`), sedangkan konteks bisnis menyebut
3 produk ecommerce. Tiga gambar produk yang tersedia di folder referensi adalah
`product-ecomerce-1.JPG`, `product-ecomerce-2.JPG`, dan `product-ecomerce-3.PNG`. Model data
menampung keduanya lewat penanda, jadi jumlah pastinya cukup ditentukan saat mengisi seed.

### Data awal

Seluruh teks dan gambar dari desain terpilih langsung masuk basis data, bukan ditulis keras di
kode, supaya mudah disesuaikan setelah proyek selesai. Gambar hasil Higgsfield diunggah ke
Supabase Storage dan direferensikan lewat tabel `media`.

---

## Arsitektur

Keduanya per modul. Yang dipakai di banyak tempat dipisahkan keluar sebagai global.

### apps/web

```
app/
  [locale]/(site)/          publik, berprefiks locale
    page.tsx                        /id
    industri/ menu/ roastery/ outlet/ keliling/ kontak/
  (admin)/                  admin, tanpa prefiks locale
    dashboard/ product/ management-product/ ...
  login/
  globals.css
  lightswind.css            dipindah ke sini, lalu yang di apps/web/ dihapus

modules/<nama>/             satu folder per domain
  components/               komponen milik modul ini saja
  hooks/                    use<Modul>List, use<Modul>Detail
  contracts/                tipe request dan response, sepadan dengan Express
  constants/                kunci query, nilai enum, label
  rules/                    aturan bisnis murni, tanpa React, mudah diuji
  utils/

shared/                     dipakai lintas modul
  components/               DataTable, FormDrawer, DetailDrawer, DropzoneField,
                            PasswordField, LocaleTabs, ChartCard, StatCard
  hooks/                    useDebounce, useMediaCapability, usePagination
  utils/  constants/  contracts/

components/
  lightswind/               vendor, 211 berkas, jangan diedit
  reactbits/                vendor, 166 berkas, jangan diedit
  ui/                       pembungkus kita di atas vendor

lib/  i18n/  middleware.ts
```

Komponen vendor tidak diedit di tempat. Kalau butuh penyesuaian, bungkus di `components/ui/`.
Alasannya, `components.json` menunjuk registry reactbits, jadi pembaruan bisa menimpa berkas asli.

### apps/api

```
src/
  app.ts  server.ts                    sudah ada, pola dua mode dipertahankan
  modules/<nama>/
    <nama>.routes.ts
    <nama>.controller.ts
    <nama>.service.ts                  aturan bisnis
    <nama>.repository.ts               satu satunya yang menyentuh Supabase
    <nama>.schema.ts                   zod
    <nama>.contract.ts                 tipe bersama dengan web
    <nama>.constants.ts
  shared/
    middleware/                        auth, csrf, rateLimit, validate, errorHandler
    contracts/                         envelope, pagination
    db/  utils/  constants/
api/index.ts                           entri Vercel, hanya mengekspor app
```

Modul yang direncanakan: `auth`, `product`, `category`, `outlet`, `keliling`, `content`, `media`,
`stats`.

Aturan lapisan: controller tidak pernah menyentuh Supabase, hanya repository. Service tidak pernah
menyentuh objek request Express. Ini yang membuat aturan bisnis bisa diuji tanpa server.

---

## Peta rute dan middleware

Karena rute admin tanpa prefiks locale, `app/[locale]` akan menangkap `/dashboard` sebagai
locale bernama "dashboard". Middleware harus menyelesaikan ini lebih dulu.

```
shared/constants/routes.ts
  ADMIN_ROUTES = ['dashboard', 'product', 'management-product', 'login', ...]

middleware.ts
  1. segmen pertama ada di ADMIN_ROUTES  -> lewati locale, wajib ada sesi
  2. sudah berprefiks /id atau /en       -> teruskan
  3. selain itu                          -> deteksi Accept-Language, alihkan ke /id atau /en
```

Satu daftar konstanta jadi sumber kebenaran, dipakai middleware dan navigasi. Menambah rute admin
berarti menambah satu entri di sana, bukan menyebar kondisi di banyak berkas.

Rute publik mengikuti `information-architecture.md`: `/`, `/industri`, `/menu`, `/roastery`,
`/roastery/[slug]`, `/outlet`, `/outlet/[slug]`, `/keliling`, `/kontak`. Lima di navigasi utama,
`Kontak` sebagai CTA kanan yang persisten.

---

## Contract API

Struktur amplop selalu sama, untuk semua endpoint tanpa kecuali.

```jsonc
// tunggal
{ "success": true, "data": { }, "meta": { "requestId": "...", "timestamp": "..." } }

// daftar
{ "success": true, "data": [ ],
  "meta": { "page": 1, "perPage": 20, "total": 137, "totalPages": 7,
            "hasNext": true, "hasPrev": false, "requestId": "...", "timestamp": "..." } }

// galat
{ "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ ] },
  "meta": { "requestId": "...", "timestamp": "..." } }
```

Query standar untuk daftar: `?page=&perPage=&q=&sort=&order=&locale=`

### Pengambilan data sesuai permintaan

Aturan Anda: saat drawer terbuka, data yang sudah ada di cache tidak diambil ulang, hanya sisa
field yang belum ada. Diwujudkan lewat parameter `fields`.

```
GET /products?page=1&perPage=20          -> title, image, description, price
   cache TanStack: ['product','list',params]

klik card -> drawer bawah
GET /products/:id?fields=stock,variants,marketplaceLinks,audit
   placeholderData: diambil dari cache list, jadi drawer langsung berisi
   yang diambil hanya field yang belum dimiliki
```

Repository menerjemahkan `fields` menjadi daftar kolom `select` di Supabase, jadi penghematan
terjadi sungguhan di basis data, bukan hanya di klien.

---

## Keamanan

| Lapisan | Isi |
|---|---|
| Transport | helmet, CORS allowlist, `trust proxy` sudah aktif |
| Rate limit | 5 per menit untuk login, 100 per menit umum, per IP plus per akun |
| CSRF | Double submit cookie untuk POST, PUT, PATCH, DELETE |
| Validasi | zod di setiap boundary, keluar sebagai `VALIDATION_ERROR` yang seragam |
| Sesi | Cookie httpOnly, SameSite Lax, Secure di produksi. Bukan localStorage |
| Otorisasi | Peran `owner` dan `staff`. Barista boleh mengubah penanda habis, tidak boleh mengubah teks beranda |
| Basis data | RLS per tabel sebagai pertahanan kedua, bukan satu satunya |
| Unggahan | Batas ukuran, allowlist tipe MIME, periksa magic bytes, nama berkas diacak |
| Rahasia | `sb_secret_` hanya di server. Tidak pernah berprefiks `NEXT_PUBLIC_` |
| Log | `requestId` di setiap respons. Tidak pernah mencetak token atau kunci |

---

## Basis data

Teks dwibahasa memakai tabel terjemahan terpisah, bukan JSONB. Alasannya, Anda meminta pencarian
tabel dengan debounce yang dioptimasi indeks di backend, dan indeks teks penuh jauh lebih rapi di
kolom sungguhan.

```
product                    id, sku, slug, category_id, base_price, is_signature,
                           is_ecommerce, sort_order, status
product_translation        product_id, locale, title, description      UNIQUE(product_id, locale)
product_marketplace_link   product_id, marketplace('shopee'|'tokopedia'), url
product_variant            per satuan berat maupun per kemasan
product_channel            ketersediaan per kanal, outlet dan keliling
category  + category_translation
outlet    + outlet_translation
keliling_unit, keliling_schedule
page_section + page_section_translation      hero, about, dan teks beranda lain
media                                        alt text wajib, bukan opsional
admin_user, audit_log
```

Indeks yang disiapkan sejak awal: `product_translation(locale, title)` dengan GIN trigram untuk
pencarian, `product(status, sort_order)`, `keliling_schedule(unit_id, date)`.

Seed berisi seluruh teks dan gambar dari desain terpilih, dalam dua bahasa.

---

## Aturan dashboard

- Banyak chart di berbagai tempat: beranda dashboard, detail produk, dan lainnya. `recharts`
  sudah terpasang.
- Susunan grid tidak boleh saling melebihi. Kartu dan tabel dalam satu baris memakai tinggi tetap
  yang sama, isinya yang menggulung di dalam, bukan kontainernya yang memanjang.
- Variasikan lebar: ada baris 100 persen, ada 30 banding 70, ada 50 banding 50.
- Setiap tabel punya pencarian dengan debounce, dan indeks pendukungnya di backend.
- Tombol aksi paginasi di bawah tabel.

Diwujudkan lewat `shared/components/ChartCard` dan `DataTable` yang menerima prop tinggi, sehingga
konsistensi tinggi ditegakkan komponen, bukan diingat manusia tiap kali.

---

## Animasi dan anggaran performa

Prinsip Anda, banyak jalan menuju Roma, diterjemahkan jadi teknik konkret.

- Hanya `transform` dan `opacity`. Tidak pernah menganimasikan properti yang memicu layout.
- `IntersectionObserver` menjeda apa pun yang keluar layar, termasuk video, marquee, dan
  ScrollTrigger.
- `content-visibility: auto` pada seksi di bawah lipatan.
- `will-change` hanya dipasang saat animasi berjalan, lalu dilepas.
- Listener scroll pasif dan di-throttle lewat `requestAnimationFrame`.
- Komponen berat diimpor dinamis dengan `ssr: false`.
- Video hero: `preload="none"`, poster statis, scrub lewat `requestVideoFrameCallback`.
- Satu konteks GSAP, dimatikan saat unmount.

### Pagar WebGL

Anda menyetujui WebGL dengan batasan, dan angkanya bisa kita sesuaikan. Usulan awal:

| Aturan | Nilai awal |
|---|---|
| Di mana | Hero saja. Seksi lain CSS dan transform |
| Dimatikan bila | `prefers-reduced-motion`, `saveData`, `deviceMemory < 4`, `hardwareConcurrency < 4` |
| Saat mati | Poster statis hasil Higgsfield, komposisi sama |
| Saat keluar layar | Render loop dihentikan, bukan sekadar disembunyikan |
| Anggaran | JS hero setelah gzip di bawah 250 KB, LCP di bawah 2.5 detik pada 4G |

`three`, `@react-three/fiber`, `drei`, `ogl`, `cobe`, dan `tsparticles` sudah terpasang. Yang tidak
terpakai saat proyek selesai dicabut, sejalan dengan permintaan Anda menghapus komponen yang tidak
terpakai.

### Dua runtime animasi

`gsap` dan `framer-motion` sama sama terpasang. Memakai keduanya berarti dua mesin animasi dalam
satu bundle. Usulan pembagian: GSAP ScrollTrigger khusus hero sinematik, framer-motion untuk
transisi UI biasa. Kalau ternyata salah satu cukup, yang lain dicabut sebelum rilis.

---

## Kerapian yang harus dibereskan

| Hal | Tindakan |
|---|---|
| `apps/web/lightswind.css` | Pindah ke `apps/web/app/lightswind.css`, impor dari `globals.css`, hapus yang di akar `apps/web` |
| `backups/` | Tambahkan ke `.gitignore` sebelum backup pertama dibuat |
| Paket yang belum ada | `sonner`, `zod`, `@supabase/supabase-js`, `@tanstack/react-query`, `next-intl`, `express-rate-limit`, `helmet` sudah ada |
| Komponen tak terpakai | Dihapus di akhir proyek, dari lightswind maupun reactbits |
| Galat tipe vendor | 100 galat saat dipasang. Folder vendor dikeluarkan dari `tsconfig`. Perbaiki per komponen saat diadopsi, bukan sekaligus |

---

## Urutan kerja

Saya tidak mendahului prompt yang sedang berjalan. Ini peta agar kita sama sama tahu arah.

| Tahap | Isi | Pemicu |
|---|---|---|
| 0 | Persist spesifikasi ini ke `docs/PROJECT-SPEC.md` dan `CLAUDE.md`, lalu commit | Paling awal, tidak menunggu apa pun |
| A | Higgsfield dan 21st.dev terhubung, smoke test satu gambar termurah | Menunggu Anda mendaftarkan MCP |
| B | Fondasi: i18n, middleware, kerangka modul, contract, keamanan, `lightswind.css` | Boleh jalan tanpa menunggu A |
| C | Skema Supabase, migrasi, RLS, seed dwibahasa | Setelah B |
| D | **Hero sinematik** | Prompt khusus dari Anda |
| E | Sisa seksi web publik, satu prompt, dikoreksi bersama | Setelah D |
| F | Dashboard admin | Setelah E |
| G | Pembersihan: cabut komponen dan dependensi tak terpakai, audit performa dan aksesibilitas | Terakhir |

Pembagian tugas ke agent lain diizinkan saat menulis kode, terutama pada tahap E dan F yang berisi
banyak berkas sejenis.

---

## Verifikasi

Setiap tahap dianggap selesai hanya setelah bukti berikut ada, bukan setelah kode ditulis.

1. **Screenshot sungguhan.** Chrome headless tersedia di mesin ini dan sudah dipakai sebelumnya.
   Saya lihat hasilnya sendiri sebelum menyatakan selesai.
2. **Uji dua bahasa.** `/id` dan `/en` dirender, teks benar benar berganti, pemilih bahasa bekerja,
   dan pengunjung baru dialihkan sesuai `Accept-Language`.
3. **Uji aturan admin.** Form 3 field muncul sebagai dialog, form panjang sebagai drawer kanan
   dengan tombol panah kiri, detail sebagai drawer bawah 85 persen, toast sonner muncul di kiri atas.
4. **Uji cache parsial.** Buka panel Network, klik card produk, pastikan permintaan detail hanya
   meminta field yang belum ada, bukan seluruh objek.
5. **Uji keamanan.** Rate limit menolak pada percobaan keenam, mutasi tanpa token CSRF ditolak,
   payload tidak valid mengembalikan `VALIDATION_ERROR`, rute admin tanpa sesi dialihkan ke login.
6. **Anggaran performa.** Lighthouse pada lebar 360 piksel dengan throttle 4G. LCP di bawah 2.5
   detik, CLS di bawah 0.1. Bila hero melewatinya, pagar WebGL diperketat, bukan angkanya yang
   dilonggarkan diam diam.
7. **Gerak dan aksesibilitas.** `prefers-reduced-motion` mendegradasi halaman jadi statis bersih,
   fokus selalu terlihat, kontras memenuhi 4.5 banding 1 untuk teks isi.
8. **Tanpa em dash.** Pemeriksaan otomatis pada teks seed, komponen, dan dokumen sebelum commit.
