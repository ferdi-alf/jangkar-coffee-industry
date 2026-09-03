-- RLS menyala di SETIAP tabel, TANPA SATU POLICY PUN.
--
-- Ini bukan kelalaian, ini intinya. Tanpa policy, kunci publishable yang dipakai
-- peramban tidak bisa membaca maupun menulis apa pun di skema ini. Yang bisa
-- menembusnya hanya kunci rahasia di sisi server, yang memang melewati RLS.
--
-- Kenapa itu cukup di sini: situs publik TIDAK PERNAH menyentuh Supabase secara
-- langsung. Ia membaca lewat Express, dan Express memegang kunci rahasia. Panel
-- admin juga lewat Express. Jadi tidak ada satu pun jalur dari peramban ke basis
-- data ini, dan tidak ada kunci Supabase yang perlu dikirim ke peramban sama
-- sekali. Kalau suatu saat ada halaman yang perlu membaca langsung dari browser,
-- yang ditambahkan adalah policy untuk baris berstatus published, BUKAN
-- mematikan RLS.
--
-- contact_message paling penting di antara semuanya: isinya nama, email, dan
-- tulisan pengunjung. Tanpa policy, kotak masuk itu mustahil dibaca dari
-- peramban siapa pun.

alter table public.category                  enable row level security;
alter table public.category_translation      enable row level security;
alter table public.product                   enable row level security;
alter table public.product_translation       enable row level security;
alter table public.product_marketplace_link  enable row level security;
alter table public.product_variant           enable row level security;
alter table public.product_channel           enable row level security;
alter table public.outlet                    enable row level security;
alter table public.outlet_translation        enable row level security;
alter table public.keliling_unit             enable row level security;
alter table public.keliling_schedule         enable row level security;
alter table public.page_section              enable row level security;
alter table public.page_content              enable row level security;
alter table public.page_content_translation  enable row level security;
alter table public.media                     enable row level security;
alter table public.media_translation         enable row level security;
alter table public.admin_user                enable row level security;
alter table public.audit_log                 enable row level security;

-- Sudah dinyalakan di migrasi contact_message, diulang di sini supaya berkas ini
-- benar-benar jadi daftar lengkap dan tidak ada tabel yang luput saat ditinjau.
alter table public.contact_message           enable row level security;
