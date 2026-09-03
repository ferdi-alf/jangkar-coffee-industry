-- Migrasi pertama proyek ini. Sebelum ini, schema `public` benar-benar kosong.
--
-- BELUM DIJALANKAN. CLAUDE.md dan secrets/ACCESS.md melarang membuat migrasi
-- tanpa review pemilik proyek, jadi berkas ini ditulis untuk ditinjau lebih
-- dulu. Jalankan hanya setelah disetujui.
--
-- Tabel ini juga TIDAK ada di skema docs/PROJECT-SPEC.md, karena form kontak
-- belum terpikirkan saat skema itu ditulis. Dokumennya sudah diperbarui.

create table if not exists public.contact_message (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 1 and 80),
  email       text        not null check (char_length(email) between 3 and 160),
  message     text        not null check (char_length(message) between 10 and 2000),

  -- Alamat IP disimpan sebagai hash, bukan apa adanya. Yang dibutuhkan untuk
  -- menelusuri penyalahgunaan hanyalah kemampuan melihat dua pesan datang dari
  -- sumber yang sama, dan hash sudah cukup untuk itu. Menyimpan alamat aslinya
  -- menambah data pribadi tanpa menambah kemampuan yang benar-benar dipakai.
  ip_hash     text,

  -- Alur kerja admin nanti: pesan baru, sudah dibaca, sudah dibalas, spam.
  status      text        not null default 'new'
              check (status in ('new', 'read', 'replied', 'spam')),
  created_at  timestamptz not null default now()
);

-- Kotak masuk selalu dibaca dari yang terbaru, dan biasanya disaring status.
create index if not exists contact_message_created_idx
  on public.contact_message (created_at desc);
create index if not exists contact_message_status_idx
  on public.contact_message (status, created_at desc);

-- RLS menyala TANPA SATU POLICY PUN.
--
-- Ini disengaja dan ini inti keamanannya. Tanpa policy, kunci publishable yang
-- dipakai browser tidak bisa membaca maupun menulis apa pun di tabel ini.
-- Hanya kunci rahasia di sisi server, yang memang melewati RLS, yang bisa
-- menyisipkan baris. Artinya kotak masuk ini mustahil dibaca dari peramban
-- siapa pun, dan itu yang mencegah nama, email, serta isi pesan pengunjung
-- bocor ke publik.
--
-- Saat panel admin dibangun, baca-nya diberikan lewat policy untuk peran
-- terautentikasi, bukan dengan mematikan RLS.
alter table public.contact_message enable row level security;
