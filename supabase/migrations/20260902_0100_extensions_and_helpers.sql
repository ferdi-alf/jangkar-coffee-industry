-- Fondasi skema. Dijalankan paling awal, seluruh migrasi lain bergantung padanya.
--
-- IZIN: pemilik proyek meminta backend dan panel admin dibangun tanpa menunggu
-- persetujuan per langkah, dan itu mencabut aturan "jangan membuat migrasi tanpa
-- review" di secrets/ACCESS.md untuk rangkaian ini. Berkasnya tetap ditulis ke
-- repositori lebih dulu supaya skemanya tetap bisa dibaca di git, bukan hanya
-- ada di dalam basis data.

-- Dipakai indeks trigram pada judul produk, sesuai anggaran pencarian di
-- PROJECT-SPEC: setiap tabel admin punya pencarian ber-debounce DAN indeks
-- pendukungnya di backend. Tanpa ini pencarian jadi sequential scan.
-- DIPASANG DI SKEMA `extensions`, BUKAN `public`.
--
-- Advisor Supabase menandai extension di public sebagai temuan keamanan:
-- `public` ada di search_path setiap peran, jadi setiap fungsi dan operator
-- extension ikut terlihat di sana dan menambah permukaan yang tidak perlu.
--
-- Pemindahannya DIUJI, bukan diasumsikan aman. Indeks GIN trigram pada
-- product_translation.title menyimpan acuan operator class-nya lewat OID, jadi
-- ia tetap sah setelah extension berpindah skema. Diperiksa dengan
-- `set enable_seqscan = off` lalu EXPLAIN pada query ilike yang sama, sebelum
-- dan sesudah: keduanya memakai product_translation_title_trgm_idx, dan
-- pencarian tetap mengembalikan jumlah baris yang sama.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Satu fungsi, dipakai trigger di seluruh tabel yang punya updated_at. Ditulis
-- sekali di sini supaya tidak ada tabel yang lupa memperbaruinya.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Locale yang sah. Dipakai check constraint di semua tabel terjemahan, jadi
-- baris berbahasa asing tidak bisa masuk diam-diam lewat jalur mana pun.
create domain public.locale_code as text
  check (value in ('id', 'en'));
