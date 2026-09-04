/**
 * Angka dashboard.
 *
 * SEMUANYA DATA YANG BENAR-BENAR ADA DI SISTEM INI. Tidak ada pendapatan, tidak
 * ada trafik, tidak ada konversi. Jangkar tidak menjual lewat situs ini, jadi
 * tidak ada satu pun transaksi yang tercatat di basis data, dan menggambar
 * grafik penjualan berarti menggambar angka karangan.
 */
export interface StatsOverview {
  counts: {
    products: number;
    publishedProducts: number;
    ecommerceProducts: number;
    soldOutProducts: number;
    categories: number;
    outlets: number;
    contactNew: number;
    contactTotal: number;
  };
  /**
   * Kunjungan situs per hari, 30 hari terakhir.
   *
   * MENGGANTIKAN grafik pesan kontak masuk, atas permintaan pemilik proyek.
   * `visits` adalah jumlah muat halaman, `uniques` jumlah hash pengunjung yang
   * berbeda pada hari itu. Keduanya dikirim karena keduanya menjawab pertanyaan
   * berbeda dan tidak ada satu pun yang bisa dihitung dari yang lain.
   *
   * BATAS YANG HARUS DIINGAT SIAPA PUN YANG MEMBACA ANGKA INI: ia menghitung
   * MUAT HALAMAN, bukan manusia. Bot yang menyamar sebagai peramban tetap ikut
   * terhitung, dan kunjungan dari lokal tidak punya negara sama sekali.
   */
  visitsByDay: { date: string; visits: number; uniques: number }[];
  /**
   * Kunjungan per negara, 30 hari terakhir, urut terbanyak.
   * `country` null berarti negaranya tidak diketahui, yang normal di lokal.
   */
  visitsByCountry: { country: string | null; visits: number; uniques: number }[];
  /**
   * Kelengkapan terjemahan. Ini metrik yang benar-benar berguna di sini:
   * situsnya dua bahasa, dan medan yang tertinggal di satu bahasa adalah lubang
   * yang tidak terlihat sampai ada pengunjung yang menemukannya.
   */
  translation: { entity: string; total: number; id: number; en: number }[];
  /**
   * Jumlah item menu per kanal.
   *
   * MENGGANTIKAN cakupan jadwal keliling, yang dicabut karena situs ini tidak
   * pernah menampilkan jadwal maupun jumlah armada. Seksi Keliling hanya
   * menampilkan menunya, jadi angka yang berguna adalah berapa item yang
   * benar-benar dibawa tiap kanal.
   */
  channelCounts: { channel: string; count: number }[];
  recentAudit: { action: string; entity: string; summary: string | null; at: string; actor: string | null }[];
}
