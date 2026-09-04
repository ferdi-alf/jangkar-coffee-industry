/**
 * Nama negara untuk daftar peringkat dan tooltip peta pengunjung.
 *
 * TABEL TITIK TENGAH NEGARA SUDAH DIHAPUS dari berkas ini. Ia dulu dipakai
 * menaruh penanda lingkaran di peta Leaflet. Petanya kini choropleth berbasis
 * SVG yang mewarnai bentuk negaranya sendiri, jadi koordinat tidak dibutuhkan
 * lagi sama sekali dan menyimpannya hanya menyisakan 160 baris data mati.
 *
 * Nama berkasnya sengaja tidak diubah supaya diff-nya tetap terbaca sebagai
 * satu perubahan; isinya yang menyusut, bukan tempatnya yang berpindah.
 */

/**
 * `Intl.DisplayNames` dipakai alih-alih tabel nama sendiri, karena peramban
 * sudah membawa daftar lengkapnya dan terjemahannya ikut diperbarui bersama
 * peramban. Panel berbahasa Indonesia, jadi daftar peringkat bertuliskan
 * "Indonesia" jauh lebih terbaca daripada "ID".
 *
 * Ada peramban lama yang tidak punya API ini, dan ada kode yang tidak dikenali
 * daftar mana pun. Keduanya jatuh ke kode aslinya, bukan ke string kosong.
 */
export function countryName(code: string | null): string {
  if (!code) return "Tidak diketahui";
  try {
    return new Intl.DisplayNames(["id"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
