# Capten Care — Integrated Management System

Aplikasi operasional homecare & home visit **PT. Nusantara Insan Sakti**: laporan harian perawat A–H, identifikasi pasien, penugasan & rotasi, absensi, home visit dengan informed consent, pipeline CS, sales order & invoice ber-QR, kasus & komplain, rekrutmen, penggajian, petty cash, keuangan, dokumen bertanda tangan PIN + QR, CRM kontak, notifikasi WhatsApp (Fonnte) & email, serta menu **Analitik Penjualan**.

- **Frontend** (repository ini): HTML/CSS/JavaScript murni, tanpa build, di-host di GitHub Pages.
- **Backend**: Google Apps Script sebagai REST API JSON (`doGet`/`doPost`), Google Sheets sebagai database, Google Drive untuk berkas. Berkas `.gs` diberikan terpisah — **tidak** disimpan di repository ini.

## Mencoba

```bash
python3 -m http.server 8080     # lalu buka http://localhost:8080
```

`js/config.js` bawaan memakai `USE_MOCK: true` (mode demo): seluruh logika berjalan di peramban dengan data contoh. Di halaman masuk, klik **Akses Cepat Mode Demo** lalu pilih peran (form terisi & langsung masuk); ganti peran kapan saja lewat dropdown **Peran** di bilah atas.

## Yang baru di v2.1

Versi ini **mengubah backend**: tempel ulang 5 berkas `.gs` (Kode, Logika_Inti, Logika_Modul, Logika_Bisnis, Logika_Dokumen), jalankan `migrasiSkema()`, lalu deploy versi baru. Langkah lengkap ada di PANDUAN-INSTALASI.md bagian "Memperbarui dari v2.0.0 ke v2.1.0".

- **Slideshow halaman masuk:** gambar latar di panel kiri bergantian di balik kartu. Admin mengatur dari **Pengaturan → Halaman masuk**: unggah hingga 8 gambar, urutan, judul & teks keterangan, lama tampil (3–30 detik), efek (pudar, geser, zoom perlahan), kecepatan transisi, kegelapan lapisan, urutan acak, indikator, dan jeda saat kursor di panel.
- **Kartu "LIVE · Penugasan aktif" interaktif:** berisi 1–5 skenario contoh yang ditulis Admin (pasien, perawat, tanda vital, linimasa, progres), selalu berlabel data fiktif. Pengunjung bisa mengganti skenario (panah, titik, geser, atau tombol ← →), klik tanda vital untuk melihat grafik tren, klik kejadian di linimasa untuk melihat detail dan progres, serta melihat efek miring 3D mengikuti kursor. Admin memilih bagian yang tampil dan kecepatan putar otomatis.
- **Ganti logo & favicon** dari **Pengaturan → Tampilan & branding**, lengkap dengan panduan di layar. Logo dipakai di sidebar, halaman masuk, halaman publik, kop surat PDF, dan invoice.
- **Foto profil staf (opsional)** untuk semua peran: setiap staf mengunggah, mengganti, atau menghapus fotonya sendiri di **Profil Saya** (dipotong persegi 256×256 px otomatis). Foto tampil di sidebar, Direktori Perawat, penugasan, daftar akun, dan daftar staf lain. Admin dapat menghapus foto yang tidak sesuai dari **Akun & peran**. Foto hanya terlihat oleh pengguna yang sudah masuk.

## Yang baru di v2.0 (tampilan)

Hanya frontend yang berubah — berkas `.gs` backend **tidak perlu** ditempel ulang (logika `js/logika-*.js` tetap identik dengan server).

- **Halaman masuk baru:** panel kiri grid arsitektural + kartu status pasien ilustratif (data fiktif statis), judul "Portal Operasional Terpadu", satu tombol **Akses Cepat Mode Demo** pengganti 10 kotak akun demo.
- **Dashboard peran operasional** (Admin, Keperawatan, Operasional, CS, Home Visit): kalender bulanan jadi hero dengan chip kategori (Home Care, Home Visit Medis, Rotasi Perawat, Kasus/SLA), 3 pill statistik, panel *Jadwal hari ini* & *Perlu tindakan mendesak*. Peran lain memakai dashboard ringkas berbasis pill.
- **Gauge "Kepatuhan Operasional"** di bilah atas (laporan tepat waktu 30 hari; perawat melihat angka pribadinya bulan berjalan). Banner kuning mode demo dihapus — status ada di chip DEMO/LIVE/TERPUTUS.
- **Tiga pola menu:** Jadwal & Penugasan → kalender + timeline (Gantt); Laporan Harian, Home Visit, Identifikasi → tampilan split (antrean kiri, lembar kerja per bagian kanan; checklist tindakan, consent digital, foto); menu data → kartu ringkas + laci detail (bisa ditukar ke Tabel). Pipeline CS & Rekrutmen tetap kanban; Pengaturan tetap bertab.
- **Gerak:** transisi halaman `fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)`, hanya transform/opacity; hover naik 2 px, tekan 0,98; pill menu aktif cyan solid. Grafik garis memakai kurva halus + gradien.

## Menyambungkan ke server

Isi `GAS_API_URL` dengan URL Web App `/exec`, ubah `USE_MOCK` menjadi `false`. Langkah lengkap ada di **[PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md)**.

## Struktur

```
index.html              kerangka aplikasi + layar pemuat
manifest.webmanifest    PWA (ikon, warna tema)
sw.js                   cache aset statis (API & data pasien tidak pernah di-cache)
css/style.css           design system "Clinical Precision" (token warna, tipografi, komponen)
js/config.js            satu-satunya berkas yang perlu diubah (URL /exec)
js/core.js              API (live/demo), cache SWR, sesi, router, shell, komponen UI, grafik SVG
js/masuk.js             halaman masuk: slideshow latar + kartu ilustrasi interaktif
js/hal-*.js             halaman: utama, layanan, data, bisnis, sistem & halaman publik
js/logika-*.js          aturan bisnis — identik dengan backend (dipakai mode demo)
js/data-demo.js, demo.js  data contoh & adaptor penyimpanan peramban
js/ikon.js              sprite ikon Lucide lokal (ISC)
js/vendor/qrcode.min.js pembuat QR
assets/                 logo, ikon PWA, ilustrasi orisinal, contoh gambar slideshow (assets/login/)
```

## Keamanan

- Tidak ada token, sandi, atau API key di repository ini. Rahasia hanya di Script Properties Apps Script.
- Izin menu & data ditegakkan server di setiap permintaan; frontend hanya menampilkan yang diizinkan.
- Akun demo hanya untuk mode demo/uji coba. Nonaktifkan sebelum go-live.

Ikon: [Lucide](https://lucide.dev) (ISC). Font: Plus Jakarta Sans & Inter (Google Fonts, OFL).
