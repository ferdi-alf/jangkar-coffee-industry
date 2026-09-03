import Image from "next/image";

import { BEANS, BEAN_SPRITES, BRANCH_PHOTO } from "@/modules/hero/constants/hero-beats";

/**
 * Ranting kopi, layer belakang hero.
 *
 * Dekoratif sepenuhnya, karena itu aria-hidden dan alt kosong. Seluruh makna
 * dibawa teks hero dan kartu rantai.
 *
 * `priority` dipasang karena foto ini berada di atas lipatan dan menjadi kandidat
 * elemen LCP. Tanpa itu Next menunda pemuatannya dan LCP justru mundur.
 *
 * TIGA LAPIS TRANSFORM, dan pemisahannya disengaja:
 *
 *   .branch-panel   penempatan saja, tidak pernah dianimasikan
 *   .branch-sway    HANYA CSS. Embusan angin, keyframes tak berujung
 *   .branch-photo   HANYA GSAP. Beat scroll menulis scale, rotate, y, opacity
 *
 * Kalau angin dan beat scroll berbagi satu elemen, keduanya menulis properti
 * `transform` yang sama dan yang terakhir menang. Efeknya salah satu selalu
 * hilang. Dipisah, keduanya bertumpuk sebagaimana mestinya.
 *
 * Biji kini sprite foto, bukan lagi SVG buatan tangan, dipotong dari satu render
 * yang sama supaya cahaya dan skalanya sepadan dengan buah pada foto ranting.
 *
 * Biji berada DI DALAM `.branch-sway`, jadi ia ikut berayun bersama ranting dan
 * tetap menempel di gugus buahnya. Kalau di luar, ranting bergoyang sementara
 * bijinya diam, dan sambungannya langsung terlihat palsu. Ia tetap DI LUAR
 * `.branch-photo` karena elemen itu membawa mask, dan biji yang ter-mask akan
 * terpotong saat terbang ke kartu rantai.
 */
export function HeroBranchPhoto() {
  return (
    <div className="branch-panel" aria-hidden="true">
      <div className="branch-sway">
        <div className="branch-photo">
          <Image
            src={BRANCH_PHOTO.src}
            alt=""
            width={BRANCH_PHOTO.width}
            height={BRANCH_PHOTO.height}
            priority
            /* Lebar foto ditentukan TINGGINYA lewat aspect-ratio, bukan lebar
               viewport, jadi sizes harus dinyatakan dalam vh. Menyatakannya dalam
               vw membuat Next menyajikan varian yang lebih besar dari yang
               benar-benar dipakai. */
            sizes="(max-width: 1023px) 31vh, 37vw"
          />
        </div>

        {BEANS.map((bean, i) => (
          <span
            className="bean"
            data-bean={i}
            key={bean.stage}
            style={{ left: `${bean.left}%`, top: `${bean.top}%` }}
          >
            {/* Dua sprite bertumpuk, disilang-pudarkan di beat sangrai. Buah
                yang matang di atas, biji yang sudah disangrai di bawahnya,
                menunggu giliran. Keduanya dari satu render yang sama, jadi
                cahaya dan skalanya sepadan dan pertukarannya tidak berkedip.

                `unoptimized` disengaja. Berkasnya sudah dibuat tepat pada
                resolusi yang menyamai plate, dan kalau Next boleh membuat varian
                2x ia akan menyajikan 176px untuk kotak 96 piksel perangkat.
                Ketajamannya melompat lagi dan bijinya kembali terbaca seperti
                stiker HD di atas foto yang lembut. */}
            <Image
              className="bean-pod"
              src={BEAN_SPRITES.ripe}
              alt=""
              width={BEAN_SPRITES.size}
              height={BEAN_SPRITES.size}
              unoptimized
            />
            <Image
              className="bean-roast"
              src={BEAN_SPRITES.roasted}
              alt=""
              width={BEAN_SPRITES.size}
              height={BEAN_SPRITES.size}
              unoptimized
            />
          </span>
        ))}
      </div>
    </div>
  );
}
