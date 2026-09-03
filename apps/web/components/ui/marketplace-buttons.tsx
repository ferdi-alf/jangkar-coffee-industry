import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries/id";
import { MARKETPLACES, type EcommerceProduct, type Marketplace } from "@/modules/home/constants/menu-data";

import { ShopeeGlyph } from "./marketplace-icons";

/**
 * Dua tombol marketplace di kaki kartu produk.
 *
 * BENTUKNYA: selalu terlihat, terisi penuh warna merek masing-masing, ikon plus
 * label teks. Pilihan pemilik proyek, diambil setelah empat kemungkinan
 * dibandingkan. Yang dikesampingkan adalah memunculkan tombol saat hover,
 * karena efek pointer tidak pernah terjadi di layar sentuh dan trafik proyek ini
 * mayoritas Android, jadi mayoritas pengunjung tidak akan pernah menemukannya.
 *
 * KEDUANYA IKON PLUS TEKS, dan itu yang membereskan keluhan perataan.
 * Versi sebelumnya memakai glif plus teks di Shopee tapi WORDMARK TANPA TEKS di
 * Tokopedia. Dua bentuk isi yang berbeda tidak akan pernah rata satu sama lain,
 * berapa pun paddingnya diutak-atik. Sekarang keduanya kembar, dan ikonnya
 * duduk di slot berukuran identik yang diatur `.mk-glyph` di globals.css, jadi
 * rasio aspek gambar yang berbeda tidak lagi menggeser apa pun.
 *
 * WARNA DEPAN PUTIH, atas permintaan pemilik proyek, dan angkanya ada di
 * komentar `.mk-btn` pada globals.css: putih tidak memenuhi lantai kontras
 * proyek ini di kedua warna merek. Itu keputusan sadar, bukan kelalaian.
 *
 * IKON TOKOPEDIA MEMAKAI WARNA ASLINYA, tidak diputihkan. Owl itu berwarna
 * penuh dan memutihkannya akan menyisakan siluet tas belanja tanpa mata, paruh,
 * maupun telinga, jadi ia berhenti terbaca sebagai Tokopedia sama sekali.
 * Berkasnya sudah dipotong dari bayangan putihnya dan diperkecil dari 609 KB ke
 * 3 KB, lihat catatan di rencana kerja.
 *
 * TANPA TAUTAN, TOMBOLNYA TIDAK MENAVIGASI. Permintaan pemilik proyek: siapkan
 * tombolnya, buat ia menerima data dari admin, dan kalau datanya belum ada ia
 * tidak mengarahkan ke mana pun. Yang dirender jadi <span>, bukan <a> tanpa
 * href, supaya ia benar-benar tidak bisa difokus, tidak bisa diklik, dan tidak
 * pernah tampil sebagai tautan di pohon aksesibilitas. Keadaan itu juga tidak
 * dibawa warna saja, keterangan teks di bawahnya yang membawa maknanya.
 */
export function MarketplaceButtons({
  product,
  dict,
}: {
  product: EcommerceProduct;
  dict: Dictionary;
}) {
  const t = dict.roastery.buy;
  const label: Record<Marketplace, string> = { shopee: "Shopee", tokopedia: "Tokopedia" };
  const missing = MARKETPLACES.some((market) => !product.links[market]);

  return (
    <>
      <div className="mk-row">
        {MARKETPLACES.map((market) => {
          const href = product.links[market];

          const face = (
            <>
              <span className="mk-glyph" aria-hidden="true">
                {market === "shopee" ? (
                  <ShopeeGlyph />
                ) : (
                  /* `unoptimized` karena berkasnya sudah 72x72 dan 3 KB. Melewatkan
                     gambar sekecil itu ke pengoptimal Next hanya menambah satu
                     permintaan dan satu proses tanpa menghemat satu byte pun. */
                  <Image
                    src="/marketplace/tokopedia.webp"
                    alt=""
                    width={18}
                    height={18}
                    unoptimized
                  />
                )}
              </span>
              <span className="mk-label">{label[market]}</span>
            </>
          );

          if (!href) {
            return (
              <span className="mk-btn" data-mk={market} data-linked="false" key={market}>
                {face}
              </span>
            );
          }

          return (
            <a
              className="mk-btn"
              data-mk={market}
              data-linked="true"
              key={market}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t.at} ${label[market]}, ${product.name}`}
            >
              {face}
            </a>
          );
        })}
      </div>

      {missing ? <p className="mk-note">{t.unavailable}</p> : null}
    </>
  );
}
