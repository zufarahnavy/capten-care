/* =====================================================================
 * CAPTEN CARE — LOGIKA MODUL OPERASIONAL (BERSAMA: Logika_Modul.gs)
 * Akun & sesi, dashboard per peran, pasien, perawat, penugasan, absensi,
 * libur/cuti/lembur, laporan harian A–H, Home Visit, identifikasi pasien,
 * pipeline CS, kasus & SLA, turnover, rekrutmen, operasional, notifikasi in-app.
 * ===================================================================== */
var CC = (typeof CC !== 'undefined' && CC) || {};
CC.A = CC.A || {};

/* ---------- bantuan gabung data (memo per permintaan) ---------- */
CC.peta = function (t) { var m = {}; CC.semua(t).forEach(function (r) { m[r.id] = r; }); return m; };
CC.namaPerawat = function (id) { if (!id) return ''; var r = CC.cari(String(id).indexOf('PHV') === 0 ? CC.T.PHV : CC.T.PHC, id); return r ? r.nama : id; };
CC.usersPeran = function (peran) { return CC.semua(CC.T.USER).filter(function (u) { return u.status_akun === 'Aktif' && peran.indexOf(CC.peranEfektif(u)) > -1; }); };
CC.userPerawat = function (perawatId) { var a = CC.semua(CC.T.USER); for (var i = 0; i < a.length; i++) if (a[i].perawat_id === perawatId && a[i].status_akun === 'Aktif') return a[i]; return null; };
CC.shiftDaftar = function () { return CC.set('shift') || CC.BAWAAN.shift; };
CC.shiftInfo = function (kode) { var s = CC.shiftDaftar(); for (var i = 0; i < s.length; i++) if (s[i].kode === kode) return s[i]; return { kode: kode, label: kode, batas: '20:00' }; };
CC.batasLaporan = function (tanggal, shift) { var s = CC.shiftInfo(shift); return (s.hariBerikut ? CC.u.tambahHari(tanggal, 1) : tanggal) + ' ' + s.batas; };
CC.tugasAktifPada = function (t, hari) { var akhir = t.tanggal_akhir_aktual || t.tanggal_akhir; return t.status_arsip !== 'Arsip' && t.status !== 'Dibatalkan' && hari >= t.tanggal_mulai && (!akhir || hari <= akhir); };
CC.shiftTugas = function (t) { return String(t.shift || '24J').split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
CC.penerimaLaporan = function (p) {
  var a = CC.u.json(p.penerima_laporan, null);
  if (!a || !a.length) a = [{ nama: p.nama_pj, relasi: p.relasi_pj, wa: p.no_wa_pj, email: p.email_pj, aktif: true }];
  return a.filter(function (x) { return x.aktif !== false; });
};

/* ===================== NOTIFIKASI (antrean) ===================== */
CC.EVENT = {
  LAPORAN_PENGINGAT: { label: 'Laporan harian belum masuk (H+1 & H+3 jam) → perawat', wa: true, email: false, pesan: 'Halo {nama}, laporan harian *{pasien}* shift {shift} tanggal {tanggal} belum masuk (batas {batas}). Mohon segera diisi di aplikasi Capten Care.' },
  LAPORAN_ESKALASI: { label: 'Laporan belum masuk (eskalasi) → Koordinator', wa: true, email: false, inapp: true, pesan: 'Eskalasi: laporan *{pasien}* shift {shift} ({tanggal}) oleh {perawat} belum masuk lebih dari 3 jam setelah batas.' },
  LAPORAN_TERKIRIM: { label: 'Laporan harian terkirim → penerima laporan pasien', wa: true, email: true, subjek: 'Laporan Harian {pasien} — {tanggal}', pesan: 'Yth. {nama},\nLaporan perawatan *{pasien}* shift {shift} ({tanggal}):\n• TTV: TD {tensi}, Nadi {nadi}, Suhu {suhu}°C, SpO2 {spo2}%\n• Kondisi: *{kondisi}*\n{catatan}\n— {perawat}, Capten Care' },
  KASUS_OVERDUE: { label: 'Kasus melewati SLA (Overdue) → Admin', wa: false, email: true, inapp: true, subjek: 'Kasus {kode} Overdue', pesan: 'Kasus {kode} "{judul}" melewati SLA ({tenggat}). PIC: {pic}.' },
  KASUS_3HARI: { label: 'Kasus belum selesai 3 hari → Keperawatan/HV', wa: false, email: true, inapp: true, subjek: 'Kasus {kode} belum selesai', pesan: 'Kasus {kode} "{judul}" sudah {hari} hari belum selesai.' },
  LEAD_2HARI: { label: 'Lead belum di-follow up > 2 hari → CS', wa: true, email: false, inapp: true, pesan: 'Lead {kode} ({kontak}) belum di-follow up sejak {terakhir}. Segera hubungi calon klien.' },
  TARGET_MINGGU3: { label: 'Target bulanan belum tercapai (minggu ke-3)', wa: false, email: true, inapp: true, subjek: 'Capaian target {periode}', pesan: 'Target "{indikator}" divisi {divisi} baru {persen}% per tanggal 15.' },
  FORM_MASUK: { label: 'Formulir pasien / lamaran masuk → CS / HRD', wa: false, email: false, inapp: true, pesan: '{jenis} baru dari {nama}.' },
  PENGAJUAN_STATUS: { label: 'Perubahan status pengajuan gaji / petty cash → pengaju', wa: true, email: false, inapp: true, pesan: 'Pengajuan {kode} ({nominal}) kini berstatus *{status}*. {alasan}' },
  ROTASI: { label: 'Perpindahan perawat / penerima laporan → pihak terkait', wa: true, email: false, inapp: true, pesan: 'Info rotasi pasien *{pasien}*: {dari} → {ke}, efektif {tanggal}.' },
  PERPANJANGAN: { label: 'Penugasan berakhir 3 hari lagi & draf perpanjangan siap', wa: true, email: false, inapp: true, pesan: 'Penugasan {kode} ({pasien}) berakhir {tanggal}. Draf perpanjangan {so} siap ditinjau.' },
  INVOICE_JATUH_TEMPO: { label: 'Invoice melewati jatuh tempo → CS & Keuangan', wa: false, email: true, inapp: true, subjek: 'Invoice {no} jatuh tempo', pesan: 'Invoice {no} ({pasien}) sisa {sisa} lewat jatuh tempo {tempo}.' },
  INVOICE_KIRIM: { label: 'Kirim invoice ke klien', wa: true, email: true, subjek: 'Invoice {no} — Capten Care', pesan: 'Yth. {nama},\nBerikut tagihan layanan Capten Care nomor *{no}* sebesar *{total}* (jatuh tempo {tempo}).\nTransfer ke {rekening}.\nVerifikasi dokumen: {link}\nTerima kasih.' },
  PEMBAYARAN_DICATAT: { label: 'Pembayaran invoice dicatat → CS', wa: false, email: false, inapp: true, pesan: 'Pembayaran {nominal} untuk {no} dicatat. Status: {status}.' },
  GAJI_SIAP: { label: 'Periode gaji siap ditinjau / data belum lengkap', wa: false, email: false, inapp: true, pesan: 'Draf penggajian {periode} siap ditinjau. {catatan}' },
  KONDISI_PASIEN: { label: 'Kondisi pasien perlu pemantauan / berubah → Koordinator', wa: true, email: false, inapp: true, pesan: '⚠ {pasien}: kondisi *{kondisi}* ({shift}, {tanggal}) dilaporkan {perawat}. {ket}' },
  IDF_DIMINTA: { label: 'Formulir Identifikasi Pasien diminta → perawat pengisi', wa: true, email: false, inapp: true, pesan: 'Mohon isi Formulir Identifikasi Pasien untuk *{pasien}* ({alasan}). Buka menu Identifikasi Pasien.' },
  IDF_SELESAI: { label: 'Formulir Identifikasi selesai diisi → Koordinator', wa: false, email: false, inapp: true, pesan: 'Formulir identifikasi {kode} ({pasien}) selesai diisi dan menunggu tinjauan.' },
  IDF_DITINJAU: { label: 'Formulir Identifikasi ditinjau → perawat baru', wa: false, email: false, inapp: true, pesan: 'Operan tugas pasien {pasien} sudah tersedia. Baca sebelum bertugas.' },
  PENALTI_USULAN: { label: 'Usulan penalti kontrak dibuat (modul aktif)', wa: false, email: false, inapp: true, pesan: 'Usulan penalti {kode} untuk {perawat}: {total}.' },
  PENILAIAN_JATUH_TEMPO: { label: 'Penilaian klien berkala jatuh tempo (modul aktif)', wa: false, email: false, inapp: true, pesan: 'Penilaian klien untuk {pasien} / {perawat} jatuh tempo.' }
};
CC.matriksNotif = function () {
  var s = (CC.set('notif') || {}).matriks || {}, out = {};
  Object.keys(CC.EVENT).forEach(function (k) {
    var d = CC.EVENT[k], m = s[k] || {};
    out[k] = { kode: k, label: d.label, wa: m.wa !== undefined ? !!m.wa : !!d.wa, email: m.email !== undefined ? !!m.email : !!d.email, inapp: m.inapp !== undefined ? !!m.inapp : !!d.inapp, subjek: m.subjek || d.subjek || d.label, pesan: m.pesan || d.pesan, pesanBawaan: d.pesan, subjekBawaan: d.subjek || '' };
  });
  return out;
};
/* penerima: [{nama, wa, email, user_id}] — in-app hanya bila user_id ada */
CC.notif = function (ctx, event, penerima, vars, ref) {
  try {
    var cfg = CC.set('notif') || {}, m = CC.matriksNotif()[event]; if (!m) return 0;
    var rows = [], now = CC.u.dt(), prof = CC.set('profil') || {};
    penerima.forEach(function (p) {
      if (!p) return;
      var v = Object.assign({ institusi: prof.brand || 'Capten Care' }, vars || {}, { nama: p.nama || 'Bapak/Ibu' });
      var pesan = CC.u.isi(m.pesan, v), subjek = CC.u.isi(m.subjek, v);
      if (p.user_id && (m.inapp || (!m.wa && !m.email))) rows.push({ kanal: 'INAPP', tujuan: p.user_id, user_tujuan: p.user_id, nama_penerima: p.nama, subjek: subjek, pesan: pesan, event: event, ref_id: ref || '', status: 'Terkirim', dibaca: 'TIDAK', dikirim_pada: now });
      if (cfg.wa_aktif && m.wa && CC.u.hpValid(p.wa)) rows.push({ kanal: 'WA', tujuan: CC.u.hp62(p.wa), nama_penerima: p.nama, pesan: pesan, event: event, ref_id: ref || '', status: 'Antri', percobaan: 0 });
      if (cfg.email_aktif && m.email && CC.u.emailValid(p.email)) rows.push({ kanal: 'EMAIL', tujuan: String(p.email).trim(), nama_penerima: p.nama, subjek: subjek, pesan: pesan, event: event, ref_id: ref || '', status: 'Antri', percobaan: 0 });
    });
    if (!rows.length) return 0;
    CC.tambahBanyak(ctx, CC.T.NOTIF, rows);
    if (CC.env.antreanBaru) CC.env.antreanBaru(rows.filter(function (r) { return r.kanal !== 'INAPP'; }).length);
    return rows.length;
  } catch (e) { return 0; }
};
CC.penerimaUser = function (users) { return users.map(function (u) { return { nama: u.nama, wa: u.no_wa, email: u.email, user_id: u.id }; }); };

/* ===================== AKUN & SESI (US-01..03) ===================== */
CC.A['auth.login'] = {
  publik: true, tulis: true, cache: 'none',
  fn: function (ctx, p) {
    var uname = String(p.username || '').trim().toLowerCase(), pin = String(p.pin || '');
    if (!uname || !pin) CC.galat('VALIDATION', 'Isi username dan PIN.');
    var u = CC.semua(CC.T.USER).filter(function (x) { return String(x.username).toLowerCase() === uname; })[0];
    var umum = 'Username atau PIN tidak cocok.';
    if (!u || u.status_arsip === 'Arsip') { CC.env.tunda && CC.env.tunda(400); CC.galat('VALIDATION', umum); }
    if (u.status_akun !== 'Aktif') CC.galat('FORBIDDEN', 'Akun dinonaktifkan. Hubungi Admin.');
    var kunci = CC.u.parse(u.terkunci_sampai);
    if (kunci && kunci > CC.env.now()) CC.galat('LOCKED', 'Akun terkunci sementara. Coba lagi ' + Math.ceil((kunci - CC.env.now()) / 60000) + ' menit lagi atau hubungi Admin.');
    if (!CC.env.samaAman(CC.env.hashPin(pin, u.salt), u.pin_hash)) {
      var n = Number(u.percobaan_gagal || 0) + 1, patch = { percobaan_gagal: n };
      if (n >= 5) { var t = CC.env.now(); t.setMinutes(t.getMinutes() + 15); patch.terkunci_sampai = CC.u.dt(t); patch.percobaan_gagal = 0; }
      CC.ubah(null, CC.T.USER, u.id, patch, { tanpaLog: true });
      CC.log({ user: { id: u.id, nama: u.nama, role: u.role } }, 'LOGIN_GAGAL', CC.T.USER, u.id, null, null, 'Percobaan ke-' + n);
      if (n >= 5) CC.galat('LOCKED', 'Salah PIN 5 kali. Akun dikunci 15 menit.');
      CC.galat('VALIDATION', umum + (n >= 3 ? ' Sisa percobaan: ' + (5 - n) + '.' : ''));
    }
    CC.ubah(null, CC.T.USER, u.id, { percobaan_gagal: 0, terkunci_sampai: '', terakhir_login: CC.u.dt() }, { tanpaLog: true });
    CC.log({ user: u }, 'LOGIN', CC.T.USER, u.id, null, null, '');
    return { token: CC.buatToken(u), me: CC.profilAman(u) };
  }
};
CC.cekKekuatanPin = function (u, pin) {
  var e = CC.peranEfektif(u);
  if (e === 'ADM' || e === 'KEU' || e === 'PC') { if (String(pin).length < 8) CC.galat('VALIDATION', 'Kata sandi Admin/Keuangan minimal 8 karakter.', { baru: 'Minimal 8 karakter' }); }
  else if (!/^\d{6,}$/.test(String(pin))) CC.galat('VALIDATION', 'PIN minimal 6 digit angka.', { baru: 'Minimal 6 digit angka' });
};
CC.A['auth.gantiPin'] = {
  tulis: true,
  fn: function (ctx, p) {
    var u = ctx.user;
    if (!CC.env.samaAman(CC.env.hashPin(String(p.lama || ''), u.salt), u.pin_hash)) CC.galat('VALIDATION', 'PIN lama tidak cocok.', { lama: 'PIN lama salah' });
    if (String(p.lama) === String(p.baru)) CC.galat('VALIDATION', 'PIN baru tidak boleh sama dengan PIN lama.', { baru: 'Harus berbeda' });
    CC.cekKekuatanPin(u, p.baru);
    var salt = CC.env.uuid();
    CC.ubah(ctx, CC.T.USER, u.id, { pin_hash: CC.env.hashPin(String(p.baru), salt), salt: salt, wajib_ganti_pin: 'TIDAK' }, { aksi: 'GANTI_PIN' });
    ctx.pesan = 'PIN berhasil diganti.';
    return true;
  }
};
CC.badge = function (ctx) {
  var e = ctx.peran, b = {}, now = CC.u.dt(), hari = CC.u.tgl();
  if (['ADM', 'KEP', 'HV', 'HVK', 'CS', 'OPS', 'HRD'].indexOf(e) > -1) b.kasus = CC.aktifSaja(CC.semua(CC.T.KASUS)).filter(function (k) { return k.status !== 'Selesai' && k.status !== 'Dibatalkan'; }).length;
  if (['ADM', 'CS', 'OPS'].indexOf(e) > -1) b.lead = CC.semua(CC.T.LEAD).filter(function (l) { return (l.status_pipeline === 'Lead Masuk' || l.status_pipeline === 'Follow-up') && CC.u.selisihJam(l.followup_terakhir || l.tanggal_masuk) > 48; }).length;
  if (['ADM', 'CS', 'KEU'].indexOf(e) > -1) b.tagihan = CC.ringkasInvoice().filter(function (i) { return i.terlambat; }).length;
  if (e === 'PRW') { var k = CC.kewajibanPerawat(ctx.user.perawat_id, hari); b.laporan = k.filter(function (x) { return !x.laporan_id; }).length; b.idf = CC.semua(CC.T.IDF).filter(function (f) { return f.perawat_id === ctx.user.perawat_id && f.status === 'Draft'; }).length; }
  if (e === 'KEP' || e === 'ADM') b.idf = CC.semua(CC.T.IDF).filter(function (f) { return f.status === 'Selesai'; }).length;
  if (e === 'KEP' || e === 'ADM' || e === 'OPS') b.laporan = CC.laporanBelumMasuk(hari).length;
  return b;
};
CC.A['auth.boot'] = {
  fn: function (ctx) {
    var u = ctx.user, notif = CC.semua(CC.T.NOTIF).filter(function (n) { return n.kanal === 'INAPP' && n.user_tujuan === u.id && n.dibaca !== 'YA'; }).length;
    var prof = CC.set('profil'), gaji = CC.set('gaji');
    return {
      me: CC.profilAman(u), menu: CC.menuUntuk(u), modul: CC.set('modul'), branding: CC.set('branding'), shift: CC.shiftDaftar(), master: CC.set('master'),
      profil: { brand: prof.brand, nama_perusahaan: prof.nama_perusahaan, kota: prof.kota, rekening: prof.rekening, alamat: prof.alamat, telepon: prof.telepon, email: prof.email, izin: prof.izin, website: prof.website },
      format_laporan: CC.set('format_laporan'), operasional: CC.set('operasional'), badge: CC.badge(ctx), notif_belum: notif,
      paket: CC.aktifSaja(CC.semua(CC.T.PAKET)).sort(function (a, b) { return Number(a.urutan) - Number(b.urutan); }).map(function (p) { var c = Object.assign({}, p); if (!CC.lihatNominal(ctx) && ctx.peran !== 'KEP') { c.harga_bawaan = ''; } if (!CC.lihatMargin(ctx) && ctx.peran !== 'KEP') c.gaji_bawaan = ''; return c; }),
      gaji_tersimpan: !!gaji && CC.setRiwayat('gaji').length > 0,
      server: { versi: CC.VERSI, waktu: CC.u.dt(), mode: CC.env.mode }
    };
  }
};
CC.A['publik.tema'] = { publik: true, fn: function () { var b = CC.set('branding'), p = CC.set('profil'); return { branding: b, profil: { brand: p.brand, nama_perusahaan: p.nama_perusahaan, wa: p.wa, email: p.email } }; } };
CC.A['notif.inapp'] = {
  fn: function (ctx) {
    var a = CC.semua(CC.T.NOTIF).filter(function (n) { return n.kanal === 'INAPP' && n.user_tujuan === ctx.user.id; }).sort(function (a, b) { return a.dibuat_pada < b.dibuat_pada ? 1 : -1; }).slice(0, 40);
    return { rows: a.map(function (n) { return { id: n.id, judul: n.subjek, pesan: n.pesan, event: n.event, ref: n.ref_id, waktu: n.dibuat_pada, dibaca: n.dibaca === 'YA' }; }), belum: a.filter(function (n) { return n.dibaca !== 'YA'; }).length };
  }
};
CC.A['notif.baca'] = {
  tulis: true, cache: 'none',
  fn: function (ctx, p) {
    var ids = p.semua ? CC.semua(CC.T.NOTIF).filter(function (n) { return n.kanal === 'INAPP' && n.user_tujuan === ctx.user.id && n.dibaca !== 'YA'; }).map(function (n) { return n.id; }) : [p.id];
    CC.ubahBanyak(ctx, CC.T.NOTIF, ids.map(function (id) { return { id: id, dibaca: 'YA' }; }));
    return true;
  }
};

/* ===================== PENCARIAN GLOBAL (Ctrl+K) ===================== */
CC.A['cari.global'] = {
  fn: function (ctx, p) {
    var q = String(p.q || '').toLowerCase().trim(); if (q.length < 2) return [];
    var out = [], e = ctx.peran, cocok = function (s) { return String(s || '').toLowerCase().indexOf(q) > -1; };
    var pas = CC.saring(ctx, 'pasien', CC.aktifSaja(CC.semua(CC.T.PASIEN)));
    if (CC.boleh(ctx.user, CC.MOD.pasien.r)) pas.forEach(function (r) { if (cocok(r.nama_pasien) || cocok(r.id) || cocok(r.diagnosa)) out.push({ jenis: 'Pasien', id: r.id, judul: r.nama_pasien, sub: r.id + ' · ' + (r.diagnosa || ''), rute: 'pasien', ikon: 'contact-round' }); });
    if (['ADM', 'KEP', 'CS', 'HRD', 'OPS', 'KEU'].indexOf(e) > -1) CC.aktifSaja(CC.semua(CC.T.PHC)).forEach(function (r) { if (cocok(r.nama) || cocok(r.id)) out.push({ jenis: 'Perawat', id: r.id, judul: r.nama, sub: r.id + ' · ' + r.jabatan, rute: 'perawat', ikon: 'users-round' }); });
    if (['ADM', 'CS', 'KEU', 'OPS'].indexOf(e) > -1) CC.ringkasInvoice().forEach(function (i) { if (cocok(i.no_invoice) || cocok(i.nama_pasien)) out.push({ jenis: 'Invoice', id: i.no_invoice, judul: i.no_invoice, sub: i.nama_pasien + ' · ' + i.status, rute: 'sales', ikon: 'receipt-text' }); });
    if (['ADM', 'KEP', 'HV', 'HVK', 'CS', 'HRD', 'OPS'].indexOf(e) > -1) CC.semua(CC.T.KASUS).forEach(function (k) { if (cocok(k.judul) || cocok(k.id)) out.push({ jenis: 'Kasus', id: k.id, judul: k.judul, sub: k.id + ' · ' + k.status, rute: 'kasus', ikon: 'circle-alert' }); });
    if (['ADM', 'CS', 'OPS'].indexOf(e) > -1) CC.semua(CC.T.LEAD).forEach(function (l) { if (cocok(l.nama_kontak) || cocok(l.nama_pasien) || cocok(l.id)) out.push({ jenis: 'Lead', id: l.id, judul: l.nama_kontak, sub: l.id + ' · ' + l.status_pipeline, rute: 'pipeline', ikon: 'square-kanban' }); });
    return out.slice(0, 20);
  }
};

/* ===================== KEWAJIBAN & KEPATUHAN LAPORAN (US-12..14) ===================== */
CC.kewajibanPerawat = function (perawatId, hari) {
  var out = [], lap = CC.semua(CC.T.LHC), pas = CC.peta(CC.T.PASIEN);
  CC.semua(CC.T.TUGAS).forEach(function (t) {
    if (t.perawat_id !== perawatId || !CC.tugasAktifPada(t, hari) || ['Berjalan', 'Diperpanjang', 'Selesai', 'Dihentikan lebih awal'].indexOf(t.status) === -1) return;
    CC.shiftTugas(t).forEach(function (s) {
      var ada = lap.filter(function (l) { return l.pasien_id === t.pasien_id && l.tanggal === hari && l.shift === s; })[0];
      var p = pas[t.pasien_id] || {};
      out.push({ penugasan_id: t.id, pasien_id: t.pasien_id, nama_pasien: p.nama_pasien, diagnosa: p.diagnosa, paket_id: t.paket_id, peran: t.peran, shift: s, shift_label: CC.shiftInfo(s).label, batas: CC.batasLaporan(hari, s), laporan_id: ada ? ada.id : '', status: ada ? ada.status_ketepatan : (CC.u.dt() > CC.batasLaporan(hari, s) ? 'Belum Masuk' : 'Belum Diisi'), kondisi: ada ? ada.kondisi_pasien : '' });
    });
  });
  return out;
};
/* daftar laporan wajib (yang batasnya sudah lewat) tapi belum masuk */
CC.laporanBelumMasuk = function (hari, semuaShift) {
  var lap = {}, out = [], now = CC.u.dt(), phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN);
  CC.semua(CC.T.LHC).forEach(function (l) { if (l.tanggal === hari) lap[l.pasien_id + '|' + l.shift] = l; });
  CC.semua(CC.T.TUGAS).forEach(function (t) {
    if (!CC.tugasAktifPada(t, hari) || t.status === 'Dibatalkan') return;
    var pr = phc[t.perawat_id]; if (!pr || pr.status !== 'Aktif') return;
    CC.shiftTugas(t).forEach(function (s) {
      var batas = CC.batasLaporan(hari, s);
      if (!lap[t.pasien_id + '|' + s] && (semuaShift || now > batas)) out.push({ penugasan_id: t.id, pasien_id: t.pasien_id, nama_pasien: (pas[t.pasien_id] || {}).nama_pasien, perawat_id: t.perawat_id, nama_perawat: pr.nama, no_wa: pr.no_wa, shift: s, batas: batas, telat_jam: Math.max(0, Math.round(CC.u.selisihJam(batas, now) * 10) / 10), wilayah: (pas[t.pasien_id] || {}).wilayah });
    });
  });
  return out;
};
CC.statistikKepatuhan = function (dari, sampai) {
  var now = CC.u.dt(), phc = CC.peta(CC.T.PHC), lap = {}, per = {}, harian = {}, wil = {}, pas = CC.peta(CC.T.PASIEN);
  CC.semua(CC.T.LHC).forEach(function (l) { if (l.tanggal >= dari && l.tanggal <= sampai) lap[l.pasien_id + '|' + l.tanggal + '|' + l.shift] = l; });
  var tugas = CC.semua(CC.T.TUGAS).filter(function (t) { return t.status !== 'Dibatalkan' && t.status_arsip !== 'Arsip'; });
  for (var h = dari; h <= sampai; h = CC.u.tambahHari(h, 1)) {
    tugas.forEach(function (t) {
      if (!CC.tugasAktifPada(t, h)) return;
      var pr = phc[t.perawat_id]; if (!pr || pr.status !== 'Aktif') return;
      CC.shiftTugas(t).forEach(function (s) {
        var batas = CC.batasLaporan(h, s), l = lap[t.pasien_id + '|' + h + '|' + s];
        if (!l && now <= batas) return;   // belum jatuh tempo
        var st = !l ? 'Belum Masuk' : l.status_ketepatan;
        var w = (pas[t.pasien_id] || {}).wilayah || 'Lainnya';
        [per[t.perawat_id] = per[t.perawat_id] || { perawat_id: t.perawat_id, nama: pr.nama, wajib: 0, tepat: 0, telat: 0, belum: 0 }, harian[h] = harian[h] || { tanggal: h, wajib: 0, tepat: 0, telat: 0, belum: 0 }, wil[w] = wil[w] || { wilayah: w, wajib: 0, tepat: 0, telat: 0, belum: 0, terkirim_pj: 0, pasien: {} }].forEach(function (o) {
          o.wajib++; if (st === 'Tepat Waktu') o.tepat++; else if (st === 'Terlambat') o.telat++; else o.belum++;
        });
        wil[w].pasien[t.pasien_id] = 1; if (l && /Terkirim/.test(l.status_kirim_pj)) wil[w].terkirim_pj++;
      });
    });
  }
  function pct(o) { o.persen = o.wajib ? Math.round(o.tepat / o.wajib * 1000) / 10 : 100; return o; }
  var a = Object.keys(per).map(function (k) { return pct(per[k]); }), d = Object.keys(harian).sort().map(function (k) { return pct(harian[k]); });
  var w = Object.keys(wil).map(function (k) { var o = pct(wil[k]); o.jumlah_pasien = Object.keys(o.pasien).length; delete o.pasien; o.persen_pj = o.tepat + o.telat ? Math.round(o.terkirim_pj / (o.tepat + o.telat) * 100) : 100; return o; });
  var tot = { wajib: 0, tepat: 0, telat: 0, belum: 0 }; a.forEach(function (x) { tot.wajib += x.wajib; tot.tepat += x.tepat; tot.telat += x.telat; tot.belum += x.belum; });
  return { total: pct(tot), perawat: a.sort(function (x, y) { return x.persen - y.persen; }), harian: d, wilayah: w.sort(function (x, y) { return y.jumlah_pasien - x.jumlah_pasien; }) };
};

/* ===================== DASHBOARD PER PERAN (US-29, US-30) ===================== */
CC.ringkasInvoice = function () {
  var g = {}, bayar = {}, hari = CC.u.tgl(), pas = CC.peta(CC.T.PASIEN);
  CC.semua(CC.T.BAYAR).forEach(function (b) { bayar[b.no_invoice] = (bayar[b.no_invoice] || 0) + CC.u.angka(b.nominal); });
  CC.semua(CC.T.INV).forEach(function (r) {
    var x = g[r.no_invoice];
    if (!x) x = g[r.no_invoice] = { no_invoice: r.no_invoice, varian: r.varian, tanggal_terbit: r.tanggal_terbit, jatuh_tempo: r.jatuh_tempo, so_id: r.so_id, pasien_id: r.pasien_id, nama_pasien: (pas[r.pasien_id] || {}).nama_pasien || '', status: r.status_invoice, total: 0, items: [], kode_verifikasi: r.kode_verifikasi, pdf_url: r.pdf_url, alasan_batal: r.alasan_batal };
    x.total += CC.u.angka(r.subtotal); x.items.push({ id: r.id, jenis_item: r.jenis_item, uraian: r.uraian, jumlah: r.jumlah, harga_satuan: r.harga_satuan, subtotal: r.subtotal });
  });
  return Object.keys(g).map(function (k) { var x = g[k]; x.terbayar = bayar[k] || 0; x.sisa = Math.max(0, x.total - x.terbayar); x.terlambat = x.status !== 'Batal' && x.status !== 'Lunas' && x.status !== 'Draf' && x.jatuh_tempo < hari && x.sisa > 0; x.umur_hari = CC.u.selisihHari(x.jatuh_tempo, hari); return x; }).sort(function (a, b) { return a.tanggal_terbit < b.tanggal_terbit ? 1 : -1; });
};
CC.perluTindakan = function (ctx) {
  var out = [], now = CC.u.dt(), hari = CC.u.tgl(), e = ctx.peran;
  var op = CC.set('operasional'), pas = CC.peta(CC.T.PASIEN);
  if (['ADM', 'KEP', 'HV', 'HVK', 'CS', 'OPS'].indexOf(e) > -1) CC.daftarKasus(ctx).forEach(function (k) { if (k.status === 'Overdue') out.push({ jenis: 'kasus', kode: k.id, judul: k.judul, sub: 'Overdue ' + k.sla_label + ' · PIC ' + (k.pic_nama || '-'), tingkat: 'kritis', rute: 'kasus', aksi: 'Tindak Lanjut' }); });
  if (['ADM', 'CS', 'OPS'].indexOf(e) > -1) CC.semua(CC.T.LEAD).forEach(function (l) { if ((l.status_pipeline === 'Lead Masuk' || l.status_pipeline === 'Follow-up') && CC.u.selisihJam(l.followup_terakhir || l.tanggal_masuk, now) > op.followup_hari * 24) out.push({ jenis: 'lead', kode: l.id, judul: l.nama_kontak + ' — ' + (l.nama_pasien || ''), sub: '> ' + op.followup_hari + ' hari belum di-follow up', tingkat: 'peringatan', rute: 'pipeline', aksi: 'Follow-up', wa: l.no_wa }); });
  if (['ADM', 'KEP', 'OPS', 'CS'].indexOf(e) > -1) {
    var adaPerawat = {}; CC.semua(CC.T.TUGAS).forEach(function (t) { if (t.status === 'Berjalan' && t.peran === 'Utama') adaPerawat[t.pasien_id] = 1; });
    CC.aktifSaja(CC.semua(CC.T.PASIEN)).forEach(function (p) { if (p.status === 'Aktif' && p.jenis_layanan === 'HC' && !adaPerawat[p.id]) out.push({ jenis: 'tanpa_perawat', kode: p.id, judul: p.nama_pasien, sub: 'Pasien aktif belum memiliki perawat utama', tingkat: 'kritis', rute: 'penugasan', aksi: 'Tugaskan' }); });
    CC.semua(CC.T.TUGAS).forEach(function (t) { if (t.status === 'Berjalan' && t.peran === 'Utama' && t.tanggal_akhir >= hari && CC.u.selisihHari(hari, t.tanggal_akhir) <= op.perpanjangan_hari) out.push({ jenis: 'perpanjangan', kode: t.id, judul: (pas[t.pasien_id] || {}).nama_pasien, sub: 'Penugasan berakhir ' + CC.u.tglPanjang(t.tanggal_akhir), tingkat: 'info', rute: 'sales', aksi: 'Review Draf' }); });
  }
  if (['ADM', 'CS', 'KEU', 'OPS'].indexOf(e) > -1) CC.ringkasInvoice().forEach(function (i) { if (i.terlambat) out.push({ jenis: 'invoice', kode: i.no_invoice, judul: i.nama_pasien, sub: 'Jatuh tempo ' + CC.u.tglPanjang(i.jatuh_tempo) + ' · sisa ' + CC.u.rupiah(i.sisa), tingkat: 'peringatan', rute: 'sales', aksi: 'Kirim Pengingat' }); });
  if (['ADM', 'KEP'].indexOf(e) > -1) CC.semua(CC.T.IDF).forEach(function (f) { if (f.status === 'Selesai') out.push({ jenis: 'idf', kode: f.id, judul: (pas[f.pasien_id] || {}).nama_pasien, sub: 'Formulir operan menunggu tinjauan', tingkat: 'info', rute: 'identifikasi', aksi: 'Tinjau' }); });
  var urut = { kritis: 0, peringatan: 1, info: 2 };
  return out.sort(function (a, b) { return urut[a.tingkat] - urut[b.tingkat]; });
};
CC.A['dash.data'] = {
  fn: function (ctx, p) {
    var e = ctx.peran, hari = CC.u.tgl(), bln = CC.u.bulan(), d = { peran: e, tanggal: hari };
    var pasien = CC.aktifSaja(CC.semua(CC.T.PASIEN)), tugas = CC.semua(CC.T.TUGAS), phc = CC.aktifSaja(CC.semua(CC.T.PHC));
    var aktifHC = pasien.filter(function (x) { return x.status === 'Aktif' && x.jenis_layanan === 'HC'; }), aktifHV = pasien.filter(function (x) { return x.status === 'Aktif' && x.jenis_layanan === 'HV'; });
    var paketNama = {}; CC.semua(CC.T.PAKET).forEach(function (k) { paketNama[k.id] = k.nama_paket; });
    var perPaket = {}; aktifHC.forEach(function (x) { var n = paketNama[x.paket_id] || 'Lainnya'; perPaket[n] = (perPaket[n] || 0) + 1; });
    var berjalan = tugas.filter(function (t) { return t.status === 'Berjalan' && CC.tugasAktifPada(t, hari); });
    var rentang = Number(p.rentang || 30), dari = CC.u.tambahHari(hari, -rentang + 1);
    if (e !== 'PRW' && e !== 'PC') {
      var kep = CC.statistikKepatuhan(CC.u.tambahHari(hari, -6), hari), kepHari = CC.statistikKepatuhan(hari, hari);
      var kasus = CC.daftarKasus(ctx), kasusAktif = kasus.filter(function (k) { return k.status !== 'Selesai' && k.status !== 'Dibatalkan'; });
      var selesaiSla = kasus.filter(function (k) { return k.status === 'Selesai' && k.tanggal_masuk >= dari; }), tepatSla = selesaiSla.filter(function (k) { return k.selesai_pada && k.selesai_pada <= k.sla_tenggat; });
      d.kpi = {
        pasien_aktif: aktifHC.length + aktifHV.length, pasien_hc: aktifHC.length, pasien_hv: aktifHV.length, per_paket: perPaket,
        perawat_aktif: phc.filter(function (x) { return x.status === 'Aktif'; }).length, perawat_utama: berjalan.filter(function (t) { return t.peran === 'Utama'; }).length, perawat_infal: berjalan.filter(function (t) { return t.peran === 'Infal'; }).length,
        perawat_siaga: phc.filter(function (x) { return x.status === 'Aktif' && x.status_siaga === 'Standby'; }).length,
        kepatuhan_hari: kepHari.total.persen, kepatuhan_7h: kep.total.persen, laporan_masuk_hari: kepHari.total.tepat + kepHari.total.telat, laporan_wajib_hari: kepHari.total.wajib,
        kasus_aktif: kasusAktif.length, kasus_overdue: kasusAktif.filter(function (k) { return k.status === 'Overdue'; }).length,
        sla_persen: selesaiSla.length ? Math.round(tepatSla.length / selesaiSla.length * 100) : 100,
        terisi_persen: aktifHC.length ? Math.round(aktifHC.filter(function (x) { return berjalan.some(function (t) { return t.pasien_id === x.id && t.peran === 'Utama'; }); }).length / aktifHC.length * 100) : 100,
        lead_followup_persen: (function () { var l = CC.semua(CC.T.LEAD).filter(function (x) { return x.tanggal_masuk >= dari; }); if (!l.length) return 100; return Math.round(l.filter(function (x) { return x.followup_terakhir && CC.u.selisihJam(x.tanggal_masuk, x.followup_terakhir) <= 48; }).length / l.length * 100); })()
      };
      // grafik kasus per minggu/hari
      var seri = [], langkah = rentang <= 7 ? 1 : rentang <= 30 ? 3 : 7;
      for (var h = dari; h <= hari; h = CC.u.tambahHari(h, langkah)) {
        var akhir = CC.u.tambahHari(h, langkah - 1); if (akhir > hari) akhir = hari;
        var dlm = kasus.filter(function (k) { return k.tanggal_masuk.slice(0, 10) >= h && k.tanggal_masuk.slice(0, 10) <= akhir; });
        seri.push({ label: h, masuk: dlm.length, proses: dlm.filter(function (k) { return k.status === 'Proses' || k.status === 'Masuk'; }).length, selesai: dlm.filter(function (k) { return k.status === 'Selesai'; }).length, overdue: dlm.filter(function (k) { return k.status === 'Overdue'; }).length });
      }
      d.grafik_kasus = seri;
      d.kepatuhan_harian = CC.statistikKepatuhan(dari, hari).harian;
      d.perlu_tindakan = CC.perluTindakan(ctx).slice(0, 12);
      d.laporan_terbaru = CC.daftarLaporan(ctx, { dari: CC.u.tambahHari(hari, -1), sampai: hari }).slice(0, 8);
    }
    if (e === 'ADM' || e === 'KEU' || e === 'OPS') {
      var inv = CC.ringkasInvoice().filter(function (i) { return i.status !== 'Batal'; });
      var so = CC.semua(CC.T.SO).filter(function (s) { return s.periode_bulan === bln && s.status !== 'Batal' && s.status !== 'Draf Perpanjangan'; });
      var omzet = so.reduce(function (a, s) { return a + CC.u.angka(s.total); }, 0), hpp = so.reduce(function (a, s) { return a + (s.margin === '' || s.margin == null ? CC.u.angka(s.hpp_pokok) : CC.u.angka(s.total) - CC.u.angka(s.margin)); }, 0);   // sama dengan Analitik Penjualan (HPP pokok + estimasi tambahan)
      d.keuangan = { omzet: omzet, so_jumlah: so.length, piutang: inv.reduce(function (a, i) { return a + i.sisa; }, 0), invoice_tertunda: inv.filter(function (i) { return i.sisa > 0; }).length, invoice_terlambat: inv.filter(function (i) { return i.terlambat; }).length, margin_persen: e === 'OPS' ? null : (omzet ? Math.round((omzet - hpp) / omzet * 1000) / 10 : 0), saldo_pc: CC.saldoPettyCash(), terbayar_bulan: CC.semua(CC.T.BAYAR).filter(function (b) { return String(b.tanggal_bayar).slice(0, 7) === bln; }).reduce(function (a, b) { return a + CC.u.angka(b.nominal); }, 0) };
      d.target = CC.capaianTarget(bln).slice(0, 6);
    }
    if (e === 'KEP') {
      d.belum_masuk = CC.laporanBelumMasuk(hari).slice(0, 12);
      d.pantau = CC.daftarLaporan(ctx, { dari: CC.u.tambahHari(hari, -2), sampai: hari }).filter(function (l) { return l.kondisi_pasien && l.kondisi_pasien !== 'Stabil'; }).slice(0, 8);
      d.target = CC.capaianTarget(bln).filter(function (t) { return t.divisi === 'Keperawatan'; });
    }
    if (e === 'HV' || e === 'HVK') {
      var lhv = CC.semua(CC.T.LHV);
      d.hv = { hari_ini: lhv.filter(function (x) { return x.tanggal === hari; }).map(CC.gabungHV), bulan_ini: lhv.filter(function (x) { return x.tanggal.slice(0, 7) === bln && x.status === 'Selesai'; }).length, terjadwal: lhv.filter(function (x) { return x.status === 'Terjadwal' && x.tanggal >= hari; }).length, consent_tunda: lhv.filter(function (x) { return x.status === 'Terjadwal' && x.status_consent !== 'Disetujui'; }).length, per_tindakan: (function () { var m = {}; lhv.filter(function (x) { return x.tanggal.slice(0, 7) === bln; }).forEach(function (x) { m[x.jenis_tindakan] = (m[x.jenis_tindakan] || 0) + 1; }); return m; })() };
      d.target = CC.capaianTarget(bln).filter(function (t) { return t.divisi === 'Home Visit'; });
    }
    if (e === 'CS') {
      var leads = CC.semua(CC.T.LEAD), soSaya = CC.semua(CC.T.SO).filter(function (s) { return s.periode_bulan === bln && s.pic_cs === ctx.user.id && s.status !== 'Batal' && s.status !== 'Draf Perpanjangan'; });
      d.cs = { lead: { masuk: leads.filter(function (l) { return l.status_pipeline === 'Lead Masuk'; }).length, followup: leads.filter(function (l) { return l.status_pipeline === 'Follow-up'; }).length, deal: leads.filter(function (l) { return l.status_pipeline === 'Deal' && String(l.tanggal_masuk).slice(0, 7) === bln; }).length }, so_saya: soSaya.length, nilai_saya: soSaya.reduce(function (a, s) { return a + CC.u.angka(s.total); }, 0), draf_perpanjangan: CC.semua(CC.T.SO).filter(function (s) { return s.status === 'Draf Perpanjangan'; }).length };
      d.target = CC.capaianTarget(bln).filter(function (t) { return t.divisi === 'Customer Service'; });
    }
    if (e === 'HRD') {
      var pel = CC.aktifSaja(CC.semua(CC.T.REKRUT)), tahap = {};
      pel.forEach(function (x) { tahap[x.tahap] = (tahap[x.tahap] || 0) + 1; });
      d.hrd = { tahap: tahap, kontrak: CC.kontrakBerakhir(30).length, training: phc.filter(function (x) { return x.masa_training_sampai && x.hasil_training === 'Training'; }).length, turnover_bulan: CC.semua(CC.T.TURNOVER).filter(function (x) { return x.bulan_rekap === bln; }).length, perawat_total: phc.length };
      d.kontrak = CC.kontrakBerakhir(30).slice(0, 6);
    }
    if (e === 'KEU' || e === 'PC') {
      d.pengajuan = { gaji: CC.semua(CC.T.JURNAL).filter(function (j) { return j.sumber === 'Gaji' && (j.status_pengajuan === 'Diajukan' || j.status_pengajuan === 'Diproses'); }).length, pc: CC.semua(CC.T.PC).filter(function (j) { return j.tipe === 'Keluar' && (j.status === 'Diajukan' || j.status === 'Diproses'); }).length };
      d.saldo_pc = CC.saldoPettyCash();
      d.mutasi_pc = CC.bukuPettyCash(bln).rows.slice(-6).reverse();
    }
    if (e === 'PRW') {
      var pid = ctx.user.perawat_id;
      d.tugas_hari = CC.kewajibanPerawat(pid, hari);
      var st = CC.statistikKepatuhan(bln + '-01', hari); var saya = st.perawat.filter(function (x) { return x.perawat_id === pid; })[0] || { persen: 100, wajib: 0, tepat: 0 };
      d.kepatuhan = saya;
      d.idf_diminta = CC.semua(CC.T.IDF).filter(function (f) { return f.perawat_id === pid && f.status === 'Draft'; }).length;
      d.riwayat = CC.daftarLaporan(ctx, { dari: CC.u.tambahHari(hari, -6), sampai: hari }).slice(0, 5);
    }
    d.badge = CC.badge(ctx);
    return d;
  }
};
CC.kontrakBerakhir = function (hariKe) {
  var hari = CC.u.tgl(), batas = CC.u.tambahHari(hari, hariKe), out = [];
  [CC.T.PHC, CC.T.PHV].forEach(function (t) { CC.aktifSaja(CC.semua(t)).forEach(function (r) { if (r.status === 'Aktif' && r.akhir_kontrak && r.akhir_kontrak >= hari && r.akhir_kontrak <= batas) out.push({ id: r.id, nama: r.nama, jabatan: r.jabatan, akhir_kontrak: r.akhir_kontrak, sisa_hari: CC.u.selisihHari(hari, r.akhir_kontrak), str_berlaku: r.str_berlaku, divisi: t === CC.T.PHV ? 'HV' : 'HC' }); }); });
  return out.sort(function (a, b) { return a.sisa_hari - b.sisa_hari; });
};

/* ===================== PASIEN (US-04, US-07, US-08) ===================== */
CC.hookList = CC.hookList || {};
CC.hookSimpan = CC.hookSimpan || {};
CC.hookSetelah = CC.hookSetelah || {};
CC.hookList.pasien = function (ctx, rows) {
  var tugas = CC.semua(CC.T.TUGAS), phc = CC.peta(CC.T.PHC), paket = CC.peta(CC.T.PAKET), hari = CC.u.tgl(), lap = {};
  CC.semua(CC.T.LHC).forEach(function (l) { if (!lap[l.pasien_id] || lap[l.pasien_id].waktu_isi < l.waktu_isi) lap[l.pasien_id] = l; });
  return rows.map(function (r) {
    var c = Object.assign({}, r), t = tugas.filter(function (x) { return x.pasien_id === r.id && x.status === 'Berjalan'; });
    var utama = t.filter(function (x) { return x.peran === 'Utama'; })[0];
    c.usia = CC.u.usia(r.tgl_lahir); c.nama_paket = (paket[r.paket_id] || {}).nama_paket || '';
    c.perawat_utama = utama ? (phc[utama.perawat_id] || {}).nama : ''; c.penugasan_id = utama ? utama.id : '';
    c.sisa_kontrak = utama ? CC.u.selisihHari(hari, utama.tanggal_akhir) : null;
    var l = lap[r.id]; c.ttv_terakhir = l ? { tensi: l.tensi, nadi: l.nadi, spo2: l.spo2, suhu: l.suhu, gds: l.gds, waktu: l.waktu_isi, kondisi: l.kondisi_pasien } : null;
    return c;
  });
};
CC.A['pasien.detail'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'OPS', 'KEU', 'PRW'],
  fn: function (ctx, p) {
    var rows = CC.hookList.pasien(ctx, CC.saring(ctx, 'pasien', CC.semua(CC.T.PASIEN).filter(function (r) { return r.id === p.id; })));
    if (!rows.length) CC.galat('FORBIDDEN', 'Pasien tidak ditemukan atau di luar wewenang Anda.');
    var r = rows[0], phc = CC.peta(CC.T.PHC);
    r.info = CC.u.json(r.info_klinis, {});
    r.penerima = CC.penerimaLaporan(r);
    r.penugasan = CC.semua(CC.T.TUGAS).filter(function (t) { return t.pasien_id === r.id; }).map(function (t) { var c = CC.gabungTugas(ctx, t, phc); return c; }).sort(function (a, b) { return a.tanggal_mulai < b.tanggal_mulai ? 1 : -1; });
    r.laporan = CC.daftarLaporan(ctx, { pasien_id: r.id }).slice(0, 10);
    r.kasus = CC.semua(CC.T.KASUS).filter(function (k) { return k.pasien_id === r.id; }).slice(-5);
    if (CC.lihatNominal(ctx)) r.so = CC.semua(CC.T.SO).filter(function (s) { return s.pasien_id === r.id; }).map(function (s) { return { id: s.id, tanggal: s.tanggal, total: s.total, status: s.status, no_invoice: s.no_invoice, kontrak_label: s.kontrak_label }; });
    if (['ADM', 'KEP', 'PRW'].indexOf(ctx.peran) > -1) r.identifikasi = CC.semua(CC.T.IDF).filter(function (f) { return f.pasien_id === r.id && (ctx.peran !== 'PRW' || CC.bolehBacaIdf(ctx, f)); }).map(function (f) { return { id: f.id, status: f.status, tanggal_isi: f.tanggal_isi, alasan: f.alasan, perawat: phc[f.perawat_id] ? phc[f.perawat_id].nama : '' }; });
    if (ctx.peran === 'HV' || ctx.peran === 'HVK' || ctx.peran === 'ADM') r.home_visit = CC.semua(CC.T.LHV).filter(function (h) { return h.pasien_id === r.id; }).map(CC.gabungHV);
    return r;
  }
};
CC.hookSimpan.pasien = function (ctx, d, baru) {
  if (baru) { d.status = d.status || 'Lead'; d.status_klien = d.status_klien || 'New'; d.persetujuan_data = d.persetujuan_data || 'YA'; }
  ['no_wa_pj', 'no_telp_pj'].forEach(function (k) { if (d[k]) d[k] = CC.u.hp08(d[k]); });
  if (d.info_klinis && typeof d.info_klinis === 'object') d.info_klinis = JSON.stringify(d.info_klinis);
  if (d.penerima_laporan && typeof d.penerima_laporan === 'object') d.penerima_laporan = JSON.stringify(d.penerima_laporan);
  if (ctx.peran === 'KEP' && !baru) { var izin = ['perawat_id', 'penerima_laporan', 'info_klinis', 'id']; Object.keys(d).forEach(function (k) { if (izin.indexOf(k) === -1) delete d[k]; }); }
  return d;
};
CC.A['pasien.status'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    if (['Aktif', 'Nonaktif', 'Lead'].indexOf(p.status) === -1) CC.galat('VALIDATION', 'Status tidak valid.');
    var r = CC.ubah(ctx, CC.T.PASIEN, p.id, { status: p.status }, { aksi: 'STATUS_PASIEN', ket: p.alasan || '' });
    ctx.pesan = r.nama_pasien + ' kini ' + p.status + (p.status === 'Aktif' ? ' (diaktifkan kembali tanpa input ulang).' : '.');
    return r;
  }
};
CC.A['pasien.penerima'] = {
  roles: ['ADM', 'CS', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    var r = CC.cari(CC.T.PASIEN, p.id); if (!r) CC.galat('NOT_FOUND', 'Pasien tidak ditemukan.');
    if (!p.tanggal_efektif || !p.alasan) CC.galat('VALIDATION', 'Alasan dan tanggal efektif wajib diisi.', { alasan: 'Wajib', tanggal_efektif: 'Wajib' });
    var lama = CC.penerimaLaporan(r), baru = (p.penerima || []).map(function (x) { return { nama: x.nama, relasi: x.relasi, wa: CC.u.hp08(x.wa), email: x.email, aktif: true }; });
    CC.ubah(ctx, CC.T.PASIEN, r.id, { penerima_laporan: JSON.stringify(baru) }, { aksi: 'GANTI_PENERIMA' });
    CC.tambah(ctx, CC.T.TURNOVER, { jenis: 'Ganti Penerima Laporan', divisi: 'HC', pihak_id: r.id, pihak_nama: r.nama_pasien, alasan_terstandar: p.alasan, alasan_detail: p.alasan_detail || '', tanggal_efektif: p.tanggal_efektif, penerima_laporan_lama: lama.map(function (x) { return x.nama; }).join(', '), penerima_laporan_baru: baru.map(function (x) { return x.nama; }).join(', '), dicatat_oleh: ctx.user.nama, bulan_rekap: String(p.tanggal_efektif).slice(0, 7) });
    CC.notif(ctx, 'ROTASI', baru.map(function (x) { return { nama: x.nama, wa: x.wa }; }), { pasien: r.nama_pasien, dari: 'penerima lama', ke: 'Anda', tanggal: CC.u.tglPanjang(p.tanggal_efektif) }, r.id);
    ctx.pesan = 'Penerima laporan diganti. Berlaku mulai laporan berikutnya.';
    return true;
  }
};
CC.A['pasien.tautan'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var op = CC.set('operasional'), token = CC.env.uuid().replace(/-/g, '').slice(0, 20);
    var row = CC.tambah(ctx, CC.T.TAUTAN, { jenis: p.jenis || 'pasien', token: token, dibuat_untuk: p.nama || '', no_wa: CC.u.hp08(p.no_wa), berlaku_sampai: CC.u.tambahHari(CC.u.tgl(), op.tautan_form_hari) + ' 23:59', status: 'Aktif', jumlah_kirim: 0 });
    return { token: token, berlaku_sampai: row.berlaku_sampai, id: row.id };
  }
};
CC.A['pasien.tautanList'] = { roles: ['ADM', 'CS', 'HRD'], fn: function () { return CC.semua(CC.T.TAUTAN).slice().reverse().slice(0, 50); } };
CC.A['pasien.tautanCabut'] = { roles: ['ADM', 'CS', 'HRD'], tulis: true, fn: function (ctx, p) { CC.ubah(ctx, CC.T.TAUTAN, p.id, { status: 'Dicabut' }); ctx.pesan = 'Tautan dicabut.'; return true; } };

/* ---------- Formulir publik (tanpa login) ---------- */
CC.tautanValid = function (token, jenis) {
  var t = CC.semua(CC.T.TAUTAN).filter(function (x) { return x.token === token && x.jenis === jenis; })[0];
  if (!t || t.status !== 'Aktif') CC.galat('FORBIDDEN', 'Tautan formulir tidak valid atau sudah dicabut. Mohon minta tautan baru ke Customer Service.');
  if (CC.u.dt() > t.berlaku_sampai) CC.galat('FORBIDDEN', 'Tautan formulir sudah kedaluwarsa. Mohon minta tautan baru ke Customer Service.');
  if (Number(t.jumlah_kirim || 0) >= 3) CC.galat('FORBIDDEN', 'Batas pengiriman formulir untuk tautan ini sudah tercapai.');
  return t;
};
CC.A['publik.formInfo'] = { publik: true, fn: function (ctx, p) { var t = p.jenis === 'karir' ? null : CC.tautanValid(p.token, 'pasien'); var b = CC.set('branding'), prof = CC.set('profil'); return { nama: t ? t.dibuat_untuk : '', berlaku_sampai: t ? t.berlaku_sampai : '', dipakai_pada: t ? t.dipakai_pada || '' : '', sisa_kirim: t ? 3 - Number(t.jumlah_kirim || 0) : null, branding: b, profil: { brand: prof.brand, nama_perusahaan: prof.nama_perusahaan, wa: prof.wa }, master: { wilayah: CC.set('master').wilayah, posisi: CC.set('master').jabatan } }; } };
CC.A['publik.formPasien'] = {
  publik: true, tulis: true,
  fn: function (ctx, p) {
    if (p.website) CC.galat('VALIDATION', 'Pengiriman ditolak.');           // honeypot
    var t = CC.tautanValid(p.token, 'pasien'), d = p.data || {};
    CC.wajib(d, ['nama_pasien:Nama pasien', 'tgl_lahir:Tanggal lahir', 'alamat:Alamat', 'diagnosa:Diagnosa/keluhan', 'nama_pj:Nama penanggung jawab', 'relasi_pj:Hubungan', 'no_wa_pj:Nomor WhatsApp', 'alamat_pj:Alamat penanggung jawab']);
    if (!CC.u.hpValid(d.no_wa_pj)) CC.galat('VALIDATION', 'Nomor WhatsApp tidak valid.', { no_wa_pj: 'Format 08xxxxxxxxxx' });
    if (d.email_pj && !CC.u.emailValid(d.email_pj)) CC.galat('VALIDATION', 'Email tidak valid.', { email_pj: 'Email tidak valid' });
    if (d.persetujuan !== true && d.persetujuan !== 'YA') CC.galat('VALIDATION', 'Mohon centang persetujuan penerimaan laporan dan pengolahan data pribadi.', { persetujuan: 'Wajib dicentang' });
    var ctxS = { user: { id: 'PUBLIK', nama: 'Formulir Publik', role: 'PUBLIK' } };
    // kiriman ulang lewat tautan yang sama = koreksi data pasien yang sudah masuk (bukan pasien ganda), selama masih berstatus Lead
    var lama = t.ref_id ? CC.cari(CC.T.PASIEN, t.ref_id) : null, dataPs = { nama_pasien: CC.u.bersih(d.nama_pasien), jenis_kelamin: d.jenis_kelamin || '', tgl_lahir: d.tgl_lahir, alamat: CC.u.bersih(d.alamat), wilayah: d.wilayah || '', diagnosa: CC.u.bersih(d.diagnosa), keluhan: CC.u.bersih(d.keluhan || ''), jenis_layanan: d.jenis_layanan === 'HV' ? 'HV' : 'HC', nama_pj: CC.u.bersih(d.nama_pj), relasi_pj: d.relasi_pj, alamat_pj: CC.u.bersih(d.alamat_pj), no_telp_pj: CC.u.hp08(d.no_wa_pj), no_wa_pj: CC.u.hp08(d.no_wa_pj), email_pj: d.email_pj || '', persetujuan_data: 'YA', status: 'Lead', status_klien: 'New', sumber_lead: 'Formulir Publik' };
    if (lama && lama.status === 'Lead') {
      delete dataPs.status; delete dataPs.status_klien; delete dataPs.sumber_lead; CC.ubah(ctxS, CC.T.PASIEN, lama.id, dataPs, { aksi: 'FORM_PASIEN_KOREKSI' });
      CC.ubah(ctxS, CC.T.TAUTAN, t.id, { jumlah_kirim: Number(t.jumlah_kirim || 0) + 1, dipakai_pada: CC.u.dt() }, { tanpaLog: true });
      CC.notif(ctxS, 'FORM_MASUK', CC.penerimaUser(CC.usersPeran(['CS'])), { jenis: 'Koreksi formulir data pasien', nama: d.nama_pasien }, lama.id);
      ctx.pesan = 'Perbaikan data pasien kami terima. Terima kasih.';
      return { ok: true, kode: lama.id, koreksi: true };
    }
    var ps = CC.tambah(ctxS, CC.T.PASIEN, dataPs);
    var ld = CC.semua(CC.T.LEAD).filter(function (l) { return CC.u.hp08(l.no_wa) === CC.u.hp08(d.no_wa_pj) && l.status_pipeline !== 'Tidak Jadi' && !l.pasien_id; })[0];
    if (ld) CC.ubah(ctxS, CC.T.LEAD, ld.id, { pasien_id: ps.id, nama_pasien: ps.nama_pasien });
    else CC.tambah(ctxS, CC.T.LEAD, { tanggal_masuk: CC.u.dt(), pasien_id: ps.id, nama_kontak: d.nama_pj, no_wa: CC.u.hp08(d.no_wa_pj), nama_pasien: d.nama_pasien, kebutuhan: d.diagnosa, wilayah: d.wilayah || '', sumber_lead: d.sumber_lead || 'WhatsApp', status_pipeline: 'Lead Masuk', followup_terakhir: '', catatan: 'Formulir Data Pasien terisi' });
    CC.ubah(ctxS, CC.T.TAUTAN, t.id, { jumlah_kirim: Number(t.jumlah_kirim || 0) + 1, dipakai_pada: CC.u.dt(), ref_id: ps.id }, { tanpaLog: true });
    CC.notif(ctxS, 'FORM_MASUK', CC.penerimaUser(CC.usersPeran(['CS'])), { jenis: 'Formulir data pasien', nama: d.nama_pasien }, ps.id);
    return { ok: true, kode: ps.id };
  }
};
CC.A['publik.formKarir'] = {
  publik: true, tulis: true,
  fn: function (ctx, p) {
    if (p.website) CC.galat('VALIDATION', 'Pengiriman ditolak.');
    var d = p.data || {};
    CC.wajib(d, ['nama:Nama lengkap', 'kontak:Nomor WhatsApp', 'posisi:Posisi', 'pendidikan:Pendidikan terakhir', 'domisili:Domisili']);
    if (!CC.u.hpValid(d.kontak)) CC.galat('VALIDATION', 'Nomor WhatsApp tidak valid.', { kontak: 'Format 08xxxxxxxxxx' });
    var berkas = '';
    if (d.berkas && d.berkas.data && CC.env.simpanBerkas) berkas = CC.env.simpanBerkas(d.berkas.data, 'lamaran_' + CC.u.tgl().replace(/-/g, '') + '_' + d.berkas.nama, 'Lamaran_Karir').url;
    var ctxS = { user: { id: 'PUBLIK', nama: 'Formulir Karir', role: 'PUBLIK' } };
    var r = CC.tambah(ctxS, CC.T.REKRUT, { tanggal_lamaran: CC.u.tgl(), nama: CC.u.bersih(d.nama), kontak: CC.u.hp08(d.kontak), email: d.email || '', posisi: d.posisi, pendidikan: d.pendidikan, domisili: d.domisili, pengalaman: CC.u.bersih(d.pengalaman || ''), berkas_url: berkas, tahap: 'Lamaran Masuk' });
    CC.notif(ctxS, 'FORM_MASUK', CC.penerimaUser(CC.usersPeran(['HRD'])), { jenis: 'Lamaran karir', nama: d.nama }, r.id);
    return { ok: true, kode: r.id };
  }
};

/* ===================== PERAWAT (US-09, US-22) ===================== */
CC.A['perawat.direktori'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'],
  fn: function (ctx, p) {
    var e = ctx.peran, hari = CC.u.tgl(), out = [];
    var st = CC.statistikKepatuhan(CC.u.tambahHari(hari, -29), hari), kep = {}; st.perawat.forEach(function (x) { kep[x.perawat_id] = x.persen; });
    var tugas = CC.semua(CC.T.TUGAS).filter(function (t) { return t.status === 'Berjalan'; }), pas = CC.peta(CC.T.PASIEN);
    if (e !== 'HV' && e !== 'HVK') CC.saring(ctx, 'perawat', CC.aktifSaja(CC.semua(CC.T.PHC))).forEach(function (r) {
      var t = tugas.filter(function (x) { return x.perawat_id === r.id && CC.tugasAktifPada(x, hari); });
      var c = Object.assign({ divisi: 'HC' }, r); c.jumlah_pasien = t.length; c.pasien = t.map(function (x) { return (pas[x.pasien_id] || {}).nama_pasien + (x.peran === 'Infal' ? ' (Infal)' : ''); }).join(', ');
      c.kepatuhan = kep[r.id] === undefined ? null : kep[r.id]; c.beban = Math.min(100, t.reduce(function (a, x) { return a + (CC.shiftTugas(x).indexOf('24J') > -1 ? 100 : 50 * CC.shiftTugas(x).length); }, 0));
      if (!CC.lihatMargin(ctx) && e !== 'KEP') { /* gaji tidak dimuat di direktori */ }
      out.push(c);
    });
    if (['ADM', 'HV', 'HVK', 'CS', 'HRD', 'OPS'].indexOf(e) > -1) CC.saring(ctx, 'perawat_hv', CC.aktifSaja(CC.semua(CC.T.PHV))).forEach(function (r) {
      var c = Object.assign({ divisi: 'HV' }, r), lhv = CC.semua(CC.T.LHV).filter(function (h) { return h.perawat_hv_id === r.id && h.tanggal.slice(0, 7) === CC.u.bulan(); });
      c.jumlah_pasien = lhv.length; c.pasien = lhv.length + ' tindakan bulan ini'; c.kepatuhan = null; c.beban = Math.min(100, lhv.length * 6); out.push(c);
    });
    return out;
  }
};
CC.A['perawat.status'] = {
  roles: ['ADM', 'HRD', 'KEP', 'CS', 'HVK'], tulis: true,
  fn: function (ctx, p) {
    var hv = String(p.id).indexOf('PHV') === 0, t = hv ? CC.T.PHV : CC.T.PHC;
    if (hv && ctx.peran === 'KEP') CC.galat('FORBIDDEN', 'Keperawatan tidak mengelola perawat Home Visit.');
    if (!hv && ctx.peran === 'HVK') CC.galat('FORBIDDEN', 'Koordinator HV hanya mengelola perawat Home Visit.');
    var r = CC.cari(t, p.id); if (!r) CC.galat('NOT_FOUND', 'Perawat tidak ditemukan.');
    if (p.status === 'Nonaktif' && !hv) {
      var aktif = CC.semua(CC.T.TUGAS).filter(function (x) { return x.perawat_id === r.id && x.status === 'Berjalan'; });
      if (aktif.length && !p.konfirmasi) CC.galat('CONFLICT', r.nama + ' masih memegang ' + aktif.length + ' penugasan aktif (' + aktif.map(function (x) { return x.id; }).join(', ') + '). Buat penugasan pengganti lewat rotasi sebelum menonaktifkan, atau konfirmasi untuk tetap menonaktifkan.');
    }
    CC.ubah(ctx, t, r.id, { status: p.status }, { aksi: 'STATUS_PERAWAT', ket: p.alasan || '' });
    ctx.pesan = r.nama + ' kini ' + p.status + (p.status === 'Nonaktif' ? ' — dikecualikan dari kewajiban laporan & pengingat.' : '.');
    return true;
  }
};
CC.A['perawat.siaga'] = { roles: ['ADM', 'KEP', 'OPS'], tulis: true, fn: function (ctx, p) { CC.ubah(ctx, CC.T.PHC, p.id, { status_siaga: p.siaga ? 'Standby' : '' }); return true; } };
CC.A['perawat.training'] = {
  roles: ['ADM', 'HRD', 'KEP'], tulis: true,
  fn: function (ctx, p) { if (['Lulus', 'Tidak lulus', 'Training'].indexOf(p.hasil) === -1) CC.galat('VALIDATION', 'Hasil tidak valid.'); CC.ubah(ctx, CC.T.PHC, p.id, { hasil_training: p.hasil }, { aksi: 'EVALUASI_TRAINING', ket: p.catatan || '' }); ctx.pesan = 'Hasil masa training dicatat: ' + p.hasil + '.'; return true; }
};
CC.A['perawat.kontrak'] = { roles: ['ADM', 'HRD', 'KEP'], fn: function (ctx) { var st = CC.statistikKepatuhan(CC.u.tambahHari(CC.u.tgl(), -29), CC.u.tgl()), kep = {}; st.perawat.forEach(function (x) { kep[x.perawat_id] = x.persen; }); var kas = {}; CC.semua(CC.T.KASUS).forEach(function (k) { if (k.perawat_id) kas[k.perawat_id] = (kas[k.perawat_id] || 0) + 1; }); var nilai = {}; CC.semua(CC.T.NILAI).forEach(function (n) { (nilai[n.perawat_id] = nilai[n.perawat_id] || []).push(CC.u.angka(n.skor_total)); }); return CC.kontrakBerakhir(Number(ctx.req.payload.hari || 60)).map(function (k) { k.kepatuhan = kep[k.id]; k.kasus = kas[k.id] || 0; var n = nilai[k.id]; k.nilai_klien = n ? Math.round(n.reduce(function (a, b) { return a + b; }, 0) / n.length * 10) / 10 : null; return k; }).concat(CC.aktifSaja(CC.semua(CC.T.PHC)).filter(function (r) { return r.hasil_training === 'Training'; }).map(function (r) { return { id: r.id, nama: r.nama, jabatan: r.jabatan, training: true, masa_training_sampai: r.masa_training_sampai, kepatuhan: kep[r.id], kasus: kas[r.id] || 0 }; })); } };

/* ===================== PENUGASAN (US-40, US-10) ===================== */
CC.gabungTugas = function (ctx, t, phc) {
  var c = Object.assign({}, t), p = CC.cari(CC.T.PASIEN, t.pasien_id) || {}, pr = (phc || CC.peta(CC.T.PHC))[t.perawat_id] || {}, hari = CC.u.tgl();
  c.nama_pasien = p.nama_pasien; c.wilayah = p.wilayah; c.diagnosa = p.diagnosa; c.nama_perawat = pr.nama; c.jabatan_perawat = pr.jabatan;
  c.nama_paket = (CC.cari(CC.T.PAKET, t.paket_id) || {}).nama_paket;
  c.sisa_hari = CC.u.selisihHari(hari, t.tanggal_akhir); c.hari_ke = Math.max(0, CC.u.selisihHari(t.tanggal_mulai, hari) + 1);
  var lib = CC.semua(CC.T.LIBUR).filter(function (l) { return l.penugasan_id === t.id && l.status !== 'Dibatalkan' && ['Libur jatah', 'Cuti', 'Izin', 'Sakit'].indexOf(l.jenis) > -1; });
  c.libur_terpakai = lib.length; c.jatah = t.jatah_libur || 4;
  var idf = CC.semua(CC.T.IDF).filter(function (f) { return f.penugasan_id === t.id || f.perawat_penerima_id === t.perawat_id && f.pasien_id === t.pasien_id; }).slice(-1)[0];
  c.handover = idf ? { id: idf.id, status: idf.status } : null;
  if (!ctx || ['ADM', 'KEP', 'KEU'].indexOf(ctx.peran) === -1) { c.gaji_deal = ''; }
  return c;
};
CC.A['penugasan.list'] = {
  roles: ['ADM', 'PRW', 'KEP', 'CS', 'HRD', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var phc = CC.peta(CC.T.PHC), rows = CC.aktifSaja(CC.semua(CC.T.TUGAS));
    if (ctx.peran === 'PRW') rows = rows.filter(function (t) { return t.perawat_id === ctx.user.perawat_id; });
    rows = rows.map(function (t) { return CC.gabungTugas(ctx, t, phc); }).sort(function (a, b) { var o = { Berjalan: 0, Diperpanjang: 1, Selesai: 2 }; return (o[a.status] === undefined ? 3 : o[a.status]) - (o[b.status] === undefined ? 3 : o[b.status]) || (a.tanggal_akhir < b.tanggal_akhir ? -1 : 1); });
    var siaga = CC.aktifSaja(CC.semua(CC.T.PHC)).filter(function (r) { return r.status === 'Aktif' && r.status_siaga === 'Standby'; }).map(function (r) { return { id: r.id, nama: r.nama, jabatan: r.jabatan, kompetensi: r.kompetensi, wilayah: r.wilayah }; });
    return { rows: rows, siaga: siaga };
  }
};
CC.cekBentrok = function (perawatId, mulai, akhir, kecuali) {
  return CC.semua(CC.T.TUGAS).filter(function (t) { return t.id !== kecuali && t.perawat_id === perawatId && t.peran === 'Utama' && t.status === 'Berjalan' && !(akhir < t.tanggal_mulai || mulai > (t.tanggal_akhir_aktual || t.tanggal_akhir)); });
};
CC.gajiPaket = function (paketId, tanggal) { var g = CC.setRiwayat('gaji').length ? CC.set('gaji', tanggal) : null; if (!g) return { gaji: '', metode: 'A', lengkap: false }; return { gaji: (g.gaji_paket || {})[paketId] || '', metode: (g.metode_paket || {})[paketId] || 'A', lengkap: !!(g.gaji_paket || {})[paketId], batas: g.batas_hari_pendek, jatah: g.jatah_libur }; };
CC.buatPenugasan = function (ctx, d) {
  var mulai = d.tanggal_mulai, lama = Number(d.lama_hari), akhir = CC.u.tambahHari(mulai, lama - 1);
  var gp = CC.gajiPaket(d.paket_id, mulai);
  var t = CC.tambah(ctx, CC.T.TUGAS, {
    pasien_id: d.pasien_id, perawat_id: d.perawat_id, peran: d.peran || 'Utama', paket_id: d.paket_id, so_id: d.so_id || '', tanggal_mulai: mulai, lama_hari: lama, tanggal_akhir: akhir,
    status: 'Berjalan', shift: d.shift || '24J', gaji_deal: d.gaji_deal || gp.gaji, metode_gaji: d.metode_gaji || (gp.batas && lama < gp.batas ? 'B' : gp.metode), tugas_pendek: gp.batas && lama < gp.batas ? 'YA' : 'TIDAK',
    jatah_libur: d.jatah_libur || gp.jatah || 4, penugasan_asal: d.penugasan_asal || '', catatan: d.catatan || ''
  });
  if (t.peran === 'Utama') CC.ubah(ctx, CC.T.PASIEN, d.pasien_id, { perawat_id: d.perawat_id, status: 'Aktif', paket_id: d.paket_id }, { tanpaLog: true });
  var pr = CC.cari(CC.T.PHC, d.perawat_id), ps = CC.cari(CC.T.PASIEN, d.pasien_id), u = CC.userPerawat(d.perawat_id);
  if (pr && pr.status_siaga === 'Standby') CC.ubah(ctx, CC.T.PHC, pr.id, { status_siaga: '' }, { tanpaLog: true });
  if (u) CC.notif(ctx, 'ROTASI', [{ nama: u.nama, wa: pr ? pr.no_wa : '', user_id: u.id }], { pasien: ps.nama_pasien, dari: '-', ke: pr.nama + ' (' + t.peran + ')', tanggal: CC.u.tglPanjang(mulai) }, t.id);
  return t;
};
CC.A['penugasan.buat'] = {
  roles: ['ADM', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {};
    CC.wajib(d, ['pasien_id:Pasien', 'perawat_id:Perawat', 'peran:Peran', 'paket_id:Paket', 'tanggal_mulai:Tanggal mulai', 'lama_hari:Lama (hari)']);
    if (Number(d.lama_hari) < 1) CC.galat('VALIDATION', 'Lama penugasan minimal 1 hari.', { lama_hari: 'Minimal 1' });
    var pr = CC.cari(CC.T.PHC, d.perawat_id); if (!pr || pr.status !== 'Aktif') CC.galat('VALIDATION', 'Perawat tidak aktif.', { perawat_id: 'Pilih perawat aktif' });
    var akhir = CC.u.tambahHari(d.tanggal_mulai, Number(d.lama_hari) - 1);
    if ((d.peran || 'Utama') === 'Utama') { var b = CC.cekBentrok(d.perawat_id, d.tanggal_mulai, akhir); if (b.length && !p.konfirmasi) CC.galat('CONFLICT', pr.nama + ' sudah memiliki penugasan Utama yang bertabrakan: ' + b.map(function (x) { return x.id + ' (' + CC.u.tglPanjang(x.tanggal_mulai) + ' – ' + CC.u.tglPanjang(x.tanggal_akhir) + ')'; }).join(', ') + '. Lanjutkan?'); }
    if (d.paket_id) { var pk = CC.cari(CC.T.PAKET, d.paket_id); if (pk && pk.aktif !== 'YA') CC.galat('VALIDATION', 'Paket ' + pk.nama_paket + ' sedang nonaktif.', { paket_id: 'Paket nonaktif' }); }
    var t = CC.buatPenugasan(ctx, d);
    if (t.peran === 'Infal' && p.minta_idf) CC.mintaIdf(ctx, { penugasan_id: t.id, pasien_id: t.pasien_id, alasan: 'Handover Pergantian (Infal)', perawat_penerima_id: t.perawat_id });
    ctx.pesan = 'Penugasan ' + t.id + ' dibuat. ' + (t.gaji_deal ? '' : 'Gaji deal belum terisi: lengkapi Pengaturan Gaji.');
    return CC.gabungTugas(ctx, t);
  }
};
CC.A['penugasan.ubah'] = {
  roles: ['ADM', 'KEP', 'KEU'], tulis: true,
  fn: function (ctx, p) {
    if (!p.alasan) CC.galat('VALIDATION', 'Alasan perubahan wajib diisi.', { alasan: 'Wajib' });
    var patch = {}; ['gaji_deal', 'metode_gaji', 'shift', 'jatah_libur', 'catatan'].forEach(function (k) { if (p[k] !== undefined) patch[k] = p[k]; });
    if (ctx.peran === 'KEU') { delete patch.shift; delete patch.catatan; }
    CC.ubah(ctx, CC.T.TUGAS, p.id, patch, { aksi: 'UBAH_PENUGASAN', ket: p.alasan }); ctx.pesan = 'Penugasan diperbarui.'; return true;
  }
};
CC.A['penugasan.rotasi'] = {
  roles: ['ADM', 'KEP', 'CS', 'HRD'], tulis: true,
  fn: function (ctx, p) {
    CC.wajib(p, ['penugasan_id:Penugasan', 'perawat_baru_id:Perawat pengganti', 'tanggal_efektif:Tanggal efektif', 'alasan:Alasan']);
    var lama = CC.cari(CC.T.TUGAS, p.penugasan_id); if (!lama || lama.status !== 'Berjalan') CC.galat('VALIDATION', 'Penugasan tidak berjalan.');
    if (p.perawat_baru_id === lama.perawat_id) CC.galat('VALIDATION', 'Perawat pengganti sama dengan perawat saat ini.', { perawat_baru_id: 'Pilih perawat lain' });
    var ef = p.tanggal_efektif, sisa = CC.u.selisihHari(ef, lama.tanggal_akhir) + 1; if (sisa < 1) CC.galat('VALIDATION', 'Tanggal efektif melewati akhir penugasan.', { tanggal_efektif: 'Di luar masa penugasan' });
    CC.ubah(ctx, CC.T.TUGAS, lama.id, { status: 'Selesai', tanggal_akhir_aktual: CC.u.tambahHari(ef, -1), alasan_berhenti: 'Rotasi: ' + p.alasan }, { aksi: 'ROTASI' });
    var baru = CC.buatPenugasan(ctx, { pasien_id: lama.pasien_id, perawat_id: p.perawat_baru_id, peran: lama.peran, paket_id: lama.paket_id, so_id: lama.so_id, tanggal_mulai: ef, lama_hari: sisa, shift: lama.shift, penugasan_asal: lama.id, gaji_deal: p.gaji_deal || '' });
    var ps = CC.cari(CC.T.PASIEN, lama.pasien_id), prLama = CC.cari(CC.T.PHC, lama.perawat_id), prBaru = CC.cari(CC.T.PHC, p.perawat_baru_id);
    CC.tambah(ctx, CC.T.TURNOVER, { jenis: 'Rotasi Perawat', divisi: 'HC', pihak_id: lama.pasien_id, pihak_nama: ps.nama_pasien, alasan_terstandar: p.alasan, alasan_detail: p.alasan_detail || '', tanggal_efektif: ef, dari: prLama.nama, ke: prBaru.nama, dicatat_oleh: ctx.user.nama, bulan_rekap: ef.slice(0, 7) });
    CC.mintaIdf(ctx, { penugasan_id: lama.id, pasien_id: lama.pasien_id, perawat_id: lama.perawat_id, perawat_penerima_id: p.perawat_baru_id, alasan: 'Handover Pergantian (Rotasi)' });
    var pen = [prLama, prBaru].map(function (x) { var u = CC.userPerawat(x.id); return { nama: x.nama, wa: x.no_wa, user_id: u ? u.id : '' }; }).concat(CC.penerimaLaporan(ps).map(function (x) { return { nama: x.nama, wa: x.wa }; }));
    CC.notif(ctx, 'ROTASI', pen, { pasien: ps.nama_pasien, dari: prLama.nama, ke: prBaru.nama, tanggal: CC.u.tglPanjang(ef) }, baru.id);
    ctx.pesan = 'Rotasi tercatat permanen. ' + prBaru.nama + ' mulai ' + CC.u.tglPanjang(ef) + '; permintaan Formulir Identifikasi dikirim ke ' + prLama.nama + '.';
    return CC.gabungTugas(ctx, baru);
  }
};
CC.A['penugasan.hentikan'] = {
  roles: ['ADM', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    CC.wajib(p, ['id', 'tanggal_akhir_aktual:Tanggal akhir aktual', 'alasan:Alasan']);
    var t = CC.cari(CC.T.TUGAS, p.id), ps = CC.cari(CC.T.PASIEN, t.pasien_id), pr = CC.cari(CC.T.PHC, t.perawat_id);
    CC.ubah(ctx, CC.T.TUGAS, t.id, { status: 'Dihentikan lebih awal', tanggal_akhir_aktual: p.tanggal_akhir_aktual, alasan_berhenti: p.alasan, metode_gaji: 'B' }, { aksi: 'HENTIKAN', ket: p.alasan_detail || '' });
    var klien = ['Biaya', 'Sudah sehat', 'Wafat', 'Permintaan klien', 'Pindah domisili'].indexOf(p.alasan) > -1;
    CC.tambah(ctx, CC.T.TURNOVER, { jenis: klien ? 'Putus Kontrak Klien' : 'Putus Kontrak Perawat', divisi: 'HC', pihak_id: klien ? ps.id : pr.id, pihak_nama: klien ? ps.nama_pasien : pr.nama, alasan_terstandar: p.alasan, alasan_detail: p.alasan_detail || '', tanggal_efektif: p.tanggal_akhir_aktual, dari: pr.nama, ke: '-', dicatat_oleh: ctx.user.nama, bulan_rekap: p.tanggal_akhir_aktual.slice(0, 7) });
    if (klien && t.peran === 'Utama') CC.ubah(ctx, CC.T.PASIEN, ps.id, { status: 'Nonaktif' }, { tanpaLog: true });
    if (!klien && CC.modulAktif('penalti') && ['Resign tanpa pemberitahuan', 'Meninggalkan tugas tanpa izin'].indexOf(p.alasan) > -1) CC.usulPenalti(ctx, t, p.alasan, p.tanggal_akhir_aktual);
    ctx.pesan = 'Penugasan dihentikan. Gaji dihitung prorata (Metode B). ' + (p.alasan === 'Wafat' ? 'Sesuai Ketentuan Layanan Pasal 3 butir 8, tagihan klien tetap penuh; perawat boleh tinggal paling lama 7 hari.' : '');
    return true;
  }
};
CC.A['penugasan.batal'] = { roles: ['ADM', 'KEP'], tulis: true, fn: function (ctx, p) { if (!p.alasan) CC.galat('VALIDATION', 'Alasan wajib.', { alasan: 'Wajib' }); CC.ubah(ctx, CC.T.TUGAS, p.id, { status: 'Dibatalkan', alasan_berhenti: p.alasan }, { aksi: 'BATAL' }); ctx.pesan = 'Penugasan dibatalkan.'; return true; } };

/* ===================== ABSENSI KISI BULANAN (US-11) ===================== */
CC.A['absensi.grid'] = {
  roles: ['ADM', 'KEP', 'HV', 'HRD', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var bln = p.bulan || CC.u.bulan(), n = CC.u.hariDalamBulan(bln), awal = bln + '-01', akhir = bln + '-' + CC.u.pad(n, 2), divisi = p.divisi || (ctx.peran === 'HV' || ctx.peran === 'HVK' ? 'HV' : 'HC');
    if (divisi === 'HV' && ctx.peran === 'KEP') CC.galat('FORBIDDEN', 'Keperawatan tidak mengakses absensi HV.');
    if (divisi === 'HC' && (ctx.peran === 'HV' || ctx.peran === 'HVK')) CC.galat('FORBIDDEN', 'Tim HV tidak mengakses absensi HC.');
    var rows = [];
    if (divisi === 'HC') {
      var abs = {}; CC.semua(CC.T.ABS_HC).forEach(function (a) { if (a.tanggal >= awal && a.tanggal <= akhir) abs[a.penugasan_id + '|' + a.tanggal] = a.status_kehadiran; });
      var lib = {}; CC.semua(CC.T.LIBUR).forEach(function (l) { if (l.status !== 'Dibatalkan' && l.tanggal >= awal && l.tanggal <= akhir) lib[l.penugasan_id + '|' + l.tanggal] = l.jenis; });
      var phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN);
      CC.semua(CC.T.TUGAS).forEach(function (t) {
        if (t.status === 'Dibatalkan' || t.status_arsip === 'Arsip') return;
        var ta = t.tanggal_akhir_aktual || t.tanggal_akhir; if (ta < awal || t.tanggal_mulai > akhir) return;
        var sel = {}, kerja = 0;
        for (var i = 1; i <= n; i++) {
          var h = bln + '-' + CC.u.pad(i, 2);
          if (h < t.tanggal_mulai || h > ta) { sel[i] = '×'; continue; }
          var s = abs[t.id + '|' + h] || ''; var lb = lib[t.id + '|' + h];
          if (!s && lb && lb !== 'Lembur' && lb !== 'Infal') s = lb === 'Libur jatah' ? 'Libur' : lb;
          if (lb === 'Lembur' && (!s || s === 'Bertugas')) s = 'Lembur';
          sel[i] = s; if (s === 'Bertugas' || s === 'Lembur') kerja++;
        }
        rows.push({ kunci: t.id, penugasan_id: t.id, perawat_id: t.perawat_id, nama: (phc[t.perawat_id] || {}).nama, pasien: (pas[t.pasien_id] || {}).nama_pasien, peran: t.peran, sel: sel, total_kerja: kerja, mulai: t.tanggal_mulai, akhir: ta });
      });
    } else {
      var av = {}; CC.semua(CC.T.ABS_HV).forEach(function (a) { if (a.tanggal >= awal && a.tanggal <= akhir) av[a.perawat_hv_id + '|' + a.tanggal] = a.status_kehadiran; });
      CC.aktifSaja(CC.semua(CC.T.PHV)).forEach(function (r) { var sel = {}, k = 0; for (var i = 1; i <= n; i++) { var s = av[r.id + '|' + bln + '-' + CC.u.pad(i, 2)] || ''; sel[i] = s; if (s === 'Bertugas') k++; } rows.push({ kunci: r.id, perawat_id: r.id, nama: r.nama, pasien: r.kompetensi_tindakan, sel: sel, total_kerja: k }); });
    }
    return { bulan: bln, hari: n, divisi: divisi, rows: rows.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); }), boleh_ubah: divisi === 'HC' ? CC.boleh(ctx.user, ['KEP', 'ADM']) : CC.boleh(ctx.user, ['HVK', 'ADM']), hari_ini: CC.u.tgl() };
  }
};
CC.A['absensi.set'] = {
  tulis: true, roles: ['ADM', 'KEP', 'HVK'],
  fn: function (ctx, p) {
    var divisi = p.divisi || 'HC';
    if (divisi === 'HC' && ctx.peran === 'HVK') CC.galat('FORBIDDEN', 'Koordinator HV hanya menginput absensi HV.');
    if (divisi === 'HV' && ctx.peran === 'KEP') CC.galat('FORBIDDEN', 'Absensi HV hanya diinput Koordinator HV.');
    var t = divisi === 'HC' ? CC.T.ABS_HC : CC.T.ABS_HV, kunciKol = divisi === 'HC' ? 'penugasan_id' : 'perawat_hv_id', ada = {};
    CC.semua(t).forEach(function (a) { ada[a[kunciKol] + '|' + a.tanggal] = a; });
    var baru = [], ubah = [], tg = divisi === 'HC' ? CC.peta(CC.T.TUGAS) : {};
    (p.sel || []).forEach(function (c) {
      var k = c.kunci + '|' + c.tanggal, st = c.status || '';
      if (['', 'Bertugas', 'Libur', 'Cuti', 'Izin', 'Sakit'].indexOf(st) === -1) return;
      if (ada[k]) { if (ada[k].status_kehadiran !== st) ubah.push({ id: ada[k].id, status_kehadiran: st, catatan: (ada[k].catatan ? ada[k].catatan + ' | ' : '') + 'Koreksi ' + CC.u.dt() + ' oleh ' + ctx.user.nama }); }
      else if (st) { var r = { tanggal: c.tanggal, status_kehadiran: st, shift: '', diinput_oleh: ctx.user.nama }; r[kunciKol] = c.kunci; if (divisi === 'HC') { var tt = tg[c.kunci] || {}; r.perawat_id = tt.perawat_id; r.pasien_id = tt.pasien_id; } baru.push(r); }
    });
    if (baru.length) CC.tambahBanyak(ctx, t, baru);
    if (ubah.length) CC.ubahBanyak(ctx, t, ubah);
    CC.log(ctx, 'ABSENSI', t, '', null, { baru: baru.length, koreksi: ubah.length }, p.bulan || '');
    ctx.pesan = (baru.length + ubah.length) + ' sel absensi tersimpan.';
    return { baru: baru.length, koreksi: ubah.length };
  }
};
CC.A['absensi.centangBerjalan'] = {
  tulis: true, roles: ['ADM', 'KEP'],
  fn: function (ctx, p) {
    var g = CC.A['absensi.grid'].fn(ctx, { bulan: p.bulan, divisi: 'HC' }), hari = CC.u.tgl(), sel = [];
    g.rows.forEach(function (r) { for (var i = 1; i <= g.hari; i++) { var h = g.bulan + '-' + CC.u.pad(i, 2); if (h > hari) break; if (r.sel[i] === '') sel.push({ kunci: r.kunci, tanggal: h, status: 'Bertugas' }); } });
    return CC.A['absensi.set'].fn(ctx, { divisi: 'HC', sel: sel, bulan: p.bulan });
  }
};

/* ===================== LIBUR, CUTI, INFAL & LEMBUR (US-42) ===================== */
CC.dampakLibur = function (t, jenis, jumlah) {
  var g = CC.setRiwayat('gaji').length ? CC.set('gaji', t.tanggal_mulai) : null, out = { gaji: '', klien: '' };
  if (!g) { out.gaji = 'Lengkapi Pengaturan Gaji untuk melihat dampak.'; return out; }
  jumlah = Number(jumlah || 1);
  if (['Libur jatah', 'Cuti', 'Izin', 'Sakit'].indexOf(jenis) > -1) {
    if (t.metode_gaji === 'B') out.gaji = 'Metode B: hari kerja berkurang ' + jumlah + ' × fee harian ' + CC.u.rupiah(CC.u.angka(t.gaji_deal) / (g.pembagi || 30)) + ' = −' + CC.u.rupiah(jumlah * CC.u.angka(t.gaji_deal) / (g.pembagi || 30));
    else out.gaji = 'Metode A: potongan ' + jumlah + ' × ' + CC.u.rupiah(g.potongan_libur) + ' = −' + CC.u.rupiah(jumlah * g.potongan_libur) + (g.potongan_berlaku === 'semua' ? ' (berlaku untuk semua hari libur)' : ' (hanya bila melebihi jatah ' + g.jatah_libur + ' hari)');
  }
  if (jenis === 'Lembur') { out.gaji = 'Tidak dipotong pada Metode A.' + (g.upah_lembur ? ' Upah lembur +' + CC.u.rupiah(g.upah_lembur) + '/hari.' : ' Upah lembur perawat belum diatur.'); out.klien = 'Klien ditagih "Biaya Lembur" ' + jumlah + ' × ' + CC.u.rupiah(g.tarif_lembur_klien) + ' = ' + CC.u.rupiah(jumlah * g.tarif_lembur_klien) + '.'; }
  if (jenis === 'Infal') out.klien = 'Dibuat penugasan Infal untuk perawat pengganti; ditagih sebagai "Jasa Layanan Infal" (tarif diisi saat invoice).';
  return out;
};
CC.A['libur.list'] = {
  roles: ['ADM', 'KEP', 'CS', 'HRD', 'OPS', 'KEU'],
  fn: function (ctx, p) { var bln = p.bulan || CC.u.bulan(), phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN); return CC.semua(CC.T.LIBUR).filter(function (l) { return !p.bulan || l.tanggal.slice(0, 7) === bln; }).map(function (l) { var c = Object.assign({}, l); c.nama_perawat = (phc[l.perawat_id] || {}).nama; c.nama_pengganti = (phc[l.perawat_pengganti_id] || {}).nama || ''; c.nama_pasien = (pas[l.pasien_id] || {}).nama_pasien; if (!CC.lihatNominal(ctx)) c.tarif_klien = ''; return c; }).sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : -1; }); }
};
CC.A['libur.simpan'] = {
  roles: ['ADM', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {};
    CC.wajib(d, ['penugasan_id:Penugasan', 'tanggal:Tanggal', 'jenis:Jenis']);
    var t = CC.cari(CC.T.TUGAS, d.penugasan_id); if (!t) CC.galat('NOT_FOUND', 'Penugasan tidak ditemukan.');
    if (!CC.tugasAktifPada(t, d.tanggal)) CC.galat('VALIDATION', 'Tanggal di luar masa penugasan.', { tanggal: 'Di luar masa penugasan' });
    var dampak = CC.dampakLibur(t, d.jenis, d.jumlah || 1);
    if (p.pratinjau) return { dampak: dampak };
    if ((d.jenis === 'Lembur' || d.jenis === 'Libur jatah') && (d.disetujui_keluarga !== 'YA' || d.dikonfirmasi_kantor !== 'YA')) CC.galat('VALIDATION', 'Libur dan lembur membutuhkan persetujuan keluarga pasien dan konfirmasi ke kantor.', { disetujui_keluarga: 'Wajib YA', dikonfirmasi_kantor: 'Wajib YA' });
    var g = CC.setRiwayat('gaji').length ? CC.set('gaji', d.tanggal) : {};
    var row = CC.tambah(ctx, CC.T.LIBUR, { penugasan_id: t.id, perawat_id: t.perawat_id, pasien_id: t.pasien_id, tanggal: d.tanggal, jenis: d.jenis, jumlah: d.jumlah || 1, perawat_pengganti_id: d.perawat_pengganti_id || '', tarif_klien: d.jenis === 'Lembur' ? (g.tarif_lembur_klien || '') : (d.tarif_klien || ''), disetujui_keluarga: d.disetujui_keluarga || 'TIDAK', dikonfirmasi_kantor: d.dikonfirmasi_kantor || 'TIDAK', bukti_url: d.bukti_url || '', status: 'Tercatat', catatan: d.catatan || '' });
    if (d.perawat_pengganti_id && (d.jenis !== 'Lembur')) {
      var inf = CC.buatPenugasan(ctx, { pasien_id: t.pasien_id, perawat_id: d.perawat_pengganti_id, peran: 'Infal', paket_id: t.paket_id, so_id: t.so_id, tanggal_mulai: d.tanggal, lama_hari: d.jumlah || 1, shift: t.shift, penugasan_asal: t.id, metode_gaji: 'B' });
      CC.ubah(ctx, CC.T.LIBUR, row.id, { penugasan_infal_id: inf.id }, { tanpaLog: true });
      if (d.minta_idf) CC.mintaIdf(ctx, { penugasan_id: t.id, pasien_id: t.pasien_id, perawat_id: t.perawat_id, perawat_penerima_id: d.perawat_pengganti_id, alasan: 'Handover Pergantian (Infal)' });
    }
    ctx.pesan = d.jenis + ' tercatat. ' + [dampak.gaji, dampak.klien].filter(Boolean).join(' ');
    return { row: row, dampak: dampak };
  }
};
CC.A['libur.batal'] = { roles: ['ADM', 'KEP'], tulis: true, fn: function (ctx, p) { if (!p.alasan) CC.galat('VALIDATION', 'Alasan wajib.', { alasan: 'Wajib' }); CC.ubah(ctx, CC.T.LIBUR, p.id, { status: 'Dibatalkan', alasan_batal: p.alasan }, { aksi: 'BATAL' }); ctx.pesan = 'Catatan dibatalkan.'; return true; } };

/* ===================== LAPORAN HARIAN A–H (US-12..15) ===================== */
CC.daftarLaporan = function (ctx, f) {
  f = f || {}; var phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN), e = ctx.peran;
  var rows = CC.semua(CC.T.LHC).filter(function (l) {
    if (f.dari && l.tanggal < f.dari) return false; if (f.sampai && l.tanggal > f.sampai) return false;
    if (f.pasien_id && l.pasien_id !== f.pasien_id) return false; if (f.perawat_id && l.perawat_id !== f.perawat_id) return false;
    if (f.shift && l.shift !== f.shift) return false; if (f.kondisi && l.kondisi_pasien !== f.kondisi) return false; if (f.status && l.status_ketepatan !== f.status) return false;
    if (e === 'PRW' && l.perawat_id !== ctx.user.perawat_id) return false;
    return true;
  });
  return rows.map(function (l) {
    var c = { id: l.id, tanggal: l.tanggal, shift: l.shift, shift_label: CC.shiftInfo(l.shift).label, pasien_id: l.pasien_id, nama_pasien: (pas[l.pasien_id] || {}).nama_pasien, diagnosa: (pas[l.pasien_id] || {}).diagnosa, paket_id: (pas[l.pasien_id] || {}).paket_id, perawat_id: l.perawat_id, nama_perawat: (phc[l.perawat_id] || {}).nama, waktu_isi: l.waktu_isi, status_ketepatan: l.status_ketepatan, status_kirim_pj: l.status_kirim_pj, kondisi_pasien: l.kondisi_pasien, revisi_ke: l.revisi_ke };
    if (e !== 'OPS') { c.tensi = l.tensi; c.nadi = l.nadi; c.suhu = l.suhu; c.spo2 = l.spo2; c.gds = l.gds; c.keterangan_kondisi = l.keterangan_kondisi; c.catatan_tambahan = l.catatan_tambahan; }
    return c;
  }).sort(function (a, b) { return a.waktu_isi < b.waktu_isi ? 1 : -1; });
};
CC.A['laporan.konteks'] = {
  roles: ['PRW'],
  fn: function (ctx, p) {
    var hari = p.tanggal || CC.u.tgl(), pid = ctx.user.perawat_id, pas = CC.peta(CC.T.PASIEN);
    var k = CC.kewajibanPerawat(pid, hari).concat(CC.kewajibanPerawat(pid, CC.u.tambahHari(hari, -1)).filter(function (x) { return !x.laporan_id; }).map(function (x) { x.kemarin = true; return x; }));
    k.forEach(function (x) { var ps = pas[x.pasien_id] || {}; x.alamat = ps.alamat; x.usia = CC.u.usia(ps.tgl_lahir); x.info = CC.u.json(ps.info_klinis, {}); x.nama_pj = ps.nama_pj; x.relasi_pj = ps.relasi_pj; x.penerima = CC.penerimaLaporan(ps).map(function (r) { return r.nama + (r.relasi ? ' (' + r.relasi + ')' : ''); }).join(', '); x.tanggal = x.kemarin ? CC.u.tambahHari(hari, -1) : hari; });
    return { tanggal: hari, kewajiban: k, format: CC.set('format_laporan'), shift: CC.shiftDaftar() };
  }
};
CC.validasiIsian = function (isian) {
  var f = CC.set('format_laporan'), err = {}, C = isian.C || {}, F = isian.F || {}, G = isian.G || {};
  var nilai = { tensi: C.tensi, nadi: C.nadi, suhu: C.suhu, spo2: C.spo2, gds: C.gds, kondisi_pasien: G.kondisi, bab: F.bab, bak: F.bak, makan_pagi: F.makan_pagi, makan_siang: F.makan_siang, makan_malam: F.makan_malam };
  (f.wajib || []).forEach(function (k) { if (nilai[k] === undefined || nilai[k] === '' || nilai[k] === null) err[k] = 'Wajib diisi'; });
  if (C.tensi && !/^\d{2,3}\/\d{2,3}$/.test(String(C.tensi))) err.tensi = 'Format 120/80';
  if (C.suhu && (CC.u.angka(C.suhu) < 33 || CC.u.angka(C.suhu) > 43)) err.suhu = 'Suhu tidak wajar';
  if (C.spo2 && (CC.u.angka(C.spo2) < 50 || CC.u.angka(C.spo2) > 100)) err.spo2 = '50–100';
  if (C.nadi && (CC.u.angka(C.nadi) < 20 || CC.u.angka(C.nadi) > 250)) err.nadi = 'Nadi tidak wajar';
  var B = isian.B || []; for (var i = 0; i < (f.B || []).length; i++) if (!B[i]) { err['B' + i] = 'Pilih Ya/Tidak'; }
  if (G.kondisi && G.kondisi !== 'Stabil' && !G.ket) err.keterangan_kondisi = 'Jelaskan perubahan/pemantauan';
  if (Object.keys(err).length) CC.galat('VALIDATION', 'Ada ' + Object.keys(err).length + ' isian wajib yang belum lengkap.', err);
};
CC.A['laporan.kirim'] = {
  roles: ['PRW'], tulis: true,
  fn: function (ctx, p) {
    var pid = ctx.user.perawat_id, tanggal = p.tanggal || CC.u.tgl(), kw = CC.kewajibanPerawat(pid, tanggal).filter(function (x) { return x.pasien_id === p.pasien_id && x.shift === p.shift; })[0];
    if (!kw) CC.galat('FORBIDDEN', 'Pasien/shift ini tidak ditugaskan kepada Anda pada tanggal tersebut.');
    var dup = CC.semua(CC.T.LHC).filter(function (l) { return l.pasien_id === p.pasien_id && l.tanggal === tanggal && l.shift === p.shift; })[0];
    if (dup) CC.galat('CONFLICT', 'Laporan ' + dup.id + ' untuk pasien, tanggal, dan shift ini sudah ada. Buka laporan tersebut untuk revisi.', { laporan_id: dup.id });
    var isian = p.isian || {}; CC.validasiIsian(isian);
    var waktu = CC.u.dt(), batas = CC.batasLaporan(tanggal, p.shift), C = isian.C || {}, G = isian.G || {};
    var ttd = ''; if (isian.H && isian.H.ttd && CC.env.simpanBerkas) ttd = CC.env.simpanBerkas(isian.H.ttd, 'ttd_lhc_' + p.pasien_id + '_' + tanggal, 'TandaTangan').url; if (isian.H) delete isian.H.ttd;
    var row = CC.tambah(ctx, CC.T.LHC, { tanggal: tanggal, shift: p.shift, pasien_id: p.pasien_id, perawat_id: pid, penugasan_id: kw.penugasan_id, isian: JSON.stringify(isian), tensi: C.tensi, nadi: C.nadi, suhu: C.suhu, spo2: C.spo2, gds: C.gds || '', kondisi_pasien: G.kondisi, keterangan_kondisi: G.ket || '', catatan_tambahan: CC.u.bersih(p.catatan_tambahan || ''), waktu_isi: waktu, status_ketepatan: waktu <= batas ? 'Tepat Waktu' : 'Terlambat', status_kirim_pj: 'Antri', revisi_ke: 0, ttd_url: ttd });
    var ps = CC.cari(CC.T.PASIEN, p.pasien_id), pr = CC.cari(CC.T.PHC, pid);
    var n = CC.notif(ctx, 'LAPORAN_TERKIRIM', CC.penerimaLaporan(ps).map(function (x) { return { nama: x.nama, wa: x.wa, email: x.email }; }), { pasien: ps.nama_pasien, shift: CC.shiftInfo(p.shift).label, tanggal: CC.u.tglPanjang(tanggal), tensi: C.tensi, nadi: C.nadi, suhu: C.suhu, spo2: C.spo2, kondisi: G.kondisi, catatan: p.catatan_tambahan ? '• Catatan: ' + p.catatan_tambahan : '', perawat: pr.nama }, row.id);
    CC.ubah(ctx, CC.T.LHC, row.id, { status_kirim_pj: n ? 'Antri' : 'Tidak dikirim (notifikasi nonaktif)' }, { tanpaLog: true });
    var tawar = false;
    if (G.kondisi && G.kondisi !== 'Stabil') {
      CC.notif(ctx, 'KONDISI_PASIEN', CC.penerimaUser(CC.usersPeran(['KEP'])), { pasien: ps.nama_pasien, kondisi: G.kondisi, shift: CC.shiftInfo(p.shift).label, tanggal: CC.u.tglPanjang(tanggal), perawat: pr.nama, ket: G.ket || '' }, row.id);
      tawar = !!(CC.set('operasional') || {}).kondisi_buat_kasus;
    }
    ctx.pesan = 'Laporan terkirim (' + row.status_ketepatan + ').';
    return { id: row.id, status_ketepatan: row.status_ketepatan, tawarKasus: tawar, kirim_pj: n ? 'Antri' : 'Nonaktif' };
  }
};
CC.A['laporan.revisi'] = {
  roles: ['PRW'], tulis: true,
  fn: function (ctx, p) {
    var l = CC.cari(CC.T.LHC, p.id); if (!l || l.perawat_id !== ctx.user.perawat_id) CC.galat('FORBIDDEN', 'Hanya perawat pengisi yang dapat merevisi laporan ini.');
    if (!p.alasan) CC.galat('VALIDATION', 'Alasan revisi wajib diisi.', { alasan: 'Wajib' });
    var isian = p.isian || CC.u.json(l.isian, {}); CC.validasiIsian(isian);
    var riw = CC.u.json(l.riwayat_revisi, []); riw.push({ versi: Number(l.revisi_ke || 0), waktu: l.diubah_pada, isian: CC.u.json(l.isian, {}), alasan: p.alasan, oleh: ctx.user.nama });
    var C = isian.C || {}, G = isian.G || {};
    CC.ubah(ctx, CC.T.LHC, l.id, { isian: JSON.stringify(isian), tensi: C.tensi, nadi: C.nadi, suhu: C.suhu, spo2: C.spo2, gds: C.gds || '', kondisi_pasien: G.kondisi, keterangan_kondisi: G.ket || '', catatan_tambahan: p.catatan_tambahan === undefined ? l.catatan_tambahan : p.catatan_tambahan, revisi_ke: Number(l.revisi_ke || 0) + 1, riwayat_revisi: JSON.stringify(riw) }, { aksi: 'REVISI_LAPORAN', ket: p.alasan });
    ctx.pesan = 'Revisi v' + (Number(l.revisi_ke || 0) + 1) + ' tersimpan; versi sebelumnya tetap tercatat.'; return true;
  }
};
CC.A['laporan.list'] = { roles: ['ADM', 'PRW', 'KEP', 'OPS'], fn: function (ctx, p) { return CC.daftarLaporan(ctx, p); } };
CC.A['laporan.detail'] = {
  roles: ['ADM', 'PRW', 'KEP'],
  fn: function (ctx, p) {
    var l = CC.cari(CC.T.LHC, p.id); if (!l) CC.galat('NOT_FOUND', 'Laporan tidak ditemukan.');
    if (ctx.peran === 'PRW' && l.perawat_id !== ctx.user.perawat_id) CC.galat('FORBIDDEN', 'Anda hanya dapat melihat laporan pribadi.');
    var c = Object.assign({}, l); c.isian = CC.u.json(l.isian, {}); c.riwayat_revisi = CC.u.json(l.riwayat_revisi, []); c.nama_pasien = (CC.cari(CC.T.PASIEN, l.pasien_id) || {}).nama_pasien; c.nama_perawat = CC.namaPerawat(l.perawat_id); c.shift_label = CC.shiftInfo(l.shift).label; c.format = CC.set('format_laporan');
    c.kirim = CC.semua(CC.T.NOTIF).filter(function (n) { return n.ref_id === l.id && n.kanal !== 'INAPP'; }).map(function (n) { return { kanal: n.kanal, tujuan: n.nama_penerima, status: n.status, waktu: n.dikirim_pada || n.dibuat_pada }; });
    return c;
  }
};
CC.A['laporan.kepatuhan'] = {
  roles: ['ADM', 'KEP', 'OPS'],
  fn: function (ctx, p) { var hari = CC.u.tgl(), dari = p.dari || CC.u.tambahHari(hari, -29), sampai = p.sampai || hari; var s = CC.statistikKepatuhan(dari, sampai); s.belum_hari_ini = CC.laporanBelumMasuk(hari); s.belum_kemarin = CC.laporanBelumMasuk(CC.u.tambahHari(hari, -1)); s.dari = dari; s.sampai = sampai; return s; }
};
CC.A['laporan.ingatkan'] = {
  roles: ['ADM', 'KEP', 'OPS'], tulis: true,
  fn: function (ctx, p) {
    var pr = CC.cari(CC.T.PHC, p.perawat_id), ps = CC.cari(CC.T.PASIEN, p.pasien_id), u = CC.userPerawat(p.perawat_id);
    var n = CC.notif(ctx, 'LAPORAN_PENGINGAT', [{ nama: pr.nama, wa: pr.no_wa, user_id: u ? u.id : '' }], { pasien: ps.nama_pasien, shift: CC.shiftInfo(p.shift).label, tanggal: CC.u.tglPanjang(p.tanggal || CC.u.tgl()), batas: CC.batasLaporan(p.tanggal || CC.u.tgl(), p.shift).slice(11) }, 'REM-' + p.pasien_id);
    ctx.pesan = n ? 'Pengingat dikirim ke ' + pr.nama + '.' : 'Pengingat dicatat (kanal WA nonaktif).'; return true;
  }
};

/* ===================== HOME VISIT (US-16, US-17) ===================== */
CC.gabungHV = function (h) { var c = Object.assign({}, h), ps = CC.cari(CC.T.PASIEN, h.pasien_id) || {}, pr = CC.cari(CC.T.PHV, h.perawat_hv_id) || {}; c.nama_pasien = ps.nama_pasien; c.alamat = ps.alamat; c.wilayah = ps.wilayah; c.nama_perawat = pr.nama; c.no_wa_pj = ps.no_wa_pj; c.nama_pj = ps.nama_pj; return c; };
CC.A['hv.list'] = {
  roles: ['ADM', 'HV', 'OPS'],
  fn: function (ctx, p) {
    var rows = CC.aktifSaja(CC.semua(CC.T.LHV)).filter(function (h) { return !p.bulan || h.tanggal.slice(0, 7) === p.bulan; });
    if (ctx.peran === 'HV') rows = rows.filter(function (h) { return h.perawat_hv_id === ctx.user.perawat_id; });
    rows = rows.map(CC.gabungHV);
    if (ctx.peran === 'OPS') rows = rows.map(function (h) { return { id: h.id, tanggal: h.tanggal, jadwal_jam: h.jadwal_jam, nama_pasien: h.nama_pasien, wilayah: h.wilayah, nama_perawat: h.nama_perawat, jenis_tindakan: h.jenis_tindakan, status: h.status, status_consent: h.status_consent }; });
    return rows.sort(function (a, b) { return (a.tanggal + a.jadwal_jam) < (b.tanggal + b.jadwal_jam) ? 1 : -1; });
  }
};
CC.A['hv.jadwal'] = {
  roles: ['ADM', 'HVK'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {}; CC.wajib(d, ['tanggal:Tanggal', 'jadwal_jam:Jam', 'pasien_id:Pasien', 'perawat_hv_id:Perawat HV', 'jenis_tindakan:Jenis tindakan']);
    var r = CC.tambah(ctx, CC.T.LHV, { tanggal: d.tanggal, jadwal_jam: d.jadwal_jam, pasien_id: d.pasien_id, perawat_hv_id: d.perawat_hv_id, jenis_tindakan: d.jenis_tindakan, status: 'Terjadwal', status_consent: 'Belum', biaya: d.biaya || '' });
    ctx.pesan = 'Kunjungan ' + r.id + ' dijadwalkan.'; return CC.gabungHV(r);
  }
};
CC.A['hv.consent'] = {
  roles: ['ADM', 'HV'], tulis: true,
  fn: function (ctx, p) {
    var h = CC.cari(CC.T.LHV, p.id); if (!h) CC.galat('NOT_FOUND', 'Kunjungan tidak ditemukan.');
    if (ctx.peran === 'HV' && h.perawat_hv_id !== ctx.user.perawat_id) CC.galat('FORBIDDEN', 'Kunjungan ini bukan milik Anda.');
    CC.wajib(p, ['consent_oleh:Nama pemberi persetujuan', 'consent_relasi:Hubungan dengan pasien']);
    if (p.setuju !== true) CC.galat('VALIDATION', 'Persetujuan tindakan harus dicentang oleh pasien/keluarga.', { setuju: 'Wajib' });
    if (!p.ttd) CC.galat('VALIDATION', 'Tanda tangan persetujuan wajib.', { ttd: 'Wajib' });
    var url = CC.env.simpanBerkas ? CC.env.simpanBerkas(p.ttd, 'consent_' + h.id, 'TandaTangan').url : '';
    var no = CC.nomorBaru(ctx, 'IC', h.tanggal);
    CC.ubah(ctx, CC.T.LHV, h.id, { consent_id: no, status_consent: 'Disetujui', consent_oleh: p.consent_oleh, consent_relasi: p.consent_relasi, ttd_url: url }, { aksi: 'CONSENT' });
    ctx.pesan = 'Informed consent ' + no + ' tersimpan. Input tindakan kini terbuka.'; return { consent_id: no };
  }
};
CC.A['hv.selesai'] = {
  roles: ['ADM', 'HV'], tulis: true,
  fn: function (ctx, p) {
    var h = CC.cari(CC.T.LHV, p.id); if (!h) CC.galat('NOT_FOUND', 'Kunjungan tidak ditemukan.');
    if (ctx.peran === 'HV' && h.perawat_hv_id !== ctx.user.perawat_id) CC.galat('FORBIDDEN', 'Kunjungan ini bukan milik Anda.');
    if (h.status_consent !== 'Disetujui') CC.galat('FORBIDDEN', 'Input tindakan terkunci: Persetujuan Tindakan (Informed Consent) belum diisi dan disetujui pasien/keluarga.');
    var err = {}; if (!p.foto_sebelum) err.foto_sebelum = 'Foto sebelum wajib'; if (!p.foto_sesudah) err.foto_sesudah = 'Foto sesudah wajib'; if (!p.ttd) err.ttd = 'Tanda tangan pasien/keluarga wajib'; if (!p.hasil_tindakan) err.hasil_tindakan = 'Hasil tindakan wajib';
    if (Object.keys(err).length) CC.galat('VALIDATION', 'Lengkapi dokumentasi tindakan.', err);
    var simpan = function (data, nama, folder) { return /^(assets\/|https?:)/.test(data) ? data : (CC.env.simpanBerkas ? CC.env.simpanBerkas(data, nama, folder).url : ''); };
    CC.ubah(ctx, CC.T.LHV, h.id, { foto_sebelum_url: simpan(p.foto_sebelum, 'hv_sebelum_' + h.id, 'Foto_HomeVisit'), foto_sesudah_url: simpan(p.foto_sesudah, 'hv_sesudah_' + h.id, 'Foto_HomeVisit'), ttd_url: simpan(p.ttd, 'hv_ttd_' + h.id, 'TandaTangan'), hasil_tindakan: CC.u.bersih(p.hasil_tindakan), catatan_tambahan: CC.u.bersih(p.catatan_tambahan || ''), status: 'Selesai' }, { aksi: 'TINDAKAN_HV' });
    ctx.pesan = 'Laporan tindakan Home Visit tersimpan.'; return true;
  }
};
CC.A['hv.batal'] = { roles: ['ADM', 'HVK'], tulis: true, fn: function (ctx, p) { if (!p.alasan) CC.galat('VALIDATION', 'Alasan wajib.', { alasan: 'Wajib' }); CC.ubah(ctx, CC.T.LHV, p.id, { status: 'Batal', catatan_tambahan: 'Dibatalkan: ' + p.alasan }, { aksi: 'BATAL' }); ctx.pesan = 'Kunjungan dibatalkan.'; return true; } };

/* ===================== FORMULIR IDENTIFIKASI PASIEN (US-56) ===================== */
CC.mintaIdf = function (ctx, d) {
  var t = CC.cari(CC.T.TUGAS, d.penugasan_id), pengisi = d.perawat_id || (t ? t.perawat_id : '');
  var ada = CC.semua(CC.T.IDF).filter(function (f) { return f.penugasan_id === d.penugasan_id && f.perawat_id === pengisi && f.status === 'Draft'; })[0];
  if (ada) return ada;
  var r = CC.tambah(ctx, CC.T.IDF, { penugasan_id: d.penugasan_id, pasien_id: d.pasien_id || t.pasien_id, perawat_id: pengisi, alasan: d.alasan || 'Evaluasi', status: 'Draft', diminta_oleh: ctx && ctx.user ? ctx.user.nama : 'Sistem', tanggal_diminta: CC.u.dt(), perawat_penerima_id: d.perawat_penerima_id || '' });
  var pr = CC.cari(CC.T.PHC, pengisi), u = CC.userPerawat(pengisi), ps = CC.cari(CC.T.PASIEN, r.pasien_id);
  if (pr) CC.notif(ctx, 'IDF_DIMINTA', [{ nama: pr.nama, wa: pr.no_wa, user_id: u ? u.id : '' }], { pasien: ps.nama_pasien, alasan: r.alasan }, r.id);
  return r;
};
CC.bolehBacaIdf = function (ctx, f) {
  var e = ctx.peran; if (e === 'ADM' || e === 'KEP') return true;
  if (e !== 'PRW') return false;
  var pid = ctx.user.perawat_id; if (f.perawat_id === pid) return true;
  if (f.status !== 'Ditinjau') return false;
  var hari = CC.u.tgl();
  return CC.semua(CC.T.TUGAS).some(function (t) { return t.perawat_id === pid && t.pasien_id === f.pasien_id && (t.peran === 'Infal' ? (t.status === 'Berjalan' && hari >= t.tanggal_mulai && hari <= t.tanggal_akhir) : t.status === 'Berjalan'); });
};
CC.A['idf.list'] = {
  roles: ['ADM', 'PRW', 'KEP'],
  fn: function (ctx) {
    var phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN);
    return CC.semua(CC.T.IDF).filter(function (f) { return CC.bolehBacaIdf(ctx, f); }).map(function (f) {
      var c = { id: f.id, penugasan_id: f.penugasan_id, pasien_id: f.pasien_id, nama_pasien: (pas[f.pasien_id] || {}).nama_pasien, perawat_id: f.perawat_id, nama_perawat: (phc[f.perawat_id] || {}).nama, penerima: (phc[f.perawat_penerima_id] || {}).nama || '', perawat_penerima_id: f.perawat_penerima_id, alasan: f.alasan, status: f.status === 'Draft' && !f.kondisi_umum ? 'Diminta' : f.status, tanggal_diminta: f.tanggal_diminta, tanggal_isi: f.tanggal_isi, tanggal_ditinjau: f.tanggal_ditinjau, ditinjau_oleh: f.ditinjau_oleh, milik_saya: f.perawat_id === ctx.user.perawat_id };
      c.terlambat = c.status === 'Diminta' && CC.u.selisihJam(f.tanggal_diminta) > (CC.set('operasional').idf_ingat_hari * 24);
      return c;
    }).sort(function (a, b) { return (a.tanggal_diminta || '') < (b.tanggal_diminta || '') ? 1 : -1; });
  }
};
CC.A['idf.detail'] = {
  roles: ['ADM', 'PRW', 'KEP'],
  fn: function (ctx, p) {
    var f = CC.cari(CC.T.IDF, p.id); if (!f || !CC.bolehBacaIdf(ctx, f)) CC.galat('FORBIDDEN', 'Formulir ini hanya untuk perawat yang ditugaskan, Keperawatan, dan Admin.');
    var c = Object.assign({}, f), ps = CC.cari(CC.T.PASIEN, f.pasien_id) || {};
    c.nama_pasien = ps.nama_pasien; c.diagnosa = ps.diagnosa; c.usia = CC.u.usia(ps.tgl_lahir); c.alamat = ps.alamat; c.nama_perawat = CC.namaPerawat(f.perawat_id); c.penerima = CC.namaPerawat(f.perawat_penerima_id);
    c.boleh_isi = ctx.peran === 'PRW' ? f.perawat_id === ctx.user.perawat_id && f.status === 'Draft' : ctx.peran === 'KEP' || ctx.peran === 'ADM';
    c.boleh_tinjau = (ctx.peran === 'KEP' || ctx.peran === 'ADM') && f.status === 'Selesai';
    c.format = CC.set('format_idf');
    return c;
  }
};
CC.A['idf.minta'] = {
  roles: ['ADM', 'KEP'], tulis: true,
  fn: function (ctx, p) { CC.wajib(p, ['penugasan_id:Penugasan', 'alasan:Alasan']); var r = CC.mintaIdf(ctx, p); ctx.pesan = 'Permintaan ' + r.id + ' dikirim ke ' + CC.namaPerawat(r.perawat_id) + '.'; return r; }
};
CC.A['idf.simpan'] = {
  roles: ['ADM', 'PRW', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    var f = CC.cari(CC.T.IDF, p.id); if (!f) CC.galat('NOT_FOUND', 'Formulir tidak ditemukan.');
    if (ctx.peran === 'PRW' && (f.perawat_id !== ctx.user.perawat_id || f.status !== 'Draft')) CC.galat('FORBIDDEN', 'Formulir hanya dapat diubah oleh perawat pengisi selama berstatus Draft.');
    var d = p.data || {}, izin = ['kondisi_umum', 'tindakan_dasar', 'tindakan_kdm', 'penyakit_penyerta', 'kegiatan_pagi', 'kegiatan_siang', 'kegiatan_sore', 'kegiatan_malam', 'perlakuan_keluarga', 'perlakuan_pasien', 'hak_perawat_ket', 'saran_perawat', 'alasan'], patch = {};
    izin.forEach(function (k) { if (d[k] !== undefined) patch[k] = CC.u.bersih(d[k]); });
    if (p.kirim) {
      var cek = Object.assign({}, f, patch), kurang = {}; (CC.set('format_idf').wajib || []).forEach(function (k) { if (!String(cek[k] || '').trim()) kurang[k] = 'Wajib diisi'; });
      if (Object.keys(kurang).length) CC.galat('VALIDATION', 'Lengkapi ' + Object.keys(kurang).length + ' butir wajib sebelum mengirim.', kurang);
      patch.status = 'Selesai'; patch.tanggal_isi = CC.u.dt();
    }
    CC.ubah(ctx, CC.T.IDF, f.id, patch, { aksi: p.kirim ? 'IDF_KIRIM' : 'IDF_DRAF' });
    if (p.kirim) CC.notif(ctx, 'IDF_SELESAI', CC.penerimaUser(CC.usersPeran(['KEP'])), { kode: f.id, pasien: (CC.cari(CC.T.PASIEN, f.pasien_id) || {}).nama_pasien }, f.id);
    ctx.pesan = p.kirim ? 'Formulir dikirim ke Koordinator untuk ditinjau.' : 'Draf tersimpan.'; return true;
  }
};
CC.A['idf.tinjau'] = {
  roles: ['ADM', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    var f = CC.cari(CC.T.IDF, p.id); if (!f || f.status !== 'Selesai') CC.galat('VALIDATION', 'Hanya formulir berstatus Selesai yang dapat ditinjau.');
    CC.ubah(ctx, CC.T.IDF, f.id, { status: 'Ditinjau', ditinjau_oleh: ctx.user.nama, tanggal_ditinjau: CC.u.dt() }, { aksi: 'IDF_TINJAU' });
    if (f.perawat_penerima_id) { var pr = CC.cari(CC.T.PHC, f.perawat_penerima_id), u = CC.userPerawat(f.perawat_penerima_id); if (pr) CC.notif(ctx, 'IDF_DITINJAU', [{ nama: pr.nama, wa: pr.no_wa, user_id: u ? u.id : '' }], { pasien: (CC.cari(CC.T.PASIEN, f.pasien_id) || {}).nama_pasien }, f.id); }
    ctx.pesan = 'Formulir ditinjau dan tersedia bagi perawat penerima.'; return true;
  }
};

/* ===================== PIPELINE CS (US-06) ===================== */
CC.A['pipeline.list'] = {
  roles: ['ADM', 'CS', 'OPS'],
  fn: function (ctx) {
    var now = CC.u.dt(), op = CC.set('operasional'), users = CC.peta(CC.T.USER);
    return CC.aktifSaja(CC.semua(CC.T.LEAD)).map(function (l) { var c = Object.assign({}, l); c.pic_nama = (users[l.pic_cs] || {}).nama || ''; c.jam_sejak = Math.round(CC.u.selisihJam(l.followup_terakhir || l.tanggal_masuk, now)); c.terlambat = (l.status_pipeline === 'Lead Masuk' || l.status_pipeline === 'Follow-up') && c.jam_sejak > op.followup_hari * 24; if (!CC.lihatNominal(ctx)) c.nilai_deal = ''; return c; }).sort(function (a, b) { return a.tanggal_masuk < b.tanggal_masuk ? 1 : -1; });
  }
};
CC.A['pipeline.simpan'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {}; CC.wajib(d, ['nama_kontak:Nama kontak', 'no_wa:Nomor WhatsApp', 'sumber_lead:Sumber lead']);
    d.no_wa = CC.u.hp08(d.no_wa); if (!CC.u.hpValid(d.no_wa)) CC.galat('VALIDATION', 'Nomor WhatsApp tidak valid.', { no_wa: 'Format 08xxxxxxxxxx' });
    Object.keys(d).forEach(function (k) { d[k] = CC.u.bersih(d[k]); });
    var r;
    if (d.id) { var id = d.id; delete d.id; r = CC.ubah(ctx, CC.T.LEAD, id, d); }
    else { d.tanggal_masuk = d.tanggal_masuk || CC.u.dt(); d.status_pipeline = 'Lead Masuk'; d.pic_cs = d.pic_cs || ctx.user.id; r = CC.tambah(ctx, CC.T.LEAD, d); }
    ctx.pesan = 'Lead ' + r.id + ' tersimpan.'; return r;
  }
};
CC.A['pipeline.pindah'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var tahap = ['Lead Masuk', 'Follow-up', 'Deal', 'Tidak Jadi']; if (tahap.indexOf(p.status) === -1) CC.galat('VALIDATION', 'Tahap tidak valid.');
    var patch = { status_pipeline: p.status, followup_terakhir: CC.u.dt() };
    if (p.status === 'Tidak Jadi') { if (!p.alasan) CC.galat('VALIDATION', 'Status "Tidak Jadi" wajib disertai alasan.', { alasan: 'Wajib' }); patch.alasan_tidak_jadi = p.alasan; }
    if (p.catatan) patch.catatan = p.catatan; if (p.followup_berikutnya) patch.followup_berikutnya = p.followup_berikutnya; if (p.nilai_deal) patch.nilai_deal = p.nilai_deal;
    var r = CC.ubah(ctx, CC.T.LEAD, p.id, patch, { aksi: 'PIPELINE', ket: p.status + (p.alasan ? ': ' + p.alasan : '') });
    if (p.status === 'Deal' && r.pasien_id) CC.ubah(ctx, CC.T.PASIEN, r.pasien_id, { status: 'Aktif' }, { tanpaLog: true });
    ctx.pesan = r.nama_kontak + ' → ' + p.status + '.'; return r;
  }
};
CC.A['pipeline.followup'] = { roles: ['ADM', 'CS'], tulis: true, fn: function (ctx, p) { var l = CC.cari(CC.T.LEAD, p.id); var patch = { followup_terakhir: CC.u.dt(), catatan: (p.catatan ? '[' + CC.u.dt() + '] ' + p.catatan + '\n' : '') + (l.catatan || ''), followup_berikutnya: p.berikutnya || '' }; if (l.status_pipeline === 'Lead Masuk') patch.status_pipeline = 'Follow-up'; CC.ubah(ctx, CC.T.LEAD, p.id, patch, { aksi: 'FOLLOWUP' }); ctx.pesan = 'Follow-up dicatat.'; return true; } };

/* ===================== KASUS & KOMPLAIN (US-18, US-19) ===================== */
CC.daftarKasus = function (ctx) {
  var e = ctx.peran, now = CC.u.dt(), users = CC.peta(CC.T.USER), pas = CC.peta(CC.T.PASIEN);
  return CC.aktifSaja(CC.semua(CC.T.KASUS)).filter(function (k) {
    if (e === 'KEP') return k.divisi_asal === 'HC' || k.divisi_asal === 'CS' && k.jenis === 'Kondisi Lapangan';
    if (e === 'HV' || e === 'HVK') return k.divisi_asal === 'HV';
    if (e === 'CS') return k.jenis === 'Komplain Klien' || k.divisi_asal === 'CS';
    return true;
  }).map(function (k) {
    var c = Object.assign({}, k); c.utas = CC.u.json(k.utas_diskusi, []); delete c.utas_diskusi; c.pic_nama = (users[k.pic] || {}).nama || k.pic; c.nama_pasien = (pas[k.pasien_id] || {}).nama_pasien || ''; c.nama_perawat = CC.namaPerawat(k.perawat_id);
    if (c.status !== 'Selesai' && c.status !== 'Dibatalkan' && now > k.sla_tenggat) c.status = 'Overdue';
    var j = CC.u.selisihJam(now, k.sla_tenggat); c.sla_sisa_jam = Math.round(j * 10) / 10;
    var abs = Math.abs(j), lbl = abs >= 24 ? Math.floor(abs / 24) + 'h ' + Math.round(abs % 24) + 'j' : Math.floor(abs) + 'j ' + Math.round((abs % 1) * 60) + 'm';
    c.sla_label = c.status === 'Selesai' ? 'Selesai' : (j >= 0 ? 'Sisa ' + lbl : lbl);
    c.umur_hari = CC.u.selisihHari(k.tanggal_masuk, now);
    return c;
  }).sort(function (a, b) { var o = { Overdue: 0, Masuk: 1, Proses: 2, Selesai: 3, Dibatalkan: 4 }; return o[a.status] - o[b.status] || (a.sla_tenggat < b.sla_tenggat ? -1 : 1); });
};
CC.A['kasus.list'] = { roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'], fn: function (ctx) { return { rows: CC.daftarKasus(ctx), pic: CC.semua(CC.T.USER).filter(function (u) { return u.status_akun === 'Aktif' && u.role !== 'PRW'; }).map(function (u) { return { id: u.id, nama: u.nama, peran: CC.PERAN[CC.peranEfektif(u)] }; }), boleh_tambah: CC.boleh(ctx.user, ['ADM', 'KEP', 'HV', 'CS']) }; } };
CC.A['kasus.simpan'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {}; CC.wajib(d, ['jenis:Jenis kasus', 'judul:Judul', 'deskripsi:Deskripsi', 'pic:PIC']);
    var sla = (CC.set('operasional').sla_jam || {})[d.jenis] || 24, t = CC.env.now(); t.setMinutes(t.getMinutes() + sla * 60);
    var div = d.divisi_asal || (ctx.peran === 'HV' || ctx.peran === 'HVK' ? 'HV' : ctx.peran === 'CS' ? 'CS' : 'HC');
    var r = CC.tambah(ctx, CC.T.KASUS, { tanggal_masuk: CC.u.dt(), jenis: d.jenis, divisi_asal: div, pasien_id: d.pasien_id || '', perawat_id: d.perawat_id || '', judul: CC.u.bersih(d.judul), deskripsi: CC.u.bersih(d.deskripsi), prioritas: d.prioritas || 'Sedang', pic: d.pic, sla_tenggat: CC.u.dt(t), status: 'Masuk', utas_diskusi: JSON.stringify([{ oleh: ctx.user.nama, peran: CC.PERAN[ctx.peran], waktu: CC.u.dt(), teks: 'Kasus dibuat. ' + (d.ref_laporan ? 'Rujukan laporan ' + d.ref_laporan + '.' : '') }]) });
    var pic = CC.cari(CC.T.USER, d.pic); if (pic) CC.notif(ctx, 'KASUS_3HARI', [{ nama: pic.nama, user_id: pic.id }], { kode: r.id, judul: r.judul, hari: 0 }, r.id);
    ctx.pesan = 'Kasus ' + r.id + ' dibuat. Tenggat SLA ' + sla + ' jam (' + CC.u.dt(t).slice(11) + ').'; return r;
  }
};
CC.A['kasus.status'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var k = CC.cari(CC.T.KASUS, p.id); if (!k) CC.galat('NOT_FOUND', 'Kasus tidak ditemukan.');
    if (['Masuk', 'Proses', 'Selesai'].indexOf(p.status) === -1) CC.galat('VALIDATION', 'Status tidak valid.');
    if (p.status === 'Selesai' && !p.status_akhir) CC.galat('VALIDATION', 'Status akhir (penyelesaian) wajib diisi.', { status_akhir: 'Wajib' });
    var utas = CC.u.json(k.utas_diskusi, []); utas.push({ oleh: ctx.user.nama, peran: CC.PERAN[ctx.peran], waktu: CC.u.dt(), teks: 'Status → ' + p.status + (p.status_akhir ? ': ' + p.status_akhir : ''), sistem: true });
    var patch = { status: p.status, utas_diskusi: JSON.stringify(utas) }; if (p.status === 'Selesai') { patch.status_akhir = p.status_akhir; patch.selesai_pada = CC.u.dt(); }
    if (p.pic) patch.pic = p.pic;
    CC.ubah(ctx, CC.T.KASUS, k.id, patch, { aksi: 'STATUS_KASUS', ket: p.status }); ctx.pesan = 'Kasus ' + k.id + ' → ' + p.status + '.'; return true;
  }
};
CC.A['kasus.komentar'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'], tulis: true,
  fn: function (ctx, p) { var k = CC.cari(CC.T.KASUS, p.id); if (!String(p.teks || '').trim()) CC.galat('VALIDATION', 'Komentar kosong.'); var utas = CC.u.json(k.utas_diskusi, []); utas.push({ oleh: ctx.user.nama, peran: CC.PERAN[ctx.peran], waktu: CC.u.dt(), teks: CC.u.bersih(String(p.teks).slice(0, 1000)) }); CC.ubah(ctx, CC.T.KASUS, k.id, { utas_diskusi: JSON.stringify(utas) }, { aksi: 'KOMENTAR' }); return utas; }
};
CC.A['kasus.mingguan'] = { roles: ['ADM', 'OPS', 'KEP', 'HV'], fn: function (ctx) { return CC.daftarKasus(ctx).filter(function (k) { return k.status !== 'Selesai' && k.status !== 'Dibatalkan'; }); } };

/* ===================== TURNOVER (US-20) & REKRUTMEN (US-21) ===================== */
CC.hookSimpan.turnover = function (ctx, d, baru) { if (!baru) CC.galat('FORBIDDEN', 'Catatan turnover tidak dapat diubah. Tambahkan baris koreksi baru.'); d.dicatat_oleh = ctx.user.nama; d.bulan_rekap = String(d.tanggal_efektif).slice(0, 7); d.divisi = d.divisi || (ctx.peran === 'HV' || ctx.peran === 'HVK' ? 'HV' : ctx.peran === 'CS' ? 'CS' : 'HC'); return d; };
CC.A['turnover.rekap'] = {
  roles: ['ADM', 'KEP', 'HV', 'CS', 'HRD', 'OPS'],
  fn: function (ctx, p) { var th = p.tahun || String(CC.env.now().getFullYear()), m = {}; for (var i = 1; i <= 12; i++) m[th + '-' + CC.u.pad(i, 2)] = { bulan: th + '-' + CC.u.pad(i, 2), masuk: 0, keluar: 0, rotasi: 0, putus_klien: 0, putus_perawat: 0 }; var alasan = {}; CC.semua(CC.T.TURNOVER).forEach(function (t) { var o = m[t.bulan_rekap]; if (!o) return; if (/Masuk/.test(t.jenis)) o.masuk++; else if (/Keluar/.test(t.jenis)) o.keluar++; else if (/Rotasi|Pergantian/.test(t.jenis)) o.rotasi++; else if (/Klien/.test(t.jenis)) o.putus_klien++; else if (/Perawat/.test(t.jenis)) o.putus_perawat++; alasan[t.alasan_terstandar] = (alasan[t.alasan_terstandar] || 0) + 1; }); return { bulan: Object.keys(m).map(function (k) { return m[k]; }), alasan: alasan }; }
};
CC.A['rekrutmen.tahap'] = {
  roles: ['ADM', 'HRD'], tulis: true,
  fn: function (ctx, p) {
    var tahap = ['Lamaran Masuk', 'Seleksi Berkas', 'Interview', 'Tes', 'Diterima', 'Ditolak']; if (tahap.indexOf(p.tahap) === -1) CC.galat('VALIDATION', 'Tahap tidak valid.');
    if ((p.tahap === 'Diterima' || p.tahap === 'Ditolak') && !String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan diterima/ditolak wajib diisi agar evaluasi objektif.', { alasan: 'Wajib' });
    var patch = { tahap: p.tahap, diproses_oleh: ctx.user.nama }; if (p.alasan) patch.alasan_keputusan = p.alasan; if (p.skor !== undefined) patch.skor = p.skor;
    CC.ubah(ctx, CC.T.REKRUT, p.id, patch, { aksi: 'TAHAP_REKRUT', ket: p.tahap }); ctx.pesan = 'Tahap diperbarui: ' + p.tahap + '.'; return true;
  }
};
CC.A['rekrutmen.jadikanPerawat'] = {
  roles: ['ADM', 'HRD'], tulis: true,
  fn: function (ctx, p) {
    var r = CC.cari(CC.T.REKRUT, p.id); if (!r || r.tahap !== 'Diterima') CC.galat('VALIDATION', 'Hanya kandidat berstatus Diterima.');
    if (r.user_id_hasil) CC.galat('CONFLICT', 'Kandidat sudah diproses menjadi ' + r.user_id_hasil + '.');
    var hv = p.divisi === 'HV', mulai = p.tanggal_mulai || CC.u.tgl();
    var pr = CC.tambah(ctx, hv ? CC.T.PHV : CC.T.PHC, hv ? { nama: r.nama, jabatan: r.posisi, no_wa: r.kontak, email: r.email, status: 'Aktif', akhir_kontrak: CC.u.tambahBulan(mulai, 3) } : { nama: r.nama, jabatan: r.posisi, pendidikan: r.pendidikan, no_wa: r.kontak, email: r.email, domisili: r.domisili, status: 'Aktif', tanggal_mulai: mulai, akhir_kontrak: CC.u.tambahBulan(mulai, 3), masa_training_sampai: CC.u.tambahHari(mulai, 29), hasil_training: 'Training' });
    CC.ubah(ctx, CC.T.REKRUT, r.id, { user_id_hasil: pr.id }, { aksi: 'JADI_PERAWAT' });
    CC.tambah(ctx, CC.T.TURNOVER, { jenis: 'Perawat Masuk', divisi: hv ? 'HV' : 'HC', pihak_id: pr.id, pihak_nama: pr.nama, alasan_terstandar: 'Rekrutmen', alasan_detail: 'Dari pelamar ' + r.id, tanggal_efektif: mulai, dicatat_oleh: ctx.user.nama, bulan_rekap: mulai.slice(0, 7) });
    ctx.pesan = r.nama + ' kini tercatat sebagai ' + pr.id + '. Minta Admin membuatkan akun login.'; return pr;
  }
};

/* ===================== OPERASIONAL (US-29) ===================== */
CC.A['ops.harian'] = {
  roles: ['ADM', 'OPS'],
  fn: function (ctx) {
    var hari = CC.u.tgl(), kemarin = CC.u.tambahHari(hari, -1), absen = {}, phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN);
    CC.semua(CC.T.ABS_HC).forEach(function (a) { if (a.tanggal === hari) absen[a.penugasan_id] = a.status_kehadiran; });
    var belumAbsen = CC.semua(CC.T.TUGAS).filter(function (t) { return t.status === 'Berjalan' && CC.tugasAktifPada(t, hari) && !absen[t.id] && (phc[t.perawat_id] || {}).status === 'Aktif'; }).map(function (t) { var pr = phc[t.perawat_id] || {}; return { penugasan_id: t.id, perawat_id: t.perawat_id, nama: pr.nama, no_wa: pr.no_wa, pasien: (pas[t.pasien_id] || {}).nama_pasien, shift: t.shift, peran: t.peran }; });
    var rekap = CC.semua(CC.T.REKAP).filter(function (r) { return r.tanggal === hari; })[0] || null;
    var kep = CC.statistikKepatuhan(hari, hari), kasus = CC.daftarKasus(ctx);
    var adaPerawat = {}; CC.semua(CC.T.TUGAS).forEach(function (t) { if (t.status === 'Berjalan' && t.peran === 'Utama') adaPerawat[t.pasien_id] = 1; });
    var tanpa = CC.aktifSaja(CC.semua(CC.T.PASIEN)).filter(function (p) { return p.status === 'Aktif' && p.jenis_layanan === 'HC' && !adaPerawat[p.id]; });
    var angka = { pasien_aktif: CC.aktifSaja(CC.semua(CC.T.PASIEN)).filter(function (p) { return p.status === 'Aktif'; }).length, perawat_aktif: CC.aktifSaja(CC.semua(CC.T.PHC)).filter(function (p) { return p.status === 'Aktif'; }).length, laporan_masuk: kep.total.tepat + kep.total.telat, laporan_telat: kep.total.telat + kep.total.belum, belum_absen: belumAbsen.length, belum_lapor_kemarin: CC.laporanBelumMasuk(kemarin).length, pasien_tanpa_perawat: tanpa.length, kasus_belum_selesai: kasus.filter(function (k) { return k.status !== 'Selesai' && k.status !== 'Dibatalkan'; }).length, lead_belum_followup: CC.perluTindakan(ctx).filter(function (x) { return x.jenis === 'lead'; }).length };
    return { tanggal: hari, angka: angka, belum_absen: belumAbsen, belum_lapor_kemarin: CC.laporanBelumMasuk(kemarin), tanpa_perawat: tanpa.map(function (p) { return { id: p.id, nama: p.nama_pasien, wilayah: p.wilayah }; }), wilayah: CC.statistikKepatuhan(CC.u.tambahHari(hari, -6), hari).wilayah, siaga: CC.aktifSaja(CC.semua(CC.T.PHC)).filter(function (r) { return r.status === 'Aktif' && r.status_siaga === 'Standby'; }).map(function (r) { return { id: r.id, nama: r.nama, kompetensi: r.kompetensi, wilayah: r.wilayah }; }), rekap: rekap, perlu_tindakan: CC.perluTindakan(ctx), kasus_belum: kasus.filter(function (k) { return k.status !== 'Selesai' && k.status !== 'Dibatalkan'; }).slice(0, 10) };
  }
};
CC.A['ops.rekapSimpan'] = {
  roles: ['ADM', 'OPS'], tulis: true,
  fn: function (ctx, p) {
    var d = CC.A['ops.harian'].fn(ctx, {}), hari = CC.u.tgl(), row = Object.assign({ tanggal: hari, catatan_eksekutif: CC.u.bersih(p.catatan || ''), dibuat_oleh: ctx.user.nama }, d.angka);
    var ada = CC.semua(CC.T.REKAP).filter(function (r) { return r.tanggal === hari; })[0];
    var r = ada ? CC.ubah(ctx, CC.T.REKAP, ada.id, row) : CC.tambah(ctx, CC.T.REKAP, row);
    if (p.kirim) { CC.usersPeran(['ADM']).forEach(function (u) { CC.tambah(ctx, CC.T.NOTIF, { kanal: 'INAPP', tujuan: u.id, user_tujuan: u.id, nama_penerima: u.nama, subjek: 'Rekap Operasional ' + CC.u.tglPanjang(hari), pesan: 'Pasien aktif ' + row.pasien_aktif + ', laporan masuk ' + row.laporan_masuk + ', telat ' + row.laporan_telat + ', kasus belum selesai ' + row.kasus_belum_selesai + '. ' + row.catatan_eksekutif, event: 'REKAP_HARIAN', ref_id: r.id, status: 'Terkirim', dibaca: 'TIDAK', dikirim_pada: CC.u.dt() }, { tanpaLog: true }); }); }
    ctx.pesan = p.kirim ? 'Rekap harian tersimpan dan dikirim ke Direksi.' : 'Rekap harian tersimpan.'; return r;
  }
};
