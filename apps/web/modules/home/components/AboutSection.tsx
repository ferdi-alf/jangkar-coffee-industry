import type { Dictionary } from "@/i18n/dictionaries/id";
import { AboutTimeline } from "@/modules/home/components/AboutTimeline";

/**
 * Seksi About, teks berkartu plus garis waktu dua sisi.
 *
 * LETAKNYA setelah Rantai dan sebelum Menu, dipilih pemilik proyek. Alurnya
 * jadi: rantai diperlihatkan, ceritanya diperdalam selagi masih dipikirkan,
 * baru produknya datang sebagai bukti. Itu memperkuat aturan
 * information-architecture.md §3 yang menyatakan rantai harus mengalahkan
 * daftar produk, bukan melanggarnya.
 *
 * Seluruh seksinya dibungkus latar kisi bergaris yang saling memotong selebar
 * layar penuh, dan teksnya dibungkus satu kartu. Keduanya permintaan pemilik
 * proyek dan keduanya murni CSS.
 *
 * KISINYA BERADA DI LUAR `<section>`, dan itu bukan pilihan gaya melainkan
 * keharusan. `.section` memakai `content-visibility: auto` untuk melewati
 * render di bawah lipatan, dan nilai itu ikut memasang PAINT CONTAINMENT yang
 * memotong cat anaknya ke kotak seksi. Terukur pada 1920px: kotak kisinya
 * benar selebar 1920, tapi yang benar-benar tercat hanya 312 sampai 1560,
 * persis selebar `--max`. Dengan `content-visibility: visible` angkanya jadi
 * 104 sampai 1872. Menaruh kisi di pembungkus luar memperbaiki potongan itu
 * tanpa mengorbankan optimasi render seksinya.
 *
 * Reveal teksnya tetap memakai `data-reveal` milik RevealRoot. Garis waktunya
 * TIDAK, ia mengurus revealnya sendiri lewat framer-motion, karena gerakannya
 * terikat progres guliran dan bukan sekadar masuk layar.
 */
export function AboutSection({ dict }: { dict: Dictionary }) {
  return (
    <div className="about-wrap">
      <div className="about-grid-bg" aria-hidden="true" />

      <section className="section about" id="about">
        <div className="about-head">
          <p className="eyebrow" data-reveal>
            {dict.about.eyebrow}
          </p>
          <h2 className="section-heading" data-reveal>
            {dict.about.heading.line1}
            <br />
            {dict.about.heading.line2}
          </h2>
        </div>

        <div className="about-card" data-reveal>
          {dict.about.body.map((paragraph) => (
            <p className="lede" key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}
        </div>

        <h3 className="about-tl-heading" data-reveal>
          {dict.about.timelineHeading}
        </h3>

        <AboutTimeline dict={dict} />
      </section>
    </div>
  );
}
