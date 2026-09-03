import { HeroCta } from "@/components/ui/hero-cta";
import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Kolom kiri hero. Komponen server, jadi seluruh teksnya sudah ada di HTML awal.
 *
 * Ini yang menjaga LCP: h1 tidak dirakit JavaScript, dan mesin telusur membacanya
 * tanpa menjalankan skrip. HeroFilm hanya melekat pada markup ini di klien.
 *
 * `data-hero-fade` menandai apa yang mundur pada beat 2. Satu atribut, supaya
 * timeline tidak perlu menghafal daftar selektor.
 */
export function HeroCopy({ dict }: { dict: Dictionary }) {
  return (
    <div className="hero-copy">
      <p className="eyebrow" data-hero-fade>
        {dict.hero.eyebrow}
      </p>

      <h1 className="hero-headline" data-hero-headline>
        {dict.hero.headline.before}
        <em>{dict.hero.headline.accent}</em>
        {dict.hero.headline.after}
      </h1>

      <p className="lede" data-hero-fade>
        {dict.hero.lede}
      </p>

      <HeroCta dict={dict} />

      <dl className="hero-stats" data-hero-fade>
        {[
          { value: "Rp 8K", label: dict.hero.stats.price },
          { value: "30+", label: dict.hero.stats.items },
          { value: "4", label: dict.hero.stats.stages },
          { value: "100%", label: dict.hero.stats.origin },
        ].map((stat) => (
          <div className="stat" key={stat.label}>
            <dt className="stat-value">{stat.value}</dt>
            <dd className="stat-label">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
