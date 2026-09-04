-- Bucket penyimpanan media.
--
-- KENAPA MIGRASI INI ADA. Modul media sudah lengkap sejak awal: multer, cek
-- magic bytes, batas 4 MB, nama berkas acak, alt text dua bahasa. Yang tidak
-- pernah ada adalah BUCKET-nya. `storage.buckets` benar-benar kosong, nol
-- baris, jadi setiap `storage.from('public-media').upload()` gagal dan pemilik
-- proyek melihatnya sebagai "unggah tidak bisa". Bukan bug kode, melainkan satu
-- langkah penyiapan yang terlewat.
--
-- `public = true` BUKAN kelalaian. media.repository.ts memanggil
-- `getPublicUrl()`, bukan `createSignedUrl()`, dan URL itu dipakai situs publik
-- yang dirender statis saat build. URL bertanda tangan punya masa berlaku, jadi
-- ia akan mati di HTML yang sudah tercetak. Bucket publik adalah satu-satunya
-- bentuk yang cocok dengan cara situs ini dibangun.
--
-- Batas ukuran dan daftar MIME digandakan dari
-- apps/api/src/modules/media/media.contract.ts. Digandakan DENGAN SENGAJA:
-- lapisan aplikasi menolak lebih dulu supaya pesannya muncul di form, dan
-- lapisan storage menolak sebagai jaring terakhir kalau ada yang memanggil
-- Supabase tanpa lewat API kita. Kalau salah satu diubah, ubah keduanya.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  4194304, -- 4 MB, sama dengan MAX_UPLOAD_BYTES; ditentukan batas body 4,5 MB Vercel
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Tidak ada policy pada storage.objects, dan itu disengaja, sama seperti
-- seluruh tabel public di proyek ini. Penulisan hanya lewat Express memakai
-- secret key yang melewati RLS, dan pembacaan sudah dibuka oleh `public = true`
-- pada bucketnya. Menambah policy di sini hanya akan memberi kunci kepada
-- publishable key, dan publishable key memang tidak boleh menulis apa pun.
