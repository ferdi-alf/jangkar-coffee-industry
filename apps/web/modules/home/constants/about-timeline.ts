/**
 * Tonggak seksi About: RENTANG TAHUN dan KUNCI saja.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ [PLACEHOLDER] RENTANG TAHUN DI BAWAH INI KARANGAN, BUKAN CATATAN SEJARAH.│
 * │                                                                          │
 * │ Tahun berdirinya Jangkar, kapan roastery mulai, kapan armada jalan, dan  │
 * │ kapan pembelian langsung ke petani Semendo dimulai TIDAK tercatat di     │
 * │ dokumen mana pun yang dimiliki proyek ini. Pemilik proyek meminta        │
 * │ timeline bersumbu tahun dan menyatakan seluruh teks boleh dikarang dulu  │
 * │ karena akan disunting dari panel admin.                                  │
 * │                                                                          │
 * │ Karena itu angkanya dikunci DI SATU BERKAS INI, bukan disebar ke kamus,  │
 * │ supaya menggantinya cukup menyentuh satu tempat. Ganti sebelum situs     │
 * │ ini dianggap final.                                                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Judul, subjudul, dan deskripsinya TIDAK di sini, ia hidup di kamus karena itu yang
 * diterjemahkan. Pemisahan yang sama sudah dipakai menu-data.ts: data dan nama
 * diri di konstanta, kalimat di kamus.
 *
 * Urutannya sengaja bukan urutan rantai produksi. Rantai mengalir dari kebun ke
 * gelas, sedangkan sejarah perusahaan bergerak sebaliknya: mulai dari menyangrai
 * dan menjual, lalu merangkak mundur sampai memegang kebunnya sendiri. Itu yang
 * membuat kata "Industry" pada namanya jadi masuk akal, dan itu juga sebabnya
 * seksi ini duduk sesudah seksi Rantai, bukan menggantikannya.
 */
export const ABOUT_MILESTONES = [
  { key: "sangrai", from: "2016", to: "2017" },
  { key: "gerai", from: "2018", to: "2019" },
  { key: "keliling", from: "2020", to: "2021" },
  { key: "kemasan", from: "2022", to: "2023" },
  /* `to: null` berarti rentangnya masih berjalan. Kata penutupnya datang dari
     kamus (`about.present`), bukan dari sini, karena "kini" dan "now" adalah
     TEKS yang diterjemahkan sedangkan angka tahun tidak. */
  { key: "kebun", from: "2024", to: null },
] as const;

export type MilestoneKey = (typeof ABOUT_MILESTONES)[number]["key"];
