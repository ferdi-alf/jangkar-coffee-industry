-- Teks beranda dan pustaka media.
--
-- TIGA TABEL UNTUK KONTEN, bukan satu kolom JSONB. Teks beranda bersarang dalam
-- ("hero.headline.accent"), jadi satu set kolom tetap tidak akan pernah muat.
-- Yang dipakai di sini: section mendaftar blok halaman, content mendaftar medan
-- di dalamnya beserta jenisnya, dan terjemahan menyimpan nilainya per bahasa.
-- Panel admin bisa membangkitkan formnya sendiri dari page_content, jadi
-- menambah satu medan teks tidak perlu menyentuh kode form sama sekali.
--
-- Nilainya tetap kolom text sungguhan, jadi pencarian dan indeks tetap mungkin,
-- yang tidak berlaku kalau semuanya ditumpuk dalam satu JSONB.

create table if not exists public.page_section (
  id         uuid primary key default gen_random_uuid(),
  key        text        not null unique check (key ~ '^[a-z0-9-]+$'),
  label      text        not null,
  sort_order integer     not null default 0,
  status     text        not null default 'published'
             check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_content (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid        not null references public.page_section(id) on delete cascade,
  key        text        not null,
  -- text     satu baris
  -- longtext beberapa paragraf
  -- list     daftar, tiap butir dipisah baris baru
  kind       text        not null default 'text'
             check (kind in ('text', 'longtext', 'list')),
  sort_order integer     not null default 0,
  unique (section_id, key)
);

create table if not exists public.page_content_translation (
  id         uuid primary key default gen_random_uuid(),
  content_id uuid        not null references public.page_content(id) on delete cascade,
  locale     public.locale_code not null,
  value      text        not null,
  unique (content_id, locale)
);

-- ALT TEXT WAJIB, BUKAN OPSIONAL, dan itu ditegakkan di sini bukan di form.
-- Form bisa dilewati, constraint tidak bisa. Alt juga diterjemahkan, karena ia
-- teks yang tampil publik seperti teks lain.
create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  bucket       text        not null default 'public-media',
  path         text        not null unique,
  mime         text        not null,
  bytes        integer     not null check (bytes > 0),
  width        integer,
  height       integer,
  uploaded_by  uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.media_translation (
  id       uuid primary key default gen_random_uuid(),
  media_id uuid        not null references public.media(id) on delete cascade,
  locale   public.locale_code not null,
  alt      text        not null check (char_length(alt) between 1 and 300),
  unique (media_id, locale)
);

create index if not exists page_content_section_idx on public.page_content (section_id, sort_order);
create index if not exists media_created_idx        on public.media (created_at desc);

drop trigger if exists page_section_touch on public.page_section;
create trigger page_section_touch before update on public.page_section
  for each row execute function public.set_updated_at();
drop trigger if exists media_touch on public.media;
create trigger media_touch before update on public.media
  for each row execute function public.set_updated_at();
