import type { CSSProperties } from "react";
import Image from "next/image";

import { MarketplaceButtons } from "@/components/ui/marketplace-buttons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { getEcommerceProducts } from "@/modules/home/lib/ecommerce-products";

/**
 * Seksi 4, Roastery. Kopi kemasan sebagai lini bisnis, bukan suvenir.
 *
 * JUMLAH PRODUKNYA TIDAK TETAP. Dulu tiga dan grid-nya dikunci tiga kolom,
 * lalu produksi menambah yang keempat dan hasilnya tiga kartu di atas plus satu
 * kartu yatim di bawah. Sekarang jumlah kolom dihitung dari jumlah produk lewat
 * `balancedColumns`, dan baris terakhir yang tidak penuh dipusatkan oleh CSS,
 * jadi menambah atau mengurangi produk di panel tidak pernah butuh kode lagi.
 *
 * Gambar di sini di bawah lipatan, jadi dibiarkan lazy, tidak diberi `priority`.
 * Hanya foto ranting di hero yang boleh merebut bandwidth awal.
 *
 * PRODUKNYA DIBACA DARI BASIS DATA lewat API, bukan dari konstanta. Tautan
 * Shopee dan Tokopedia yang diisi di panel admin langsung muncul sebagai tombol
 * di sini tanpa menyentuh kode. Kalau API tidak bisa dihubungi saat build,
 * konstanta lama dipakai sebagai cadangan supaya build tidak pernah gagal
 * karenanya. Lihat modules/home/lib/ecommerce-products.ts.
 */
export async function RoasterySection({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const products = await getEcommerceProducts(locale);
  const total = String(products.length).padStart(2, "0");

  return (
    <section className="section" id="roastery">
      <p className="eyebrow" data-reveal>
        {dict.roastery.eyebrow}
      </p>
      <h2 className="section-heading" data-reveal>
        {dict.roastery.heading.line1}
        <br />
        {dict.roastery.heading.line2}
      </h2>

      <ul
        className="product-grid"
        style={{ "--cols": balancedColumns(products.length) } as CSSProperties}
      >
        {products.map((product, index) => (
          <li
            className="product-card"
            data-reveal
            data-spot
            key={product.sku}
            style={{ "--i": index } as CSSProperties}
          >
            <div className="product-media">
              <Image
                src={product.image}
                alt={`${product.name}, ${dict.roastery.eyebrow}`}
                fill
                sizes="(max-width: 559px) 92vw, (max-width: 1079px) 46vw, 24vw"
              />
              <span className="product-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")} / {total}
              </span>
            </div>
            <div className="product-body">
              <span className="product-sku">{product.sku}</span>
              <h3 className="product-name">{product.name}</h3>
              <div className="product-foot">
                {/* Baris harga SELALU dirender, kosong sekalipun, supaya tombol
                    kartu tanpa harga tetap sejajar dengan kartu di sebelahnya. */}
                <span className="product-price" aria-hidden={product.price ? undefined : true}>
                  {product.price || " "}
                </span>
                <MarketplaceButtons product={product} dict={dict} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="section-note" data-reveal>
        {dict.roastery.marketplace}
      </p>

      <div className="heritage" data-reveal>
        <span className="heritage-mark" aria-hidden="true" />
        <p className="heritage-body">
          <strong>{dict.roastery.heritage.title}.</strong> {dict.roastery.heritage.body}
        </p>
      </div>
    </section>
  );
}

/**
 * Jumlah kolom di layar lebar yang meninggalkan kartu yatim sesedikit mungkin.
 * Empat produk jadi empat sejajar, enam jadi tiga-tiga, delapan jadi empat-empat.
 * Sisa yang tetap ada (misalnya lima) dipusatkan CSS, bukan menempel kiri.
 */
function balancedColumns(count: number): number {
  if (count <= 4) return Math.max(count, 1);
  if (count % 4 === 0) return 4;
  if (count % 3 === 0) return 3;
  return 4;
}
