-- Medan GAMBAR di editor konten.
--
-- Sebelum ini foto kebun Semendo dan logo Jangkar Keliling adalah berkas statis
-- di apps/web/public, jadi menggantinya berarti mengganti berkas lalu deploy
-- ulang. Keduanya isi seksi, bukan aset identitas, dan memang pantas bisa
-- diganti dari panel.
--
-- FOTO HERO DAN BRAND MARK SENGAJA TIDAK IKUT, atas keputusan pemilik proyek.
-- Foto hero adalah elemen LCP, dan impor statis Next-lah yang memberi ukuran
-- serta blur placeholder saat build. Memindahkannya ke URL jauh berarti
-- kehilangan keduanya, dan itu langsung terasa pada 4G di layar 360 piksel.

alter table public.page_content drop constraint if exists page_content_kind_check;
alter table public.page_content
  add constraint page_content_kind_check
  check (kind in ('text', 'longtext', 'list', 'image'));

-- ---------------------------------------------------------------------------
-- NILAI GAMBAR DISIMPAN DI KEDUA BAHASA DENGAN ISI YANG SAMA.
--
-- `page_content_translation` memang bertingkat bahasa, sedangkan URL gambar
-- tidak bergantung bahasa sama sekali. Menambah kolom baru yang tidak
-- bertingkat bahasa hanya untuk dua baris ini berarti mengubah bentuk tabel
-- yang sudah dipakai 86 medan lain. Jadi keduanya diisi nilai yang sama, dan
-- editor panel hanya menampilkan SATU pengunggah yang menulis ke keduanya.
-- Ditulis di sini supaya duplikasinya terbaca sebagai keputusan, bukan
-- kelalaian.
-- ---------------------------------------------------------------------------

with target as (
  select ps.id as section_id, ps.key as section_key
  from public.page_section ps
  where ps.key in ('origin', 'keliling')
),
inserted as (
  insert into public.page_content (section_id, key, kind, sort_order)
  select t.section_id,
         case when t.section_key = 'origin' then 'image' else 'logo' end,
         'image',
         99
  from target t
  where not exists (
    select 1 from public.page_content pc
    where pc.section_id = t.section_id
      and pc.key = case when t.section_key = 'origin' then 'image' else 'logo' end
  )
  returning id, section_id
)
insert into public.page_content_translation (content_id, locale, value)
select i.id, l.locale,
       case when t.section_key = 'origin'
            then '/rantai/kebun-semendo.webp'
            else '/brand/keliling-logo.webp' end
from inserted i
join target t on t.section_id = i.section_id
cross join (values ('id'::public.locale_code), ('en'::public.locale_code)) as l(locale)
on conflict (content_id, locale) do nothing;
