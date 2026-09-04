/**
 * Kamus bahasa Indonesia, sekaligus SUMBER TIPE untuk seluruh kamus lain.
 *
 * Sengaja tanpa `as const`, supaya string melebar jadi `string` dan kamus
 * Inggris bisa memakai tipe yang sama. Konsekuensi yang diinginkan: kamus lain
 * yang kekurangan satu kunci pun akan MENGGAGALKAN `npm run typecheck`, jadi
 * terjemahan tidak bisa diam-diam tertinggal.
 *
 * Yang TIDAK ada di sini: nama produk, harga, SKU, alamat, dan nama kategori
 * menu. Semuanya nama diri atau data, hidup di modules/home/constants/menu-data.ts,
 * dan menerjemahkannya justru salah.
 */
const id = {
  nav: {
    aria: "Navigasi utama",
    items: {
      industri: "Industri",
      menu: "Menu",
      roastery: "Roastery",
      outlet: "Outlet",
      keliling: "Keliling",
    },
    contact: "Kontak",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    language: "Pilih bahasa",
  },
  hero: {
    eyebrow: "Jangkar Coffee Industry",
    headline: { before: "Kopi yang ", accent: "bergerak", after: " dari kebun ke gelas." },
    lede: "Satu rantai yang kami pegang dari ujung ke ujung: kebun Semendo, roastery Sako, gerai kota, dan armada keliling.",
    cta: "Telusuri rantai",
    stats: {
      price: "Mulai per gelas",
      items: "Item menu",
      stages: "Tahap rantai",
      origin: "Robusta Sumatera",
    },
  },
  chain: {
    eyebrow: "Rantai produksi",
    heading: { line1: "Empat tahap,", line2: "satu tangan" },
    cards: {
      kebun: { title: "Kebun Semendo", body: "Robusta dataran tinggi, dibeli langsung dari petani." },
      roastery: { title: "Roastery Sako", body: "Sangrai batch kecil. Profil dikendalikan sendiri." },
      outlet: { title: "Outlet", body: "Gerai tetap dengan menu penuh setiap hari." },
      keliling: { title: "Keliling", body: "Armada bergerak menjangkau titik-titik kota." },
    },
  },
  about: {
    eyebrow: "Tentang kami",
    heading: { line1: "Kopi dipegang", line2: "dari hulu ke hilir" },
    body: [
      "Jangkar Coffee Industry berdiri di Palembang sebagai industri kopi, bukan kedai yang kebetulan menjual kopi. Yang dikerjakan bukan sekadar menyeduh: biji dibeli dari kebun di Semendo, disangrai di roastery Sako, lalu berpindah ke gerai, ke armada keliling, dan ke kemasan yang bisa dibawa pulang.",
      "Memegang seluruh rantai itu keputusan, bukan kebetulan. Setiap tahap yang diserahkan ke pihak lain adalah satu tahap yang rasanya tidak lagi bisa kami jawab. Selama rantainya ada di tangan sendiri, pertanyaan tentang asal biji, tanggal sangrai, dan cara seduhnya selalu punya jawaban.",
    ],
    present: "kini",
    timelineHeading: "Bagaimana ia terangkai",
    timelineAria: "Garis waktu Jangkar Coffee Industry",
    timeline: {
      sangrai: {
        title: "Sangrai pertama di Sako",
        subtitle: "Roastery Sako",
        body: "Satu mesin kecil, satu profil, dan pesanan yang datang dari mulut ke mulut.",
      },
      gerai: {
        title: "Gerai pertama buka",
        subtitle: "Jln Siaran, Sako",
        body: "Menu penuh setiap hari, dan tempat orang mulai mengenali rasanya.",
      },
      keliling: {
        title: "Armada keliling jalan",
        subtitle: "Jangkar Keliling",
        body: "Kopi yang mendatangi titik kumpul kota, bukan menunggu didatangi.",
      },
      kemasan: {
        title: "Kopi masuk kemasan",
        subtitle: "Shopee dan Tokopedia",
        body: "Biji dan bubuk yang bisa dibawa pulang, lalu menyusul ke marketplace.",
      },
      kebun: {
        title: "Sampai ke kebun Semendo",
        subtitle: "Semendo, Muara Enim",
        body: "Pembelian langsung ke petani, dan rantainya akhirnya tertutup penuh.",
      },
    },
  },
  menu: {
    eyebrow: "Menu outlet",
    heading: { line1: "Seluruhnya,", line2: "apa adanya" },
    lede: "Daftar lengkap yang tergantung di HQ Sako. Harga yang sama berlaku di armada keliling untuk item yang tersedia di sana.",
    soldOut: "Habis",
    notes: ["Upgrade ke Oatside +4k", "Gratis extra shot"],
  },
  roastery: {
    eyebrow: "Roastery",
    heading: { line1: "Kopi yang", line2: "dibawa pulang" },
    marketplace: "Ketiganya dijual di Shopee dan Tokopedia.",
    buy: {
      /* Dipakai sebagai aria-label tombol, digabung nama marketplace dan nama
         produk, jadi pembaca layar mendengar tujuan yang lengkap dan bukan tiga
         tautan yang bunyinya sama persis. */
      at: "Beli di",
      /* Muncul saat tautan tokonya belum diisi dari panel admin. Keadaan itu
         TIDAK boleh dibawa warna saja, dan tombol yang diredupkan hanya membawa
         warna, jadi keterangan ini yang membawa maknanya. */
      unavailable: "Tautan toko belum tersedia.",
    },
    heritage: {
      title: "Kopi Bubuk Semendo, Cap Jangkar 999",
      body: "Lambang lama yang tetap kami bawa di kemasan bubuk. Ia hidup di produk, bukan di seluruh halaman.",
    },
  },
  outlet: {
    eyebrow: "Outlet",
    heading: "Titik tetap",
    chip: "Headquarters",
    directions: "Buka di Google Maps",
    mapLabel: "Peta lokasi HQ Sako",
    mapPending: "Titik pada peta masih perkiraan. Tombol arah memakai alamat lengkap.",
  },
  keliling: {
    eyebrow: "Jangkar Keliling",
    heading: { line1: "Ngopi nikmat,", line2: "kembalikan semangat" },
    lede: "Armada bergerak membawa menu inti ke titik-titik kota. Harga sama dengan outlet.",
    menuHeading: "Menu armada",
    favourite: "Favorit",
    today: { label: "Di mana hari ini", value: "Jadwal titik henti menyusul" },
    /* Cadangan, ditimpa medan gambar di /content. */
    logo: "/brand/keliling-logo.webp",
    logoAlt: "Logo Jangkar Keliling",
  },
  origin: {
    eyebrow: "Asal biji",
    heading: "Semendo, Sumatera Selatan",
    body: "Robusta dataran tinggi dari kebun di Kabupaten Muara Enim. Dibeli langsung dari petani, disangrai di Sako, Palembang.",
    /* Jalur statis ini adalah CADANGAN. Nilai sungguhannya datang dari medan
       gambar di /content pada panel, lihat i18n/site-dictionary.ts. */
    image: "/rantai/kebun-semendo.webp",
    imageAlt: "Kebun kopi berteras di lereng Semendo, kabut pagi menggantung di lembah, seorang petani berjalan di antara barisan tanaman.",
  },
  contact: {
    eyebrow: "Kontak",
    heading: "Mari bicara kopi",
    lede: "Pesanan, grosir, reseller, dan kolaborasi acara, langsung ke tim Sako.",
    cta: "Chat WhatsApp",
    form: {
      heading: "Kirim pesan",
      lede: "Untuk pesanan besar, grosir, atau kolaborasi yang butuh penjelasan panjang.",
      name: "Nama",
      namePlaceholder: "Nama Anda",
      email: "Email",
      emailPlaceholder: "nama@email.com",
      message: "Pesan",
      messagePlaceholder: "Ceritakan yang Anda butuhkan",
      submit: "Kirim pesan",
      sending: "Mengirim",
      errors: {
        nameRequired: "Nama wajib diisi.",
        nameTooLong: "Nama maksimal 80 karakter.",
        emailRequired: "Email wajib diisi.",
        emailInvalid: "Format email belum benar.",
        messageRequired: "Pesan wajib diisi.",
        messageTooShort: "Pesan minimal 10 karakter.",
        messageTooLong: "Pesan maksimal 2000 karakter.",
      },
      success: "Pesan terkirim. Tim Sako akan membalas lewat email.",
      failure: "Pesan gagal terkirim. Coba lagi, atau hubungi kami lewat WhatsApp.",
      rateLimited: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
      invalidNotice: "Ada yang perlu diperbaiki:",
    },
  },
  footer: {
    tagline: "Industri kopi Palembang, dari kebun Semendo sampai armada keliling.",
    explore: "Jelajahi",
    places: "Tempat",
    contact: "Kontak",
    hq: "Roastery dan HQ",
    farm: "Kebun",
    farmValue: "Semendo, Muara Enim, Sumatera Selatan",
    shop: "Kopi kemasan Jangkar dijual di Shopee dan Tokopedia.",
    shopNote: "Tautan tokonya menyusul.",
  },
  marquee: ["Semendo", "Roastery", "Outlet", "Keliling", "Halal Indonesia", "Small batch"],
  meta: {
    title: "Jangkar Coffee Industry, Kopi Robusta Semendo, Palembang",
    description:
      "Industri kopi Palembang. Robusta dari kebun Semendo, disangrai sendiri di roastery Sako, disajikan di outlet dan armada keliling.",
  },
};

export default id;
export type Dictionary = typeof id;
