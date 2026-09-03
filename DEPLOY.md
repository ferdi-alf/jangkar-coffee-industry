# Deploy ke Vercel

Panduan operasional untuk menaikkan Jangkar Coffee Industry ke Vercel. Ditulis untuk dijalankan
berurutan, dan setiap langkah punya cara memeriksanya sendiri.

Baca sekali sampai habis sebelum mulai. Ada dua hal di bagian **Keterbatasan yang diketahui** yang
lebih baik Anda tahu sekarang daripada saat sudah tayang.

---

## Ringkasan arsitektur

**Dua proyek Vercel dari satu repositori.**

```
                    peramban pengunjung
                            |
                            |  hanya pernah bicara ke SATU host
                            v
        ┌───────────────────────────────────────┐
        │  Proyek WEB        apps/web           │
        │  Next.js 16, situs publik + panel     │
        │                                       │
        │  /id  /en          halaman publik     │
        │  /dashboard ...    panel admin        │
        │  /api/*            diteruskan  ───────┼──┐
        └───────────────────────────────────────┘  │
                                                   │ server ke server
                                                   v
        ┌───────────────────────────────────────┐
        │  Proyek API        apps/api           │
        │  Express 5 sebagai satu function      │
        └───────────────────────┬───────────────┘
                                │ kunci rahasia
                                v
                          Supabase (Postgres + Auth + Storage)
```

**Peramban tidak pernah memanggil proyek API secara langsung.** Ia memanggil `/api/...` pada origin
situs, dan Next meneruskannya. Ini bukan kerapian, ini yang membuat deploy-nya bisa jalan sama
sekali:

- **Cookie sesi.** Panel memakai cookie httpOnly `SameSite=Lax`. Dua proyek Vercel mendapat domain
  `a.vercel.app` dan `b.vercel.app`, dan `vercel.app` **ada di Public Suffix List**, jadi keduanya
  LINTAS SITE. Peramban tidak akan pernah mengirim cookie Lax ke sana dan panel mustahil dimasuki.
  Dengan proksi ini cookienya selalu first-party, dan itu berlaku juga di preview deployment.
- **CORS.** Tidak ada permintaan lintas origin dari peramban, jadi tidak ada preflight dan tidak ada
  allowlist yang bisa salah diisi.

Diverifikasi di lokal: sepanjang alur masuk sampai menyimpan perubahan, peramban hanya menghubungi
satu host. Kodenya ada di `apps/web/next.config.ts`.

---

## Sebelum mulai

- Repositori sudah di GitHub, GitLab, atau Bitbucket.
- Supabase project `fylxkwqwuaidbfpmdwhu` **sudah bermigrasi dan terisi**. Kalau ini basis data
  baru, jalankan seluruh berkas di `supabase/migrations/` berurutan menurut namanya lebih dulu.
- Nilai dari `secrets/ACCESS.md` ada di tangan. Folder itu di luar git dan memang harus begitu.

Node 24 adalah default di Vercel dan `package.json` sudah memakunya di `engines.node: "24.x"`.
`.nvmrc` hanya untuk nvm di mesin Anda, Vercel tidak membacanya.

---

## Langkah 1, proyek API

Buat proyek Vercel baru dari repositori ini.

| Pengaturan | Nilai |
|---|---|
| Project Name | `jangkar-api` |
| Root Directory | `apps/api` |
| Include files outside Root Directory | **nyalakan**, ini monorepo npm workspaces |
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | kosongkan |
| Install Command | kosongkan, biarkan bawaan |

Build Command sengaja diisi meski Vercel mengkompilasi `api/index.ts` sendiri. `tsc` yang dijalankan
di sana membuat galat tipe menggagalkan deploy, bukan menunggu sampai ada yang menemukannya di
produksi.

### Environment Variables proyek API

Isi untuk **Production** dan **Preview**.

| Nama | Nilai | Catatan |
|---|---|---|
| `SUPABASE_URL` | `https://fylxkwqwuaidbfpmdwhu.supabase.co` | |
| `SUPABASE_SECRET_KEY` | dari `secrets/ACCESS.md` | **rahasia**, jangan pernah berprefiks `NEXT_PUBLIC_` |
| `SUPABASE_MEDIA_BUCKET` | `public-media` | |
| `NODE_ENV` | `production` | menyalakan cookie `Secure` dan menyembunyikan pesan galat asli |
| `CONTACT_IP_SALT` | string acak panjang, baru | jangan pakai yang di `.env` lokal |
| `CORS_ORIGINS` | URL proyek web | pagar cadangan, peramban tidak memakainya |
| `COOKIE_DOMAIN` | **kosongkan** | lihat peringatan di bawah |

> **`COOKIE_DOMAIN` harus kosong.** Cookie dipasang lewat proksi, jadi peramban sudah menyimpannya
> untuk origin situs tanpa perlu diberi tahu. Mengisinya justru menyebarkan cookie sesi admin ke
> setiap subdomain, termasuk yang tidak ada hubungannya dengan panel.

`ADMIN_BOOTSTRAP_*` **tidak perlu** di Vercel. Skrip bootstrap dijalankan dari mesin Anda.

### Periksa sebelum lanjut

Deploy, lalu jalankan ini. **Jangan lanjut kalau salah satunya gagal.**

```bash
API=https://jangkar-api.vercel.app     # ganti dengan URL Anda

curl -s $API/health
# harus: {"success":true,"data":{"service":"@jangkar/api","env":"production"},"meta":{...}}

curl -s "$API/products?perPage=1" | head -c 200
# harus amplop success dengan meta.total = 34

curl -s $API/stats/overview
# harus: UNAUTHENTICATED, bukan 404 dan bukan halaman galat Vercel
```

`/health` yang menjawab **404** berarti routing Express tidak menerima path aslinya. Lihat
**Pemecahan masalah** di bawah.

---

## Langkah 2, akun admin pertama

Lewati kalau akun owner sudah ada, dan untuk basis data ini memang sudah ada.

Dijalankan dari mesin Anda, bukan di Vercel, karena kata sandinya tidak boleh melewati log build:

```bash
# apps/api/.env harus berisi SUPABASE_URL, SUPABASE_SECRET_KEY,
# ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD (minimal 12 karakter)
npm run bootstrap:admin -w apps/api
```

Setelah berhasil masuk, **ganti kata sandinya lalu hapus `ADMIN_BOOTSTRAP_PASSWORD` dari `.env`.**

---

## Langkah 3, proyek Web

Buat proyek Vercel kedua dari repositori yang sama.

| Pengaturan | Nilai |
|---|---|
| Project Name | `jangkar-web` |
| Root Directory | `apps/web` |
| Include files outside Root Directory | **nyalakan** |
| Framework Preset | Next.js |
| Build Command | kosongkan, bawaan Next.js |
| Output Directory | kosongkan |

### Environment Variables proyek Web

| Nama | Nilai | Catatan |
|---|---|---|
| `API_ORIGIN` | URL proyek API, misalnya `https://jangkar-api.vercel.app` | **tanpa** garis miring di akhir, **tanpa** prefiks `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | URL publik situs | dipakai `metadataBase` untuk Open Graph |

Hanya dua. Proyek web **tidak boleh** punya satu pun kredensial Supabase: ia tidak pernah menyentuh
basis data secara langsung.

> **`API_ORIGIN` dibaca saat BUILD, bukan hanya saat runtime.** Seksi Roastery dan Keliling
> mengambil datanya saat build. Karena itu **proyek API harus sudah hidup sebelum proyek web
> dibangun.** Kalau tidak, situs tetap terbangun tapi memakai konstanta cadangan di
> `modules/home/constants/menu-data.ts`, dan tombol marketplace tidak akan menavigasi ke mana pun.
> Kalau itu terjadi, cukup Redeploy proyek web setelah API hidup.

---

## Langkah 4, verifikasi setelah tayang

```bash
WEB=https://jangkar-web.vercel.app     # ganti dengan URL Anda

# 1. Situs publik dua bahasa
curl -s -o /dev/null -w "%{http_code}\n" $WEB/id
curl -s -o /dev/null -w "%{http_code}\n" $WEB/en          # keduanya 200

# 2. Pengunjung baru dialihkan menurut Accept-Language
curl -s -o /dev/null -w "%{redirect_url}\n" -H "Accept-Language: en-GB,en;q=0.9" $WEB/
# harus berakhir di /en

# 3. Proksi API hidup di origin situs
curl -s $WEB/api/health                                    # amplop success
curl -s $WEB/api/stats/overview                            # UNAUTHENTICATED, bukan 404

# 4. Panel terkunci
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" $WEB/dashboard
# harus 307 ke /login?next=%2Fdashboard

# 5. Mutasi tanpa token CSRF ditolak
curl -s -X POST $WEB/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"panjangsekali"}'
# harus CSRF_INVALID
```

Lalu dengan peramban:

1. Buka `/login`, masuk. Harus mendarat di `/dashboard` dengan angka yang benar.
2. Buka `/keliling`, matikan satu item, pastikan toast muncul di **kiri atas**.
3. Buka `/id`, gulir ke Roastery. Tombol Shopee dan Tokopedia harus tampil.
4. Kirim satu pesan dari form kontak, pastikan muncul di `/pesan`.

Kalau langkah 1 gagal dengan galat sesi, itu hampir pasti `API_ORIGIN` salah atau `COOKIE_DOMAIN`
terisi.

---

## Domain sendiri

Tambahkan domain **hanya ke proyek WEB**, misalnya `kopijangkar.com`. Proyek API tidak perlu domain
sendiri: ia tidak pernah dibuka langsung oleh peramban.

Setelah domain aktif, perbarui:

- proyek web: `NEXT_PUBLIC_SITE_URL=https://kopijangkar.com`
- proyek API: `CORS_ORIGINS=https://kopijangkar.com`

`COOKIE_DOMAIN` tetap kosong. Redeploy keduanya.

---

## Pengaturan Supabase yang masih perlu dinyalakan

Satu temuan advisor yang masih terbuka, dan ia setelan dashboard bukan kode:

**Authentication, Policies, Leaked password protection.** Nyalakan. Supabase akan memeriksa kata
sandi terhadap HaveIBeenPwned saat akun dibuat atau diubah. Ini penting justru karena batas laju
login melemah di serverless, lihat bagian berikutnya.

Sembilan belas temuan `rls_enabled_no_policy` bertingkat INFO **memang disengaja** dan tidak perlu
diapa-apakan. RLS menyala tanpa policy adalah intinya: hanya kunci rahasia di server yang bisa
menembus, dan tidak ada satu pun jalur dari peramban ke basis data. Alasannya tertulis di
`supabase/migrations/20260902_0150_rls.sql`.

---

## Keterbatasan yang diketahui

Tiga hal yang sudah terukur dan sebaiknya Anda tahu, bukan ditemukan sendiri nanti.

### 1. Batas laju melemah di serverless

`express-rate-limit` memakai penyimpanan di memori proses. Di serverless setiap instance punya
memorinya sendiri dan instance-nya berlipat mengikuti trafik, jadi "5 per menit" sebenarnya berarti
**5 per menit per instance**. Penyerang yang paralel mendapat kelipatan dari angka yang tertulis.

Ini tidak bisa diperbaiki dengan mengubah angkanya. Perbaikannya adalah store bersama seperti
`rate-limit-redis` dengan Upstash, dan itu menambah satu layanan sehingga menunggu keputusan Anda.
Sampai itu ada, pagar sesungguhnya untuk akun admin adalah kata sandi yang kuat dan perlindungan
kata sandi bocor di atas. API mencetak peringatan sekali saat start di produksi supaya ini tidak
terlupakan.

### 2. Unggahan berkas dibatasi 4 MB, bukan 5

Batas body permintaan Vercel Functions adalah **4,5 MB**. Berkas di atas itu ditolak Vercel dengan
413 sebelum kode kita jalan, jadi penggunanya melihat halaman galat Vercel alih-alih pesan kita.
Batasnya sudah diturunkan ke 4 MB di kedua sisi supaya penolakannya terjadi di form, dengan pesan
yang benar dan dua bahasa.

### 3. Keluaran build bergantung data API

Seksi Roastery dan Keliling mengambil datanya saat build. Akibatnya di lokal ada dua lapis cache
yang bisa membuat verifikasi menyesatkan:

```bash
rm -rf apps/web/.next/cache/fetch-cache   # cache fetch Next, umur 300 detik
npx turbo run build --force               # cache Turborepo tidak tahu data berubah
```

Di produksi keduanya tidak berbahaya: halaman memakai ISR `revalidate: 300`, jadi ia menyegarkan
dirinya sendiri dalam lima menit tanpa perlu deploy ulang. Yang tersesat hanya pemeriksaan lokal.

### 4. Menu outlet masih dari kode

Menu Keliling sudah dibaca dari basis data dan bisa diubah dari panel. **Menu outlet di seksi Menu
masih membaca konstanta** di `modules/home/constants/menu-data.ts`, jadi mengubahnya menuntut
perubahan kode dan deploy ulang. Ini pekerjaan yang belum diminta, bukan kerusakan.

---

## Deploy ulang dan rollback

**Deploy ulang.** Push ke branch produksi. Kalau hanya data yang berubah dan bukan kode, situs
menyegarkan dirinya sendiri dalam lima menit lewat ISR; deploy ulang hanya mempercepatnya.

**Rollback.** Vercel menyimpan setiap deployment. Buka Deployments, pilih yang sebelumnya, lalu
Promote to Production. Ini **tidak** membalikkan basis data. Kalau masalahnya ada di migrasi, tulis
migrasi baru yang membatalkannya, jangan mengandalkan rollback deployment.

**Urutan saat mengubah keduanya.** API lebih dulu, web belakangan. Web membaca API saat build, jadi
membalik urutannya berarti web dibangun terhadap API versi lama.

---

## Pemecahan masalah

**`/health` di proyek API menjawab 404.**
Berarti rewrite `"/(.*)"` ke `"/api"` di `apps/api/vercel.json` tidak meneruskan path aslinya ke
Express, jadi Express melihat `/api` untuk setiap permintaan. Periksa Runtime Logs proyek API:
kalau setiap baris menunjukkan path `/api`, itu penyebabnya. Gantikan isi `vercel.json` dengan:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }]
}
```

lalu deploy ulang dan ulangi `curl $API/health`.

**Panel bisa dibuka tapi selalu terlempar ke `/login`.**
Cookie tidak sampai. Periksa berurutan: `API_ORIGIN` menunjuk proyek API yang benar dan tanpa garis
miring di akhir; `COOKIE_DOMAIN` **kosong**; `NODE_ENV=production` terisi di proyek API. Buka DevTools
Network, panggilan `/api/auth/login` harus ke origin situs, bukan ke `*.vercel.app` yang lain.

**Seluruh daftar kosong padahal login berhasil.**
Ini gejala klien Supabase yang konteks auth-nya tertimpa. Seharusnya sudah tidak mungkin terjadi
karena alur masuk memakai klien sekali pakai, tapi kalau muncul, periksa `createAuthClient` di
`apps/api/src/shared/db/supabase.ts` masih dipakai oleh `signIn` dan `refresh`. Alasannya ada di
komentar berkas itu.

**Tombol marketplace tidak menavigasi.**
Bukan kerusakan. Tautan tokonya belum diisi. Buka `/management-product`, isi URL Shopee dan
Tokopedia pada produk yang dijual, lalu tunggu lima menit atau Redeploy proyek web.

**Build web gagal dengan galat fetch.**
Tidak seharusnya terjadi: kedua pengambilan data punya cadangan dan menangkap galatnya. Kalau tetap
terjadi, baca Build Logs dan cari baris berawalan `[roastery]` atau `[keliling]`, keduanya mencetak
sebab kegagalannya.
