"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";

import { gsap, SplitText } from "@/lib/gsap";
import { BEAT, BEAT_MOBILE } from "@/modules/hero/constants/hero-beats";

/**
 * Orkestrasi film hero.
 *
 * Komponen ini tidak merender satu pun konten. Seluruh markup datang dari
 * komponen server lewat `children`, dan GSAP hanya melekat padanya. Itu sebabnya
 * h1 tetap ada di HTML awal dan LCP tidak menunggu JavaScript.
 *
 * Urutan progressive enhancement disengaja: CSS sudah menampilkan halaman dalam
 * keadaan terbaca. JavaScript baru menyembunyikannya lalu memunculkannya kembali,
 * dan hanya bila gerak diizinkan.
 *
 * PEMBAGIAN TRANSFORM. Embusan angin dipegang CSS di `.branch-sway`, beat scroll
 * dipegang GSAP di `.branch-photo` yang ada di dalamnya. Keduanya tidak pernah
 * menyentuh elemen yang sama, karena kalau iya salah satunya pasti hilang
 * tertimpa yang lain.
 */

/**
 * Seberapa lama animasi mengejar posisi scroll, dalam detik.
 *
 * Sempat 0.8, dan itulah yang terasa sebagai lag saat scroll dilempar cepat.
 * Terukur langsung: setelah scroll berhenti, animasi masih terus bergerak
 * selama 792 ms, persis nilai scrub-nya. Bukan frame yang jatuh. Main thread
 * justru senggang, total script, style, dan layout selama satu lemparan penuh
 * hanya 28 ms pada CPU normal.
 *
 * Tidak dijadikan `true`, yang berarti tanpa pelicin sama sekali. Nol latensi,
 * tapi pada mouse yang scroll-nya bertingkat setiap klik roda akan terlihat
 * sebagai lompatan, bukan gerakan mengalir.
 */
const SCRUB = 0.3;

/**
 * Posisi tata letak sebuah elemen relatif terhadap panggung.
 *
 * Sengaja memakai offsetLeft dan offsetTop, bukan getBoundingClientRect. Rect
 * ikut terpengaruh transform yang sedang berjalan, termasuk ayunan angin, dan
 * ikut bergeser saat ScrollTrigger memasang pin. Offset murni tata letak, jadi
 * pengukuran ini tetap benar dipanggil kapan pun.
 */
function offsetWithin(el: HTMLElement, stage: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== stage) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

export function HeroFilm({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = root.current;
      if (!stage) return;

      const q = <T extends Element>(sel: string) => Array.from(stage.querySelectorAll<T>(sel));
      const photo = stage.querySelector<HTMLElement>(".branch-photo");
      const panel = stage.querySelector<HTMLElement>(".branch-panel");
      const chainHead = stage.querySelector<HTMLElement>("[data-chain-head]");
      const headline = stage.querySelector<HTMLElement>("[data-hero-headline]");
      const chainLayer = stage.querySelector<HTMLElement>(".chain-layer");
      const chainRule = stage.querySelector<HTMLElement>("[data-chain-rule]");

      const beans = q<HTMLElement>(".bean");
      const pods = q<HTMLElement>(".bean-pod");
      const roasts = q<HTMLElement>(".bean-roast");
      const fades = q<HTMLElement>("[data-hero-fade]");
      const cards = q<HTMLElement>("[data-chain-card]");

      if (!photo || !panel || !headline || !chainHead || !chainLayer) return;

      /* Embusan angin berjalan tanpa henti selama ter-mount. Dijeda begitu
         rantingnya keluar layar, sesuai anggaran performa PROJECT-SPEC: apa pun
         yang bergerak di luar viewport hanya membakar baterai. */
      const idleWatcher = new IntersectionObserver(
        ([entry]) => {
          panel.dataset.idle = entry.isIntersecting ? "running" : "paused";
          /* `data-film` MENJEDA beam yang berputar di tepi kartu rantai dan
             beam yang berjalan di garis di atasnya.

             Ini koreksi. CSS sudah memakai `.film-stage[data-film="idle"]`
             untuk menjeda beam kartu, dan komentarnya menyatakan beam itu
             berhenti saat film tidak aktif, tapi TIDAK ADA satu baris pun yang
             pernah memasang atribut itu. Terbukti saat probe: selektornya tidak
             pernah cocok, jadi beam terus berputar meski panggungnya sudah jauh
             di luar layar. Persis yang dilarang anggaran performa. */
          stage.dataset.film = entry.isIntersecting ? "live" : "idle";
        },
        { rootMargin: "120px" },
      );
      idleWatcher.observe(panel);

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          isMobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
          isStatic: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const conditions = context.conditions ?? {};
          const isDesktop = conditions.isDesktop;
          const isMobile = conditions.isMobile;
          const isStatic = conditions.isStatic;

          if (isStatic) return;

          /* ── Keadaan awal ─────────────────────────────────────────────── */
          /* Di mobile ranting berada tepat di belakang headline, jadi ia masuk
             dalam keadaan diredupkan supaya teksnya tetap terbaca, lalu maju ke
             depan begitu headline pergi. Di desktop ia langsung penuh karena
             headline sebagian besar berada di kirinya. */
          /* Angkanya hasil pengukuran kontras piksel terburuk, bukan selera.
             Biji ikut diredupkan, dan itu ternyata yang menentukan: piksel
             terburuk di bawah headline berwarna kemerahan, jadi asalnya biji,
             bukan daun. Keduanya naik ke penuh begitu headline pergi. */
          const restOpacity = isMobile ? 0.32 : 1;
          const beanRest = isMobile ? 0.26 : 1;
          gsap.set(photo, { scale: 1.06, opacity: 0, transformOrigin: "70% 40%" });
          gsap.set(beans, { scale: 0, opacity: beanRest });
          /* Biji sangrai menunggu sedikit lebih besar lalu menyusut ke ukuran
             pas saat muncul. Buahnya melakukan kebalikannya. Dua gerak berlawanan
             itu yang membuat pertukarannya terbaca sebagai PERUBAHAN, bukan
             sekadar dua gambar yang saling memudar. */
          gsap.set(roasts, { opacity: 0, scale: 1.16 });
          gsap.set(fades, { y: 26, opacity: 0 });
          gsap.set([chainHead, ...cards], { y: 24, opacity: 0 });
          /* Garis rantai. `transformOrigin: right` yang membuatnya menggambar
             KE KIRI: pada scaleX(0) ia mengatup di tepi kanan, dan tepi kirinya
             yang berjalan keluar saat ia tumbuh. */
          if (chainRule) gsap.set(chainRule, { scaleX: 0, transformOrigin: "right" });

          /* ── Beat 0, saat muat ────────────────────────────────────────── */
          /* SplitText HANYA di desktop, dan alasannya terukur. Memecah h1 jadi
             span per huruf mengubah cara barisnya patah, tinggi h1 berubah, dan
             isi di bawahnya bergeser. Di 360px itu CLS 0.1609. Reveal per huruf
             adalah kemewahan, bukan pembawa makna. */
          const split = isDesktop
            ? new SplitText(headline, {
                type: "words,chars",
                charsClass: "hchar",
                wordsClass: "hword",
              })
            : null;
          const chars: Element[] = split ? split.chars : [headline];
          const cleanup = () => {
            split?.revert();
            idleWatcher.disconnect();
            chainRule?.removeAttribute("data-drawn");
          };

          const headlineIn: gsap.TweenVars = { opacity: 1, duration: 0.78 };
          if (split) {
            gsap.set(chars, { yPercent: 60, opacity: 0, filter: "blur(9px)" });
            headlineIn.yPercent = 0;
            headlineIn.filter = "blur(0px)";
            headlineIn.stagger = 0.018;
          } else {
            gsap.set(chars, { y: 26, opacity: 0 });
            headlineIn.y = 0;
          }

          gsap
            .timeline({
              defaults: { ease: "power2.out" },
              /* Blur hanya dibutuhkan selama huruf masuk. Kalau tidak dibersihkan,
                 ke-33 huruf tetap membawa `filter: blur(0px)` selamanya: nol
                 manfaat visual, tapi setiap huruf tetap dipaksa melewati jalur
                 filter dan berpotensi mendapat layer sendiri. */
              onComplete: () => gsap.set(chars, { clearProps: "filter" }),
            })
            .to(chars, headlineIn, 0)
            .to(fades, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06 }, 0.34)
            .to(photo, { scale: 1, opacity: restOpacity, duration: 1.1, ease: "power2.inOut" }, 0)
            .to(beans, { scale: 1, duration: 0.55, stagger: 0.07, ease: "back.out(2)" }, 0.55);

          /* ── Pengukuran jarak terbang ─────────────────────────────────── */
          const flight = beans.map(() => ({ dx: 0, dy: 0 }));
          const measure = () => {
            beans.forEach((bean, i) => {
              const card = cards[i];
              if (!card) return;
              const from = offsetWithin(bean, stage);
              const to = offsetWithin(card, stage);
              flight[i] = {
                dx: to.x + card.offsetWidth / 2 - (from.x + bean.offsetWidth / 2),
                dy: to.y + 46 - (from.y + bean.offsetHeight / 2),
              };
            });
          };
          measure();

          const beat = isMobile ? BEAT_MOBILE : BEAT;
          const landAt = beat.cards.at;

          /* Mobile digerakkan scroll tapi TANPA pin. Halaman tetap mengalir
             bebas, tidak ada scroll yang ditahan, jadi anggaran INP aman.
             Selesainya diikat ke kartu Rantai, bukan ke panjang panggung, supaya
             biji mendarat tepat ketika kartunya benar-benar terlihat. */
          const film = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: isMobile
              ? {
                  trigger: stage,
                  start: "top top",
                  endTrigger: chainLayer,
                  end: "top 30%",
                  scrub: SCRUB,
                  invalidateOnRefresh: true,
                  onRefresh: measure,
                }
              : {
                  trigger: stage,
                  start: "top top",
                  end: "+=110%",
                  pin: true,
                  scrub: SCRUB,
                  anticipatePin: 1,
                  invalidateOnRefresh: true,
                  onRefresh: measure,
                  onToggle: (self) => {
                    gsap.set([...beans, photo], {
                      willChange: self.isActive ? "transform" : "auto",
                    });
                  },
                },
          });

          /* ── Teks mundur ──────────────────────────────────────────────── */
          film
            .to(
              fades,
              { y: -60, opacity: 0, duration: beat.recede.dur, stagger: 0.02 },
              beat.recede.at,
            )
            .to(
              chars,
              split
                ? { yPercent: -80, opacity: 0, duration: beat.recede.dur, stagger: 0.005 }
                : { y: -52, opacity: 0, duration: beat.recede.dur },
              beat.recede.at,
            );

          /* ── Ranting, bahasa kamera ───────────────────────────────────────
             Bukan sekadar mengecil. Embusan datang, lensa mendorong masuk, lalu
             menarik mundur sambil memiring untuk mengikuti biji yang jatuh. */
          if (isMobile) {
            // Di mobile ranting baru bergerak SETELAH headline pergi, karena ia
            // berada tepat di belakangnya. Permintaan pemilik proyek.
            film
              .to(
                photo,
                {
                  rotation: 1.6,
                  scale: 1.06,
                  opacity: 1,
                  duration: beat.stir.dur,
                  ease: "sine.out",
                },
                beat.stir.at,
              )
              .to(beans, { opacity: 1, duration: beat.stir.dur }, beat.stir.at)
              .to(
                photo,
                {
                  rotation: -4,
                  scale: 0.86,
                  xPercent: 8,
                  yPercent: -10,
                  opacity: 0,
                  duration: 0.34,
                  ease: "power1.in",
                },
                beat.fall.at + 0.12,
              );
          } else {
            film
              .to(
                photo,
                {
                  rotation: 1.2,
                  scale: 1.04,
                  yPercent: 1.5,
                  duration: BEAT.stir.dur,
                  ease: "sine.out",
                },
                BEAT.stir.at,
              )
              .to(
                photo,
                { scale: 1.09, xPercent: -3.5, duration: 0.16, ease: "sine.inOut" },
                0.16,
              )
              .to(
                photo,
                {
                  rotation: -5,
                  scale: 0.82,
                  xPercent: 6,
                  yPercent: -14,
                  opacity: 0,
                  duration: 0.34,
                  ease: "power1.in",
                },
                0.32,
              );
          }

          /* ── Lepas lalu terbang ───────────────────────────────────────────
             Dua tween dengan easing berbeda pada sumbu berbeda menghasilkan
             lengkung jatuh yang benar: sumbu tegak memakai percepatan, sumbu
             datar melayang lalu menepi. */
          beans.forEach((bean, i) => {
            const start = beat.fall.at + i * 0.04;
            const span = landAt - start;
            film
              .to(bean, { y: () => flight[i].dy, duration: span, ease: "power1.in" }, start)
              .to(bean, { x: () => flight[i].dx, duration: span, ease: "power2.inOut" }, start)
              .to(
                bean,
                { rotation: i % 2 === 0 ? 26 : -22, duration: span, ease: "sine.out" },
                start,
              );
          });

          /* ── Sangrai ──────────────────────────────────────────────────────
             Dua sprite foto disilang-pudarkan, bukan lagi satu bentuk SVG yang
             di-morph. Bentuk buah yang bulat dan biji yang ramping sudah ada di
             dalam gambarnya masing-masing, begitu juga celah dan sorotnya, jadi
             MorphSVG dan DrawSVG tidak lagi dibutuhkan sama sekali. */
          /* Biji sangrai masuk dengan jeda seperempat durasi, bukan bersamaan.
             Kalau keduanya menyeberang di titik yang sama, buah merah dan biji
             cokelat sempat sama-sama separuh terlihat dan hasilnya keruh. Dengan
             jeda ini buahnya sudah hampir hilang saat bijinya mulai muncul, dan
             perpindahannya terbaca bersih. */
          film
            .to(
              pods,
              { opacity: 0, scale: 0.84, duration: beat.roast.dur * 0.55, stagger: 0.03 },
              beat.roast.at,
            )
            .to(
              roasts,
              { opacity: 1, scale: 1, duration: beat.roast.dur * 0.55, stagger: 0.03 },
              beat.roast.at + beat.roast.dur * 0.25,
            );

          /* ── Mendarat jadi kartu ──────────────────────────────────────── */
          film
            .to(chainHead, { y: 0, opacity: 1, duration: 0.12 }, landAt - 0.1)
            .to(
              cards,
              { y: 0, opacity: 1, duration: 0.12, ease: "power2.out", stagger: 0.035 },
              landAt,
            )
            .to(beans, { opacity: 0, scale: 0.62, duration: 0.09, stagger: 0.035 }, landAt);

          /* ── Garis rantai, hal terakhir yang terjadi ──────────────────── */
          /* Permintaan pemilik proyek: garis muncul dari kanan ke kiri SAAT
             ANIMASI SELESAI. `beat.cards` berakhir tepat di 1.0 pada timeline
             yang dinormalkan, di kedua peta beat, jadi 0.92 sampai 1.0 adalah
             satu-satunya jendela yang benar-benar berada setelah kartunya
             mendarat dan tetap di dalam film.

             `data-drawn` yang menghidupkan beam berjalan, dan ia dipasang hanya
             setelah garisnya utuh. Digulir balik, atributnya ikut dicabut,
             sehingga tidak pernah ada cahaya berjalan di atas garis yang belum
             ada. */
          if (chainRule) {
            film.to(
              chainRule,
              {
                scaleX: 1,
                duration: 0.08,
                onComplete: () => chainRule.setAttribute("data-drawn", ""),
                onReverseComplete: () => chainRule.removeAttribute("data-drawn"),
              },
              0.92,
            );
          }

          return cleanup;
        },
      );

      return () => {
        idleWatcher.disconnect();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <div className="film-stage" ref={root}>
      {children}
    </div>
  );
}
