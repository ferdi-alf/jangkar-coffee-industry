import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { getSiteSettings } from "@/modules/home/lib/site-settings";
import { SocialIcon } from "@/components/ui/social-icons";
import { BRAND, navCta, navItems } from "@/modules/navigation/constants/nav-items";

/**
 * Footer, seksi 9 pada information-architecture.md.
 *
 * Komponen server. Membaca konstanta navigasi yang sama dengan dock, jadi
 * menambah seksi cukup di satu tempat.
 *
 * Kontaknya [FACT], terverifikasi di brand-analysis.md dari menu outlet dan
 * menu keliling yang asli. Yang tetap kosong hanya tautan Shopee dan Tokopedia,
 * karena URL tokonya belum pernah diberikan dan menebak URL toko di halaman
 * publik jauh lebih berbahaya daripada membiarkan barisnya kosong.
 */
/** Nama platform untuk pembaca layar. Panel berbahasa Indonesia, situs dua
 *  bahasa, tapi nama merek tidak diterjemahkan di bahasa mana pun. */
const SOCIAL_NAME: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  threads: "Threads",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

/**
 * Footer.
 *
 * KONTAK DAN SOSIAL MEDIA DATANG DARI BASIS DATA, bukan lagi dari konstanta HQ.
 * Sebelumnya nomor telepon, alamat, dan satu tautan Instagram dikodekan
 * langsung di modules/home/constants/menu-data.ts, jadi mengganti nomor berarti
 * deploy ulang dan menambah TikTok berarti menulis kode. Sekarang keduanya
 * dikelola di /kontak pada panel.
 *
 * IKON SOSIAL SELALU BERPASANGAN DENGAN NAMA PLATFORM yang terbaca pembaca
 * layar. Bentuk ikon tidak boleh jadi satu-satunya pembawa makna, dan glifnya
 * sendiri `aria-hidden`, jadi nama itu dibawa `aria-label` pada tautannya.
 * Lihat components/ui/social-icons.tsx, yang juga menjelaskan kenapa glifnya
 * bukan dari lucide.
 */
export async function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links = [...navItems(locale, dict), navCta(locale, dict)];
  const { contact, social } = await getSiteSettings(locale);

  return (
    <footer className="site-footer" id="kontak-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark brand-mark-lg" aria-hidden="true" />
          <p className="footer-name">{BRAND.full}</p>
          <p className="footer-tagline">{dict.footer.tagline}</p>
        </div>

        <nav className="footer-col" aria-label={dict.footer.explore}>
          <h2 className="footer-heading">{dict.footer.explore}</h2>
          <ul className="footer-list">
            {links.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-col">
          <h2 className="footer-heading">{dict.footer.places}</h2>
          <dl className="footer-defs">
            <div>
              <dt>{dict.footer.hq}</dt>
              <dd>{contact.address ?? ""}</dd>
            </div>
            <div>
              <dt>{dict.footer.farm}</dt>
              <dd>{dict.footer.farmValue}</dd>
            </div>
          </dl>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">{dict.footer.contact}</h2>
          {/* Tiap baris hanya muncul bila datanya ADA. Panel boleh
              mengosongkan salah satunya, dan tautan dengan href kosong justru
              menavigasi ke halaman itu sendiri. */}
          <ul className="footer-list">
            {contact.phone && contact.phoneHref ? (
              <li>
                <a href={contact.phoneHref}>{contact.phone}</a>
              </li>
            ) : null}
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            ) : null}
            {contact.siteUrl ? (
              <li>
                <a href={contact.siteUrl} target="_blank" rel="noopener noreferrer">
                  {contact.siteLabel ?? contact.siteUrl}
                </a>
              </li>
            ) : null}
          </ul>

          {social.length > 0 ? (
            <ul className="footer-social" aria-label={dict.footer.contact}>
              {social.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    /* Nama platform dibawa aria-label, karena glifnya sendiri
                       aria-hidden. Tanpa ini tautannya terbaca sebagai "tautan"
                       tanpa satu petunjuk pun tentang tujuannya. */
                    aria-label={`${SOCIAL_NAME[link.platform]}${link.label ? `, ${link.label}` : ""}`}
                  >
                    <SocialIcon platform={link.platform} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="footer-body footer-shop">{dict.footer.shop}</p>
          <p className="footer-note">{dict.footer.shopNote}</p>
        </div>
      </div>

      <p className="footer-base">
        &copy; {new Date().getFullYear()} {BRAND.full}
      </p>
    </footer>
  );
}
