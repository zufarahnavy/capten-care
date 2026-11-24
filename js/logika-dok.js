/* =====================================================================
 * CAPTEN CARE — MESIN DOKUMEN (BERSAMA: Logika_Dokumen.gs)
 * Template berblok berversi (US-60), placeholder {{...}} ber-pengubah,
 * generator 6 jenis dokumen (US-32), tanda tangan dengan PIN akun,
 * nomor otomatis (US-55), QR + kode verifikasi publik, HTML invoice.
 * Dokumen TERBIT = beku (data, nomor, hash, penandatangan tidak berubah).
 * ===================================================================== */
var CC = (typeof CC !== 'undefined' && CC) || {};
CC.A = CC.A || {};

CC.DOK = {
  ST: { label: 'Surat Tugas', ref: 'penugasan', buat: ['ADM', 'KEP'], ttd: ['ADM', 'KEP'] },
  SPK: { label: 'SPK Perawat (per paket)', ref: 'penugasan', buat: ['ADM', 'KEP'], ttd: ['ADM', 'KEP'] },
  SPKWT: { label: 'Kontrak Karyawan (SPKWT)', ref: 'perawat', buat: ['ADM', 'KEP'], ttd: ['ADM', 'KEP'] },
  KL: { label: 'Kontrak Layanan + Ketentuan', ref: 'so', buat: ['ADM', 'CS'], ttd: ['ADM'] },
  IC: { label: 'Informed Consent', ref: 'hv', buat: ['ADM', 'HV'], ttd: ['ADM', 'HVK'] },
  SP: { label: 'Surat Peringatan / Teguran', ref: 'perawat', buat: ['ADM', 'HRD'], ttd: ['ADM', 'HRD'] }
};
CC.PH_UMUM = ['NOMOR', 'TANGGAL', 'TAHUN', 'BULAN_ROMAWI', 'KOTA', 'PERUSAHAAN', 'BRAND', 'ALAMAT_PERUSAHAAN', 'TELEPON_PERUSAHAAN', 'EMAIL_PERUSAHAAN', 'IZIN', 'TTD_NAMA', 'TTD_JABATAN', 'TTD_WAKTU', 'QR', 'KODE_VERIFIKASI', 'URL_VERIFIKASI'];
CC.PH = {
  ST: ['nama_perawat', 'jabatan_perawat', 'nik_perawat', 'alamat_perawat', 'nama_pasien', 'layanan', 'keterangan_layanan', 'alamat_pasien', 'pic_keluarga', 'no_pic', 'diagnosa', 'tanggal_berangkat', 'tanggal_selesai', 'lama_hari', 'shift', 'peran'],
  SPK: ['nama_perawat', 'jabatan_perawat', 'nik_perawat', 'alamat_perawat', 'nama_pasien', 'alamat_pasien', 'diagnosa', 'paket', 'keterangan_layanan', 'uraian_tugas', 'tanggal_berangkat', 'tanggal_selesai', 'lama_hari', 'gaji_deal', 'fee_harian', 'potongan_libur', 'jatah_libur', 'metode_gaji', 'tarif_lembur'],
  SPKWT: ['nama_perawat', 'nik_perawat', 'tgl_lahir_perawat', 'alamat_perawat', 'jabatan_perawat', 'no_wa_perawat', 'tanggal_mulai', 'tanggal_akhir', 'masa_training_sampai', 'gaji_pokok', 'bank', 'no_rekening', 'masa_resign', 'pengali_penalti'],
  KL: ['nama_pj', 'nik_pj', 'alamat_pj', 'telp_pj', 'relasi_pj', 'nama_pasien', 'tgl_lahir_pasien', 'usia_pasien', 'alamat_pasien', 'diagnosa', 'paket', 'keterangan_layanan', 'biaya_layanan', 'lama_kontrak', 'tanggal_mulai', 'tanggal_selesai', 'biaya_admin', 'tarif_lembur', 'no_invoice'],
  IC: ['nama_pasien', 'usia_pasien', 'alamat_pasien', 'diagnosa', 'jenis_tindakan', 'tanggal_tindakan', 'jam_tindakan', 'nama_perawat_hv', 'consent_oleh', 'consent_relasi'],
  SP: ['nama_perawat', 'jabatan_perawat', 'nik_perawat', 'tingkat_sp', 'pelanggaran', 'tanggal_kejadian', 'berlaku_sampai', 'perintah_perbaikan']
};

/* ---------- Template awal (dapat diubah Admin lewat Editor Template) ---------- */
CC.TPL_AWAL = {
  ST: [
    { t: 'kop' }, { t: 'judul', teks: 'SURAT TUGAS', sub: 'Nomor: {{NOMOR}}' },
    { t: 'p', teks: 'Yang bertanda tangan di bawah ini, {{TTD_JABATAN}} {{PERUSAHAAN}} ({{BRAND}}), dengan ini memberikan tugas kepada:' },
    { t: 'kv', baris: [['Nama', '{{nama_perawat}}'], ['Jabatan', '{{jabatan_perawat}}'], ['Nomor KTP', '{{nik_perawat}}'], ['Alamat', '{{alamat_perawat}}']] },
    { t: 'p', teks: 'Untuk melaksanakan layanan perawatan di rumah pasien dengan rincian sebagai berikut:' },
    { t: 'kv', baris: [['Nama Pasien', '{{nama_pasien}}'], ['Layanan', '{{layanan}} — {{keterangan_layanan}}'], ['Peran', '{{peran}} · Shift {{shift}}'], ['Alamat', '{{alamat_pasien}}'], ['PIC Keluarga', '{{pic_keluarga}} ({{no_pic}})'], ['Diagnosa', '{{diagnosa}}'], ['Tanggal Keberangkatan', '{{tanggal_berangkat|tanggal}}'], ['Masa Tugas', '{{lama_hari}} hari (s.d. {{tanggal_selesai|tanggal}})']] },
    { t: 'p', teks: 'Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab sesuai Standar Operasional Prosedur {{BRAND}}.' },
    { t: 'ttd', kota: '{{KOTA}}, {{TANGGAL|tanggal}}', slot: [{ label: 'Yang Menugaskan', nama: '{{TTD_NAMA}}', jabatan: '{{TTD_JABATAN}}', qr: true }, { label: 'Yang Ditugaskan', nama: '{{nama_perawat}}', jabatan: '{{jabatan_perawat}}' }] }
  ],
  SPK: [
    { t: 'kop' }, { t: 'judul', teks: 'SURAT PERINTAH KERJA (SPK)', sub: 'Nomor: {{NOMOR}} · Paket {{paket}}' },
    { t: 'p', teks: 'Surat Perintah Kerja ini diberikan kepada {{nama_perawat}} ({{jabatan_perawat}}, NIK {{nik_perawat}}) untuk bertugas sebagai perawat pendamping pasien {{nama_pasien}} di {{alamat_pasien}} mulai {{tanggal_berangkat|tanggal}} sampai {{tanggal_selesai|tanggal}} ({{lama_hari}} hari).' },
    { t: 'sub', teks: 'A. Uraian Tugas Perawat — Paket {{paket}}' }, { t: 'p', teks: '{{uraian_tugas}}', pre: true },
    { t: 'sub', teks: 'B. Ketentuan Upah' },
    { t: 'ol', item: ['Gaji yang disepakati sebesar {{gaji_deal|rupiah}} per bulan ({{gaji_deal|terbilang}} rupiah), dihitung dengan metode {{metode_gaji}}.', 'Jatah libur {{jatah_libur}} hari per bulan. Setiap hari libur, baik diberikan keluarga maupun diambil perawat, dipotong {{potongan_libur|rupiah}} per hari.', 'Bila layanan kurang dari satu bulan atau dihentikan sebelum waktunya (termasuk bila pasien meninggal dunia), upah dibayarkan prorata hari kerja yang dijalankan dengan fee harian {{fee_harian|rupiah}}.', 'Bila perawat tetap bertugas di hari liburnya atas persetujuan keluarga dan konfirmasi kantor (lembur), hari tersebut tidak dipotong; klien membayar pengganti uang cuti {{tarif_lembur|rupiah}} per hari.'] },
    { t: 'sub', teks: 'C. Kewajiban' },
    { t: 'ol', item: ['Mengisi Laporan Harian Pasien melalui aplikasi setiap shift sebelum batas waktu.', 'Menjaga kerahasiaan data dan kondisi pasien serta keluarga.', 'Melaporkan segera setiap perubahan kondisi pasien kepada Koordinator Keperawatan.', 'Mengisi Formulir Identifikasi Pasien saat rotasi atau bila diminta Koordinator.'] },
    { t: 'ttd', kota: '{{KOTA}}, {{TANGGAL|tanggal}}', slot: [{ label: 'Pemberi Kerja', nama: '{{TTD_NAMA}}', jabatan: '{{TTD_JABATAN}}', qr: true }, { label: 'Penerima Kerja', nama: '{{nama_perawat}}', jabatan: '{{jabatan_perawat}}' }] }
  ],
  SPKWT: [
    { t: 'kop' }, { t: 'judul', teks: 'PERJANJIAN KERJA WAKTU TERTENTU', sub: 'Nomor: {{NOMOR}}' },
    { t: 'p', teks: 'Pada hari ini, {{TANGGAL|tanggal}}, telah dibuat perjanjian kerja antara {{PERUSAHAAN}} yang diwakili oleh {{TTD_NAMA}} selaku {{TTD_JABATAN}} (Pihak Pertama), dengan:' },
    { t: 'kv', baris: [['Nama', '{{nama_perawat}}'], ['NIK', '{{nik_perawat}}'], ['Tanggal Lahir', '{{tgl_lahir_perawat|tanggal}}'], ['Alamat', '{{alamat_perawat}}'], ['Jabatan', '{{jabatan_perawat}}']] },
    { t: 'p', teks: 'selanjutnya disebut Pihak Kedua. Kedua pihak sepakat atas ketentuan berikut:' },
    { t: 'ol', item: ['Jangka waktu perjanjian mulai {{tanggal_mulai|tanggal}} sampai {{tanggal_akhir|tanggal}}, dengan masa training (percobaan) sampai {{masa_training_sampai|tanggal}}.', 'Pihak Kedua ditempatkan sebagai perawat pada pasien sesuai Surat Tugas dan SPK yang diterbitkan Pihak Pertama.', 'Upah dibayarkan sesuai SPK per penugasan ke rekening {{bank}} {{no_rekening}}.', 'Libur dan lembur mengikuti persetujuan keluarga pasien dan konfirmasi ke kantor.', 'Pengunduran diri wajib diberitahukan paling lambat {{masa_resign}} hari sebelumnya. Pelanggaran ketentuan ini dapat dikenai ganti rugi sesuai kebijakan perusahaan yang berlaku.', 'Hal-hal yang belum diatur akan diselesaikan secara musyawarah.'] },
    { t: 'ttd', kota: '{{KOTA}}, {{TANGGAL|tanggal}}', slot: [{ label: 'Pihak Pertama', nama: '{{TTD_NAMA}}', jabatan: '{{TTD_JABATAN}}', qr: true }, { label: 'Pihak Kedua', nama: '{{nama_perawat}}', jabatan: '{{jabatan_perawat}}' }] }
  ],
  KL: [
    { t: 'kop' }, { t: 'judul', teks: 'SURAT PERJANJIAN PENGGUNAAN JASA PERAWAT', sub: 'Nomor: {{NOMOR}}' },
    { t: 'p', teks: 'Yang bertanda tangan di bawah ini:' },
    { t: 'kv', baris: [['Nama', '{{nama_pj}}'], ['NIK', '{{nik_pj}}'], ['Alamat', '{{alamat_pj}}'], ['Telepon', '{{telp_pj}}'], ['Hubungan dengan pasien', '{{relasi_pj}}']] },
    { t: 'p', teks: 'selaku penanggung jawab pasien {{nama_pasien}} (usia {{usia_pasien}} tahun, diagnosa {{diagnosa}}), selanjutnya disebut Klien, sepakat menggunakan jasa {{BRAND}} dengan ketentuan:' },
    { t: 'kv', baris: [['Paket Layanan', '{{paket}} — {{keterangan_layanan}}'], ['Lama Kontrak', '{{lama_kontrak}} ({{tanggal_mulai|tanggal}} s.d. {{tanggal_selesai|tanggal}})'], ['Biaya Layanan', '{{biaya_layanan|rupiah}}'], ['Biaya Administrasi', '{{biaya_admin|rupiah}} (berlaku 3 bulan)'], ['Pengganti Uang Cuti', '{{tarif_lembur|rupiah}} per hari']] },
    { t: 'sub', teks: 'Ketentuan Layanan' },
    { t: 'ol', item: ['Pembayaran dilakukan sesuai invoice {{no_invoice}} sebelum atau pada jatuh tempo.', 'Perawat berhak atas libur sesuai ketentuan; bila keluarga meminta perawat tetap bertugas di hari libur, Klien membayar pengganti uang cuti.', 'Penggantian perawat (rotasi) dapat dilakukan atas permintaan Klien atau pertimbangan {{BRAND}}.', 'Bila pasien meninggal dunia dalam periode layanan, pembayaran tetap penuh untuk periode berjalan; perawat dapat tetap tinggal paling lama 7 hari.', 'Klien menyetujui penerimaan laporan harian perawat melalui WhatsApp/Email dan pengolahan data pribadi untuk keperluan layanan.'] },
    { t: 'ttd', kota: '{{KOTA}}, {{TANGGAL|tanggal}}', slot: [{ label: 'Atas nama {{PERUSAHAAN}}', nama: '{{TTD_NAMA}}', jabatan: '{{TTD_JABATAN}}', qr: true }, { label: 'Klien', nama: '{{nama_pj}}', jabatan: '{{relasi_pj}} pasien' }] }
  ],
  IC: [
    { t: 'kop' }, { t: 'judul', teks: 'PERSETUJUAN TINDAKAN (INFORMED CONSENT)', sub: 'Nomor: {{NOMOR}}' },
    { t: 'p', teks: 'Saya yang bertanda tangan di bawah ini, {{consent_oleh}} selaku {{consent_relasi}} dari pasien:' },
    { t: 'kv', baris: [['Nama Pasien', '{{nama_pasien}}'], ['Usia', '{{usia_pasien}} tahun'], ['Alamat', '{{alamat_pasien}}'], ['Diagnosa', '{{diagnosa}}']] },
    { t: 'p', teks: 'menyatakan telah menerima penjelasan dari {{nama_perawat_hv}} mengenai tindakan {{jenis_tindakan}} yang akan dilakukan pada {{tanggal_tindakan|tanggal}} pukul {{jam_tindakan}} WIB, termasuk tujuan, prosedur, risiko, dan alternatifnya, serta MENYETUJUI tindakan tersebut dilakukan.' },
    { t: 'ttd', kota: '{{KOTA}}, {{TANGGAL|tanggal}}', slot: [{ label: 'Pemberi Persetujuan', nama: '{{consent_oleh}}', jabatan: '{{consent_relasi}}' }, { label: 'Petugas', nama: '{{TTD_NAMA}}', jabatan: '{{TTD_JABATAN}}', qr: true }] }
  ],
  SP: [
    { t: 'kop' }, { t: 'judul', teks: 'SURAT PERINGATAN {{tingkat_sp}}', sub: 'Nomor: {{NOMOR}}' },
    { t: 'p', teks: 'Ditujukan kepada {{nama_perawat}} ({{jabatan_perawat}}). Berdasarkan evaluasi atas kejadian tanggal {{tanggal_kejadian|tanggal}}, Anda dinyatakan melakukan pelanggaran:' },
    { t: 'p', teks: '{{pelanggaran}}', pre: true },
    { t: 'p', teks: 'Untuk itu Anda diminta melakukan perbaikan berikut:' }, { t: 'p', teks: '{{perintah_perbaikan}}', pre: true },
    { t: 'p', teks: 'Surat peringatan ini berlaku sampai {{berlaku_sampai|tanggal}}. Pengulangan pelanggaran dalam masa berlaku dapat berakibat pada sanksi berikutnya sesuai peraturan perusahaan.' },
    { t: 'ttd', kota: '{{KOTA}}, {{TANGGAL|tanggal}}', slot: [{ label: 'Hormat kami', nama: '{{TTD_NAMA}}', jabatan: '{{TTD_JABATAN}}', qr: true }, { label: 'Diterima oleh', nama: '{{nama_perawat}}', jabatan: '{{jabatan_perawat}}' }] }
  ]
};
CC.HALAMAN_AWAL = { ukuran: 'A4', orientasi: 'potret', margin: 20, font: 'Arial', ukuran_font: 11, spasi: 1.45, watermark_draf: true };

/* ---------- Placeholder: {{kunci|pengubah:arg}} ---------- */
CC.isiPlaceholder = function (teks, d) {
  return String(teks || '').replace(/\{\{\s*([A-Za-z0-9_]+)\s*(?:\|\s*([a-z]+)(?::([^}]*))?)?\s*\}\}/g, function (m, k, mod, arg) {
    var v = d[k]; if (v === undefined || v === null || v === '') v = mod === 'bawaan' ? arg : (d.__pratinjau ? '[' + k + ']' : '');
    if (mod === 'rupiah') return CC.u.rupiah(v); if (mod === 'ribuan') return CC.u.rupiah(v).replace('Rp ', '');
    if (mod === 'terbilang') return CC.u.terbilang(v).toLowerCase(); if (mod === 'tanggal') return CC.u.parse(v) ? CC.u.tglPanjang(v) : v;
    if (mod === 'kapital') return String(v).toUpperCase(); if (mod === 'kecil') return String(v).toLowerCase();
    if (mod === 'judul') return String(v).replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    return v;
  });
};
CC.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
CC.placeholderDipakai = function (blok) { var s = JSON.stringify(blok || []), out = {}, re = /\{\{\s*([A-Za-z0-9_]+)/g, m; while ((m = re.exec(s))) out[m[1]] = 1; return Object.keys(out); };
CC.cekPlaceholder = function (jenis, blok) { var izin = CC.PH_UMUM.concat(CC.PH[jenis] || []); var asing = CC.placeholderDipakai(blok).filter(function (k) { return izin.indexOf(k) === -1; }); if (asing.length) CC.galat('VALIDATION', 'Placeholder tidak dikenal untuk ' + CC.DOK[jenis].label + ': ' + asing.map(function (x) { return '{{' + x + '}}'; }).join(', ') + '. Pilih dari katalog placeholder.'); };

/* ---------- Render blok → HTML siap cetak/PDF ---------- */
CC.renderDokumen = function (blok, hal, d, opsi) {
  opsi = opsi || {}; hal = Object.assign({}, CC.HALAMAN_AWAL, hal || {});
  var prof = CC.set('profil'), br = CC.set('branding'), e = CC.esc, f = function (t) { return e(CC.isiPlaceholder(t, d)); };
  var css = '@page{size:' + (hal.ukuran === 'F4' ? '215mm 330mm' : hal.ukuran === 'Letter' ? 'letter' : 'A4') + (hal.orientasi === 'lanskap' ? ' landscape' : '') + ';margin:' + Number(hal.margin) + 'mm}' +
    '.dok{font-family:' + e(hal.font) + ',Arial,sans-serif;font-size:' + Number(hal.ukuran_font) + 'pt;line-height:' + Number(hal.spasi) + ';color:#111;position:relative}' +
    '.dok .kop{display:flex;align-items:center;gap:14px;border-bottom:2.5px solid #0B132B;padding-bottom:10px;margin-bottom:16px}.dok .kop img{width:56px;height:56px;object-fit:contain}.dok .kop b{font-size:1.25em;letter-spacing:.02em}.dok .kop small{display:block;color:#475569;font-size:.78em;line-height:1.4}' +
    '.dok h1{text-align:center;font-size:1.2em;margin:6px 0 0;letter-spacing:.04em}.dok .sub{text-align:center;color:#334155;margin:2px 0 16px}.dok h3{font-size:1em;margin:14px 0 4px}' +
    '.dok p{margin:0 0 9px;text-align:justify}.dok .pre{white-space:pre-line}.dok table.kv{border-collapse:collapse;margin:4px 0 12px 12px}.dok table.kv td{padding:2px 8px 2px 0;vertical-align:top}.dok table.kv td:first-child{width:170px}' +
    '.dok ol{margin:0 0 10px 18px;padding:0}.dok ol li{margin-bottom:4px;text-align:justify}.dok .ttd{display:flex;justify-content:space-between;gap:24px;margin-top:22px;page-break-inside:avoid}.dok .ttd>div{flex:1;text-align:center}.dok .ttd .ruang{height:74px;display:flex;align-items:center;justify-content:center}.dok .ttd .ruang img{height:70px}.dok .ttd .nama{font-weight:700;text-decoration:underline}.dok .ttd .el{font-size:.72em;color:#475569}' +
    '.dok .wm{position:absolute;top:38%;left:8%;font-size:88px;color:rgba(220,38,38,.08);transform:rotate(-24deg);font-weight:800;letter-spacing:.1em;pointer-events:none}.dok .verif{margin-top:18px;border-top:1px dashed #CBD5E1;padding-top:6px;font-size:.72em;color:#64748B}' +
    '.dok .pb{page-break-after:always}';
  var html = '<div class="dok">' + (opsi.draf && hal.watermark_draf ? '<div class="wm">DRAF</div>' : '');
  function syaratOk(b) { if (!b.jika) return true; var v = String(CC.isiPlaceholder(b.jika, d)); return b.sama !== undefined ? v === String(b.sama) : !!v && v !== '0'; }
  (blok || []).forEach(function (b) {
    if (!syaratOk(b)) return;
    if (b.t === 'kop') html += '<div class="kop">' + (br.logo_url ? '<img src="' + e(br.logo_url) + '" alt="">' : '<svg width="52" height="52" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0B132B"/><path d="M32 14v36M14 32h36" stroke="#00C2FF" stroke-width="9" stroke-linecap="round"/></svg>') + '<div><b>' + e(prof.nama_perusahaan) + '</b><small>' + e(prof.brand) + ' — Layanan Home Care &amp; Home Visit<br>' + e(prof.alamat) + ' · Telp ' + e(prof.telepon) + ' · ' + e(prof.email) + '<br>' + e(prof.izin) + '</small></div></div>';
    else if (b.t === 'judul') html += '<h1>' + f(b.teks) + '</h1>' + (b.sub ? '<div class="sub">' + f(b.sub) + '</div>' : '');
    else if (b.t === 'sub') html += '<h3>' + f(b.teks) + '</h3>';
    else if (b.t === 'p') html += '<p class="' + (b.pre ? 'pre' : '') + '" style="text-align:' + (b.rata || 'justify') + (b.tebal ? ';font-weight:700' : '') + (b.miring ? ';font-style:italic' : '') + '">' + f(b.teks) + '</p>';
    else if (b.t === 'kv') html += '<table class="kv">' + (b.baris || []).map(function (r) { return '<tr><td>' + f(r[0]) + '</td><td>: ' + f(r[1]) + '</td></tr>'; }).join('') + '</table>';
    else if (b.t === 'ol') html += '<ol>' + (b.item || []).map(function (i) { return '<li>' + f(i) + '</li>'; }).join('') + '</ol>';
    else if (b.t === 'tabel') html += '<table class="kv" style="width:100%;border:1px solid #CBD5E1">' + (b.kolom ? '<tr>' + b.kolom.map(function (k) { return '<td style="font-weight:700;border-bottom:1px solid #CBD5E1">' + f(k) + '</td>'; }).join('') + '</tr>' : '') + (b.baris || []).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + f(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    else if (b.t === 'gambar' && b.src) html += '<p style="text-align:' + (b.rata || 'center') + '"><img src="' + e(b.src) + '" style="max-width:' + (b.lebar || 60) + '%"></p>';
    else if (b.t === 'hr') html += '<hr style="border:0;border-top:1px solid #CBD5E1;margin:12px 0">';
    else if (b.t === 'halaman') html += '<div class="pb"></div>';
    else if (b.t === 'ttd') {
      html += '<p style="text-align:right;margin-top:14px">' + f(b.kota || '') + '</p><div class="ttd">' + (b.slot || []).map(function (s) {
        var ruang = s.qr && d.__qr ? '<img src="' + d.__qr + '" alt="QR verifikasi">' : (s.qr && opsi.draf ? '<span class="el">(menunggu tanda tangan elektronik)</span>' : '');
        return '<div><div>' + f(s.label) + '</div><div class="ruang">' + ruang + '</div><div class="nama">' + f(s.nama) + '</div><div>' + f(s.jabatan || '') + '</div>' + (s.qr && d.TTD_WAKTU ? '<div class="el">Ditandatangani elektronik · ' + e(d.TTD_WAKTU) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    }
  });
  if (d.KODE_VERIFIKASI) html += '<div class="verif">Dokumen ini diterbitkan secara elektronik oleh ' + e(prof.nama_perusahaan) + '. Keaslian dapat diperiksa dengan memindai QR atau membuka ' + e(d.URL_VERIFIKASI) + ' — kode verifikasi <b>' + e(d.KODE_VERIFIKASI) + '</b>.</div>';
  html += '</div>';
  return '<style>' + css + '</style>' + html;
};

/* ---------- Data per jenis dokumen (dibekukan saat draf dibuat) ---------- */
CC.dataDokumen = function (ctx, jenis, refId, tambahan) {
  var prof = CC.set('profil'), d = { KOTA: prof.kota, PERUSAHAAN: prof.nama_perusahaan, BRAND: prof.brand, ALAMAT_PERUSAHAAN: prof.alamat, TELEPON_PERUSAHAAN: prof.telepon, EMAIL_PERUSAHAAN: prof.email, IZIN: prof.izin, TANGGAL: CC.u.tgl() };
  var ttd = prof.penandatangan[jenis] || {}; d.TTD_NAMA = ttd.nama || ''; d.TTD_JABATAN = ttd.jabatan || '';
  var g = CC.gajiSetting ? (CC.gajiSetting() || CC.GAJI_USULAN) : {};
  function perawat(id) { var p = CC.cari(String(id).indexOf('PHV') === 0 ? CC.T.PHV : CC.T.PHC, id) || {}; return { nama_perawat: p.nama, jabatan_perawat: p.jabatan, nik_perawat: p.nik, alamat_perawat: p.alamat_ktp || p.domisili, tgl_lahir_perawat: p.tgl_lahir, no_wa_perawat: p.no_wa, bank: p.bank_ewallet, no_rekening: p.no_rekening, tanggal_mulai: p.tanggal_mulai, tanggal_akhir: p.akhir_kontrak, masa_training_sampai: p.masa_training_sampai }; }
  function pasien(id) { var p = CC.cari(CC.T.PASIEN, id) || {}; return { nama_pasien: p.nama_pasien, alamat_pasien: p.alamat, diagnosa: p.diagnosa, tgl_lahir_pasien: p.tgl_lahir, usia_pasien: CC.u.usia(p.tgl_lahir), nama_pj: p.nama_pj, nik_pj: p.nik_pj, alamat_pj: p.alamat_pj, telp_pj: p.no_wa_pj, relasi_pj: p.relasi_pj, pic_keluarga: p.nama_pj + (p.relasi_pj ? ' (' + p.relasi_pj + ')' : ''), no_pic: p.no_wa_pj }; }
  if (jenis === 'ST' || jenis === 'SPK') {
    var t = CC.cari(CC.T.TUGAS, refId); if (!t) CC.galat('NOT_FOUND', 'Penugasan tidak ditemukan.');
    var pk = CC.cari(CC.T.PAKET, t.paket_id) || {};
    Object.assign(d, perawat(t.perawat_id), pasien(t.pasien_id), { layanan: pk.nama_paket, paket: pk.nama_paket, keterangan_layanan: pk.keterangan_layanan, uraian_tugas: pk.uraian_tugas, tanggal_berangkat: t.tanggal_mulai, tanggal_selesai: t.tanggal_akhir, lama_hari: t.lama_hari, shift: String(t.shift).split(',').map(function (s) { return CC.shiftInfo(s).label; }).join(' & '), peran: t.peran, gaji_deal: t.gaji_deal, metode_gaji: t.metode_gaji === 'B' ? 'B (prorata hari kerja)' : 'A (bulanan penuh)', fee_harian: Math.round(CC.u.angka(t.gaji_deal) / (Number(g.pembagi) || 30)), potongan_libur: g.potongan_libur, jatah_libur: t.jatah_libur || g.jatah_libur, tarif_lembur: g.tarif_lembur_klien });
    d.__ref_tab = CC.T.TUGAS;
  } else if (jenis === 'SPKWT' || jenis === 'SP') {
    Object.assign(d, perawat(refId), { masa_resign: g.penalti_masa_resign, pengali_penalti: g.penalti_pengali, gaji_pokok: (CC.semua(CC.T.TUGAS).filter(function (x) { return x.perawat_id === refId && x.status === 'Berjalan'; })[0] || {}).gaji_deal || '' });
    d.__ref_tab = String(refId).indexOf('PHV') === 0 ? CC.T.PHV : CC.T.PHC;
  } else if (jenis === 'KL') {
    var so = CC.cari(CC.T.SO, refId); if (!so) CC.galat('NOT_FOUND', 'Sales Order tidak ditemukan.');
    var pk2 = CC.cari(CC.T.PAKET, so.paket_id) || {}, items = CC.u.json(so.item, []), adm = items.filter(function (i) { return i.jenis_item === 'Administrasi'; })[0];
    Object.assign(d, pasien(so.pasien_id), { paket: pk2.nama_paket, keterangan_layanan: pk2.keterangan_layanan, biaya_layanan: so.total, lama_kontrak: so.kontrak_label, tanggal_mulai: so.tanggal, tanggal_selesai: CC.u.tambahHari(so.tanggal, Number(so.kontrak_hari) - 1), biaya_admin: adm ? adm.subtotal : g.biaya_admin, tarif_lembur: g.tarif_lembur_klien, no_invoice: so.no_invoice });
    d.__ref_tab = CC.T.SO;
  } else if (jenis === 'IC') {
    var h = CC.cari(CC.T.LHV, refId); if (!h) CC.galat('NOT_FOUND', 'Kunjungan HV tidak ditemukan.');
    Object.assign(d, pasien(h.pasien_id), { jenis_tindakan: h.jenis_tindakan, tanggal_tindakan: h.tanggal, jam_tindakan: h.jadwal_jam, nama_perawat_hv: CC.namaPerawat(h.perawat_hv_id), consent_oleh: h.consent_oleh || '', consent_relasi: h.consent_relasi || '' });
    d.__ref_tab = CC.T.LHV;
  }
  Object.keys(tambahan || {}).forEach(function (k) { if ((CC.PH[jenis] || []).indexOf(k) > -1) d[k] = CC.u.bersih(String(tambahan[k])); });
  if (['ADM', 'KEP', 'HRD', 'HVK'].indexOf(ctx.peran) === -1) { d.nik_perawat = CC.u.samarkan(d.nik_perawat); d.no_rekening = CC.u.samarkan(d.no_rekening); }
  if (['ADM', 'CS'].indexOf(ctx.peran) === -1) d.nik_pj = CC.u.samarkan(d.nik_pj);
  return d;
};
CC.templateAktif = function (jenis, varian) {
  var rows = CC.aktifSaja(CC.semua(CC.T.TPL)).filter(function (t) { return t.jenis_dokumen === jenis && t.status === 'Aktif' && (!varian || !t.varian || t.varian === varian); });
  var t = rows.sort(function (a, b) { return Number(b.versi) - Number(a.versi); })[0];
  if (t) return { id: t.id, versi: t.versi, mode: t.mode, blok: CC.u.json(t.isi_blok, []), hal: CC.u.json(t.pengaturan_halaman, {}), google_docs_id: t.google_docs_id, nama: t.nama };
  return null;
};

/* ---------- Template: daftar, simpan versi, aktifkan, pratinjau ---------- */
CC.A['tpl.list'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'KEU'],
  fn: function (ctx) {
    var semua = CC.aktifSaja(CC.semua(CC.T.TPL));
    return Object.keys(CC.DOK).map(function (j) { var v = semua.filter(function (t) { return t.jenis_dokumen === j; }).sort(function (a, b) { return Number(b.versi) - Number(a.versi); }); var akt = v.filter(function (t) { return t.status === 'Aktif'; }); return { jenis: j, label: CC.DOK[j].label, aktif: akt.map(function (t) { return { id: t.id, versi: t.versi, varian: t.varian, mode: t.mode, nama: t.nama }; }), versi: v.map(function (t) { return { id: t.id, versi: t.versi, status: t.status, varian: t.varian, mode: t.mode, diubah: t.diubah_pada, alasan: t.alasan, nama: t.nama }; }), placeholder: CC.PH_UMUM.concat(CC.PH[j]), boleh_buat: CC.boleh(ctx.user, CC.DOK[j].buat) }; });
  }
};
CC.A['tpl.detail'] = { roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'KEU'], fn: function (ctx, p) { var t = p.id ? CC.cari(CC.T.TPL, p.id) : null; if (!t) return { jenis: p.jenis, blok: CC.TPL_AWAL[p.jenis], hal: CC.HALAMAN_AWAL, mode: 'Editor', baru: true, placeholder: CC.PH_UMUM.concat(CC.PH[p.jenis] || []) }; return { id: t.id, jenis: t.jenis_dokumen, varian: t.varian, nama: t.nama, versi: t.versi, status: t.status, mode: t.mode, google_docs_id: t.google_docs_id, blok: CC.u.json(t.isi_blok, []), hal: CC.u.json(t.pengaturan_halaman, {}), placeholder: CC.PH_UMUM.concat(CC.PH[t.jenis_dokumen] || []) }; } };
CC.A['tpl.simpan'] = {
  roles: ['ADM'], tulis: true,
  fn: function (ctx, p) {
    if (!CC.DOK[p.jenis]) CC.galat('VALIDATION', 'Jenis dokumen tidak dikenal.');
    if (p.mode === 'GoogleDocs') { if (!/^[A-Za-z0-9_-]{20,}$/.test(String(p.google_docs_id || ''))) CC.galat('VALIDATION', 'ID Google Docs tidak valid.', { google_docs_id: 'Tempel ID dari URL dokumen' }); }
    else CC.cekPlaceholder(p.jenis, p.blok);
    var ver = CC.semua(CC.T.TPL).filter(function (t) { return t.jenis_dokumen === p.jenis; }).length + 1;
    var r = CC.tambah(ctx, CC.T.TPL, { jenis_dokumen: p.jenis, varian: p.varian || '', nama: p.nama || CC.DOK[p.jenis].label + ' v' + ver, versi: ver, mode: p.mode || 'Editor', isi_blok: JSON.stringify(p.blok || []), pengaturan_halaman: JSON.stringify(p.hal || CC.HALAMAN_AWAL), google_docs_id: p.google_docs_id || '', status: 'Draf', alasan: p.alasan || '' });
    ctx.pesan = 'Versi ' + ver + ' tersimpan sebagai Draf. Pratinjau lalu Aktifkan.'; return { id: r.id, versi: ver };
  }
};
CC.A['tpl.aktifkan'] = {
  roles: ['ADM'], tulis: true,
  fn: function (ctx, p) {
    var t = CC.cari(CC.T.TPL, p.id); if (!t) CC.galat('NOT_FOUND', 'Template tidak ditemukan.');
    var up = CC.semua(CC.T.TPL).filter(function (x) { return x.jenis_dokumen === t.jenis_dokumen && x.status === 'Aktif' && (x.varian || '') === (t.varian || '') && x.id !== t.id; }).map(function (x) { return { id: x.id, status: 'Nonaktif' }; });
    if (up.length) CC.ubahBanyak(ctx, CC.T.TPL, up);
    CC.ubah(ctx, CC.T.TPL, t.id, { status: 'Aktif', berlaku_mulai: CC.u.tgl() }, { aksi: 'AKTIFKAN_TEMPLATE' });
    ctx.pesan = 'Template v' + t.versi + ' aktif. Dokumen yang sudah terbit tidak berubah.'; return true;
  }
};
CC.A['tpl.nonaktif'] = { roles: ['ADM'], tulis: true, fn: function (ctx, p) { var t = CC.cari(CC.T.TPL, p.id); CC.ubah(ctx, CC.T.TPL, t.id, t.status === 'Draf' ? { status: 'Nonaktif', status_arsip: 'Arsip' } : { status: 'Nonaktif' }, { aksi: t.status === 'Draf' ? 'HAPUS_DRAF_TEMPLATE' : 'NONAKTIF_TEMPLATE' }); ctx.pesan = t.status === 'Draf' ? 'Draf template dihapus.' : 'Versi dinonaktifkan.'; return true; } };
CC.A['tpl.pratinjau'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'KEU'],
  fn: function (ctx, p) {
    var blok = p.blok, hal = p.hal;
    if (!blok && p.id) { var t = CC.cari(CC.T.TPL, p.id); blok = CC.u.json(t.isi_blok, []); hal = CC.u.json(t.pengaturan_halaman, {}); }
    if (!blok) blok = CC.TPL_AWAL[p.jenis];
    var d = p.ref_id ? CC.dataDokumen(ctx, p.jenis, p.ref_id, p.isian || {}) : { __pratinjau: true, KOTA: CC.set('profil').kota, PERUSAHAAN: CC.set('profil').nama_perusahaan, BRAND: CC.set('profil').brand, TANGGAL: CC.u.tgl(), TTD_NAMA: (CC.set('profil').penandatangan[p.jenis] || {}).nama, TTD_JABATAN: (CC.set('profil').penandatangan[p.jenis] || {}).jabatan };
    d.NOMOR = d.NOMOR || '(nomor otomatis saat terbit)';
    return { html: CC.renderDokumen(blok, hal, d, { draf: true }) };
  }
};

/* ---------- Penerbitan dokumen: draf → tanda tangan PIN → terbit ---------- */
CC.A['dok.list'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var izinJenis = Object.keys(CC.DOK).filter(function (j) { return ctx.peran === 'ADM' || ctx.peran === 'OPS' || CC.boleh(ctx.user, CC.DOK[j].buat) || CC.boleh(ctx.user, CC.DOK[j].ttd) || (j === 'SPKWT' && ctx.peran === 'HRD'); });
    if (ctx.peran === 'KEU' || ctx.peran === 'CS' || ctx.peran === 'ADM') izinJenis.push('INVOICE');
    return { rows: CC.semua(CC.T.DOK).filter(function (d) { return izinJenis.indexOf(d.jenis_dokumen) > -1 && (!p.jenis || d.jenis_dokumen === p.jenis); }).map(function (d) { return { id: d.id, jenis: d.jenis_dokumen, label: CC.DOK[d.jenis_dokumen] ? CC.DOK[d.jenis_dokumen].label : 'Invoice', nomor: d.nomor, judul: d.judul, status: d.status, ref_id: d.ref_id, kode_verifikasi: d.kode_verifikasi, terbit_pada: d.terbit_pada, dibuat_pada: d.dibuat_pada, berkas_url: d.berkas_url, boleh_ttd: d.status === 'MENUNGGU_TTD' && CC.DOK[d.jenis_dokumen] && CC.boleh(ctx.user, CC.DOK[d.jenis_dokumen].ttd) }; }).reverse(), jenis: Object.keys(CC.DOK).map(function (j) { var t = CC.templateAktif(j); return { kode: j, label: CC.DOK[j].label, ref: CC.DOK[j].ref, boleh_buat: CC.boleh(ctx.user, CC.DOK[j].buat), template: t ? 'v' + t.versi + ' · ' + t.mode : 'Template belum diatur' }; }) };
  }
};
CC.A['dok.buat'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD'], tulis: true,
  fn: function (ctx, p) {
    var J = CC.DOK[p.jenis]; if (!J) CC.galat('VALIDATION', 'Jenis dokumen tidak dikenal.');
    if (!CC.boleh(ctx.user, J.buat)) CC.galat('FORBIDDEN', 'Peran Anda tidak membuat ' + J.label + '.');
    var tpl = CC.templateAktif(p.jenis); if (!tpl) CC.galat('VALIDATION', 'Template ' + J.label + ' belum diatur. Admin dapat mengaktifkannya di Pengaturan → Editor Template Dokumen.');
    if (p.jenis === 'IC') { var h = CC.cari(CC.T.LHV, p.ref_id); if (!h || h.status_consent !== 'Disetujui') CC.galat('VALIDATION', 'Persetujuan tindakan belum diisi pada kunjungan ini.'); }
    var d = CC.dataDokumen(ctx, p.jenis, p.ref_id, p.isian || {});
    var r = CC.tambah(ctx, CC.T.DOK, { jenis_dokumen: p.jenis, template_id: tpl.id, versi: tpl.versi, ref_tab: d.__ref_tab || '', ref_id: p.ref_id, judul: J.label + ' — ' + (d.nama_perawat || d.nama_pasien || d.nama_pj || p.ref_id), data_isian: JSON.stringify(d), status: 'MENUNGGU_TTD', penandatangan: '[]' });
    ctx.pesan = 'Draf ' + J.label + ' dibuat. Menunggu tanda tangan elektronik (PIN) dari pejabat berwenang.';
    return { id: r.id, html: CC.renderDokumen(tpl.blok, tpl.hal, Object.assign({ NOMOR: '(nomor otomatis saat terbit)' }, d), { draf: true }) };
  }
};
CC.A['dok.detail'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var r = CC.cari(CC.T.DOK, p.id); if (!r) CC.galat('NOT_FOUND', 'Dokumen tidak ditemukan.');
    if (r.jenis_dokumen === 'INVOICE') return { id: r.id, jenis: 'INVOICE', nomor: r.nomor, status: r.status, invoice: r.nomor };
    var t = CC.cari(CC.T.TPL, r.template_id) || {}, d = CC.u.json(r.data_isian, {});
    if (r.kode_verifikasi && CC.env.qr) d.__qr = CC.env.qr(d.URL_VERIFIKASI);
    return { id: r.id, jenis: r.jenis_dokumen, nomor: r.nomor, status: r.status, judul: r.judul, penandatangan: CC.u.json(r.penandatangan, []), kode_verifikasi: r.kode_verifikasi, hash: r.hash_dokumen, berkas_url: r.berkas_url, boleh_ttd: r.status === 'MENUNGGU_TTD' && CC.boleh(ctx.user, CC.DOK[r.jenis_dokumen].ttd), html: CC.renderDokumen(CC.u.json(t.isi_blok, CC.TPL_AWAL[r.jenis_dokumen]), CC.u.json(t.pengaturan_halaman, {}), d, { draf: r.status !== 'TERBIT' }) };
  }
};
CC.A['dok.tandatangani'] = {
  roles: ['ADM', 'KEP', 'HVK', 'HRD'], tulis: true,
  fn: function (ctx, p) {
    var r = CC.cari(CC.T.DOK, p.id); if (!r || r.status !== 'MENUNGGU_TTD') CC.galat('VALIDATION', 'Dokumen tidak menunggu tanda tangan.');
    var J = CC.DOK[r.jenis_dokumen]; if (!CC.boleh(ctx.user, J.ttd)) CC.galat('FORBIDDEN', 'Anda bukan pejabat penanda tangan ' + J.label + '.');
    var u = CC.cari(CC.T.USER, ctx.user.id), kunci = CC.u.parse(u.terkunci_sampai);
    if (kunci && kunci > CC.env.now()) CC.galat('LOCKED', 'Penandatanganan dikunci sementara karena PIN salah berulang.');
    if (!CC.env.samaAman(CC.env.hashPin(String(p.pin || ''), u.salt), u.pin_hash)) { var n = Number(u.percobaan_gagal || 0) + 1, patch = { percobaan_gagal: n }; if (n >= 5) { var t = CC.env.now(); t.setMinutes(t.getMinutes() + 15); patch.terkunci_sampai = CC.u.dt(t); patch.percobaan_gagal = 0; } CC.ubah(null, CC.T.USER, u.id, patch, { tanpaLog: true }); CC.galat('VALIDATION', 'PIN tidak cocok.' + (n >= 3 ? ' Sisa percobaan ' + Math.max(0, 5 - n) + '.' : ''), { pin: 'PIN salah' }); }
    CC.ubah(null, CC.T.USER, u.id, { percobaan_gagal: 0 }, { tanpaLog: true });
    var d = CC.u.json(r.data_isian, {}), tgl = CC.u.tgl(), kodeNo = r.jenis_dokumen;
    d.NOMOR = CC.nomorBaru(ctx, kodeNo, tgl); d.TANGGAL = tgl; d.TAHUN = tgl.slice(0, 4); d.BULAN_ROMAWI = CC.u.romawi(tgl.slice(5, 7));
    var prof = CC.set('profil'), pt = prof.penandatangan[kodeNo] || {};
    d.TTD_NAMA = u.nama; d.TTD_JABATAN = (pt.nama === u.nama && pt.jabatan) ? pt.jabatan : (pt.jabatan || CC.PERAN[CC.peranEfektif(u)]); d.TTD_WAKTU = CC.u.dt() + ' WIB';
    d.KODE_VERIFIKASI = CC.kodeAcak(20); d.URL_VERIFIKASI = (CC.set('branding').app_url || '') + '#/v/' + d.KODE_VERIFIKASI;
    var t2 = CC.cari(CC.T.TPL, r.template_id) || {}, blok = CC.u.json(t2.isi_blok, CC.TPL_AWAL[kodeNo]), hal = CC.u.json(t2.pengaturan_halaman, {});
    var kanonik = JSON.stringify(blok) + '|' + JSON.stringify(d);
    var hash = CC.env.hashTeks ? CC.env.hashTeks(kanonik) : '';
    var berkas = '';
    if (t2.mode === 'GoogleDocs' && CC.env.renderDocs) berkas = CC.env.renderDocs(t2.google_docs_id, d, r.jenis_dokumen + '_' + d.NOMOR.replace(/\//g, '-')).url;
    else if (CC.env.pdf) { d.__qr = CC.env.qr ? CC.env.qr(d.URL_VERIFIKASI) : ''; berkas = CC.env.pdf(CC.renderDokumen(blok, hal, d, {}), r.jenis_dokumen + '_' + d.NOMOR.replace(/\//g, '-'), 'Dokumen_PDF/' + r.jenis_dokumen).url; delete d.__qr; }
    var ttd = [{ slot: 1, nama: u.nama, jabatan: d.TTD_JABATAN, waktu: CC.u.dt(), metode: 'PIN', user_id: u.id }];
    CC.ubah(ctx, CC.T.DOK, r.id, { nomor: d.NOMOR, data_isian: JSON.stringify(d), status: 'TERBIT', penandatangan: JSON.stringify(ttd), kode_verifikasi: d.KODE_VERIFIKASI, hash_dokumen: hash, berkas_url: berkas, terbit_pada: CC.u.dt() }, { aksi: 'TERBIT_DOKUMEN', ket: d.NOMOR });
    if (r.ref_tab === CC.T.TUGAS) CC.ubah(ctx, CC.T.TUGAS, r.ref_id, kodeNo === 'ST' ? { no_surat_tugas: d.NOMOR } : { no_spk: d.NOMOR }, { tanpaLog: true });
    ctx.pesan = 'Dokumen terbit: ' + d.NOMOR + '. Nomor dikunci permanen.'; return { nomor: d.NOMOR, kode: d.KODE_VERIFIKASI, berkas_url: berkas };
  }
};
CC.A['dok.tarik'] = {
  roles: ['ADM', 'KEP', 'HRD', 'CS', 'HVK'], tulis: true,
  fn: function (ctx, p) { if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan penarikan wajib.', { alasan: 'Wajib' }); var r = CC.cari(CC.T.DOK, p.id); if (!CC.DOK[r.jenis_dokumen] || !CC.boleh(ctx.user, CC.DOK[r.jenis_dokumen].ttd.concat(CC.DOK[r.jenis_dokumen].buat))) CC.galat('FORBIDDEN', 'Tidak berwenang.'); CC.ubah(ctx, CC.T.DOK, r.id, { status: 'DITARIK', ditarik_alasan: p.alasan }, { aksi: 'TARIK_DOKUMEN', ket: p.alasan }); ctx.pesan = 'Dokumen ditarik; verifikasi publik akan menampilkan status DITARIK.'; return true; }
};
CC.A['publik.verifikasi'] = {
  publik: true,
  fn: function (ctx, p) {
    var kode = String(p.kode || '').trim().toUpperCase(); if (kode.length < 8) return { valid: false, pesan: 'Kode verifikasi tidak valid.' };
    var r = CC.semua(CC.T.DOK).filter(function (d) { return d.kode_verifikasi === kode; })[0];
    if (!r) return { valid: false, pesan: 'Dokumen dengan kode ini tidak terdaftar di sistem ' + CC.set('profil').brand + '.' };
    var d = CC.u.json(r.data_isian, {}), ttd = CC.u.json(r.penandatangan, []);
    return { valid: r.status === 'TERBIT', status: r.status, jenis: CC.DOK[r.jenis_dokumen] ? CC.DOK[r.jenis_dokumen].label : 'Invoice', nomor: r.nomor, judul: r.judul, terbit_pada: r.terbit_pada, penandatangan: ttd.map(function (x) { return { nama: x.nama, jabatan: x.jabatan, waktu: x.waktu }; }), hash: String(r.hash_dokumen || '').slice(0, 16), alasan: r.status === 'DITARIK' ? r.ditarik_alasan : '', perusahaan: CC.set('profil').nama_perusahaan, total: r.jenis_dokumen === 'INVOICE' ? CC.u.rupiah(d.total) : '' };
  }
};

/* ---------- HTML invoice (mengikuti lembar "INVOICE ASLI") ---------- */
CC.htmlInvoice = function (i, opsi) {
  opsi = opsi || {}; var e = CC.esc, rp = CC.u.rupiah, br = CC.set('branding');
  var judul = i.varian === 'DP' ? 'INVOICE DP' : i.varian === 'Infal' ? 'INVOICE INFAL' : 'INVOICE';
  var dp = CC.u.angka(i.so && i.so.dp), url = (br.app_url || '') + '#/v/' + i.kode_verifikasi;
  var qr = opsi.qr || (CC.env.qr ? CC.env.qr(url) : '');
  var css = '.inv{font-family:Inter,Arial,sans-serif;font-size:10.5pt;color:#0F172A;position:relative}.inv .h{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0B132B;padding-bottom:12px}.inv .h b{font-size:15pt}.inv .h small{display:block;color:#64748B;line-height:1.5}.inv h1{font-size:20pt;margin:0;text-align:right;letter-spacing:.04em}.inv .no{text-align:right;color:#0284C7;font-weight:700}' +
    '.inv .g{display:flex;justify-content:space-between;gap:20px;margin:14px 0}.inv .lbl{font-size:8pt;letter-spacing:.08em;text-transform:uppercase;color:#64748B;font-weight:700}.inv table{width:100%;border-collapse:collapse}.inv th{background:#F1F5F9;text-align:left;font-size:8.5pt;letter-spacing:.04em;text-transform:uppercase;color:#475569;padding:7px 8px}.inv td{padding:7px 8px;border-bottom:1px solid #E2E8F0;vertical-align:top}.inv td.r,.inv th.r{text-align:right}' +
    '.inv .tot{width:46%;margin-left:auto;margin-top:8px}.inv .tot td{border:0;padding:4px 8px}.inv .tot tr.b td{font-weight:800;font-size:12pt;border-top:2px solid #0B132B;color:#B91C1C}.inv .f{display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;gap:16px}.inv .rek{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px}.inv .stamp{position:absolute;top:120px;right:30px;border:3px solid;border-radius:10px;padding:4px 14px;font-weight:800;letter-spacing:.1em;transform:rotate(-12deg);opacity:.25;font-size:18pt}';
  var stamp = i.status === 'Lunas' ? '<div class="stamp" style="color:#15803D">LUNAS</div>' : i.status === 'Batal' ? '<div class="stamp" style="color:#B91C1C">BATAL</div>' : i.status === 'Dibayar Sebagian' ? '<div class="stamp" style="color:#B45309">DIBAYAR SEBAGIAN</div>' : '';
  var rek = (i.profil.rekening || []).map(function (r) { return '<div><b>' + e(r.bank) + ' ' + e(r.nomor) + '</b><br>a.n. ' + e(r.atas_nama) + '</div>'; }).join('');
  return '<style>' + css + '</style><div class="inv">' + stamp +
    '<div class="h"><div style="display:flex;gap:12px;align-items:center">' + (br.logo_url ? '<img src="' + e(br.logo_url) + '" style="width:52px;height:52px;object-fit:contain">' : '<svg width="48" height="48" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0B132B"/><path d="M32 14v36M14 32h36" stroke="#00C2FF" stroke-width="9" stroke-linecap="round"/></svg>') + '<div><b>' + e(i.profil.brand) + '</b><small>' + e(i.profil.nama_perusahaan) + '<br>' + e(i.profil.alamat) + '<br>' + e(i.profil.telepon) + ' · ' + e(i.profil.email) + '</small></div></div><div><h1>' + judul + '</h1><div class="no">' + e(i.no_invoice) + '</div><small style="text-align:right;display:block;color:#64748B">Tanggal ' + CC.u.tglPanjang(i.tanggal_terbit) + '<br>Jatuh tempo ' + CC.u.tglPanjang(i.jatuh_tempo) + '</small></div></div>' +
    '<div class="g"><div><div class="lbl">Ditagihkan kepada (Bill To)</div><b>' + e(i.bill_to.nama) + '</b><br>' + e(i.bill_to.alamat || '') + '<br>' + e(i.bill_to.telepon || '') + (i.bill_to.email ? ' · ' + e(i.bill_to.email) : '') + '</div><div style="text-align:right"><div class="lbl">Pasien</div><b>' + e(i.bill_to.pasien) + '</b> (' + e(i.bill_to.pasien_id) + ')<br>Paket ' + e(i.so.nama_paket || '-') + ' · ' + e(i.so.kontrak_label || '') + '<br>Perawat: ' + e(i.so.nama_perawat || '-') + (i.so.no_po ? '<br>No. PO ' + e(i.so.no_po) : '') + '</div></div>' +
    '<table><thead><tr><th>Uraian</th><th class="r">Jumlah</th><th class="r">Harga Satuan</th><th class="r">Subtotal</th></tr></thead><tbody>' + i.items.map(function (it) { return '<tr><td><b>' + e(it.jenis_item) + '</b>' + (it.uraian ? '<br><span style="color:#64748B">' + e(it.uraian) + '</span>' : '') + '</td><td class="r">' + e(it.jumlah) + '</td><td class="r">' + rp(it.harga_satuan) + '</td><td class="r">' + rp(it.subtotal) + '</td></tr>'; }).join('') + '</tbody></table>' +
    '<table class="tot"><tr><td>Total</td><td class="r">' + rp(i.total) + '</td></tr>' + (i.varian === 'DP' && dp ? '<tr><td>Uang muka (DP) ditagihkan</td><td class="r">' + rp(dp) + '</td></tr>' : '') + '<tr><td>Sudah dibayar</td><td class="r">' + rp(i.terbayar) + '</td></tr><tr class="b"><td>Sisa tagihan</td><td class="r">' + rp(i.sisa) + '</td></tr></table>' +
    '<div style="font-size:9pt;color:#475569;margin-top:6px"><i>Terbilang: ' + e(i.terbilang || '') + '</i></div>' +
    '<div class="f"><div class="rek"><div class="lbl">Rekening pembayaran</div>' + rek + '</div><div style="text-align:center">' + (qr ? '<img src="' + qr + '" style="width:84px;height:84px">' : '') + '<div style="font-size:8pt;color:#64748B">Kode ' + e(i.kode_verifikasi) + '</div></div><div style="text-align:center;min-width:170px"><div>' + e(i.profil.kota) + ', ' + CC.u.tglPanjang(i.tanggal_terbit) + '</div><div style="height:46px"></div><b style="text-decoration:underline">' + e(i.profil.penandatangan.nama) + '</b><div>' + e(i.profil.penandatangan.jabatan) + '</div></div></div></div>';
};
CC.A['invoice.html'] = { roles: ['ADM', 'CS', 'OPS', 'KEU'], fn: function (ctx, p) { var i = CC.A['invoice.detail'].fn(ctx, { no: p.no }); return { html: CC.htmlInvoice(i), detail: i }; } };
