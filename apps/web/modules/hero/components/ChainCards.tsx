import type { CSSProperties } from "react";

import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Empat kartu rantai produksi, tempat mendaratnya biji.
 *
 * Berada di dalam panggung film, bukan di seksi terpisah, karena perpindahan
 * hero ke seksi berikutnya harus satu gerakan utuh.
 *
 * NOMOR 01 SAMPAI 04 SUDAH DICABUT, atas permintaan pemilik proyek. Itu dulu
 * pembawa urutan tahap yang tidak bergantung warna, jadi pencabutannya menuntut
 * pengganti, bukan sekadar penghapusan. Dua yang menggantikannya:
 *
 *   1. `ol` tetap membawa urutan untuk pembaca layar, dan itu tidak berubah.
 *   2. `.chain-rule` di atas kartu membawa urutan itu secara visual sebagai
 *      satu alur yang mengalir melintasi keempatnya.
 *
 * GARIS DI ATAS KARTU digambar DARI KANAN KE KIRI, dan baru setelah seluruh
 * animasi film selesai. Waktunya ditentukan di HeroFilm, bukan di sini:
 * `BEAT.cards` berakhir tepat di 1.0 pada timeline yang dinormalkan, dan
 * garisnya menempati 0.92 sampai 1.0, jadi ia benar-benar hal terakhir yang
 * terjadi. Anak `<i>` di dalamnya adalah cahaya beam yang berjalan menyusuri
 * garis, dan ia baru hidup setelah `data-drawn` dipasang.
 *
 * BEAM MENGALIR di tepi tiap kartu ditulis di CSS, bukan komponen vendor.
 * `lightswind/border-beam` sempat dipasang dan gagal: ia menyusun dirinya dari
 * nilai Tailwind arbitrer bertanda kurung dan `offset-path: rect()`, dan
 * hasilnya bukan garis yang menelusuri tepi melainkan potongan emas pendek yang
 * mengambang di tengah kartu. Terlihat langsung di screenshot.
 *
 * Versi CSS memakai conic-gradient berputar yang di-mask jadi cincin setebal
 * satu piksel. Lebih sedikit bergerak, lebih bisa diprediksi, dan warnanya
 * memakai token palet langsung. Tiap kartu diberi jeda berbeda lewat
 * `--beam-delay` supaya keempatnya tidak berdenyut serempak.
 */
export function ChainCards({ dict }: { dict: Dictionary }) {
  const cards = [
    { key: "kebun", ...dict.chain.cards.kebun },
    { key: "roastery", ...dict.chain.cards.roastery },
    { key: "outlet", ...dict.chain.cards.outlet },
    { key: "keliling", ...dict.chain.cards.keliling },
  ];

  return (
    <div className="chain-layer">
      <div className="chain-head" data-chain-head>
        <p className="eyebrow">{dict.chain.eyebrow}</p>
        <h2 className="chain-heading">
          {dict.chain.heading.line1}
          <br />
          {dict.chain.heading.line2}
        </h2>
      </div>

      {/* Dekoratif sepenuhnya. Urutan tahap yang dibawanya sudah disampaikan
          `ol` di bawah, jadi menyembunyikannya dari pembaca layar tidak
          menghilangkan informasi apa pun. */}
      <div className="chain-rule" data-chain-rule aria-hidden="true">
        <i />
      </div>

      <ol className="chain-grid">
        {cards.map((card, i) => (
          <li
            className="chain-card"
            data-chain-card={i}
            key={card.key}
            style={{ "--beam-delay": `${i * -1.7}s` } as CSSProperties}
          >
            <h3 className="chain-title">{card.title}</h3>
            <p className="chain-body">{card.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
