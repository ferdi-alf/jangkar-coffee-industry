-- Pengguna panel dan jejak audit.
--
-- KATA SANDI TIDAK ADA DI SINI, dan itu disengaja. Autentikasi memakai Supabase
-- Auth, jadi hash kata sandi hidup di skema `auth` yang dikelola Supabase.
-- Tabel ini hanya memetakan pengguna auth ke PERAN di panel. Menyimpan salinan
-- kata sandi sendiri berarti dua sumber kebenaran untuk satu hal, dan yang satu
-- pasti akan tertinggal.

create table if not exists public.admin_user (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text        not null,
  name         text        not null,
  -- owner  boleh segalanya, termasuk teks beranda dan mengelola pengguna
  -- staff  boleh mengubah penanda habis dan jadwal keliling, tidak boleh teks
  role         text        not null default 'staff' check (role in ('owner', 'staff')),
  is_active    boolean     not null default true,
  last_login_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Siapa mengubah apa. actor_id sengaja ON DELETE SET NULL, bukan cascade:
-- menghapus seorang pengguna tidak boleh menghapus jejak perbuatannya.
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid        references public.admin_user(user_id) on delete set null,
  actor_email text,
  action     text        not null check (action in ('create', 'update', 'delete', 'login')),
  entity     text        not null,
  entity_id  text,
  summary    text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx  on public.audit_log (entity, created_at desc);

drop trigger if exists admin_user_touch on public.admin_user;
create trigger admin_user_touch before update on public.admin_user
  for each row execute function public.set_updated_at();
