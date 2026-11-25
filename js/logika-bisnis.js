/* =====================================================================
 * CAPTEN CARE — LOGIKA BISNIS (BERSAMA: Logika_Bisnis.gs)
 * Sales Order, invoice, pembayaran, perpanjangan, penggajian (Metode A/B),
 * kasbon, petty cash, keuangan, target, analitik penjualan, pengaturan,
 * akun, log, notifikasi/blast/CRM, impor data awal, modul opsional,
 * dan pekerjaan terjadwal.
 * ===================================================================== */
var CC = (typeof CC !== 'undefined' && CC) || {};
CC.A = CC.A || {}; CC.hookSimpan = CC.hookSimpan || {}; CC.hookList = CC.hookList || {}; CC.hookSetelah = CC.hookSetelah || {};
CC.BAWAAN = CC.BAWAAN || {};
CC.BAWAAN.penilaian = { butir: ['Ketepatan waktu & kehadiran', 'Keterampilan perawatan', 'Komunikasi dengan keluarga', 'Kebersihan & kerapian', 'Sikap & etika'], skala: 5, frekuensi: 'Bulanan', pengisi: 'CS' };
CC.BAWAAN.mess = { daftar: [{ nama: 'Mess Cilandak', alamat: 'Jl. Cilandak KKO No. 7, Jakarta Selatan', kapasitas: 10 }, { nama: 'Mess Kelapa Gading', alamat: 'Jl. Boulevard Raya Blok QJ, Jakarta Utara', kapasitas: 6 }] };
CC.kodeAcak = function (n) { var h = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', u = CC.env.uuid().replace(/-/g, ''); for (var i = 0; i < n; i++) s += h[parseInt(u.substr((i * 2) % 30, 2), 16) % h.length]; return s; };

/* ===================== SALES ORDER (US-43) ===================== */
CC.hitungItem = function (items) {
  var total = 0;
  (items || []).forEach(function (it) { it.jumlah = CC.u.angka(it.jumlah) || 1; it.harga_satuan = CC.u.angka(it.harga_satuan); it.subtotal = (it.jenis_item === 'Diskon' ? -1 : 1) * Math.abs(it.jumlah * it.harga_satuan); total += it.subtotal; });
  return total;
};
CC.saringSO = function (ctx, s) {
  var c = Object.assign({}, s); c.item = CC.u.json(s.item, []); c.riwayat_revisi = CC.u.json(s.riwayat_revisi, []);
  if (!CC.lihatNominal(ctx)) { ['harga', 'total', 'dp', 'sisa_pembayaran', 'hpp_pokok', 'hpp_tambahan_estimasi', 'margin'].forEach(function (k) { c[k] = ''; }); c.item = c.item.map(function (i) { return { jenis_item: i.jenis_item, uraian: i.uraian, jumlah: i.jumlah }; }); }
  else if (!CC.lihatMargin(ctx)) { c.hpp_pokok = ''; c.hpp_tambahan_estimasi = ''; c.margin = ''; }
  return c;
};
CC.A['so.list'] = {
  roles: ['ADM', 'CS', 'KEP', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var pas = CC.peta(CC.T.PASIEN), phc = CC.peta(CC.T.PHC), pk = CC.peta(CC.T.PAKET), inv = {}, users = CC.peta(CC.T.USER);
    CC.ringkasInvoice().forEach(function (i) { (inv[i.so_id] = inv[i.so_id] || []).push(i); });
    var rows = CC.aktifSaja(CC.semua(CC.T.SO)).filter(function (s) { return (!p.periode || s.periode_bulan === p.periode); }).map(function (s) {
      var c = CC.saringSO(ctx, s), iv = (inv[s.id] || []).filter(function (x) { return x.status !== 'Batal'; });
      c.nama_pasien = (pas[s.pasien_id] || {}).nama_pasien; c.wilayah = (pas[s.pasien_id] || {}).wilayah; c.nama_perawat = (phc[s.perawat_id] || {}).nama || ''; c.nama_paket = (pk[s.paket_id] || {}).nama_paket || ''; c.pic_nama = (users[s.pic_cs] || {}).nama || '';
      c.invoice = iv.map(function (x) { return { no: x.no_invoice, status: x.status, varian: x.varian, sisa: CC.lihatNominal(ctx) ? x.sisa : '', terlambat: x.terlambat, jatuh_tempo: x.jatuh_tempo }; });
      c.status_bayar = !iv.length ? 'Belum Ditagih' : iv.every(function (x) { return x.status === 'Lunas'; }) ? 'Lunas' : iv.some(function (x) { return x.terlambat; }) ? 'Jatuh Tempo' : iv.some(function (x) { return x.status === 'Dibayar Sebagian'; }) ? 'Dibayar Sebagian' : 'Menunggu Pembayaran';
      return c;
    }).sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : (a.id < b.id ? 1 : -1); });
    return { rows: rows, boleh: { tambah: CC.boleh(ctx.user, ['ADM', 'CS']), nominal: CC.lihatNominal(ctx), margin: CC.lihatMargin(ctx), bayar: CC.boleh(ctx.user, ['KEU']) } };
  }
};
CC.estimasiHpp = function (paketId, kontrakHari, tanggal, gajiDeal) { var g = gajiDeal || CC.gajiPaket(paketId, tanggal).gaji; return g ? Math.round(CC.u.angka(g) / 30 * Number(kontrakHari || 30)) : 0; };
CC.A['so.simpan'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {}; CC.wajib(d, ['pasien_id:Pasien', 'paket_id:Paket', 'kontrak_hari:Lama kontrak', 'status_klien:Status klien']);
    var paket = CC.cari(CC.T.PAKET, d.paket_id); if (!paket) CC.galat('VALIDATION', 'Paket tidak dikenal.', { paket_id: 'Pilih paket' });
    if (paket.aktif !== 'YA' && !d.id) CC.galat('VALIDATION', 'Paket ' + paket.nama_paket + ' sedang nonaktif.', { paket_id: 'Paket nonaktif' });
    var items = (d.item || d.items || []).filter(function (i) { return i.jenis_item; });
    if (!items.length) CC.galat('VALIDATION', 'Minimal satu baris layanan.', { item: 'Tambah baris' });
    var jenis = CC.set('master').jenis_item_invoice; items.forEach(function (i) { if (jenis.indexOf(i.jenis_item) === -1) CC.galat('VALIDATION', 'Jenis item "' + i.jenis_item + '" tidak ada di Master Daftar.'); });
    var total = CC.hitungItem(items), tanggal = d.tanggal || CC.u.tgl(), jasa = items.filter(function (i) { return i.jenis_item === 'Jasa Layanan'; })[0];
    var bawaan = paket.satuan_harga === 'hari' ? CC.u.angka(paket.harga_bawaan) * Number(d.kontrak_hari) : Math.round(CC.u.angka(paket.harga_bawaan) / 30 * Number(d.kontrak_hari));
    if (jasa && bawaan && Math.abs(jasa.subtotal - bawaan) > 1 && !String(d.alasan_harga || '').trim()) CC.galat('VALIDATION', 'Harga berbeda dari harga bawaan paket (' + CC.u.rupiah(bawaan) + '). Isi alasan perubahan harga.', { alasan_harga: 'Wajib karena harga diubah' });
    var hpp = CC.estimasiHpp(d.paket_id, d.kontrak_hari, tanggal, d.gaji_deal);
    var row = { tanggal: tanggal, periode_bulan: tanggal.slice(0, 7), pasien_id: d.pasien_id, perawat_id: d.perawat_id || '', kontrak_hari: d.kontrak_hari, kontrak_label: d.kontrak_label || (d.kontrak_hari + ' Hari'), paket_id: d.paket_id, status_klien: d.status_klien, no_po: d.no_po || '', item: JSON.stringify(items), harga: jasa ? jasa.harga_satuan : '', total: total, dp: CC.u.angka(d.dp), sisa_pembayaran: total, hpp_pokok: hpp, hpp_tambahan_estimasi: CC.u.angka(d.hpp_tambahan_estimasi), margin: total - hpp - CC.u.angka(d.hpp_tambahan_estimasi), hpp_status: 'Estimasi', pic_cs: d.pic_cs || ctx.user.id, sumber: 'Aplikasi', status: d.status || 'Aktif' };
    var r;
    if (d.id) {
      var lama = CC.cari(CC.T.SO, d.id); var punyaInv = CC.ringkasInvoice().some(function (i) { return i.so_id === lama.id && i.status !== 'Batal'; });
      if (punyaInv && !String(d.alasan_revisi || '').trim()) CC.galat('VALIDATION', 'Sales Order sudah memiliki invoice terbit. Isi alasan revisi.', { alasan_revisi: 'Wajib' });
      var riw = CC.u.json(lama.riwayat_revisi, []); riw.push({ waktu: CC.u.dt(), oleh: ctx.user.nama, alasan: d.alasan_revisi || d.alasan_harga || '', total_lama: lama.total, total_baru: total });
      row.riwayat_revisi = JSON.stringify(riw); row.periode_bulan = lama.periode_bulan; row.no_urut = lama.no_urut; delete row.sumber; delete row.pic_cs;
      r = CC.ubah(ctx, CC.T.SO, lama.id, row, { aksi: 'REVISI_SO', ket: d.alasan_revisi || '' });
    } else {
      row.no_urut = CC.semua(CC.T.SO).filter(function (s) { return s.periode_bulan === row.periode_bulan; }).length + 1;
      r = CC.tambah(ctx, CC.T.SO, row, { ket: d.alasan_harga ? 'Harga diubah: ' + d.alasan_harga : '' });
      if (d.lead_id) CC.ubah(ctx, CC.T.LEAD, d.lead_id, { so_id: r.id, status_pipeline: 'Deal', nilai_deal: total, pasien_id: d.pasien_id, followup_terakhir: CC.u.dt() }, { aksi: 'LEAD_KE_SO' });
      CC.ubah(ctx, CC.T.PASIEN, d.pasien_id, { status: 'Aktif', paket_id: d.paket_id, status_klien: d.status_klien }, { tanpaLog: true });
    }
    ctx.pesan = 'Sales Order ' + r.id + ' tersimpan (total ' + CC.u.rupiah(total) + ').'; return CC.saringSO(ctx, r);
  }
};
CC.A['so.batal'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) { if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Pembatalan wajib beralasan.', { alasan: 'Wajib' }); var aktif = CC.ringkasInvoice().filter(function (i) { return i.so_id === p.id && i.status !== 'Batal'; }); if (aktif.length) CC.galat('CONFLICT', 'Batalkan dulu invoice ' + aktif.map(function (i) { return i.no_invoice; }).join(', ') + '.'); CC.ubah(ctx, CC.T.SO, p.id, { status: 'Batal', alasan_batal: p.alasan }, { aksi: 'BATAL_SO', ket: p.alasan }); ctx.pesan = 'Sales Order dibatalkan.'; return true; }
};
CC.A['so.cekAdmin'] = {
  roles: ['ADM', 'CS'],
  fn: function (ctx, p) {
    var g = CC.setRiwayat('gaji').length ? CC.set('gaji') : null; if (!g) return { tawarkan: false, alasan: 'Pengaturan Gaji/biaya administrasi belum disimpan.' };
    var batas = CC.u.tambahBulan(CC.u.tgl(), -Number(g.masa_admin_bulan || 3)), soPasien = {}; CC.semua(CC.T.SO).forEach(function (s) { if (s.pasien_id === p.pasien_id) soPasien[s.id] = 1; });
    var sudah = CC.semua(CC.T.INV).some(function (i) { return soPasien[i.so_id] && i.jenis_item === 'Administrasi' && i.status_invoice !== 'Batal' && i.tanggal_terbit >= batas; });
    return { tawarkan: !sudah, nominal: g.biaya_admin, masa_bulan: g.masa_admin_bulan };
  }
};

/* ===================== INVOICE (US-44) & PEMBAYARAN (US-45) ===================== */
CC.statusInvoice = function (no) {
  var i = CC.ringkasInvoice().filter(function (x) { return x.no_invoice === no; })[0]; if (!i || i.status === 'Batal') return;
  var st = i.sisa <= 0 ? 'Lunas' : i.terbayar > 0 ? 'Dibayar Sebagian' : 'Terbit';
  if (st !== i.status) CC.ubahBanyak(null, CC.T.INV, i.items.map(function (it) { return { id: it.id, status_invoice: st }; }));
  var so = CC.cari(CC.T.SO, i.so_id); if (so) { var semua = CC.ringkasInvoice().filter(function (x) { return x.so_id === so.id && x.status !== 'Batal'; }); var terbayar = semua.reduce(function (a, x) { return a + x.terbayar; }, 0); CC.ubah(null, CC.T.SO, so.id, { sisa_pembayaran: Math.max(0, CC.u.angka(so.total) - terbayar) }, { tanpaLog: true }); }
  return st;
};
CC.terbitkanInvoice = function (ctx, so, varian, opsi) {
  opsi = opsi || {};
  var tanggal = opsi.tanggal || CC.u.tgl(), op = CC.set('operasional'), items = opsi.item || CC.u.json(so.item, []);
  if (varian === 'Infal') { items = (opsi.item || []).filter(function (i) { return i.jenis_item; }); if (!items.length) CC.galat('VALIDATION', 'Isi baris Jasa Layanan Infal beserta tarifnya.', { item: 'Wajib' }); }
  CC.hitungItem(items);
  var no = CC.nomorBaru(ctx, 'INV', tanggal), kode = CC.kodeAcak(12), tempo = opsi.jatuh_tempo || CC.u.tambahHari(tanggal, op.jatuh_tempo_invoice_hari || 7);
  var total = items.reduce(function (a, i) { return a + i.subtotal; }, 0);
  CC.tambahBanyak(ctx, CC.T.INV, items.map(function (i) { return { no_invoice: no, varian: varian || 'Biasa', tanggal_terbit: tanggal, jatuh_tempo: tempo, so_id: so.id, pasien_id: so.pasien_id, jenis_item: i.jenis_item, uraian: CC.u.bersih(i.uraian || ''), jumlah: i.jumlah, harga_satuan: i.harga_satuan, subtotal: i.subtotal, total_invoice: total, status_invoice: 'Terbit', kode_verifikasi: kode, pengganti_dari: opsi.pengganti_dari || '' }; }));
  CC.ubah(ctx, CC.T.SO, so.id, { no_invoice: [so.no_invoice, no].filter(Boolean).join(', ') }, { tanpaLog: true });
  var prof = CC.set('profil');
  CC.tambah(ctx, CC.T.DOK, { jenis_dokumen: 'INVOICE', nomor: no, ref_tab: CC.T.INV, ref_id: no, judul: 'Invoice ' + (varian || 'Biasa') + ' ' + no, data_isian: JSON.stringify({ total: total, pasien_id: so.pasien_id, so_id: so.id }), status: 'TERBIT', penandatangan: JSON.stringify([{ slot: 1, nama: prof.penandatangan.INV.nama, jabatan: prof.penandatangan.INV.jabatan, waktu: CC.u.dt(), metode: 'TERBIT' }]), kode_verifikasi: kode, hash_dokumen: CC.env.hashTeks ? CC.env.hashTeks(no + '|' + total + '|' + kode) : '', terbit_pada: CC.u.dt() }, { tanpaLog: true });
  CC.log(ctx, 'TERBIT_INVOICE', CC.T.INV, no, null, { total: total, varian: varian }, so.id);
  return no;
};
CC.A['invoice.terbitkan'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var so = CC.cari(CC.T.SO, p.so_id); if (!so || so.status === 'Batal') CC.galat('VALIDATION', 'Sales Order tidak valid.');
    if (so.status === 'Draf Perpanjangan') CC.galat('VALIDATION', 'Setujui dulu draf perpanjangan ini.');
    if ((p.varian || 'Biasa') !== 'Infal' && CC.ringkasInvoice().some(function (i) { return i.so_id === so.id && i.status !== 'Batal' && i.varian !== 'Infal'; }) && !p.pengganti_dari) CC.galat('CONFLICT', 'Sales Order ini sudah memiliki invoice aktif. Batalkan dulu bila ingin menerbitkan pengganti.');
    var no = CC.terbitkanInvoice(ctx, so, p.varian || 'Biasa', p);
    ctx.pesan = 'Invoice ' + no + ' terbit.'; return { no_invoice: no };
  }
};
CC.A['invoice.list'] = {
  roles: ['ADM', 'CS', 'OPS', 'KEU'],
  fn: function (ctx, p) { return CC.ringkasInvoice().filter(function (i) { return (!p.status || i.status === p.status) && (!p.periode || i.tanggal_terbit.slice(0, 7) === p.periode); }); }
};
CC.A['invoice.detail'] = {
  roles: ['ADM', 'CS', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var i = CC.ringkasInvoice().filter(function (x) { return x.no_invoice === p.no; })[0]; if (!i) CC.galat('NOT_FOUND', 'Invoice tidak ditemukan.');
    var so = CC.cari(CC.T.SO, i.so_id) || {}, ps = CC.cari(CC.T.PASIEN, i.pasien_id) || {}, prof = CC.set('profil');
    i.so = { id: so.id, dp: so.dp, kontrak_label: so.kontrak_label, nama_paket: (CC.cari(CC.T.PAKET, so.paket_id) || {}).nama_paket, nama_perawat: CC.namaPerawat(so.perawat_id), no_po: so.no_po };
    i.bill_to = { nama: ps.nama_pj, alamat: ps.alamat_pj || ps.alamat, telepon: ps.no_wa_pj, email: ps.email_pj, pasien: ps.nama_pasien, pasien_id: ps.id };
    i.pembayaran = CC.semua(CC.T.BAYAR).filter(function (b) { return b.no_invoice === i.no_invoice; });
    i.profil = { nama_perusahaan: prof.nama_perusahaan, brand: prof.brand, alamat: prof.alamat, telepon: prof.telepon, email: prof.email, izin: prof.izin, rekening: prof.rekening, penandatangan: prof.penandatangan.INV, kota: prof.kota };
    i.terbilang = CC.u.terbilang(i.total) + ' rupiah';
    return i;
  }
};
CC.A['invoice.batal'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan pembatalan wajib.', { alasan: 'Wajib' });
    var i = CC.ringkasInvoice().filter(function (x) { return x.no_invoice === p.no; })[0]; if (!i) CC.galat('NOT_FOUND', 'Invoice tidak ditemukan.');
    if (i.terbayar > 0) CC.galat('CONFLICT', 'Invoice sudah menerima pembayaran ' + CC.u.rupiah(i.terbayar) + '. Minta Keuangan melakukan pembalikan pembayaran terlebih dahulu.');
    CC.ubahBanyak(ctx, CC.T.INV, i.items.map(function (it) { return { id: it.id, status_invoice: 'Batal', alasan_batal: p.alasan }; }));
    CC.semua(CC.T.DOK).filter(function (d) { return d.nomor === i.no_invoice; }).forEach(function (d) { CC.ubah(ctx, CC.T.DOK, d.id, { status: 'DITARIK', ditarik_alasan: p.alasan }, { tanpaLog: true }); });
    CC.log(ctx, 'BATAL_INVOICE', CC.T.INV, i.no_invoice, null, null, p.alasan);
    ctx.pesan = 'Invoice ' + i.no_invoice + ' dibatalkan (nomor tetap tercatat sebagai Batal).'; return true;
  }
};
CC.A['invoice.kirim'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var i = CC.A['invoice.detail'].fn(ctx, { no: p.no }), r = i.profil.rekening[0] || {};
    var link = (CC.set('branding').app_url || '') + '#/v/' + i.kode_verifikasi;
    var vars = { no: i.no_invoice, total: CC.u.rupiah(i.total), tempo: CC.u.tglPanjang(i.jatuh_tempo), rekening: r.bank + ' ' + r.nomor + ' a.n. ' + r.atas_nama, link: link };
    var n = CC.notif(ctx, 'INVOICE_KIRIM', [{ nama: i.bill_to.nama, wa: p.kanal === 'EMAIL' ? '' : i.bill_to.telepon, email: p.kanal === 'WA' ? '' : i.bill_to.email }], vars, i.no_invoice);
    var teks = CC.u.isi(CC.matriksNotif().INVOICE_KIRIM.pesan, Object.assign({ nama: i.bill_to.nama }, vars));
    ctx.pesan = n ? 'Invoice masuk antrean pengiriman.' : 'Kanal otomatis nonaktif — gunakan tautan WhatsApp manual.';
    return { antre: n, wa_link: 'https://wa.me/' + CC.u.hp62(i.bill_to.telepon) + '?text=' + encodeURIComponent(teks) };
  }
};
CC.A['bayar.catat'] = {
  roles: ['KEU'], tulis: true,
  fn: function (ctx, p) {
    var d = p.data || {}; CC.wajib(d, ['no_invoice:Invoice', 'tanggal_bayar:Tanggal', 'jenis:Jenis', 'nominal:Nominal', 'metode:Metode']);
    var i = CC.ringkasInvoice().filter(function (x) { return x.no_invoice === d.no_invoice; })[0]; if (!i || i.status === 'Batal') CC.galat('VALIDATION', 'Invoice tidak valid.');
    var nom = CC.u.angka(d.nominal); if (nom <= 0) CC.galat('VALIDATION', 'Nominal harus lebih dari 0.', { nominal: '> 0' });
    if (nom > i.sisa && !p.konfirmasi) CC.galat('CONFLICT', 'Nominal ' + CC.u.rupiah(nom) + ' melebihi sisa tagihan ' + CC.u.rupiah(i.sisa) + '. Konfirmasi bila memang lebih bayar.');
    var bukti = d.bukti && CC.env.simpanBerkas && /^data:/.test(d.bukti) ? CC.env.simpanBerkas(d.bukti, 'bukti_bayar_' + i.no_invoice.replace(/\//g, '-'), 'Bukti_Pembayaran').url : (d.bukti || '');
    var j = CC.tambah(ctx, CC.T.JURNAL, { tanggal: d.tanggal_bayar, tipe: 'Masuk', kategori: 'Pembayaran Invoice', akun: d.metode, nominal: nom, pasien_id: i.pasien_id, sumber: 'Invoice', referensi: i.no_invoice, bukti_url: bukti, status_pengajuan: 'Tercatat', diajukan_oleh: ctx.user.nama, keterangan: d.jenis + ' ' + i.no_invoice });
    var b = CC.tambah(ctx, CC.T.BAYAR, { no_invoice: i.no_invoice, tanggal_bayar: d.tanggal_bayar, jenis: d.jenis, nominal: nom, metode: d.metode, bukti_url: bukti, jurnal_id: j.id, dicatat_oleh: ctx.user.nama, alasan: d.catatan || '' });
    var st = CC.statusInvoice(i.no_invoice);
    CC.notif(ctx, 'PEMBAYARAN_DICATAT', CC.penerimaUser(CC.usersPeran(['CS'])), { nominal: CC.u.rupiah(nom), no: i.no_invoice, status: st }, i.no_invoice);
    ctx.pesan = 'Pembayaran dicatat. Invoice ' + i.no_invoice + ' → ' + st + '. Jurnal ' + j.id + ' terisi otomatis.'; return { bayar: b, status: st };
  }
};
CC.A['bayar.balik'] = {
  roles: ['KEU'], tulis: true,
  fn: function (ctx, p) {
    if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Pembalikan wajib beralasan.', { alasan: 'Wajib' });
    var b = CC.cari(CC.T.BAYAR, p.id); if (!b) CC.galat('NOT_FOUND', 'Pembayaran tidak ditemukan.');
    if (CC.semua(CC.T.BAYAR).some(function (x) { return x.pembalikan_dari === b.id; })) CC.galat('CONFLICT', 'Pembayaran ini sudah dibalik.');
    var j = CC.tambah(ctx, CC.T.JURNAL, { tanggal: CC.u.tgl(), tipe: 'Masuk', kategori: 'Pembayaran Invoice', akun: b.metode, nominal: -CC.u.angka(b.nominal), sumber: 'Invoice', referensi: b.no_invoice, status_pengajuan: 'Tercatat', diajukan_oleh: ctx.user.nama, keterangan: 'Pembalikan ' + b.id + ': ' + p.alasan });
    CC.tambah(ctx, CC.T.BAYAR, { no_invoice: b.no_invoice, tanggal_bayar: CC.u.tgl(), jenis: 'Pembalikan', nominal: -CC.u.angka(b.nominal), metode: b.metode, jurnal_id: j.id, dicatat_oleh: ctx.user.nama, pembalikan_dari: b.id, alasan: p.alasan });
    var st = CC.statusInvoice(b.no_invoice); ctx.pesan = 'Pembayaran dibalik. Invoice kini ' + st + '.'; return true;
  }
};

/* ===================== PERPANJANGAN KONTRAK (US-41) ===================== */
CC.siapkanPerpanjangan = function (ctx) {
  var hari = CC.u.tgl(), op = CC.set('operasional'), dibuat = 0, sos = CC.semua(CC.T.SO);
  CC.semua(CC.T.TUGAS).forEach(function (t) {
    if (t.status !== 'Berjalan' || t.peran !== 'Utama' || t.tanggal_akhir < hari || CC.u.selisihHari(hari, t.tanggal_akhir) > op.perpanjangan_hari) return;
    if (sos.some(function (s) { return s.penugasan_id === t.id && s.status === 'Draf Perpanjangan'; })) return;
    var lama = sos.filter(function (s) { return s.pasien_id === t.pasien_id && s.status !== 'Batal' && s.status !== 'Draf Perpanjangan'; }).sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : -1; })[0];
    var items = lama ? CC.u.json(lama.item, []).filter(function (i) { return i.jenis_item !== 'Administrasi'; }) : [];
    var mulai = CC.u.tambahHari(t.tanggal_akhir, 1), hpp = CC.estimasiHpp(t.paket_id, t.lama_hari, mulai, t.gaji_deal), total = CC.hitungItem(items);
    var r = CC.tambah(ctx, CC.T.SO, { tanggal: mulai, periode_bulan: mulai.slice(0, 7), no_urut: '', pasien_id: t.pasien_id, perawat_id: t.perawat_id, kontrak_hari: lama ? lama.kontrak_hari : t.lama_hari, kontrak_label: lama ? lama.kontrak_label : t.lama_hari + ' Hari', paket_id: t.paket_id, status_klien: 'Existing', item: JSON.stringify(items), harga: lama ? lama.harga : '', total: total, dp: 0, sisa_pembayaran: total, hpp_pokok: hpp, margin: total - hpp, hpp_status: 'Estimasi', status: 'Draf Perpanjangan', pic_cs: lama ? lama.pic_cs : '', penugasan_id: t.id, sumber: 'Sistem' }, { tanpaLog: true });
    dibuat++;
    var ps = CC.cari(CC.T.PASIEN, t.pasien_id) || {};
    CC.notif(ctx, 'PERPANJANGAN', CC.penerimaUser(CC.usersPeran(['CS', 'KEP'])), { kode: t.id, pasien: ps.nama_pasien, tanggal: CC.u.tglPanjang(t.tanggal_akhir), so: r.id }, r.id);
  });
  return dibuat;
};
CC.A['perpanjangan.list'] = {
  roles: ['ADM', 'CS', 'KEP', 'OPS'],
  fn: function (ctx) {
    var pas = CC.peta(CC.T.PASIEN), phc = CC.peta(CC.T.PHC), pk = CC.peta(CC.T.PAKET);
    return CC.semua(CC.T.SO).filter(function (s) { return s.status === 'Draf Perpanjangan'; }).map(function (s) { var c = CC.saringSO(ctx, s), t = CC.cari(CC.T.TUGAS, s.penugasan_id) || {}; c.nama_pasien = (pas[s.pasien_id] || {}).nama_pasien; c.nama_perawat = (phc[s.perawat_id] || {}).nama; c.nama_paket = (pk[s.paket_id] || {}).nama_paket; c.akhir_penugasan = t.tanggal_akhir; c.sisa_hari = CC.u.selisihHari(CC.u.tgl(), t.tanggal_akhir); return c; });
  }
};
CC.A['perpanjangan.siapkan'] = { roles: ['ADM', 'CS', 'KEP'], tulis: true, fn: function (ctx) { var n = CC.siapkanPerpanjangan(ctx); ctx.pesan = n ? n + ' draf perpanjangan baru disiapkan.' : 'Tidak ada penugasan baru yang perlu diperpanjang.'; return n; } };
CC.A['perpanjangan.setujui'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var so = CC.cari(CC.T.SO, p.so_id); if (!so || so.status !== 'Draf Perpanjangan') CC.galat('VALIDATION', 'Draf tidak ditemukan.');
    var items = p.item ? p.item : CC.u.json(so.item, []); if (!items.length) CC.galat('VALIDATION', 'Isi baris layanan sebelum menyetujui.', { item: 'Wajib' });
    var total = CC.hitungItem(items), hpp = CC.u.angka(so.hpp_pokok);
    CC.ubah(ctx, CC.T.SO, so.id, { status: 'Aktif', item: JSON.stringify(items), total: total, sisa_pembayaran: total, margin: total - hpp, no_urut: CC.semua(CC.T.SO).filter(function (s) { return s.periode_bulan === so.periode_bulan && s.status !== 'Draf Perpanjangan'; }).length + 1, pic_cs: so.pic_cs || ctx.user.id }, { aksi: 'SETUJUI_PERPANJANGAN' });
    var no = CC.terbitkanInvoice(ctx, CC.cari(CC.T.SO, so.id), 'Biasa', { tanggal: CC.u.tgl() });
    var t = CC.cari(CC.T.TUGAS, so.penugasan_id), baru = null;
    if (t) { CC.ubah(ctx, CC.T.TUGAS, t.id, { status: 'Diperpanjang' }, { aksi: 'DIPERPANJANG' }); baru = CC.buatPenugasan(ctx, { pasien_id: t.pasien_id, perawat_id: so.perawat_id || t.perawat_id, peran: 'Utama', paket_id: so.paket_id, so_id: so.id, tanggal_mulai: CC.u.tambahHari(t.tanggal_akhir, 1), lama_hari: so.kontrak_hari, shift: t.shift, penugasan_asal: t.id, gaji_deal: t.gaji_deal, metode_gaji: t.metode_gaji }); CC.ubah(ctx, CC.T.SO, so.id, { penugasan_id: baru.id }, { tanpaLog: true }); }
    ctx.pesan = 'Perpanjangan disetujui: invoice ' + no + ' terbit' + (baru ? ', penugasan ' + baru.id + ' berlanjut tanpa jeda.' : '.'); return { no_invoice: no, penugasan: baru ? baru.id : '' };
  }
};
CC.A['perpanjangan.tolak'] = { roles: ['ADM', 'CS'], tulis: true, fn: function (ctx, p) { if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan penolakan wajib.', { alasan: 'Wajib' }); CC.ubah(ctx, CC.T.SO, p.so_id, { status: 'Batal', alasan_batal: 'Perpanjangan ditolak: ' + p.alasan }, { aksi: 'TOLAK_PERPANJANGAN' }); ctx.pesan = 'Draf ditolak. Catat putus kontrak klien di menu Turnover.'; return true; } };

/* ===================== PENGGAJIAN (US-49..52) ===================== */
CC.gajiSetting = function (tgl) { return CC.setRiwayat('gaji').length ? CC.set('gaji', tgl) : null; };
CC.rentangGaji = function (t, periode, g) {
  var akhirT = t.tanggal_akhir_aktual || t.tanggal_akhir, out = [];
  if (!g || g.periode_gaji === 'kalender') {
    var a = periode + '-01', b = periode + '-' + CC.u.pad(CC.u.hariDalamBulan(periode), 2);
    var s = t.tanggal_mulai > a ? t.tanggal_mulai : a, e = akhirT < b ? akhirT : b; if (s <= e) out.push({ mulai: s, akhir: e, penuh: s === a && e === b });
    return out;
  }
  for (var k = 0; k < 24; k++) {
    var cs = CC.u.tambahBulan(t.tanggal_mulai, k); if (cs > akhirT) break;
    var ce = CC.u.tambahHari(CC.u.tambahBulan(t.tanggal_mulai, k + 1), -1), ef = ce < akhirT ? ce : akhirT;
    if (ef.slice(0, 7) === periode) out.push({ mulai: cs, akhir: ef, penuh: ef === ce });
  }
  return out;
};
CC.hitungSatu = function (t, rng, g, potongan) {
  var r = { penugasan_id: t.id, perawat_id: t.perawat_id, periode_mulai: rng.mulai, periode_akhir: rng.akhir, gaji_deal: CC.u.angka(t.gaji_deal), metode: t.metode_gaji || 'A', catatan: [] };
  if (!g) { r.catatan.push('Lengkapi pengaturan'); r.total = 0; return r; }
  if (!r.gaji_deal) r.catatan.push('Gaji deal kosong');
  var hari = CC.u.selisihHari(rng.mulai, rng.akhir) + 1, abs = {}, adaAbs = false;
  CC.semua(CC.T.ABS_HC).forEach(function (a) { if (a.penugasan_id === t.id && a.tanggal >= rng.mulai && a.tanggal <= rng.akhir) { abs[a.tanggal] = a.status_kehadiran; adaAbs = true; } });
  var lib = CC.semua(CC.T.LIBUR).filter(function (l) { return l.penugasan_id === t.id && l.status !== 'Dibatalkan' && l.tanggal >= rng.mulai && l.tanggal <= rng.akhir; });
  var libur = lib.filter(function (l) { return ['Libur jatah', 'Cuti', 'Izin', 'Sakit'].indexOf(l.jenis) > -1; }), lembur = lib.filter(function (l) { return l.jenis === 'Lembur'; });
  r.hari_libur = libur.reduce(function (a, l) { return a + Number(l.jumlah || 1); }, 0); r.tanggal_libur = libur.map(function (l) { return l.tanggal.slice(8); }).join(', ');
  if (adaAbs) r.hari_kerja = Object.keys(abs).filter(function (k) { return abs[k] === 'Bertugas'; }).length + lembur.length;
  else { r.hari_kerja = hari - r.hari_libur; r.catatan.push('Absensi belum diisi — dihitung dari catatan libur'); }
  if (!rng.penuh && r.metode === 'A') { r.metode = 'B'; r.catatan.push('Periode tidak penuh → prorata (Metode B)'); }
  r.fee_harian = Math.round(t.tugas_pendek === 'YA' ? CC.u.angka(g.tarif_harian_pendek) : r.gaji_deal / (Number(g.pembagi) || 30));
  if (r.metode === 'A') { var dipotong = g.potongan_berlaku === 'semua' ? r.hari_libur : Math.max(0, r.hari_libur - Number(t.jatah_libur || g.jatah_libur)); r.potongan_libur = dipotong * CC.u.angka(g.potongan_libur); r.dasar = r.gaji_deal; }
  else { r.potongan_libur = 0; r.dasar = r.hari_kerja * r.fee_harian; }
  r.lembur = lembur.length * CC.u.angka(g.upah_lembur); if (lembur.length && !g.upah_lembur) r.catatan.push(lembur.length + ' hari lembur: upah lembur belum diatur');
  r.pinjaman = potongan.pinjaman || 0; r.seragam = potongan.seragam || 0; r.potongan_lain = potongan.lain || 0;
  r.total = Math.round(r.dasar - r.potongan_libur + r.lembur - r.pinjaman - r.seragam - r.potongan_lain);
  return r;
};
CC.potonganPerawat = function (perawatId) {
  var out = { pinjaman: 0, seragam: 0, lain: 0, rincian: [] };
  CC.semua(CC.T.KASBON).forEach(function (k) {
    if (k.perawat_id !== perawatId || k.status !== 'Disetujui' || CC.u.angka(k.sisa) <= 0) return;
    var n = k.cara_potong === 'Cicilan' ? Math.min(CC.u.angka(k.sisa), CC.u.angka(k.nominal_per_periode)) : CC.u.angka(k.sisa);
    if (k.jenis === 'Kasbon') out.pinjaman += n; else if (k.jenis === 'Seragam') out.seragam += n; else out.lain += n;
    out.rincian.push({ ksb_id: k.id, jenis: k.jenis, potong: n });
  });
  return out;
};
CC.A['gaji.lihat'] = {
  roles: ['ADM', 'KEP', 'OPS', 'KEU'],
  fn: function (ctx, p) {
    var per = p.periode || CC.u.bulan(), phc = CC.peta(CC.T.PHC);
    var rows = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (r) { return r.periode_kode === per; }).map(function (r) {
      var c = Object.assign({}, r), pr = phc[r.perawat_id] || {}; c.nama_perawat = pr.nama; c.bank = pr.bank_ewallet; c.no_rekening = ['ADM', 'KEU'].indexOf(ctx.peran) > -1 ? pr.no_rekening : CC.u.samarkan(pr.no_rekening); c.nama_pemilik_rekening = pr.nama_pemilik_rekening; c.rekening_lengkap = !!(pr.no_rekening && pr.bank_ewallet);
      if (ctx.peran === 'OPS') { ['gaji_deal', 'fee_harian', 'pinjaman', 'seragam', 'koreksi'].forEach(function (k) { c[k] = ''; }); }
      return c;
    });
    var aj = rows.length ? CC.cari(CC.T.JURNAL, rows[0].pengajuan_id) : null;
    var tot = rows.reduce(function (a, r) { return a + Math.max(0, CC.u.angka(r.total)); }, 0);
    return { periode: per, rows: rows, total: tot, status: rows.length ? rows[0].status_hitung : 'Belum dihitung', pengajuan: aj ? { id: aj.id, status: aj.status_pengajuan, nominal: aj.nominal, bukti_url: aj.bukti_url, alasan_tolak: aj.alasan_tolak, diajukan_oleh: aj.diajukan_oleh, diverifikasi_oleh: aj.diverifikasi_oleh } : null, pengaturan_ok: !!CC.gajiSetting(per + '-01'), peringatan: { rekening: rows.filter(function (r) { return !r.rekening_lengkap; }).length, negatif: rows.filter(function (r) { return CC.u.angka(r.total) < 0; }).length, lengkapi: rows.filter(function (r) { return /Lengkapi|kosong|belum diatur/.test(r.catatan); }).length }, boleh: { hitung: CC.boleh(ctx.user, ['ADM', 'KEP', 'KEU']), koreksi: CC.boleh(ctx.user, ['KEU']), ajukan: CC.boleh(ctx.user, ['KEP', 'ADM']), setujui: CC.boleh(ctx.user, ['KEU']) } };
  }
};
CC.A['gaji.hitung'] = {
  roles: ['ADM', 'KEP', 'KEU'], tulis: true,
  fn: function (ctx, p) {
    var per = p.periode || CC.u.bulan(), lama = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (r) { return r.periode_kode === per; });
    if (lama.some(function (r) { return r.status_hitung !== 'Draf'; })) CC.galat('CONFLICT', 'Periode ' + per + ' sudah diajukan/disetujui sehingga terkunci. Hasil hitung tidak diubah.');
    var g = CC.gajiSetting(per + '-01'), phc = CC.peta(CC.T.PHC), pas = CC.peta(CC.T.PASIEN), pk = CC.peta(CC.T.PAKET), pot = {}, hasil = [];
    CC.semua(CC.T.TUGAS).forEach(function (t) {
      if (t.status === 'Dibatalkan' || t.status_arsip === 'Arsip') return;
      CC.rentangGaji(t, per, g).forEach(function (rng) {
        if (!pot[t.perawat_id]) pot[t.perawat_id] = CC.potonganPerawat(t.perawat_id); var pp = pot[t.perawat_id];
        var r = CC.hitungSatu(t, rng, g, pp.dipakai ? {} : pp); pp.dipakai = true;
        var pr = phc[t.perawat_id] || {}; r.jabatan = pr.jabatan; r.nama_klien = (pas[t.pasien_id] || {}).nama_pasien; r.paket = (pk[t.paket_id] || {}).nama_paket + (t.peran === 'Infal' ? ' (Infal)' : '');
        if (!pr.no_rekening) r.catatan.push('Rekening belum lengkap');
        hasil.push(r);
      });
    });
    var idx = {}; lama.forEach(function (r) { idx[r.penugasan_id + '|' + r.periode_mulai] = r; });
    var baru = [], ubah = [], dipakai = {};
    hasil.forEach(function (r) {
      var k = r.penugasan_id + '|' + r.periode_mulai, ada = idx[k]; dipakai[k] = 1;
      var koreksi = ada ? CC.u.angka(ada.koreksi) : 0, total = r.total + koreksi;
      var row = { periode_kode: per, periode_mulai: r.periode_mulai, periode_akhir: r.periode_akhir, penugasan_id: r.penugasan_id, perawat_id: r.perawat_id, jabatan: r.jabatan, nama_klien: r.nama_klien, paket: r.paket, gaji_deal: r.gaji_deal, metode: r.metode, hari_kerja: r.hari_kerja || 0, hari_libur: r.hari_libur || 0, tanggal_libur: r.tanggal_libur || '', fee_harian: r.fee_harian || 0, potongan_libur: r.potongan_libur || 0, lembur: r.lembur || 0, pinjaman: r.pinjaman || 0, seragam: r.seragam || 0, potongan_lain: r.potongan_lain || 0, total: total, status_hitung: 'Draf', status_bayar: ada ? ada.status_bayar : 'Not', catatan: r.catatan.concat(total < 0 ? ['Negatif, dibawa ke periode berikutnya'] : []).join('; ') };
      if (ada) { row.id = ada.id; ubah.push(row); } else baru.push(row);
    });
    lama.forEach(function (r) { if (!dipakai[r.penugasan_id + '|' + r.periode_mulai]) ubah.push({ id: r.id, status_arsip: 'Arsip', catatan: 'Tidak berlaku lagi setelah hitung ulang' }); });
    if (baru.length) CC.tambahBanyak(ctx, CC.T.GAJI, baru);
    if (ubah.length) CC.ubahBanyak(ctx, CC.T.GAJI, ubah);
    CC.log(ctx, 'HITUNG_GAJI', CC.T.GAJI, per, null, { baris: hasil.length }, g ? '' : 'Pengaturan Gaji belum disimpan');
    if (ctx.user) CC.notif(ctx, 'GAJI_SIAP', CC.penerimaUser(CC.usersPeran(['KEP', 'KEU']).filter(function (u) { return u.id !== ctx.user.id; })), { periode: per, catatan: hasil.filter(function (r) { return r.catatan.length; }).length + ' baris perlu dicek.' }, per);
    ctx.pesan = hasil.length + ' baris gaji dihitung untuk periode ' + per + (g ? '.' : ' — lengkapi Pengaturan Gaji.');
    return CC.A['gaji.lihat'].fn(ctx, { periode: per });
  }
};
CC.A['gaji.koreksi'] = {
  roles: ['KEU'], tulis: true,
  fn: function (ctx, p) {
    if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Koreksi manual wajib beralasan.', { alasan: 'Wajib' });
    var r = CC.cari(CC.T.GAJI, p.id); if (r.status_hitung !== 'Draf' && r.status_hitung !== 'Diajukan') CC.galat('CONFLICT', 'Periode sudah disetujui dan terkunci.');
    var kor = CC.u.angka(p.koreksi), total = CC.u.angka(r.total) - CC.u.angka(r.koreksi) + kor;
    CC.ubah(ctx, CC.T.GAJI, r.id, { koreksi: kor, alasan_koreksi: p.alasan, total: total }, { aksi: 'KOREKSI_GAJI', ket: p.alasan });
    ctx.pesan = 'Koreksi ' + CC.u.rupiah(kor) + ' tercatat sebagai baris tersendiri.'; return true;
  }
};
CC.A['gaji.ajukan'] = {
  roles: ['ADM', 'KEP'], tulis: true,
  fn: function (ctx, p) {
    var per = p.periode, rows = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (r) { return r.periode_kode === per; });
    if (!rows.length) CC.galat('VALIDATION', 'Hitung gaji periode ini terlebih dahulu.');
    if (rows.some(function (r) { return r.status_hitung !== 'Draf'; })) CC.galat('CONFLICT', 'Periode ini sudah diajukan.');
    if (!p.bukti) CC.galat('VALIDATION', 'Pengajuan gaji wajib melampirkan bukti (rekap absensi/lembar gaji).', { bukti: 'Wajib' });
    var bukti = /^data:/.test(p.bukti) && CC.env.simpanBerkas ? CC.env.simpanBerkas(p.bukti, 'bukti_gaji_' + per, 'Bukti_Gaji').url : p.bukti;
    var total = rows.reduce(function (a, r) { return a + Math.max(0, CC.u.angka(r.total)); }, 0);
    var id = 'GAJ-' + CC.u.pad(CC.env.seq('GAJ', CC.T.JURNAL, 'GAJ-'), 4);
    CC.tambah(ctx, CC.T.JURNAL, { id: id, tanggal: CC.u.tgl(), tipe: 'Keluar', kategori: 'Gaji Perawat', akun: 'Bank', nominal: total, sumber: 'Gaji', referensi: per, bukti_url: bukti, status_pengajuan: 'Diajukan', diajukan_oleh: ctx.user.nama, keterangan: 'Pengajuan gaji perawat periode ' + per + ' (' + rows.length + ' baris)' });
    CC.ubahBanyak(ctx, CC.T.GAJI, rows.map(function (r) { return { id: r.id, status_hitung: 'Diajukan', pengajuan_id: id }; }));
    CC.notif(ctx, 'PENGAJUAN_STATUS', CC.penerimaUser(CC.usersPeran(['KEU'])), { kode: id, nominal: CC.u.rupiah(total), status: 'Diajukan', alasan: '' }, id);
    ctx.pesan = 'Pengajuan ' + id + ' (' + CC.u.rupiah(total) + ') dikirim ke Keuangan.'; return { id: id };
  }
};
CC.A['gaji.status'] = {
  roles: ['KEU'], tulis: true,
  fn: function (ctx, p) {
    var j = CC.cari(CC.T.JURNAL, p.id); if (!j || j.sumber !== 'Gaji') CC.galat('NOT_FOUND', 'Pengajuan tidak ditemukan.');
    var alur = { Diajukan: ['Diproses', 'Disetujui', 'Ditolak'], Diproses: ['Disetujui', 'Ditolak'], Disetujui: ['Dibayarkan'] };
    if ((alur[j.status_pengajuan] || []).indexOf(p.status) === -1) CC.galat('VALIDATION', 'Perubahan dari ' + j.status_pengajuan + ' ke ' + p.status + ' tidak diizinkan.' + (p.status === 'Dibayarkan' ? ' Tombol Dibayarkan hanya aktif setelah Disetujui.' : ''));
    if (p.status === 'Ditolak' && !String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan penolakan wajib.', { alasan: 'Wajib' });
    var rows = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (r) { return r.pengajuan_id === j.id; });
    var stBaris = p.status === 'Ditolak' ? 'Draf' : p.status === 'Diproses' ? 'Diajukan' : p.status;
    CC.ubahBanyak(ctx, CC.T.GAJI, rows.map(function (r) { var x = { id: r.id, status_hitung: stBaris }; if (p.status === 'Ditolak') x.pengajuan_id = ''; if (p.status === 'Dibayarkan') { x.status_bayar = 'Done'; x.tanggal_bayar = r.tanggal_bayar || CC.u.tgl(); } return x; }));
    if (p.status === 'Disetujui') {   // potong kasbon & bawa saldo negatif
      var ksb = CC.peta(CC.T.KASBON), up = [], sudah = {};
      rows.forEach(function (r) {
        if (sudah[r.perawat_id]) return; sudah[r.perawat_id] = 1;
        CC.potonganPerawat(r.perawat_id).rincian.forEach(function (x) { var k = ksb[x.ksb_id]; var sisa = CC.u.angka(k.sisa) - x.potong; up.push({ id: k.id, sisa: sisa, status: sisa <= 0 ? 'Lunas' : 'Disetujui' }); });
      });
      if (up.length) CC.ubahBanyak(ctx, CC.T.KASBON, up);
      rows.filter(function (r) { return CC.u.angka(r.total) < 0; }).forEach(function (r) { CC.tambah(ctx, CC.T.KASBON, { perawat_id: r.perawat_id, jenis: 'Lainnya', tanggal: CC.u.tgl(), nominal: -CC.u.angka(r.total), cara_potong: 'Sekali', nominal_per_periode: -CC.u.angka(r.total), sisa: -CC.u.angka(r.total), status: 'Disetujui', keterangan: 'Kekurangan dari periode ' + r.periode_kode + ' (gaji negatif)', diajukan_oleh: 'Sistem', disetujui_oleh: ctx.user.nama }); });
    }
    CC.ubah(ctx, CC.T.JURNAL, j.id, { status_pengajuan: p.status, diverifikasi_oleh: ctx.user.nama, alasan_tolak: p.alasan || '' }, { aksi: 'STATUS_GAJI', ket: p.status });
    var peng = CC.semua(CC.T.USER).filter(function (u) { return u.nama === j.diajukan_oleh; });
    CC.notif(ctx, 'PENGAJUAN_STATUS', CC.penerimaUser(peng), { kode: j.id, nominal: CC.u.rupiah(j.nominal), status: p.status, alasan: p.alasan || '' }, j.id);
    ctx.pesan = 'Pengajuan ' + j.id + ' → ' + p.status + (p.status === 'Disetujui' ? '. Periode terkunci; kasbon terpotong.' : '.'); return true;
  }
};
CC.A['gaji.done'] = {
  roles: ['KEU'], tulis: true,
  fn: function (ctx, p) {
    var ids = p.ids || [], rows = ids.map(function (id) { return CC.cari(CC.T.GAJI, id); }).filter(Boolean);
    if (rows.some(function (r) { return r.status_hitung !== 'Disetujui' && r.status_hitung !== 'Dibayarkan'; })) CC.galat('VALIDATION', 'Hanya baris dari periode yang sudah Disetujui yang dapat ditandai Done.');
    CC.ubahBanyak(ctx, CC.T.GAJI, rows.map(function (r) { return { id: r.id, status_bayar: 'Done', tanggal_bayar: p.tanggal_bayar || CC.u.tgl() }; }));
    var aj = rows.length ? rows[0].pengajuan_id : '', semua = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (r) { return r.pengajuan_id === aj; });
    if (aj && semua.every(function (r) { return r.status_bayar === 'Done' || ids.indexOf(r.id) > -1 || CC.u.angka(r.total) <= 0; })) CC.A['gaji.status'].fn(ctx, { id: aj, status: 'Dibayarkan' });
    ctx.pesan = rows.length + ' perawat ditandai Done.'; return true;
  }
};
CC.A['gaji.daftarBayar'] = {
  roles: ['ADM', 'KEU'],
  fn: function (ctx, p) {
    var d = CC.A['gaji.lihat'].fn(ctx, p); if (['Disetujui', 'Dibayarkan'].indexOf(d.status) === -1) CC.galat('VALIDATION', 'Daftar Pembayaran Gaji tersedia setelah periode Disetujui.');
    var m = {}; d.rows.forEach(function (r) { var o = m[r.perawat_id] = m[r.perawat_id] || { perawat_id: r.perawat_id, nama: r.nama_perawat, bank: r.bank, no_rekening: r.no_rekening, atas_nama: r.nama_pemilik_rekening, nominal: 0, status_bayar: r.status_bayar }; o.nominal += Math.max(0, CC.u.angka(r.total)); });
    CC.log(ctx, 'UNDUH_DAFTAR_GAJI', CC.T.GAJI, p.periode, null, null, 'Daftar Pembayaran Gaji diunduh');
    return Object.keys(m).map(function (k) { return m[k]; });
  }
};
CC.A['gaji.simulasi'] = {
  roles: ['ADM', 'KEU'],
  fn: function (ctx, p) {
    var g = Object.assign({}, CC.gajiSetting() || CC.GAJI_USULAN, p.pengaturan || {}), hari = Number(p.hari_periode || 30);
    var t = { id: 'SIMULASI', perawat_id: '', gaji_deal: p.gaji_deal, metode_gaji: p.metode || 'A', tugas_pendek: p.tugas_pendek ? 'YA' : 'TIDAK', jatah_libur: g.jatah_libur };
    var libur = Number(p.hari_libur || 0), lembur = Number(p.hari_lembur || 0), r = { gaji_deal: CC.u.angka(p.gaji_deal), metode: t.metode_gaji };
    r.fee_harian = Math.round(t.tugas_pendek === 'YA' ? CC.u.angka(g.tarif_harian_pendek) : r.gaji_deal / (Number(g.pembagi) || 30));
    r.hari_kerja = p.hari_kerja !== undefined && p.hari_kerja !== '' ? Number(p.hari_kerja) : hari - libur;
    if (r.metode === 'A') { var dip = g.potongan_berlaku === 'semua' ? libur : Math.max(0, libur - g.jatah_libur); r.potongan_libur = dip * CC.u.angka(g.potongan_libur); r.dasar = r.gaji_deal; } else { r.potongan_libur = 0; r.dasar = r.hari_kerja * r.fee_harian; }
    r.lembur = lembur * CC.u.angka(g.upah_lembur); r.pinjaman = CC.u.angka(p.kasbon); r.seragam = CC.u.angka(p.seragam);
    r.total = Math.round(r.dasar - r.potongan_libur + r.lembur - r.pinjaman - r.seragam);
    r.rumus = r.metode === 'A' ? 'Gaji deal ' + CC.u.rupiah(r.gaji_deal) + ' − ' + libur + ' hari libur × ' + CC.u.rupiah(g.potongan_libur) + (lembur ? ' + lembur' : '') + ' − kasbon − seragam' : r.hari_kerja + ' hari kerja × ' + CC.u.rupiah(r.fee_harian) + (lembur ? ' + lembur' : '') + ' − kasbon − seragam';
    return r;
  }
};
CC.A['gaji.cariPerawat'] = {
  roles: ['ADM', 'KEP', 'KEU'],
  fn: function (ctx, p) {
    var dari = p.dari, sampai = p.sampai, out = { penugasan: [], hari_kerja: 0, libur: 0, gaji: 0 };
    CC.semua(CC.T.TUGAS).filter(function (t) { return t.perawat_id === p.perawat_id && t.status !== 'Dibatalkan'; }).forEach(function (t) {
      var a = t.tanggal_mulai > dari ? t.tanggal_mulai : dari, akhirT = t.tanggal_akhir_aktual || t.tanggal_akhir, b = akhirT < sampai ? akhirT : sampai; if (a > b) return;
      var g = CC.gajiSetting(a), r = CC.hitungSatu(t, { mulai: a, akhir: b, penuh: false }, g, {});
      out.penugasan.push({ id: t.id, pasien: (CC.cari(CC.T.PASIEN, t.pasien_id) || {}).nama_pasien, mulai: a, akhir: b, hari_kerja: r.hari_kerja, libur: r.hari_libur, gaji: r.total, metode: r.metode });
      out.hari_kerja += r.hari_kerja || 0; out.libur += r.hari_libur || 0; out.gaji += r.total || 0;
    });
    return out;
  }
};

/* ===================== KASBON & POTONGAN (US-51) ===================== */
CC.hookSimpan.kasbon = function (ctx, d, baru) {
  d.nominal = CC.u.angka(d.nominal); if (d.nominal <= 0) CC.galat('VALIDATION', 'Nominal harus lebih dari 0.', { nominal: '> 0' });
  if (d.cara_potong === 'Cicilan') { d.jumlah_cicilan = Math.max(1, Number(d.jumlah_cicilan || 1)); d.nominal_per_periode = Math.ceil(d.nominal / d.jumlah_cicilan); } else { d.jumlah_cicilan = 1; d.nominal_per_periode = d.nominal; }
  if (baru) {
    var g = CC.gajiSetting(); if (g && g.kasbon_maks_persen && d.jenis === 'Kasbon') { var t = CC.semua(CC.T.TUGAS).filter(function (x) { return x.perawat_id === d.perawat_id && x.status === 'Berjalan'; })[0]; var maks = t ? CC.u.angka(t.gaji_deal) * g.kasbon_maks_persen / 100 : 0; if (maks && d.nominal > maks) CC.galat('VALIDATION', 'Kasbon melebihi batas ' + g.kasbon_maks_persen + '% gaji deal (' + CC.u.rupiah(maks) + ').', { nominal: 'Maks ' + CC.u.rupiah(maks) }); }
    d.sisa = d.nominal; d.tanggal = d.tanggal || CC.u.tgl(); d.diajukan_oleh = ctx.user.nama; d.status = ctx.peran === 'KEP' ? 'Diajukan' : 'Disetujui'; if (d.status === 'Disetujui') d.disetujui_oleh = ctx.user.nama;
  } else { delete d.sisa; }
  return d;
};
CC.hookList.kasbon = function (ctx, rows) { var phc = CC.peta(CC.T.PHC); return rows.map(function (r) { var c = Object.assign({}, r); c.nama_perawat = (phc[r.perawat_id] || {}).nama; return c; }); };
CC.A['kasbon.setujui'] = { roles: ['KEU'], tulis: true, fn: function (ctx, p) { var k = CC.cari(CC.T.KASBON, p.id); if (k.status !== 'Diajukan') CC.galat('VALIDATION', 'Hanya pengajuan berstatus Diajukan.'); CC.ubah(ctx, CC.T.KASBON, k.id, { status: p.tolak ? 'Dibatalkan' : 'Disetujui', disetujui_oleh: ctx.user.nama, keterangan: p.tolak ? (k.keterangan + ' | Ditolak: ' + (p.alasan || '')) : k.keterangan }, { aksi: p.tolak ? 'TOLAK_KASBON' : 'SETUJUI_KASBON' }); ctx.pesan = p.tolak ? 'Pengajuan ditolak.' : 'Kasbon disetujui; akan terpotong otomatis di periode gaji.'; return true; } };

/* ===================== PETTY CASH (US-25, US-26, US-53) ===================== */
CC.pcBerlaku = function (r) { return r.status_arsip !== 'Arsip' && (r.tipe === 'Masuk' ? ['Disetujui', 'Dibayarkan', 'Tercatat'].indexOf(r.status) > -1 : ['Disetujui', 'Dibayarkan'].indexOf(r.status) > -1); };
CC.saldoPettyCash = function () { return CC.semua(CC.T.PC).filter(CC.pcBerlaku).reduce(function (a, r) { return a + (r.tipe === 'Masuk' ? 1 : -1) * CC.u.angka(r.nominal); }, 0); };
CC.bukuPettyCash = function (bln) {
  var semua = CC.semua(CC.T.PC).filter(function (r) { return r.status_arsip !== 'Arsip'; }).sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : (a.id < b.id ? -1 : 1); });
  var saldo = 0, awal = 0, rows = [], masuk = 0, keluar = 0, menunggu = 0, kat = {};
  semua.forEach(function (r) {
    var ef = CC.pcBerlaku(r) ? (r.tipe === 'Masuk' ? 1 : -1) * CC.u.angka(r.nominal) : 0;
    if (r.tanggal.slice(0, 7) < bln) { saldo += ef; awal = saldo; return; }
    if (r.tanggal.slice(0, 7) > bln) return;
    saldo += ef; var c = Object.assign({}, r); c.saldo_berjalan = saldo; c.berlaku = !!ef; rows.push(c);
    if (ef > 0) masuk += ef; else if (ef < 0) { keluar += -ef; kat[r.kategori || 'Tanpa kategori'] = (kat[r.kategori || 'Tanpa kategori'] || 0) - ef; }
    if (r.tipe === 'Keluar' && (r.status === 'Diajukan' || r.status === 'Diproses')) menunggu += CC.u.angka(r.nominal);
  });
  return { bulan: bln, saldo_awal: awal, masuk: masuk, keluar: keluar, saldo_akhir: awal + masuk - keluar, menunggu: menunggu, per_kategori: kat, rows: rows };
};
CC.A['pc.buku'] = {
  roles: ['ADM', 'OPS', 'KEU', 'PC', 'PRW'],
  fn: function (ctx, p) {
    if (ctx.peran === 'PRW' && !CC.modulAktif('pc_perawat')) CC.galat('MODULE_OFF', 'Fitur petty cash perawat belum diaktifkan oleh Admin.');
    var b = CC.bukuPettyCash(p.bulan || CC.u.bulan());
    if (ctx.peran === 'PRW') { b.rows = CC.semua(CC.T.PC).filter(function (r) { return r.pengaju_id === ctx.user.id; }); b.saldo_awal = b.saldo_akhir = b.masuk = b.keluar = ''; b.per_kategori = {}; }
    b.boleh = { catat: CC.boleh(ctx.user, ['KEU', 'PC']) || (ctx.peran === 'PRW'), setujui: CC.boleh(ctx.user, ['KEU']), topup: CC.boleh(ctx.user, ['KEU', 'PC']) };
    return b;
  }
};
CC.A['pc.ajukan'] = {
  roles: ['KEU', 'PC', 'PRW'], tulis: true,
  fn: function (ctx, p) {
    if (ctx.peran === 'PRW' && !CC.modulAktif('pc_perawat')) CC.galat('MODULE_OFF', 'Fitur petty cash perawat belum diaktifkan oleh Admin.');
    var d = p.data || {}; CC.wajib(d, ['tanggal:Tanggal', 'tipe:Tipe', 'nominal:Nominal', 'keterangan:Keterangan']);
    if (d.tipe === 'Masuk' && ctx.peran === 'PRW') CC.galat('FORBIDDEN', 'Perawat hanya dapat mengajukan pengeluaran/reimburse.');
    if (d.tipe === 'Keluar' && !d.bukti) CC.galat('VALIDATION', 'Pengajuan pengeluaran wajib melampirkan bukti.', { bukti: 'Wajib' });
    var bukti = d.bukti && /^data:/.test(d.bukti) && CC.env.simpanBerkas ? CC.env.simpanBerkas(d.bukti, 'pc_' + CC.u.tgl().replace(/-/g, ''), 'Bukti_PettyCash').url : (d.bukti || '');
    var r = CC.tambah(ctx, CC.T.PC, { tanggal: d.tanggal, tipe: d.tipe, kategori: d.kategori || '', pengaju_id: ctx.user.id, pengaju_nama: ctx.user.nama, nominal: CC.u.angka(d.nominal), keterangan: CC.u.bersih(d.keterangan), bukti_url: bukti, status: d.tipe === 'Masuk' ? 'Tercatat' : 'Diajukan' });
    if (d.tipe === 'Keluar') CC.notif(ctx, 'PENGAJUAN_STATUS', CC.penerimaUser(CC.usersPeran(['KEU'])), { kode: r.id, nominal: CC.u.rupiah(r.nominal), status: 'Diajukan', alasan: r.keterangan }, r.id);
    ctx.pesan = d.tipe === 'Masuk' ? 'Pengisian kas tercatat; saldo bertambah.' : 'Pengajuan ' + r.id + ' dikirim ke Keuangan.'; return r;
  }
};
CC.A['pc.status'] = {
  roles: ['KEU'], tulis: true,
  fn: function (ctx, p) {
    var r = CC.cari(CC.T.PC, p.id); if (!r || r.tipe !== 'Keluar') CC.galat('NOT_FOUND', 'Pengajuan tidak ditemukan.');
    var alur = { Diajukan: ['Diproses', 'Disetujui', 'Ditolak'], Diproses: ['Disetujui', 'Ditolak'], Disetujui: ['Dibayarkan'] };
    if ((alur[r.status] || []).indexOf(p.status) === -1) CC.galat('VALIDATION', 'Perubahan ' + r.status + ' → ' + p.status + ' tidak diizinkan.');
    if (p.status === 'Ditolak' && !String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan penolakan wajib.', { alasan: 'Wajib' });
    if (p.status === 'Disetujui') { var sisa = CC.saldoPettyCash() - CC.u.angka(r.nominal); if (sisa < 0 && !p.konfirmasi) CC.galat('CONFLICT', 'Saldo petty cash akan menjadi negatif (' + CC.u.rupiah(sisa) + '). Konfirmasi untuk tetap menyetujui.'); }
    var patch = { status: p.status, disetujui_oleh: ctx.user.nama }; if (p.alasan) patch.alasan_tolak = p.alasan; if (p.status === 'Dibayarkan') patch.tanggal_bayar = CC.u.tgl();
    CC.ubah(ctx, CC.T.PC, r.id, patch, { aksi: 'STATUS_PC', ket: p.status });
    if (p.status === 'Disetujui') CC.tambah(ctx, CC.T.JURNAL, { tanggal: r.tanggal, tipe: 'Keluar', kategori: 'Petty Cash', akun: 'Kas Kecil', nominal: CC.u.angka(r.nominal), sumber: 'Petty Cash', referensi: r.id, bukti_url: r.bukti_url, status_pengajuan: 'Tercatat', diajukan_oleh: r.pengaju_nama, diverifikasi_oleh: ctx.user.nama, keterangan: r.keterangan });
    CC.notif(ctx, 'PENGAJUAN_STATUS', CC.penerimaUser(CC.semua(CC.T.USER).filter(function (u) { return u.id === r.pengaju_id; })), { kode: r.id, nominal: CC.u.rupiah(r.nominal), status: p.status, alasan: p.alasan || '' }, r.id);
    ctx.pesan = r.id + ' → ' + p.status + '.'; return true;
  }
};
CC.A['pc.batal'] = { roles: ['KEU', 'PC', 'PRW'], tulis: true, fn: function (ctx, p) { var r = CC.cari(CC.T.PC, p.id); if (r.pengaju_id !== ctx.user.id && ctx.peran !== 'KEU') CC.galat('FORBIDDEN', 'Hanya pengaju yang dapat membatalkan.'); if (r.status !== 'Diajukan') CC.galat('VALIDATION', 'Pengajuan yang sudah diproses tidak dapat dibatalkan.'); CC.ubah(ctx, CC.T.PC, r.id, { status: 'Dibatalkan', alasan_tolak: p.alasan || '' }, { aksi: 'BATAL' }); ctx.pesan = 'Pengajuan dibatalkan.'; return true; } };
CC.A['pc.tahunan'] = { roles: ['ADM', 'OPS', 'KEU', 'PC'], fn: function (ctx, p) { var th = p.tahun || String(CC.env.now().getFullYear()), out = []; for (var i = 1; i <= 12; i++) { var b = CC.bukuPettyCash(th + '-' + CC.u.pad(i, 2)); out.push({ bulan: b.bulan, saldo_awal: b.saldo_awal, masuk: b.masuk, keluar: b.keluar, saldo_akhir: b.saldo_akhir }); } return out; } };

/* ===================== KEUANGAN (US-27) & TARGET (US-28) ===================== */
CC.hookList.jurnal = function (ctx, rows) { return rows.sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : -1; }); };
CC.hookSimpan.jurnal = function (ctx, d, baru) { d.nominal = CC.u.angka(d.nominal); if (baru) { d.sumber = 'Manual'; d.status_pengajuan = 'Tercatat'; d.diajukan_oleh = ctx.user.nama; } else { var l = CC.cari(CC.T.JURNAL, d.id); if (l && l.sumber !== 'Manual') CC.galat('FORBIDDEN', 'Jurnal otomatis (' + l.sumber + ') hanya dikoreksi lewat pembalikan di modul asalnya.'); } return d; };
CC.A['keu.laporan'] = {
  roles: ['ADM', 'KEU'],
  fn: function (ctx, p) {
    var th = p.tahun || String(CC.env.now().getFullYear()), bulan = [], jurnal = CC.aktifSaja(CC.semua(CC.T.JURNAL)).filter(function (j) { return j.status_pengajuan !== 'Ditolak' && j.status_pengajuan !== 'Dibatalkan' && !(j.sumber === 'Gaji' && j.status_pengajuan !== 'Dibayarkan'); });
    var inv = CC.ringkasInvoice().filter(function (i) { return i.status !== 'Batal'; }), gaji = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (g) { return g.status_hitung === 'Disetujui' || g.status_hitung === 'Dibayarkan'; });
    var kum = 0;
    for (var i = 1; i <= 12; i++) {
      var b = th + '-' + CC.u.pad(i, 2), j = jurnal.filter(function (x) { return String(x.tanggal).slice(0, 7) === b; });
      var masuk = j.filter(function (x) { return x.tipe === 'Masuk'; }).reduce(function (a, x) { return a + CC.u.angka(x.nominal); }, 0), keluar = j.filter(function (x) { return x.tipe === 'Keluar'; }).reduce(function (a, x) { return a + CC.u.angka(x.nominal); }, 0);
      var pend = inv.filter(function (x) { return x.tanggal_terbit.slice(0, 7) === b; }).reduce(function (a, x) { return a + x.total; }, 0);
      var bg = gaji.filter(function (x) { return x.periode_kode === b; }).reduce(function (a, x) { return a + Math.max(0, CC.u.angka(x.total)); }, 0)
        + j.filter(function (x) { return x.tipe === 'Keluar' && x.sumber === 'Manual' && x.kategori === 'Gaji Perawat'; }).reduce(function (a, x) { return a + CC.u.angka(x.nominal); }, 0);   // gaji yang dicatat manual (mis. periode sebelum modul Penggajian dipakai)
      var pc = j.filter(function (x) { return x.sumber === 'Petty Cash'; }).reduce(function (a, x) { return a + CC.u.angka(x.nominal); }, 0);
      var lain = j.filter(function (x) { return x.tipe === 'Keluar' && x.sumber === 'Manual' && x.kategori !== 'Gaji Perawat'; }).reduce(function (a, x) { return a + CC.u.angka(x.nominal); }, 0);
      kum += masuk - keluar;
      bulan.push({ bulan: b, kas_masuk: masuk, kas_keluar: keluar, arus_bersih: masuk - keluar, saldo_kumulatif: kum, pendapatan: pend, beban_gaji: bg, beban_petty_cash: pc, beban_lain: lain, laba: pend - bg - pc - lain });
    }
    var perKlien = {}, pas = CC.peta(CC.T.PASIEN), tg = CC.peta(CC.T.TUGAS);
    inv.forEach(function (x) { var o = perKlien[x.pasien_id] = perKlien[x.pasien_id] || { pasien_id: x.pasien_id, nama: (pas[x.pasien_id] || {}).nama_pasien, ditagih: 0, terbayar: 0, sisa: 0, biaya_gaji: 0 }; if (x.tanggal_terbit.slice(0, 4) === th) { o.ditagih += x.total; o.terbayar += x.terbayar; o.sisa += x.sisa; } });
    // biaya per klien = HPP Sales Order (gaji perawat + estimasi biaya tambahan) agar konsisten dengan Analitik Penjualan
    CC.aktifSaja(CC.semua(CC.T.SO)).forEach(function (s) { if (String(s.tanggal).slice(0, 4) !== th || s.status === 'Batal' || s.status === 'Draf Perpanjangan' || s.margin === '' || s.margin == null) return; var o = perKlien[s.pasien_id] = perKlien[s.pasien_id] || { pasien_id: s.pasien_id, nama: (pas[s.pasien_id] || {}).nama_pasien, ditagih: 0, terbayar: 0, sisa: 0, biaya_gaji: 0 }; o.biaya_gaji += Math.max(0, CC.u.angka(s.total) - CC.u.angka(s.margin)); });
    var pk = Object.keys(perKlien).map(function (k) { var o = perKlien[k]; o.margin = o.ditagih - o.biaya_gaji; o.margin_persen = o.ditagih ? Math.round(o.margin / o.ditagih * 1000) / 10 : 0; return o; }).sort(function (a, b) { return b.ditagih - a.ditagih; });
    var tot = bulan.reduce(function (a, x) { Object.keys(x).forEach(function (k) { if (k !== 'bulan' && k !== 'saldo_kumulatif') a[k] = (a[k] || 0) + x[k]; }); return a; }, {});
    return { tahun: th, bulan: bulan, total: tot, per_klien: pk, saldo_pc: CC.saldoPettyCash(), piutang: inv.reduce(function (a, x) { return a + x.sisa; }, 0) };
  }
};
CC.SUMBER_TARGET = {
  kepatuhan_laporan: { label: 'Kepatuhan laporan harian (%)', hitung: function (b, a, z) { return CC.statistikKepatuhan(a, z).total.persen; } },
  sla_kasus: { label: 'Kasus selesai sesuai SLA (%)', hitung: function (b) { var k = CC.semua(CC.T.KASUS).filter(function (x) { return x.status === 'Selesai' && String(x.tanggal_masuk).slice(0, 7) === b; }); return k.length ? Math.round(k.filter(function (x) { return x.selesai_pada <= x.sla_tenggat; }).length / k.length * 100) : 100; } },
  pasien_terisi: { label: 'Pasien aktif terisi perawat (%)', hitung: function () { var a = CC.aktifSaja(CC.semua(CC.T.PASIEN)).filter(function (x) { return x.status === 'Aktif' && x.jenis_layanan === 'HC'; }); if (!a.length) return 100; var t = {}; CC.semua(CC.T.TUGAS).forEach(function (x) { if (x.status === 'Berjalan' && x.peran === 'Utama') t[x.pasien_id] = 1; }); return Math.round(a.filter(function (x) { return t[x.id]; }).length / a.length * 100); } },
  followup_lead: { label: 'Lead di-follow up ≤ 2 hari (%)', hitung: function (b) { var l = CC.semua(CC.T.LEAD).filter(function (x) { return String(x.tanggal_masuk).slice(0, 7) === b; }); return l.length ? Math.round(l.filter(function (x) { return x.followup_terakhir && CC.u.selisihJam(x.tanggal_masuk, x.followup_terakhir) <= 48; }).length / l.length * 100) : 100; } },
  omzet: { label: 'Omzet Sales Order (Rp)', hitung: function (b) { return CC.semua(CC.T.SO).filter(function (s) { return s.periode_bulan === b && s.status !== 'Batal' && s.status !== 'Draf Perpanjangan'; }).reduce(function (a, s) { return a + CC.u.angka(s.total); }, 0); } },
  deal_baru: { label: 'Klien baru (Sales Order New)', hitung: function (b) { return CC.semua(CC.T.SO).filter(function (s) { return s.periode_bulan === b && s.status_klien === 'New' && s.status !== 'Batal'; }).length; } },
  pembayaran: { label: 'Pembayaran diterima (Rp)', hitung: function (b) { return CC.semua(CC.T.BAYAR).filter(function (x) { return String(x.tanggal_bayar).slice(0, 7) === b; }).reduce(function (a, x) { return a + CC.u.angka(x.nominal); }, 0); } },
  tindakan_hv: { label: 'Tindakan Home Visit selesai', hitung: function (b) { return CC.semua(CC.T.LHV).filter(function (x) { return x.status === 'Selesai' && x.tanggal.slice(0, 7) === b; }).length; } },
  perawat_baru: { label: 'Perawat baru masuk', hitung: function (b) { return CC.semua(CC.T.TURNOVER).filter(function (x) { return x.jenis === 'Perawat Masuk' && x.bulan_rekap === b; }).length; } }
};
CC.capaianTarget = function (per) {
  var b = String(per).slice(0, 7), a = b + '-01', z = CC.u.tgl() < b + '-' + CC.u.pad(CC.u.hariDalamBulan(b), 2) ? CC.u.tgl() : b + '-' + CC.u.pad(CC.u.hariDalamBulan(b), 2), memo = {};
  return CC.aktifSaja(CC.semua(CC.T.TARGET)).filter(function (t) { return t.periode === b; }).map(function (t) {
    var c = Object.assign({}, t), s = CC.SUMBER_TARGET[t.sumber_otomatis];
    if (s) { if (memo[t.sumber_otomatis] === undefined) memo[t.sumber_otomatis] = s.hitung(b, a, z); c.realisasi = memo[t.sumber_otomatis]; }
    c.realisasi = CC.u.angka(c.realisasi); c.target = CC.u.angka(t.target); c.persen = c.target ? Math.round(c.realisasi / c.target * 1000) / 10 : 0; c.tercapai = c.persen >= 100;
    return c;
  });
};
CC.A['target.capaian'] = { roles: ['ADM', 'KEP', 'HV', 'CS', 'OPS', 'KEU'], fn: function (ctx, p) { var rows = CC.capaianTarget(p.periode || CC.u.bulan()), div = { KEP: 'Keperawatan', HV: 'Home Visit', HVK: 'Home Visit', CS: 'Customer Service', KEU: 'Keuangan' }[ctx.peran]; if (div && ctx.peran !== 'KEU') rows = rows.filter(function (r) { return r.divisi === div; }); if (ctx.peran === 'KEU') rows = rows.filter(function (r) { return r.divisi === 'Keuangan' || r.divisi === 'Customer Service'; }); return { rows: rows, sumber: Object.keys(CC.SUMBER_TARGET).map(function (k) { return { kode: k, label: CC.SUMBER_TARGET[k].label }; }), kpi: CC.A['dash.data'].fn(ctx, { rentang: 30 }).kpi || null }; } };
CC.hookSimpan.target = function (ctx, d) { d.target = CC.u.angka(d.target); return d; };

/* ===================== ANALITIK PENJUALAN (menu baru) ===================== */
CC.A['analitik.penjualan'] = {
  roles: ['ADM', 'KEU', 'OPS', 'CS'],
  fn: function (ctx, p) {
    var n = Number(p.bulan || 6), akhir = CC.u.bulan(), bulan = [], e = ctx.peran, margin = CC.lihatMargin(ctx);
    for (var i = n - 1; i >= 0; i--) bulan.push(CC.u.bulan(CC.u.parse(CC.u.tambahBulan(akhir + '-01', -i))));
    var pk = CC.peta(CC.T.PAKET), pas = CC.peta(CC.T.PASIEN), users = CC.peta(CC.T.USER);
    var so = CC.semua(CC.T.SO).filter(function (s) { return s.status !== 'Batal' && s.status !== 'Draf Perpanjangan' && bulan.indexOf(s.periode_bulan) > -1 && (!p.paket || s.paket_id === p.paket) && (!p.status_klien || s.status_klien === p.status_klien) && (!p.cs || s.pic_cs === p.cs) && (e !== 'CS' || s.pic_cs === ctx.user.id); });
    var bayar = CC.semua(CC.T.BAYAR), inv = CC.ringkasInvoice().filter(function (i) { return i.status !== 'Batal'; });
    var soId = {}; so.forEach(function (s) { soId[s.id] = 1; });
    var seri = bulan.map(function (b) {
      var x = so.filter(function (s) { return s.periode_bulan === b; }), om = x.reduce(function (a, s) { return a + CC.u.angka(s.total); }, 0), hp = x.reduce(function (a, s) { return a + CC.u.angka(s.hpp_pokok) + CC.u.angka(s.hpp_tambahan_estimasi); }, 0);
      var tb = bayar.filter(function (y) { return String(y.tanggal_bayar).slice(0, 7) === b; }).filter(function (y) { var iv = inv.filter(function (q) { return q.no_invoice === y.no_invoice; })[0]; return iv && (e !== 'CS' || soId[iv.so_id]); }).reduce(function (a, y) { return a + CC.u.angka(y.nominal); }, 0);
      return { bulan: b, label: CC.u.NAMA_BULAN[Number(b.slice(5)) - 1].slice(0, 3) + ' ' + b.slice(2, 4), omzet: om, so: x.length, terbayar: tb, hpp: margin ? hp : null, margin: margin ? om - hp : null, new: x.filter(function (s) { return s.status_klien === 'New'; }).length, existing: x.filter(function (s) { return s.status_klien === 'Existing'; }).length, rata: x.length ? Math.round(om / x.length) : 0 };
    });
    var kini = seri[seri.length - 1], lalu = seri[seri.length - 2] || { omzet: 0, so: 0, terbayar: 0, margin: 0 };
    function delta(a, b) { return b ? Math.round((a - b) / Math.abs(b) * 1000) / 10 : null; }
    var paket = {}; so.forEach(function (s) { var nm = (pk[s.paket_id] || {}).nama_paket || 'Lainnya', o = paket[nm] = paket[nm] || { paket: nm, jumlah: 0, nilai: 0 }; o.jumlah++; o.nilai += CC.u.angka(s.total); });
    var cs = {}; so.forEach(function (s) { var nm = (users[s.pic_cs] || {}).nama || 'Tanpa PIC', o = cs[nm] = cs[nm] || { nama: nm, jumlah: 0, nilai: 0 }; o.jumlah++; o.nilai += CC.u.angka(s.total); });
    var wil = {}; so.forEach(function (s) { var w = (pas[s.pasien_id] || {}).wilayah || 'Lainnya', o = wil[w] = wil[w] || { wilayah: w, jumlah: 0, nilai: 0 }; o.jumlah++; o.nilai += CC.u.angka(s.total); });
    var durasi = { '≤ 7 hari': 0, '8–15 hari': 0, '16–30 hari': 0, '> 30 hari': 0 }; so.forEach(function (s) { var h = Number(s.kontrak_hari); durasi[h <= 7 ? '≤ 7 hari' : h <= 15 ? '8–15 hari' : h <= 30 ? '16–30 hari' : '> 30 hari']++; });
    var dari90 = CC.u.tambahHari(CC.u.tgl(), -89), leads = CC.semua(CC.T.LEAD).filter(function (l) { return String(l.tanggal_masuk).slice(0, 10) >= dari90 && (e !== 'CS' || !l.pic_cs || l.pic_cs === ctx.user.id); });
    var funnel = [{ tahap: 'Lead masuk', jumlah: leads.length }, { tahap: 'Di-follow up', jumlah: leads.filter(function (l) { return l.status_pipeline !== 'Lead Masuk'; }).length }, { tahap: 'Deal', jumlah: leads.filter(function (l) { return l.status_pipeline === 'Deal'; }).length }, { tahap: 'Menjadi SO', jumlah: leads.filter(function (l) { return l.so_id; }).length }];
    var sumber = {}; leads.forEach(function (l) { var o = sumber[l.sumber_lead] = sumber[l.sumber_lead] || { sumber: l.sumber_lead, lead: 0, deal: 0 }; o.lead++; if (l.status_pipeline === 'Deal') o.deal++; });
    var aging = { 'Belum jatuh tempo': 0, '1–7 hari': 0, '8–30 hari': 0, '31–60 hari': 0, '> 60 hari': 0 };
    inv.filter(function (i) { return i.sisa > 0 && (e !== 'CS' || soId[i.so_id] || !p.paket); }).forEach(function (i) { var u = i.umur_hari; aging[u <= 0 ? 'Belum jatuh tempo' : u <= 7 ? '1–7 hari' : u <= 30 ? '8–30 hari' : u <= 60 ? '31–60 hari' : '> 60 hari'] += i.sisa; });
    var top = so.slice().sort(function (a, b) { return CC.u.angka(b.total) - CC.u.angka(a.total); }).slice(0, 8).map(function (s) { return { id: s.id, pasien: (pas[s.pasien_id] || {}).nama_pasien, paket: (pk[s.paket_id] || {}).nama_paket, kontrak: s.kontrak_label, total: CC.u.angka(s.total), margin: margin ? CC.u.angka(s.margin) : null, status_klien: s.status_klien, tanggal: s.tanggal }; });
    var totOm = seri.reduce(function (a, x) { return a + x.omzet; }, 0), totMg = margin ? seri.reduce(function (a, x) { return a + x.margin; }, 0) : null;
    return {
      bulan: seri, ringkas: { omzet: kini.omzet, omzet_delta: delta(kini.omzet, lalu.omzet), so: kini.so, so_delta: delta(kini.so, lalu.so), terbayar: kini.terbayar, terbayar_delta: delta(kini.terbayar, lalu.terbayar), margin: margin ? kini.margin : null, margin_persen: margin && kini.omzet ? Math.round(kini.margin / kini.omzet * 1000) / 10 : null, margin_delta: margin ? delta(kini.margin, lalu.margin) : null, rata_nilai: kini.rata, konversi: funnel[0].jumlah ? Math.round(funnel[2].jumlah / funnel[0].jumlah * 1000) / 10 : 0, piutang: inv.reduce(function (a, i) { return a + i.sisa; }, 0), total_omzet: totOm, total_margin: totMg, hpp_estimasi: so.some(function (s) { return s.hpp_status === 'Estimasi'; }) },
      paket: Object.keys(paket).map(function (k) { return paket[k]; }).sort(function (a, b) { return b.nilai - a.nilai; }), cs: e === 'CS' ? [] : Object.keys(cs).map(function (k) { return cs[k]; }).sort(function (a, b) { return b.nilai - a.nilai; }),
      wilayah: Object.keys(wil).map(function (k) { return wil[k]; }).sort(function (a, b) { return b.nilai - a.nilai; }), durasi: durasi, funnel: funnel, sumber: Object.keys(sumber).map(function (k) { var o = sumber[k]; o.konversi = o.lead ? Math.round(o.deal / o.lead * 100) : 0; return o; }).sort(function (a, b) { return b.lead - a.lead; }),
      aging: aging, top: top, boleh_margin: margin, filter: { paket: CC.aktifSaja(CC.semua(CC.T.PAKET)).map(function (x) { return { id: x.id, nama: x.nama_paket }; }), cs: e === 'CS' ? [] : CC.usersPeran(['CS']).map(function (u) { return { id: u.id, nama: u.nama }; }) }
    };
  }
};

/* ===================== PENGATURAN, BRANDING, MODUL (US-49, US-54, US-55, US-59) ===================== */
CC.KUNCI_SET = ['shift', 'operasional', 'master', 'profil', 'penomoran', 'modul', 'branding', 'notif', 'format_laporan', 'format_idf', 'gaji', 'penilaian', 'mess', 'login'];
CC.FONT_IZIN = ['Plus Jakarta Sans', 'Inter', 'Manrope', 'DM Sans', 'IBM Plex Sans', 'Source Sans 3', 'Nunito Sans', 'Public Sans'];
CC.ASET_BRAND = ['logo_url', 'logo_gelap_url', 'gambar_login_url', 'favicon_url'];
/* drive:<id> = berkas di folder Aset_Brand (hasil aset.unggah), disajikan sebagai data URL oleh server */
CC.urlGambarSah = function (u) { return /^drive:[A-Za-z0-9_-]{10,}$/.test(u) || /^(https:\/\/|assets\/|data:image\/(png|jpeg|webp|svg\+xml);base64,)/.test(u); };
CC.validasiBranding = function (b) {
  var hex = /^#[0-9A-Fa-f]{6}$/, bersih = function (s) { return String(s == null ? '' : s).replace(/[<>]/g, '').slice(0, 200); };
  Object.keys(b.warna || {}).forEach(function (k) { if (!hex.test(b.warna[k])) CC.galat('VALIDATION', 'Warna "' + k + '" harus format #RRGGBB.', { warna: 'Format #RRGGBB' }); });
  if (b.font_judul && CC.FONT_IZIN.indexOf(b.font_judul) === -1) CC.galat('VALIDATION', 'Font judul tidak tersedia.');
  if (b.font_isi && CC.FONT_IZIN.indexOf(b.font_isi) === -1) CC.galat('VALIDATION', 'Font isi tidak tersedia.');
  ['nama_aplikasi', 'nama_brand', 'nama_perusahaan', 'tagline', 'footer'].forEach(function (k) { if (b[k] !== undefined) b[k] = bersih(b[k]); });
  if (b.app_url && !/^(https:\/\/[^\s<>"']+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^\s<>"']*)$/.test(b.app_url)) CC.galat('VALIDATION', 'Alamat aplikasi harus diawali https:// (http://localhost hanya untuk uji lokal).', { app_url: 'https://…' });
  CC.ASET_BRAND.forEach(function (k) { if (b[k] && !CC.urlGambarSah(b[k])) CC.galat('VALIDATION', 'Alamat gambar tidak diizinkan.'); if (b[k] && b[k].length > 700000) CC.galat('VALIDATION', 'Gambar terlalu besar (maks ±500 KB).'); });
  if (b.teks) Object.keys(b.teks).forEach(function (k) { b.teks[k] = bersih(b.teks[k]); });
  b.ukuran_dasar = Math.min(16, Math.max(13, Number(b.ukuran_dasar || 14)));
  if (['kecil', 'sedang', 'besar'].indexOf(b.radius) === -1) b.radius = 'besar';
  if (['nyaman', 'ringkas'].indexOf(b.kepadatan) === -1) b.kepadatan = 'nyaman';
  if (['normal', 'dikurangi', 'mati'].indexOf(b.animasi) === -1) b.animasi = 'normal';
  return b;
};
/* Normalisasi + validasi pengaturan halaman masuk. ketat=true saat disimpan (galat bila alamat gambar tidak sah). */
CC.loginSiap = function (v, ketat) {
  var B = CC.BAWAAN.login, o = CC.u.json(v, {}) || {}, t = function (s, n) { return String(s == null ? '' : s).replace(/[<>]/g, '').trim().slice(0, n || 120); };
  var angka = function (x, min, maks, bawaan) { x = Number(x); return isNaN(x) ? bawaan : Math.min(maks, Math.max(min, Math.round(x))); };
  var ya = function (x, bawaan) { return x === undefined || x === null || x === '' ? bawaan : x === true || x === 'true' || x === 'YA' || x === 1; };
  var s = Object.assign({}, B.slide, o.slide || {}), k = Object.assign({}, B.kartu, o.kartu || {});
  var slide = {
    aktif: ya(s.aktif, true), durasi: angka(s.durasi, 3, 30, 6), kecepatan: angka(s.kecepatan, 300, 3000, 1200), gelap: angka(s.gelap, 30, 90, 64),
    transisi: ['pudar', 'geser', 'zoom'].indexOf(s.transisi) > -1 ? s.transisi : 'pudar', acak: ya(s.acak, false), titik: ya(s.titik, true), keterangan: ya(s.keterangan, true), jeda_hover: ya(s.jeda_hover, true),
    daftar: (Array.isArray(s.daftar) ? s.daftar : []).slice(0, 8).map(function (x, i) {
      var url = String(x && x.url || '');
      if (!CC.urlGambarSah(url)) { if (ketat) CC.galat('VALIDATION', 'Alamat gambar slide ' + (i + 1) + ' tidak diizinkan.'); return null; }
      if (url.length > 700000) CC.galat('VALIDATION', 'Gambar slide ' + (i + 1) + ' terlalu besar (maks ±500 KB).');
      return { id: t(x.id || ('s' + (i + 1)), 24), url: url, judul: t(x.judul, 80), teks: t(x.teks, 140) };
    }).filter(Boolean)
  };
  var blok = Object.assign({}, B.kartu.blok, k.blok || {});
  var kartu = {
    aktif: ya(k.aktif, true), judul: t(k.judul, 40) || 'LIVE · PENUGASAN AKTIF', putar: Number(k.putar) === 0 ? 0 : angka(k.putar, 4, 30, 9), miring: ya(k.miring, true),
    blok: { perawat: ya(blok.perawat, true), ttv: ya(blok.ttv, true), lini: ya(blok.lini, true), progres: ya(blok.progres, true) },
    skenario: (Array.isArray(k.skenario) ? k.skenario : []).slice(0, 5).map(function (x, i) {
      var maks = angka(x.progres_maks, 1, 20, 8);
      return {
        id: t(x.id || ('sk' + (i + 1)), 24), label: t(x.label, 32) || ('Skenario ' + (i + 1)), pasien: t(x.pasien, 60), info: t(x.info, 90), status: t(x.status, 32), perawat: t(x.perawat, 60), perawat_info: t(x.perawat_info, 60),
        ttv: (Array.isArray(x.ttv) ? x.ttv : []).slice(0, 4).map(function (v) { return { k: t(v.k, 12), v: t(v.v, 12), tren: t(v.tren, 160) }; }).filter(function (v) { return v.k; }),
        lini: (Array.isArray(x.lini) ? x.lini : []).slice(0, 5).map(function (l) { return { jam: t(l.jam, 5), judul: t(l.judul, 50), teks: t(l.teks, 80), detail: t(l.detail, 200), status: ['ok', 'jalan', 'tunda'].indexOf(l.status) > -1 ? l.status : 'ok', progres: angka(l.progres, 0, maks, 0) }; }).filter(function (l) { return l.judul; }),
        progres_label: t(x.progres_label, 30) || 'Laporan A–H', progres: angka(x.progres, 0, maks, 0), progres_maks: maks
      };
    }).filter(function (x) { return x.pasien; })
  };
  return { slide: slide, kartu: kartu };
};
CC.A['pengaturan.ambil'] = {
  roles: ['ADM', 'KEU'],
  fn: function (ctx, p) {
    if (CC.KUNCI_SET.indexOf(p.kunci) === -1) CC.galat('NOT_FOUND', 'Pengaturan tidak dikenal.');
    if (ctx.peran === 'KEU' && ['gaji', 'master'].indexOf(p.kunci) === -1) CC.galat('FORBIDDEN', 'Keuangan hanya dapat membuka Pengaturan Gaji dan master kategori kas/bank.');
    var riw = CC.setRiwayat(p.kunci).slice(0, 25).map(function (r) { return { id: r.id, versi: r.versi, berlaku_mulai: r.berlaku_mulai, oleh: r.diubah_oleh_nama, alasan: r.alasan, waktu: r.dibuat_pada, nilai: p.kunci === 'gaji' || p.kunci === 'branding' ? CC.u.json(r.nilai, {}) : null }; });
    var nilai = p.kunci === 'gaji' ? (CC.gajiSetting(p.tanggal) || null) : CC.set(p.kunci);
    var out = { kunci: p.kunci, nilai: nilai, riwayat: riw, tersimpan: riw.length > 0 };
    if (p.kunci === 'gaji') { out.usulan = CC.GAJI_USULAN; out.paket = CC.aktifSaja(CC.semua(CC.T.PAKET)).map(function (x) { return { id: x.id, nama: x.nama_paket, aktif: x.aktif }; }); }
    if (p.kunci === 'penomoran') out.terakhir = CC.semua(CC.T.NOMOR);
    if (p.kunci === 'branding') out.tampil = CC.brandingSiap(nilai);
    if (p.kunci === 'login') { out.nilai = CC.loginSiap(nilai); out.bawaan = CC.loginSiap(CC.BAWAAN.login); }
    return out;
  }
};
CC.A['pengaturan.simpan'] = {
  roles: ['ADM', 'KEU'], tulis: true, cache: 'set',
  fn: function (ctx, p) {
    if (CC.KUNCI_SET.indexOf(p.kunci) === -1) CC.galat('NOT_FOUND', 'Pengaturan tidak dikenal.');
    if (ctx.peran === 'KEU' && ['gaji', 'master'].indexOf(p.kunci) === -1) CC.galat('FORBIDDEN', 'Keuangan hanya boleh mengubah Pengaturan Gaji dan master kategori kas/bank.');
    var v = p.nilai;
    if (p.kunci === 'master' && ctx.peran === 'KEU') { var lama = CC.set('master'); ['bank', 'kategori_pc', 'kategori_jurnal'].forEach(function (k) { if (v[k]) lama[k] = v[k]; }); v = lama; }
    if (p.kunci === 'branding') v = CC.validasiBranding(Object.assign(CC.set('branding'), v));
    if (p.kunci === 'login') v = CC.loginSiap(v, true);
    if (p.kunci === 'gaji') { if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan perubahan Pengaturan Gaji wajib diisi.', { alasan: 'Wajib' }); ['pembagi', 'tarif_harian_pendek', 'batas_hari_pendek', 'jatah_libur', 'potongan_libur', 'tarif_lembur_klien', 'biaya_admin', 'masa_admin_bulan'].forEach(function (k) { if (v[k] !== '' && v[k] !== undefined && (isNaN(Number(v[k])) || Number(v[k]) < 0)) CC.galat('VALIDATION', 'Nilai "' + k.replace(/_/g, ' ') + '" harus angka ≥ 0.', {}); }); if (Number(v.pembagi) === 0) CC.galat('VALIDATION', 'Pembagi fee harian tidak boleh 0.'); }
    if (p.kunci === 'notif') { var lamaN = CC.set('notif'); v = Object.assign(lamaN, v); if (v.wa_aktif && CC.env.rahasiaAda && !CC.env.rahasiaAda('FONNTE_TOKEN') && CC.env.mode !== 'demo') CC.galat('VALIDATION', 'Isi token penyedia WhatsApp sebelum mengaktifkan notifikasi WA.'); if ([10, 20, 50].indexOf(Number(v.batch)) === -1) v.batch = 20; if (!/^\d{1,3}(-\d{1,3})?$/.test(String(v.jeda))) CC.galat('VALIDATION', 'Jeda harus angka (mis. 5) atau rentang (mis. 3-8).'); }
    if (p.kunci === 'penomoran') Object.keys(v).forEach(function (k) { if (!/\{N+\}/.test(v[k].pola)) CC.galat('VALIDATION', 'Pola ' + k + ' harus memuat {NNNN} (nomor urut).'); });
    var berlaku = p.berlaku_mulai || CC.u.tgl();
    var ver = CC.setSimpan(ctx, p.kunci, v, berlaku, p.alasan || '', p.kunci);
    ctx.pesan = 'Pengaturan tersimpan (versi ' + ver + (berlaku > CC.u.tgl() ? ', berlaku mulai ' + CC.u.tglPanjang(berlaku) : '') + ').';
    return { versi: ver, nilai: v };
  }
};
CC.A['pengaturan.pulihkan'] = {
  roles: ['ADM'], tulis: true, cache: 'set',
  fn: function (ctx, p) {
    var nilai;
    if (p.bawaan) nilai = p.kunci === 'gaji' ? CC.GAJI_USULAN : CC.BAWAAN[p.kunci];
    else { var r = CC.cari(CC.T.SET, p.id); if (!r || r.kunci !== p.kunci) CC.galat('NOT_FOUND', 'Versi tidak ditemukan.'); nilai = CC.u.json(r.nilai, null); }
    var ver = CC.setSimpan(ctx, p.kunci, nilai, CC.u.tgl(), p.bawaan ? 'Pulihkan bawaan' : 'Pulihkan ke versi ' + p.id, p.kunci);
    ctx.pesan = p.bawaan ? 'Dikembalikan ke pengaturan bawaan.' : 'Dipulihkan ke versi sebelumnya.'; return { versi: ver, nilai: nilai };
  }
};
CC.A['modul.toggle'] = {
  roles: ['ADM'], tulis: true, cache: 'set',
  fn: function (ctx, p) { var m = CC.set('modul'); if (m[p.modul] === undefined) CC.galat('NOT_FOUND', 'Modul tidak dikenal.'); m[p.modul] = !!p.aktif; CC.setSimpan(ctx, 'modul', m, CC.u.tgl(), (p.aktif ? 'Aktifkan ' : 'Matikan ') + p.modul, 'modul'); ctx.pesan = 'Modul ' + p.modul.replace(/_/g, ' ') + (p.aktif ? ' diaktifkan.' : ' dimatikan (data tetap tersimpan).'); return m; }
};
CC.A['paket.toggle'] = {
  roles: ['ADM'], tulis: true,
  fn: function (ctx, p) { var k = CC.cari(CC.T.PAKET, p.id); CC.ubah(ctx, CC.T.PAKET, k.id, { aktif: p.aktif ? 'YA' : 'TIDAK' }, { aksi: 'SAKLAR_PAKET' }); ctx.pesan = 'Paket ' + k.nama_paket + (p.aktif ? ' aktif dan muncul di pilihan paket.' : ' nonaktif.'); return true; }
};
CC.hookSimpan.paket = function (ctx, d, baru) {
  d.harga_bawaan = CC.u.angka(d.harga_bawaan); if (baru) { d.aktif = d.aktif || 'YA'; d.urutan = d.urutan || CC.semua(CC.T.PAKET).length + 1; }
  else { var l = CC.cari(CC.T.PAKET, d.id); if (l && String(l.harga_bawaan) !== String(d.harga_bawaan)) CC.setSimpan(ctx, 'harga_paket_' + l.id, { lama: l.harga_bawaan, baru: d.harga_bawaan }, CC.u.tgl(), d.alasan || 'Ubah harga paket', 'paket'); }
  delete d.alasan; return d;
};

/* ===================== AKUN (US-02) & LOG (US-35) ===================== */
CC.pinAcak = function (panjang, huruf) { var s = '', u = CC.env.uuid().replace(/-/g, '') + CC.env.uuid().replace(/-/g, ''), set = huruf ? 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' : '0123456789'; for (var i = 0; i < panjang; i++) s += set[parseInt(u.substr(i * 2, 2), 16) % set.length]; return s; };
CC.hookSimpan.akun = function (ctx, d, baru) {
  if (['ADM', 'PRW', 'KEP', 'HV', 'CS', 'HRD', 'OPS', 'KEU'].indexOf(d.role) === -1) CC.galat('VALIDATION', 'Peran tidak valid.', { role: 'Pilih peran' });
  d.username = String(d.username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (d.username.length < 3) CC.galat('VALIDATION', 'Username minimal 3 karakter (huruf kecil/angka).', { username: 'Minimal 3' });
  if (CC.semua(CC.T.USER).some(function (u) { return u.username === d.username && u.id !== d.id; })) CC.galat('CONFLICT', 'Username "' + d.username + '" sudah dipakai.');
  if ((d.role === 'PRW' || d.role === 'HV') && !d.perawat_id) CC.galat('VALIDATION', 'Akun perawat wajib ditautkan ke data perawat.', { perawat_id: 'Pilih perawat' });
  if (d.no_wa) d.no_wa = CC.u.hp08(d.no_wa);
  if (baru) {
    var kuat = d.role === 'ADM' || d.role === 'KEU', pin = CC.pinAcak(kuat ? 10 : 6, kuat), salt = CC.env.uuid();
    d.pin_hash = CC.env.hashPin(pin, salt); d.salt = salt; d.status_akun = 'Aktif'; d.wajib_ganti_pin = 'YA'; d.percobaan_gagal = 0;
    ctx.ekstra = { pin_awal: pin };
  } else { delete d.pin_hash; delete d.salt; }
  return d;
};
CC.A['akun.resetPin'] = {
  roles: ['ADM'], tulis: true,
  fn: function (ctx, p) { var u = CC.cari(CC.T.USER, p.id), kuat = u.role === 'ADM' || u.role === 'KEU', pin = CC.pinAcak(kuat ? 10 : 6, kuat), salt = CC.env.uuid(); CC.ubah(ctx, CC.T.USER, u.id, { pin_hash: CC.env.hashPin(pin, salt), salt: salt, wajib_ganti_pin: 'YA', percobaan_gagal: 0, terkunci_sampai: '', rev_sesi: CC.env.now().getTime() }, { aksi: 'RESET_PIN' }); ctx.pesan = 'PIN direset. Sampaikan PIN baru secara langsung; wajib diganti saat login.'; return { pin_awal: pin }; }
};
CC.A['akun.bukaKunci'] = { roles: ['ADM'], tulis: true, fn: function (ctx, p) { CC.ubah(ctx, CC.T.USER, p.id, { percobaan_gagal: 0, terkunci_sampai: '' }, { aksi: 'BUKA_KUNCI' }); ctx.pesan = 'Kunci akun dibuka.'; return true; } };
CC.A['akun.cabutSesi'] = { roles: ['ADM'], tulis: true, fn: function (ctx, p) { CC.ubah(ctx, CC.T.USER, p.id, { rev_sesi: CC.env.now().getTime() }, { aksi: 'CABUT_SESI' }); ctx.pesan = 'Semua sesi akun dicabut.'; return true; } };
CC.A['log.list'] = {
  roles: ['ADM'],
  fn: function (ctx, p) {
    var q = String(p.q || '').toLowerCase();
    return CC.semua(CC.T.LOG).filter(function (l) { return (!p.aksi || l.aksi === p.aksi) && (!p.tab || l.tab === p.tab) && (!p.dari || l.waktu >= p.dari) && (!p.sampai || l.waktu.slice(0, 10) <= p.sampai) && (!q || (l.nama + ' ' + l.id_record + ' ' + l.keterangan + ' ' + l.aksi).toLowerCase().indexOf(q) > -1); }).slice(-Number(p.batas || 600)).reverse();
  }
};
CC.A['sistem.status'] = { roles: ['ADM'], fn: function () { var s = CC.env.statusSistem ? CC.env.statusSistem() : {}; s.tab = Object.keys(CC.SKEMA).map(function (t) { return { tab: t, baris: CC.semua(t).length }; }); s.versi = CC.VERSI; return s; } };
CC.A['sistem.backup'] = { roles: ['ADM'], tulis: true, cache: 'none', fn: function (ctx) { if (!CC.env.backup) CC.galat('VALIDATION', 'Backup tersedia pada mode server (Google Apps Script).'); var r = CC.env.backup(); CC.log(ctx, 'BACKUP', '', '', null, r, 'Backup manual'); ctx.pesan = 'Backup selesai: ' + (r.nama || ''); return r; } };

/* ===================== NOTIFIKASI, BLAST WA & CRM (gas-notifikasi-wa-crm) ===================== */
CC.A['notif.config'] = {
  roles: ['ADM'],
  fn: function () { var n = CC.set('notif'); return { pengaturan: n, matriks: CC.matriksNotif(), rahasia: CC.env.rahasiaStatus ? CC.env.rahasiaStatus() : {}, kuota_email: CC.env.kuotaEmail ? CC.env.kuotaEmail() : null, trigger: CC.env.statusTrigger ? CC.env.statusTrigger() : null, mode: CC.env.mode }; }
};
CC.A['notif.simpanRahasia'] = {
  roles: ['ADM'], tulis: true, cache: 'none',
  fn: function (ctx, p) { if (!CC.env.simpanRahasia) CC.galat('VALIDATION', 'Tidak tersedia.'); var r = CC.env.simpanRahasia(p.kunci, p.nilai); CC.log(ctx, 'RAHASIA', 'ScriptProperties', p.kunci, null, null, p.nilai === '__HAPUS__' ? 'dihapus' : 'diperbarui'); ctx.pesan = 'Tersimpan aman (Script Properties).'; return r; }
};
CC.A['notif.antrean'] = {
  roles: ['ADM', 'CS', 'OPS'],
  fn: function (ctx, p) { var a = CC.semua(CC.T.NOTIF).filter(function (n) { return n.kanal !== 'INAPP' && (!p.status || n.status === p.status) && (!p.kanal || n.kanal === p.kanal) && (!p.blast_id || n.blast_id === p.blast_id); }); var r = { Antri: 0, Terkirim: 0, Gagal: 0, Batal: 0 }; CC.semua(CC.T.NOTIF).forEach(function (n) { if (n.kanal !== 'INAPP' && r[n.status] !== undefined) r[n.status]++; }); return { rows: a.slice(-300).reverse(), ringkas: r }; }
};
CC.A['notif.proses'] = { roles: ['ADM', 'CS', 'OPS'], tulis: true, cache: 'none', fn: function (ctx, p) { var r = CC.env.prosesAntrean ? CC.env.prosesAntrean(p || {}) : { terkirim: 0 }; ctx.pesan = 'Antrean diproses: ' + (r.terkirim || 0) + ' terkirim, ' + (r.gagal || 0) + ' gagal.'; return r; } };
CC.A['notif.ulangi'] = { roles: ['ADM'], tulis: true, fn: function (ctx, p) { var ids = p.ids && p.ids.length ? p.ids : CC.semua(CC.T.NOTIF).filter(function (n) { return n.status === 'Gagal'; }).map(function (n) { return n.id; }); CC.ubahBanyak(ctx, CC.T.NOTIF, ids.map(function (id) { return { id: id, status: 'Antri', percobaan: 0 }; })); if (CC.env.antreanBaru) CC.env.antreanBaru(ids.length); ctx.pesan = ids.length + ' pesan dijadwalkan ulang.'; return ids.length; } };
CC.A['notif.tes'] = {
  roles: ['ADM'], tulis: true,
  fn: function (ctx, p) {
    var row = { kanal: p.kanal === 'EMAIL' ? 'EMAIL' : 'WA', tujuan: p.kanal === 'EMAIL' ? p.tujuan : CC.u.hp62(p.tujuan), nama_penerima: 'Uji', subjek: 'Uji notifikasi Capten Care', pesan: 'Ini pesan uji dari Capten Care Integrated Management System (' + CC.u.dt() + ').', event: 'TES', status: 'Antri', percobaan: 0 };
    if (row.kanal === 'WA' && !CC.u.hpValid(p.tujuan)) CC.galat('VALIDATION', 'Nomor tidak valid.', { tujuan: '08xxxxxxxxxx' });
    if (row.kanal === 'EMAIL' && !CC.u.emailValid(p.tujuan)) CC.galat('VALIDATION', 'Email tidak valid.', { tujuan: 'Email tidak valid' });
    CC.tambahBanyak(ctx, CC.T.NOTIF, [row]); var r = CC.env.prosesAntrean ? CC.env.prosesAntrean({ paksa: true }) : {}; ctx.pesan = 'Pesan uji diproses (' + (r.terkirim ? 'terkirim' : 'cek antrean') + ').'; return r;
  }
};
CC.A['wa.perangkat'] = { roles: ['ADM'], fn: function () { return CC.env.perangkatWA ? CC.env.perangkatWA() : { status: 'Tidak tersedia' }; } };
CC.A['wa.validasi'] = {
  roles: ['ADM', 'CS', 'OPS'], tulis: true,
  fn: function (ctx, p) {
    var nomor = (p.nomor || []).map(CC.u.hp08).filter(CC.u.hpValid).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 50);
    var hasil = CC.env.validasiWA ? CC.env.validasiWA(nomor) : {}, up = [];
    CC.semua(CC.T.CRM).forEach(function (k) { var h = hasil[CC.u.hp08(k.no_wa)]; if (h) up.push({ id: k.id, status_wa: h, cek_wa_at: CC.u.dt() }); });
    if (up.length) CC.ubahBanyak(ctx, CC.T.CRM, up);
    return { hasil: hasil, diperbarui: up.length };
  }
};
CC.A['wa.blastBuat'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    CC.wajib(p, ['judul:Judul internal', 'pesan:Isi pesan']);
    var ub = Number(p.ukuran_batch); if ([10, 20, 50].indexOf(ub) === -1) CC.galat('VALIDATION', 'Ukuran batch harus 10, 20, atau 50.');
    if (!/^\d{1,3}(-\d{1,3})?$/.test(String(p.jeda || '5'))) CC.galat('VALIDATION', 'Jeda tidak valid.');
    var opt = {}; CC.semua(CC.T.CRM).forEach(function (k) { if (k.opt_out === 'YA') opt[CC.u.hp08(k.no_wa)] = 1; });
    var lihat = {}, ok = [], buang = { tidak_valid: 0, ganda: 0, opt_out: 0 };
    (p.penerima || []).forEach(function (r) { var h = CC.u.hp08(r.wa || r.no_wa); if (!CC.u.hpValid(h)) { buang.tidak_valid++; return; } if (lihat[h]) { buang.ganda++; return; } if (opt[h]) { buang.opt_out++; return; } lihat[h] = 1; ok.push({ nama: r.nama, wa: h, vars: r }); });
    if (!ok.length) CC.galat('VALIDATION', 'Tidak ada penerima valid.');
    if (ok.length > 5000) CC.galat('VALIDATION', 'Maksimal 5.000 penerima per blast.');
    var b = CC.tambah(ctx, CC.T.BLAST, { judul: CC.u.bersih(p.judul), pesan: p.pesan, sasaran: p.sasaran || 'CRM', total: ok.length, terkirim: 0, gagal: 0, ukuran_batch: ub, jeda_detik: String(p.jeda || '5'), status: 'Berjalan', dibuat_oleh_nama: ctx.user.nama });
    CC.tambahBanyak(ctx, CC.T.NOTIF, ok.map(function (r) { return { kanal: 'WA', tujuan: CC.u.hp62(r.wa), nama_penerima: r.nama, pesan: CC.u.isi(p.pesan, Object.assign({ institusi: CC.set('profil').brand }, r.vars, { nama: r.nama || 'Bapak/Ibu' })), event: 'BLAST', ref_id: b.id, blast_id: b.id, status: 'Antri', percobaan: 0 }; }));
    if (CC.env.antreanBaru) CC.env.antreanBaru(ok.length);
    ctx.pesan = 'Blast ' + b.id + ' dimulai: ' + ok.length + ' penerima dalam ' + Math.ceil(ok.length / ub) + ' batch.'; return { blast: b, dibuang: buang };
  }
};
CC.A['wa.blastList'] = { roles: ['ADM', 'CS', 'OPS'], fn: function () { return CC.semua(CC.T.BLAST).slice(-100).reverse().map(function (b) { var c = Object.assign({}, b); c.persen = Number(b.total) ? Math.round((Number(b.terkirim) + Number(b.gagal)) / Number(b.total) * 100) : 0; c.sisa = Number(b.total) - Number(b.terkirim) - Number(b.gagal); return c; }); } };
CC.A['wa.blastProses'] = { roles: ['ADM', 'CS'], tulis: true, cache: 'none', fn: function (ctx, p) { var r = CC.env.prosesAntrean ? CC.env.prosesAntrean({ paksa: true, blastId: p.id, hanyaBlast: true }) : {}; return { proses: r, blast: CC.cari(CC.T.BLAST, p.id) }; } };
CC.A['wa.blastStop'] = { roles: ['ADM', 'CS'], tulis: true, fn: function (ctx, p) { var sisa = CC.semua(CC.T.NOTIF).filter(function (n) { return n.blast_id === p.id && n.status === 'Antri'; }); CC.ubahBanyak(ctx, CC.T.NOTIF, sisa.map(function (n) { return { id: n.id, status: 'Batal' }; })); CC.ubah(ctx, CC.T.BLAST, p.id, { status: 'Dihentikan', selesai_pada: CC.u.dt() }, { aksi: 'STOP_BLAST' }); ctx.pesan = 'Blast dihentikan; ' + sisa.length + ' pesan dibatalkan.'; return true; } };
CC.sumberKontak = function () { return {
  pj: { tabel: CC.T.PASIEN, nama: 'nama_pj', email: 'email_pj', wa: 'no_wa_pj', segmen: 'Keluarga Pasien', info: ['nama_pasien', 'wilayah', 'status'] },
  lead: { tabel: CC.T.LEAD, nama: 'nama_kontak', email: '', wa: 'no_wa', segmen: 'Calon Klien', info: ['nama_pasien', 'status_pipeline', 'sumber_lead'] },
  perawat: { tabel: CC.T.PHC, nama: 'nama', email: 'email', wa: 'no_wa', segmen: 'Perawat', info: ['jabatan', 'wilayah', 'status'] },
  perawat_hv: { tabel: CC.T.PHV, nama: 'nama', email: 'email', wa: 'no_wa', segmen: 'Perawat HV', info: ['jabatan', 'status'] },
  pelamar: { tabel: CC.T.REKRUT, nama: 'nama', email: 'email', wa: 'kontak', segmen: 'Pelamar', info: ['posisi', 'tahap'] }
}; };
CC.syncCrm = function (ctx) {
  var lama = CC.semua(CC.T.CRM), idx = {}, baru = [], ubah = [], now = CC.u.dt();
  lama.forEach(function (k) { idx[k.sumber + ':' + k.ref_id] = k; });
  var SK = CC.sumberKontak();
  Object.keys(SK).forEach(function (kode) {
    var s = SK[kode];
    CC.aktifSaja(CC.semua(s.tabel)).forEach(function (r) {
      var nama = r[s.nama], wa = CC.u.hp08(r[s.wa]), email = s.email ? String(r[s.email] || '').trim().toLowerCase() : '';
      if (!nama && !wa) return;
      var info = {}; s.info.forEach(function (f) { info[f] = r[f]; });
      var d = { nama: nama, email: email, no_wa: wa, segmen: s.segmen, sumber: kode, ref_id: r.id, email_valid: email ? (CC.u.emailValid(email) ? 'YA' : 'TIDAK') : '', info: JSON.stringify(info) };
      var k = idx[kode + ':' + r.id];
      if (!k) baru.push(Object.assign({ tag: '', status_wa: r.status_wa || '', cek_wa_at: r.cek_wa_at || '', opt_out: 'TIDAK', catatan: '', jumlah_pesan: 0, terakhir_dihubungi: '' }, d));
      else if (['nama', 'email', 'no_wa', 'info'].some(function (f) { return String(k[f]) !== String(d[f]); })) { d.id = k.id; if (CC.u.hp08(k.no_wa) !== wa) { d.status_wa = ''; d.cek_wa_at = ''; } ubah.push(d); }
    });
  });
  if (baru.length) CC.tambahBanyak(ctx, CC.T.CRM, baru);
  if (ubah.length) CC.ubahBanyak(ctx, CC.T.CRM, ubah);
  if (CC.env.setProp) CC.env.setProp('CRM_SYNC_TERAKHIR', CC.u.dt());
  return { ditambah: baru.length, diperbarui: ubah.length, total: lama.length + baru.length };
};
CC.A['crm.sync'] = { roles: ['ADM', 'CS', 'OPS'], tulis: true, fn: function (ctx) { var r = CC.syncCrm(ctx); ctx.pesan = 'Sinkron CRM: +' + r.ditambah + ' baru, ' + r.diperbarui + ' diperbarui.'; return r; } };
CC.A['crm.list'] = {
  roles: ['ADM', 'CS', 'OPS'],
  fn: function (ctx, p) {
    var q = String(p.cari || '').toLowerCase(), semua = CC.semua(CC.T.CRM).filter(function (k) { return !/^merged/.test(k.tag); });
    var hit = {}; semua.forEach(function (k) { if (k.no_wa) hit['w' + k.no_wa] = (hit['w' + k.no_wa] || 0) + 1; if (k.email) hit['e' + k.email] = (hit['e' + k.email] || 0) + 1; });
    var rows = semua.map(function (k) { var c = Object.assign({}, k); c.info = CC.u.json(k.info, {}); c.duplikat = (k.no_wa && hit['w' + k.no_wa] > 1) || (k.email && hit['e' + k.email] > 1); return c; }).filter(function (k) {
      if (q && (k.nama + ' ' + k.email + ' ' + k.no_wa).toLowerCase().indexOf(q) === -1) return false;
      if (p.segmen && k.segmen !== p.segmen) return false; if (p.status_wa === 'belum' ? k.status_wa : p.status_wa && k.status_wa !== p.status_wa) return false;
      if (p.opt_out && k.opt_out !== 'YA') return false; if (p.duplikat && !k.duplikat) return false; if (p.tag && String(k.tag).split(',').map(function (x) { return x.trim(); }).indexOf(p.tag) === -1) return false;
      return true;
    });
    var seg = {}; semua.forEach(function (k) { seg[k.segmen] = (seg[k.segmen] || 0) + 1; });
    var hal = Number(p.halaman || 1), per = Number(p.per || 50);
    return { rows: rows.slice((hal - 1) * per, hal * per), total: rows.length, halaman: hal, segmen: seg, sync_terakhir: CC.env.getProp ? CC.env.getProp('CRM_SYNC_TERAKHIR') : '' };
  }
};
CC.A['crm.stats'] = {
  roles: ['ADM', 'CS', 'OPS'],
  fn: function () { var a = CC.semua(CC.T.CRM).filter(function (k) { return !/^merged/.test(k.tag); }), w = {}; a.forEach(function (k) { if (k.no_wa) w[k.no_wa] = (w[k.no_wa] || 0) + 1; }); var b30 = CC.u.tambahHari(CC.u.tgl(), -30); return { total: a.length, wa_valid: a.filter(function (k) { return CC.u.hpValid(k.no_wa); }).length, wa_terdaftar: a.filter(function (k) { return k.status_wa === 'Terdaftar'; }).length, email_valid: a.filter(function (k) { return k.email_valid === 'YA'; }).length, belum_cek: a.filter(function (k) { return CC.u.hpValid(k.no_wa) && !k.status_wa; }).length, opt_out: a.filter(function (k) { return k.opt_out === 'YA'; }).length, duplikat: a.filter(function (k) { return k.no_wa && w[k.no_wa] > 1; }).length, tak_terjangkau: a.filter(function (k) { return !CC.u.hpValid(k.no_wa) && k.email_valid !== 'YA'; }).length, dihubungi_30: a.filter(function (k) { return k.terakhir_dihubungi >= b30; }).length }; }
};
CC.A['crm.detail'] = {
  roles: ['ADM', 'CS', 'OPS'],
  fn: function (ctx, p) { var k = CC.cari(CC.T.CRM, p.id); if (!k) CC.galat('NOT_FOUND', 'Kontak tidak ditemukan.'); var c = Object.assign({}, k); c.info = CC.u.json(k.info, {}); var w = CC.u.hp62(k.no_wa); c.timeline = CC.semua(CC.T.NOTIF).filter(function (n) { return n.kanal !== 'INAPP' && (n.tujuan === w || (k.email && n.tujuan === k.email)); }).slice(-50).map(function (n) { return { waktu: n.dikirim_pada || n.dibuat_pada, kanal: n.kanal, ringkasan: (n.subjek ? n.subjek + ': ' : '') + String(n.pesan).slice(0, 140), status: n.status, arah: 'Keluar' }; }).concat(CC.semua(CC.T.CRMI).filter(function (i) { return i.kontak_id === k.id; }).map(function (i) { return { waktu: i.tanggal, kanal: i.kanal, ringkasan: i.ringkasan, status: 'Dicatat', arah: i.arah, oleh: i.oleh }; })).sort(function (a, b) { return a.waktu < b.waktu ? 1 : -1; }); return c; }
};
CC.A['crm.simpan'] = { roles: ['ADM', 'CS'], tulis: true, fn: function (ctx, p) { var patch = {}; ['tag', 'catatan', 'opt_out'].forEach(function (f) { if (p[f] !== undefined) patch[f] = CC.u.bersih(p[f]); }); CC.ubah(ctx, CC.T.CRM, p.id, patch, { aksi: 'CRM_UBAH' }); ctx.pesan = 'Kontak diperbarui.'; return true; } };
CC.A['crm.bulk'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) {
    var ids = p.ids || [], up = [], map = CC.peta(CC.T.CRM);
    ids.forEach(function (id) { var k = map[id]; if (!k) return; var tags = String(k.tag || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (p.aksi === 'tag' && tags.indexOf(p.nilai) === -1) up.push({ id: id, tag: tags.concat([p.nilai]).join(', ') });
      if (p.aksi === 'untag') up.push({ id: id, tag: tags.filter(function (t) { return t !== p.nilai; }).join(', ') });
      if (p.aksi === 'optout') up.push({ id: id, opt_out: 'YA' }); if (p.aksi === 'optin') up.push({ id: id, opt_out: 'TIDAK' }); });
    if (up.length) CC.ubahBanyak(ctx, CC.T.CRM, up); CC.log(ctx, 'CRM_MASSAL', CC.T.CRM, '', null, { aksi: p.aksi, jumlah: up.length }, p.nilai || '');
    ctx.pesan = up.length + ' kontak diperbarui.'; return up.length;
  }
};
CC.A['crm.interaksi'] = { roles: ['ADM', 'CS', 'OPS'], tulis: true, fn: function (ctx, p) { CC.wajib(p, ['kontak_id', 'kanal:Kanal', 'ringkasan:Ringkasan']); CC.tambah(ctx, CC.T.CRMI, { kontak_id: p.kontak_id, kanal: p.kanal, arah: p.arah || 'Keluar', ringkasan: CC.u.bersih(p.ringkasan), oleh: ctx.user.nama, tanggal: CC.u.dt() }); CC.ubah(ctx, CC.T.CRM, p.kontak_id, { terakhir_dihubungi: CC.u.dt() }, { tanpaLog: true }); ctx.pesan = 'Interaksi dicatat.'; return true; } };
CC.A['crm.import'] = {
  roles: ['ADM', 'CS'], tulis: true,
  fn: function (ctx, p) { var ada = {}; CC.semua(CC.T.CRM).forEach(function (k) { if (k.no_wa) ada[k.no_wa] = 1; }); var baru = [], lewat = 0; (p.rows || []).forEach(function (r) { var w = CC.u.hp08(r.wa || r.no_wa || r.whatsapp); if (!r.nama || !CC.u.hpValid(w) || ada[w]) { lewat++; return; } ada[w] = 1; baru.push({ nama: CC.u.bersih(r.nama), email: String(r.email || '').toLowerCase(), no_wa: w, segmen: r.segmen || 'Kontak Manual', sumber: 'manual', ref_id: w, tag: r.tag || '', opt_out: 'TIDAK', jumlah_pesan: 0, email_valid: r.email ? (CC.u.emailValid(r.email) ? 'YA' : 'TIDAK') : '' }); }); if (baru.length) CC.tambahBanyak(ctx, CC.T.CRM, baru); ctx.pesan = baru.length + ' kontak diimpor, ' + lewat + ' dilewati.'; return { ditambah: baru.length, dilewati: lewat }; }
};

/* ===================== MODUL OPSIONAL (US-61..64) ===================== */
CC.hookSimpan.penilaian = function (ctx, d) { var s = CC.u.json(d.skor_per_butir, {}); var v = Object.keys(s).map(function (k) { return Number(s[k]); }).filter(function (x) { return x > 0; }); if (v.length) d.skor_total = Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10; d.skor_per_butir = JSON.stringify(s); var t = CC.cari(CC.T.TUGAS, d.penugasan_id); if (t) { d.pasien_id = t.pasien_id; d.perawat_id = t.perawat_id; } d.diisi_oleh = ctx.user.nama; d.tanggal_nilai = d.tanggal_nilai || CC.u.tgl(); d.status = d.status || 'Tercatat'; return d; };
CC.hookList.penilaian = function (ctx, rows) { return rows.map(function (r) { var c = Object.assign({}, r); c.nama_perawat = CC.namaPerawat(r.perawat_id); c.nama_pasien = (CC.cari(CC.T.PASIEN, r.pasien_id) || {}).nama_pasien; return c; }); };
CC.hookSimpan.kunjungan = function (ctx, d, baru) { if (baru) { d.status = 'Tercatat'; d.petugas_id = d.petugas_id || ctx.user.nama; } return d; };
CC.hookList.kunjungan = function (ctx, rows) { return rows.map(function (r) { var c = Object.assign({}, r); c.nama_pasien = (CC.cari(CC.T.PASIEN, r.pasien_id) || {}).nama_pasien; c.nama_perawat = CC.namaPerawat(r.perawat_id); return c; }); };
CC.A['kunjungan.keKasus'] = { roles: ['ADM', 'KEP'], tulis: true, modul: 'kunjungan', fn: function (ctx, p) { var k = CC.cari(CC.T.KUNJ, p.id); var r = CC.A['kasus.simpan'].fn(ctx, { data: { jenis: 'Kondisi Lapangan', judul: 'Temuan kunjungan pengawasan ' + k.id, deskripsi: k.temuan + (k.tindak_lanjut ? '\nTindak lanjut: ' + k.tindak_lanjut : ''), pasien_id: k.pasien_id, perawat_id: k.perawat_id, pic: ctx.user.id, prioritas: 'Sedang' } }); CC.ubah(ctx, CC.T.KUNJ, k.id, { kasus_id: r.id }, { tanpaLog: true }); return r; } };
CC.hookSimpan.mess = function (ctx, d, baru) {
  d.biaya = CC.u.angka(d.biaya); if (baru) d.status = d.status || 'Aktif';
  if (d.jenis === 'Mess' && d.nama_mess && baru) { var cfg = (CC.set('mess') || CC.BAWAAN.mess).daftar.filter(function (m) { return m.nama === d.nama_mess; })[0]; var isi = CC.semua(CC.T.MESS).filter(function (m) { return m.jenis === 'Mess' && m.nama_mess === d.nama_mess && m.status === 'Aktif' && !m.tanggal_keluar; }).length; if (cfg && isi >= cfg.kapasitas && !d.paksa) CC.galat('CONFLICT', d.nama_mess + ' sudah penuh (' + isi + '/' + cfg.kapasitas + '). Konfirmasi untuk tetap menambahkan.'); }
  delete d.paksa; return d;
};
CC.hookList.mess = function (ctx, rows) { return rows.map(function (r) { var c = Object.assign({}, r); c.nama_perawat = CC.namaPerawat(r.perawat_id); return c; }); };
CC.usulPenalti = function (ctx, t, jenis, tgl) {
  var g = CC.gajiSetting(tgl) || CC.GAJI_USULAN, gaji = CC.u.angka(t.gaji_deal), pengali = Number(g.penalti_pengali || 0);
  var hari = Math.max(0, CC.u.selisihHari(CC.u.tambahBulan(tgl, 0).slice(0, 8) + '01', tgl)), hangus = g.penalti_hangus === 'sisa_periode' ? Math.round(gaji / (Number(g.pembagi) || 30) * hari) : 0;
  var r = CC.tambah(ctx, CC.T.PENALTI, { penugasan_id: t.id, perawat_id: t.perawat_id, jenis: jenis, tanggal_kejadian: tgl, gaji_acuan: gaji, pengali: pengali, nominal_ganti_rugi: gaji * pengali, sisa_gaji_hangus: hangus, total_penalti: gaji * pengali + hangus, status: 'Diusulkan' });
  CC.notif(ctx, 'PENALTI_USULAN', CC.penerimaUser(CC.usersPeran(['KEU', 'KEP'])), { kode: r.id, perawat: CC.namaPerawat(t.perawat_id), total: CC.u.rupiah(r.total_penalti) }, r.id);
  return r;
};
CC.hookList.penalti = function (ctx, rows) { return rows.map(function (r) { var c = Object.assign({}, r); c.nama_perawat = CC.namaPerawat(r.perawat_id); return c; }); };
/* usulan penalti dibuat lewat aksi penalti.ajukan (bukan CRUD umum) */
CC.A['penalti.ajukan'] = { roles: ['ADM', 'KEP', 'HRD'], tulis: true, modul: 'penalti', fn: function (ctx, p) { var d = p.data || {}; CC.wajib(d, ['perawat_id:Perawat', 'jenis:Jenis', 'tanggal_kejadian:Tanggal kejadian']); var t = CC.cari(CC.T.TUGAS, d.penugasan_id) || CC.semua(CC.T.TUGAS).filter(function (x) { return x.perawat_id === d.perawat_id; }).slice(-1)[0] || { id: '', perawat_id: d.perawat_id, gaji_deal: d.gaji_acuan }; var r = CC.usulPenalti(ctx, t, d.jenis, d.tanggal_kejadian); ctx.pesan = 'Usulan penalti ' + r.id + ' (' + CC.u.rupiah(r.total_penalti) + ') dibuat; menunggu keputusan Keuangan.'; return r; } };
CC.A['penalti.keputusan'] = {
  roles: ['ADM', 'KEU'], tulis: true, modul: 'penalti',
  fn: function (ctx, p) {
    var r = CC.cari(CC.T.PENALTI, p.id); if (!String(p.alasan || '').trim()) CC.galat('VALIDATION', 'Alasan keputusan wajib.', { alasan: 'Wajib' });
    if (p.status === 'Disetujui' && ctx.peran !== 'KEU') CC.galat('FORBIDDEN', 'Persetujuan penalti hanya oleh Keuangan.');
    if (['Disetujui', 'Ditolak', 'Dibebaskan'].indexOf(p.status) === -1) CC.galat('VALIDATION', 'Keputusan tidak valid.');
    var patch = { status: p.status, alasan_keputusan: p.alasan };
    if (p.status === 'Disetujui') { var k = CC.tambah(ctx, CC.T.KASBON, { perawat_id: r.perawat_id, jenis: 'Penalti', tanggal: CC.u.tgl(), nominal: CC.u.angka(r.total_penalti), cara_potong: 'Sekali', jumlah_cicilan: 1, nominal_per_periode: CC.u.angka(r.total_penalti), sisa: CC.u.angka(r.total_penalti), status: 'Disetujui', keterangan: 'Penalti kontrak ' + r.id, diajukan_oleh: 'Sistem', disetujui_oleh: ctx.user.nama }); patch.ksb_id = k.id; patch.status = 'Dipotong'; }
    CC.ubah(ctx, CC.T.PENALTI, r.id, patch, { aksi: 'KEPUTUSAN_PENALTI', ket: p.alasan }); ctx.pesan = 'Keputusan penalti: ' + patch.status + '.'; return true;
  }
};

/* ===================== IMPOR DATA AWAL (US-48, gas-migrasi-database) ===================== */
CC.ALIAS_IMPOR = {
  pasien: { nama_pasien: ['nama pasien', 'pasien', 'nama'], tgl_lahir: ['tanggal lahir', 'tgl lahir'], alamat: ['alamat'], diagnosa: ['diagnosa', 'diagnosis', 'keluhan'], nama_pj: ['nama pj', 'penanggung jawab', 'nama keluarga'], relasi_pj: ['hubungan', 'relasi'], no_wa_pj: ['no wa pj', 'no wa', 'whatsapp', 'no hp', 'telepon'], email_pj: ['email'], wilayah: ['wilayah', 'kota'] },
  perawat: { nama: ['nama', 'nama perawat', 'cg'], jabatan: ['jabatan', 'posisi'], no_wa: ['no hp', 'no wa', 'whatsapp', 'telepon'], nik: ['nik', 'no ktp'], alamat_ktp: ['alamat', 'alamat ktp'], bank_ewallet: ['bank', 'bank/ewallet', 'e-wallet'], no_rekening: ['no rekening', 'rekening', 'no rek'], nama_pemilik_rekening: ['atas nama', 'nama pemilik rekening', 'a.n'] },
  so: { tanggal: ['tanggal', 'tgl'], no_invoice: ['no invoice', 'invoice', 'nomor invoice'], nama_pasien: ['nama pasien', 'pasien', 'nama klien'], cg: ['cg', 'caregiver', 'perawat'], kontrak: ['kontrak', 'lama kontrak'], paket: ['paket', 'layanan'], status_klien: ['status klien', 'status', 'new/existing'], no_po: ['no po', 'po'], harga: ['harga'], total: ['total'], dp: ['dp'], sisa: ['sisa pembayaran', 'sisa'], uraian: ['keterangan', 'uraian', 'item'] },
  pettycash: { tanggal: ['tanggal', 'tgl'], keterangan: ['keterangan', 'uraian'], masuk: ['uang masuk', 'masuk', 'debit'], keluar: ['uang keluar', 'keluar', 'kredit'], kategori: ['kategori'] }
};
CC.petakan = function (jenis, row) { var a = CC.ALIAS_IMPOR[jenis], o = {}, kunci = {}; Object.keys(row).forEach(function (k) { kunci[String(k).toLowerCase().replace(/[_\s]+/g, ' ').trim()] = row[k]; }); Object.keys(a).forEach(function (f) { for (var i = 0; i < a[f].length; i++) if (kunci[a[f][i]] !== undefined && kunci[a[f][i]] !== '') { o[f] = kunci[a[f][i]]; break; } if (o[f] === undefined && kunci[f.replace(/_/g, ' ')] !== undefined) o[f] = kunci[f.replace(/_/g, ' ')]; }); return o; };
CC.normTgl = function (v) { if (!v) return ''; if (v instanceof Date) return CC.u.tgl(v); var s = String(v).trim(), m; if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/))) return (m[3].length === 2 ? '20' + m[3] : m[3]) + '-' + CC.u.pad(m[2], 2) + '-' + CC.u.pad(m[1], 2); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); if (/^\d{5}$/.test(s)) { var d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 864e5); return d.toISOString().slice(0, 10); } return ''; };
CC.A['impor.jalankan'] = {
  roles: ['ADM'], tulis: true,
  fn: function (ctx, p) {
    var jenis = p.jenis, dry = !!p.dry, rows = p.rows || [], lap = { jenis: jenis, dry: dry, sumber: rows.length, valid: 0, ditambah: 0, diperbarui: 0, dilewati: 0, galat: [] };
    if (!CC.ALIAS_IMPOR[jenis]) CC.galat('VALIDATION', 'Jenis impor tidak dikenal.');
    var ctxI = Object.assign({}, ctx);
    if (jenis === 'pasien') {
      var ada = {}; CC.semua(CC.T.PASIEN).forEach(function (r) { ada[String(r.nama_pasien).toLowerCase().trim() + '|' + r.tgl_lahir] = r; });
      rows.forEach(function (raw, i) { var d = CC.petakan('pasien', raw); if (!d.nama_pasien) { lap.galat.push({ baris: i + 2, pesan: 'Nama pasien kosong' }); return; } lap.valid++; d.tgl_lahir = CC.normTgl(d.tgl_lahir); var k = String(d.nama_pasien).toLowerCase().trim() + '|' + d.tgl_lahir; if (ada[k]) { lap.dilewati++; return; } ada[k] = 1; lap.ditambah++; if (!dry) CC.tambah(ctxI, CC.T.PASIEN, { nama_pasien: CC.u.bersih(d.nama_pasien), tgl_lahir: d.tgl_lahir, alamat: d.alamat || '', diagnosa: d.diagnosa || '', nama_pj: d.nama_pj || '', relasi_pj: d.relasi_pj || '', no_wa_pj: CC.u.hp08(d.no_wa_pj), no_telp_pj: CC.u.hp08(d.no_wa_pj), email_pj: d.email_pj || '', wilayah: d.wilayah || '', jenis_layanan: 'HC', status: 'Nonaktif', status_klien: 'Existing', sumber_lead: 'Impor', persetujuan_data: 'YA' }, { tanpaLog: true }); });
    }
    if (jenis === 'perawat') {
      var adaP = {}; CC.semua(CC.T.PHC).forEach(function (r) { adaP[String(r.nama).toLowerCase().trim()] = r; });
      rows.forEach(function (raw, i) { var d = CC.petakan('perawat', raw); if (!d.nama) { lap.galat.push({ baris: i + 2, pesan: 'Nama kosong' }); return; } lap.valid++; var k = String(d.nama).toLowerCase().replace(/\(.*?\)/g, '').trim(), x = adaP[k]; if (x) { var patch = {}; ['no_rekening', 'bank_ewallet', 'nama_pemilik_rekening', 'nik', 'no_wa'].forEach(function (f) { if (d[f] && !x[f]) patch[f] = f === 'no_wa' ? CC.u.hp08(d[f]) : String(d[f]); }); if (Object.keys(patch).length) { lap.diperbarui++; if (!dry) CC.ubah(ctxI, CC.T.PHC, x.id, patch, { tanpaLog: true }); } else lap.dilewati++; return; } adaP[k] = 1; lap.ditambah++; if (!dry) CC.tambah(ctxI, CC.T.PHC, { nama: CC.u.bersih(String(d.nama).replace(/\(.*?\)/g, '').trim()), jabatan: d.jabatan || 'Caregiver', no_wa: CC.u.hp08(d.no_wa), nik: d.nik ? String(d.nik) : '', alamat_ktp: d.alamat_ktp || '', bank_ewallet: d.bank_ewallet || '', no_rekening: d.no_rekening ? String(d.no_rekening) : '', nama_pemilik_rekening: d.nama_pemilik_rekening || '', status: 'Nonaktif', catatan: 'Impor' }, { tanpaLog: true }); });
    }
    if (jenis === 'so') {
      var invAda = {}; CC.semua(CC.T.INV).forEach(function (r) { invAda[r.no_invoice] = 1; }); var soAda = {}; CC.semua(CC.T.SO).forEach(function (s) { soAda[s.no_invoice + '|' + s.total] = 1; });
      var pasN = {}; CC.semua(CC.T.PASIEN).forEach(function (r) { pasN[String(r.nama_pasien).toLowerCase().trim()] = r; }); var pk = CC.semua(CC.T.PAKET), phcN = {}; CC.semua(CC.T.PHC).forEach(function (r) { phcN[String(r.nama).toLowerCase()] = r.id; });
      rows.forEach(function (raw, i) {
        var d = CC.petakan('so', raw), tg = CC.normTgl(d.tanggal), total = CC.u.angka(d.total || d.harga);
        if (!tg || !d.nama_pasien || !total) { lap.galat.push({ baris: i + 2, pesan: 'Tanggal/nama pasien/total tidak valid' }); return; }
        lap.valid++; var no = String(d.no_invoice || '').trim(); if (soAda[no + '|' + total]) { lap.dilewati++; return; } soAda[no + '|' + total] = 1; lap.ditambah++;
        if (dry) return;
        var nm = String(d.nama_pasien).toLowerCase().trim(), ps = pasN[nm]; if (!ps) { ps = CC.tambah(ctxI, CC.T.PASIEN, { nama_pasien: CC.u.bersih(d.nama_pasien), jenis_layanan: 'HC', status: 'Nonaktif', status_klien: 'Existing', sumber_lead: 'Impor', persetujuan_data: 'YA' }, { tanpaLog: true }); pasN[nm] = ps; }
        var paket = pk.filter(function (x) { return String(d.paket || '').toLowerCase().indexOf(String(x.nama_paket).toLowerCase()) > -1; })[0] || pk[0];
        var hari = Number(String(d.kontrak || '30').replace(/[^0-9]/g, '')) || 30, items = [{ jenis_item: 'Jasa Layanan', uraian: d.uraian || ('Layanan ' + (paket ? paket.nama_paket : '')), jumlah: 1, harga_satuan: total, subtotal: total }];
        var so = CC.tambah(ctxI, CC.T.SO, { tanggal: tg, periode_bulan: tg.slice(0, 7), no_urut: '', no_invoice: no, pasien_id: ps.id, perawat_id: phcN[String(d.cg || '').toLowerCase()] || '', kontrak_hari: hari, kontrak_label: d.kontrak || (hari + ' Hari'), paket_id: paket ? paket.id : '', status_klien: /exist/i.test(d.status_klien) ? 'Existing' : 'New', no_po: d.no_po || '', item: JSON.stringify(items), harga: CC.u.angka(d.harga), total: total, dp: CC.u.angka(d.dp), sisa_pembayaran: CC.u.angka(d.sisa), hpp_pokok: 0, margin: total, hpp_status: 'Estimasi', status: 'Aktif', sumber: 'Impor' }, { tanpaLog: true });
        if (no && !invAda[no]) { invAda[no] = 1; var sisa = CC.u.angka(d.sisa); CC.tambahBanyak(ctxI, CC.T.INV, [{ no_invoice: no, varian: 'Biasa', tanggal_terbit: tg, jatuh_tempo: CC.u.tambahHari(tg, 7), so_id: so.id, pasien_id: ps.id, jenis_item: 'Jasa Layanan', uraian: items[0].uraian, jumlah: 1, harga_satuan: total, subtotal: total, total_invoice: total, status_invoice: sisa <= 0 ? 'Lunas' : (total - sisa > 0 ? 'Dibayar Sebagian' : 'Terbit'), kode_verifikasi: CC.kodeAcak(12) }]); if (total - sisa > 0) CC.tambah(ctxI, CC.T.BAYAR, { no_invoice: no, tanggal_bayar: tg, jenis: sisa <= 0 ? 'Pelunasan' : 'DP', nominal: total - sisa, metode: 'Impor', dicatat_oleh: 'Impor', alasan: 'Data impor' }, { tanpaLog: true }); }
      });
    }
    if (jenis === 'pettycash') {
      var adaPc = {}; CC.semua(CC.T.PC).forEach(function (r) { adaPc[r.tanggal + '|' + r.keterangan + '|' + r.nominal] = 1; });
      rows.forEach(function (raw, i) { var d = CC.petakan('pettycash', raw), tg = CC.normTgl(d.tanggal), m = CC.u.angka(d.masuk), k = CC.u.angka(d.keluar); if (!tg || (!m && !k)) { if (raw && Object.keys(raw).length) lap.galat.push({ baris: i + 2, pesan: 'Tanggal atau nominal tidak valid' }); return; } lap.valid++; var tipe = m ? 'Masuk' : 'Keluar', nom = m || k, kunci = tg + '|' + d.keterangan + '|' + nom; if (adaPc[kunci]) { lap.dilewati++; return; } adaPc[kunci] = 1; lap.ditambah++; if (!dry) CC.tambah(ctxI, CC.T.PC, { tanggal: tg, tipe: tipe, kategori: d.kategori || '', pengaju_nama: 'Impor', nominal: nom, keterangan: CC.u.bersih(String(d.keterangan || '')), status: tipe === 'Masuk' ? 'Tercatat' : 'Dibayarkan' }, { tanpaLog: true }); });
    }
    if (!dry) CC.log(ctx, 'IMPOR', jenis, '', null, { ditambah: lap.ditambah, diperbarui: lap.diperbarui, dilewati: lap.dilewati, galat: lap.galat.length }, 'Impor data awal');
    ctx.pesan = dry ? 'Dry-run selesai — tidak ada data yang ditulis.' : 'Impor selesai: +' + lap.ditambah + ', diperbarui ' + lap.diperbarui + ', dilewati ' + lap.dilewati + '.';
    return lap;
  }
};

/* ===================== PEKERJAAN TERJADWAL (Bagian 4.6) ===================== */
CC.sudahNotif = function (event, ref) { return CC.semua(CC.T.NOTIF).some(function (n) { return n.event === event && n.ref_id === ref; }); };
CC.jalankanTerjadwal = function (jenis) {
  var ctx = { user: { id: 'SISTEM', nama: 'Sistem', role: 'ADM', sub_role: '' }, peran: 'ADM' }, hasil = {}, now = CC.u.dt(), hari = CC.u.tgl();
  if (!jenis || jenis === 'sla') {
    var ov = []; CC.daftarKasus(ctx).forEach(function (k) { if (k.status === 'Overdue') { var asli = CC.cari(CC.T.KASUS, k.id); if (asli.status !== 'Overdue') ov.push({ id: k.id, status: 'Overdue' }); if (!CC.sudahNotif('KASUS_OVERDUE', k.id)) CC.notif(ctx, 'KASUS_OVERDUE', CC.penerimaUser(CC.usersPeran(['ADM'])), { kode: k.id, judul: k.judul, tenggat: k.sla_tenggat, pic: k.pic_nama }, k.id); } });
    if (ov.length) CC.ubahBanyak(ctx, CC.T.KASUS, ov); hasil.overdue = ov.length;
  }
  if (!jenis || jenis === 'pengingat') {
    var n = 0; [CC.u.tambahHari(hari, -1), hari].forEach(function (h) { CC.laporanBelumMasuk(h).forEach(function (b) {
      var ref1 = 'REM1|' + b.pasien_id + '|' + h + '|' + b.shift, ref3 = 'REM3|' + b.pasien_id + '|' + h + '|' + b.shift, refE = 'ESK|' + b.pasien_id + '|' + h + '|' + b.shift, u = CC.userPerawat(b.perawat_id), v = { pasien: b.nama_pasien, shift: CC.shiftInfo(b.shift).label, tanggal: CC.u.tglPanjang(h), batas: b.batas.slice(11), perawat: b.nama_perawat };
      if (b.telat_jam >= 1 && !CC.sudahNotif('LAPORAN_PENGINGAT', ref1)) { CC.notif(ctx, 'LAPORAN_PENGINGAT', [{ nama: b.nama_perawat, wa: b.no_wa, user_id: u ? u.id : '' }], v, ref1); n++; }
      else if (b.telat_jam >= 3 && !CC.sudahNotif('LAPORAN_PENGINGAT', ref3)) { CC.notif(ctx, 'LAPORAN_PENGINGAT', [{ nama: b.nama_perawat, wa: b.no_wa, user_id: u ? u.id : '' }], v, ref3); n++; }
      if (b.telat_jam >= 3.5 && !CC.sudahNotif('LAPORAN_ESKALASI', refE)) { CC.notif(ctx, 'LAPORAN_ESKALASI', CC.penerimaUser(CC.usersPeran(['KEP'])), v, refE); n++; }
    }); }); hasil.pengingat = n;
  }
  if (!jenis || jenis === 'harian') {
    var op = CC.set('operasional');
    CC.semua(CC.T.LEAD).forEach(function (l) { if ((l.status_pipeline === 'Lead Masuk' || l.status_pipeline === 'Follow-up') && CC.u.selisihJam(l.followup_terakhir || l.tanggal_masuk, now) > op.followup_hari * 24 && !CC.sudahNotif('LEAD_2HARI', l.id + '|' + hari)) { var pic = CC.cari(CC.T.USER, l.pic_cs); CC.notif(ctx, 'LEAD_2HARI', CC.penerimaUser(pic ? [pic] : CC.usersPeran(['CS'])).concat(CC.penerimaUser(CC.usersPeran(['OPS']))), { kode: l.id, kontak: l.nama_kontak, terakhir: CC.u.tglPanjang(l.followup_terakhir || l.tanggal_masuk) }, l.id + '|' + hari); } });
    CC.daftarKasus(ctx).forEach(function (k) { if (k.status !== 'Selesai' && k.status !== 'Dibatalkan' && k.umur_hari >= op.kasus_ingat_hari && !CC.sudahNotif('KASUS_3HARI', k.id + '|' + hari)) CC.notif(ctx, 'KASUS_3HARI', CC.penerimaUser(CC.usersPeran([k.divisi_asal === 'HV' ? 'HVK' : 'KEP'])), { kode: k.id, judul: k.judul, hari: k.umur_hari }, k.id + '|' + hari); });
    hasil.perpanjangan = CC.siapkanPerpanjangan(ctx);
    CC.ringkasInvoice().forEach(function (i) { if (i.terlambat && !CC.sudahNotif('INVOICE_JATUH_TEMPO', i.no_invoice + '|' + hari)) CC.notif(ctx, 'INVOICE_JATUH_TEMPO', CC.penerimaUser(CC.usersPeran(['CS', 'KEU'])), { no: i.no_invoice, pasien: i.nama_pasien, sisa: CC.u.rupiah(i.sisa), tempo: CC.u.tglPanjang(i.jatuh_tempo) }, i.no_invoice + '|' + hari); });
    CC.semua(CC.T.IDF).forEach(function (f) { if (f.status === 'Draft' && CC.u.selisihJam(f.tanggal_diminta, now) > op.idf_ingat_hari * 24 && !CC.sudahNotif('IDF_DIMINTA', f.id + '|' + hari)) { var pr = CC.cari(CC.T.PHC, f.perawat_id), u = CC.userPerawat(f.perawat_id); if (pr) CC.notif(ctx, 'IDF_DIMINTA', [{ nama: pr.nama, wa: pr.no_wa, user_id: u ? u.id : '' }], { pasien: (CC.cari(CC.T.PASIEN, f.pasien_id) || {}).nama_pasien, alasan: 'Pengingat: ' + f.alasan }, f.id + '|' + hari); } });
    if (CC.env.now().getDate() >= 15) { var tg = CC.capaianTarget(CC.u.bulan()), up = []; tg.forEach(function (t) { if (!t.tercapai && t.notif_minggu3_terkirim !== 'YA') { CC.notif(ctx, 'TARGET_MINGGU3', CC.penerimaUser(CC.usersPeran(['ADM'])), { periode: t.periode, indikator: t.indikator, divisi: t.divisi, persen: t.persen }, t.id); up.push({ id: t.id, notif_minggu3_terkirim: 'YA' }); } }); if (up.length) CC.ubahBanyak(ctx, CC.T.TARGET, up); hasil.target = up.length; }
    try { hasil.gaji = CC.tutupPeriodeGaji(); } catch (eg) { hasil.gaji = 'gagal: ' + eg.message; }
    if (!CC.semua(CC.T.REKAP).some(function (r) { return r.tanggal === hari; })) { var d = CC.A['ops.harian'].fn(ctx, {}); CC.tambah(ctx, CC.T.REKAP, Object.assign({ tanggal: hari, catatan_eksekutif: '', dibuat_oleh: 'Sistem (06.00)' }, d.angka), { tanpaLog: true }); hasil.rekap = 1; }
  }
  return hasil;
};
CC.A['sistem.terjadwal'] = { roles: ['ADM'], tulis: true, fn: function (ctx, p) { var r = CC.jalankanTerjadwal(p.jenis); ctx.pesan = 'Pekerjaan terjadwal dijalankan.'; return r; } };

/* ===================== BERKAS PRIVAT & ASET BRAND ===================== */
/* Berkas pasien/perawat disimpan privat (drive:<id>) dan hanya dibuka lewat aplikasi setelah login. */
CC.A['berkas.ambil'] = {
  roles: ['ADM', 'PRW', 'KEP', 'HV', 'CS', 'HRD', 'OPS', 'KEU'],
  fn: function (ctx, p) { var u = String(p.url || ''); if (!/^drive:[A-Za-z0-9_-]{10,}$/.test(u)) return { data: u }; if (!CC.env.ambilBerkas) CC.galat('NOT_FOUND', 'Berkas tidak tersedia.'); return { data: CC.env.ambilBerkas(u) }; }
};
CC.A['aset.unggah'] = {
  roles: ['ADM'], tulis: true, cache: 'none',
  fn: function (ctx, p) {
    var d = String(p.data || ''); if (!/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(d)) CC.galat('VALIDATION', 'Jenis berkas harus PNG, JPG, WebP, atau SVG.');
    if (d.length > 700000) CC.galat('VALIDATION', 'Ukuran gambar maksimal ±500 KB setelah kompresi.');
    if (/svg/.test(d.slice(0, 30))) { var txt = ''; try { txt = CC.env.unb64(d.split(',')[1]); } catch (e) { } if (/<script|\son\w+\s*=|javascript:/i.test(txt)) CC.galat('VALIDATION', 'SVG berisi skrip tidak diizinkan.'); }
    var r = CC.env.simpanAset ? CC.env.simpanAset(d, String(p.nama || 'aset').replace(/[^\w.-]/g, '_')) : { url: d };
    CC.log(ctx, 'UNGGAH_ASET', 'Aset_Brand', r.url.slice(0, 40), null, null, p.nama || '');
    return r;
  }
};
CC.brandingSiap = function (b) { b = Object.assign({}, b); CC.ASET_BRAND.forEach(function (k) { if (/^drive:/.test(b[k] || '') && CC.env.ambilAsetPublik) b[k] = CC.env.ambilAsetPublik(b[k]); }); return b; };
CC._pascaMuat = CC._pascaMuat || []; CC._pascaMuat.push(function () { var tema = CC.A['publik.tema'].fn, boot = CC.A['auth.boot'].fn; CC.A['publik.tema'].fn = function (ctx, p) { var r = tema(ctx, p); r.branding = CC.brandingSiap(r.branding); return r; }; CC.A['auth.boot'].fn = function (ctx, p) { var r = boot(ctx, p); r.branding = CC.brandingSiap(r.branding); return r; }; });

/* Penutupan periode gaji otomatis (Bagian 4.6): tanggal 1–2 → draf penggajian bulan lalu */
CC.tutupPeriodeGaji = function () {
  var d = CC.env.now(); if (d.getDate() > 2) return 0;
  var per = CC.u.bulan(CC.u.parse(CC.u.tambahBulan(CC.u.bulan() + '-01', -1))), rows = CC.aktifSaja(CC.semua(CC.T.GAJI)).filter(function (r) { return r.periode_kode === per; });
  if (rows.some(function (r) { return r.status_hitung !== 'Draf'; })) return 0;
  var ctx = { user: { id: 'SISTEM', nama: 'Sistem', role: 'KEU', sub_role: '' }, peran: 'KEU' };
  CC.A['gaji.hitung'].fn(ctx, { periode: per }); return 1;
};
CC.A['sistem.segarkan'] = { roles: ['ADM'], fn: function (ctx) { if (CC.env.bersihkanCache) CC.env.bersihkanCache(); return { ok: true, pesan: 'Cache server dibersihkan; data dibaca ulang dari Google Sheets.' }; } };
CC.A['notif.kuras'] = { roles: '*', tulis: true, cache: 'none', fn: function (ctx) { return CC.env.prosesAntrean ? CC.env.prosesAntrean({ maks: 15 }) : { terkirim: 0 }; } };
