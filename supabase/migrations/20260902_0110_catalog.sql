-- Katalog: kategori, produk, terjemahan, varian, kanal, dan tautan marketplace.
--
-- TEKS DWIBAHASA MEMAKAI TABEL TERJEMAHAN TERPISAH, BUKAN JSONB. Alasannya
-- tertulis di PROJECT-SPEC: pencarian tabel admin harus dioptimasi indeks di
-- backend, dan indeks teks penuh jauh lebih rapi di kolom sungguhan.
--
-- HARGA DISIMPAN SEBAGAI INTEGER RUPIAH, bukan numeric dan bukan teks. Menu
-- aslinya menulis "8k" dan "15k / 100gr"; angkanya masuk base_price sebagai
-- 8000, sedangkan bentuk tak beraturan seperti "15k / 100gr" masuk price_note.
-- Float tidak dipakai sama sekali, uang tidak boleh punya galat pembulatan.

create table if not exists public.category (
  id          uuid primary key default gen_random_uuid(),
  slug        text        not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order  integer     not null default 0,
  status      text        not null default 'published'
              check (status in ('draft', 'published', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.category_translation (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid        not null references public.category(id) on delete cascade,
  locale      public.locale_code not null,
  name        text        not null check (char_length(name) between 1 and 120),
  description text,
  unique (category_id, locale)
);

create table if not exists public.product (
  id            uuid primary key default gen_random_uuid(),
  sku           text        not null unique,
  slug          text        not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id   uuid        references public.category(id) on delete set null,

  base_price    integer     check (base_price is null or base_price >= 0),
  -- Untuk harga yang tidak berupa satu angka, misalnya "15k / 100gr".
  price_note    text,

  -- Penanda yang sudah dipakai menu cetaknya. is_sold_out yang boleh diubah
  -- peran staff; sisanya hanya owner.
  is_signature  boolean     not null default false,
  is_favourite  boolean     not null default false,
  is_ecommerce  boolean     not null default false,
  is_sold_out   boolean     not null default false,

  image_path    text,
  sort_order    integer     not null default 0,
  status        text        not null default 'draft'
                check (status in ('draft', 'published', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.product_translation (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid        not null references public.product(id) on delete cascade,
  locale      public.locale_code not null,
  title       text        not null check (char_length(title) between 1 and 160),
  description text,
  unique (product_id, locale)
);

-- Dua marketplace, dan hanya dua. Konteks bisnis mengunci ini: Jangkar bukan
-- marketplace, situsnya hanya menunjuk ke Shopee dan Tokopedia.
create table if not exists public.product_marketplace_link (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid        not null references public.product(id) on delete cascade,
  marketplace text        not null check (marketplace in ('shopee', 'tokopedia')),
  url         text        not null check (url ~ '^https://'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, marketplace)
);

create table if not exists public.product_variant (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid        not null references public.product(id) on delete cascade,
  label       text        not null,
  price       integer     not null check (price >= 0),
  sort_order  integer     not null default 0
);

-- Ketersediaan per kanal. Ini yang membuat menu outlet dan menu keliling jadi
-- SATU katalog dengan penanda, bukan dua daftar terpisah. Fakta strukturalnya
-- ada di menu cetaknya: harga setiap item yang beririsan sama persis.
create table if not exists public.product_channel (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid        not null references public.product(id) on delete cascade,
  channel     text        not null check (channel in ('outlet', 'keliling')),
  available   boolean     not null default true,
  unique (product_id, channel)
);

create index if not exists product_status_sort_idx on public.product (status, sort_order);
create index if not exists product_category_idx    on public.product (category_id);
create index if not exists product_ecommerce_idx   on public.product (is_ecommerce) where is_ecommerce;
-- Pencarian judul di panel admin. GIN trigram, bukan LIKE polos.
create index if not exists product_translation_title_trgm_idx
  on public.product_translation using gin (title gin_trgm_ops);
create index if not exists product_translation_locale_idx
  on public.product_translation (locale);

drop trigger if exists category_touch on public.category;
create trigger category_touch before update on public.category
  for each row execute function public.set_updated_at();
drop trigger if exists product_touch on public.product;
create trigger product_touch before update on public.product
  for each row execute function public.set_updated_at();
drop trigger if exists product_link_touch on public.product_marketplace_link;
create trigger product_link_touch before update on public.product_marketplace_link
  for each row execute function public.set_updated_at();
