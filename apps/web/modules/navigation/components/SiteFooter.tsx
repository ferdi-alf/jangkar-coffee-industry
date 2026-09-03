import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { HQ } from "@/modules/home/constants/menu-data";
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
export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links = [...navItems(locale, dict), navCta(locale, dict)];

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
              <dd>{HQ.address}</dd>
            </div>
            <div>
              <dt>{dict.footer.farm}</dt>
              <dd>{dict.footer.farmValue}</dd>
            </div>
          </dl>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">{dict.footer.contact}</h2>
          <ul className="footer-list">
            <li>
              <a href={HQ.phoneHref}>{HQ.phone}</a>
            </li>
            <li>
              <a href={HQ.site.href} target="_blank" rel="noopener noreferrer">
                {HQ.site.label}
              </a>
            </li>
            <li>
              <a href={HQ.instagram.href} target="_blank" rel="noopener noreferrer">
                {HQ.instagram.label}
              </a>
            </li>
          </ul>
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
