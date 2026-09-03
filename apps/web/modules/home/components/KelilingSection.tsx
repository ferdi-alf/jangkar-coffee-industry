import Image from "next/image";
import { Star } from "lucide-react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { getKelilingMenu } from "@/modules/home/lib/keliling-menu";

/**
 * Seksi 6, Jangkar Keliling. Register visualnya sendiri.
 *
 * information-architecture.md §6 memang mengizinkan seksi ini melanggar sistem,
 * dan brand-analysis.md §3 membatasi mark Jangkar Keliling khusus ke sini.
 *
 * Logonya kini ditampilkan SEBAGAIMANA ADANYA, berwarna merah aslinya, bukan
 * lagi siluet satu warna. Merah `#BE0909` itu di luar palet crest, dan itu
 * memang boleh: ia sub-brand, dan seksi inilah satu-satunya tempat ia hidup.
 *
 * TAGLINE TIDAK LAGI MENGKLAIM "PERTAMA DI PALEMBANG". Poster aslinya
 * membawanya, dan brand-analysis.md §6 menandainya `[ASK]` apakah klaim itu
 * masih aman dibuat di 2026. Pemilik proyek menjawab tidak, jadi klaimnya
 * dicabut dan jawabannya dicatat di dokumen itu.
 *
 * Menu armada ditampilkan LENGKAP. Item favorit ditandai ikon lucide PLUS label
 * teks, bukan ikon saja, supaya maknanya tetap sampai tanpa persepsi bentuk
 * maupun warna.
 *
 * MENUNYA DIBACA DARI BASIS DATA, bukan konstanta, dan itu yang membuat halaman
 * /keliling di panel benar-benar mengubah sesuatu. Pengelompokan dua kategori
 * dan cadangan waktu build dijelaskan di modules/home/lib/keliling-menu.ts.
 */
export async function KelilingSection({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const menu = await getKelilingMenu(locale);

  return (
    <section className="section keliling" id="keliling">
      <div className="keliling-texture" aria-hidden="true" />

      <div className="keliling-grid">
        <div>
          <p className="eyebrow eyebrow-accent" data-reveal>
            {dict.keliling.eyebrow}
          </p>
          <h2 className="section-heading" data-reveal>
            {dict.keliling.heading.line1}
            <br />
            {dict.keliling.heading.line2}
          </h2>
          <p className="lede" data-reveal>
            {dict.keliling.lede}
          </p>

          <div className="keliling-logo" data-reveal>
            <Image
              src="/brand/keliling-logo.webp"
              alt={dict.keliling.logoAlt}
              width={280}
              height={280}
            />
          </div>

          <dl className="keliling-today" data-reveal>
            <dt>{dict.keliling.today.label}</dt>
            <dd>{dict.keliling.today.value}</dd>
          </dl>
        </div>

        <div className="keliling-panel" data-reveal>
          <h3 className="keliling-menu-heading">{dict.keliling.menuHeading}</h3>
          {menu.map((category) => (
            <section className="keliling-cat" key={category.id}>
              <h4 className="keliling-cat-name">{category.name}</h4>
              <dl className="keliling-list">
                {category.items.map((item) => (
                  <div key={item.name}>
                    <dt>
                      <span>{item.name}</span>
                      {item.favourite ? (
                        <span className="keliling-fav">
                          <Star size={11} aria-hidden="true" />
                          {dict.keliling.favourite}
                        </span>
                      ) : null}
                    </dt>
                    <dd>{item.price}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
