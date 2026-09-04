-- Setelan situs: SEO, kontak, dan tautan sosial media.
--
-- Ketiganya sebelumnya HIDUP DI DALAM KODE. Judul dan deskripsi halaman ada di
-- `dict.meta`, sedangkan nomor telepon, WhatsApp, alamat, dan satu tautan
-- Instagram ada di konstanta `HQ` pada
-- apps/web/modules/home/constants/menu-data.ts. Artinya mengganti nomor telepon
-- berarti deploy ulang, dan menambah TikTok berarti menulis kode. Tabel ini
-- yang memindahkannya ke panel.
--
-- SEO dan kontak sengaja BUKAN dijadikan baris `page_content`. Bentuknya bukan
-- teks bebas: `robots_index` itu boolean, `og_image_url` itu URL yang divalidasi,
-- dan `keywords` itu daftar. Menjejalkan semuanya ke kolom `value text` akan
-- memindahkan seluruh validasi ke sisi aplikasi dan menghilangkan setiap jaring
-- pengaman yang bisa diberikan basis data.

-- ---------------------------------------------------------------------------
-- SEO
-- ---------------------------------------------------------------------------

-- SATU BARIS SAJA, dan itu dipaksa oleh basis data, bukan oleh kesopanan kode.
-- `singleton` adalah kolom dengan CHECK yang hanya mengizinkan satu nilai, lalu
-- dijadikan unik. Tanpa pagar itu, satu INSERT yang salah menghasilkan dua baris
-- setelan dan situs akan memilih salah satunya secara acak.
create table if not exists public.site_seo (
  id                uuid primary key default gen_random_uuid(),
  singleton         text        not null default 'default' unique check (singleton = 'default'),
  site_url          text,
  organization_name text,
  og_image_url      text,
  logo_url          text,
  favicon_url       text,
  twitter_handle    text,
  theme_color       text        not null default '#FBFAF8',
  robots_index      boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.site_seo_translation (
  id             uuid primary key default gen_random_uuid(),
  seo_id         uuid not null references public.site_seo(id) on delete cascade,
  locale         public.locale_code not null,
  title          text not null check (char_length(title) between 1 and 160),
  description    text not null check (char_length(description) between 1 and 320),
  keywords       text not null default '',
  og_title       text,
  og_description text,
  unique (seo_id, locale)
);

-- ---------------------------------------------------------------------------
-- Kontak
-- ---------------------------------------------------------------------------

-- Terpisah dari tabel `outlet` dengan sengaja. `outlet` menjawab "di mana gerai
-- ini dan bagaimana ke sana", satu baris per gerai. Tabel ini menjawab "bagaimana
-- menghubungi perusahaan", satu baris untuk seluruh perusahaan. Menggabungkannya
-- berarti nomor kontak resmi ikut terhapus begitu satu gerai ditutup.
create table if not exists public.site_contact (
  id          uuid primary key default gen_random_uuid(),
  singleton   text        not null default 'default' unique check (singleton = 'default'),
  phone       text,
  phone_href  text,
  whatsapp    text,
  email       text,
  address     text,
  maps_query  text,
  site_label  text,
  site_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Daftar platform dikunci CHECK, bukan dibiarkan teks bebas, karena nilai inilah
-- yang memilih ikon di situs. Platform yang tidak dikenal berarti tautan tanpa
-- ikon, dan itu muncul sebagai lubang di footer, bukan sebagai pesan galat.
create table if not exists public.site_social_link (
  id         uuid primary key default gen_random_uuid(),
  platform   text    not null unique check (platform in (
               'instagram', 'facebook', 'tiktok', 'x', 'youtube',
               'threads', 'linkedin', 'whatsapp'
             )),
  url        text    not null check (url ~ '^https://'),
  label      text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_social_link_sort_idx on public.site_social_link (sort_order);

-- ---------------------------------------------------------------------------
-- Pemicu updated_at, memakai helper yang sudah ada
-- ---------------------------------------------------------------------------

drop trigger if exists site_seo_touch on public.site_seo;
create trigger site_seo_touch before update on public.site_seo
  for each row execute function public.set_updated_at();

drop trigger if exists site_contact_touch on public.site_contact;
create trigger site_contact_touch before update on public.site_contact
  for each row execute function public.set_updated_at();

drop trigger if exists site_social_link_touch on public.site_social_link;
create trigger site_social_link_touch before update on public.site_social_link
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: nyala, tanpa policy, sama seperti seluruh tabel lain di proyek ini.
-- Publishable key tidak boleh membaca apa pun; seluruh akses lewat Express yang
-- memakai secret key dan melewati RLS. Lihat 20260902_0150_rls.sql.
-- ---------------------------------------------------------------------------

alter table public.site_seo enable row level security;
alter table public.site_seo_translation enable row level security;
alter table public.site_contact enable row level security;
alter table public.site_social_link enable row level security;

-- ---------------------------------------------------------------------------
-- Isi awal, disalin PERSIS dari kode yang sedang tayang.
--
-- Tidak ada satu pun data bisnis yang dikarang di sini. Judul dan deskripsi
-- diambil dari `dict.meta`, sisanya dari konstanta HQ. Kalau blok ini dibiarkan
-- kosong, situs akan kehilangan judul dan nomor teleponnya pada deploy pertama
-- setelah migrasi ini.
-- ---------------------------------------------------------------------------

insert into public.site_seo (singleton, site_url, organization_name, theme_color, robots_index)
values ('default', 'https://www.kopijangkar.com', 'Jangkar Coffee Industry', '#FBFAF8', true)
on conflict (singleton) do nothing;

insert into public.site_seo_translation (seo_id, locale, title, description, keywords)
select s.id, v.locale, v.title, v.description, v.keywords
from public.site_seo s
cross join (values
  ('id'::public.locale_code,
   'Jangkar Coffee Industry, Kopi Robusta Semendo, Palembang',
   'Industri kopi Palembang. Robusta dari kebun Semendo, disangrai sendiri di roastery Sako, disajikan di outlet dan armada keliling.',
   'kopi palembang, robusta semendo, roastery palembang, kopi jangkar, coffee industry'),
  ('en'::public.locale_code,
   'Jangkar Coffee Industry, Semendo Robusta Coffee, Palembang',
   'A Palembang coffee industry. Robusta from the Semendo highlands, roasted in house at Sako, served at the outlet and by the mobile fleet.',
   'palembang coffee, semendo robusta, indonesian roastery, jangkar coffee')
) as v(locale, title, description, keywords)
where s.singleton = 'default'
on conflict (seo_id, locale) do nothing;

insert into public.site_contact
  (singleton, phone, phone_href, whatsapp, email, address, maps_query, site_label, site_url)
values (
  'default',
  '0899 999 3030',
  'tel:+628999993030',
  'https://wa.me/628999993030',
  null, -- alamat surel resmi belum pernah diberikan, jadi dibiarkan kosong
  'Jln Siaran No 745B, Sako, Palembang',
  'Jangkar Coffee Industry, Jln Siaran No 745B, Sako, Palembang',
  'kopijangkar.com',
  'https://www.kopijangkar.com'
)
on conflict (singleton) do nothing;

insert into public.site_social_link (platform, url, label, sort_order, is_active)
values ('instagram', 'https://instagram.com/jangkarkeliling.id', '@jangkarkeliling.id', 0, true)
on conflict (platform) do nothing;
