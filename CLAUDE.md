# Jangkar Coffee Industry

Monorepo untuk situs Jangkar Coffee Industry. Ditulis untuk sesi mendatang yang belum punya
konteks, baca ini sebelum menulis kode.

> ## Status proyek: hidup, basis data terisi, panel bisa dimasuki
>
> Situs publik dua bahasa, Express bermodul lengkap, panel admin di `/dashboard` dan seterusnya,
> Supabase `fylxkwqwuaidbfpmdwhu` sudah bermigrasi dan terisi. Semuanya sudah diuji ujung ke ujung
> dengan login sungguhan pada 2026-09-03.
>
> **Isi basis data:** 34 produk (68 terjemahan, 68 penanda kanal, 33 aktif di kanal outlet dan 10
> di kanal keliling), 6 kategori, 1 outlet, 9 seksi konten dengan 88 medan (86 teks + 2 gambar),
> 5 tonggak timeline, 1 baris setelan SEO, 1 baris kontak, 1 tautan sosial, 1 akun owner.
>
> **Situs membaca hampir seluruh isinya dari basis data sejak 2026-09-04.** Yang tersisa di kode
> hanyalah label navigasi, teks footer, kata marquee, foto hero, dan brand mark. Konstanta dan
> kamus TETAP ADA sebagai cadangan saat API mati ketika build, dan tidak boleh dihapus.
>
> **Bucket storage `public-media` SUDAH DIBUAT** (migrasi `20260903_0200`). Sebelum itu ia tidak
> pernah ada, dan itulah sebab tunggal kenapa unggah media selalu gagal: kodenya benar, buketnya
> yang belum ada.
>
> **`apps/api/.env` sudah terisi** dari `secrets/ACCESS.md` dan diblokir git. Jalankan
> `npm run dev` dari akar untuk web dan api sekaligus.
>
> **Yang tersisa untuk pemilik proyek, semuanya data bisnis bukan kode:**
>
> 1. **Ganti kata sandi owner**, sekarang bisa lewat `/profil` di panel. Setelah itu hapus
>    `ADMIN_BOOTSTRAP_PASSWORD` dari `apps/api/.env`.
> 2. **Isi tautan Shopee dan Tokopedia** di `/ecommerce`. Sudah terbukti: begitu terisi, tombol di
>    situs berubah dari `<span>` mati jadi `<a href>` sungguhan tanpa menyentuh kode.
> 3. **Koordinat HQ yang tepat** di `/outlet`. Selama `coords_approximate` masih menyala, tombol
>    navigasi memakai alamat teks, bukan koordinatnya. Situs sekarang BENAR-BENAR membaca tabel
>    outlet, jadi perubahan di halaman itu akhirnya terlihat.
> 4. **Tahun timeline di `/timeline` masih karangan.** Kelimanya ditandai placeholder oleh sesi
>    sebelumnya karena tanggal berdirinya Jangkar tidak tercatat di dokumen mana pun yang dimiliki
>    proyek ini. Sekarang ada halamannya, jadi tinggal dikoreksi.
> 5. **Tautan sosial media selain Instagram** di `/kontak`. Delapan platform didukung; hanya
>    Instagram yang punya data nyata, sisanya sengaja dibiarkan kosong daripada dikarang.
> 6. **Alamat surel resmi** di `/kontak`, dibiarkan kosong karena memang belum pernah diberikan.
>
> Satu ambiguitas data menunggu keputusan Anda: "Americano" dan "Americano / Long Black" masuk
> sebagai DUA produk karena menu outlet dan poster keliling menuliskannya berbeda. Kalau memang
> satu minuman, hapus salah satunya di `/management-product` lalu nyalakan kedua kanal pada yang
> tersisa.
>
> Dua peringatan advisor Supabase yang tersisa, keduanya setelan dashboard bukan kode:
> perlindungan kata sandi bocor (HaveIBeenPwned) masih mati, dan 19 temuan INFO
> `rls_enabled_no_policy` yang memang DISENGAJA, lihat migrasi RLS.
>
> **Cara deploy ada di [`DEPLOY.md`](DEPLOY.md)**, lengkap dengan variabel environment per proyek,
> perintah verifikasi, dan keterbatasan yang sudah diketahui. Baca sebelum menyentuh Vercel.
>
> MCP **Higgsfield** dan **21st.dev** sudah terhubung meski `.mcp.json` hanya memuat `supabase`.
> Jangan memakai `cat .mcp.json` sebagai penentu, periksa daftar tool yang tersedia.

---

## Bisnisnya bukan kedai kopi

Ini **industri kopi terintegrasi vertikal** di Palembang, Sumatera Selatan:

```
kebun Semendo  →  roastery Sako  →  produk kemasan  →  outlet  →  armada keliling
  (sourcing)      (produksi)        (retail)          (gerai)    (distribusi)
```

Kata "Industry" pada namanya harfiah. Tiga dari delapan aset brand adalah **barang kemasan**,
bukan minuman. Ini alasan struktur informasinya memisahkan `/menu` (yang dipesan di gerai) dari
`/roastery` (yang dibeli dan dibawa pulang), pemisahan itu rekomendasi IA yang paling substantif,
dan sisanya mengikuti dari situ.

Jangan pernah membuat situs ini terlihat seperti template kedai kopi. Itu kegagalan utama yang
dihindari seluruh fase desain.

---

## Struktur

```
apps/
  web/    Next.js 16 · situs publik + panel admin   :3000
  api/    Express 5  · REST API                     :4000
packages/ (belum ada, dibuat di M2)
docs/design/  dokumentasi fase 1–7, sumber kebenaran desain
```

**Panel admin ada di dalam `apps/web`, bukan app terpisah.** Sudah dibangun, sebagai route group:

```
app/(site)/[locale]/   publik, layout akar dengan <html lang={locale}>
app/(admin)/           panel, layout akar dengan <html lang="id">, tanpa prefiks locale
app/globals.css        gaya situs publik
app/admin.css          gaya panel, HANYA diimpor (admin)/layout.tsx
```

**DUA LAYOUT AKAR, dan keduanya wajib berada di route group tingkat atas.** Itu aturan Next, bukan
selera: panel tanpa prefiks locale butuh `lang` tetap, situs publik butuh `lang` yang mengikuti
locale, dan satu layout akar tidak bisa melayani keduanya. Karena itu `[locale]` ada DI DALAM
`(site)`, bukan di akar `app/`. Group tidak muncul di URL, jadi `/id` tetap `/id`.

**`admin.css` terpisah karena alasan performa, jangan digabung ke `globals.css`.** Terukur: gaya
panel 4.031 byte setelah gzip, dan pemisahan ini membuat nol byte di antaranya diunduh pengunjung
halaman publik. Rute admin: `/login`, `/dashboard`, `/category`, `/menu`, `/keliling`,
`/ecommerce`, `/outlet`, `/content`, `/timeline`, `/seo`, `/kontak`, `/profil`, `/pengguna`,
`/pesan`. Menambah satu berarti menambah satu entri di `shared/constants/routes.ts`, karena daftar
itulah yang dipakai middleware untuk tahu bahwa segmen tersebut bukan kode bahasa.

**Dua rute DIHAPUS pada 2026-09-04, jangan dihidupkan lagi tanpa alasan baru.** `/product`, kartu
katalog baca-saja, hilang karena tiap tabel kini punya halamannya sendiri. `/media`, pustaka
gambar, hilang karena ia berdiri sendiri tanpa pernah dipakai satu form pun: nol baris di tabelnya
dan nol foreign key yang menunjuk kepadanya. Gambar sekarang diunggah langsung di form yang
membutuhkannya lewat `shared/components/MediaUploadField.tsx`. Modul API `media` TETAP ADA dan
justru dipakai komponen itu.

**Sidebar punya satu grup dropdown, dan hanya satu.** `Navigasi menu` (kategori, menu utama, menu
keliling) bisa dibuka-tutup dan keadaannya disimpan di localStorage lewat `useSyncExternalStore`,
bukan useState di dalam effect. Grup yang memuat halaman aktif selalu dipaksa terbuka. Grup lain
tetap judul biasa.

`apps/web` memakai **struktur default Next.js: App Router, tanpa folder `src/`.** Route ada di
`apps/web/app/`, dan alias `@/*` menunjuk ke akar app (`./*`), bukan `./src/*`. Jangan
memperkenalkan `src/` atau `pages/`.

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


### Komponen vendor berada di luar gerbang tipe

`components/lightswind` dan `components/reactbits` dikeluarkan dari `exclude` pada
`apps/web/tsconfig.json`. Alasannya, saat dipasang keduanya membawa **100 galat TypeScript** yang
membuat `next build` gagal total, dan tidak satu pun berasal dari kode kita.

Konsekuensi yang harus diingat: galat itu akan muncul kembali begitu sebuah komponen benar benar
diimpor, karena TypeScript tetap memeriksa berkas yang tersentuh rantai impor. Perbaiki per
komponen saat komponen itu diadopsi, jangan sekaligus. Ini berpasangan wajar dengan aturan
menghapus komponen yang tidak terpakai di akhir proyek: yang tidak pernah diimpor tidak pernah
perlu diperbaiki.

Jangan mengganti ini dengan `typescript.ignoreBuildErrors`. Opsi itu mematikan pemeriksaan untuk
seluruh proyek, termasuk kode kita sendiri.

---

## Desain terpilih

Client memilih konsep **06 Arus** dengan palet **Cap Jangkar 999** (`crest`).

Prototipe sumber: `prototypes/06-arus.html`, **di luar git repo ini** (repositori sendiri, lihat
di bawah). Homepage berupa satu halaman anchor-scroll dengan sembilan seksi; produksi memecahnya
jadi tujuh rute.

Arus adalah konsep **motion-first**: aurora, dock nav mengambang, split-text reveal, spotlight
bento, tilt card, magnet button, click spark. Semuanya dibangun dari `./reactbits` dan
`./lightswind` yang ditambahkan pemilik proyek.

### Palet crest: token ada di `apps/web/app/globals.css`

Nilai diambil dari piksel `jangkar-coffee-reference/logo-3.PNG`.
**Token ini adalah peran, bukan warna harfiah**, di palet terang ini `--ink-900` justru warna
paling terang, dan `--red` berisi **gold**, bukan merah.

| Token | Nilai | Peran |
|---|---|---|
| `--ink-900` | `#FBFAF8` | ground halaman |
| `--ink-800` | `#FCFAF9` | permukaan / kartu |
| `--ink-500` | `#CFBDB8` | hairline |
| `--ink-300` | `#7A4E44` | teks sekunder |
| `--ink-200` | `#5A2E24` | teks muted |
| `--paper` | `#320505` | teks utama (maroon crest) |
| `--red` | `#B08A16` | **aksen**, fill, rule, band |
| `--red-lift` | `#8A6C10` | aksen teks kecil |
| `--red-deep` | `#E8C244` | fill hover (lebih terang) |
| `--on-red` | `#320505` | fg di atas panel aksen |
| `--signal` | `#6B2218` | merah harfiah, punctuation & focus ring |

Dua hal yang dipaksa oleh warna aslinya, jangan "diperbaiki":

- **Gold crest asli `#F9DA72` hanya 1.4:1 di atas putih**, mustahil untuk fill atau teks. Karena
  itu gold antik `#B08A16` memegang fill/UI (3.10:1), dan gold cerah `#E8C244` jadi `--red-deep`.
- **Putih di atas gold hanya 3.3:1.** Fg di panel aksen adalah maroon `--on-red`, bukan putih.
  Jangan tulis `color: white` di atas `--red`.

---

## Aturan yang tidak boleh dilanggar

### Tipografi

- **Tidak ada font serif.** Inter (sans) + Geist Mono. Konsep Arus aslinya memakai JetBrains Mono,
  tapi font itu punya serif kecil pada beberapa glif, sudah diganti Geist Mono.
- **Ketebalan selalu dinyatakan eksplisit.** Jangan mengandalkan default browser atau default
  komponen. Display Arus = 800 dengan tracking negatif rapat; body = 400.

### Performa: ini menentukan, bukan preferensi

- **Tolak background WebGL dari reactbits.** Sebagian komponennya render lewat OGL/Three.js:
  bundle berat dan beban GPU terus-menerus. Trafik Indonesia didominasi Android kelas menengah,
  artinya baterai terkuras, thermal throttling, dan LCP lambat. Aurora di prototipe sengaja
  **CSS murni**. Pertahankan. Ini risiko nomor satu konsep Arus dan sudah dicatat sejak awal.
- Target: **LCP < 2.5s di 4G, CLS < 0.1, INP < 200ms.** Uji di lebar **360px**.
- Font di-self-host lewat `next/font`, bukan CDN Google. Sudah terpasang.
- Static generation untuk semua halaman konten; **ISR untuk jadwal Keliling.**

### Aksesibilitas

- Body ≥ **4.5:1**, teks besar & UI ≥ **3:1**.
- `prefers-reduced-motion: reduce` **wajib** mendegradasi ke halaman statis bersih. Prototipe
  sudah melakukannya sepenuhnya; ini biasanya hal pertama yang hilang di produksi, jangan.
- **Warna tidak pernah jadi satu-satunya pembawa makna.** Item habis dicoret **dan** dilabeli,
  bukan sekadar diredupkan.
- Focus selalu terlihat: `2px solid var(--signal)`. Jangan `outline: none`.
- Target sentuh ≥ 44px; tombol utama 52px di mobile.

### Penyimpangan sistem yang disengaja

Arus melanggar dua aturan `docs/design/design-system.md`: `radius: 0` (§5) dan budget motion
"dua benda bergerak per layar" (§6). Keduanya **sengaja**, tapi sudah dicatat bahwa sistemnya
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

## Backend dan panel admin

Express sudah ditata per modul sesuai spec: `src/modules/<nama>/{routes,controller,service,repository,schema,contract}.ts`
plus `src/shared/{contracts,middleware,db,utils,constants}`. Modul yang ada: `auth`, `user`,
`product`, `category`, `outlet`, `content`, `media`, `settings`, `timeline`, `track`, `stats`,
`contact`, `health`.

**Aturan lapisan ditegakkan, jangan dilanggar diam-diam:** hanya repository yang mengimpor klien
Supabase, dan service tidak pernah melihat objek `Request` Express. Itulah yang membuat aturan
bisnis bisa diuji tanpa menyalakan server.

Tiga hal yang mudah dirusak tanpa sadar:

- **`requireAuth` memeriksa cookie SEBELUM ketersediaan basis data.** Urutan ini disengaja.
  Permintaan tanpa sesi memang tidak terautentikasi apa pun keadaan server, dan pemanggil anonim
  tidak perlu tahu apakah server sudah punya kredensial atau belum.
- **`loginLimiter` memakai `ipKeyGenerator`, bukan `req.ip` mentah.** Satu pelanggan IPv6 memegang
  seluruh blok /64, jadi kunci berdasarkan alamat utuh bisa diputar miliaran kali dan batas per IP
  jadi tidak berarti.
- **`requireCsrf` dipasang SEBELUM multer pada unggahan media.** Token ada di header, jadi bisa
  diperiksa tanpa menyentuh badan permintaan. Kalau dibalik, permintaan tanpa token tetap membuat
  5 MB berkas dibaca ke memori lebih dulu baru ditolak.

Panelnya memakai TanStack Query terhadap Express, sonner untuk toast (posisi **kanan atas**, diubah dari kiri atas atas permintaan pemilik pada 2026-09-04), dan
recharts untuk grafik. Komponen bersama ada di `shared/components/`: `DataTable`, `FormDrawer`
(kanan, panah kiri di kiri atas, berhenti di batas sidebar), `DetailDrawer` (bawah, 85 persen),
`ConfirmDialog` (form sampai 3 medan), `FormDialog` (modal lebih dari 3 medan), `DropzoneField`,
`MediaUploadField`, `PasswordField`, `LocaleTabs`, `StatCard`, `ChartCard`. Aturan bentuk input dari pemilik proyek ditegakkan komponen-komponen itu, bukan
diingat manusia tiap halaman.

**Grafik dashboard hanya memakai data yang benar-benar ada.** Tidak ada pendapatan dan tidak ada
konversi: sistem ini tidak mencatat satu pun transaksi, jadi grafik penjualan hanya akan jadi angka
karangan. Jangan menambahkannya.

**Kunjungan situs SEKARANG ADA**, menggantikan grafik pesan kontak masuk. Angkanya nyata dan
dicatat `apps/web/middleware.ts`, bukan diperkirakan. Dua batasnya harus tetap tertulis di
keterangan kartunya: ia menghitung MUAT HALAMAN bukan manusia, dan kunjungan tanpa negara adalah
keadaan normal, bukan galat. Lihat bagian Pencatat kunjungan di bawah.

### Keliling: menu saja, tidak ada armada dan tidak ada lokasi

Seksi Keliling di situs **hanya menampilkan menu armada**, logo sub-brand, dan satu baris "jadwal
titik henti menyusul". Tidak ada jumlah armada, tidak ada titik singgah, tidak ada jadwal.

Panel sempat punya halaman yang mengurus unit armada dan jadwal, dan itu salah: ia mengelola data
yang tidak pernah dilihat satu pengunjung pun. Tabel `keliling_unit` dan `keliling_schedule`
beserta modul API-nya **sudah dihapus** lewat migrasi `20260903_0110_drop_keliling.sql`. Jangan
menghidupkannya kembali tanpa lebih dulu menambahkan blok jadwal ke situsnya.

Isi menu Keliling hidup di `product_channel` dengan channel `keliling`, dikelola halaman
`/keliling` di panel, dan dibaca situs lewat `modules/home/lib/keliling-menu.ts`.

**Pengelompokan dua kategori adalah ATURAN TAMPILAN, bukan skema.** Poster aslinya membagi menu
jadi Coffee dan Non-Coffee, sedangkan tiap produk hanya punya satu kategori yang mengikuti menu
outlet: "Kopi Susu Jangkar" ada di Signature Series di sana. Satu kolom tidak bisa melayani dua
menu yang mengelompokkan berbeda, jadi aturannya sederhana: berkategori `non-coffee` masuk
Non-Coffee, sisanya Coffee. Terukur, hasilnya sama persis dengan poster aslinya, enam kopi dan
empat non-kopi.

### Slug dibuat otomatis, lalu DIKUNCI

Form panel tidak punya medan slug lagi. Server membuatnya dari judul Indonesia saat item dibuat
(`apps/api/src/shared/utils/slug.ts`), dan pada UPDATE slug yang dikirim justru DIBUANG.

Alasannya bukan kerapian. `category.slug === "non-coffee"` adalah aturan yang memisahkan kelompok
Coffee dan Non-Coffee di menu keliling, lihat `modules/home/lib/keliling-menu.ts`. Kalau slug ikut
berubah saat nama kategori disunting, mengganti "Non-Coffee" jadi "Tanpa Kopi" akan memindahkan
empat item ke kelompok yang salah TANPA satu pun pesan galat. Kegagalan diam adalah kegagalan
terburuk.

Berlaku untuk produk dan kategori. **Slug outlet tetap manual**, tidak diminta dan isinya satu
baris HQ.

### Pencatat kunjungan ada di middleware situs, bukan di API

`x-vercel-ip-country` hanya BENAR pada permintaan yang langsung dari peramban ke proyek web. API
dipanggil lewat proksi rewrite, jadi kalau API yang membacanya, yang terbaca adalah negara
datacenter Vercel. Karena itu `apps/web/middleware.ts` yang membacanya lalu meneruskannya ke
`POST /track/visit` dengan header rahasia `TRACK_SECRET`, yang harus diisi SAMA PERSIS di kedua
proyek.

Tiga hal yang mudah dirusak:

- **Dicatat hanya pada segmen yang sudah berprefiks locale.** Pengunjung yang membuka `/` melewati
  middleware DUA KALI, sekali untuk dialihkan dan sekali untuk halamannya. Mencatat di kedua
  tempat melipatgandakan angkanya.
- **Tanpa `TRACK_SECRET`, endpointnya MATI, bukan terbuka.** Gagal tertutup, bukan gagal terbuka.
- **IP mentah tidak pernah disimpan.** Ia bahan `visitor_hash` bersama user agent, garam, dan
  TANGGAL, lalu dibuang. Tanggal ikut masuk hash supaya jejak seseorang tidak bisa dirangkai antar
  hari. Pola yang sama dengan `contact_message.ip_hash`.

Agregasinya di Postgres (`visits_by_day`, `visits_by_country`), BUKAN di Node, karena satu baris
per muat halaman akan berubah dari lambat menjadi kehabisan memori kalau ditarik semua ke memori.

### Ikon merek TIDAK ADA di lucide v1

Diperiksa langsung terhadap 4.096 berkas ikon yang terpasang: lucide versi 1 sudah mencabut seluruh
ikon merek. Tidak ada Instagram, Facebook, YouTube, maupun LinkedIn. Jadi ikon sosial media memakai
path simple-icons berlisensi CC0 di `components/ui/social-icons.tsx`, pola yang sudah dipakai glif
Shopee. Jangan menghabiskan waktu mencarinya di lucide.

Setiap ikon WAJIB berpasangan dengan nama platform yang terbaca pembaca layar. Glifnya sendiri
`aria-hidden`, jadi namanya dibawa `aria-label` pada tautannya.

### Situs membaca outlet dari basis data, bukan konstanta lagi

Halaman `/outlet` di panel dulu menyunting tabel yang TIDAK PERNAH dibaca situs: `OutletSection`
membaca konstanta `HQ`. Itu persis kegagalan yang sudah diperbaiki untuk Keliling, panel yang
mengelola data tak terlihat. Sejak 2026-09-04 situs membacanya lewat `modules/home/lib/outlet.ts`.

Konstanta `HQ` di `menu-data.ts` MASIH ADA dan masih dipakai, tapi hanya sebagai CADANGAN di dalam
`lib/outlet.ts` dan `lib/site-settings.ts` bila API mati saat build. Jangan menghapusnya.

### Situs membaca isinya dari basis data, bukan dari kode

Sejak 2026-09-04 hampir seluruh isi situs datang dari basis data. Sebelum itu ada tiga lubang yang
bentuknya sama: panel menyunting sesuatu yang tidak pernah dilihat pengunjung.

**Yang terbesar: editor `/content` sama sekali tidak tersambung.** Endpoint `GET /content/public`
sudah ada dan berfungsi sejak awal, tapi NOL pemanggil di `apps/web`. Seluruh teks situs datang
dari `i18n/dictionaries/`, jadi menyunting 86 medan di panel tidak berpengaruh apa pun dan tidak
ada satu pesan galat pun yang memberi tahu. Yang menyambungkannya adalah
`apps/web/i18n/site-dictionary.ts`.

**Cara kerjanya: MENIMPA, bukan mengganti.** Kamus statis dimuat lebih dulu, lalu nilai dari basis
data ditimpakan di atasnya menurut jalur bertitik. Tiga akibat yang membuat pendekatan ini aman:

- Tipe `Dictionary` tidak berubah, jadi **nol komponen situs perlu disentuh**.
- Medan kosong di basis data jatuh ke kamus. Halaman tanpa judul jauh lebih merusak daripada
  halaman berjudul lama.
- API mati saat build berarti situs memakai kamus, persis seperti sebelumnya. Build tidak pernah
  gagal karenanya.

Dua hal yang mudah dirusak di berkas itu:

- **Kamus disalin dalam (`structuredClone`) sebelum ditimpa.** `getDictionary` memakai `import()`
  statis, dan modul Node hanya dievaluasi sekali per proses. Menimpa objeknya langsung membuat
  nilai satu permintaan bocor ke permintaan berikutnya, termasuk ke locale yang lain.
- **Jalur yang tidak ada di kamus DIABAIKAN, tidak dibuat.** Baris basis data yang tidak dikenali
  komponen mana pun memang tidak punya tempat untuk ditampilkan, dan menyuntikkannya hanya membuat
  objeknya berbeda dari tipenya sendiri.

`about.body` dan `menu.notes` adalah ARRAY di kamus tapi satu string dipisah baris baru di basis
data, karena begitulah skrip seed menyimpannya dan begitu pula editor menampilkannya. Penimpaannya
memecah dengan `split("\n")` saat targetnya array.

**Menu outlet juga sudah dari basis data**, lewat `modules/home/lib/outlet-menu.ts`. Berbeda dengan
menu keliling yang mengelompokkan dengan aturan tampilan dua ember, menu outlet memakai kategori
sungguhan beserta urutannya, jadi mengganti nama kategori di `/category` langsung mengubah judul
kartu di situs. Ia mengambil produk DAN kategori sekaligus, karena nama kategori tidak ikut di
respons produk yang hanya membawa `categorySlug`.

**Produk tanpa kategori tidak tampil di menu situs**, karena kartunya adalah kategorinya. Itu
disengaja dan dibuat terlihat di dua tempat: lencana "Tanpa kategori, tidak tampil" di kolom
Kategori pada `/menu`, dan `console.warn` menyebut SKU-nya saat build.

**Konstanta dan kamus TIDAK boleh dihapus.** Keduanya berhenti jadi sumber kebenaran tapi tetap
jadi cadangan saat API tidak bisa dihubungi ketika build.

### Peta pengunjung: choropleth SVG, JANGAN kembalikan ke Leaflet

Peta negara pengunjung di dashboard memakai `react-svg-worldmap`, bukan Leaflet,
dan penggantian itu menyelesaikan dua hal sekaligus.

**Bug di ponsel.** Leaflet memasang z-index 600 sampai 1000 pada pane penanda,
tooltip, dan kontrolnya. Sidebar panel hanya 60 dan scrim-nya 55. Akibatnya
membuka sidebar di layar kecil membuat isi peta tetap tercetak DI ATAS sidebar.
SVG biasa tidak punya satu pun z-index, jadi kelas masalah itu hilang, bukan
ditambal dengan menaikkan angka.

**Bentuk yang diminta pemilik.** Penanda titik tidak menjawab "negara mana yang
datang". Choropleth menjawabnya langsung: negaranya sendiri yang berwarna, dan
makin banyak kunjungan makin pekat.

Warnanya dari palet crest, bukan skala bawaan pustaka: `#E8C244` (`--red-deep`)
untuk paling sedikit sampai `#6B2218` (`--signal`) untuk paling banyak. Negara
tanpa kunjungan abu netral, sengaja bukan versi paling pucat dari rentang itu,
supaya "nol" tidak pernah salah dibaca sebagai "sedikit". Skalanya AKAR bukan
linear, karena satu negara yang jauh lebih ramai akan membuat sisanya tampak
seragam.

Leaflet TETAP TERPASANG dan masih dipakai `OutletMap` di situs publik. Jangan
dicabut dari dependensi.

**Sekitar 40 negara terlalu kecil untuk digambar pustaka ini**, termasuk
Singapura dan Hong Kong. Itu bukan bug: pada skala dunia bentuknya memang tidak
terlihat. Mereka tetap muncul di daftar peringkat bertuliskan angka di bawah
peta, dan komponen menyebut namanya secara eksplisit. Daftar itu juga yang
memenuhi aturan bahwa warna tidak boleh jadi satu-satunya pembawa makna.

### Bug fokus input: jangan taruh `onClose` di dependensi effect

Keempat komponen overlay (`FormDrawer`, `FormDialog`, `ConfirmDialog`, `DetailDrawer`) merebut
fokus di dalam sebuah effect. Effect itu dulu bergantung pada `onClose`, sementara SELURUH pemanggil
mengirimnya sebagai arrow inline yang identitasnya baru pada setiap render induk. Akibatnya setiap
kali induk render ulang, entah karena kueri TanStack selesai atau state lain berubah, effect
berjalan lagi dan MEREBUT FOKUS ke tombol pertama di panel. Pemakai yang sedang mengetik tiba-tiba
mendarat di tombol.

Terukur di peramban sungguhan sebelum diperbaiki: mengetik di medan tahun akhir pada modal Timeline
melompatkan fokus kembali ke medan tahun, dengan tepat satu panggilan `.focus()` dari kode.

Perbaikannya: `onClose` dipegang lewat ref yang selalu mutakhir, dan effect hanya bergantung pada
`open`. Kalau menambah komponen overlay baru, pakai pola yang sama. Jangan pernah memasukkan
callback prop ke dependensi effect yang punya efek samping terlihat.

Pola pasangannya: **`useWatch` jangan dipasang di komponen form yang besar.** Langganannya membuat
seluruh form render ulang pada setiap ketikan. Pisahkan medannya jadi komponen kecil, seperti
`ProductImageField` di `ProductFormDrawer.tsx`.

### API diproksikan lewat origin situs, jangan diubah jadi panggilan langsung

Peramban **tidak pernah** memanggil `apps/api` secara langsung. Ia memanggil `/api/...` pada origin
situs, dan `apps/web/next.config.ts` meneruskannya ke `API_ORIGIN`. Karena itu tidak ada
`NEXT_PUBLIC_API_URL` di kode mana pun.

Alasannya bukan kerapian. Cookie sesi panel adalah httpOnly `SameSite=Lax`, dan dua proyek Vercel
mendapat domain `a.vercel.app` dan `b.vercel.app`. Terverifikasi: **`vercel.app` ada di Public
Suffix List**, jadi kedua subdomain itu LINTAS SITE dan peramban tidak akan pernah mengirim cookie
Lax ke sana. Tanpa proksi ini, panel admin mustahil dimasuki di domain bawaan Vercel maupun di
preview deployment. Sebagai bonus, CORS lenyap sepenuhnya.

Terbukti di lokal: sepanjang alur masuk sampai menyimpan perubahan, peramban hanya menghubungi satu
host. `COOKIE_DOMAIN` karena itu harus **kosong**, termasuk di produksi.

Pengambilan data sisi server tetap memakai `API_ORIGIN` absolut, karena ia terjadi saat build dan
tidak punya origin untuk dijadikan acuan relatif.

### Batas unggah 4 MB ditentukan Vercel, bukan selera

Batas body permintaan Vercel Functions adalah 4,5 MB. Nilai di
`apps/api/src/modules/media/media.contract.ts` dan `apps/web/modules/media/hooks/useMedia.ts` harus
**sama** dan harus tetap di bawah itu, kalau tidak penolakan terjadi di Vercel dengan halaman galat
mereka, bukan di form dengan pesan kita.

### Batas laju melemah di serverless, dan itu belum diperbaiki

`express-rate-limit` memakai memori proses. Di Vercel setiap instance punya memorinya sendiri, jadi
"5 per menit" berarti 5 per menit PER INSTANCE. API mencetak peringatan sekali saat start di
produksi. Perbaikannya store bersama, dan itu menunggu keputusan pemilik proyek. Lihat `DEPLOY.md`.

### Keluaran build bergantung API, dan itu punya dua jebakan

`RoasterySection` dan `KelilingSection` mengambil datanya lewat `fetch` saat build. Akibatnya:

1. **Cache fetch Next** menyimpan respons selama `revalidate` (300 detik), jadi build ulang dalam
   rentang itu memakai data lama. Untuk memverifikasi perubahan data secara lokal:
   `rm -rf apps/web/.next/cache/fetch-cache` lebih dulu.
2. **Cache Turborepo** bisa memutar ulang seluruh keluaran build tanpa menjalankannya, karena ia
   hanya melihat berkas sumber dan tidak tahu data di API sudah berubah. Pakai
   `npx turbo run build --force` kalau perlu memastikan.

Di produksi keduanya tidak berbahaya, ISR menyegarkan halamannya sendiri dalam lima menit. Yang
menyesatkan hanyalah verifikasi lokal.

**Kedua seksi itu selalu punya cadangan konstanta.** Kalau API mati saat build, halaman jatuh ke
`menu-data.ts` alih-alih menggagalkan build. Jangan mencabut cadangannya.

---

## Data & rahasia

**Supabase**, project ref `fylxkwqwuaidbfpmdwhu`. Saat M0 ditulis: kosong total, nol tabel
`public`, nol migrasi, nol bucket.

Aturan dari `secrets/ACCESS.md`:

- Secret **hanya** lewat environment variable. Jangan pernah hardcode.
- Jangan pernah mencetak key ke chat, log, atau commit.
- Prioritaskan read-only; menulis hanya dengan persetujuan eksplisit.
- Jangan membuat migrasi tanpa review.

`sb_secret_…` adalah key **rahasia**, tidak boleh menyentuh browser, tidak boleh diberi prefix
`NEXT_PUBLIC_`. Yang boleh ke browser hanya key *publishable*.

### Tiga folder di luar git

`.gitignore` memblokir ketiganya:

| Folder | Alasan |
|---|---|
| `prototypes/` | repositori git tersendiri dengan remote sendiri, jangan di-commit ke sini |
| `secrets/` | memuat kredensial |
| `jangkar-coffee-reference/` | aset sumber mentah (~9MB) |

Ketiganya tetap ada di disk dan boleh dibaca sebagai referensi, hanya tidak dilacak git.

---

## Dokumen desain

`docs/design/` adalah sumber kebenaran, dan isinya **beropini**, baca alasannya, bukan cuma
kesimpulannya.

| File | Isi |
|---|---|
| `brand-analysis.md` | Analisis aset. Tiga mark, bukan satu. Warna hasil sampling. |
| `design-system.md` | Token, tipografi, spasi, grid, motion, lantai aksesibilitas. §1b memuat keenam palet. |
| `information-architecture.md` | Tujuh rute, urutan homepage, model konten |
| `future-scope.md` | Entitas domain, cakupan admin, SEO, performa |
| `design-comparison.md` | Keenam konsep dibandingkan; §06 memuat peringatan Arus |

Catatan: `future-scope.md` §9 mengusulkan `web` + `admin` sebagai dua app tanpa Express. Repo ini
menyimpang, satu app Next.js (publik + admin) plus API Express. Dokumen belum diperbarui.
