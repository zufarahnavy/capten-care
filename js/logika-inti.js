/* =====================================================================
 * CAPTEN CARE INTEGRATED MANAGEMENT SYSTEM — LOGIKA INTI (BERSAMA)
 * PT. Nusantara Insan Sakti
 *
 * Berkas ini IDENTIK di dua tempat:
 *   - backend  : Logika_Inti.gs   (Google Apps Script)
 *   - frontend : js/logika-inti.js (dipakai hanya pada MODE DEMO)
 * Semua akses ke Sheets/Cache/Properties/Drive lewat adaptor CC.env,
 * sehingga aturan bisnis, RBAC, dan validasi sama persis di kedua mode.
 * Tidak ada rahasia di berkas ini (rahasia hanya di Script Properties).
 * ===================================================================== */
var CC = (typeof CC !== 'undefined' && CC) || {};
CC.VERSI = '1.1.0';
CC.A = CC.A || {};          // registry aksi API: CC.A['nama.aksi'] = { roles, tulis, fn }
CC.env = CC.env || null;    // diisi host: Kode.gs (GAS) atau js/demo.js (peramban)

/* ---------- Nama tab (16 inti + 17 pendukung + tab modul tambahan) ---------- */
CC.T = {
  USER: '01_USERS_AUTH', PHC: '02_MASTER_PERAWAT_HC', PHV: '03_MASTER_PERAWAT_HV', PASIEN: '04_MASTER_KLIEN_PASIEN',
  ABS_HC: '05_ABSENSI_HC', ABS_HV: '06_ABSENSI_HV', LHC: '07_LAPORAN_HARIAN_HC', LHV: '08_LAPORAN_HOME_VISIT',
  LEAD: '09_PIPELINE_CS', KASUS: '10_LOG_KASUS_KOMPLAIN', TURNOVER: '11_LOG_TURNOVER_PUTUS', PC: '12_PETTY_CASH',
  JURNAL: '13_JURNAL_KEUANGAN', TARGET: '14_MASTER_TARGET', REKRUT: '15_REKRUTMEN_KARIR', REKAP: '16_REKAP_OPERASIONAL',
  LOG: 'S1_LOG_AKTIVITAS', SET: 'S2_PENGATURAN', NOTIF: 'S3_LOG_NOTIFIKASI', TUGAS: 'S4_PENUGASAN', PAKET: 'S5_MASTER_PAKET',
  SO: 'S6_SALES_ORDER', INV: 'S7_INVOICE', BAYAR: 'S8_PEMBAYARAN_INVOICE', LIBUR: 'S9_LIBUR_CUTI_LEMBUR',
  KASBON: 'S10_KASBON_POTONGAN', GAJI: 'S11_PENGGAJIAN', IDF: 'S12_IDENTIFIKASI_PASIEN', TPL: 'S13_TEMPLATE_DOKUMEN',
  NILAI: 'S14_PENILAIAN_KLIEN', KUNJ: 'S15_KUNJUNGAN_PENGAWASAN', MESS: 'S16_MESS_ANTAR_JEMPUT', PENALTI: 'S17_PENALTI_KONTRAK',
  DOK: 'DE_DOKUMEN', NOMOR: 'DE_NOMOR', CRM: 'CRM_KONTAK', CRMI: 'CRM_INTERAKSI', BLAST: 'BLAST_WA', TAUTAN: 'X_TAUTAN_FORM'
};

/* ---------- Skema kolom. Semua tab memakai 6 kolom baku di depan ---------- */
CC.STD = ['id', 'dibuat_pada', 'dibuat_oleh', 'diubah_pada', 'diubah_oleh', 'status_arsip'];
CC.SKEMA = (function (T) {
  function k(s) { return s.split(/\s+/).filter(Boolean); }
  var S = {};
  S[T.USER] = { p: 'USR', d: 3, al: 'user_id', k: k('username pin_hash salt nama role sub_role perawat_id status_akun no_wa email percobaan_gagal terkunci_sampai terakhir_login wajib_ganti_pin rev_sesi foto_url') };
  S[T.PHC] = { p: 'PHC', d: 3, al: 'perawat_id', k: k('user_id nama jabatan pendidikan no_str str_berlaku jenis_kelamin tgl_lahir no_wa email domisili wilayah alamat_ktp nik bank_ewallet no_rekening nama_pemilik_rekening status tanggal_mulai akhir_kontrak masa_training_sampai hasil_training kompetensi status_siaga catatan status_wa cek_wa_at') };
  S[T.PHV] = { p: 'PHV', d: 3, al: 'perawat_hv_id', k: k('user_id nama jabatan jenis_kelamin no_wa email alamat_ktp nik bank_ewallet no_rekening nama_pemilik_rekening kompetensi_tindakan status jadwal_kunjungan akhir_kontrak status_wa cek_wa_at') };
  S[T.PASIEN] = { p: 'PSN', d: 4, al: 'pasien_id', k: k('nama_pasien jenis_kelamin tgl_lahir alamat wilayah diagnosa keluhan jenis_layanan paket_id nama_pj relasi_pj nik_pj alamat_pj no_telp_pj no_wa_pj email_pj persetujuan_data status status_klien perawat_id penerima_laporan sumber_lead info_klinis status_wa cek_wa_at') };
  S[T.ABS_HC] = { p: 'ABH', d: 6, k: k('tanggal perawat_id penugasan_id pasien_id status_kehadiran shift catatan diinput_oleh') };
  S[T.ABS_HV] = { p: 'ABV', d: 6, k: k('tanggal perawat_hv_id status_kehadiran catatan diinput_oleh') };
  S[T.LHC] = { p: 'LHC', harian: true, al: 'laporan_id', k: k('tanggal shift pasien_id perawat_id penugasan_id isian tensi nadi suhu spo2 gds kondisi_pasien keterangan_kondisi catatan_tambahan waktu_isi status_ketepatan status_kirim_pj waktu_kirim_pj revisi_ke riwayat_revisi ttd_url') };
  S[T.LHV] = { p: 'LHV', harian: true, al: 'hv_id', k: k('tanggal jadwal_jam pasien_id perawat_hv_id jenis_tindakan consent_id status_consent consent_oleh consent_relasi ttd_url foto_sebelum_url foto_sesudah_url hasil_tindakan catatan_tambahan status biaya') };
  S[T.LEAD] = { p: 'LED', d: 4, al: 'lead_id', k: k('tanggal_masuk pasien_id nama_kontak no_wa nama_pasien usia_pasien kebutuhan paket_minat wilayah sumber_lead status_pipeline followup_terakhir followup_berikutnya nilai_deal so_id pic_cs alasan_tidak_jadi catatan') };
  S[T.KASUS] = { p: 'KSS', d: 4, al: 'kasus_id', k: k('tanggal_masuk jenis divisi_asal pasien_id perawat_id judul deskripsi prioritas pic sla_tenggat status status_akhir utas_diskusi selesai_pada') };
  S[T.TURNOVER] = { p: 'TRN', d: 4, al: 'log_id', k: k('jenis divisi pihak_id pihak_nama alasan_terstandar alasan_detail tanggal_efektif dari ke penerima_laporan_lama penerima_laporan_baru dicatat_oleh bulan_rekap koreksi_dari') };
  S[T.PC] = { p: 'PCS', d: 4, al: 'pc_id', k: k('tanggal tipe kategori pengaju_id pengaju_nama nominal keterangan bukti_url status disetujui_oleh tanggal_bayar saldo_berjalan alasan_tolak') };
  S[T.JURNAL] = { p: 'JRN', d: 4, al: 'jurnal_id', k: k('tanggal tipe kategori akun nominal pasien_id sumber referensi bukti_url status_pengajuan diajukan_oleh diverifikasi_oleh keterangan alasan_tolak') };
  S[T.TARGET] = { p: 'TGT', d: 4, al: 'target_id', k: k('periode divisi indikator satuan target realisasi persen_capaian sumber_otomatis notif_minggu3_terkirim') };
  S[T.REKRUT] = { p: 'LMR', d: 4, al: 'pelamar_id', k: k('tanggal_lamaran nama kontak email posisi pendidikan domisili pengalaman berkas_url tahap alasan_keputusan diproses_oleh user_id_hasil skor catatan') };
  S[T.REKAP] = { p: 'ROP', d: 4, k: k('tanggal pasien_aktif perawat_aktif laporan_masuk laporan_telat belum_absen belum_lapor_kemarin pasien_tanpa_perawat kasus_belum_selesai lead_belum_followup catatan_eksekutif dibuat_oleh') };
  S[T.LOG] = { p: 'LOG', d: 7, k: k('waktu user_id nama peran aksi tab id_record nilai_lama nilai_baru keterangan') };
  S[T.SET] = { p: 'SET', d: 5, k: k('grup kunci nilai berlaku_mulai diubah_oleh_nama alasan versi') };
  S[T.NOTIF] = { p: 'ANT', d: 7, k: k('kanal tujuan nama_penerima subjek pesan event ref_id blast_id status percobaan respon dikirim_pada user_tujuan dibaca') };
  S[T.TUGAS] = { p: 'PGS', d: 4, al: 'penugasan_id', k: k('pasien_id perawat_id peran paket_id so_id tanggal_mulai lama_hari tanggal_akhir tanggal_akhir_aktual alasan_berhenti status shift no_surat_tugas no_spk gaji_deal metode_gaji tugas_pendek jatah_libur penugasan_asal catatan') };
  S[T.PAKET] = { p: 'PKT', d: 2, al: 'paket_id', k: k('nama_paket aktif opsional uraian_tugas keterangan_layanan harga_bawaan satuan_harga gaji_bawaan template_spk_id metode_gaji_bawaan gambar urutan') };
  S[T.SO] = { p: 'SO', d: 4, al: 'so_id', k: k('periode_bulan no_urut tanggal no_invoice pasien_id perawat_id kontrak_hari kontrak_label paket_id status_klien no_po item harga total dp sisa_pembayaran hpp_pokok hpp_tambahan_estimasi margin hpp_status status pic_cs penugasan_id sumber alasan_batal riwayat_revisi') };
  S[T.INV] = { p: 'INV', d: 5, k: k('no_invoice varian tanggal_terbit jatuh_tempo so_id pasien_id jenis_item uraian jumlah harga_satuan subtotal total_invoice status_invoice pdf_url kode_verifikasi alasan_batal pengganti_dari') };
  S[T.BAYAR] = { p: 'BYR', d: 4, al: 'bayar_id', k: k('no_invoice tanggal_bayar jenis nominal metode bukti_url jurnal_id dicatat_oleh pembalikan_dari alasan') };
  S[T.LIBUR] = { p: 'LBR', d: 4, al: 'catat_id', k: k('penugasan_id perawat_id pasien_id tanggal jenis jumlah perawat_pengganti_id penugasan_infal_id tarif_klien disetujui_keluarga dikonfirmasi_kantor bukti_url status alasan_batal catatan') };
  S[T.KASBON] = { p: 'KSB', d: 4, al: 'ksb_id', k: k('perawat_id jenis tanggal nominal cara_potong jumlah_cicilan nominal_per_periode sisa status keterangan diajukan_oleh disetujui_oleh') };
  S[T.GAJI] = { p: 'GJI', d: 4, al: 'gji_id', k: k('periode_kode periode_mulai periode_akhir penugasan_id perawat_id jabatan nama_klien paket gaji_deal metode hari_kerja hari_libur tanggal_libur fee_harian potongan_libur lembur pinjaman seragam potongan_lain koreksi alasan_koreksi total status_hitung status_bayar tanggal_bayar pengajuan_id catatan') };
  S[T.IDF] = { p: 'IDF', d: 4, al: 'id_identifikasi', k: k('penugasan_id pasien_id perawat_id tanggal_isi alasan kondisi_umum tindakan_dasar tindakan_kdm penyakit_penyerta kegiatan_pagi kegiatan_siang kegiatan_sore kegiatan_malam perlakuan_keluarga perlakuan_pasien hak_perawat_ket saran_perawat status ditinjau_oleh diminta_oleh tanggal_diminta tanggal_ditinjau perawat_penerima_id') };
  S[T.TPL] = { p: 'TPL', d: 4, al: 'template_id', k: k('jenis_dokumen varian nama versi mode isi_blok pengaturan_halaman kop_footer penandatangan_ref google_docs_id status berlaku_mulai alasan') };
  S[T.NILAI] = { p: 'NLK', d: 4, al: 'nilai_id', k: k('penugasan_id pasien_id perawat_id periode tanggal_nilai skor_per_butir skor_total komentar diisi_oleh status') };
  S[T.KUNJ] = { p: 'KJP', d: 4, al: 'kunjungan_id', k: k('penugasan_id pasien_id perawat_id tanggal petugas_id temuan tindak_lanjut kasus_id bukti_url status') };
  S[T.MESS] = { p: 'MAJ', d: 4, al: 'catat_id', k: k('jenis perawat_id penugasan_id nama_mess kamar tanggal_masuk tanggal_keluar tanggal_antar titik_jemput tujuan sopir_kendaraan biaya status catatan') };
  S[T.PENALTI] = { p: 'PNL', d: 4, al: 'penalti_id', k: k('penugasan_id perawat_id jenis tanggal_kejadian gaji_acuan pengali nominal_ganti_rugi sisa_gaji_hangus total_penalti status alasan_keputusan ksb_id gji_id') };
  S[T.DOK] = { p: 'DOK', d: 5, k: k('jenis_dokumen nomor template_id versi ref_tab ref_id judul data_isian status penandatangan kode_verifikasi hash_dokumen berkas_url terbit_pada ditarik_alasan') };
  S[T.NOMOR] = { p: 'NOM', d: 3, k: k('kode tahun urut terakhir_nomor') };
  S[T.CRM] = { p: 'KTK', d: 5, k: k('nama email no_wa segmen sumber ref_id tag status_wa cek_wa_at email_valid opt_out catatan jumlah_pesan terakhir_dihubungi info') };
  S[T.CRMI] = { p: 'INT', d: 5, k: k('kontak_id kanal arah ringkasan ref_id oleh tanggal') };
  S[T.BLAST] = { p: 'BLW', d: 4, k: k('judul pesan sasaran total terkirim gagal ukuran_batch jeda_detik status dibuat_oleh_nama selesai_pada') };
  S[T.TAUTAN] = { p: 'TFM', d: 4, k: k('jenis token dibuat_untuk no_wa berlaku_sampai dipakai_pada status ref_id jumlah_kirim') };
  Object.keys(S).forEach(function (t) { S[t].kolom = CC.STD.concat(S[t].al ? [S[t].al] : []).concat(S[t].k); });
  return S;
})(CC.T);

/* ===================== UTILITAS ===================== */
CC.u = {
  pad: function (n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; },
  tgl: function (d) { d = d || CC.env.now(); if (typeof d === 'string') return d.slice(0, 10); return d.getFullYear() + '-' + CC.u.pad(d.getMonth() + 1, 2) + '-' + CC.u.pad(d.getDate(), 2); },
  dt: function (d) { d = d || CC.env.now(); if (typeof d === 'string') return d.slice(0, 16); return CC.u.tgl(d) + ' ' + CC.u.pad(d.getHours(), 2) + ':' + CC.u.pad(d.getMinutes(), 2); },
  jam: function (d) { d = d || CC.env.now(); return CC.u.pad(d.getHours(), 2) + ':' + CC.u.pad(d.getMinutes(), 2); },
  parse: function (s) {
    if (!s) return null; if (s instanceof Date) return s;
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) { var d = new Date(s); return isNaN(d) ? null : d; }
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0, 0);
  },
  tambahHari: function (s, n) { var d = CC.u.parse(s); d.setDate(d.getDate() + Number(n || 0)); return CC.u.tgl(d); },
  tambahBulan: function (s, n) { var d = CC.u.parse(s), hari = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var maks = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(hari, maks)); return CC.u.tgl(d); },
  selisihHari: function (a, b) { var x = CC.u.parse(a), y = CC.u.parse(b); if (!x || !y) return 0; x.setHours(0, 0, 0, 0); y.setHours(0, 0, 0, 0); return Math.round((y - x) / 864e5); },
  selisihJam: function (a, b) { var x = CC.u.parse(a), y = CC.u.parse(b) || CC.env.now(); return x ? (y - x) / 36e5 : 0; },
  bulan: function (d) { return CC.u.tgl(d).slice(0, 7); },
  hariDalamBulan: function (bln) { var p = bln.split('-'); return new Date(+p[0], +p[1], 0).getDate(); },
  romawi: function (m) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][Number(m)]; },
  NAMA_BULAN: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  NAMA_HARI: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  tglPanjang: function (s) { var d = CC.u.parse(s); return d ? d.getDate() + ' ' + CC.u.NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
  angka: function (v) { if (typeof v === 'number') return isFinite(v) ? v : 0; var n = Number(String(v == null ? '' : v).replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(n) ? n : 0; },
  rupiah: function (n) { n = Math.round(CC.u.angka(n)); var s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (n < 0 ? '-Rp ' : 'Rp ') + s; },
  json: function (v, def) { if (v && typeof v === 'object') return v; try { return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  samarkan: function (v) { v = String(v || ''); return v ? '••••' + v.slice(-4) : ''; },
  bersih: function (v) { if (typeof v !== 'string') return v; v = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); return /^[=+\-@]/.test(v) && !/^-?\d/.test(v) ? "'" + v : v; },
  hp08: function (v) { var s = String(v == null ? '' : v).trim().replace(/\.0+$/, '').replace(/[^0-9+]/g, '').replace(/^\+/, ''); if (!s) return ''; if (s.indexOf('62') === 0) s = '0' + s.slice(2); else if (s.indexOf('8') === 0) s = '0' + s; return s; },
  hp62: function (v) { var s = CC.u.hp08(v); return s ? (s[0] === '0' ? '62' + s.slice(1) : s) : ''; },
  hpValid: function (v) { return /^08\d{8,12}$/.test(CC.u.hp08(v)); },
  emailValid: function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim()); },
  usia: function (tglLahir) { var d = CC.u.parse(tglLahir); if (!d) return ''; var n = CC.env.now(), u = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) u--; return u; },
  isi: function (tpl, v) { return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] == null ? '' : String(v[k]); }); },
  terbilang: function (n) {
    n = Math.floor(Math.abs(CC.u.angka(n)));
    var s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    function t(x) {
      if (x < 12) return s[x];
      if (x < 20) return t(x - 10) + ' belas';
      if (x < 100) return t(Math.floor(x / 10)) + ' puluh ' + t(x % 10);
      if (x < 200) return 'seratus ' + t(x - 100);
      if (x < 1000) return t(Math.floor(x / 100)) + ' ratus ' + t(x % 100);
      if (x < 2000) return 'seribu ' + t(x - 1000);
      if (x < 1e6) return t(Math.floor(x / 1000)) + ' ribu ' + t(x % 1000);
      if (x < 1e9) return t(Math.floor(x / 1e6)) + ' juta ' + t(x % 1e6);
      return t(Math.floor(x / 1e9)) + ' miliar ' + t(x % 1e9);
    }
    var r = n === 0 ? 'nol' : t(n).replace(/\s+/g, ' ').trim();
    return r.charAt(0).toUpperCase() + r.slice(1);
  },
  inisial: function (nama) { return String(nama || '?').replace(/^(Ns\.|Tn\.|Ny\.|Nn\.|An\.|Bpk\.|Ibu|Hj\.|H\.|CG\.|Bdn\.|dr\.|Dr\.)\s*/g, '').replace(/^(Hj\.|H\.)\s*/, '').split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0); }).join('').toUpperCase(); },
  salin: function (o) { return JSON.parse(JSON.stringify(o)); }
};

/* ===================== GALAT ===================== */
CC.galat = function (kode, pesan, fields) { var e = new Error(pesan); e.kode = kode; e.fields = fields; throw e; };
CC.wajib = function (p, daftar) {
  var kurang = {};
  daftar.forEach(function (f) { var nama = f.split(':'); if (p[nama[0]] === undefined || p[nama[0]] === null || String(p[nama[0]]).trim() === '') kurang[nama[0]] = (nama[1] || nama[0].replace(/_/g, ' ')) + ' wajib diisi'; });
  if (Object.keys(kurang).length) CC.galat('VALIDATION', 'Lengkapi isian yang ditandai.', kurang);
};

/* ===================== AKSES DATA (lewat adaptor) ===================== */
CC.semua = function (t) { return CC.env.db.all(t); };
CC.aktifSaja = function (rows) { return rows.filter(function (r) { return r.status_arsip !== 'Arsip'; }); };
CC.cari = function (t, id) { if (!id) return null; var r = CC.env.db.get ? CC.env.db.get(t, id) : null; if (r !== null && r !== undefined) return r; var a = CC.semua(t); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; };
CC.idBaru = function (t, tanggal) {
  var s = CC.SKEMA[t];
  if (s.harian) { var d = CC.u.tgl(tanggal || CC.env.now()).replace(/-/g, ''); return s.p + '-' + d + '-' + CC.u.pad(CC.env.seq(t + '_' + d, t, s.p + '-' + d + '-'), 4); }
  return s.p + '-' + CC.u.pad(CC.env.seq(t, t, s.p + '-'), s.d);
};
CC.tambah = function (ctx, t, obj, opsi) {
  opsi = opsi || {};
  var s = CC.SKEMA[t], now = CC.u.dt(), oleh = ctx && ctx.user ? ctx.user.id : (opsi.oleh || 'SISTEM');
  var row = {};
  s.kolom.forEach(function (c) { row[c] = obj[c] === undefined ? '' : obj[c]; });
  row.id = obj.id || CC.idBaru(t, obj.tanggal);
  if (s.al) row[s.al] = row.id;
  row.dibuat_pada = obj.dibuat_pada || now; row.dibuat_oleh = obj.dibuat_oleh || oleh;
  row.diubah_pada = obj.diubah_pada || row.dibuat_pada; row.diubah_oleh = obj.diubah_oleh || oleh; row.status_arsip = obj.status_arsip || 'Aktif';
  CC.env.db.insert(t, [row]);
  if (!opsi.tanpaLog && t !== CC.T.LOG) CC.log(ctx, 'TAMBAH', t, row.id, null, row, opsi.ket);
  return row;
};
CC.tambahBanyak = function (ctx, t, rows) {
  var s = CC.SKEMA[t], now = CC.u.dt(), oleh = ctx && ctx.user ? ctx.user.id : 'SISTEM';
  var out = rows.map(function (obj) {
    var row = {}; s.kolom.forEach(function (c) { row[c] = obj[c] === undefined ? '' : obj[c]; });
    row.id = obj.id || CC.idBaru(t, obj.tanggal); if (s.al) row[s.al] = row.id;
    row.dibuat_pada = obj.dibuat_pada || now; row.dibuat_oleh = obj.dibuat_oleh || oleh; row.diubah_pada = obj.diubah_pada || row.dibuat_pada; row.diubah_oleh = obj.diubah_oleh || oleh; row.status_arsip = obj.status_arsip || 'Aktif';
    return row;
  });
  if (out.length) CC.env.db.insert(t, out);
  return out;
};
CC.ubah = function (ctx, t, id, patch, opsi) {
  opsi = opsi || {};
  var lama = CC.cari(t, id); if (!lama) CC.galat('NOT_FOUND', 'Data ' + id + ' tidak ditemukan.');
  var kol = CC.SKEMA[t].kolom, ubah = {}, sebelum = {};
  Object.keys(patch).forEach(function (k) { if (kol.indexOf(k) > -1 && k !== 'id' && String(lama[k]) !== String(patch[k])) { ubah[k] = patch[k]; sebelum[k] = lama[k]; } });
  if (!Object.keys(ubah).length) return lama;
  ubah.diubah_pada = CC.u.dt(); ubah.diubah_oleh = ctx && ctx.user ? ctx.user.id : 'SISTEM';
  var baru = CC.env.db.update(t, id, ubah);
  if (!opsi.tanpaLog) CC.log(ctx, opsi.aksi || 'UBAH', t, id, sebelum, ubah, opsi.ket);
  return baru;
};
CC.ubahBanyak = function (ctx, t, daftar) {   // daftar: [{id, ...patch}] — 1x tulis blok
  var now = CC.u.dt(), oleh = ctx && ctx.user ? ctx.user.id : 'SISTEM';
  daftar.forEach(function (p) { p.diubah_pada = now; p.diubah_oleh = oleh; });
  if (CC.env.db.updateMany) CC.env.db.updateMany(t, daftar); else daftar.forEach(function (p) { var id = p.id; var q = Object.assign({}, p); delete q.id; CC.env.db.update(t, id, q); });
};
CC.log = function (ctx, aksi, tab, id, lama, baru, ket) {
  try {
    var u = ctx && ctx.user ? ctx.user : { id: 'SISTEM', nama: 'Sistem', role: 'SISTEM' };
    var red = function (o) { if (!o) return ''; var c = {}; Object.keys(o).forEach(function (k) { c[k] = /pin|hash|salt|token|secret|sandi/i.test(k) ? '[DISAMARKAN]' : o[k]; }); var s = JSON.stringify(c); return s.length > 1500 ? s.slice(0, 1497) + '…' : s; };
    CC.env.db.insert(CC.T.LOG, [{ id: CC.idBaru(CC.T.LOG), dibuat_pada: CC.u.dt(), dibuat_oleh: u.id, diubah_pada: '', diubah_oleh: '', status_arsip: 'Aktif', waktu: CC.u.dt() + ':' + CC.u.pad(CC.env.now().getSeconds(), 2), user_id: u.id, nama: u.nama, peran: u.role, aksi: aksi, tab: tab, id_record: id || '', nilai_lama: red(lama), nilai_baru: red(baru), keterangan: ket || '' }]);
  } catch (e) { /* log tidak boleh menggagalkan transaksi */ }
};

/* ===================== PENGATURAN BERTANGGAL EFEKTIF ===================== */
CC.BAWAAN = Object.assign(CC.BAWAAN || {}, {
  shift: [
    { kode: 'PAGI', label: 'Pagi', mulai: '07:00', selesai: '15:00', batas: '16:00' },
    { kode: 'SIANG', label: 'Siang', mulai: '15:00', selesai: '23:00', batas: '23:59' },
    { kode: 'MALAM', label: 'Malam', mulai: '23:00', selesai: '07:00', batas: '08:00', hariBerikut: true },
    { kode: '24J', label: '24 Jam', mulai: '07:00', selesai: '07:00', batas: '20:00' }
  ],
  operasional: { sla_jam: { 'Komplain Klien': 24, 'Kondisi Lapangan': 6, 'Izin': 12, 'Resign': 72 }, followup_hari: 2, kasus_ingat_hari: 3, perpanjangan_hari: 3, jatuh_tempo_invoice_hari: 7, kontrak_perawat_ingat_hari: 30, idf_ingat_hari: 2, tautan_form_hari: 7, kondisi_buat_kasus: true, retensi_backup: 12 },
  master: {
    jenis_item_invoice: ['Jasa Layanan', 'Administrasi', 'Biaya Lembur', 'Biaya Transportasi', 'Jasa Layanan Infal', 'Biaya Konsumsi', 'Diskon'],
    kategori_pc: ['Transportasi', 'ATK & Cetak', 'Konsumsi Rapat', 'Perlengkapan Medis', 'Pulsa & Internet', 'Kebersihan Kantor', 'Lain-lain'],
    kategori_jurnal: ['Pendapatan Layanan', 'Pembayaran Invoice', 'Gaji Perawat', 'Petty Cash', 'Operasional Kantor', 'Pemasaran', 'Sewa', 'Lain-lain'],
    bank: ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB Niaga', 'DANA', 'OVO', 'GoPay'],
    alasan_turnover: ['Biaya', 'Sudah sehat', 'Wafat', 'Kinerja', 'Pindah domisili', 'Permintaan klien', 'Resign tanpa pemberitahuan', 'Meninggalkan tugas tanpa izin', 'Kontrak selesai', 'Lainnya'],
    alasan_tidak_jadi: ['Harga di luar anggaran', 'Memilih penyedia lain', 'Pasien dirawat inap', 'Di luar wilayah layanan', 'Tidak merespons', 'Lainnya'],
    alasan_rotasi: ['Permintaan klien', 'Kinerja', 'Domisili', 'Libur/cuti perawat utama', 'Lainnya'],
    jenis_libur: ['Libur jatah', 'Cuti', 'Izin', 'Sakit', 'Lembur', 'Infal'],
    sumber_lead: ['WhatsApp', 'Instagram', 'Referral', 'Referral Dokter/RS', 'Website', 'Google Maps', 'Lainnya'],
    jabatan: ['Perawat (Ners)', 'Perawat (D3)', 'Caregiver', 'Bidan', 'Fisioterapis'],
    wilayah: ['Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Tangerang Selatan', 'Depok', 'Bekasi', 'Bogor'],
    jenis_kasus: ['Komplain Klien', 'Kondisi Lapangan', 'Izin', 'Resign'],
    jenis_tindakan_hv: ['Infus Vitamin', 'Pasang NGT', 'Lepas NGT', 'Pasang Kateter', 'Lepas Kateter', 'Perawatan Luka', 'Injeksi', 'Lainnya'],
    status_klien: ['New', 'Existing']
  },
  profil: {
    nama_perusahaan: 'PT. Nusantara Insan Sakti', brand: 'Capten Care', alamat: 'Jl. Kebayoran Baru No. 18, Jakarta Selatan 12120', kota: 'Jakarta',
    telepon: '021-2789-4410', wa: '0811-9087-2210', email: 'halo@captencare.id', website: 'captencare.id', izin: 'Izin Operasional Pelayanan Kesehatan No. 503/440/KES-NIS/2024',
    rekening: [{ bank: 'BCA', nomor: '541-098-2890', atas_nama: 'PT Nusantara Insan Sakti' }],
    penandatangan: {
      ST: { nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Head of Nurse' }, SPK: { nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Head of Nurse' },
      SPKWT: { nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Head of Nurse' }, KL: { nama: 'dr. Hendra Pratama, Sp.B', jabatan: 'Direktur' },
      INV: { nama: 'Admin Keuangan', jabatan: 'Admin' }, IC: { nama: 'Koordinator Home Visit', jabatan: 'Koordinator HV' }, SP: { nama: 'Manajer HRD', jabatan: 'HRD' }
    }
  },
  penomoran: {
    ST: { label: 'Surat Tugas', pola: '{NNNN}/ST/CC/{ROMAWI}/{YYYY}', digit: 4, reset: 'tahun', mulai: 1 },
    SPK: { label: 'SPK Perawat', pola: '{NNNN}/SPK/CC/{ROMAWI}/{YYYY}', digit: 4, reset: 'tahun', mulai: 1 },
    SPKWT: { label: 'Kontrak Karyawan (SPKWT)', pola: '{NNNNNN}/SPKWT/CC/{ROMAWI}/{YYYY}', digit: 6, reset: 'tahun', mulai: 1 },
    KL: { label: 'Kontrak Layanan', pola: '{NNNN}/PPJ/CC/{ROMAWI}/{YYYY}', digit: 4, reset: 'tahun', mulai: 1 },
    IC: { label: 'Informed Consent', pola: '{NNNN}/IC/HV/{ROMAWI}/{YYYY}', digit: 4, reset: 'tahun', mulai: 1 },
    SP: { label: 'Surat Peringatan', pola: '{NNNN}/SP/HRD/{ROMAWI}/{YYYY}', digit: 4, reset: 'tahun', mulai: 1 },
    INV: { label: 'Invoice', pola: 'NIS/{MM}/{YY}/{NNNNN}', digit: 5, reset: 'tahun', mulai: 698 }
  },
  modul: { penilaian: false, kunjungan: false, mess: false, penalti: false, pc_perawat: false },
  branding: {
    nama_aplikasi: 'Capten Care Integrated Management System', nama_brand: 'Capten Care', nama_perusahaan: 'PT. Nusantara Insan Sakti',
    tagline: 'Integrated System', footer: '© PT. Nusantara Insan Sakti', logo_url: '', logo_gelap_url: '', gambar_login_url: '', favicon_url: '',
    preset: 'cyan', warna: { merek: '#00C2FF', gelap: '#0B132B', aksen: '#0284C7', latar: '#F8FAFC', kartu: '#FFFFFF' },
    font_judul: 'Plus Jakarta Sans', font_isi: 'Inter', ukuran_dasar: 14, radius: 'besar', kepadatan: 'nyaman', animasi: 'normal', kpi_utama: 'gelap',
    teks: {}, menu_sembunyi: {}
  },
  notif: {
    wa_aktif: false, email_aktif: false, batch: 20, jeda: '5', deteksi_otomatis: true, nama_pengirim: 'Capten Care', penyedia: [{ id: 'fonnte', nama: 'Fonnte', jenis: 'WA', url: 'https://api.fonnte.com', aktif: true, prioritas: 1 }],
    matriks: {}
  },
  format_laporan: {
    B: ['Membantu pasien bangun tidur', 'Membersihkan tubuh/mandi', 'Membersihkan mulut dan menyikat gigi', 'Mengganti pakaian pasien', 'Mengganti popok jika diperlukan', 'Menyiapkan dan membantu makan', 'Memberikan minum', 'Membantu aktivitas/mobilisasi', 'Membantu perubahan posisi tidur', 'Membantu istirahat siang', 'Membersihkan pasien sore hari', 'Membersihkan mulut sebelum tidur', 'Mengganti pakaian tidur', 'Menyiapkan pasien untuk tidur malam', 'Memastikan pasien nyaman dan aman saat tidur'],
    E: ['Memeriksa kondisi selang NGT', 'Memberikan nutrisi melalui NGT', 'Memberikan obat melalui NGT', 'Memeriksa kondisi kateter', 'Mengukur dan mencatat urine', 'Membersihkan area kateter', 'Memeriksa kondisi trakeostomi', 'Memeriksa kondisi infus', 'Melakukan perawatan luka', 'Memeriksa alat medis lainnya'],
    wajib: ['tensi', 'nadi', 'suhu', 'spo2', 'kondisi_pasien', 'bab', 'bak', 'makan_pagi', 'makan_siang', 'makan_malam']
  },
  format_idf: { wajib: ['kondisi_umum', 'tindakan_dasar', 'tindakan_kdm', 'kegiatan_pagi', 'kegiatan_siang', 'kegiatan_sore', 'kegiatan_malam'] },
  /* Halaman masuk (publik): slideshow latar + kartu ilustrasi interaktif. Kartu SELALU fiktif (diisi Admin). */
  login: {
    slide: {
      aktif: true, durasi: 6, transisi: 'pudar', kecepatan: 1200, gelap: 64, acak: false, titik: true, keterangan: true, jeda_hover: true,
      daftar: [
        { id: 'contoh1', url: 'assets/login/contoh-1.jpg', judul: 'Pendampingan perawat di rumah', teks: 'Penugasan, rotasi, dan laporan harian dalam satu portal.' },
        { id: 'contoh2', url: 'assets/login/contoh-2.jpg', judul: 'Laporan harian terstandar A–H', teks: 'Diteruskan ke keluarga dan koordinator setelah dikirim.' },
        { id: 'contoh3', url: 'assets/login/contoh-3.jpg', judul: 'Home visit dengan consent digital', teks: 'Checklist tindakan dan foto dokumentasi tersimpan rapi.' }
      ]
    },
    kartu: {
      aktif: true, judul: 'LIVE · PENUGASAN AKTIF', putar: 9, miring: true, blok: { perawat: true, ttv: true, lini: true, progres: true },
      skenario: [
        { id: 'sk1', label: 'Home Care VIP', pasien: 'Ny. Kartini Wulandari', info: '74 th · Pasca stroke iskemik · Paket VIP', status: 'Home Care Aktif', perawat: 'Ns. Dewi Anggraini, S.Kep', perawat_info: 'Shift Pagi · hari ke-12/30',
          ttv: [{ k: 'Tensi', v: '128/82', tren: '136/88; 133/86; 131/84; 130/83; 128/82' }, { k: 'Nadi', v: '78', tren: '86; 84; 81; 80; 78' }, { k: 'Suhu', v: '36,6°', tren: '37,2; 37,0; 36,8; 36,7; 36,6' }, { k: 'SpO₂', v: '98%', tren: '95; 96; 97; 97; 98' }],
          lini: [{ jam: '07.42', judul: 'Laporan shift malam', teks: 'terkirim ke keluarga via WhatsApp', detail: 'Ringkasan laporan A–H shift malam diteruskan ke penanggung jawab keluarga.', status: 'ok', progres: 2 },
            { jam: '09.15', judul: 'Obat pagi', teks: 'diberikan sesuai jadwal', detail: 'Bagian D (obat) dicentang lengkap dengan jam pemberian.', status: 'ok', progres: 4 },
            { jam: '11.30', judul: 'Alih baring & ROM pasif', teks: 'sedang berlangsung', detail: 'Bagian B (ADL) diisi setelah tindakan selesai.', status: 'jalan', progres: 6 }],
          progres_label: 'Laporan A–H', progres: 6, progres_maks: 8 },
        { id: 'sk2', label: 'Home Care Intensif', pasien: 'Tn. Bambang Sutrisno', info: '68 th · Diabetes melitus tipe 2 · Paket Intensif', status: 'Home Care Aktif', perawat: 'Ns. Rizky Pratama, S.Kep', perawat_info: 'Shift Malam · hari ke-5/14',
          ttv: [{ k: 'Tensi', v: '142/90', tren: '150/94; 148/92; 145/91; 142/90' }, { k: 'Nadi', v: '84', tren: '90; 88; 86; 84' }, { k: 'Suhu', v: '36,8°', tren: '36,9; 36,8; 36,9; 36,8' }, { k: 'SpO₂', v: '97%', tren: '96; 97; 97; 97' }],
          lini: [{ jam: '19.10', judul: 'Cek gula darah', teks: 'sebelum makan malam', detail: 'Hasil pemeriksaan dicatat bersama TTV di bagian C.', status: 'ok', progres: 3 },
            { jam: '20.30', judul: 'Insulin malam', teks: 'diberikan sesuai resep', detail: 'Bagian D: dosis dan jam pemberian tercatat.', status: 'ok', progres: 5 },
            { jam: '22.00', judul: 'Perawatan kaki', teks: 'dijadwalkan', detail: 'Pemeriksaan kaki dicatat di bagian G (kondisi).', status: 'jalan', progres: 6 }],
          progres_label: 'Laporan A–H', progres: 5, progres_maks: 8 },
        { id: 'sk3', label: 'Home Visit', pasien: 'Ny. Sri Lestari', info: '59 th · Luka pasca operasi · Home Visit', status: 'Kunjungan Berjalan', perawat: 'Ns. Andi Saputra, S.Kep', perawat_info: 'Kunjungan 10.00 · Perawatan luka',
          ttv: [{ k: 'Tensi', v: '118/76', tren: '122/80; 120/78; 118/76' }, { k: 'Nadi', v: '76', tren: '80; 78; 76' }, { k: 'Suhu', v: '36,5°', tren: '36,7; 36,6; 36,5' }, { k: 'SpO₂', v: '99%', tren: '98; 99; 99' }],
          lini: [{ jam: '09.40', judul: 'Informed consent', teks: 'ditandatangani keluarga', detail: 'Lembar tindakan terbuka setelah consent digital disetujui.', status: 'ok', progres: 2 },
            { jam: '10.05', judul: 'Foto sebelum tindakan', teks: 'terunggah', detail: 'Foto sebelum dan sesudah wajib untuk menyelesaikan kunjungan.', status: 'ok', progres: 4 },
            { jam: '10.20', judul: 'Ganti balutan luka', teks: 'sedang berlangsung', detail: 'Checklist tindakan dicentang per langkah.', status: 'jalan', progres: 6 }],
          progres_label: 'Checklist tindakan', progres: 6, progres_maks: 8 }
      ]
    }
  }
});
CC.GAJI_USULAN = {
  pembagi: 30, gaji_paket: { 'PKT-01': 3600000, 'PKT-02': 4000000, 'PKT-03': 4600000, 'PKT-04': 5200000 }, tarif_harian_pendek: 150000, batas_hari_pendek: 30,
  jatah_libur: 4, potongan_libur: 100000, potongan_berlaku: 'semua', metode_paket: { 'PKT-01': 'A', 'PKT-02': 'A', 'PKT-03': 'A', 'PKT-04': 'A' }, prorata: 'inklusif',
  upah_lembur: '', tarif_lembur_klien: 300000, biaya_admin: 1000000, masa_admin_bulan: 3, periode_gaji: 'siklus', jatuh_tempo_gaji: 'Tanggal berangkat bulan berikutnya',
  seragam_nominal: 450000, seragam_cicilan: 3, kasbon_maks_persen: 50,
  penalti_masa_resign: 30, penalti_pengali: 3, penalti_dasar: 'gaji_deal', penalti_hangus: 'sisa_periode'
};
CC._setCache = null;
CC.set = function (kunci, tglRef) {
  if (!CC._setCache) {
    var idx = {};
    CC.aktifSaja(CC.semua(CC.T.SET)).forEach(function (r) { (idx[r.kunci] = idx[r.kunci] || []).push(r); });
    Object.keys(idx).forEach(function (k) { idx[k].sort(function (a, b) { return a.berlaku_mulai < b.berlaku_mulai ? -1 : a.berlaku_mulai > b.berlaku_mulai ? 1 : (a.dibuat_pada < b.dibuat_pada ? -1 : 1); }); });
    CC._setCache = idx;
  }
  var ref = CC.u.tgl(tglRef || CC.env.now()), rows = CC._setCache[kunci] || [], pilih = null;
  for (var i = 0; i < rows.length; i++) if (String(rows[i].berlaku_mulai).slice(0, 10) <= ref) pilih = rows[i];
  if (pilih) { var v = CC.u.json(pilih.nilai, pilih.nilai); if (CC.BAWAAN[kunci] && typeof v === 'object' && !Array.isArray(v) && !Array.isArray(CC.BAWAAN[kunci])) return Object.assign(CC.u.salin(CC.BAWAAN[kunci]), v); return v; }
  return CC.BAWAAN[kunci] !== undefined ? CC.u.salin(CC.BAWAAN[kunci]) : null;
};
CC.setRiwayat = function (kunci) { return CC.aktifSaja(CC.semua(CC.T.SET)).filter(function (r) { return r.kunci === kunci; }).sort(function (a, b) { return a.dibuat_pada < b.dibuat_pada ? 1 : -1; }); };
CC.setSimpan = function (ctx, kunci, nilai, berlaku, alasan, grup) {
  var ver = CC.setRiwayat(kunci).length + 1;
  CC.tambah(ctx, CC.T.SET, { grup: grup || kunci, kunci: kunci, nilai: JSON.stringify(nilai), berlaku_mulai: berlaku || CC.u.tgl(), diubah_oleh_nama: ctx && ctx.user ? ctx.user.nama : 'Sistem', alasan: alasan || '', versi: ver }, { ket: 'Pengaturan ' + kunci + ' v' + ver });
  CC._setCache = null;
  if (CC.env.bumpCache) CC.env.bumpCache('set');
  return ver;
};
CC.modulAktif = function (m) { var s = CC.set('modul') || {}; return !!s[m]; };

/* ===================== PENOMORAN DOKUMEN (US-55) ===================== */
CC.nomorBaru = function (ctx, kode, tanggal) {
  var cfg = (CC.set('penomoran') || {})[kode]; if (!cfg) CC.galat('VALIDATION', 'Pola nomor ' + kode + ' belum diatur.');
  var d = CC.u.parse(tanggal || CC.u.tgl()), th = String(d.getFullYear()), bl = d.getMonth() + 1;
  var kunciUrut = cfg.reset === 'bulan' ? th + '-' + CC.u.pad(bl, 2) : cfg.reset === 'tidak' ? 'ALL' : th;
  var rows = CC.semua(CC.T.NOMOR).filter(function (r) { return r.kode === kode && String(r.tahun) === kunciUrut; });
  var urut;
  if (rows.length) { urut = Number(rows[0].urut) + 1; } else urut = Math.max(1, Number(cfg.mulai) || 1);
  var nomor = cfg.pola.replace(/\{(N+)\}/, function (m, n) { return CC.u.pad(urut, n.length); })
    .replace('{ROMAWI}', CC.u.romawi(bl)).replace('{YYYY}', th).replace('{YY}', th.slice(2)).replace('{MM}', CC.u.pad(bl, 2));
  if (rows.length) CC.ubah(ctx, CC.T.NOMOR, rows[0].id, { urut: urut, terakhir_nomor: nomor }, { tanpaLog: true });
  else CC.tambah(ctx, CC.T.NOMOR, { kode: kode, tahun: kunciUrut, urut: urut, terakhir_nomor: nomor }, { tanpaLog: true });
  return nomor;
};

/* ===================== PERAN, AUTENTIKASI & SESI ===================== */
CC.PERAN = {
  ADM: 'Admin / Direksi', PRW: 'Perawat Lapangan', KEP: 'Tim Keperawatan', HV: 'Tim Home Visit', HVK: 'Koordinator Home Visit',
  CS: 'Customer Service', HRD: 'HRD', OPS: 'Operasional', KEU: 'Keuangan', PC: 'Staf Petty Cash'
};
CC.peranEfektif = function (u) {
  if (!u) return '';
  if (u.role === 'KEU' && u.sub_role === 'PETTY_CASH') return 'PC';
  if (u.role === 'HV' && u.sub_role === 'KOORDINATOR') return 'HVK';
  return u.role;
};
CC.boleh = function (u, roles) {
  if (!roles || roles === '*') return true;
  var e = CC.peranEfektif(u);
  return roles.indexOf(e) > -1 || (e === 'HVK' && roles.indexOf('HV') > -1);
};
CC.TOKEN_JAM = 12;
CC.buatToken = function (u) {
  var now = CC.env.now().getTime();
  var body = CC.env.b64(JSON.stringify({ u: u.id, i: now, x: now + CC.TOKEN_JAM * 36e5 }));
  return 'cc1.' + body + '.' + CC.env.hmac(body);
};
CC.verifikasiToken = function (token, ctx) {
  var p = String(token || '').split('.');
  if (p.length !== 3 || p[0] !== 'cc1') return null;
  if (!CC.env.samaAman(CC.env.hmac(p[1]), p[2])) return null;
  var isi = CC.u.json(CC.env.unb64(p[1]), null); if (!isi) return null;
  var now = CC.env.now().getTime(); if (isi.x < now) return null;
  var u = CC.cari(CC.T.USER, isi.u); if (!u || u.status_akun !== 'Aktif' || u.status_arsip === 'Arsip') return null;
  if (u.rev_sesi && Number(u.rev_sesi) > isi.i) return null;
  if (ctx && now - isi.i > 30 * 60000) ctx.tokenBaru = CC.buatToken(u);   // sesi bergeser: 12 jam sejak aktivitas terakhir
  return u;
};
/* Referensi foto profil: hanya drive:<id> (server) atau data:image (mode demo). Selain itu diabaikan. */
CC.refFoto = function (v) { v = String(v || ''); return /^drive:[A-Za-z0-9_-]{10,}$/.test(v) || /^data:image\/(png|jpeg|webp);base64,/.test(v) ? v : ''; };
CC.profilAman = function (u) {
  var p = { id: u.id, username: u.username, nama: u.nama, role: u.role, sub_role: u.sub_role, peran: CC.peranEfektif(u), peran_label: CC.PERAN[CC.peranEfektif(u)], perawat_id: u.perawat_id, no_wa: u.no_wa, email: u.email, foto_url: CC.refFoto(u.foto_url), wajib_ganti_pin: u.wajib_ganti_pin === true || u.wajib_ganti_pin === 'TRUE' || u.wajib_ganti_pin === 'YA' };
  return p;
};

/* ===================== MENU PER PERAN (Bagian 7.2) ===================== */
CC.MENU = [
  { id: 'dashboard', label: 'Dashboard', ikon: 'layout-dashboard', roles: '*' },
  { id: 'analitik', label: 'Analitik Penjualan', ikon: 'chart-no-axes-combined', roles: ['ADM', 'KEU', 'OPS', 'CS'] },
  { id: 'operasional', label: 'Operasional Harian', ikon: 'activity', roles: ['ADM', 'OPS'] },
  { id: 'laporan', label: 'Laporan Harian HC', ikon: 'clipboard-list', roles: ['ADM', 'PRW', 'KEP', 'OPS'], badge: 'laporan' },
  { id: 'riwayat', label: 'Riwayat Saya', ikon: 'history', roles: ['PRW'] },
  { id: 'identifikasi', label: 'Identifikasi Pasien', ikon: 'clipboard-pen', roles: ['ADM', 'PRW', 'KEP'], badge: 'idf' },
  { id: 'pasien', label: 'Pasien & Klien', ikon: 'contact-round', roles: ['ADM', 'KEP', 'HV', 'CS', 'OPS'] },
  { id: 'perawat', label: 'Direktori Perawat', ikon: 'users-round', roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'] },
  { id: 'penugasan', label: 'Penugasan & Rotasi', ikon: 'repeat', roles: ['ADM', 'KEP', 'CS', 'HRD', 'OPS', 'KEU'] },
  { id: 'jadwal', label: 'Jadwal & Kalender', ikon: 'calendar-days', roles: ['ADM', 'KEP', 'HV', 'CS', 'OPS', 'KEU'] },
  { id: 'absensi', label: 'Absensi', ikon: 'calendar-check', roles: ['ADM', 'KEP', 'HV', 'HRD', 'OPS', 'KEU'] },
  { id: 'libur', label: 'Libur, Cuti & Lembur', ikon: 'sunrise', roles: ['ADM', 'KEP', 'CS', 'HRD', 'OPS', 'KEU'] },
  { id: 'homevisit', label: 'Home Visit', ikon: 'stethoscope', roles: ['ADM', 'HV', 'OPS'] },
  { id: 'pipeline', label: 'Pipeline CS', ikon: 'square-kanban', roles: ['ADM', 'CS', 'OPS'], badge: 'lead' },
  { id: 'sales', label: 'Sales Order & Invoice', ikon: 'receipt-text', roles: ['ADM', 'CS', 'KEP', 'OPS', 'KEU'], badge: 'tagihan' },
  { id: 'kasus', label: 'Kasus & Komplain', ikon: 'circle-alert', roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'], badge: 'kasus' },
  { id: 'turnover', label: 'Turnover & Putus Kontrak', ikon: 'arrow-left-right', roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'] },
  { id: 'rekrutmen', label: 'Rekrutmen & Kontrak', ikon: 'briefcase', roles: ['ADM', 'HRD'] },
  { id: 'penggajian', label: 'Penggajian', ikon: 'banknote', roles: ['ADM', 'KEP', 'OPS', 'KEU'] },
  { id: 'kasbon', label: 'Kasbon & Potongan', ikon: 'wallet', roles: ['ADM', 'KEP', 'OPS', 'KEU'] },
  { id: 'pettycash', label: 'Buku Petty Cash', ikon: 'piggy-bank', roles: ['ADM', 'OPS', 'KEU', 'PC', 'PRW'], modulPerawat: 'pc_perawat' },
  { id: 'keuangan', label: 'Jurnal & Laporan Keuangan', ikon: 'landmark', roles: ['ADM', 'KEU'] },
  { id: 'target', label: 'Target & KPI', ikon: 'gauge', roles: ['ADM', 'KEP', 'HV', 'CS', 'OPS', 'KEU'] },
  { id: 'dokumen', label: 'Dokumen & Surat', ikon: 'file-pen-line', roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS', 'KEU'] },
  { id: 'crm', label: 'CRM Kontak', ikon: 'id-card', roles: ['ADM', 'CS', 'OPS'] },
  { id: 'notifikasi', label: 'WhatsApp & Notifikasi', ikon: 'megaphone', roles: ['ADM', 'CS', 'OPS'] },
  { id: 'penilaian', label: 'Penilaian Klien', ikon: 'star', roles: ['ADM', 'KEP', 'CS', 'HRD', 'OPS'], modul: 'penilaian' },
  { id: 'kunjungan', label: 'Kunjungan Pengawasan', ikon: 'map-pin', roles: ['ADM', 'KEP', 'CS', 'HRD', 'OPS'], modul: 'kunjungan' },
  { id: 'mess', label: 'Mess & Antar-Jemput', ikon: 'bed-double', roles: ['ADM', 'KEP', 'HRD', 'OPS'], modul: 'mess' },
  { id: 'penalti', label: 'Penalti Kontrak', ikon: 'scale', roles: ['ADM', 'KEP', 'HRD', 'OPS', 'KEU'], modul: 'penalti' },
  { id: 'pengaturan', label: 'Pengaturan', ikon: 'settings', roles: ['ADM', 'KEU'], grup: 'GENERAL' },
  { id: 'log', label: 'Log Aktivitas', ikon: 'shield-check', roles: ['ADM'], grup: 'GENERAL' },
  { id: 'bantuan', label: 'Bantuan & SOP', ikon: 'life-buoy', roles: '*', grup: 'GENERAL' }
];
CC.menuUntuk = function (u) {
  var e = CC.peranEfektif(u), modul = CC.set('modul') || {}, br = CC.set('branding') || {}, sembunyi = (br.menu_sembunyi || {})[e] || [], teks = br.teks || {};
  return CC.MENU.filter(function (m) {
    if (!CC.boleh(u, m.roles)) return false;
    if (m.modul && !modul[m.modul]) return false;
    if (m.modulPerawat && e === 'PRW' && !modul[m.modulPerawat]) return false;
    if (sembunyi.indexOf(m.id) > -1 && m.id !== 'dashboard' && m.id !== 'pengaturan') return false;
    return true;
  }).map(function (m) { return { id: m.id, label: teks['menu.' + m.id] || m.label, ikon: m.ikon, grup: m.grup || 'MENU', badge: m.badge || '' }; });
};

/* ===================== ROUTER AKSI ===================== */
CC.handle = function (req) {
  var t0 = Date.now();
  CC._setCache = null;
  if (CC._pascaMuat && CC._pascaMuat.length) { var f; while ((f = CC._pascaMuat.shift())) f(); }
  try {
    if (!CC.env) CC.galat('SERVER', 'Adaptor belum dipasang.');
    var a = CC.A[req.action];
    if (!a) CC.galat('NOT_FOUND', 'Aksi "' + req.action + '" tidak dikenal.');
    var ctx = { req: req, now: CC.env.now() };
    if (!a.publik) {
      ctx.user = CC.verifikasiToken(req.token, ctx);
      if (!ctx.user) CC.galat('AUTH_REQUIRED', 'Sesi berakhir. Silakan masuk kembali.');
      ctx.peran = CC.peranEfektif(ctx.user);
    }
    if (a.modul && !CC.modulAktif(a.modul)) CC.galat('MODULE_OFF', 'Fitur ini belum diaktifkan oleh Admin.');
    if (a.roles && !CC.boleh(ctx.user, typeof a.roles === 'function' ? a.roles(ctx) : a.roles)) CC.galat('FORBIDDEN', 'Anda tidak punya akses untuk tindakan ini.');
    var p = req.payload || {};
    var data = a.tulis ? CC.env.lock(function () { return a.fn(ctx, p); }) : a.fn(ctx, p);
    var res = { ok: true, data: data === undefined ? null : data };
    if (ctx.pesan) res.message = ctx.pesan;
    if (ctx.tokenBaru) res.tokenBaru = ctx.tokenBaru;
    if (a.tulis && CC.env.bumpCache) CC.env.bumpCache(a.cache || 'data');
    res.ms = Date.now() - t0;
    return res;
  } catch (e) {
    if (e && e.kode) return { ok: false, error: { code: e.kode, message: e.message, fields: e.fields || null } };
    try { CC.log(null, 'GALAT_SERVER', '', '', null, null, (req.action || '') + ': ' + (e && e.message)); } catch (x) { }
    return { ok: false, error: { code: 'SERVER', message: 'Terjadi gangguan di server: ' + (e && e.message ? e.message : e) } };
  }
};

/* ===================== MODUL CRUD GENERIK (US-57) ===================== */
/* r/c/u/d: peran yang boleh Lihat/Tambah/Ubah/Arsip. d: 'arsip' | 'batal' | 'nonaktif' | null (tidak dapat dihapus) */
CC.MOD = {
  akun: { t: CC.T.USER, r: ['ADM'], c: ['ADM'], u: ['ADM'], d: 'nonaktif', wajib: ['username', 'nama', 'role'], label: 'Akun' },
  pasien: { t: CC.T.PASIEN, r: ['ADM', 'KEP', 'HV', 'CS', 'OPS', 'KEU', 'PRW'], c: ['ADM', 'CS'], u: ['ADM', 'CS', 'KEP'], d: 'arsip', da: ['ADM', 'CS'], wajib: ['nama_pasien', 'jenis_layanan'], label: 'Pasien' },
  perawat: { t: CC.T.PHC, r: ['ADM', 'KEP', 'CS', 'HRD', 'OPS', 'KEU', 'PRW'], c: ['ADM', 'KEP', 'HRD'], u: ['ADM', 'KEP', 'HRD'], d: 'arsip', wajib: ['nama', 'jabatan'], label: 'Perawat HC' },
  perawat_hv: { t: CC.T.PHV, r: ['ADM', 'HV', 'CS', 'HRD', 'OPS', 'KEU'], c: ['ADM', 'HVK', 'HRD'], u: ['ADM', 'HVK', 'HRD'], d: 'arsip', wajib: ['nama', 'jabatan'], label: 'Perawat HV' },
  turnover: { t: CC.T.TURNOVER, r: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'], c: ['ADM', 'KEP', 'HV', 'CS', 'HRD'], u: [], d: null, wajib: ['jenis', 'pihak_nama', 'alasan_terstandar', 'tanggal_efektif'], label: 'Turnover' },
  rekrutmen: { t: CC.T.REKRUT, r: ['ADM', 'HRD'], c: ['ADM', 'HRD'], u: ['ADM', 'HRD'], d: 'arsip', wajib: ['nama', 'posisi', 'kontak'], label: 'Pelamar' },
  kasbon: { t: CC.T.KASBON, r: ['ADM', 'KEP', 'OPS', 'KEU'], c: ['KEP', 'KEU', 'ADM'], u: ['KEU', 'ADM'], d: 'batal', da: ['KEU', 'ADM'], wajib: ['perawat_id', 'jenis', 'nominal', 'cara_potong'], label: 'Kasbon/Potongan' },
  jurnal: { t: CC.T.JURNAL, r: ['ADM', 'KEU'], c: ['KEU', 'ADM'], u: ['KEU'], d: 'batal', da: ['KEU'], wajib: ['tanggal', 'tipe', 'kategori', 'nominal'], label: 'Jurnal' },
  target: { t: CC.T.TARGET, r: ['ADM', 'KEP', 'HV', 'CS', 'OPS', 'KEU'], c: ['ADM'], u: ['ADM'], d: 'arsip', wajib: ['periode', 'divisi', 'indikator', 'target'], label: 'Target' },
  paket: { t: CC.T.PAKET, r: ['ADM', 'KEP', 'CS', 'OPS', 'KEU'], c: ['ADM'], u: ['ADM'], d: 'nonaktif', wajib: ['nama_paket'], label: 'Paket' },
  penilaian: { t: CC.T.NILAI, r: ['ADM', 'KEP', 'CS', 'HRD', 'OPS'], c: ['ADM', 'CS'], u: ['ADM', 'CS'], d: 'batal', modul: 'penilaian', wajib: ['penugasan_id', 'skor_total'], label: 'Penilaian Klien' },
  kunjungan: { t: CC.T.KUNJ, r: ['ADM', 'KEP', 'CS', 'HRD', 'OPS'], c: ['ADM', 'KEP'], u: ['ADM', 'KEP'], d: 'batal', modul: 'kunjungan', wajib: ['tanggal', 'pasien_id', 'temuan'], label: 'Kunjungan' },
  mess: { t: CC.T.MESS, r: ['ADM', 'KEP', 'HRD', 'OPS'], c: ['ADM', 'KEP'], u: ['ADM', 'KEP'], d: 'batal', modul: 'mess', wajib: ['jenis', 'perawat_id'], label: 'Mess & Antar-Jemput' },
  penalti: { t: CC.T.PENALTI, r: ['ADM', 'KEP', 'HRD', 'OPS', 'KEU'], c: [], u: [], d: null, modul: 'penalti', wajib: ['perawat_id', 'jenis', 'tanggal_kejadian'], label: 'Penalti Kontrak' },
  rekap: { t: CC.T.REKAP, r: ['ADM', 'OPS'], c: ['OPS', 'ADM'], u: ['OPS'], d: null, label: 'Rekap Operasional' }
};
/* Penyaringan data sensitif DI SERVER (aturan 2, 8, 14 Bagian 3.4) */
CC.saring = function (ctx, mod, rows) {
  var e = ctx.peran, U = CC.u;
  if (mod === 'pasien') {
    if (e === 'PRW') { var ids = CC.pasienMilikPerawat(ctx.user.perawat_id); rows = rows.filter(function (r) { return ids[r.id]; }); }
    if (e === 'HV' || e === 'HVK') rows = rows.filter(function (r) { return r.jenis_layanan === 'HV'; });
    if (e === 'KEP') rows = rows.filter(function (r) { return r.jenis_layanan !== 'HV'; });
    if (e !== 'ADM' && e !== 'CS') rows = rows.map(function (r) { var c = Object.assign({}, r); c.nik_pj = U.samarkan(r.nik_pj); if (e === 'PRW') { c.nik_pj = ''; c.alamat_pj = ''; } return c; });
  }
  if (mod === 'perawat' || mod === 'perawat_hv') {
    if (e === 'PRW') rows = rows.filter(function (r) { return r.id === ctx.user.perawat_id; });
    rows = rows.map(function (r) {
      var c = Object.assign({}, r);
      var lihatNik = ['ADM', 'KEP', 'HRD', 'HVK'].indexOf(e) > -1 || (e === 'PRW');
      var lihatRek = ['ADM', 'KEP', 'KEU', 'HVK'].indexOf(e) > -1 || (e === 'PRW');
      if (!lihatNik) c.nik = U.samarkan(r.nik); if (!lihatRek) { c.no_rekening = U.samarkan(r.no_rekening); }
      return c;
    });
  }
  return rows;
};
CC.pasienMilikPerawat = function (perawatId, tanggal) {
  var hari = CC.u.tgl(tanggal), ids = {};
  CC.semua(CC.T.TUGAS).forEach(function (t) {
    if (t.perawat_id !== perawatId || t.status_arsip === 'Arsip') return;
    if (t.peran === 'Infal') { if (t.status === 'Berjalan' && hari >= t.tanggal_mulai && hari <= t.tanggal_akhir) ids[t.pasien_id] = t.id; return; }
    if (t.status === 'Berjalan') ids[t.pasien_id] = t.id;
  });
  return ids;
};
CC.lihatNominal = function (ctx) { return ['ADM', 'KEU', 'CS', 'OPS'].indexOf(ctx.peran) > -1; };
CC.lihatMargin = function (ctx) { return ['ADM', 'KEU'].indexOf(ctx.peran) > -1; };

CC.A['crud.list'] = {
  fn: function (ctx, p) {
    var m = CC.MOD[p.mod]; if (!m) CC.galat('NOT_FOUND', 'Modul tidak dikenal.');
    if (m.modul && !CC.modulAktif(m.modul)) CC.galat('MODULE_OFF', 'Fitur ini belum diaktifkan oleh Admin.');
    if (!CC.boleh(ctx.user, m.r)) CC.galat('FORBIDDEN', 'Anda tidak punya akses ke data ' + m.label + '.');
    var rows = CC.semua(m.t);
    rows = p.arsip ? rows.filter(function (r) { return r.status_arsip === 'Arsip'; }) : CC.aktifSaja(rows);
    rows = CC.saring(ctx, p.mod, rows);
    if (m.t === CC.T.USER) rows = rows.map(function (r) { var c = Object.assign({}, r); delete c.pin_hash; delete c.salt; return c; });
    if (CC.hookList && CC.hookList[p.mod]) rows = CC.hookList[p.mod](ctx, rows, p);
    return { rows: rows, total: rows.length, boleh: { tambah: CC.boleh(ctx.user, m.c), ubah: CC.boleh(ctx.user, m.u), arsip: !!m.d && CC.boleh(ctx.user, m.da || m.u) } };
  }
};
CC.A['crud.simpan'] = {
  tulis: true,
  fn: function (ctx, p) {
    var m = CC.MOD[p.mod]; if (!m) CC.galat('NOT_FOUND', 'Modul tidak dikenal.');
    if (m.modul && !CC.modulAktif(m.modul)) CC.galat('MODULE_OFF', 'Fitur ini belum diaktifkan oleh Admin.');
    var d = Object.assign({}, p.data || {}), baru = !d.id;
    if (!CC.boleh(ctx.user, baru ? m.c : m.u)) CC.galat('FORBIDDEN', baru ? 'Anda tidak boleh menambah ' + m.label + '.' : 'Data ' + m.label + ' tidak dapat diubah oleh peran Anda.');
    if (m.wajib) CC.wajib(d, m.wajib);
    ['dibuat_pada', 'dibuat_oleh', 'diubah_pada', 'diubah_oleh', 'status_arsip', 'pin_hash', 'salt', 'rev_sesi'].forEach(function (k) { delete d[k]; });
    if (m.t === CC.T.USER) delete d.foto_url;   // foto profil hanya lewat profil.foto / akun.fotoHapus
    // lampiran (foto/PDF) dikirim sebagai data URL → simpan ke Drive dulu, sel hanya menyimpan URL-nya
    Object.keys(d).forEach(function (k) { if (typeof d[k] === 'string' && /^data:/.test(d[k])) d[k] = CC.env.simpanBerkas ? CC.env.simpanBerkas(d[k], p.mod + '_' + k + '_' + CC.u.tgl().replace(/-/g, '') + '_' + String(Date.now()).slice(-6), 'Lampiran_' + p.mod).url : ''; });
    Object.keys(d).forEach(function (k) { d[k] = CC.u.bersih(d[k]); });
    if (CC.hookSimpan && CC.hookSimpan[p.mod]) d = CC.hookSimpan[p.mod](ctx, d, baru) || d;
    var row;
    if (baru) row = CC.tambah(ctx, m.t, d);
    else { var id = d.id; delete d.id; row = CC.ubah(ctx, m.t, id, d); }
    if (CC.hookSetelah && CC.hookSetelah[p.mod]) CC.hookSetelah[p.mod](ctx, row, baru);
    ctx.pesan = m.label + (baru ? ' ditambahkan.' : ' diperbarui.');
    var hasil = Object.assign({}, CC.saring(ctx, p.mod, [row])[0]);
    if (m.t === CC.T.USER) { delete hasil.pin_hash; delete hasil.salt; }
    if (ctx.ekstra) Object.assign(hasil, ctx.ekstra);
    return hasil;
  }
};
CC.A['crud.arsip'] = {
  tulis: true,
  fn: function (ctx, p) {
    var m = CC.MOD[p.mod]; if (!m) CC.galat('NOT_FOUND', 'Modul tidak dikenal.');
    if (!m.d) CC.galat('FORBIDDEN', 'Data ' + m.label + ' tidak dapat dihapus maupun diarsipkan (catatan permanen).');
    if (!CC.boleh(ctx.user, m.da || m.u)) CC.galat('FORBIDDEN', 'Anda tidak boleh mengarsipkan ' + m.label + '.');
    if (!p.alasan || String(p.alasan).trim().length < 3) CC.galat('VALIDATION', 'Alasan wajib diisi.', { alasan: 'Alasan wajib diisi' });
    var patch = {};
    if (m.d === 'arsip') patch.status_arsip = p.pulihkan ? 'Aktif' : 'Arsip';
    if (m.d === 'nonaktif') { if (m.t === CC.T.USER) patch.status_akun = p.pulihkan ? 'Aktif' : 'Nonaktif'; else if (m.t === CC.T.PAKET) patch.aktif = p.pulihkan ? 'YA' : 'TIDAK'; else patch.status = p.pulihkan ? 'Aktif' : 'Nonaktif'; }
    if (m.d === 'batal') patch.status = 'Dibatalkan';
    var row = CC.ubah(ctx, m.t, p.id, patch, { aksi: p.pulihkan ? 'PULIHKAN' : (m.d === 'batal' ? 'BATAL' : 'ARSIP'), ket: p.alasan });
    ctx.pesan = p.pulihkan ? 'Data dipulihkan.' : m.d === 'batal' ? 'Dibatalkan dengan alasan tercatat.' : 'Data diarsipkan (tidak dihapus).';
    return row;
  }
};
