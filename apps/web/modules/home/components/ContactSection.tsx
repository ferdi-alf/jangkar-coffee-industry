import type { Dictionary } from "@/i18n/dictionaries/id";
import { ContactForm } from "@/modules/home/components/ContactForm";
import { getSiteSettings } from "@/modules/home/lib/site-settings";

/**
 * Seksi 8, Kontak. Satu aksi, bukan empat.
 *
 * information-architecture.md §3 tegas soal ini: WhatsApp adalah konversi yang
 * realistis untuk bisnis ini, jadi ia yang jadi CTA utama dan nomornya
 * ditampilkan apa adanya sebagai jalan kedua yang bisa disalin atau ditelepon.
 *
 * Membawa `id="kontak"`, sasaran CTA persisten di navbar. Footer memuat nomor
 * yang sama, dan KINI KEDUANYA MEMBACA SUMBER YANG SAMA, yaitu tabel
 * site_contact lewat /settings/public. Sebelumnya keduanya membaca konstanta HQ
 * yang dikodekan langsung, jadi mengganti nomor telepon berarti deploy ulang.
 *
 * FORM ditambahkan atas permintaan pemilik proyek, dan ia sengaja berada DI
 * BAWAH tombol WhatsApp, bukan menggantikannya. IA §3 tetap berlaku: WhatsApp
 * yang jadi konversi utama karena itu kanal yang benar-benar dipakai bisnis
 * ini, dan balasannya datang dalam hitungan menit. Form melayani hal yang tidak
 * dilayani WhatsApp dengan baik, yaitu pesan panjang yang butuh ditulis rapi.
 */
export async function ContactSection({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const { contact } = await getSiteSettings(locale);

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

      {/* Tombol dan nomor hanya dirender bila datanya ADA. Panel boleh
          mengosongkan keduanya, dan tautan `href` kosong yang tetap tampil akan
          membawa pengunjung ke halaman itu sendiri, yang jauh lebih
          membingungkan daripada tombol yang memang tidak ada. */}
      <div className="contact-row" data-reveal>
        {contact.whatsapp ? (
          <a
            className="cta-primary"
            href={contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dict.contact.cta}
            <span aria-hidden="true">&#8594;</span>
          </a>
        ) : null}
        {contact.phone && contact.phoneHref ? (
          <a className="contact-phone" href={contact.phoneHref}>
            {contact.phone}
          </a>
        ) : null}
      </div>

      <div data-reveal>
        <ContactForm dict={dict} />
      </div>
    </section>
  );
}
