-- Kunjungan situs.
--
-- Tabel pertama di proyek ini yang mencatat perilaku pengunjung, jadi batasnya
-- ditulis di depan, bukan ditemukan belakangan.
--
-- YANG DISIMPAN: tanggal, kode negara, jalur halaman, bahasa, dan sebuah hash.
-- YANG TIDAK PERNAH DISIMPAN: alamat IP, user agent mentah, dan apa pun yang
-- bisa dipakai mengenali orangnya di luar hari itu.
--
-- `visitor_hash` adalah SHA-256 dari IP + user agent + garam rahasia + TANGGAL.
-- Tanggal ikut masuk hash dengan sengaja: hash orang yang sama berubah setiap
-- lewat tengah malam, jadi ia hanya bisa menjawab "berapa pengunjung berbeda
-- hari ini" dan tidak pernah bisa merangkai jejak seseorang antar hari. Pola
-- yang sama sudah dipakai `contact_message.ip_hash`.
--
-- Kode negara datang dari header `x-vercel-ip-country` yang dibaca middleware
-- Next. Ia BOLEH NULL, dan itu keadaan normal, bukan galat: di lokal header itu
-- memang tidak ada.

create table if not exists public.site_visit (
  id           uuid primary key default gen_random_uuid(),
  day          date        not null default current_date,
  country      text                 check (country is null or country ~ '^[A-Z]{2}$'),
  path         text        not null,
  locale       text                 check (locale is null or locale in ('id', 'en')),
  visitor_hash text        not null,
  created_at   timestamptz not null default now()
);

-- Dua indeks untuk dua pertanyaan yang benar-benar ditanyakan dashboard:
-- "berapa kunjungan per hari selama 30 hari" dan "negara mana saja".
create index if not exists site_visit_day_idx on public.site_visit (day desc);
create index if not exists site_visit_country_idx on public.site_visit (country, day desc);

-- Menghitung pengunjung unik per hari adalah COUNT(DISTINCT visitor_hash) yang
-- dibatasi rentang tanggal. Indeks gabungan ini yang membuatnya tidak memindai
-- seluruh tabel setiap kali dashboard dibuka.
create index if not exists site_visit_day_hash_idx on public.site_visit (day, visitor_hash);

alter table public.site_visit enable row level security;

-- ---------------------------------------------------------------------------
-- Fungsi agregat.
--
-- ADA DI SINI, BUKAN DI JAVASCRIPT, karena PostgREST tidak punya GROUP BY.
-- Tanpa fungsi ini, menghitung kunjungan 30 hari berarti menarik SETIAP BARIS
-- kunjungan ke memori Express lalu menjumlahkannya di sana. Pada situs yang
-- ramai itu berubah dari lambat menjadi kehabisan memori, dan modul stats yang
-- ada sekarang memang sudah melakukan hal itu untuk pesan kontak karena
-- jumlahnya kecil. Kunjungan tidak akan kecil.
-- ---------------------------------------------------------------------------

create or replace function public.visits_by_day(days integer default 30)
returns table (day date, visits bigint, uniques bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.day,
         count(*)                        as visits,
         count(distinct v.visitor_hash)  as uniques
  from public.site_visit v
  where v.day >= current_date - make_interval(days => greatest(days, 1))
  group by v.day
  order by v.day asc;
$$;

create or replace function public.visits_by_country(days integer default 30)
returns table (country text, visits bigint, uniques bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.country,
         count(*)                        as visits,
         count(distinct v.visitor_hash)  as uniques
  from public.site_visit v
  where v.day >= current_date - make_interval(days => greatest(days, 1))
  group by v.country
  order by count(*) desc;
$$;

-- Pemangkas retensi. Dipanggil sesekali oleh API saat menulis, bukan oleh cron,
-- karena proyek ini tidak punya penjadwal. 180 hari cukup untuk membandingkan
-- musim tanpa menyimpan riwayat selamanya.
create or replace function public.prune_site_visit(keep_days integer default 180)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.site_visit
  where day < current_date - make_interval(days => greatest(keep_days, 1));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- `security definer` di atas berarti fungsi berjalan sebagai pemiliknya dan
-- melewati RLS. Itu aman DI SINI karena ketiganya tidak menerima satu pun
-- potongan SQL dari pemanggil, hanya sebuah integer, dan `search_path` dikunci
-- supaya nama tabel tidak bisa dibajak lewat skema bayangan. Hak panggilnya
-- tetap dicabut dari peran anonim: hanya Express dengan secret key yang boleh.
revoke execute on function public.visits_by_day(integer) from anon, authenticated;
revoke execute on function public.visits_by_country(integer) from anon, authenticated;
revoke execute on function public.prune_site_visit(integer) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- KOREKSI: cabut dari PUBLIC, bukan hanya dari anon dan authenticated.
--
-- Tiga baris `revoke` di atas TIDAK CUKUP dan itu terbukti dari advisor
-- Supabase, yang tetap melaporkan ketiganya bisa dipanggil `anon`. Sebabnya:
-- Postgres memberi EXECUTE kepada PUBLIC secara bawaan pada setiap fungsi baru,
-- dan anon serta authenticated mewarisi haknya dari sana. Mencabut dari peran
-- turunan tanpa menyentuh PUBLIC tidak mengubah apa pun.
--
-- Yang paling berbahaya `prune_site_visit`: ia MENGHAPUS baris dan sebelum
-- koreksi ini bisa dipanggil siapa pun lewat /rest/v1/rpc/prune_site_visit
-- tanpa masuk sama sekali.
-- ---------------------------------------------------------------------------

revoke execute on function public.visits_by_day(integer) from public, anon, authenticated;
revoke execute on function public.visits_by_country(integer) from public, anon, authenticated;
revoke execute on function public.prune_site_visit(integer) from public, anon, authenticated;

-- service_role dipakai Express lewat secret key, dan ia butuh hak eksplisit
-- karena PUBLIC sudah dicabut.
grant execute on function public.visits_by_day(integer) to service_role;
grant execute on function public.visits_by_country(integer) to service_role;
grant execute on function public.prune_site_visit(integer) to service_role;
