import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { ChainCards } from "@/modules/hero/components/ChainCards";
import { HeroBranchPhoto } from "@/modules/hero/components/HeroBranchPhoto";
import { HeroCopy } from "@/modules/hero/components/HeroCopy";
import { HeroFilm } from "@/modules/hero/components/HeroFilm";
import { AboutSection } from "@/modules/home/components/AboutSection";
import { ContactSection } from "@/modules/home/components/ContactSection";
import { KelilingSection } from "@/modules/home/components/KelilingSection";
import { MenuSection } from "@/modules/home/components/MenuSection";
import { OriginSection } from "@/modules/home/components/OriginSection";
import { OutletSection } from "@/modules/home/components/OutletSection";
import { RevealRoot } from "@/modules/home/components/RevealRoot";
import { RoasterySection } from "@/modules/home/components/RoasterySection";

/**
 * Beranda, dua bahasa.
 *
 * DUA ATURAN STRUKTURAL yang tidak boleh dibalik. Seksi Rantai berada sebelum
 * Menu: rantai produksi mengalahkan daftar produk, dan kalau minumannya lebih
 * dulu halaman ini kembali jadi halaman kafe berapa pun rapinya gaya visualnya.
 * Dan seksi Keliling memang boleh melanggar sistem, itu tertulis di IA §6.
 *
 * TINGKAT ANIMASI, aturan dari pemilik proyek: sinematik HANYA di hero dan pada
 * perpindahannya ke seksi Rantai. Semua yang di bawah film memakai reveal biasa,
 * dikelola satu komponen client `RevealRoot`.
 *
 * Seluruh seksi adalah komponen server dan menerima kamus lewat prop, jadi
 * kedua kamus tidak pernah ikut ke bundle klien.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <main>
      {/* Empat hal yang tersembunyi sampai JavaScript menyalakannya, dan tanpa
          JavaScript tidak ada yang menyalakan. Kartu rantai disembunyikan CSS
          karena di desktop ia bertumpuk di atas hero. Garis rantai menunggu
          timeline GSAP. Reveal seksi lain menunggu RevealRoot. Dan kartu garis
          waktu About menunggu framer-motion, yang menulis `opacity: 0` sebagai
          gaya sebaris saat dirender di server, jadi ia butuh `!important`
          untuk dikembalikan. */}
      <noscript>
        <style>
          {".chain-head,.chain-card{opacity:1}.chain-rule{transform:none}" +
            "[data-reveal]{opacity:1;transform:none}" +
            ".tl-card,.tl-dot{opacity:1!important;transform:none!important}" +
            ".tl-fill{height:100%!important}"}
        </style>
      </noscript>

      <section className="film" id="beranda">
        <HeroFilm>
          <div className="aurora" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <div className="hero-layer">
            <HeroCopy dict={dict} />
            <HeroBranchPhoto />
          </div>

          <ChainCards dict={dict} />
        </HeroFilm>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) =>
            dict.marquee.map((word) => <span key={`${copy}-${word}`}>{word}</span>),
          )}
        </div>
      </div>

      <RevealRoot>
        <div id="industri" className="anchor-only" aria-hidden="true" />
        {/* About duduk di sini atas pilihan pemilik proyek: setelah Rantai,
            sebelum Menu. Rantainya diperlihatkan, ceritanya diperdalam selagi
            masih dipikirkan, baru produknya datang sebagai bukti. */}
        <AboutSection dict={dict} />
        <MenuSection dict={dict} />
        <RoasterySection dict={dict} locale={locale} />
        <OutletSection dict={dict} />
        <KelilingSection dict={dict} locale={locale} />
        <OriginSection dict={dict} />
        <ContactSection dict={dict} />
      </RevealRoot>
    </main>
  );
}
