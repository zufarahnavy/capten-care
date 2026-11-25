# Panduan Instalasi — Capten Care Integrated Management System v2.1.0

PT. Nusantara Insan Sakti · Homecare & Home Visit

Aplikasi terdiri dari dua bagian yang dipasang terpisah:

| Bagian | Isi | Dipasang di |
| --- | --- | --- |
| **Backend** (REST API) | 11 berkas `.gs` + `appsscript.json` | Google Apps Script, dengan Google Sheets sebagai database dan Google Drive untuk berkas |
| **Frontend** (tampilan) | Isi ZIP `capten-care-frontend.zip` (`index.html`, `css/`, `js/`, `assets/`, …) | GitHub Pages (gratis, HTTPS) |

Frontend memanggil backend lewat alamat Web App `/exec`. Tanpa backend, frontend tetap bisa dicoba dalam **mode demo** (data contoh di peramban).

> **Penting — rahasia.** Token Fonnte, kunci sesi, dan ID spreadsheet/folder hanya disimpan di **Script Properties** Apps Script. Jangan pernah menaruhnya di kode, di Google Sheets, di `js/config.js`, di README, atau di GitHub.

---

## 0. Coba dulu tanpa server (mode demo)

1. Ekstrak ZIP frontend ke sebuah folder, misalnya `capten-care`.
2. Buka terminal di folder itu, jalankan `python3 -m http.server 8080` (atau `npx serve`), lalu buka `http://localhost:8080`.
3. Di halaman masuk klik **Akses Cepat Mode Demo**, pilih peran — form terisi dan Anda langsung masuk. Gunakan dropdown **Peran** di bilah atas untuk berpindah peran — menu langsung berubah.

| Akun demo | Sandi / PIN | Peran |
| --- | --- | --- |
| `direksi` | `capten2026` | Admin / Direksi |
| `koordinator` | `246810` | Keperawatan |
| `perawat` | `246810` | Perawat HC |
| `homevisit` / `perawathv` | `246810` | Koordinator HV / Perawat HV |
| `cs` | `246810` | Customer Service |
| `hrd` | `246810` | HRD |
| `operasional` | `246810` | Operasional |
| `keuangan` / `pettycash` | `capten2026` | Keuangan / Admin Petty Cash |

Data demo dibuat ulang otomatis mengikuti tanggal hari ini; klik chip **DEMO** di bilah atas → **Reset data demo** untuk mengembalikannya ke awal.

---

## 1. Pasang backend (Google Apps Script)

Gunakan **satu akun Google** yang sama untuk Apps Script, spreadsheet, dan folder Drive.

1. Buka <https://script.google.com> → **New project**. Beri nama `Capten Care API`.
2. **Project Settings** (ikon roda gigi) → centang **Show "appsscript.json" manifest file in editor**.
3. Kembali ke **Editor**. Buka `appsscript.json`, ganti seluruh isinya dengan berkas `appsscript.json` yang diberikan.
4. Hapus isi `Code.gs` bawaan, lalu buat berkas berikut (**+ → Script**) dengan nama **persis** seperti ini dan tempel isinya masing-masing:

   | Berkas | Fungsi |
   | --- | --- |
   | `Kode.gs` | Pintu masuk API (doGet/doPost), database Sheets, cache, pemicu |
   | `Setup.gs` | Setup, migrasi skema, data demo, pemulihan akses admin |
   | `Notifikasi.gs` | WhatsApp (Fonnte) & email: antrean, batch, deteksi nomor WA |
   | `DokumenEngine.gs` | Render template Google Docs → PDF ber-QR |
   | `Migrasi.gs` | Membaca Google Sheets lama untuk impor (hanya baca) |
   | `QrLib.gs` | Pembuat QR code mandiri |
   | `Logika_Inti.gs`, `Logika_Modul.gs`, `Logika_Bisnis.gs`, `Logika_Dokumen.gs` | Aturan bisnis (sama persis dengan yang dipakai mode demo) |
   | `DataDemo.gs` | Data contoh — hanya dipakai bila Anda menjalankan `isiDataDemo()` |

   Urutan berkas di editor tidak berpengaruh.
5. Klik **Save** (ikon disket).
6. Pilih fungsi **`setupAppEnvironment`** di dropdown → **Run** → izinkan akses (Review permissions → pilih akun → Advanced → Go to … → Allow).
7. Buka **Execution log**. Anda akan melihat:
   - alamat folder Drive `Capten Care` dan spreadsheet `Database — Capten Care …`,
   - **AKUN ADMIN PERTAMA** — `Username: admin` dan sandi acak. **Catat sekarang**, sandi hanya tampil sekali dan wajib diganti saat login pertama.
8. **Deploy → New deployment** → ikon roda gigi → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** → salin **Web app URL** yang berakhiran `/exec`.
9. Uji: buka URL `/exec` itu di peramban. Harus tampil JSON `{"ok":true,"data":{"aplikasi":"Capten Care …","siap":true,…}}`.

`setupAppEnvironment()` aman dijalankan ulang: tab/kolom yang belum ada ditambahkan, data dan rahasia yang sudah ada tidak ditimpa.

### Data demo di server (opsional, hanya untuk uji coba)

Jalankan `isiDataDemo()` **hanya** pada spreadsheet uji coba yang masih kosong. Fungsi ini menolak berjalan bila sudah ada data pasien. Akun demo di server wajib mengganti PIN saat login pertama. **Sebelum go-live, nonaktifkan semua akun demo** (Pengaturan → Akun & peran) atau gunakan proyek Apps Script terpisah untuk produksi.

### Script Properties yang dipakai

| Kunci | Diisi oleh | Keterangan |
| --- | --- | --- |
| `SPREADSHEET_ID`, `DRIVE_ROOT_FOLDER_ID`, `FOLDER_*` | `setupAppEnvironment()` | Lokasi database & folder berkas |
| `SESSION_SECRET` | `setupAppEnvironment()` | Kunci tanda tangan token sesi. Jangan dihapus |
| `FONNTE_TOKEN` | Anda, lewat aplikasi (bagian 5) | Token WhatsApp Fonnte |
| `KEEP_WARM`, `BACKUP_TERAKHIR`, `ANTRIAN_*` | Sistem | Status internal |

Lihat di **Project Settings → Script Properties**. Siapa pun yang bisa **mengedit** proyek Apps Script dapat melihat nilai ini — batasi editor proyek hanya untuk orang tepercaya.

---

## 2. Sambungkan frontend ke backend

Buka `js/config.js` di folder frontend dan ubah tiga baris:

```js
window.CONFIG = {
  GAS_API_URL: "https://script.google.com/macros/s/AKfycb.../exec",   // tempel URL /exec Anda
  USE_MOCK: false,          // false = pakai server
  FALLBACK_MOCK: false,     // produksi: false (tidak beralih ke demo bila server tidak terjangkau)
  DEMO_LATENSI_MS: 140
};
```

URL `/exec` **bukan rahasia** — keamanan dijaga token sesi dan pemeriksaan peran di server. Jangan menambahkan token atau sandi apa pun ke berkas ini.

---

## 3. Unggah frontend ke GitHub Pages

### 3.1 Sekali saja

1. Pasang Git: <https://git-scm.com/downloads> (Windows: semua pilihan bawaan). Cek di terminal: `git --version`.
2. Buat akun di <https://github.com>.
3. Buat repository baru: **New repository** → nama `capten-care` → **Public** → **jangan** centang "Add a README" → **Create repository**.
4. Buat token akses (pengganti sandi saat `git push`): **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token** → centang **repo** → salin token (hanya tampil sekali).

### 3.2 Push pertama

Folder yang di-`git init` adalah **folder tempat `index.html` berada langsung** (hasil ekstrak ZIP), bukan folder di atasnya.

```bash
cd path/ke/capten-care          # di dalamnya langsung ada index.html, css/, js/, assets/
git init
git add .
git commit -m "Capten Care v2.0.0"
git branch -M main
git remote add origin https://github.com/NAMA-ANDA/capten-care.git
git push -u origin main
```

Saat diminta: **Username** = nama akun GitHub, **Password** = token dari langkah 3.1.4.

### 3.3 Aktifkan Pages

Repository → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/(root)** → **Save**. Tunggu 1–2 menit; alamat situs tampil di atas, misalnya `https://nama-anda.github.io/capten-care/`.

Bila muncul 404: pastikan `index.html` ada di akar repository (bukan di dalam subfolder), lalu tunggu beberapa menit.

### 3.4 Memperbarui tampilan nanti

```bash
cd path/ke/capten-care
git add .
git commit -m "Perbarui tampilan"
git push
```

Setiap rilis, naikkan angka versi `?v=2.1.0` di `index.html` dan `VERSI` di `sw.js` agar peramban pengguna mengambil berkas terbaru. Lalu tekan Ctrl+Shift+R.

---

## 4. Pengaturan pertama setelah online

Masuk sebagai `admin` dengan sandi dari log, lalu ganti sandi. Kemudian buka **Pengaturan**:

1. **Tampilan & branding** → tombol **Pakai alamat halaman ini** pada "Alamat aplikasi" → **Simpan tampilan**. Alamat ini dicetak di QR dokumen & invoice; tanpa ini QR tidak dapat dipindai.
2. **Profil perusahaan** → alamat, nomor izin, rekening, dan **penandatangan per jenis dokumen**.
3. **Gaji & remunerasi** → periksa angka usulan lalu **Simpan versi baru**. Sebelum pengaturan gaji pernah disimpan, hasil hitung gaji bernilai 0 dengan catatan "Lengkapi pengaturan".
4. **Paket layanan**, **SLA & shift**, **Master daftar**, **Penomoran** (lanjutkan nomor terakhir surat/invoice lama).
5. **Akun & peran** → buat akun setiap staf. PIN awal tampil **sekali** di layar; sampaikan langsung dan wajib diganti saat login pertama. Akun perawat wajib ditautkan ke data perawat.
6. **Modul** → aktifkan modul opsional yang dipakai (Penilaian Klien, Kunjungan Pengawasan, Mess & Antar-Jemput, Penalti Kontrak).
7. **Tampilan & branding** → unggah **Logo aplikasi** dan **Favicon** milik perusahaan (bagian 12).
8. **Halaman masuk** → ganti gambar contoh slideshow dengan foto suasana layanan Anda dan sesuaikan skenario kartu (bagian 11).

---

## 5. WhatsApp (Fonnte) & email

1. Daftar di <https://fonnte.com>, tambahkan device, lalu pindai QR dengan WhatsApp nomor kantor.
2. Salin **token** device.
3. Di aplikasi: **WhatsApp & Notifikasi → Pengaturan & matriks → Token Fonnte** → tempel → **Simpan**. Token disimpan di Script Properties dan hanya tampil tersamar (`ABCD••••••xyz`).
4. Klik **Status perangkat** (harus `connect`), lalu isi nomor Anda di kolom uji → **Kirim uji**.
5. Atur saklar utama WA/Email dan **matriks per kejadian** (kanal + isi pesan), lalu **Simpan pengaturan**.

Pesan dikirim lewat antrean oleh pemicu tiap 1 menit, jadi tombol di aplikasi tetap instan. **Blast** dikirim per batch 10/20/50 dengan jeda acak (mis. `3-8` detik) untuk mengurangi risiko nomor diblokir; kontak opt-out tidak pernah ikut blast. Email memakai kuota Gmail akun pemilik (±100/hari untuk akun Gmail biasa, ±1.500/hari untuk Google Workspace).

---

## 6. Template dokumen

Semua jenis dokumen (Surat Tugas, SPK, SPKWT, Kontrak Layanan, Informed Consent, Surat Peringatan, Invoice) sudah punya template bawaan. Admin dapat mengubahnya di **Dokumen & Surat → Editor template**:

- **Editor bawaan**: susun blok (kop, judul, paragraf, daftar, tabel, tanda tangan), pratinjau langsung, simpan sebagai versi Draf, lalu **Aktifkan**.
- **Google Docs milik Anda**: tulis surat di Google Docs dengan placeholder `{{NOMOR}}`, `{{nama_perawat}}`, `{{QR}}`, dan lainnya, tempel ID dokumen (bagian panjang di URL), simpan, aktifkan. Saat terbit, server menyalin template (master tidak disentuh), mengisi placeholder, menyisipkan QR, dan menyimpan PDF di folder `Dokumen_PDF`.

Dokumen yang sudah terbit tidak berubah walaupun template diganti. Nomor, kode verifikasi, dan hash dikunci server saat penandatangan memasukkan PIN.

---

## 7. Memindahkan data dari spreadsheet lama (migrasi)

Spreadsheet lama **hanya dibaca**, tidak pernah diubah. Data dicocokkan berdasarkan **nama kolom**, bukan urutan kolom.

1. **Pengaturan → Impor data** → pilih jenis (Pasien, Perawat, Sales order/invoice lama, Petty cash).
2. Tempel CSV, pilih berkas CSV, **atau** tempel URL/ID Google Sheets lama (harus milik akun Google yang sama) → **Baca** → pilih tab.
3. **Pindai (dry-run)** → periksa jumlah *ditambah / diperbarui / dilewati* dan catatannya.
4. **Jalankan impor**. Menjalankan ulang aman — data yang sama tidak menjadi ganda.

**Cutover (pindah ke aplikasi baru):**

1. Impor semua data → cek pasien, perawat, invoice, dan saldo petty cash.
2. Uji dengan 1–2 akun staf selama beberapa hari.
3. Tepat sebelum pindah: **jalankan impor sekali lagi** untuk menangkap data yang masuk ke sistem lama selama masa transisi.
4. Umumkan alamat baru ke staf (bisa lewat Blast WhatsApp segmen Perawat) dan berhenti memakai spreadsheet lama.

---

## 8. Keamanan & pemeliharaan

| Kebutuhan | Langkah |
| --- | --- |
| Lupa sandi admin | Jalankan `resetAksesAdmin()` di editor Apps Script → sandi baru tampil sekali di log |
| Curiga ada token sesi bocor | Jalankan `rotasiSecretSesi()` → semua pengguna harus login ulang |
| Ganti token Fonnte | WhatsApp & Notifikasi → Token Fonnte → tempel token baru → Simpan |
| Staf keluar | Pengaturan → Akun & peran → ⋯ → Keluarkan dari semua perangkat, lalu Arsipkan |
| Backup | Otomatis tiap Minggu 02.00 (salinan spreadsheet); manual: Pengaturan → Sistem & backup → Backup sekarang |
| Jejak perubahan | Menu **Log Aktivitas** (hanya Admin) mencatat nilai lama & baru |

Data pasien, perawat, kasus, SO, invoice, pembayaran, dan laporan tidak dapat dihapus permanen — hanya diarsipkan.

### Pemicu terjadwal & kuota

`setupAppEnvironment()` memasang 5 pemicu: `pemicuAntrean` (tiap 1 menit, mengirim WA/email dan menjaga cache tetap hangat), `pemicuPengingat` (15 menit), `pemicuSla` (1 jam), `pemicuHarian` (06.00), `pemicuBackup` (Minggu 02.00). Akun Gmail biasa punya kuota waktu pemicu ±90 menit/hari; bila mendekati batas, jalankan `matikanKeepWarm()` (antrean tetap diproses, hanya pemanasan cache yang berhenti). `nyalakanKeepWarm()` untuk menyalakan lagi. `cekPerforma()` menampilkan status sistem di log.

---

## 9. Memperbarui ke versi berikutnya

1. **Backend:** tempel berkas `.gs` versi baru → Save → jalankan `migrasiSkema()` (menambah tab/kolom baru tanpa mengubah data) → **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Jangan membuat *New deployment*, karena URL `/exec` akan berubah.
2. **Frontend:** salin berkas baru ke folder repository (jangan timpa `js/config.js` Anda), naikkan `?v=` dan `VERSI` di `sw.js`, lalu `git add . && git commit -m "v1.x" && git push`.

---

## 10. Kendala umum

| Gejala | Penyebab & solusi |
| --- | --- |
| Chip merah "TERPUTUS" di bilah atas | URL `/exec` salah atau deployment belum "Anyone". Buka URL `/exec` langsung di peramban untuk mengecek |
| "Server belum disiapkan" | `setupAppEnvironment()` belum dijalankan |
| Login berhasil tapi data lama tidak berubah setelah update backend | Deploy versi baru lewat **Manage deployments**, lalu jalankan `bersihkanCache()` |
| QR dokumen membuka alamat salah | Pengaturan → Tampilan → Alamat aplikasi → Pakai alamat halaman ini → Simpan |
| WA tidak terkirim | Cek Status perangkat Fonnte (`connect`), saklar WA aktif, dan kanal WA di matriks kejadian; lihat tab **Antrean & riwayat** → kolom respons penyedia |
| Halaman GitHub Pages 404 | `index.html` harus di akar repository; tunggu 1–2 menit setelah mengaktifkan Pages |
| Tampilan lama masih muncul | Naikkan `?v=` & `VERSI` di `sw.js`, push, lalu Ctrl+Shift+R |
| `git push` meminta sandi lalu gagal | Gunakan Personal Access Token, bukan sandi akun GitHub |
| Foto profil gagal disimpan, atau hilang setelah halaman dimuat ulang | Backend belum v2.1, atau `migrasiSkema()` belum dijalankan sehingga kolom `foto_url` di tab Users belum ada |
| Gambar slideshow atau logo tidak muncul | Gambar harus diunggah lewat Pengaturan (tersimpan di folder Drive `Aset_Brand`). Berkas yang dipindah keluar dari folder itu tidak dilayani demi keamanan; unggah ulang |
| Favicon di tab sudah berganti, tapi ikon di layar HP belum | Ikon instal (PWA) diambil dari berkas di repositori, bukan dari Pengaturan (bagian 12.2) |

---

## 11. Halaman masuk: slideshow & kartu interaktif

Panel kiri halaman masuk berisi **slideshow gambar** di latar belakang dan **kartu "LIVE · Penugasan aktif"** yang melayang di atasnya. Semua diatur Admin di **Pengaturan → Halaman masuk**, dengan pratinjau langsung di kanan sebelum disimpan.

**Slideshow**

1. Klik **Tambah gambar**, pilih 1 atau beberapa gambar sekaligus (maksimal 8 gambar).
2. Isi **judul** dan **teks keterangan** bila perlu (tampil di kiri bawah). Atur urutan dengan tombol panah, hapus dengan ikon tempat sampah.
3. Atur **Tampil per gambar** (3–30 detik), **Efek transisi** (pudar, geser, atau zoom perlahan), **Kecepatan transisi** (0,6–2,2 detik), dan **Kegelapan lapisan** (30–90%, agar kartu dan teks tetap terbaca).
4. Opsi: urutan acak, indikator gambar, judul & keterangan, jeda saat kursor di panel.
5. Klik **Simpan halaman masuk**. Perubahan berlaku seketika.

Panduan gambar:

| Hal | Ketentuan |
| --- | --- |
| Format | JPG, PNG, atau WebP |
| Ukuran | Mendatar (landscape), disarankan 1600×1100 px atau lebih. Dikompres otomatis di peramban (sisi terpanjang 1.600 px, JPG) |
| Isi | Foto suasana layanan, tim, atau kantor. **Jangan** memakai wajah pasien atau dokumen medis, karena halaman masuk terbuka untuk publik. Pastikan perusahaan berhak memakai foto tersebut |
| Komposisi | Kartu menutupi bagian tengah gambar; letakkan bagian penting di tepi |
| Penyimpanan | Folder Drive `Aset_Brand`. Menghapus gambar dari slideshow tidak menghapus berkasnya di Drive |

**Kartu "LIVE · Penugasan aktif"**

- Berisi 1–5 **skenario contoh** yang ditulis Admin: label, nama pasien, keterangan, status, perawat, tanda vital (maks. 4, beserta riwayat tren dipisah titik koma, misalnya `136/88; 131/84; 128/82`), linimasa (maks. 5 kejadian, masing-masing dengan detail dan nilai progres), serta progres laporan.
- Kartu **selalu berlabel "Pratinjau ilustrasi · data fiktif"**. Jangan isi dengan data pasien asli.
- Admin memilih bagian yang tampil (perawat, tanda vital, linimasa, progres), label atas kartu, putar otomatis (mati atau tiap 5–30 detik), dan efek miring 3D.
- Interaksi pengunjung: ganti skenario dengan panah, titik, geser layar sentuh, atau tombol ← → di keyboard; klik tanda vital untuk grafik tren; klik kejadian linimasa untuk detail dan progres; kartu miring mengikuti kursor. Putar otomatis berhenti selama kartu disentuh atau diarahkan kursor.
- Efek miring dan animasi otomatis dimatikan bila perangkat meminta gerak dikurangi.
- Di layar HP (≤ 860 px) panel kiri disembunyikan; slideshow dan kartu hanya tampil di tablet dan desktop.

---

## 12. Logo, favicon & ikon aplikasi

### 12.1 Dari aplikasi (disarankan)

1. Masuk sebagai Admin → **Pengaturan → Tampilan & branding** → kartu **Identitas aplikasi**.
2. Klik kotak **Logo aplikasi**, pilih berkas. Klik kotak **Favicon**, pilih berkas.
3. Periksa pratinjau (favicon langsung berganti di tab peramban), lalu klik **Simpan tampilan**.
4. Untuk kembali ke logo bawaan Capten Care: klik **Bawaan** di atas kotaknya, lalu **Simpan tampilan**.

| | Logo aplikasi | Favicon |
| --- | --- | --- |
| Format | PNG berlatar transparan atau SVG (JPG/WebP juga diterima) | PNG atau SVG |
| Bentuk & ukuran | Persegi, minimal 256×256 px | Persegi, 64–512 px, bentuk sederhana agar terbaca di 16 px |
| Diolah otomatis | Diperkecil ke maks. 512 px | Dipotong persegi dari tengah, 192 px PNG |
| Batas | SVG maks. ±100 KB; tanpa skrip (SVG berisi skrip ditolak) | sama |
| Dipakai di | Sidebar, halaman masuk, halaman publik (lowongan & verifikasi), kop surat PDF, invoice | Tab peramban |

Gambar disimpan di folder Drive `Aset_Brand` dan disajikan oleh server; tidak perlu membagikan folder itu ke publik.

### 12.2 Berkas di repositori (ikon instal HP & tampilan awal)

Beberapa ikon dibaca peramban **sebelum** aplikasi memuat pengaturan, jadi tetap diambil dari berkas di repositori GitHub:

| Berkas | Ukuran | Dipakai untuk |
| --- | --- | --- |
| `assets/icons/favicon.svg` | SVG persegi | Favicon sekejap sebelum pengaturan termuat, dan bookmark |
| `assets/icons/icon-192.png`, `icon-512.png` | 192×192 dan 512×512 px PNG | Ikon saat aplikasi diinstal ke layar HP / desktop (PWA) |
| `assets/icons/maskable-192.png`, `maskable-512.png` | 192×192 dan 512×512 px PNG, latar penuh (tidak transparan), logo di 80% bagian tengah | Ikon PWA di Android yang dipotong bulat/kotak membulat |
| `assets/logo.svg` | SVG persegi | Logo cadangan bila logo dari Pengaturan belum termuat |

Langkah:

1. Siapkan berkas pengganti dengan **nama dan format yang sama** (SVG tetap SVG, PNG tetap PNG). Jika favicon Anda hanya ada dalam PNG, simpan sebagai `assets/icons/favicon.png` lalu ubah baris favicon di `index.html` menjadi `<link rel="icon" href="assets/icons/favicon.png" type="image/png">`.
2. Timpa berkas lama di folder repository.
3. Naikkan versi: `?v=2.1.0` di `index.html` (misalnya menjadi `?v=2.1.1`) dan `VERSI` di `sw.js` (misalnya `cc-2.1.1`).
4. `git add . && git commit -m "Ganti ikon" && git push`, lalu tekan Ctrl+Shift+R.
5. Ikon PWA yang sudah terpasang di HP baru berganti setelah aplikasi dihapus dari layar utama lalu dipasang ulang (perilaku Android/iOS).
6. Opsional: ubah `name`, `short_name`, dan `theme_color` di `manifest.webmanifest` bila nama atau warna brand berubah.

---

## 13. Foto profil staf

Setiap staf di semua peran dapat memasang foto profil. Sifatnya **opsional**: tanpa foto, avatar memakai inisial nama.

**Untuk staf (Profil Saya):**

1. Klik nama Anda di kiri bawah → **Profil, foto & PIN** (halaman Profil Saya).
2. Klik **Unggah foto** (atau **Ganti foto**) dan pilih gambar. Di HP, galeri atau kamera bisa dipakai.
3. Foto langsung tampil. Untuk kembali ke inisial, klik **Hapus**.

Panduan foto (juga tersedia di layar, tautan **Panduan foto profil**):

| Hal | Ketentuan |
| --- | --- |
| Format | JPG, PNG, atau WebP, maksimal 8 MB |
| Diolah otomatis | Dipotong persegi dari bagian tengah, diperkecil ke 256×256 px JPG sebelum dikirim. Letakkan wajah di tengah |
| Foto yang baik | Wajah sendiri, tampak depan, terang, latar polos, tanpa kacamata hitam atau masker |
| Dilarang | Foto pasien, keluarga pasien, logo, atau gambar lain |
| Terlihat oleh | Hanya pengguna yang sudah masuk: sidebar, Direktori Perawat, penugasan, daftar akun, dan daftar staf lain. Tidak tampil di halaman masuk, formulir publik, invoice, maupun dokumen PDF |
| Penyimpanan | Folder Drive privat `Foto_Profil`. Foto lama otomatis dihapus saat diganti atau dihapus. Foto di perangkat dibersihkan saat keluar |

**Untuk Admin:** foto yang tidak sesuai dapat dihapus dari **Pengaturan → Akun & peran → ⋯ → Hapus foto profil** (alasan wajib, tercatat di Log Aktivitas). Staf tetap bisa mengunggah foto baru. Admin tidak dapat mengunggah foto atas nama staf lain.

---

## Memperbarui dari v1.0.0 ke v2.0.0

v2.0 hanya mengubah tampilan (frontend). **Backend Apps Script tidak perlu diubah** — tidak ada `.gs` baru, tidak perlu `migrasiSkema()` maupun deployment baru.

1. Salin isi ZIP v2.0 ke folder repository **kecuali `js/config.js`** (pertahankan URL `/exec` dan `USE_MOCK: false` milik Anda).
2. `git add . && git commit -m "v2.0.0" && git push`.
3. Buka aplikasi lalu tekan Ctrl+Shift+R. Versi di kaki halaman harus tertulis **v2.0.0**.

## Memperbarui dari v2.0.0 ke v2.1.0

v2.1 **mengubah backend**. Perbarui backend dulu, baru frontend.

1. **Backend:** di editor Apps Script, timpa isi 5 berkas ini dengan versi v2.1: `Kode.gs`, `Logika_Inti.gs`, `Logika_Modul.gs`, `Logika_Bisnis.gs`, `Logika_Dokumen.gs`. Berkas lain (`Setup.gs`, `DataDemo.gs`, `Notifikasi.gs`, `Migrasi.gs`, `DokumenEngine.gs`, `QrLib.gs`, `appsscript.json`) tidak berubah.
2. **Save**, lalu jalankan `migrasiSkema()`. Fungsi ini menambah kolom `foto_url` di tab Users tanpa mengubah data lama.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** Jangan membuat *New deployment*, karena URL `/exec` akan berubah.
4. **Frontend:** salin isi ZIP v2.1 ke folder repository **kecuali `js/config.js`**, lalu `git add . && git commit -m "v2.1.0" && git push`.
5. Buka aplikasi lalu tekan Ctrl+Shift+R. Versi di kaki halaman harus tertulis **v2.1.0**.
6. Atur logo, favicon, dan halaman masuk (bagian 11 dan 12).

Folder Drive `Foto_Profil` dibuat otomatis saat foto pertama diunggah. Tidak ada Script Properties baru.

## 14. Hasil uji sebelum serah terima

- **Logika bisnis (Node):** seluruh aksi API lulus, termasuk RBAC, modul aktif/nonaktif, penggajian, invoice, impor dry-run.
- **Simulator Apps Script:** 55 eksekusi (setup, data demo, login semua peran, baca/tulis, TTD dokumen, verifikasi publik, antrean WA, pemicu) — lulus; token tidak pernah bocor ke respons maupun ke Sheets; tidak ada kunci (lock) yang tertinggal.
- **Peramban (Chromium):** 158 halaman pada 10 peran di layar 1440 px dan 390 px — 0 galat JavaScript, 0 ikon hilang, rata-rata pindah menu 95 ms; 408 tombol diklik otomatis — tidak ada yang mati.
- **Alur end-to-end:** 17/17 lulus (laporan A–H, dokumen ber-QR + PIN + verifikasi, blast per batch, formulir publik pasien & karir, branding tersimpan).

**Uji ulang v2.0.0 (mode demo, Chromium):**

- Semua menu pada 10 peran dibuka di 1440 px, ditambah tampilan 390 px (HP) untuk menu utama: 0 galat JavaScript. Item pertama setiap daftar kartu dibuka dan laci detailnya tampil.
- Alur end-to-end 17/17 lulus:
  - Akses Cepat Mode Demo
  - Laporan A–H: kirim kosong ditolak dengan 25 isian bertanda dan langsung pindah ke bagian bergalat; setelah lengkap, laporan terkirim
  - Home Visit: consent, foto wajib, dan checklist tersimpan di hasil tindakan
  - Kalender: klik tanggal dan filter chip
  - Timeline penugasan membuka laci
  - Transisi `fadeInUp` dan pill menu aktif

**Uji ulang v2.1.0 (mode demo, Chromium, 25 November 2026):**

- 158 halaman pada 10 peran di layar 1440 px, ditambah Profil Saya, Direktori Perawat, Dashboard, Laporan, dan Pengaturan (Halaman masuk, Tampilan & branding, Akun & peran) di layar 390 px: 0 galat JavaScript.
- Alur end-to-end lama 17/17 tetap lulus.
- Fitur baru 36/36 lulus:
  - Halaman masuk: kotak angka publik tidak ada; slideshow berganti otomatis; indikator dan klik titik; ganti skenario lewat panah, titik, dan keyboard; klik tanda vital menampilkan dan menutup grafik tren; klik linimasa menampilkan detail dan menggerakkan progres; kartu miring mengikuti kursor.
  - Admin halaman masuk: unggah gambar slide, ubah lama tampil dan efek, ubah skenario, pratinjau ikut berubah sebelum simpan; setelah disimpan, halaman masuk memakai gambar, efek, dan skenario baru.
  - Logo & favicon: panduan tampil; favicon berganti saat pratinjau; pratinjau warna yang belum disimpan dibatalkan saat pindah halaman; logo sidebar dan halaman masuk berganti setelah simpan; favicon bertahan setelah dimuat ulang.
  - Foto profil: unggah dari Profil Saya, avatar profil dan sidebar berfoto, tombol berganti jadi Ganti foto + Hapus, foto tampil bagi Admin di Direktori Perawat dan Akun & peran, Admin menghapus foto dengan alasan.
- Berkas `.gs` hasil sinkron identik dengan `js/logika-*.js` dan lolos cek sintaks.
