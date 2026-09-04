import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Seksi 7, Origin. Jangkar kredibilitas.
 *
 * Prototipe 06 Arus melewatkan seksi ini meski information-architecture.md §3
 * mewajibkannya, jadi ini penambahan, bukan port.
 *
 * Fotonya dipakai ulang dari kartu Rantai, yang kini tidak lagi bergambar atas
 * permintaan pemilik proyek. Di sini justru lebih tepat: seksi ini memang
 * tentang Semendo, dan foto itu memang foto Semendo.
 */
export function OriginSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="section origin" id="origin">
      <div className="origin-grid">
        <div>
          <p className="eyebrow" data-reveal>
            {dict.origin.eyebrow}
          </p>
          <h2 className="section-heading" data-reveal>
            {dict.origin.heading}
          </h2>
          <p className="lede" data-reveal>
            {dict.origin.body}
          </p>
        </div>

        <div className="origin-media" data-reveal>
          <Image
            /* Dari medan gambar di /content pada panel, dengan jalur statis
               di kamus sebagai cadangan. */
            src={dict.origin.image}
            alt={dict.origin.imageAlt}
            fill
            sizes="(max-width: 1023px) 92vw, 48vw"
          />
        </div>
      </div>
    </section>
  );
}
