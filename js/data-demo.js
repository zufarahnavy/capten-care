/* =====================================================================
 * CAPTEN CARE — DATA DEMO (BERSAMA: DataDemo.gs)
 * Data operasional homecare yang realistis, dibangkitkan relatif terhadap
 * tanggal hari ini (deterministik). Dipakai mode demo peramban dan
 * fungsi isiDataDemo() di Apps Script. Semua nama, nomor, dan alamat fiktif.
 * ===================================================================== */
var CC = (typeof CC !== 'undefined' && CC) || {};
CC.isiDataDemo = function (opsi) {
  opsi = opsi || {};
  var seed = 20261124; function acak() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function pilih(a) { return a[Math.floor(acak() * a.length)]; } function antara(a, b) { return a + Math.floor(acak() * (b - a + 1)); }
  var U = CC.u, T = CC.T, H = U.tgl(), hari = function (n) { return U.tambahHari(H, n); }, sys = { user: { id: 'SISTEM', nama: 'Sistem', role: 'ADM' }, peran: 'ADM' };
  var BLN = U.bulan(), BLN1 = U.bulan(U.parse(U.tambahBulan(BLN + '-01', -1))), BLN2 = U.bulan(U.parse(U.tambahBulan(BLN + '-01', -2)));
  function waktu(tgl, jam, mnt) { return tgl + ' ' + U.pad(jam, 2) + ':' + U.pad(mnt || 0, 2); }
  function hp(i) { return '08' + ['12', '13', '21', '57', '77', '78', '11', '52'][i % 8] + U.pad(1000 + (i * 7919) % 9000, 4) + U.pad(1000 + (i * 104729) % 9000, 4); }
  function ins(t, rows) { rows.forEach(function (r) { r.dibuat_oleh = r.dibuat_oleh || 'SISTEM'; }); return CC.tambahBanyak(sys, t, rows); }

  /* ---------- Pengaturan (bertanggal efektif) ---------- */
  var gaji1 = Object.assign({}, CC.GAJI_USULAN, { tarif_lembur_klien: 250000 }), gaji2 = Object.assign({}, CC.GAJI_USULAN);
  var setRows = [
    { grup: 'gaji', kunci: 'gaji', nilai: JSON.stringify(gaji1), berlaku_mulai: U.tambahBulan(H, -8), diubah_oleh_nama: 'M. Ridwan Syah, S.E., Ak.', alasan: 'Inisialisasi aturan gaji dari SPK & lembar gaji client', versi: 1, dibuat_pada: waktu(U.tambahBulan(H, -8), 9, 12) },
    { grup: 'gaji', kunci: 'gaji', nilai: JSON.stringify(gaji2), berlaku_mulai: BLN2 + '-01', diubah_oleh_nama: 'dr. Hendra Pratama, Sp.B', alasan: 'Penyesuaian pengganti uang cuti Rp250.000 → Rp300.000 per hari', versi: 2, dibuat_pada: waktu(U.tambahBulan(BLN2 + '-01', 0), 10, 4) },
    { grup: 'notif', kunci: 'notif', nilai: JSON.stringify(Object.assign({}, CC.BAWAAN.notif, { wa_aktif: true, email_aktif: true })), berlaku_mulai: U.tambahBulan(H, -6), diubah_oleh_nama: 'dr. Hendra Pratama, Sp.B', alasan: 'Aktifkan notifikasi (mode demo: pengiriman disimulasikan)', versi: 1 },
    { grup: 'penomoran', kunci: 'penomoran', nilai: JSON.stringify((function () { var p = CC.u.salin(CC.BAWAAN.penomoran); p.ST.mulai = 418; p.SPK.mulai = 205; p.SPKWT.mulai = 405; p.KL.mulai = 96; p.IC.mulai = 61; p.SP.mulai = 12; p.INV.mulai = 641; return p; })()), berlaku_mulai: U.tambahBulan(H, -8), diubah_oleh_nama: 'dr. Hendra Pratama, Sp.B', alasan: 'Melanjutkan nomor terakhir dokumen client', versi: 1 },
    { grup: 'modul', kunci: 'modul', nilai: JSON.stringify({ penilaian: true, kunjungan: true, mess: true, penalti: true, pc_perawat: false }), berlaku_mulai: U.tambahBulan(H, -2), diubah_oleh_nama: 'dr. Hendra Pratama, Sp.B', alasan: 'Aktifkan modul penilaian, kunjungan, mess & penalti kontrak', versi: 1 },
    { grup: 'profil', kunci: 'profil', nilai: JSON.stringify(Object.assign({}, CC.BAWAAN.profil, { penandatangan: { ST: { nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Head of Nurse' }, SPK: { nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Head of Nurse' }, SPKWT: { nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Head of Nurse' }, KL: { nama: 'dr. Hendra Pratama, Sp.B', jabatan: 'Direktur' }, INV: { nama: 'M. Ridwan Syah, S.E., Ak.', jabatan: 'Finance & Billing' }, IC: { nama: 'Ns. Hendri Saputra, A.Md.Kep', jabatan: 'Koordinator Home Visit' }, SP: { nama: 'Anisa Wulandari, S.Psi', jabatan: 'HR Manager' } } })), berlaku_mulai: U.tambahBulan(H, -8), diubah_oleh_nama: 'dr. Hendra Pratama, Sp.B', alasan: 'Profil perusahaan', versi: 1 }
  ];
  ins(T.SET, setRows); CC._setCache = null;

  /* ---------- Paket ---------- */
  var paket = ins(T.PAKET, [
    { id: 'PKT-01', nama_paket: 'Basic', aktif: 'YA', opsional: 'TIDAK', uraian_tugas: '1. Pendampingan aktivitas harian pasien\n2. Membantu mandi, berpakaian, dan makan\n3. Mobilisasi ringan dan pencegahan jatuh\n4. Pemberian obat oral sesuai jadwal\n5. Mengisi laporan harian per shift', keterangan_layanan: 'Pendampingan tanpa alat medis', harga_bawaan: 5500000, satuan_harga: 'bulan', gaji_bawaan: 3600000, metode_gaji_bawaan: 'A', gambar: 'assets/ilustrasi/paket-basic.svg', urutan: 1 },
    { id: 'PKT-02', nama_paket: 'Premium', aktif: 'YA', opsional: 'TIDAK', uraian_tugas: '1. Seluruh tugas paket Basic\n2. Perawatan pasien tirah baring (alih baring tiap 2 jam)\n3. Perawatan kulit & pencegahan dekubitus\n4. Pemantauan TTV & gula darah\n5. Latihan ROM pasif sesuai arahan fisioterapis', keterangan_layanan: 'Perawatan pasien tirah baring', harga_bawaan: 7800000, satuan_harga: 'bulan', gaji_bawaan: 4000000, metode_gaji_bawaan: 'A', gambar: 'assets/ilustrasi/paket-premium.svg', urutan: 2 },
    { id: 'PKT-03', nama_paket: 'VIP', aktif: 'YA', opsional: 'TIDAK', uraian_tugas: '1. Seluruh tugas paket Premium\n2. Perawatan alat medis (NGT, kateter, trakeostomi, oksigen)\n3. Pemberian nutrisi enteral & obat via NGT\n4. Perawatan luka sederhana\n5. Koordinasi dengan dokter penanggung jawab', keterangan_layanan: 'Perawat menetap 24 jam dengan alat medis', harga_bawaan: 13500000, satuan_harga: 'bulan', gaji_bawaan: 4600000, metode_gaji_bawaan: 'A', gambar: 'assets/ilustrasi/paket-vip.svg', urutan: 3 },
    { id: 'PKT-04', nama_paket: 'Intensif', aktif: 'TIDAK', opsional: 'YA', uraian_tugas: '1. Seluruh tugas paket VIP\n2. Pemantauan intensif dengan monitor & oksigen\n3. Suction dan perawatan trakeostomi lanjutan', keterangan_layanan: 'Pemantauan intensif (menu opsional)', harga_bawaan: 18500000, satuan_harga: 'bulan', gaji_bawaan: 5200000, metode_gaji_bawaan: 'A', gambar: 'assets/ilustrasi/paket-intensif.svg', urutan: 4 }
  ]);
  var HARGA = { 'PKT-01': 5500000, 'PKT-02': 7800000, 'PKT-03': 13500000 }, GAJI = { 'PKT-01': 3600000, 'PKT-02': 4000000, 'PKT-03': 4600000 };

  /* ---------- Perawat ---------- */
  var namaHC = ['Ns. Rina Marlina, S.Kep', 'Ns. Ayu Lestari, S.Kep', 'Ns. Fitri Handayani, S.Kep', 'Ns. Dian Permata, A.Md.Kep', 'CG. Sri Wahyuni', 'Ns. Hendra Wijaya, S.Kep', 'Ns. Dimas Setiawan, S.Kep', 'CG. Nur Aini', 'Ns. Bayu Pratama, A.Md.Kep', 'Ns. Yulia Indah, S.Kep', 'Ns. Farhan Hakim, A.Md.Kep', 'CG. Tri Wulandari', 'Ns. Rizky Ananda, S.Kep', 'CG. Maya Safitri', 'Ns. Teguh Prayoga, A.Md.Kep', 'Bdn. Siti Rahmawati, A.Md.Keb', 'Ns. Andi Saputra, S.Kep', 'CG. Wulan Sari', 'Ns. Putri Maharani, S.Kep', 'Ns. Agus Salim, A.Md.Kep', 'CG. Lina Marlina', 'Ns. Kurniawati, S.Kep', 'CG. Ratih Purnamasari', 'Ns. Fajar Nugroho, S.Kep', 'CG. Eka Susanti', 'Ns. Gilang Ramadhan, A.Md.Kep', 'CG. Dewi Anggraini', 'Ns. Melati Kusuma, S.Kep', 'CG. Suryani', 'Ns. Rahmat Hidayat, S.Kep', 'CG. Intan Permatasari', 'Ns. Sinta Dewi, S.Kep', 'CG. Rohmah', 'Ns. Arif Rahman, A.Md.Kep', 'CG. Yanti Mulyani', 'Ns. Della Puspita, S.Kep', 'CG. Sukma Wati', 'Ns. Rendy Kurnia, A.Md.Kep', 'CG. Ani Setiawati', 'Ns. Novi Andriani, A.Md.Kep'];
  var wil = CC.BAWAAN.master.wilayah, bank = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI'];
  var phc = ins(T.PHC, namaHC.map(function (n, i) {
    var cg = n.indexOf('CG.') === 0, l = /Hendra|Dimas|Bayu|Farhan|Rizky|Teguh|Andi|Agus|Fajar|Gilang|Rahmat/.test(n), mulai = U.tambahHari(H, -antara(120, 900));
    return { id: 'PHC-' + U.pad(i + 1, 3), nama: n, jabatan: cg ? 'Caregiver' : /Bdn/.test(n) ? 'Bidan' : /S\.Kep/.test(n) ? 'Perawat (Ners)' : 'Perawat (D3)', pendidikan: cg ? 'SMK Kesehatan' : /S\.Kep/.test(n) ? 'S1 Keperawatan + Profesi Ners' : 'D3 Keperawatan', no_str: cg ? '' : '3101' + U.pad(520000 + i * 337, 6) + '-' + U.pad(i * 13 % 99, 2), str_berlaku: cg ? '' : U.tambahBulan(H, antara(3, 40)), jenis_kelamin: l ? 'L' : 'P', tgl_lahir: (1985 + (i % 14)) + '-' + U.pad(1 + i % 12, 2) + '-' + U.pad(3 + (i * 7) % 25, 2), no_wa: hp(i + 11), email: n.replace(/^(Ns\.|CG\.|Bdn\.)\s*/, '').split(',')[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@captencare.id', domisili: pick2(wil, i), wilayah: pick2(wil, i), alamat_ktp: 'Jl. ' + pilih(['Melati', 'Kenanga', 'Anggrek', 'Mawar', 'Cempaka', 'Flamboyan', 'Dahlia']) + ' No. ' + antara(2, 88) + ', ' + pick2(wil, i), nik: '3174' + U.pad(antara(100000, 999999), 6) + U.pad(antara(100000, 999999), 6), bank_ewallet: i === 2 || i === 15 ? '' : bank[i % 5], no_rekening: i === 2 || i === 15 ? '' : String(antara(1000000000, 9999999999)), nama_pemilik_rekening: i === 2 || i === 15 ? '' : n.replace(/^(Ns\.|CG\.|Bdn\.)\s*/, '').split(',')[0], status: i >= 38 ? 'Nonaktif' : 'Aktif', tanggal_mulai: mulai, akhir_kontrak: i === 6 ? hari(12) : i === 20 ? hari(19) : i === 25 ? hari(27) : U.tambahBulan(H, antara(2, 10)), masa_training_sampai: i === 2 ? hari(6) : i === 28 ? hari(11) : '', hasil_training: i === 2 || i === 28 ? 'Training' : 'Lulus', kompetensi: pilih(['NGT, Kateter, ICU', 'Lansia & Stroke', 'Perawatan Luka Dekubitus', 'Demensia & Paliatif', 'Diabetes & Insulin', 'Trakeostomi & Suction']), status_siaga: [12, 13, 14, 26].indexOf(i) > -1 ? 'Standby' : '', catatan: '' };
  }));
  function pick2(a, i) { return a[(i * 3) % a.length]; }
  var phv = ins(T.PHV, [['Ns. Hendri Saputra, A.Md.Kep', 'Pasang/lepas NGT, kateter, infus'], ['Ns. Laras Ayuningtyas, S.Kep', 'Perawatan luka modern dressing, injeksi'], ['Ns. Bagas Pratama, S.Kep', 'Infus vitamin, injeksi'], ['Ns. Citra Lestari, A.Md.Kep', 'Kateter, perawatan luka'], ['Ns. Yoga Firmansyah, S.Kep', 'NGT, infus'], ['Ns. Anisa Rahma, S.Kep', 'Perawatan luka diabetik']].map(function (x, i) { return { id: 'PHV-' + U.pad(i + 1, 3), nama: x[0], jabatan: 'Perawat Home Visit', jenis_kelamin: /Hendri|Bagas|Yoga/.test(x[0]) ? 'L' : 'P', no_wa: hp(i + 61), email: x[0].replace(/^Ns\.\s*/, '').split(',')[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@captencare.id', alamat_ktp: 'Jl. Pemuda No. ' + (10 + i) + ', Jakarta Timur', nik: '3175' + U.pad(antara(100000, 999999), 6) + U.pad(antara(100000, 999999), 6), bank_ewallet: bank[i % 5], no_rekening: String(antara(1000000000, 9999999999)), nama_pemilik_rekening: x[0].replace(/^Ns\.\s*/, '').split(',')[0], kompetensi_tindakan: x[1], status: 'Aktif', jadwal_kunjungan: 'Senin–Sabtu 08.00–17.00', akhir_kontrak: U.tambahBulan(H, antara(3, 9)) }; }));

  /* ---------- Akun (8 peran) ---------- */
  var pinStaf = opsi.pinStaf || '246810', pinKuat = opsi.pinKuat || 'capten2026', wajib = opsi.wajibGanti ? 'YA' : 'TIDAK';
  var akun = [['direksi', 'dr. Hendra Pratama, Sp.B', 'ADM', '', ''], ['koordinator', 'Ns. Ratna Dewi, S.Kep', 'KEP', '', ''], ['perawat', 'Ns. Rina Marlina, S.Kep', 'PRW', '', 'PHC-001'], ['perawat2', 'Ns. Ayu Lestari, S.Kep', 'PRW', '', 'PHC-002'], ['perawat3', 'Ns. Fitri Handayani, S.Kep', 'PRW', '', 'PHC-003'], ['homevisit', 'Ns. Hendri Saputra, A.Md.Kep', 'HV', 'KOORDINATOR', 'PHV-001'], ['perawathv', 'Ns. Laras Ayuningtyas, S.Kep', 'HV', 'PERAWAT', 'PHV-002'], ['cs', 'Amanda Putri Lestari', 'CS', '', ''], ['cs2', 'Dimas Ardiansyah', 'CS', '', ''], ['hrd', 'Anisa Wulandari, S.Psi', 'HRD', '', ''], ['operasional', 'Bayu Kurniawan', 'OPS', '', ''], ['keuangan', 'M. Ridwan Syah, S.E., Ak.', 'KEU', 'KEUANGAN', ''], ['pettycash', 'Siti Nurhaliza', 'KEU', 'PETTY_CASH', '']];
  var users = ins(T.USER, akun.map(function (a, i) { var kuat = a[2] === 'ADM' || a[2] === 'KEU', salt = CC.env.uuid(); return { id: 'USR-' + U.pad(i + 101, 3), username: a[0], nama: a[1], role: a[2], sub_role: a[3], perawat_id: a[4], pin_hash: CC.env.hashPin(kuat ? pinKuat : pinStaf, salt), salt: salt, status_akun: 'Aktif', no_wa: hp(i + 140), email: a[0] + '@captencare.id', percobaan_gagal: 0, terkunci_sampai: '', terakhir_login: waktu(hari(-1), 8, 10 + i), wajib_ganti_pin: wajib, rev_sesi: '' }; }));
  var CS1 = 'USR-108', CS2 = 'USR-109';

  /* ---------- Pasien ---------- */
  var P = [
    ['Tn. H. Ahmad Dahlan', 'L', 68, 'Post Stroke Iskemik (Hemiparesis Dextra) + Hipertensi Stage II', 'PKT-03', 'Jl. Bukit Golf Indah Blok D-14, Pondok Indah', 'Jakarta Selatan', 'Bpk. Irfan Dahlan', 'Anak', { alergi: 'Penisilin (Amoxicillin) — eritema luas & urtikaria', risiko_jatuh: 65, diet: 'Diabetasol NGT 6×200 kkal', golongan_darah: 'O Rhesus (+)', agama: 'Islam', alat: [{ nama: 'NGT Silicone', ukuran: 'Fr 16', dipasang: hari(-10), ganti: hari(20) }, { nama: 'Kateter Foley 2-Way', ukuran: 'No. 16 · balon 15cc', dipasang: hari(-16), ganti: hari(14) }], obat: [['Amlodipine', '10 mg', '08.00'], ['Citicoline', '500 mg', '08.00'], ['Clopidogrel', '75 mg', '12.00']], insulin: [['Novorapid', '6 IU', '12.15']] }],
    ['Ny. Ratna Sari', 'P', 64, 'Post Stroke + Demensia Vaskular (Sundowning)', 'PKT-03', 'Jl. Teuku Umar No. 21, Menteng', 'Jakarta Pusat', 'Bpk. Hendro Wicaksono', 'Anak', { alergi: 'Telur putih (urtikaria)', risiko_jatuh: 65, diet: 'Lunak rendah garam', alat: [{ nama: 'NGT Silicone', ukuran: 'Fr 16', dipasang: hari(-14), ganti: hari(16) }], obat: [['Donepezil', '5 mg', '20.00'], ['Amlodipine', '5 mg', '08.00']] }],
    ['Ny. Siti Aminah', 'P', 71, 'DM Tipe 2 + Ulkus Pedis Dextra', 'PKT-02', 'Jl. Boulevard Barat Raya No. 9, Kelapa Gading', 'Jakarta Utara', 'Ibu Dewi Kartika', 'Anak', { alergi: '-', risiko_jatuh: 45, diet: 'Diet DM 1.700 kkal', obat: [['Metformin', '500 mg', '07.00'], ['Glimepiride', '2 mg', '07.00']], insulin: [['Lantus', '12 IU', '21.00']] }],
    ['Ny. Hj. Fatimah', 'P', 82, 'Osteoartritis Kronis + Geriatri Frailty', 'PKT-02', 'Jl. Bintaro Utama Sektor 9 Blok E2', 'Tangerang Selatan', 'Bpk. Yusuf Hidayat', 'Anak', { alergi: '-', risiko_jatuh: 70, diet: 'Biasa, tinggi kalsium', obat: [['Meloxicam', '7,5 mg', '08.00'], ['Kalsium Laktat', '500 mg', '12.00']] }],
    ['Tn. Bambang Irawan', 'L', 59, 'Parkinson Stadium 2', 'PKT-01', 'Jl. Tebet Barat Dalam VI No. 4', 'Jakarta Selatan', 'Ibu Sri Rahayu', 'Istri', { alergi: '-', risiko_jatuh: 50, obat: [['Levodopa/Carbidopa', '100/25 mg', '07.00']] }],
    ['Tn. Tan Jin Ho', 'L', 76, 'Demensia Alzheimer + Perawatan Paliatif', 'PKT-03', 'Jl. Kelapa Hybrida Raya QF-3, Kelapa Gading', 'Jakarta Utara', 'Ibu Lily Tanoto', 'Anak', { alergi: 'Sulfa', risiko_jatuh: 60, alat: [{ nama: 'Kateter Foley', ukuran: 'No. 16', dipasang: hari(-8), ganti: hari(22) }] }],
    ['Ny. Lies Hartati', 'P', 73, 'Fraktur Femur Post-Op (ORIF) Hari ke-21', 'PKT-02', 'Jl. Cilandak KKO No. 14', 'Jakarta Selatan', 'Bpk. Teddy Hartanto', 'Anak', { alergi: '-', risiko_jatuh: 75, obat: [['Paracetamol', '500 mg', 'k/p']] }],
    ['Tn. Kevin Pratama', 'L', 24, 'Post Operasi Laparotomi Hari ke-10', 'PKT-01', 'Jl. Cempaka Putih Tengah No. 33', 'Jakarta Pusat', 'Ibu Rosa Pratama', 'Ibu', { alergi: '-', risiko_jatuh: 20 }],
    ['Tn. Sutrisno', 'L', 80, 'PPOK + Bedridden', 'PKT-03', 'Jl. Rawamangun Muka Raya No. 5', 'Jakarta Timur', 'Bpk. Agung Sutrisno', 'Anak', { alergi: '-', risiko_jatuh: 60, alat: [{ nama: 'Oksigen konsentrator', ukuran: '2 lpm', dipasang: hari(-30), ganti: '' }] }],
    ['Ny. Halimah', 'P', 77, 'Gagal Ginjal Kronik (HD 2×/minggu)', 'PKT-02', 'Jl. Gandaria Tengah III No. 7, Kebayoran Baru', 'Jakarta Selatan', 'Ibu Nur Halimah', 'Anak', { alergi: '-', risiko_jatuh: 55, diet: 'Rendah kalium, cairan 600 ml/hari' }],
    ['Tn. Gunawan Santoso', 'L', 66, 'Post CABG Minggu ke-5', 'PKT-02', 'Jl. Puri Indah Raya Blok U2', 'Jakarta Barat', 'Ibu Melinda Santoso', 'Istri', { alergi: 'Aspirin', risiko_jatuh: 35 }],
    ['Ny. Linda Kusumawati', 'P', 69, 'Kanker Payudara Stadium IV (Paliatif)', 'PKT-03', 'Jl. Pondok Labu Raya No. 18', 'Jakarta Selatan', 'Bpk. Antonius Kusuma', 'Suami', { alergi: '-', risiko_jatuh: 50 }],
    ['Tn. Suryo Hadiprojo', 'L', 84, 'Pneumonia Pemulihan + Geriatri', 'PKT-01', 'Jl. Cikini Raya No. 40, Menteng', 'Jakarta Pusat', 'Ibu Ratih Hadiprojo', 'Anak', { alergi: '-', risiko_jatuh: 65 }],
    ['Ny. Sri Mulyani', 'P', 67, 'Hipertensi + CHF NYHA II', 'PKT-02', 'Jl. Pejaten Barat No. 11', 'Jakarta Selatan', 'Bpk. Rudi Hartono', 'Anak', { alergi: '-', risiko_jatuh: 40 }],
    ['Tn. Robert Siahaan', 'L', 74, 'Parkinson + Disfagia (NGT)', 'PKT-03', 'Jl. Kayu Putih Raya No. 2', 'Jakarta Timur', 'Ibu Grace Siahaan', 'Anak', { alergi: '-', risiko_jatuh: 70, alat: [{ nama: 'NGT', ukuran: 'Fr 14', dipasang: hari(-20), ganti: hari(10) }] }],
    ['Ny. Endang Purwanti', 'P', 81, 'Demensia Alzheimer', 'PKT-02', 'Jl. Margonda Raya Gg. Sawo No. 8', 'Depok', 'Bpk. Wawan Purwanto', 'Anak', { alergi: '-', risiko_jatuh: 60 }],
    ['Tn. Andreas Wijaya', 'L', 61, 'Post TKR (Total Knee Replacement) Kanan', 'PKT-01', 'Jl. Kemang Pratama Raya Blok AA', 'Bekasi', 'Ibu Clara Wijaya', 'Istri', { alergi: '-', risiko_jatuh: 45 }],
    ['Ny. Kartini Wulandari', 'P', 75, 'DM Tipe 2 + Neuropati Perifer', 'PKT-01', 'Jl. Raya Bogor KM 26 No. 3', 'Jakarta Timur', 'Bpk. Eko Wulandaru', 'Anak', { alergi: '-', risiko_jatuh: 55, insulin: [['Novorapid', '4 IU', '18.30']] }],
    ['Tn. Ismail Marzuki', 'L', 83, 'Bedridden + Dekubitus Grade III Sakrum', 'PKT-03', 'Jl. H. Nawi Raya No. 12, Gandaria', 'Jakarta Selatan', 'Ibu Nurul Marzuki', 'Anak', { alergi: '-', risiko_jatuh: 80, alat: [{ nama: 'Kateter Foley', ukuran: 'No. 16', dipasang: hari(-5), ganti: hari(25) }] }],
    ['Ny. Yohana Simanjuntak', 'P', 70, 'Post Stroke + Afasia Motorik', 'PKT-02', 'Jl. Matraman Raya No. 77', 'Jakarta Timur', 'Bpk. Daniel Simanjuntak', 'Anak', { alergi: '-', risiko_jatuh: 60 }],
    ['Tn. Hasan Basri', 'L', 72, 'Gagal Jantung Kongestif', 'PKT-02', 'Jl. Tanjung Duren Raya No. 9', 'Jakarta Barat', 'Ibu Rina Basri', 'Anak', { alergi: '-', risiko_jatuh: 45 }],
    ['Ny. Rukmini', 'P', 86, 'Geriatri Frailty + Inkontinensia Urin', 'PKT-01', 'Jl. Pamulang Permai Blok B4', 'Tangerang Selatan', 'Bpk. Joko Susilo', 'Anak', { alergi: '-', risiko_jatuh: 75 }],
    ['Tn. Benny Tanuwijaya', 'L', 65, 'Kanker Paru (Paliatif, O2 Konsentrator)', 'PKT-03', 'Jl. Pluit Karang Utara No. 20', 'Jakarta Utara', 'Ibu Vivian Tanuwijaya', 'Istri', { alergi: '-', risiko_jatuh: 55, alat: [{ nama: 'Oksigen konsentrator', ukuran: '3 lpm', dipasang: hari(-40), ganti: '' }] }],
    ['Ny. Martha Lumbantobing', 'P', 68, 'Post Op Hip Replacement', 'PKT-02', 'Jl. Cipinang Indah Raya No. 3', 'Jakarta Timur', 'Bpk. Samuel Tobing', 'Anak', { alergi: '-', risiko_jatuh: 70 }],
    ['Tn. Slamet Riyadi', 'L', 77, 'PPOK Eksaserbasi Pemulihan', 'PKT-01', 'Jl. Sawangan Raya No. 15', 'Depok', 'Ibu Siti Riyadi', 'Istri', { alergi: '-', risiko_jatuh: 50 }],
    ['Ny. Aisyah Rahmawati', 'P', 74, 'Stroke Berulang + NGT', 'PKT-03', 'Jl. Ciputat Raya No. 48', 'Tangerang Selatan', 'Bpk. Fauzan Rahman', 'Anak', { alergi: '-', risiko_jatuh: 70, alat: [{ nama: 'NGT', ukuran: 'Fr 16', dipasang: hari(-12), ganti: hari(18) }] }],
    ['Tn. Wahyu Hidayat', 'L', 60, 'Cedera Medula Spinalis (Kateter Menetap)', 'PKT-02', 'Jl. Galaxy Raya No. 6', 'Bekasi', 'Ibu Desi Hidayat', 'Istri', { alergi: '-', risiko_jatuh: 65, alat: [{ nama: 'Kateter Foley', ukuran: 'No. 18', dipasang: hari(-9), ganti: hari(21) }] }],
    ['Ny. Theresia Gunadi', 'P', 79, 'Demensia + Diabetes Melitus', 'PKT-02', 'Jl. Taman Aries Blok E1', 'Jakarta Barat', 'Bpk. Felix Gunadi', 'Anak', { alergi: '-', risiko_jatuh: 60 }],
    ['Tn. H. Sukardi', 'L', 76, 'Stroke Hemoragik Pemulihan', 'PKT-02', 'Jl. Bintaro Raya Sektor 7 No. 21', 'Tangerang Selatan', 'Bpk. Aditya Pratama', 'Anak', { alergi: '-', risiko_jatuh: 70 }],
    ['Ny. Warsiti', 'P', 79, 'Lansia Mandiri dengan Risiko Jatuh', 'PKT-01', 'Jl. Bangka Raya No. 30, Mampang', 'Jakarta Selatan', 'Bpk. Bambang Trihatmojo', 'Anak', { alergi: '-', risiko_jatuh: 60 }]
  ];
  var HV = [['Tn. Johan Kurniawan', 'L', 55, 'Kelelahan kronis — Infus Vitamin Booster', 'Jl. Senopati No. 50', 'Jakarta Selatan', 'Tn. Johan Kurniawan', 'Diri sendiri'], ['Ny. Indah Puspita', 'P', 62, 'Retensi urin — ganti kateter rutin', 'Jl. Tebet Utara II No. 9', 'Jakarta Selatan', 'Bpk. Hari Puspito', 'Suami'], ['Tn. Hartono', 'L', 63, 'Ulkus Diabetikum Pedis Stadium 3', 'Jl. Cempaka Baru No. 4', 'Jakarta Pusat', 'Ibu Sarah Wijaya', 'Anak'], ['Ny. Kurnia Sari', 'P', 70, 'Disfagia post stroke — pasang NGT', 'Jl. Tebet Raya No. 70', 'Jakarta Selatan', 'Ibu Maya Rosita', 'Anak'], ['Tn. Rudi Hermawan', 'L', 58, 'Perawatan luka post op hernia', 'Jl. Kalibata Timur No. 3', 'Jakarta Selatan', 'Ibu Lina Hermawan', 'Istri']];
  var pasRows = P.map(function (x, i) {
    var info = x[9]; info.obat = (info.obat || []).map(function (o) { return { nama: o[0], dosis: o[1], jam: o[2] }; }); info.insulin = (info.insulin || []).map(function (o) { return { nama: o[0], dosis: o[1], jam: o[2] }; }); info.mr = 'MR-' + U.pad(1200 + i * 17, 5);
    var aktif = i < 28, status = i === 28 ? 'Lead' : i === 29 ? 'Lead' : aktif ? 'Aktif' : 'Nonaktif';
    return { id: 'PSN-' + U.pad(i + 1, 4), nama_pasien: x[0], jenis_kelamin: x[1], tgl_lahir: (CC.env.now().getFullYear() - x[2]) + '-' + U.pad(1 + (i * 5) % 12, 2) + '-' + U.pad(2 + (i * 3) % 26, 2), alamat: x[5] + ', ' + x[6], wilayah: x[6], diagnosa: x[3], keluhan: '', jenis_layanan: 'HC', paket_id: x[4], nama_pj: x[7], relasi_pj: x[8], nik_pj: '3171' + U.pad(antara(100000, 999999), 6) + U.pad(antara(100000, 999999), 6), alamat_pj: x[5] + ', ' + x[6], no_telp_pj: hp(i + 300), no_wa_pj: hp(i + 300), email_pj: i % 3 === 0 ? '' : x[7].replace(/^(Bpk\.|Ibu|Tn\.|Ny\.)\s*/, '').toLowerCase().replace(/[^a-z]+/g, '.') + '@gmail.com', persetujuan_data: 'YA', status: status, status_klien: i % 4 === 1 ? 'New' : 'Existing', perawat_id: '', penerima_laporan: '', sumber_lead: pilih(['WhatsApp', 'Instagram', 'Referral', 'Referral Dokter/RS', 'Website']), info_klinis: JSON.stringify(info), dibuat_pada: waktu(U.tambahHari(H, -antara(40, 300)), 10, 0) };
  }).concat(HV.map(function (x, i) { return { id: 'PSN-' + U.pad(P.length + i + 1, 4), nama_pasien: x[0], jenis_kelamin: x[1], tgl_lahir: (CC.env.now().getFullYear() - x[2]) + '-0' + (i + 2) + '-1' + i, alamat: x[4] + ', ' + x[5], wilayah: x[5], diagnosa: x[3], jenis_layanan: 'HV', nama_pj: x[6], relasi_pj: x[7], alamat_pj: x[4] + ', ' + x[5], no_telp_pj: hp(i + 400), no_wa_pj: hp(i + 400), email_pj: '', persetujuan_data: 'YA', status: 'Aktif', status_klien: 'New', sumber_lead: 'WhatsApp', info_klinis: '{}' }; }));
  pasRows[0].penerima_laporan = JSON.stringify([{ nama: 'Bpk. Irfan Dahlan', relasi: 'Anak', wa: pasRows[0].no_wa_pj, email: 'irfan.dahlan@example.com', aktif: true }, { nama: 'Ibu Ratna Dahlan', relasi: 'Istri', wa: hp(777), email: '', aktif: true }]);
  var pasien = ins(T.PASIEN, pasRows);

  /* ---------- Penugasan (aktif + riwayat sebelumnya) ---------- */
  var tugas = [], so = [], tIdx = 1;
  function tg(o) { o.id = 'PGS-' + U.pad(tIdx++, 4); tugas.push(o); return o; }
  var mulaiOffset = [-6, -12, -27, -19, -9, -28, -3, -15, -22, -11, -17, -5, -26, -14, -8, -20, -2, -24, -10, -16, -13, -21, -7, -18, -4, -25, -23, -1];
  var pool = []; for (var pn = 4; pn <= 38; pn++) if ([5, 13, 14, 27].indexOf(pn) === -1) pool.push('PHC-' + U.pad(pn, 3));
  P.slice(0, 28).forEach(function (x, i) {
    var pid = 'PSN-' + U.pad(i + 1, 4), pk = x[4], lama = i === 7 ? 15 : i === 24 ? 14 : 30, mulai = hari(mulaiOffset[i]), shift = pk === 'PKT-03' ? '24J' : 'PAGI';
    var prw = i === 0 ? 'PHC-001' : i === 1 ? 'PHC-002' : pool.shift();
    var gd = GAJI[pk] - (i % 5 === 3 ? 200000 : 0);
    var prev2 = i < 18 ? tg({ pasien_id: pid, perawat_id: prw, peran: 'Utama', paket_id: pk, tanggal_mulai: U.tambahHari(mulai, -60), lama_hari: 30, tanggal_akhir: U.tambahHari(mulai, -31), status: 'Diperpanjang', shift: shift, gaji_deal: gd, metode_gaji: 'A', tugas_pendek: 'TIDAK', jatah_libur: 4 }) : null;
    var prev = i < 24 ? tg({ pasien_id: pid, perawat_id: prw, peran: 'Utama', paket_id: pk, tanggal_mulai: U.tambahHari(mulai, -30), lama_hari: 30, tanggal_akhir: U.tambahHari(mulai, -1), status: 'Diperpanjang', shift: shift, gaji_deal: gd, metode_gaji: 'A', tugas_pendek: 'TIDAK', jatah_libur: 4, penugasan_asal: prev2 ? prev2.id : '' }) : null;
    var t = tg({ pasien_id: pid, perawat_id: prw, peran: 'Utama', paket_id: pk, tanggal_mulai: mulai, lama_hari: lama, tanggal_akhir: U.tambahHari(mulai, lama - 1), status: 'Berjalan', shift: shift, gaji_deal: gd, metode_gaji: lama < 30 ? 'B' : 'A', tugas_pendek: lama < 30 ? 'YA' : 'TIDAK', jatah_libur: 4, penugasan_asal: prev ? prev.id : '' });
    pasien[i].perawat_id = prw;
    x.tugas = t; x.prev = prev; x.prev2 = prev2;
  });
  [2, 9, 13].forEach(function (i) { var x = P[i], t0 = x.tugas; tg({ pasien_id: t0.pasien_id, perawat_id: pool.shift(), peran: 'Utama', paket_id: t0.paket_id, tanggal_mulai: t0.tanggal_mulai, lama_hari: t0.lama_hari, tanggal_akhir: t0.tanggal_akhir, status: 'Berjalan', shift: 'MALAM', gaji_deal: 3800000, metode_gaji: 'A', tugas_pendek: 'TIDAK', jatah_libur: 4 }); });
  // rotasi berjalan: Ny. Ratna Sari — Ns. Ayu (lama) akan diganti Ns. Fitri
  P[1].tugas.catatan = 'Rotasi ke Ns. Fitri Handayani dijadwalkan ' + U.tglPanjang(hari(6));
  // infal hari ini menggantikan libur
  var infal1 = tg({ pasien_id: 'PSN-0004', perawat_id: 'PHC-005', peran: 'Infal', paket_id: 'PKT-02', tanggal_mulai: hari(-1), lama_hari: 3, tanggal_akhir: hari(1), status: 'Berjalan', shift: 'PAGI', gaji_deal: 3600000, metode_gaji: 'B', tugas_pendek: 'YA', jatah_libur: 0, penugasan_asal: P[3].tugas.id });
  ins(T.TUGAS, tugas);
  CC.ubahBanyak(sys, T.PASIEN, pasien.slice(0, 28).map(function (p) { return { id: p.id, perawat_id: p.perawat_id }; }));

  /* ---------- Libur/cuti/lembur ---------- */
  var libur = [];
  tugas.forEach(function (t, k) {
    if (t.peran !== 'Utama') return;
    var akhir = t.tanggal_akhir < H ? t.tanggal_akhir : hari(-1), n = Math.min(4, Math.max(0, Math.floor(U.selisihHari(t.tanggal_mulai, akhir) / 8)));
    for (var j = 0; j < n; j++) { var tglL = U.tambahHari(t.tanggal_mulai, 5 + j * 7 + (k % 3)); if (tglL > akhir) break; libur.push({ penugasan_id: t.id, perawat_id: t.perawat_id, pasien_id: t.pasien_id, tanggal: tglL, jenis: k % 11 === 4 && j === 1 ? 'Lembur' : k % 13 === 6 && j === 0 ? 'Sakit' : 'Libur jatah', jumlah: 1, disetujui_keluarga: 'YA', dikonfirmasi_kantor: 'YA', status: 'Tercatat', tarif_klien: k % 11 === 4 && j === 1 ? 300000 : '' }); }
  });
  libur.push({ penugasan_id: P[3].tugas.id, perawat_id: P[3].tugas.perawat_id, pasien_id: 'PSN-0004', tanggal: hari(-1), jenis: 'Cuti', jumlah: 3, perawat_pengganti_id: 'PHC-005', penugasan_infal_id: infal1.id, disetujui_keluarga: 'YA', dikonfirmasi_kantor: 'YA', status: 'Tercatat', catatan: 'Cuti keluarga 3 hari, diganti infal CG. Sri Wahyuni' });
  var lib = ins(T.LIBUR, libur);
  var libMap = {}; lib.forEach(function (l) { for (var q = 0; q < Number(l.jumlah || 1); q++) libMap[l.penugasan_id + '|' + U.tambahHari(l.tanggal, q)] = l.jenis; });

  /* ---------- Absensi kisi (bulan lalu & bulan ini s.d. kemarin) ---------- */
  var abs = [], awalAbs = BLN2 + '-01';
  tugas.forEach(function (t) {
    if (t.status === 'Dibatalkan') return;
    for (var h = t.tanggal_mulai < awalAbs ? awalAbs : t.tanggal_mulai; h <= t.tanggal_akhir && h < H; h = U.tambahHari(h, 1)) {
      var j = libMap[t.id + '|' + h], st = !j || j === 'Lembur' ? 'Bertugas' : j === 'Libur jatah' ? 'Libur' : j;
      abs.push({ tanggal: h, perawat_id: t.perawat_id, penugasan_id: t.id, pasien_id: t.pasien_id, status_kehadiran: st, shift: t.shift, catatan: '', diinput_oleh: 'Ns. Ratna Dewi, S.Kep' });
    }
  });
  ins(T.ABS_HC, abs);
  var absHv = []; for (var dh = U.tambahHari(H, -24); dh < H; dh = U.tambahHari(dh, 1)) { if (U.parse(dh).getDay() === 0) continue; phv.forEach(function (p, i) { absHv.push({ tanggal: dh, perawat_hv_id: p.id, status_kehadiran: (i + U.parse(dh).getDate()) % 17 === 0 ? 'Izin' : 'Bertugas', diinput_oleh: 'Ns. Hendri Saputra, A.Md.Kep' }); }); }
  ins(T.ABS_HV, absHv);

  /* ---------- Laporan harian A–H (30 hari terakhir; >10 hari diringkas agar hemat penyimpanan) ---------- */
  var fmt = CC.BAWAAN.format_laporan, lap = [], now = U.dt(), kondisiKhusus = { 'PSN-0006': 'Perlu pemantauan', 'PSN-0015': 'Mengalami perubahan kondisi', 'PSN-0002': 'Perlu pemantauan' };
  tugas.forEach(function (t, k) {
    if (t.status === 'Dibatalkan') return;
    var info = U.json((pasRows.filter(function (p) { return p.id === t.pasien_id; })[0] || {}).info_klinis, {});
    for (var h = U.tambahHari(H, -29); h <= H; h = U.tambahHari(h, 1)) {
      if (h < t.tanggal_mulai || h > t.tanggal_akhir) continue;
      var lama = h < hari(-9);
      CC.shiftTugas(t).forEach(function (s) {
        var batas = CC.batasLaporan(h, s); if (h === H && now < batas && acak() < 0.6) return;
        var r = acak(); if (r < 0.04 || (h === H && r < 0.25) || (t.pasien_id === 'PSN-0013' && h >= hari(-1))) return;
        var telat = r > 0.93, bd = U.parse(batas), wt = U.dt(new Date(bd.getTime() + (telat ? antara(70, 260) : -antara(25, 170)) * 60000));
        if (wt > now) wt = now;
        var kond = h >= hari(-1) && kondisiKhusus[t.pasien_id] && s !== 'MALAM' ? kondisiKhusus[t.pasien_id] : 'Stabil';
        var sis = 110 + antara(5, 35) + (kond !== 'Stabil' ? 15 : 0), dia = 70 + antara(0, 18), suhu = (36.3 + acak() * 0.8 + (kond === 'Mengalami perubahan kondisi' ? 1.2 : 0)).toFixed(1), spo = String(Math.min(99, 95 + antara(0, 4) - (kond !== 'Stabil' ? 2 : 0)));
        var B = fmt.B.map(function (x, q) { return acak() < 0.9 || q > 12 ? 'Y' : 'T'; }), alat = (info.alat || []).length > 0;
        var isian = { B: B, Bket: B.indexOf('T') > -1 ? { [B.indexOf('T')]: 'Pasien menolak / tertidur' } : {}, C: { tensi: sis + '/' + dia, nadi: String(68 + antara(0, 22)), suhu: suhu, spo2: spo, gds: info.insulin && info.insulin.length ? String(110 + antara(0, 90)) : '' }, D: { obat: (info.obat || []).map(function (o) { return { nama: o.nama, dosis: o.dosis, jam: o.jam, v: 'Y' }; }), insulin: (info.insulin || []).map(function (o) { return { nama: o.nama, dosis: o.dosis, jam: o.jam, v: 'Y' }; }) }, E: alat ? fmt.E.map(function (x, q) { var n = (info.alat || []).map(function (a) { return a.nama; }).join(' '); return (/NGT/.test(n) && q < 3) || (/Kateter|Foley/.test(n) && q >= 3 && q < 6) || q === 9 ? 'Y' : ''; }) : null, F: { bab: pilih(['Tidak BAB', '1 kali', '1 kali', '2 kali']), bab_ket: 'Lunak', bak: pilih(['4–6 kali', '4–6 kali', '7–9 kali']), bak_ket: 'Kuning jernih', makan_pagi: pilih(['Habis', 'Habis', 'Sebagian']), makan_siang: pilih(['Habis', 'Sebagian']), makan_malam: pilih(['Habis', 'Sebagian', 'Habis']), minum: (antara(9, 16) * 100) + ' ml', keluhan: kond === 'Stabil' ? 'Tidak ada keluhan berarti.' : 'Pasien tampak lebih gelisah dan lemas dibanding kemarin.', kejadian: kond === 'Mengalami perubahan kondisi' ? 'Suhu naik 37,9°C pukul 13.00; kompres hangat & lapor koordinator.' : '-', saran: kond === 'Stabil' ? 'Lanjutkan program alih baring & ROM.' : 'Observasi TTV tiap 2 jam, pertimbangkan visit dokter.' }, G: { kondisi: kond, ket: kond === 'Stabil' ? '' : (kond === 'Perlu pemantauan' ? 'Tensi naik 150/90 sore hari, sundowning lebih lama.' : 'Subfebris 37,9°C, intake menurun.') }, H: { nama: '', ttd: '' } };
        if (lama) { isian.D = { obat: [], insulin: [] }; isian.E = null; isian.Bket = {}; isian.F.saran = ''; isian.F.kejadian = '-'; }
        lap.push({ id: 'LHC-' + h.replace(/-/g, '') + '-' + U.pad(lap.filter(function (l) { return l.tanggal === h; }).length + 1, 4), tanggal: h, shift: s, pasien_id: t.pasien_id, perawat_id: t.perawat_id, penugasan_id: t.id, isian: JSON.stringify(isian), tensi: isian.C.tensi, nadi: isian.C.nadi, suhu: isian.C.suhu, spo2: isian.C.spo2, gds: isian.C.gds, kondisi_pasien: kond, keterangan_kondisi: isian.G.ket, catatan_tambahan: k % 5 === 0 ? 'Keluarga mendampingi saat latihan ROM; edukasi posisi semi-Fowler saat makan.' : '', waktu_isi: wt, status_ketepatan: wt <= batas ? 'Tepat Waktu' : 'Terlambat', status_kirim_pj: 'Terkirim WA' + (k % 3 ? ' & Email' : ''), waktu_kirim_pj: wt, revisi_ke: k === 4 && h === hari(-2) ? 1 : 0, dibuat_pada: wt, diubah_pada: wt, dibuat_oleh: 'USR-103' });
      });
    }
  });
  ins(T.LHC, lap);

  /* ---------- Home Visit ---------- */
  var tind = [['Infus Vitamin', 'PSN-0031', 'assets/ilustrasi/hv-infus.svg', 850000], ['Pasang Kateter', 'PSN-0032', 'assets/ilustrasi/hv-kateter.svg', 650000], ['Perawatan Luka', 'PSN-0033', 'assets/ilustrasi/hv-luka.svg', 450000], ['Pasang NGT', 'PSN-0034', 'assets/ilustrasi/hv-ngt.svg', 600000], ['Perawatan Luka', 'PSN-0035', 'assets/ilustrasi/hv-luka.svg', 450000]], hvRows = [], icN = 61;
  for (var v = -26; v <= 4; v += 2) {
    var x = tind[(v + 26) / 2 % tind.length], tglv = hari(v), selesai = v < 0 || (v === 0 && false);
    var st = v < 0 ? 'Selesai' : 'Terjadwal', cons = v < 0 || v === 0 ? 'Disetujui' : 'Belum';
    hvRows.push({ tanggal: tglv, jadwal_jam: pilih(['08:30', '10:00', '13:30', '15:00']), pasien_id: x[1], perawat_hv_id: 'PHV-' + U.pad(1 + ((v + 26) / 2) % 4, 3), jenis_tindakan: x[0], consent_id: cons === 'Disetujui' ? U.pad(icN++, 4) + '/IC/HV/' + U.romawi(tglv.slice(5, 7)) + '/' + tglv.slice(0, 4) : '', status_consent: cons, consent_oleh: cons === 'Disetujui' ? pasRows.filter(function (p) { return p.id === x[1]; })[0].nama_pj : '', consent_relasi: cons === 'Disetujui' ? pasRows.filter(function (p) { return p.id === x[1]; })[0].relasi_pj : '', ttd_url: cons === 'Disetujui' ? 'ttd-demo' : '', foto_sebelum_url: st === 'Selesai' ? 'assets/ilustrasi/dok-sebelum.svg' : '', foto_sesudah_url: st === 'Selesai' ? 'assets/ilustrasi/dok-sesudah.svg' : '', hasil_tindakan: st === 'Selesai' ? (x[0] === 'Infus Vitamin' ? 'Infus multivitamin 500 ml habis dalam 90 menit, tidak ada reaksi alergi.' : x[0] === 'Perawatan Luka' ? 'Luka dibersihkan NaCl 0,9%, debridement minimal, ditutup modern dressing (hydrocolloid). Granulasi baik.' : x[0] === 'Pasang NGT' ? 'NGT Fr 14 terpasang, cek residu & auskultasi positif, fiksasi rapi.' : 'Kateter Foley No. 16 terpasang, urin keluar jernih 300 ml.') : '', status: st, biaya: x[3] });
  }
  hvRows.push({ tanggal: H, jadwal_jam: '15:30', pasien_id: 'PSN-0033', perawat_hv_id: 'PHV-002', jenis_tindakan: 'Perawatan Luka', status: 'Terjadwal', status_consent: 'Belum', biaya: 450000 });
  ins(T.LHV, hvRows);

  /* ---------- Pipeline CS ---------- */
  var leadData = [['Bpk. Kurniawan', 'Ny. Ratna Juwita (72)', 'Post stroke iskemik hari ke-14, butuh mobilisasi & higiene total', 'WhatsApp', 'Lead Masuk', -0.2, 'Premium'], ['Ibu Sarah Wijaya', 'Bpk. Hartono', 'Ulkus diabetikum stadium 3, cari perawat CWCCA', 'Instagram', 'Lead Masuk', -0.3, 'Premium'], ['dr. Handoko, Sp.S', 'Ny. Siti Aminah (81)', 'Fraktur femur post-op, rujukan RS Medika Premiere', 'Referral Dokter/RS', 'Lead Masuk', -0.1, 'VIP'], ['Ibu Novita Sari', 'Tn. Darmawan (70)', 'Pendamping lansia siang hari', 'Google Maps', 'Lead Masuk', -1.2, 'Basic'], ['Bpk. Yosef Harun', 'Ny. Magdalena (85)', 'Demensia, keluarga kerja di luar kota', 'Website', 'Lead Masuk', -2.6, 'Premium'], ['Ibu Rina Agustin', 'Tn. Bachtiar (77)', 'PPOK, butuh perawat malam', 'WhatsApp', 'Lead Masuk', -0.6, 'Premium'],
    ['Bpk. Aditya Pratama', 'Bpk. H. Sukardi (76)', 'Revisi proposal rincian tugas caregiver demensia', 'Referral', 'Follow-up', -3.3, 'VIP'], ['Ibu Maya Rosita', 'Ny. Kurnia Sari (70)', 'Pasca pasang NGT & kateter, minta jadwal HV rutin', 'WhatsApp', 'Follow-up', -1, 'Basic'], ['Tn. Bambang Suroso', 'Tn. Bambang Suroso (70)', 'Stroke ringan, diskusi keluarga besar paket 24 jam', 'Instagram', 'Follow-up', -1.5, 'VIP'], ['Ibu Wening Prasetyo', 'Tn. Prasetyo (79)', 'Post TURP, perlu kateter', 'Referral', 'Follow-up', -0.4, 'Premium'], ['Bpk. Arief Budiman', 'Ny. Sumiati (88)', 'Geriatri, survei harga', 'Website', 'Follow-up', -2.4, 'Basic'],
    ['Tn. Hendra Gunawan', 'Tn. Hendra Gunawan (61)', 'VIP 24 jam medis, DP terverifikasi', 'WhatsApp', 'Deal', -6, 'VIP'], ['Ibu Dewi Sartika', 'Ny. Dewi Sartika (58)', 'Paket HV 5 sesi infus albumin & rawat luka', 'Instagram', 'Deal', -9, 'Basic'], ['Bpk. Felix Gunadi', 'Ny. Theresia Gunadi (79)', 'Perpanjangan & tambah shift malam', 'Referral', 'Deal', -15, 'Premium'], ['Ibu Lily Tanoto', 'Tn. Tan Jin Ho (76)', 'Paliatif demensia', 'Referral Dokter/RS', 'Deal', -40, 'VIP'],
    ['Bpk. Bambang Trihatmojo', 'Ny. Warsiti (79)', 'Memilih caregiver ART non-nakes', 'WhatsApp', 'Tidak Jadi', -12, 'Basic', 'Harga di luar anggaran'], ['Ibu Ratna Kumala', 'Ny. Ratna Kumala', 'Domisili Surabaya', 'Instagram', 'Tidak Jadi', -20, 'Premium', 'Di luar wilayah layanan'], ['Bpk. Teguh Santoso', 'Tn. Santoso (82)', 'Pasien dirawat inap ICU', 'Website', 'Tidak Jadi', -8, 'VIP', 'Pasien dirawat inap']];
  ins(T.LEAD, leadData.map(function (l, i) { var masuk = U.dt(new Date(CC.env.now().getTime() + l[5] * 864e5 - 3 * 36e5)); var fu = l[4] === 'Lead Masuk' ? '' : U.dt(new Date(U.parse(masuk).getTime() + (l[4] === 'Follow-up' && i === 6 ? 0.4 : 0.6) * 864e5)); return { id: 'LED-' + U.pad(i + 1, 4), tanggal_masuk: masuk, nama_kontak: l[0], no_wa: hp(i + 500), nama_pasien: l[1], kebutuhan: l[2], paket_minat: l[6], wilayah: pilih(wil), sumber_lead: l[3], status_pipeline: l[4], followup_terakhir: fu, followup_berikutnya: l[4] === 'Follow-up' ? hari(1) : '', nilai_deal: l[4] === 'Deal' ? (l[6] === 'VIP' ? 19500000 : l[6] === 'Premium' ? 9750000 : 3750000) : (l[6] === 'VIP' ? 18500000 : l[6] === 'Premium' ? 11200000 : 5000000), pic_cs: i % 3 === 1 ? CS2 : CS1, alasan_tidak_jadi: l[7] || '', catatan: i === 6 ? 'Terakhir kontak 54 jam lalu oleh CS Amanda. Klien meminta revisi proposal rincian tugas caregiver pendamping demensia.' : '', dibuat_pada: masuk }; }));

  /* ---------- Sales Order, invoice, pembayaran (6 bulan) ---------- */
  var soRows = [], invRows = [], bayarRows = [], jurnalRows = [], noInv = 641, soN = 1, urut = {};
  function buatSO(t, tglSO, status_klien, opsiSO) {
    opsiSO = opsiSO || {}; var pk = t.paket_id, items = [{ jenis_item: 'Jasa Layanan', uraian: 'Jasa Layanan Keperawatan ' + ({ 'PKT-01': 'Basic', 'PKT-02': 'Premium 12 Jam', 'PKT-03': 'VIP 24 Jam' }[pk]) + ' · ' + t.lama_hari + ' hari', jumlah: 1, harga_satuan: Math.round(HARGA[pk] / 30 * t.lama_hari), subtotal: 0 }];
    if (status_klien === 'New') items.push({ jenis_item: 'Administrasi', uraian: 'Biaya administrasi (berlaku 3 bulan)', jumlah: 1, harga_satuan: 1000000 });
    if (opsiSO.lembur) items.push({ jenis_item: 'Biaya Lembur', uraian: 'Pengganti uang cuti ' + opsiSO.lembur + ' hari', jumlah: opsiSO.lembur, harga_satuan: 300000 });
    if (opsiSO.transport) items.push({ jenis_item: 'Biaya Transportasi', uraian: 'Transport perawat (luar Jabodetabek inti)', jumlah: 1, harga_satuan: 250000 });
    if (opsiSO.diskon) items.push({ jenis_item: 'Diskon', uraian: 'Diskon klien existing', jumlah: 1, harga_satuan: opsiSO.diskon });
    var total = CC.hitungItem(items), per = tglSO.slice(0, 7); urut[per] = (urut[per] || 0) + 1;
    var hpp = Math.round(CC.u.angka(t.gaji_deal) / 30 * t.lama_hari), hppT = Math.round(total * 0.12 / 1000) * 1000;
    var s = { id: 'SO-' + U.pad(soN++, 4), periode_bulan: per, no_urut: urut[per], tanggal: tglSO, pasien_id: t.pasien_id, perawat_id: t.perawat_id, kontrak_hari: t.lama_hari, kontrak_label: t.lama_hari + ' Hari', paket_id: pk, status_klien: status_klien, no_po: '', item: JSON.stringify(items), harga: items[0].harga_satuan, total: total, dp: opsiSO.dp || 0, sisa_pembayaran: total, hpp_pokok: hpp, hpp_tambahan_estimasi: hppT, margin: total - hpp - hppT, hpp_status: tglSO < BLN1 + '-01' ? 'Aktual' : 'Estimasi', status: 'Aktif', pic_cs: soN % 3 === 0 ? CS2 : CS1, penugasan_id: t.id, sumber: 'Aplikasi', dibuat_pada: waktu(tglSO, 9 + soN % 7, soN % 50) };
    soRows.push(s); t.so_id = s.id;
    var no = 'NIS/' + tglSO.slice(5, 7) + '/' + tglSO.slice(2, 4) + '/' + U.pad(noInv++, 5), tempo = U.tambahHari(tglSO, 7), kode = CC.kodeAcak(12);
    s.no_invoice = no;
    items.forEach(function (it) { invRows.push({ no_invoice: no, varian: opsiSO.dp ? 'DP' : 'Biasa', tanggal_terbit: tglSO, jatuh_tempo: tempo, so_id: s.id, pasien_id: t.pasien_id, jenis_item: it.jenis_item, uraian: it.uraian, jumlah: it.jumlah, harga_satuan: it.harga_satuan, subtotal: it.subtotal, total_invoice: total, status_invoice: 'Terbit', kode_verifikasi: kode, dibuat_pada: waktu(tglSO, 11, 0) }); });
    var bayar = opsiSO.bayar === undefined ? total : opsiSO.bayar;
    if (bayar > 0) {
      var parts = opsiSO.dp && bayar >= total ? [[opsiSO.dp, 'DP', 0], [total - opsiSO.dp, 'Pelunasan', 4]] : [[bayar, bayar >= total ? 'Pelunasan' : 'DP', 1]];
      parts.forEach(function (pp) { var tb = U.tambahHari(tglSO, pp[2] + antara(0, 3)); if (tb > H) tb = H; var jid = 'JRN-' + U.pad(jurnalRows.length + 1, 4); jurnalRows.push({ id: jid, tanggal: tb, tipe: 'Masuk', kategori: 'Pembayaran Invoice', akun: pilih(['Transfer BCA', 'Transfer BCA', 'Virtual Account']), nominal: pp[0], pasien_id: t.pasien_id, sumber: 'Invoice', referensi: no, status_pengajuan: 'Tercatat', diajukan_oleh: 'M. Ridwan Syah, S.E., Ak.', keterangan: pp[1] + ' ' + no }); bayarRows.push({ no_invoice: no, tanggal_bayar: tb, jenis: pp[1], nominal: pp[0], metode: 'Transfer BCA', jurnal_id: jid, dicatat_oleh: 'M. Ridwan Syah, S.E., Ak.' }); });
    }
    var st = bayar >= total ? 'Lunas' : bayar > 0 ? 'Dibayar Sebagian' : 'Terbit'; invRows.filter(function (r) { return r.no_invoice === no; }).forEach(function (r) { r.status_invoice = st; }); s.sisa_pembayaran = Math.max(0, total - bayar);
    if (!s.dibuat_pada || s.tanggal > H) s.dibuat_pada = waktu(H, 9, 0);
    return s;
  }
  // SO historis (klien yang sudah selesai) untuk analitik 6 bulan
  var histPaket = ['PKT-02', 'PKT-03', 'PKT-01', 'PKT-02', 'PKT-03', 'PKT-02', 'PKT-01', 'PKT-03'];
  for (var m = 6; m >= 1; m--) {
    var nM = [0, 5, 8, 18, 18, 17, 16][m];
    for (var q = 0; q < nM; q++) { var tgl0 = U.tambahHari(U.tambahBulan(BLN + '-01', -m), antara(0, 26)); if (tgl0 >= H) continue; var pIdx = q % 28; var tt = { pasien_id: 'PSN-' + U.pad(pIdx + 1, 4), perawat_id: 'PHC-' + U.pad(1 + (q * 3 + m) % 28, 3), paket_id: histPaket[(q + m) % 8], lama_hari: pilih([30, 30, 30, 15, 7, 14]), gaji_deal: 0 }; tt.gaji_deal = GAJI[tt.paket_id]; buatSO(tt, tgl0, q % 3 === 0 ? 'New' : 'Existing', { lembur: q % 5 === 2 ? 4 : 0, transport: q % 7 === 3 }); }
  }
  // SO untuk penugasan saat ini & sebelumnya
  P.slice(0, 28).forEach(function (x, i) {
    if (x.prev2) buatSO(x.prev2, x.prev2.tanggal_mulai, i % 4 === 1 ? 'New' : 'Existing', { transport: i % 9 === 2 });
    if (x.prev) buatSO(x.prev, x.prev.tanggal_mulai, x.prev2 ? 'Existing' : 'New', { lembur: i % 6 === 0 ? 4 : 0 });
    var bayarKini = i % 7 === 2 ? 0 : i % 9 === 4 ? Math.round(HARGA[x[4]] / 30 * x.tugas.lama_hari * 0.33 / 100000) * 100000 : undefined;
    buatSO(x.tugas, x.tugas.tanggal_mulai, 'Existing', { bayar: bayarKini, dp: i % 9 === 4 ? bayarKini : 0, diskon: i % 8 === 5 ? 500000 : 0 });
  });
  // penugasan pendek tidak dibuat ulang di sini; set so_id penugasan
  CC.ubahBanyak(sys, T.TUGAS, tugas.filter(function (t) { return t.so_id; }).map(function (t) { return { id: t.id, so_id: t.so_id }; }));
  // invoice infal (varian Infal)
  invRows.push({ no_invoice: 'NIS/' + H.slice(5, 7) + '/' + H.slice(2, 4) + '/' + U.pad(noInv++, 5), varian: 'Infal', tanggal_terbit: hari(-1), jatuh_tempo: hari(6), so_id: P[3].tugas.so_id, pasien_id: 'PSN-0004', jenis_item: 'Jasa Layanan Infal', uraian: 'Infal CG. Sri Wahyuni 3 hari (cuti perawat utama)', jumlah: 3, harga_satuan: 250000, subtotal: 750000, total_invoice: 750000, status_invoice: 'Terbit', kode_verifikasi: CC.kodeAcak(12) });
  ins(T.SO, soRows); ins(T.INV, invRows); ins(T.BAYAR, bayarRows);
  ins(T.NOMOR, [{ kode: 'INV', tahun: H.slice(0, 4), urut: noInv - 1, terakhir_nomor: invRows[invRows.length - 1].no_invoice }]);

  /* ---------- Petty cash (3 bulan) ---------- */
  var pcRows = [], kat = CC.BAWAAN.master.kategori_pc;
  [BLN2, BLN1, BLN].forEach(function (b, bi) {
    pcRows.push({ tanggal: b + '-02', tipe: 'Masuk', kategori: '', pengaju_nama: 'Siti Nurhaliza', nominal: 10000000, keterangan: 'Pengisian kas kecil bulan ' + U.NAMA_BULAN[Number(b.slice(5)) - 1], status: 'Tercatat' });
    var n = bi === 2 ? 12 : 14;
    for (var q2 = 0; q2 < n; q2++) { var tq = b + '-' + U.pad(3 + q2 * 2, 2); if (tq > H) break; var kk = kat[q2 % kat.length], nom = { 'Transportasi': 185000, 'ATK & Cetak': 245000, 'Konsumsi Rapat': 420000, 'Perlengkapan Medis': 675000, 'Pulsa & Internet': 300000, 'Kebersihan Kantor': 150000, 'Lain-lain': 95000 }[kk] + antara(0, 8) * 25000; pcRows.push({ tanggal: tq, tipe: 'Keluar', kategori: bi === 0 && q2 % 3 === 0 ? '' : kk, pengaju_nama: 'Siti Nurhaliza', pengaju_id: 'USR-113', nominal: nom, keterangan: { 'Transportasi': 'Ojek online antar dokumen SPK ke klien', 'ATK & Cetak': 'Cetak kontrak & map dokumen', 'Konsumsi Rapat': 'Konsumsi rapat koordinasi Senin', 'Perlengkapan Medis': 'Handscoon, masker, alkohol swab', 'Pulsa & Internet': 'Paket data HP operasional CS', 'Kebersihan Kantor': 'Sabun & tisu kantor', 'Lain-lain': 'Materai 10.000 × 9' }[kk], bukti_url: 'bukti-demo', status: bi === 2 && q2 >= n - 2 ? (q2 === n - 1 ? 'Diajukan' : 'Diproses') : 'Dibayarkan', disetujui_oleh: 'M. Ridwan Syah, S.E., Ak.' }); }
  });
  ins(T.PC, pcRows);
  pcRows.filter(function (r) { return r.tipe === 'Keluar' && r.status === 'Dibayarkan'; }).forEach(function (r) { jurnalRows.push({ id: 'JRN-' + U.pad(jurnalRows.length + 1, 4), tanggal: r.tanggal, tipe: 'Keluar', kategori: 'Petty Cash', akun: 'Kas Kecil', nominal: r.nominal, sumber: 'Petty Cash', referensi: '', status_pengajuan: 'Tercatat', diajukan_oleh: r.pengaju_nama, keterangan: r.keterangan }); });
  [BLN2, BLN1, BLN].forEach(function (b) { [['Sewa', 'Sewa kantor Kebayoran Baru', 12500000], ['Pemasaran', 'Iklan Instagram & Google Ads', 3500000], ['Operasional Kantor', 'Listrik, air & internet kantor', 2150000]].forEach(function (x, i) { var tj = b + '-' + U.pad(5 + i * 6, 2); if (tj <= H) jurnalRows.push({ id: 'JRN-' + U.pad(jurnalRows.length + 1, 4), tanggal: tj, tipe: 'Keluar', kategori: x[0], akun: 'Bank', nominal: x[2], sumber: 'Manual', status_pengajuan: 'Tercatat', diajukan_oleh: 'M. Ridwan Syah, S.E., Ak.', keterangan: x[1] }); }); });
  ins(T.JURNAL, jurnalRows);

  /* ---------- Kasbon & potongan ---------- */
  ins(T.KASBON, [
    { perawat_id: 'PHC-002', jenis: 'Kasbon', tanggal: hari(-20), nominal: 500000, cara_potong: 'Sekali', jumlah_cicilan: 1, nominal_per_periode: 500000, sisa: 500000, status: 'Disetujui', keterangan: 'Kasbon biaya sekolah anak', diajukan_oleh: 'Ns. Ratna Dewi, S.Kep', disetujui_oleh: 'M. Ridwan Syah, S.E., Ak.' },
    { perawat_id: 'PHC-001', jenis: 'Seragam', tanggal: U.tambahBulan(H, -1), nominal: 450000, cara_potong: 'Cicilan', jumlah_cicilan: 3, nominal_per_periode: 150000, sisa: 300000, status: 'Disetujui', keterangan: 'Seragam medis & atribut (cicilan 2 dari 3)', diajukan_oleh: 'Sistem', disetujui_oleh: 'M. Ridwan Syah, S.E., Ak.' },
    { perawat_id: 'PHC-004', jenis: 'Seragam', tanggal: hari(-8), nominal: 450000, cara_potong: 'Cicilan', jumlah_cicilan: 3, nominal_per_periode: 150000, sisa: 450000, status: 'Disetujui', keterangan: 'Seragam perawat baru', diajukan_oleh: 'Sistem', disetujui_oleh: 'M. Ridwan Syah, S.E., Ak.' },
    { perawat_id: 'PHC-009', jenis: 'Kasbon', tanggal: hari(-3), nominal: 750000, cara_potong: 'Cicilan', jumlah_cicilan: 3, nominal_per_periode: 250000, sisa: 750000, status: 'Diajukan', keterangan: 'Kasbon darurat keluarga', diajukan_oleh: 'Ns. Ratna Dewi, S.Kep' },
    { perawat_id: 'PHC-012', jenis: 'Kasbon', tanggal: U.tambahBulan(H, -2), nominal: 300000, cara_potong: 'Sekali', jumlah_cicilan: 1, nominal_per_periode: 300000, sisa: 0, status: 'Lunas', keterangan: 'Kasbon transport', diajukan_oleh: 'Ns. Ratna Dewi, S.Kep', disetujui_oleh: 'M. Ridwan Syah, S.E., Ak.' }
  ]);

  /* ---------- Kasus & komplain ---------- */
  function jamLalu(j) { return U.dt(new Date(CC.env.now().getTime() - j * 36e5)); } function jamNanti(j) { return U.dt(new Date(CC.env.now().getTime() + j * 36e5)); }
  var kasus = [
    ['Komplain Klien', 'CS', 'PSN-0001', 'PHC-001', 'Keluarga minta laporan sore dikirim lebih awal', 'Bpk. Irfan Dahlan meminta ringkasan laporan sore diterima sebelum pukul 18.00 karena jadwal dinas malam.', 'Sedang', 'USR-108', jamLalu(30), jamLalu(6), 'Masuk'],
    ['Kondisi Lapangan', 'HC', 'PSN-0015', 'PHC-016', 'Subfebris & intake menurun — Tn. Robert Siahaan', 'Suhu 37,9°C pukul 13.00, residu NGT meningkat. Perlu evaluasi dokter penanggung jawab.', 'Tinggi', 'USR-102', jamLalu(9), jamLalu(3), 'Proses'],
    ['Komplain Klien', 'CS', 'PSN-0009', 'PHC-010', 'Perawat terlambat datang 40 menit (rotasi shift)', 'Keluarga Tn. Sutrisno komplain keterlambatan pergantian shift pagi.', 'Sedang', 'USR-108', jamLalu(20), jamNanti(4), 'Proses'],
    ['Izin', 'HC', 'PSN-0011', 'PHC-012', 'Izin pulang kampung 2 hari — perlu infal', 'CG. Tri Wulandari izin keluarga sakit, minta pengganti 2 hari.', 'Tinggi', 'USR-102', jamLalu(2), jamNanti(10), 'Masuk'],
    ['Resign', 'HC', '', 'PHC-031', 'Pengajuan resign perawat — Ns. Rahmat Hidayat', 'Mengajukan resign efektif akhir bulan depan; perlu rencana rotasi pasien.', 'Rendah', 'USR-110', jamLalu(50), jamNanti(22), 'Proses'],
    ['Kondisi Lapangan', 'HV', 'PSN-0033', 'PHV-002', 'Luka diabetik bertambah eksudat', 'Eksudat purulen minimal, perlu konsul dokter bedah & kultur.', 'Tinggi', 'USR-106', jamLalu(30), jamLalu(24), 'Overdue'],
    ['Komplain Klien', 'CS', 'PSN-0003', 'PHC-004', 'Invoice dobel diterima keluarga', 'Ibu Dewi Kartika menerima dua tagihan untuk periode yang sama.', 'Sedang', 'USR-109', jamLalu(80), jamLalu(60), 'Selesai', 'Invoice lama dibatalkan, pengganti dikirim; klien konfirmasi.'],
    ['Kondisi Lapangan', 'HC', 'PSN-0002', 'PHC-002', 'Sundowning memanjang — Ny. Ratna Sari', 'Gelisah 17.30–20.30, mencari keluarga. Usul penyesuaian jadwal obat.', 'Sedang', 'USR-102', jamLalu(18), jamNanti(-12), 'Proses'],
    ['Komplain Klien', 'CS', 'PSN-0020', '', 'Permintaan perawat laki-laki', 'Keluarga Tn. Sutrisno meminta pergantian perawat laki-laki berpostur tinggi untuk transfer pasien.', 'Rendah', 'USR-108', jamLalu(120), jamLalu(96), 'Selesai', 'Rotasi dijadwalkan; dicatat di turnover.'],
    ['Kondisi Lapangan', 'HC', 'PSN-0019', 'PHC-019', 'Dekubitus sakrum melebar 1 cm', 'Evaluasi luka & alat bantu kasur dekubitus.', 'Tinggi', 'USR-102', jamLalu(70), jamLalu(64), 'Selesai', 'Kasur anti-dekubitus terpasang, jadwal alih baring diperketat.'],
    ['Izin', 'HC', 'PSN-0007', 'PHC-008', 'Izin sakit 1 hari', 'Demam, sudah diganti infal.', 'Sedang', 'USR-102', jamLalu(200), jamLalu(188), 'Selesai', 'Infal terpenuhi.'],
    ['Komplain Klien', 'CS', 'PSN-0012', 'PHC-013', 'Perawat kurang komunikatif dengan keluarga', 'Keluarga minta perawat lebih aktif memberi kabar via WA.', 'Rendah', 'USR-109', jamLalu(100), jamLalu(28), 'Overdue'],
    // riwayat 30 hari (sudah selesai) agar grafik kasus per periode terisi
    ['Kondisi Lapangan', 'HC', 'PSN-0005', 'PHC-005', 'Hipoglikemia ringan pagi hari (GDS 62)', 'Diberikan 15 g glukosa oral, GDS ulang 108. Lapor dokter.', 'Tinggi', 'USR-102', jamLalu(24 * 27), jamLalu(24 * 27 - 6), 'Selesai', 'Dosis insulin malam disesuaikan dokter.'],
    ['Komplain Klien', 'CS', 'PSN-0008', 'PHC-009', 'Keluarga minta laporan foto luka harian', 'Keluarga ingin dokumentasi foto perawatan luka setiap hari.', 'Rendah', 'USR-108', jamLalu(24 * 25), jamLalu(24 * 24), 'Selesai', 'Foto luka ditambahkan pada laporan bagian F.'],
    ['Izin', 'HC', 'PSN-0014', 'PHC-015', 'Izin wisuda adik 1 hari', 'Perlu infal 1 shift pagi.', 'Rendah', 'USR-102', jamLalu(24 * 23), jamLalu(24 * 22), 'Selesai', 'Infal terpenuhi dari perawat siaga.'],
    ['Kondisi Lapangan', 'HV', 'PSN-0031', 'PHV-001', 'Plebitis derajat 1 pasca infus', 'Kemerahan di lokasi infus, pasien mengeluh nyeri ringan.', 'Sedang', 'USR-106', jamLalu(24 * 20), jamLalu(24 * 20 - 6), 'Selesai', 'Kompres hangat, lokasi infus dipindah; membaik H+2.'],
    ['Komplain Klien', 'CS', 'PSN-0016', 'PHC-017', 'Jadwal mandi pasien terlalu pagi', 'Keluarga minta jadwal mandi digeser ke pukul 07.30.', 'Rendah', 'USR-109', jamLalu(24 * 18), jamLalu(24 * 17), 'Selesai', 'Rencana harian diperbarui di identifikasi pasien.'],
    ['Kondisi Lapangan', 'HC', 'PSN-0010', 'PHC-011', 'Retensi urin, kateter tersumbat', 'Urine output 150 ml/8 jam, kateter tampak tersumbat sedimen.', 'Tinggi', 'USR-102', jamLalu(24 * 15), jamLalu(24 * 15 - 6), 'Selesai', 'Kateter diganti oleh tim HV, output kembali normal.'],
    ['Komplain Klien', 'CS', 'PSN-0004', 'PHC-006', 'Perawat sering memakai ponsel saat jaga', 'Keluarga melihat perawat bermain ponsel saat pasien tidur.', 'Sedang', 'USR-108', jamLalu(24 * 13), jamLalu(24 * 12), 'Selesai', 'Pembinaan & SP lisan; keluarga puas setelah evaluasi.'],
    ['Izin', 'HC', 'PSN-0006', 'PHC-007', 'Izin sakit gigi 1 hari', 'Perlu infal shift 24 jam.', 'Sedang', 'USR-102', jamLalu(24 * 11), jamLalu(24 * 11 - 12), 'Selesai', 'Infal dari mess Cilandak.']
  ];
  ins(T.KASUS, kasus.map(function (k, i) { var sel = k[10] === 'Selesai'; return { id: 'KSS-' + U.pad(35 + i, 4), tanggal_masuk: k[8], jenis: k[0], divisi_asal: k[1], pasien_id: k[2], perawat_id: k[3], judul: k[4], deskripsi: k[5], prioritas: k[6], pic: k[7], sla_tenggat: k[9], status: k[10], status_akhir: k[11] || '', selesai_pada: sel ? U.dt(new Date(U.parse(k[9]).getTime() - (i === 6 ? 2 : 1) * 36e5)) : '', utas_diskusi: JSON.stringify([{ oleh: 'Sistem', peran: '', waktu: k[8], teks: 'Kasus dibuat.', sistem: true }].concat(i % 2 === 0 ? [{ oleh: 'Ns. Ratna Dewi, S.Kep', peran: 'Tim Keperawatan', waktu: U.dt(new Date(U.parse(k[8]).getTime() + 2 * 36e5)), teks: 'Sudah dikonfirmasi ke perawat bertugas, menunggu update sore.' }, { oleh: 'Bayu Kurniawan', peran: 'Operasional', waktu: U.dt(new Date(U.parse(k[8]).getTime() + 3 * 36e5)), teks: 'Saya pantau di rapat Senin. Mohon PIC update status.' }] : [])), dibuat_pada: k[8] }; }));

  /* ---------- Turnover & putus kontrak ---------- */
  var tov = [];
  for (var mm = 5; mm >= 0; mm--) { var bb = U.bulan(U.parse(U.tambahBulan(BLN + '-01', -mm))); [['Perawat Masuk', 'Rekrutmen', 'HC'], ['Perawat Keluar', 'Pindah domisili', 'HC'], ['Rotasi Perawat', 'Permintaan klien', 'HC'], ['Putus Kontrak Klien', pilih(['Sudah sehat', 'Biaya', 'Wafat']), 'CS'], ['Putus Kontrak Perawat', 'Kinerja', 'HC']].forEach(function (x, j) { if ((mm + j) % 3 === 2) return; var te = bb + '-' + U.pad(4 + j * 5, 2); if (te > H) return; tov.push({ jenis: x[0], divisi: x[2], pihak_id: x[0].indexOf('Klien') > -1 ? 'PSN-00' + (10 + j + mm) : 'PHC-0' + (10 + j + mm), pihak_nama: x[0].indexOf('Klien') > -1 ? P[(j + mm) % 28][0] : namaHC[(j * 3 + mm) % 30], alasan_terstandar: x[1], alasan_detail: '', tanggal_efektif: te, dari: x[0] === 'Rotasi Perawat' ? namaHC[(mm + 3) % 30] : '', ke: x[0] === 'Rotasi Perawat' ? namaHC[(mm + 9) % 30] : '', dicatat_oleh: 'Anisa Wulandari, S.Psi', bulan_rekap: bb }); }); }
  ins(T.TURNOVER, tov);

  /* ---------- Rekrutmen ---------- */
  ins(T.REKRUT, [['Ns. Bagas Pratama, S.Kep', 'Perawat (Ners)', 'S1 Keperawatan UI (IPK 3,78)', 'Tebet, Jakarta Selatan', 'Tes', 92, '3 tahun ICU/HCU RS swasta, BTCLS 2025'], ['CG. Nurul Hidayati', 'Caregiver', 'SMK Kesehatan 2022', 'Bintaro', 'Interview', 0, '2 tahun merawat lansia demensia'], ['Ns. Hendri Saputra Jr., A.Md.Kep', 'Perawat (D3)', 'D3 Poltekkes Kemenkes', 'Depok', 'Diterima', 94, 'Lulus uji tindakan bed-side Grade A'], ['Ns. Clara Anggita, S.Kep', 'Perawat (Ners)', 'S1 Keperawatan UNPAD', 'Bekasi', 'Seleksi Berkas', 0, 'Fresh graduate, STR aktif'], ['CG. Sumarni', 'Caregiver', 'SMA + Pelatihan Caregiver LPK', 'Jakarta Timur', 'Lamaran Masuk', 0, '5 tahun caregiver lansia'], ['Ns. Dwi Prasetyo, A.Md.Kep', 'Perawat (D3)', 'D3 Akper Pelni', 'Jakarta Barat', 'Lamaran Masuk', 0, 'Pengalaman HCU 1 tahun'], ['Bdn. Putri Ayuningsih, A.Md.Keb', 'Bidan', 'D3 Kebidanan', 'Tangerang Selatan', 'Interview', 0, 'Perawatan ibu & bayi'], ['CG. Rini Astuti', 'Caregiver', 'SMK Kesehatan', 'Depok', 'Ditolak', 55, 'Belum memenuhi uji praktik transfer pasien'], ['Ns. Yudha Mahendra, S.Kep', 'Perawat (Ners)', 'S1 Keperawatan UMJ', 'Jakarta Selatan', 'Lamaran Masuk', 0, 'Pengalaman IGD 2 tahun'], ['CG. Lestari Wahyuni', 'Caregiver', 'SMA + LPK', 'Bogor', 'Seleksi Berkas', 0, 'Caregiver paliatif 3 tahun']].map(function (r, i) { return { tanggal_lamaran: hari(-antara(1, 25)), nama: r[0], kontak: hp(i + 700), email: r[0].replace(/^(Ns\.|CG\.|Bdn\.)\s*/, '').split(',')[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@gmail.com', posisi: r[1], pendidikan: r[2], domisili: r[3], pengalaman: r[6], tahap: r[4], skor: r[5] || '', alasan_keputusan: r[4] === 'Diterima' ? 'Skor uji tindakan 94/100, STR & SKCK valid' : r[4] === 'Ditolak' ? 'Nilai uji praktik transfer pasien di bawah standar (55)' : '', diproses_oleh: 'Anisa Wulandari, S.Psi' }; }));

  /* ---------- Target & KPI ---------- */
  var tgt = [];
  [BLN1, BLN].forEach(function (b) { [['Keperawatan', 'Kepatuhan laporan harian', '%', 95, 'kepatuhan_laporan'], ['Keperawatan', 'Pasien aktif terisi perawat', '%', 100, 'pasien_terisi'], ['Home Visit', 'Tindakan Home Visit selesai', 'tindakan', 16, 'tindakan_hv'], ['Customer Service', 'Lead di-follow up ≤ 2 hari', '%', 100, 'followup_lead'], ['Customer Service', 'Klien baru (SO New)', 'klien', 8, 'deal_baru'], ['Customer Service', 'Omzet Sales Order', 'Rp', 420000000, 'omzet'], ['Keuangan', 'Pembayaran diterima', 'Rp', 380000000, 'pembayaran'], ['Operasional', 'Kasus selesai sesuai SLA', '%', 90, 'sla_kasus'], ['HRD', 'Perawat baru masuk', 'orang', 3, 'perawat_baru']].forEach(function (x) { tgt.push({ periode: b, divisi: x[0], indikator: x[1], satuan: x[2], target: x[3], realisasi: '', sumber_otomatis: x[4], notif_minggu3_terkirim: b === BLN1 ? 'YA' : '' }); }); });
  ins(T.TARGET, tgt);

  /* ---------- Formulir Identifikasi Pasien ---------- */
  ins(T.IDF, [
    { penugasan_id: P[1].tugas.id, pasien_id: 'PSN-0002', perawat_id: 'PHC-002', tanggal_isi: '', alasan: 'Handover Pergantian (Rotasi)', status: 'Draft', diminta_oleh: 'Ns. Ratna Dewi, S.Kep', tanggal_diminta: jamLalu(30), perawat_penerima_id: 'PHC-003', kondisi_umum: 'Kesadaran compos mentis, orientasi menurun saat petang. Mobilisasi tergantung total di ranjang.', tindakan_dasar: 'Alih baring tiap 2 jam, ROM pasif ekstremitas kanan pukul 10.00.', tindakan_kdm: '' },
    { penugasan_id: P[0].prev2.id, pasien_id: 'PSN-0001', perawat_id: 'PHC-001', tanggal_isi: waktu(hari(-31), 14, 20), alasan: 'Evaluasi', status: 'Ditinjau', diminta_oleh: 'Ns. Ratna Dewi, S.Kep', tanggal_diminta: waktu(hari(-33), 9, 0), tanggal_ditinjau: waktu(hari(-30), 10, 5), ditinjau_oleh: 'Ns. Ratna Dewi, S.Kep', kondisi_umum: 'Pasien sadar, hemiparesis dextra, komunikasi verbal terbatas namun kooperatif.', tindakan_dasar: 'Mandi washlap air hangat 06.30 & 16.00, perawatan kulit anti dekubitus (zinc oxide sakrum & tumit).', tindakan_kdm: 'Ganti pampers tiap 4 jam & bila basah, kosongkan urine bag >500 cc, nutrisi enteral 6×200 kkal.', penyakit_penyerta: 'Hipertensi stage II; alergi penisilin.', kegiatan_pagi: '06.00 cek TTV & GDS (Senin/Kamis), 07.30 susu diabetasol + obat pagi, 08.30 jemur pagi 20 menit di kursi roda.', kegiatan_siang: '11.30 diet blender 250 kkal via NGT, 12.30 alih baring kanan, 13.00 tidur siang.', kegiatan_sore: '15.30 jus buah saring 150 ml, 16.00 seka sore, 17.00 stimulasi kognitif ringan.', kegiatan_malam: '19.00 nutrisi + obat tensi, 20.30 posisi semi-Fowler 30°, alih baring 22.00/00.00/02.00/04.00.', perlakuan_keluarga: 'Keluarga sangat kooperatif; Bpk. Irfan memeriksa buku laporan fisik tiap 20.00.', perlakuan_pasien: 'Pasien hangat bila diajak bicara pelan, suka dipanggil "Bapak Haji".', hak_perawat_ket: 'Kamar istirahat lantai 2 (AC), makan 3× disediakan, waktu ibadah fleksibel.', saran_perawat: 'Genggam tangan kiri pasien 1–2 menit sebelum tindakan sonde agar tenang. Laporkan bila TD > 150 mmHg.' },
    { penugasan_id: P[3].tugas.id, pasien_id: 'PSN-0004', perawat_id: 'PHC-' + P[3].tugas.perawat_id.slice(4), tanggal_isi: waktu(hari(-1), 9, 40), alasan: 'Handover Pergantian (Infal)', status: 'Selesai', diminta_oleh: 'Ns. Ratna Dewi, S.Kep', tanggal_diminta: waktu(hari(-2), 15, 0), perawat_penerima_id: 'PHC-005', kondisi_umum: 'Lansia frailty, nyeri lutut bilateral skala 3–4, berjalan dengan walker.', tindakan_dasar: 'Pendampingan berjalan dengan walker, kompres hangat lutut pagi.', tindakan_kdm: 'BAK mandiri ke toilet dengan pendampingan; BAB tiap 2 hari.', penyakit_penyerta: 'Osteoporosis.', kegiatan_pagi: 'Senam ringan 15 menit, sarapan 07.00, obat 08.00.', kegiatan_siang: 'Tidur siang 13.00–14.30.', kegiatan_sore: 'Duduk di teras, minum teh tanpa gula.', kegiatan_malam: 'Tidur 20.30, lampu tidur menyala.', perlakuan_keluarga: 'Anak tinggal serumah, ramah.', perlakuan_pasien: 'Suka bercerita masa muda.', hak_perawat_ket: 'Kamar di lantai bawah, makan disediakan.', saran_perawat: 'Pastikan walker selalu di sisi kanan ranjang.' },
    { penugasan_id: P[5].tugas.id, pasien_id: 'PSN-0006', perawat_id: P[5].tugas.perawat_id, alasan: 'Evaluasi', status: 'Draft', diminta_oleh: 'Ns. Ratna Dewi, S.Kep', tanggal_diminta: jamLalu(8) }
  ]);

  /* ---------- Modul opsional: penilaian & kunjungan ---------- */
  ins(T.NILAI, [0, 2, 5, 8, 11, 14].map(function (i, k) { var s = {}; CC.BAWAAN.penilaian.butir.forEach(function (b, q) { s[b] = 3 + ((k + q) % 3 === 0 ? 1 : 2) - (k === 3 && q === 2 ? 1 : 0); if (s[b] > 5) s[b] = 5; }); var v = Object.keys(s).map(function (x) { return s[x]; }); return { penugasan_id: P[i].tugas.id, pasien_id: P[i].tugas.pasien_id, perawat_id: P[i].tugas.perawat_id, periode: BLN1, tanggal_nilai: hari(-antara(3, 20)), skor_per_butir: JSON.stringify(s), skor_total: Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10, komentar: ['Perawat sangat telaten dan sabar.', 'Komunikasi baik, laporan rutin.', 'Mohon lebih tepat waktu saat pergantian shift.', 'Keluarga puas, pasien nyaman.', 'Perlu lebih aktif mengabari via WA.', 'Rapi dan cekatan.'][k], diisi_oleh: 'Amanda Putri Lestari', status: 'Tercatat' }; }));
  ins(T.KUNJ, [{ penugasan_id: P[0].tugas.id, pasien_id: 'PSN-0001', perawat_id: 'PHC-001', tanggal: hari(-6), petugas_id: 'Ns. Ratna Dewi, S.Kep', temuan: 'Dokumentasi alih baring di lembar kontrol lengkap; area sakrum bersih.', tindak_lanjut: 'Pertahankan.', status: 'Tercatat' }, { penugasan_id: P[18].tugas.id, pasien_id: 'PSN-0019', perawat_id: P[18].tugas.perawat_id, tanggal: hari(-3), petugas_id: 'Ns. Ratna Dewi, S.Kep', temuan: 'Dekubitus sakrum grade III, balutan basah; kasur dekubitus belum tersedia.', tindak_lanjut: 'Koordinasi keluarga pengadaan kasur anti-dekubitus.', kasus_id: 'KSS-0044', status: 'Tercatat' }, { pasien_id: 'PSN-0009', perawat_id: P[8].tugas.perawat_id, penugasan_id: P[8].tugas.id, tanggal: hari(3), petugas_id: 'Ns. Ratna Dewi, S.Kep', temuan: 'Dijadwalkan: evaluasi kepatuhan pergantian shift.', tindak_lanjut: '', status: 'Terjadwal' }]);
  ins(T.MESS, [{ jenis: 'Mess', perawat_id: 'PHC-013', nama_mess: 'Mess Cilandak', kamar: 'A-2', tanggal_masuk: hari(-40), status: 'Aktif', catatan: 'Standby' }, { jenis: 'Mess', perawat_id: 'PHC-014', nama_mess: 'Mess Cilandak', kamar: 'A-3', tanggal_masuk: hari(-15), status: 'Aktif' }, { jenis: 'Antar-Jemput', perawat_id: 'PHC-005', penugasan_id: infal1.id, tanggal_antar: hari(-1), titik_jemput: 'Mess Cilandak', tujuan: 'Bintaro Sektor 9', sopir_kendaraan: 'Pak Darto · B 1923 TKA', biaya: 150000, status: 'Selesai' }]);

  /* ---------- Template dokumen (versi 1 aktif untuk demo) ---------- */
  ins(T.TPL, Object.keys(CC.TPL_AWAL).map(function (j, i) { return { id: 'TPL-' + U.pad(i + 1, 4), jenis_dokumen: j, varian: '', nama: CC.DOK[j].label + ' v1', versi: 1, mode: 'Editor', isi_blok: JSON.stringify(CC.TPL_AWAL[j]), pengaturan_halaman: JSON.stringify(CC.HALAMAN_AWAL), status: opsi.templateDraf ? 'Draf' : 'Aktif', berlaku_mulai: U.tambahBulan(H, -6), alasan: 'Template awal dari dokumen client (dikonversi)' }; }));

  /* ---------- Antrean notifikasi & blast (riwayat) ---------- */
  var notif = [];
  lap.slice(-40).forEach(function (l, i) { var ps = pasRows.filter(function (p) { return p.id === l.pasien_id; })[0]; notif.push({ kanal: 'WA', tujuan: U.hp62(ps.no_wa_pj), nama_penerima: ps.nama_pj, pesan: 'Laporan harian ' + ps.nama_pasien + ' shift ' + CC.shiftInfo(l.shift).label + ' — kondisi ' + l.kondisi_pasien + '.', event: 'LAPORAN_TERKIRIM', ref_id: l.id, status: i % 19 === 7 ? 'Gagal' : 'Terkirim', percobaan: i % 19 === 7 ? 3 : 1, respon: i % 19 === 7 ? 'number not registered' : 'OK (simulasi)', dikirim_pada: l.waktu_isi, dibuat_pada: l.waktu_isi }); });
  var uKep = 'USR-102';
  [['Kondisi pasien perlu pemantauan', 'Ny. Ratna Sari: kondisi Perlu pemantauan (Pagi) dilaporkan Ns. Ayu Lestari.', 'KONDISI_PASIEN', uKep], ['Kasus KSS-0040 Overdue', 'Kasus "Luka diabetik bertambah eksudat" melewati SLA.', 'KASUS_OVERDUE', 'USR-101'], ['Draf perpanjangan siap', 'Penugasan Ny. Siti Aminah berakhir dalam 3 hari. Draf perpanjangan siap ditinjau.', 'PERPANJANGAN', 'USR-108'], ['Formulir identifikasi diminta', 'Mohon isi Formulir Identifikasi Pasien untuk Ny. Ratna Sari (Handover Pergantian).', 'IDF_DIMINTA', 'USR-104'], ['Pengajuan gaji menunggu verifikasi', 'Pengajuan GAJ periode ' + BLN1 + ' menunggu persetujuan Keuangan.', 'PENGAJUAN_STATUS', 'USR-112'], ['Lead belum di-follow up', 'Lead LED-0007 (Bpk. Aditya Pratama) belum di-follow up > 2 hari.', 'LEAD_2HARI', 'USR-108'], ['Laporan harian belum masuk', 'Laporan Tn. Suryo Hadiprojo shift Pagi belum masuk.', 'LAPORAN_PENGINGAT', 'USR-103']].forEach(function (n, i) { notif.push({ kanal: 'INAPP', tujuan: n[3], user_tujuan: n[3], nama_penerima: '', subjek: n[0], pesan: n[1], event: n[2], ref_id: '', status: 'Terkirim', dibaca: i > 4 ? 'YA' : 'TIDAK', dikirim_pada: jamLalu(i * 3 + 1), dibuat_pada: jamLalu(i * 3 + 1) }); });
  ins(T.NOTIF, notif);
  ins(T.BLAST, [{ judul: 'Info libur Natal & jadwal infal', pesan: 'Assalamu\'alaikum {nama}, menjelang libur Natal & Tahun Baru, jadwal infal sudah dibagikan oleh koordinator. — {institusi}', sasaran: 'Segmen: Perawat', total: 30, terkirim: 29, gagal: 1, ukuran_batch: 10, jeda_detik: '5', status: 'Selesai', dibuat_oleh_nama: 'Bayu Kurniawan', selesai_pada: waktu(hari(-4), 10, 40) }]);

  /* ---------- Penggajian: 2 bulan lalu dibayar, bulan lalu diajukan ---------- */
  var ctxKeu = { user: users[11], peran: 'KEU' }, ctxKep = { user: users[1], peran: 'KEP' };
  CC._setCache = null;
  try {
    CC.A['gaji.hitung'].fn(ctxKep, { periode: BLN2 });
    var aj2 = CC.A['gaji.ajukan'].fn(ctxKep, { periode: BLN2, bukti: 'rekap-absensi-' + BLN2 + '.xlsx' });
    CC.A['gaji.status'].fn(ctxKeu, { id: aj2.id, status: 'Disetujui' });
    var r2 = CC.aktifSaja(CC.semua(T.GAJI)).filter(function (r) { return r.periode_kode === BLN2; });
    CC.A['gaji.done'].fn(ctxKeu, { ids: r2.map(function (r) { return r.id; }), tanggal_bayar: U.tambahHari(U.tambahBulan(BLN2 + '-01', 1), 4) });
    CC.A['gaji.hitung'].fn(ctxKep, { periode: BLN1 });
    var r1 = CC.aktifSaja(CC.semua(T.GAJI)).filter(function (r) { return r.periode_kode === BLN1; });
    if (r1[2]) CC.A['gaji.koreksi'].fn(ctxKeu, { id: r1[2].id, koreksi: 150000, alasan: 'Penggantian transport darurat rujukan pasien' });
    CC.A['gaji.ajukan'].fn(ctxKep, { periode: BLN1, bukti: 'rekap-absensi-' + BLN1 + '.xlsx' });
    // periode sebelum modul Penggajian dipakai: rekap transfer gaji dicatat manual di jurnal (agar laporan laba realistis)
    var jr = [];
    for (var mg = 6; mg >= 2; mg--) {
      var bg0 = U.bulan(U.parse(U.tambahBulan(BLN + '-01', -mg))), pend0 = invRows.filter(function (r) { return String(r.tanggal_terbit).slice(0, 7) === bg0 && r.status_invoice !== 'Batal'; }).reduce(function (a, r) { return a + CC.u.angka(r.subtotal); }, 0);
      var sis0 = CC.aktifSaja(CC.semua(T.GAJI)).filter(function (r) { return r.periode_kode === bg0; }).reduce(function (a, r) { return a + Math.max(0, CC.u.angka(r.total)); }, 0), nom0 = Math.round((pend0 * 0.5 - sis0) / 10000) * 10000;
      if (nom0 > 0) jr.push({ tanggal: U.tambahHari(U.tambahBulan(bg0 + '-01', 1), 4), tipe: 'Keluar', kategori: 'Gaji Perawat', akun: 'Bank', nominal: nom0, sumber: 'Manual', status_pengajuan: 'Tercatat', diajukan_oleh: 'M. Ridwan Syah, S.E., Ak.', keterangan: 'Rekap transfer gaji perawat periode ' + U.NAMA_BULAN[Number(bg0.slice(5)) - 1] + ' (sebelum modul Penggajian dipakai)' });
    }
    if (jr.length) CC.tambahBanyak(sys, T.JURNAL, jr);
  } catch (e) { if (CC.env.catat) CC.env.catat('Seed gaji: ' + e.message); }

  /* ---------- Dokumen terbit (Surat Tugas & SPK) ---------- */
  try {
    var ctxTtd = { user: users[1], peran: 'KEP' };
    [P[0].tugas.id, P[2].tugas.id].forEach(function (pid) { ['ST', 'SPK'].forEach(function (j) { var d = CC.A['dok.buat'].fn(ctxTtd, { jenis: j, ref_id: pid }); CC.A['dok.tandatangani'].fn(ctxTtd, { id: d.id, pin: pinStaf }); }); });
    CC.A['dok.buat'].fn(ctxTtd, { jenis: 'ST', ref_id: P[5].tugas.id });
  } catch (e2) { if (CC.env.catat) CC.env.catat('Seed dokumen: ' + e2.message); }
  // dokumen invoice untuk verifikasi
  var invU = {}; invRows.forEach(function (r) { if (!invU[r.no_invoice]) invU[r.no_invoice] = r; });
  CC.tambahBanyak(sys, T.DOK, Object.keys(invU).slice(-25).map(function (no) { var r = invU[no]; return { jenis_dokumen: 'INVOICE', nomor: no, ref_tab: T.INV, ref_id: no, judul: 'Invoice ' + r.varian + ' ' + no, data_isian: JSON.stringify({ total: r.total_invoice, pasien_id: r.pasien_id, so_id: r.so_id }), status: 'TERBIT', penandatangan: JSON.stringify([{ slot: 1, nama: 'M. Ridwan Syah, S.E., Ak.', jabatan: 'Finance & Billing', waktu: r.tanggal_terbit + ' 11:00', metode: 'TERBIT' }]), kode_verifikasi: r.kode_verifikasi, hash_dokumen: CC.env.hashTeks ? CC.env.hashTeks(no + '|' + r.total_invoice) : '', terbit_pada: r.tanggal_terbit + ' 11:00' }; }));

  /* ---------- Rekap operasional (7 hari) & CRM ---------- */
  var rek = []; for (var d7 = 6; d7 >= 1; d7--) rek.push({ tanggal: hari(-d7), pasien_aktif: 33, perawat_aktif: 30, laporan_masuk: 38 + d7 % 4, laporan_telat: 2 + d7 % 3, belum_absen: d7 % 3, belum_lapor_kemarin: 1 + d7 % 2, pasien_tanpa_perawat: 0, kasus_belum_selesai: 5 + d7 % 3, lead_belum_followup: d7 % 3, catatan_eksekutif: d7 === 1 ? 'Kondisi pasien ventilator di Pondok Indah stabil setelah rotasi infal. Stok oksigen portabel di depo BSD terisi 100%. Follow-up lead korporat (LED-0003) didelegasikan ke Head of CS.' : '', dibuat_oleh: 'Bayu Kurniawan' });
  ins(T.REKAP, rek);
  // Lead berstatus Deal milik pasien yang sudah punya SO → tautkan agar corong penjualan sampai tahap "Menjadi SO"
  CC.semua(T.LEAD).filter(function (l) { return l.status_pipeline === 'Deal'; }).forEach(function (l) {
    var nm = String(l.nama_pasien).replace(/\s*\(\d+\)$/, ''), ps = CC.semua(T.PASIEN).filter(function (p) { return p.nama_pasien === nm; })[0]; if (!ps) return;
    var so = CC.semua(T.SO).filter(function (x) { return x.pasien_id === ps.id; }).slice(-1)[0]; if (so) CC.ubah(sys, T.LEAD, l.id, { so_id: so.id, pasien_id: ps.id });
  });
  // Penalti kontrak (modul): satu usulan menunggu keputusan Keuangan, satu sudah dibebaskan
  (function () {
    var tg = CC.semua(T.TUGAS).filter(function (t) { return t.status === 'Diperpanjang' && /^PHC/.test(t.perawat_id || ''); });
    if (tg[7]) CC.usulPenalti(sys, tg[7], 'Meninggalkan tugas tanpa izin', hari(-9));
    if (tg[19]) { tg[1] = tg[19]; var r2 = CC.usulPenalti(sys, tg[1], 'Resign tanpa pemberitahuan', hari(-40)); CC.ubah(sys, T.PENALTI, r2.id, { status: 'Dibebaskan', alasan_keputusan: 'Resign karena orang tua sakit berat; dibuktikan surat keterangan dokter.' }); }
  })();
  CC.syncCrm(sys);
  // CRM: status nomor WA hasil pengecekan, jumlah pesan, tag & catatan interaksi agar daftar kontak realistis
  (function () {
    var ks = CC.semua(T.CRM), up = [], tg = ['VIP', 'Bayar tepat waktu', 'Referensi keluarga'], intr = [];
    ks.forEach(function (k, i) {
      var p = { id: k.id };
      if (i % 11 !== 3) { p.status_wa = i % 17 === 5 ? 'Tidak Terdaftar' : 'Terdaftar'; p.cek_wa_at = hari(-(i % 9)) + ' 09:' + U.pad(10 + i % 40, 2); }
      if (k.segmen === 'Keluarga Pasien' || k.segmen === 'Perawat') { p.jumlah_pesan = 3 + (i * 7) % 40; p.terakhir_dihubungi = hari(-(i % 6)) + ' ' + U.pad(8 + i % 10, 2) + ':15'; }
      if (k.segmen === 'Keluarga Pasien' && i % 5 === 0) p.tag = tg[i % 3];
      if (k.segmen === 'Calon Klien' && i % 6 === 2) { p.opt_out = 'YA'; p.catatan = 'Minta tidak dikirimi promo.'; }
      up.push(p);
      if (k.segmen === 'Keluarga Pasien' && i % 4 === 1) intr.push({ kontak_id: k.id, kanal: 'Telepon', arah: 'Masuk', ringkasan: 'Menanyakan jadwal kunjungan dokter & stok obat rutin; diteruskan ke koordinator.', ref_id: k.ref_id, oleh: 'Sari Wulandari', tanggal: hari(-(i % 7)) + ' 10:2' + (i % 10) });
      if (k.segmen === 'Calon Klien' && i % 3 === 0) intr.push({ kontak_id: k.id, kanal: 'WA', arah: 'Keluar', ringkasan: 'Mengirim brosur paket Basic & Premium beserta simulasi biaya 3 bulan.', ref_id: k.ref_id, oleh: 'Sari Wulandari', tanggal: hari(-(i % 5)) + ' 14:0' + (i % 10) });
    });
    CC.ubahBanyak(sys, T.CRM, up); if (intr.length) ins(T.CRMI, intr);
  })();
  CC._setCache = null;
  try { CC.jalankanTerjadwal(); } catch (e3) { if (CC.env.catat) CC.env.catat('Seed terjadwal: ' + e3.message); }
  return { pasien: pasien.length, perawat: phc.length + phv.length, penugasan: tugas.length, laporan: lap.length, so: soRows.length, invoice: Object.keys(invU).length };
};
