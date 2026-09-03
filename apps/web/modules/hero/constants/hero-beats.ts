/**
 * Satu sumber kebenaran untuk hero: aset ranting, geometri biji, dan susunan beat.
 *
 * Dipakai bersama HeroBranchPhoto (yang merender) dan HeroFilm (yang
 * menganimasikan). Mengubah angka di sini mengubah keduanya sekaligus.
 */

/* ── Ranting ───────────────────────────────────────────────────────────────
   Dulu SVG buatan tangan, sekarang foto. Geometri batang, daun, dan buah latar
   ikut hilang bersamanya karena semuanya sudah ada di dalam foto.

   Latar foto #F9F4F0, ground halaman #FBFAF8. Selisihnya di bawah ambang yang
   terlihat mata, jadi foto duduk langsung di atas halaman dan mask fade
   menyatukannya tanpa meninggalkan kotak.                                     */
export const BRANCH_PHOTO = {
  src: "/hero/ranting-kopi.webp",
  width: 1024,
  height: 1536,
} as const;

/* ── Biji, sekarang foto ───────────────────────────────────────────────────
   Dulu SVG buatan tangan dengan gradien radial. Sudah cukup menyatu, tapi tetap
   gambar vektor di atas foto fotoreal.

   Sekarang dua sprite hasil satu render yang sama, dipotong dari
   jangkar-coffee-reference/biji-master.png. Lahir dari satu gambar, jadi arah
   cahaya, suhu warna, dan skalanya dijamin sepadan. Itu syarat mutlak karena
   keduanya disilang-pudarkan di tengah jatuh, dan perbedaan sekecil apa pun
   akan terbaca sebagai kedipan.

   Keduanya ditaruh di kanvas persegi 860px yang SAMA sebelum diperkecil ke
   192px, jadi proporsi buah yang lebih bulat dan biji yang lebih ramping tetap
   terjaga tanpa salah satunya melompat ukuran saat bertukar.

   Efek samping yang bagus: celah biji dan sorot spekular kini ada di dalam
   gambarnya, jadi MorphSVG dan DrawSVG tidak lagi dipakai di mana pun dan
   keduanya dicabut dari lib/gsap.ts.                                          */
export const BEAN_SPRITES = {
  ripe: "/hero/buah-matang.webp",
  roasted: "/hero/biji-sangrai.webp",
  /**
   * 88px, dan angka ini hasil pengukuran, bukan pilihan bebas.
   *
   * Sprite sempat 192px dan hasilnya terbaca terlalu tajam, seperti stiker HD
   * yang ditempel di atas foto yang lebih lembut. Terukur sebagai sampel sumber
   * per piksel layar:
   *
   *   lebar         ranting   biji lama   selisih
   *   1440 @1x      1.06      5.33        5.0x
   *   1440 @2x      0.89      4.00        4.5x
   *   360  @3x      0.93      4.27        4.6x
   *
   * Plate-nya sendiri di bawah 1.0, artinya ia memang diperbesar browser dari
   * sumber 1024px dan karena itu terasa lembut. Bijinya di-sampel hampir lima
   * kali lebih rapat, dan ketidaksepadanan itu yang terlihat.
   *
   * Pada layar retina desktop biji menempati 96 piksel perangkat. Supaya ia
   * diperbesar dengan faktor yang sama seperti plate, sumbernya harus
   * 96 x 0.89 = 85px. 88 memberi sedikit napas.
   */
  size: 88,
} as const;

/**
 * Empat biji pahlawan, satu untuk tiap tahap rantai.
 *
 * Posisi dalam persen kotak foto, ditaruh tepat di atas gugus buah pada foto
 * supaya terbaca sebagai bagian dari rantingnya. Elemen ini hidup di DOM, bukan
 * di dalam foto, supaya bisa terbang keluar menuju kartu tanpa terpotong.
 */
export const BEANS = [
  { left: 68.0, top: 17.6, stage: "01" },
  { left: 56.2, top: 30.6, stage: "02" },
  { left: 48.8, top: 45.0, stage: "03" },
  { left: 43.0, top: 57.2, stage: "04" },
] as const;

/* ── Beat ──────────────────────────────────────────────────────────────────
   Timeline dinormalkan ke durasi 1 lalu di-scrub, jadi angka di bawah adalah
   posisi pada timeline itu, bukan detik. Beat sengaja bertumpang tindih:
   buah sudah mulai jatuh sebelum teks selesai mundur.                         */
export const BEAT = {
  stir: { at: 0.0, dur: 0.16 },
  recede: { at: 0.14, dur: 0.16 },
  fall: { at: 0.22, dur: 0.33 },
  roast: { at: 0.4, dur: 0.28 },
  land: { at: 0.62, dur: 0.26 },
  cards: { at: 0.86, dur: 0.14 },
} as const;

/**
 * Peta beat mobile, SENGAJA BERBEDA URUTANNYA dari desktop.
 *
 * Permintaan pemilik proyek: karena ranting berada di belakang headline, saat
 * di-scroll headline diangkat dan dihilangkan LEBIH DULU, baru gerakan ranting
 * masuk. Di desktop ranting sebagian besar berada di kanan headline, jadi ia
 * boleh bergerak duluan. Di mobile ia tepat di belakang teks, dan bergerak
 * duluan berarti bergerak di balik sesuatu yang menutupinya.
 */
export const BEAT_MOBILE = {
  recede: { at: 0.0, dur: 0.18 },
  stir: { at: 0.16, dur: 0.16 },
  fall: { at: 0.3, dur: 0.52 },
  roast: { at: 0.48, dur: 0.24 },
  cards: { at: 0.82, dur: 0.18 },
} as const;
