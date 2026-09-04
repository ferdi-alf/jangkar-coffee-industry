"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import type { Dictionary } from "@/i18n/dictionaries/id";
import type { TimelineItem } from "@/modules/home/lib/timeline";

/**
 * Garis waktu About: garis di tengah, kartu berselang kiri dan kanan.
 *
 * BENTUKNYA MENGIKUTI `ScrollTimeline` lightswind yang diberikan pemilik
 * proyek, tapi ditulis ulang di sini, bukan diimpor. Berkas vendornya tidak
 * bisa dipakai apa adanya karena ia tidak punya `"use client"` padahal memakai
 * hooks, dan tiga cacat di bawah ada di dalamnya. Pemilik proyek sudah memberi
 * izin menyesuaikan warna dan gayanya.
 *
 * Yang DIAMBIL dari format itu, karena inilah yang membuatnya khas:
 *   - garis progres yang terisi mengikuti guliran (useScroll, useSpring,
 *     useTransform tinggi 0% ke 100%),
 *   - kepala cahaya yang berjalan di ujung garis progres,
 *   - kartu berselang kiri dan kanan terhadap garis tengah,
 *   - titik penanda di garis yang menyala saat tonggaknya terlewati.
 *
 * Yang DIUBAH, dan alasannya:
 *
 *   1. WARNA. Aslinya menulis cyan, indigo, dan ungu (#22d3ee, #6366f1,
 *      #a855f7) sebagai GAYA SEBARIS, jadi mustahil ditimpa token palet. Di
 *      sini tidak ada satu pun nilai warna. Semuanya token crest lewat CSS,
 *      termasuk yang dianimasikan, sehingga palet tetap satu sumber kebenaran.
 *   2. DUA ANIMASI `repeat: Infinity` DIHAPUS. Aslinya kometnya berdenyut
 *      selamanya dan tiap titik aktif ikut berdenyut. Itu gerak berulang di
 *      bawah lipatan, dilarang amandemen A2 design-system.md. Kepala cahayanya
 *      tetap ada, tapi ia digerakkan GULIRAN: berhenti begitu pengunjung
 *      berhenti, jadi nol pekerjaan saat halaman diam.
 *   3. `useTransform` aslinya dipanggil DI DALAM `events.map()`, hook di dalam
 *      perulangan. Di sini seluruh hook berada di tingkat atas komponen.
 *   4. `viewport: { once: false }` aslinya membuat kartu muncul dan menghilang
 *      berulang tiap dilewati. Di sini `once: true`, sama seperti seluruh seksi
 *      lain yang memakai RevealRoot.
 *
 * DATANYA KINI DARI BASIS DATA, bukan dari konstanta. Induknya yang
 * mengambilnya lewat modules/home/lib/timeline.ts lalu mengoper hasilnya ke
 * sini sebagai prop, jadi komponen ini tetap bisa dirender tanpa tahu dari mana
 * datangnya. Kamus masih dipakai untuk dua hal yang memang teks terjemahan:
 * label pembaca layar dan kata penutup rentang ("kini" atau "now").
 *
 * GERAK DIKURANGI dan TANPA JAVASCRIPT diurus CSS, bukan cabang di JSX.
 * Merender pohon yang berbeda akan memicu ketidakcocokan hidrasi, dan pelajaran
 * mahal di hero sesi ini adalah mengganti pohon saat kemampuan media berubah
 * justru merusak. Jadi pohonnya SELALU sama, dan `!important` di globals.css
 * yang memaku semuanya ke keadaan akhir. Itu satu-satunya kasus di mana CSS
 * mengalahkan gaya sebaris, dan di sinilah gunanya.
 */
export function AboutTimeline({ dict, items }: { dict: Dictionary; items: TimelineItem[] }) {
  const track = useRef<HTMLDivElement>(null);

  /* Mulai terisi saat puncak daftar sudah masuk layar, dan selesai sebelum
     ujungnya benar-benar lewat, supaya tonggak terakhir masih terlihat saat
     garisnya penuh. */
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start 85%", "end 65%"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });
  const fill = useTransform(smooth, [0, 1], ["0%", "100%"]);

  const events = items.map((item) => ({
    ...item,
    /* Rentang dirakit di sini: angkanya dari basis data, kata penutupnya dari
       kamus, karena "kini" dan "now" adalah teks yang diterjemahkan sedangkan
       angka tahun tidak. Tahun akhir yang sama dengan tahun mulai ditulis
       sekali saja, kalau tidak akan terbaca "2016 - 2016". */
    range:
      item.yearEnd === null
        ? `${item.year} - ${dict.about.present}`
        : item.yearEnd === item.year
          ? `${item.year}`
          : `${item.year} - ${item.yearEnd}`,
  }));

  return (
    <div className="tl" ref={track}>
      <div className="tl-rail" aria-hidden="true" />
      <motion.div className="tl-fill" style={{ height: fill }} aria-hidden="true" />
      <motion.div className="tl-head" style={{ top: fill }} aria-hidden="true" />

      <ol className="tl-list" aria-label={dict.about.timelineAria}>
        {events.map((event, index) => (
          <li className="tl-item" key={event.key} data-side={index % 2 === 0 ? "left" : "right"}>
            <motion.span
              className="tl-dot"
              aria-hidden="true"
              initial={{ scale: 0.5, opacity: 0.35 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -40% 0px" }}
              transition={{ duration: 0.42, ease: [0.34, 1.4, 0.64, 1] }}
            />
            <motion.div
              className="tl-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={{ duration: 0.62, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <p className="tl-year">{event.range}</p>
              <h4 className="tl-title">{event.title}</h4>
              {event.subtitle ? <p className="tl-subtitle">{event.subtitle}</p> : null}
              {event.description ? <p className="tl-body">{event.description}</p> : null}
            </motion.div>
          </li>
        ))}
      </ol>
    </div>
  );
}
