-- Outlet dan armada keliling.
--
-- KOORDINAT PUNYA PENANDA PERKIRAAN, dan itu bukan hiasan. Koordinat HQ Sako
-- yang dipakai situs sekarang masih kasar, pemilik proyek akan memberikan yang
-- tepat. Selama coords_approximate true, tombol navigasi memakai maps_query
-- berupa ALAMAT TEKS yang terverifikasi, bukan koordinat ini, supaya pengunjung
-- tetap sampai ke tempat yang benar meski pinnya masih meleset. Tanpa kolom ini
-- perbedaan itu hilang dan tidak ada yang tahu mana yang boleh dipercaya.

create table if not exists public.outlet (
  id                 uuid primary key default gen_random_uuid(),
  slug               text        not null unique check (slug ~ '^[a-z0-9-]+$'),
  name               text        not null,
  address            text        not null,
  phone              text,
  phone_href         text,
  whatsapp           text,
  maps_query         text        not null,
  lat                double precision,
  lng                double precision,
  coords_approximate boolean     not null default true,
  is_headquarters    boolean     not null default false,
  sort_order         integer     not null default 0,
  status             text        not null default 'published'
                     check (status in ('draft', 'published', 'archived')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.outlet_translation (
  id         uuid primary key default gen_random_uuid(),
  outlet_id  uuid        not null references public.outlet(id) on delete cascade,
  locale     public.locale_code not null,
  label      text        not null,
  hours      text,
  summary    text,
  unique (outlet_id, locale)
);

-- CATATAN 2026-09-03: kedua tabel keliling di bawah ini SUDAH DIHAPUS oleh
-- migrasi 20260903_0110_drop_keliling.sql. Definisinya dibiarkan di sini karena
-- migrasi adalah catatan riwayat, bukan keadaan sekarang. Jangan menghidupkannya
-- kembali tanpa membaca alasan penghapusannya di migrasi itu.
create table if not exists public.keliling_unit (
  id         uuid primary key default gen_random_uuid(),
  code       text        not null unique,
  name       text        not null,
  status     text        not null default 'active'
             check (status in ('active', 'paused', 'retired')),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Satu baris satu titik singgah pada satu tanggal. Halaman Keliling memakai ISR,
-- jadi tabel inilah satu-satunya yang berubah sering.
create table if not exists public.keliling_schedule (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid        not null references public.keliling_unit(id) on delete cascade,
  date        date        not null,
  start_time  time,
  end_time    time,
  spot_name   text        not null,
  spot_note   text,
  maps_query  text,
  status      text        not null default 'planned'
              check (status in ('planned', 'live', 'done', 'cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);

create index if not exists keliling_schedule_unit_date_idx
  on public.keliling_schedule (unit_id, date);
create index if not exists keliling_schedule_date_idx
  on public.keliling_schedule (date);

drop trigger if exists outlet_touch on public.outlet;
create trigger outlet_touch before update on public.outlet
  for each row execute function public.set_updated_at();
drop trigger if exists keliling_unit_touch on public.keliling_unit;
create trigger keliling_unit_touch before update on public.keliling_unit
  for each row execute function public.set_updated_at();
drop trigger if exists keliling_schedule_touch on public.keliling_schedule;
create trigger keliling_schedule_touch before update on public.keliling_schedule
  for each row execute function public.set_updated_at();
