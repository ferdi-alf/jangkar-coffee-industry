"use client";

import { useState } from "react";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { CatalogTable } from "@/modules/product/components/CatalogTable";
import { ProductFormDrawer } from "@/modules/product/components/ProductFormDrawer";
import type { ProductDetail } from "@/modules/product/contracts/product";
import { useProductDetail } from "@/modules/product/hooks/useProducts";

/**
 * Produk ecommerce, yaitu barang yang dijual di Shopee dan Tokopedia.
 *
 * Terpisah dari /menu atas permintaan pemilik proyek, dan pemisahannya nyata di
 * basis data lewat `product.is_ecommerce`, bukan sekadar tampilan. Halaman ini
 * membuat produk dengan penanda itu menyala, /menu membuatnya mati, jadi satu
 * produk tidak bisa nyasar ke daftar yang salah karena centang yang keliru.
 *
 * Bedanya dengan form menu hanya dua: ada UNGGAH GAMBAR, dan ada tautan Shopee
 * serta Tokopedia. Keduanya memang hanya berarti di sini, karena kartu Roastery
 * di beranda merender gambar dan tombol tokonya, sedangkan menu outlet tidak.
 */
export default function EcommercePage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const detail = useProductDetail(editing);

  return (
    <AdminShell>
      <CatalogTable
        ecommerce
        emptyLabel="Belum ada produk ecommerce."
        searchPlaceholder="Cari nama produk..."
        addLabel="Tambah produk"
        onAdd={() => setCreating(true)}
        onEdit={setEditing}
      />

      <ProductFormDrawer
        open={creating}
        product={null}
        variant="ecommerce"
        onClose={() => setCreating(false)}
      />
      <ProductFormDrawer
        open={Boolean(editing)}
        product={(detail.data as ProductDetail | undefined) ?? null}
        variant="ecommerce"
        onClose={() => setEditing(null)}
      />
    </AdminShell>
  );
}
