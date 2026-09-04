"use client";

import { useState } from "react";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { CatalogTable } from "@/modules/product/components/CatalogTable";
import { ProductFormDrawer } from "@/modules/product/components/ProductFormDrawer";
import type { ProductDetail } from "@/modules/product/contracts/product";
import { useProductDetail } from "@/modules/product/hooks/useProducts";

/**
 * Menu utama, yaitu daftar yang dipesan di gerai.
 *
 * Menggantikan /management-product. Isinya HANYA produk yang `is_ecommerce`
 * bernilai false, dan barang marketplace punya halamannya sendiri di
 * /ecommerce. Pemisahan itu diminta pemilik proyek dan memang benar: menu
 * outlet dipesan di tempat dan tidak punya gambar maupun tautan toko,
 * sedangkan barang kemasan punya keduanya.
 *
 * /product yang lama, kartu baca-saja itu, sudah dihapus. Ia menampilkan
 * seluruh katalog tanpa memisahkan apa pun, dan setelah setiap tabel punya
 * halamannya sendiri ia hanya jadi salinan ketiga dari data yang sama.
 */
export default function MenuPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const detail = useProductDetail(editing);

  return (
    <AdminShell>
      <CatalogTable
        ecommerce={false}
        emptyLabel="Belum ada item menu."
        searchPlaceholder="Cari judul item menu..."
        addLabel="Tambah item menu"
        onAdd={() => setCreating(true)}
        onEdit={setEditing}
      />

      {/* Kanal `outlet` dinyalakan saat membuat, jadi item baru langsung tampil
          di menu situs tanpa perlu diingat sebagai langkah kedua. Menu keliling
          tetap disusun terpisah di /keliling. */}
      <ProductFormDrawer
        open={creating}
        product={null}
        variant="menu"
        defaultChannels={["outlet"]}
        onClose={() => setCreating(false)}
      />
      <ProductFormDrawer
        open={Boolean(editing)}
        product={(detail.data as ProductDetail | undefined) ?? null}
        variant="menu"
        onClose={() => setEditing(null)}
      />
    </AdminShell>
  );
}
