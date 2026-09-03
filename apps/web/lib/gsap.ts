"use client";

/**
 * Registrasi plugin GSAP, satu kali untuk seluruh aplikasi.
 *
 * GSAP 3.13 ke atas melepas seluruh plugin bonus secara gratis, dan yang
 * terpasang di sini 3.15, jadi SplitText boleh dipakai tanpa lisensi Club.
 *
 * MorphSVG dan DrawSVG sempat dipakai untuk mengubah bentuk buah jadi biji dan
 * menggambar celahnya. Keduanya dicabut setelah biji SVG diganti sprite foto:
 * bentuk dan celahnya kini ada di dalam gambar, jadi perpindahannya cukup
 * silang-pudar. Dua plugin lebih sedikit di bundle.
 *
 * SplitText diambil dari GSAP, bukan dari ./reactbits. Komponen reactbits itu
 * memasang ScrollTrigger sendiri, dan itu akan berebut kendali dengan film hero.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText };
