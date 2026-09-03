import type { Dictionary } from "@/i18n/dictionaries/id";
import { ContactForm } from "@/modules/home/components/ContactForm";
import { HQ } from "@/modules/home/constants/menu-data";

/**
 * Seksi 8, Kontak. Satu aksi, bukan empat.
 *
 * information-architecture.md §3 tegas soal ini: WhatsApp adalah konversi yang
 * realistis untuk bisnis ini, jadi ia yang jadi CTA utama dan nomornya
 * ditampilkan apa adanya sebagai jalan kedua yang bisa disalin atau ditelepon.
 *
 * Membawa `id="kontak"`, sasaran CTA persisten di navbar. Footer juga memuat
 * nomor yang sama, dan keduanya membaca konstanta yang berbeda karena nanti
 * berasal dari tabel yang berbeda juga.
 *
 * FORM ditambahkan atas permintaan pemilik proyek, dan ia sengaja berada DI
 * BAWAH tombol WhatsApp, bukan menggantikannya. IA §3 tetap berlaku: WhatsApp
 * yang jadi konversi utama karena itu kanal yang benar-benar dipakai bisnis
 * ini, dan balasannya datang dalam hitungan menit. Form melayani hal yang tidak
 * dilayani WhatsApp dengan baik, yaitu pesan panjang yang butuh ditulis rapi.
 */
export function ContactSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="section contact" id="kontak">
      <p className="eyebrow" data-reveal>
        {dict.contact.eyebrow}
      </p>
      <h2 className="section-heading" data-reveal>
        {dict.contact.heading}
      </h2>
      <p className="lede" data-reveal>
        {dict.contact.lede}
      </p>

      <div className="contact-row" data-reveal>
        <a
          className="cta-primary"
          href={HQ.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.contact.cta}
          <span aria-hidden="true">&#8594;</span>
        </a>
        <a className="contact-phone" href={HQ.phoneHref}>
          {HQ.phone}
        </a>
      </div>

      <div data-reveal>
        <ContactForm dict={dict} />
      </div>
    </section>
  );
}
