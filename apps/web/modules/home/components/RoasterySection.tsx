import Image from "next/image";

import { MarketplaceButtons } from "@/components/ui/marketplace-buttons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { getEcommerceProducts } from "@/modules/home/lib/ecommerce-products";

/**
 * Seksi 4, Roastery. Kopi kemasan sebagai lini bisnis, bukan suvenir.
 *
 * TIGA produk, bukan empat. Menu Roastery Corner memuat empat SKU, tapi yang
 * dijual di Shopee dan Tokopedia hanya tiga ini.
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

      <ul className="product-grid">
        {products.map((product) => (
          <li className="product-card" data-reveal data-spot key={product.sku}>
            <div className="product-media">
              <Image
                src={product.image}
                alt={`${product.name}, ${dict.roastery.eyebrow}`}
                fill
                sizes="(max-width: 719px) 92vw, (max-width: 1039px) 46vw, 30vw"
              />
            </div>
            <span className="product-sku">{product.sku}</span>
            <h3 className="product-name">{product.name}</h3>
            <span className="product-price">{product.price}</span>
            <MarketplaceButtons product={product} dict={dict} />
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
