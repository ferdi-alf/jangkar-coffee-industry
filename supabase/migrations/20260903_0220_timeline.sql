-- Timeline "Bagaimana ia terangkai" pindah dari kode ke basis data.
--
-- Sebelumnya tonggak ini terbelah DI TIGA TEMPAT: tahunnya di
-- apps/web/modules/home/constants/about-timeline.ts, kalimatnya di kamus i18n,
-- dan salinan kalimat yang sama juga ikut terseed sebagai medan `timeline.*` di
-- seksi `about` pada page_content. Menambah satu tonggak berarti menyunting tiga
-- berkas dan men-deploy ulang. Tabel ini menggantikan ketiganya.
--
-- `year_end` boleh null dan artinya "masih berjalan". Kata penutupnya tetap
-- datang dari kamus (`about.present`, yaitu "kini" dan "now"), bukan dari kolom
-- ini, karena itu TEKS yang diterjemahkan sedangkan angka tahun tidak.

create table if not exists public.timeline_entry (
  id         uuid primary key default gen_random_uuid(),
  year       integer not null check (year between 1900 and 2200),
  year_end   integer          check (year_end is null or year_end between 1900 and 2200),
  sort_order integer not null default 0,
  status     text    not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Rentang terbalik ditolak di sini, bukan di form saja. Form bisa dilewati,
  -- basis data tidak.
  constraint timeline_entry_range check (year_end is null or year_end >= year)
);

create table if not exists public.timeline_entry_translation (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.timeline_entry(id) on delete cascade,
  locale      public.locale_code not null,
  title       text not null check (char_length(title) between 1 and 160),
  subtitle    text          check (subtitle is null or char_length(subtitle) <= 120),
  description text          check (description is null or char_length(description) <= 2000),
  unique (entry_id, locale)
);

-- Diurutkan menurut tahun, sesuai permintaan pemilik proyek. `sort_order` ikut
-- masuk indeks sebagai pemutus seri untuk dua tonggak pada tahun yang sama.
create index if not exists timeline_entry_year_idx
  on public.timeline_entry (year asc, sort_order asc);

drop trigger if exists timeline_entry_touch on public.timeline_entry;
create trigger timeline_entry_touch before update on public.timeline_entry
  for each row execute function public.set_updated_at();

alter table public.timeline_entry enable row level security;
alter table public.timeline_entry_translation enable row level security;

-- ---------------------------------------------------------------------------
-- Isi awal, disalin PERSIS dari ABOUT_MILESTONES dan kamus yang sedang tayang.
--
-- Tahun-tahun ini DITANDAI KARANGAN oleh sesi sebelumnya: tanggal berdirinya
-- Jangkar tidak tercatat di dokumen mana pun yang dimiliki proyek ini, dan
-- pemilik proyek menyatakan boleh dikarang dulu karena akan disunting dari
-- panel. Sekarang panelnya ada, jadi peringatan itu ikut pindah ke sini:
-- KELIMA TAHUN DI BAWAH MASIH PERLU DIKOREKSI PEMILIK.
-- ---------------------------------------------------------------------------

with seed as (
  select * from (values
    (2016, 2017,   0, 'Sangrai pertama di Sako',   'Roastery Sako',
       'Satu mesin kecil, satu profil, dan pesanan yang datang dari mulut ke mulut.',
       'First roast in Sako',           'Sako roastery',
       'One small machine, one profile, and orders that travelled by word of mouth.'),
    (2018, 2019,   1, 'Gerai pertama buka',        'Jln Siaran, Sako',
       'Menu penuh setiap hari, dan tempat orang mulai mengenali rasanya.',
       'The first outlet opens',        'Jln Siaran, Sako',
       'A full menu every day, and the place where people began to recognise the taste.'),
    (2020, 2021,   2, 'Armada keliling jalan',     'Jangkar Keliling',
       'Kopi yang mendatangi titik kumpul kota, bukan menunggu didatangi.',
       'The mobile fleet rolls out',    'Jangkar Keliling',
       'Coffee that goes to the gathering points of the city instead of waiting to be found.'),
    (2022, 2023,   3, 'Kopi masuk kemasan',        'Shopee dan Tokopedia',
       'Biji dan bubuk yang bisa dibawa pulang, lalu menyusul ke marketplace.',
       'Coffee goes into packaging',    'Shopee and Tokopedia',
       'Beans and ground coffee to carry home, and later onto the marketplaces.'),
    (2024, null,   4, 'Sampai ke kebun Semendo',   'Semendo, Muara Enim',
       'Pembelian langsung ke petani, dan rantainya akhirnya tertutup penuh.',
       'All the way to Semendo',        'Semendo, Muara Enim',
       'Buying straight from the farmers, and the chain finally closes.')
  ) as t(year, year_end, sort_order,
         title_id, subtitle_id, description_id,
         title_en, subtitle_en, description_en)
),
inserted as (
  insert into public.timeline_entry (year, year_end, sort_order, status)
  select s.year, s.year_end, s.sort_order, 'published' from seed s
  -- Idempoten: kalau tabelnya sudah berisi apa pun, seed dilewati sepenuhnya
  -- supaya menjalankan ulang migrasi tidak menggandakan tonggak.
  where not exists (select 1 from public.timeline_entry)
  returning id, year
)
insert into public.timeline_entry_translation (entry_id, locale, title, subtitle, description)
select i.id, 'id'::public.locale_code, s.title_id, s.subtitle_id, s.description_id
from inserted i join seed s on s.year = i.year
union all
select i.id, 'en'::public.locale_code, s.title_en, s.subtitle_en, s.description_en
from inserted i join seed s on s.year = i.year;

-- ---------------------------------------------------------------------------
-- Medan timeline dicabut dari seksi `about` di page_content.
--
-- Kalau dibiarkan, halaman /content dan halaman /timeline akan menyunting hal
-- yang sama lewat dua jalan berbeda, dan hanya salah satunya yang benar-benar
-- tampil di situs. Dua editor untuk satu data adalah cara paling pasti membuat
-- pemilik proyek berhenti percaya pada panelnya sendiri.
--
-- `timelineHeading` dan `timelineAria` SENGAJA TIDAK ikut dihapus: keduanya
-- judul seksi dan label pembaca layar, bukan isi tonggak, dan memang tempatnya
-- di editor konten.
-- ---------------------------------------------------------------------------

delete from public.page_content pc
using public.page_section ps
where pc.section_id = ps.id
  and ps.key = 'about'
  and pc.key like 'timeline.%';
