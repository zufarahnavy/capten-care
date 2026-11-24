# Panduan Instalasi — Capten Care Integrated Management System v1.0.0

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
3. Klik salah satu **akun demo** di halaman masuk. Gunakan dropdown **Peran** di bilah atas untuk berpindah peran — menu langsung berubah.

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

Data demo dibuat ulang otomatis mengikuti tanggal hari ini; tombol **Reset data demo** di banner kuning mengembalikannya ke awal.

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
git commit -m "Capten Care v1.0.0"
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

Setiap rilis, naikkan angka versi `?v=1.0.0` di `index.html` dan `VERSI` di `sw.js` agar peramban pengguna mengambil berkas terbaru. Lalu tekan Ctrl+Shift+R.

---

## 4. Pengaturan pertama setelah online

Masuk sebagai `admin` dengan sandi dari log, lalu ganti sandi. Kemudian buka **Pengaturan**:

1. **Tampilan & branding** → tombol **Pakai alamat halaman ini** pada "Alamat aplikasi" → **Simpan tampilan**. Alamat ini dicetak di QR dokumen & invoice; tanpa ini QR tidak dapat dipindai.
2. **Profil perusahaan** → alamat, nomor izin, rekening, dan **penandatangan per jenis dokumen**.
3. **Gaji & remunerasi** → periksa angka usulan lalu **Simpan versi baru**. Sebelum pengaturan gaji pernah disimpan, hasil hitung gaji bernilai 0 dengan catatan "Lengkapi pengaturan".
4. **Paket layanan**, **SLA & shift**, **Master daftar**, **Penomoran** (lanjutkan nomor terakhir surat/invoice lama).
5. **Akun & peran** → buat akun setiap staf. PIN awal tampil **sekali** di layar; sampaikan langsung dan wajib diganti saat login pertama. Akun perawat wajib ditautkan ke data perawat.
6. **Modul** → aktifkan modul opsional yang dipakai (Penilaian Klien, Kunjungan Pengawasan, Mess & Antar-Jemput, Penalti Kontrak).

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
| Banner merah "Server tidak terjangkau" | URL `/exec` salah atau deployment belum "Anyone". Buka URL `/exec` langsung di peramban untuk mengecek |
| "Server belum disiapkan" | `setupAppEnvironment()` belum dijalankan |
| Login berhasil tapi data lama tidak berubah setelah update backend | Deploy versi baru lewat **Manage deployments**, lalu jalankan `bersihkanCache()` |
| QR dokumen membuka alamat salah | Pengaturan → Tampilan → Alamat aplikasi → Pakai alamat halaman ini → Simpan |
| WA tidak terkirim | Cek Status perangkat Fonnte (`connect`), saklar WA aktif, dan kanal WA di matriks kejadian; lihat tab **Antrean & riwayat** → kolom respons penyedia |
| Halaman GitHub Pages 404 | `index.html` harus di akar repository; tunggu 1–2 menit setelah mengaktifkan Pages |
| Tampilan lama masih muncul | Naikkan `?v=` & `VERSI` di `sw.js`, push, lalu Ctrl+Shift+R |
| `git push` meminta sandi lalu gagal | Gunakan Personal Access Token, bukan sandi akun GitHub |

---

## 11. Hasil uji sebelum serah terima

- **Logika bisnis (Node):** seluruh aksi API lulus, termasuk RBAC, modul aktif/nonaktif, penggajian, invoice, impor dry-run.
- **Simulator Apps Script:** 55 eksekusi (setup, data demo, login semua peran, baca/tulis, TTD dokumen, verifikasi publik, antrean WA, pemicu) — lulus; token tidak pernah bocor ke respons maupun ke Sheets; tidak ada kunci (lock) yang tertinggal.
- **Peramban (Chromium):** 158 halaman pada 10 peran di layar 1440 px dan 390 px — 0 galat JavaScript, 0 ikon hilang, rata-rata pindah menu 95 ms; 408 tombol diklik otomatis — tidak ada yang mati.
- **Alur end-to-end:** 17/17 lulus (laporan A–H, dokumen ber-QR + PIN + verifikasi, blast per batch, formulir publik pasien & karir, branding tersimpan).
