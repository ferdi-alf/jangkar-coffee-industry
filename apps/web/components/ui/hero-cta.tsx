"use client";

import Magnet from "@/components/reactbits/Magnet";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { useMediaCapability } from "@/shared/hooks/useMediaCapability";

/**
 * Pembungkus kita di atas komponen vendor.
 *
 * Berkas di components/reactbits tidak boleh diedit di tempat, components.json
 * menunjuk registry-nya dan pembaruan bisa menimpa berkas asli. Vendor juga tidak
 * membawa direktif "use client" padahal memakai hook, jadi batas klien dipasang
 * di sini. Lihat aturan komponen di CLAUDE.md.
 *
 * POHON KOMPONEN HARUS TETAP SAMA di setiap render. Sempat dibungkus kondisional
 * di sini, dan akibatnya nyata: useMediaCapability mulai dari nilai aman lalu
 * berubah setelah efek pertama, pembungkus muncul, React membuat ulang simpul
 * DOM-nya, dan seluruh gaya sebaris yang sudah ditulis GSAP hilang. Tombolnya
 * tertinggal menyala di layar sementara sisa hero sudah mundur. Karena itu Magnet
 * selalu dirender, yang berubah hanya prop `disabled`. Vendor sudah menangani itu
 * dengan benar, listener mousemove tidak dipasang sama sekali saat disabled.
 *
 * CTA sekunder "Asal biji" dihapus atas permintaan pemilik proyek. Tersisa satu
 * aksi, dan itu sejalan dengan information-architecture.md §3.
 *
 * ClickSpark tidak dipakai. Komponen itu menjalankan requestAnimationFrame terus
 * menerus selama ter-mount, bahkan ketika tidak ada percikan yang digambar. Di
 * hero yang selalu ter-mount itu berarti beban CPU tanpa henti, persis yang
 * dilarang anggaran performa. Bisa diadopsi nanti bila loop-nya dibungkus supaya
 * berhenti saat tidak terpakai.
 */
export function HeroCta({ dict }: { dict: Dictionary }) {
  const { coarsePointer, reducedMotion } = useMediaCapability();

  return (
    <div className="hero-cta" data-hero-fade>
      <Magnet padding={90} magnetStrength={7} disabled={coarsePointer || reducedMotion}>
        <a className="cta-primary" href="#industri">
          {dict.hero.cta}
          <span aria-hidden="true">&#8594;</span>
        </a>
      </Magnet>
    </div>
  );
}
