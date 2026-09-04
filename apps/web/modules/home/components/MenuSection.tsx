import type { Dictionary } from "@/i18n/dictionaries/id";
import type { MenuCategory } from "@/modules/home/constants/menu-data";

/**
 * Seksi 3, menu outlet LENGKAP dalam satu seksi.
 *
 * Pola dua kolom kartu kategori diambil dari menu cetaknya, termasuk garis
 * titik yang menghubungkan nama ke harga. Lima kategori, 33 item.
 *
 * ITEM HABIS DICORET DAN DIBERI LABEL. Americano dicoret di menu cetaknya, dan
 * brand-analysis.md mencatat status habis itu sudah dipakai sungguhan. Coretan
 * saja tidak cukup: aturan tetap proyek melarang warna atau gaya jadi
 * satu-satunya pembawa makna, jadi labelnya ikut ditulis.
 *
 * `<dl>` dipilih, bukan tabel maupun daftar biasa, karena isinya memang
 * pasangan nama dan harga. Pembaca layar mengumumkannya sebagai pasangan.
 *
 * DATANYA KINI DARI BASIS DATA, bukan konstanta. Induknya mengambilnya lewat
 * modules/home/lib/outlet-menu.ts, jadi harga yang disunting di /menu pada
 * panel akhirnya benar-benar mengubah halaman ini. Judul kartunya adalah nama
 * kategori sungguhan, jadi mengganti nama di /category ikut terlihat di sini.
 */
export function MenuSection({ dict, categories }: { dict: Dictionary; categories: MenuCategory[] }) {
  return (
    <section className="section menu-section" id="menu">
      <p className="eyebrow" data-reveal>
        {dict.menu.eyebrow}
      </p>
      <h2 className="section-heading" data-reveal>
        {dict.menu.heading.line1}
        <br />
        {dict.menu.heading.line2}
      </h2>
      <p className="lede" data-reveal>
        {dict.menu.lede}
      </p>

      <div className="menu-columns">
        {categories.map((category) => (
          <section className="menu-card" data-reveal data-spot key={category.id}>
            <h3 className="menu-card-heading">{category.name}</h3>
            <dl className="menu-list">
              {category.items.map((item) => (
                <div className="menu-line" data-sold-out={item.soldOut || undefined} key={item.name}>
                  <dt>
                    <span className="menu-line-name">{item.name}</span>
                    {item.soldOut ? <span className="menu-flag">{dict.menu.soldOut}</span> : null}
                  </dt>
                  <dd>{item.price}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <ul className="menu-notes" data-reveal>
        {dict.menu.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
