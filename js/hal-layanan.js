/* =====================================================================
 * CAPTEN CARE — LAYANAN PERAWATAN
 * Laporan Harian HC (form A–H + monitoring), Riwayat Saya,
 * Identifikasi Pasien (handover), Home Visit (consent → tindakan).
 * ===================================================================== */
(function () {
  'use strict';
  var A = window.CCApp, U = A.U, ic = A.ic, UI = A.UI, G = A.G, Q = A.Q, T = A.T, R = A.Router, qs = A.qs, qsa = A.qsa, e = U.e;
  A.F = A.F || {};

  /* ---------- berkas & gambar (Drive di mode live, data URL di mode demo) ---------- */
  A.F.gambar = function (url, alt, kelas) {
    if (!url) return '<div class="foto-dok ' + (kelas || '') + '" style="display:grid;place-items:center;color:var(--redup-2)">' + ic('image-off', 'b') + '</div>';
    if (/^drive:/.test(url)) return '<div class="foto-dok ' + (kelas || '') + '"><img data-berkas="' + e(url) + '" alt="' + e(alt || '') + '" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" style="background:#EEF2F6"></div>';
    if (url === 'ttd-demo' || url === 'bukti-demo') url = 'assets/ilustrasi/dok-sesudah.svg';
    return '<div class="foto-dok ' + (kelas || '') + '"><img src="' + e(url) + '" alt="' + e(alt || '') + '" loading="lazy"></div>';
  };
  A.F.muatBerkas = function (akar) { qsa('img[data-berkas]', akar).forEach(function (im) { var u = im.dataset.berkas; im.removeAttribute('data-berkas'); Q('berkas.ambil', { url: u }, { ttl: 600000 }).then(function (d) { if (d && d.data) im.src = d.data; }).catch(function () { }); }); };

  /* ===================== LAPORAN HARIAN A–H ===================== */
  var BAB = ['Tidak BAB', '1 kali', '2 kali', '3 kali atau lebih', 'Diare'], BAK = ['1–3 kali', '4–6 kali', '7–9 kali', '≥ 10 kali', 'Via kateter'], MAKAN = ['Habis', 'Sebagian', 'Sedikit', 'Tidak makan', 'Via NGT', 'Puasa'];
  var KONDISI = ['Stabil', 'Perlu pemantauan', 'Mengalami perubahan kondisi'];
  function seksi(h, judul, isi, ekstra) { return '<section class="seksi-lap" data-seksi="' + h + '"><header><span class="hr">' + h + '</span><b class="tumbuh">' + e(judul) + '</b>' + (ekstra || '') + '<span class="lencana netral" data-status-seksi><i></i>Belum</span></header><div class="badan">' + isi + '</div></section>'; }
  function yt(nama, nilai, tiga) { return '<span class="yt"><label><input type="radio" name="' + nama + '" value="Y"' + (nilai === 'Y' ? ' checked' : '') + '><span class="y">Ya</span></label><label><input type="radio" name="' + nama + '" value="T"' + (nilai === 'T' ? ' checked' : '') + '><span class="t">Tidak</span></label>' + (tiga ? '<label><input type="radio" name="' + nama + '" value="N"' + (nilai === 'N' ? ' checked' : '') + '><span class="n">N/A</span></label>' : '') + '</span>'; }
  function opsi(arr, v) { return '<option value="">— Pilih —</option>' + arr.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + e(x) + '</option>'; }).join(''); }
  function fld(k, label, inp, lebar, bantu) { return '<div class="fld ' + (lebar || '') + '" data-k="' + k + '"><label>' + label + '</label>' + inp + (bantu ? '<span class="bantu">' + bantu + '</span>' : '') + '<span class="galat"></span></div>'; }
  function htmlFormLaporan(kw, f, isi) {
    isi = isi || {}; var B = isi.B || [], Bk = isi.Bket || {}, C = isi.C || {}, D = isi.D || {}, E = isi.E || [], F = isi.F || {}, Gg = isi.G || {}, H = isi.H || {}, info = kw.info || {};
    var obat = (D.obat && D.obat.length ? D.obat : (info.obat || []).map(function (o) { return { nama: o.nama, dosis: o.dosis, jam: o.jam }; })), ins = (D.insulin && D.insulin.length ? D.insulin : (info.insulin || []).map(function (o) { return { nama: o.nama, dosis: o.dosis, jam: o.jam }; })), alat = info.alat || [];
    var h = seksi('A', 'Identitas & informasi klinis', '<div class="info-grid"><div><dt>Pasien</dt><dd>' + e(kw.nama_pasien) + (kw.usia ? ' · ' + e(kw.usia) + ' th' : '') + '</dd></div><div><dt>Shift · tanggal</dt><dd>' + e(kw.shift_label) + ' · ' + U.tglP(kw.tanggal) + '</dd></div><div class="penuh"><dt>Diagnosa</dt><dd>' + e(kw.diagnosa) + '</dd></div><div class="penuh"><dt>Alamat</dt><dd>' + e(kw.alamat || '—') + '</dd></div><div><dt>Penanggung jawab</dt><dd>' + e(kw.nama_pj || '—') + (kw.relasi_pj ? ' (' + e(kw.relasi_pj) + ')' : '') + '</dd></div><div><dt>Laporan dikirim ke</dt><dd class="kecil">' + e(kw.penerima || '—') + '</dd></div></div>' +
      (info.alergi ? '<div class="panel-bahaya mt-12">' + ic('triangle-alert', 'k') + '<div><b>Alergi:</b> ' + e(info.alergi) + '</div></div>' : '') +
      '<div class="baris bungkus mt-12">' + (info.risiko_jatuh ? '<span class="tag">' + ic('person-standing', 'k') + ' Risiko jatuh ' + e(info.risiko_jatuh) + ' (Morse)</span>' : '') + (info.diet ? '<span class="tag">' + ic('utensils', 'k') + ' ' + e(info.diet) + '</span>' : '') + (info.golongan_darah ? '<span class="tag">' + ic('droplet', 'k') + ' ' + e(info.golongan_darah) + '</span>' : '') + (info.mr ? '<span class="tag mono">' + e(info.mr) + '</span>' : '') + alat.map(function (a) { return '<span class="tag merek">' + ic('cable', 'k') + ' ' + e(a.nama) + (a.ukuran ? ' ' + e(a.ukuran) : '') + (a.ganti ? ' · ganti ' + U.tglK(a.ganti) : '') + '</span>'; }).join('') + '</div>', '');
    h += seksi('B', 'Aktivitas dasar (ADL)', (f.B || []).map(function (x, i) { var v = B[i]; return '<div class="cek-baris fld" data-k="B' + i + '" style="display:flex;flex-direction:row"><span class="redup angka" style="width:22px">' + (i + 1) + '.</span><div class="tumbuh"><div>' + e(x) + '</div><input class="inp kecil mt-4' + (v === 'T' ? '' : ' sembunyi') + '" name="Bket_' + i + '" placeholder="Alasan tidak dilakukan (mis. pasien tertidur)" value="' + e(Bk[i] || '') + '"><span class="galat"></span></div>' + yt('B_' + i, v) + '</div>'; }).join('') + '<div class="baris mt-8"><button type="button" class="btn mini" data-a="semua-ya">' + ic('check-check', 'k') + 'Tandai semua "Ya"</button></div>');
    h += seksi('C', 'Tanda-tanda vital', '<div class="form">' + fld('tensi', 'Tekanan darah <span class="redup">(mmHg)</span>', '<input class="inp angka" name="C_tensi" inputmode="numeric" placeholder="120/80" value="' + e(C.tensi || '') + '">', 'l2') + fld('nadi', 'Nadi <span class="redup">(x/mnt)</span>', '<input class="inp angka" name="C_nadi" type="number" inputmode="numeric" placeholder="80" value="' + e(C.nadi || '') + '">', 'l2') + fld('suhu', 'Suhu <span class="redup">(°C)</span>', '<input class="inp angka" name="C_suhu" type="number" step="0.1" inputmode="decimal" placeholder="36.5" value="' + e(C.suhu || '') + '">', 'l2') + fld('spo2', 'SpO₂ <span class="redup">(%)</span>', '<input class="inp angka" name="C_spo2" type="number" inputmode="numeric" placeholder="98" value="' + e(C.spo2 || '') + '">', 'l2') + fld('gds', 'GDS <span class="redup">(mg/dL)</span>', '<input class="inp angka" name="C_gds" type="number" inputmode="numeric" placeholder="' + (ins.length ? 'wajib — pasien insulin' : 'opsional') + '" value="' + e(C.gds || '') + '">', 'l2') + '</div><div data-peringatan-ttv class="mt-8"></div>');
    h += seksi('D', 'Pemberian obat', (obat.length || ins.length ? '' : '<p class="redup kecil">Tidak ada jadwal obat tercatat. Tambahkan catatan di bagian F bila ada obat yang diberikan.</p>') + obat.map(function (o, i) { return '<div class="cek-baris"><span class="ikon-ov" style="width:30px;height:30px">' + ic('pill', 'k') + '</span><div class="tumbuh"><b>' + e(o.nama) + '</b> <span class="redup">' + e(o.dosis || '') + '</span><div class="kecil redup">Jam ' + e(o.jam || '—') + '</div></div>' + yt('D_o_' + i, o.v) + '</div>'; }).join('') + ins.map(function (o, i) { return '<div class="cek-baris"><span class="ikon-ov warn" style="width:30px;height:30px">' + ic('syringe', 'k') + '</span><div class="tumbuh"><b>' + e(o.nama) + '</b> <span class="redup">' + e(o.dosis || '') + '</span><div class="kecil redup">Insulin · jam ' + e(o.jam || '—') + '</div></div>' + yt('D_i_' + i, o.v) + '</div>'; }).join(''));
    if (alat.length) h += seksi('E', 'Perawatan alat medis', '<div class="pilihan-kartu" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">' + (f.E || []).map(function (x, i) { return '<label><input type="checkbox" name="E_' + i + '"' + (E[i] === 'Y' ? ' checked' : '') + '>' + ic('check', 'k') + e(x) + '</label>'; }).join('') + '</div>');
    h += seksi('F', 'Eliminasi, nutrisi & catatan', '<div class="form">' + fld('bab', 'BAB', '<select class="inp" name="F_bab">' + opsi(BAB, F.bab) + '</select>', 'l2') + fld('bab_ket', 'Konsistensi BAB', '<input class="inp" name="F_bab_ket" placeholder="mis. lunak" value="' + e(F.bab_ket || '') + '">', 'l4') + fld('bak', 'BAK', '<select class="inp" name="F_bak">' + opsi(BAK, F.bak) + '</select>', 'l2') + fld('bak_ket', 'Warna / volume urine', '<input class="inp" name="F_bak_ket" placeholder="mis. kuning jernih, ±1.200 ml" value="' + e(F.bak_ket || '') + '">', 'l4') +
      fld('makan_pagi', 'Makan pagi', '<select class="inp" name="F_makan_pagi">' + opsi(MAKAN, F.makan_pagi) + '</select>', 'l2') + fld('makan_siang', 'Makan siang', '<select class="inp" name="F_makan_siang">' + opsi(MAKAN, F.makan_siang) + '</select>', 'l2') + fld('makan_malam', 'Makan malam', '<select class="inp" name="F_makan_malam">' + opsi(MAKAN, F.makan_malam) + '</select>', 'l2') + fld('minum', 'Minum <span class="redup">(ml)</span>', '<input class="inp" name="F_minum" placeholder="mis. 1.200 ml" value="' + e(F.minum || '') + '">', 'l2') +
      fld('keluhan', 'Keluhan pasien', '<input class="inp" name="F_keluhan" placeholder="Tidak ada keluhan berarti" value="' + e(F.keluhan || '') + '">', 'l4') + fld('kejadian', 'Kejadian khusus', '<textarea class="inp" name="F_kejadian" rows="2" placeholder="mis. hampir jatuh saat transfer ke kursi roda">' + e(F.kejadian || '') + '</textarea>', 'l3') + fld('saran', 'Saran / rencana shift berikutnya', '<textarea class="inp" name="F_saran" rows="2" placeholder="mis. lanjutkan alih baring tiap 2 jam">' + e(F.saran || '') + '</textarea>', 'l3') + '</div>');
    h += seksi('G', 'Kondisi pasien', '<div class="fld" data-k="kondisi_pasien"><div class="pilihan-kartu">' + KONDISI.map(function (k, i) { return '<label><input type="radio" name="G_kondisi" value="' + k + '"' + (Gg.kondisi === k ? ' checked' : '') + '><span class="tingkat ' + ['normal', 'peringatan', 'kritis'][i] + '"></span>' + e(k) + '</label>'; }).join('') + '</div><span class="galat"></span></div><div class="fld mt-12' + (Gg.kondisi && Gg.kondisi !== 'Stabil' ? '' : ' sembunyi') + '" data-k="keterangan_kondisi"><label>Jelaskan perubahan / hal yang perlu dipantau <span class="wajib">*</span></label><textarea class="inp" name="G_ket" rows="3" placeholder="mis. TD 160/95 sejak sore, pusing, sudah lapor dokter keluarga">' + e(Gg.ket || '') + '</textarea><span class="bantu">Koordinator keperawatan langsung mendapat notifikasi.</span><span class="galat"></span></div>');
    h += seksi('H', 'Pengesahan', '<div class="form">' + fld('h_nama', 'Nama keluarga yang mengetahui <span class="redup">(opsional)</span>', '<input class="inp" name="H_nama" placeholder="mis. Bpk. Irfan Dahlan" value="' + e(H.nama || '') + '">') + fld('catatan_tambahan', 'Catatan tambahan untuk keluarga', '<textarea class="inp" name="catatan_tambahan" rows="2" placeholder="Opsional — ikut terkirim ke penanggung jawab">' + e(isi.catatan_tambahan || '') + '</textarea>') + '<div class="fld" data-k="ttd"><label>Tanda tangan perawat</label><canvas class="ttd-kanvas" data-ttd></canvas><div class="baris rata"><span class="bantu">Tanda tangan dengan jari / mouse di kotak.</span><button type="button" class="btn mini hantu" data-a="hapus-ttd">' + ic('eraser', 'k') + 'Hapus</button></div></div></div>');
    return h;
  }
  function bacaLaporan(el, f, kw) {
    var v = UI.bacaForm(el), info = kw.info || {}, isian = { B: [], Bket: {}, C: {}, D: { obat: [], insulin: [] }, E: null, F: {}, G: {}, H: {} };
    (f.B || []).forEach(function (x, i) { isian.B[i] = v['B_' + i] || ''; if (v['B_' + i] === 'T' && v['Bket_' + i]) isian.Bket[i] = v['Bket_' + i]; });
    ['tensi', 'nadi', 'suhu', 'spo2', 'gds'].forEach(function (k) { isian.C[k] = v['C_' + k] === '' || v['C_' + k] == null ? '' : String(v['C_' + k]); });
    (info.obat || []).forEach(function (o, i) { isian.D.obat.push({ nama: o.nama, dosis: o.dosis, jam: o.jam, v: v['D_o_' + i] || '' }); });
    (info.insulin || []).forEach(function (o, i) { isian.D.insulin.push({ nama: o.nama, dosis: o.dosis, jam: o.jam, v: v['D_i_' + i] || '' }); });
    if ((info.alat || []).length) isian.E = (f.E || []).map(function (x, i) { return v['E_' + i] ? 'Y' : ''; });
    ['bab', 'bab_ket', 'bak', 'bak_ket', 'makan_pagi', 'makan_siang', 'makan_malam', 'minum', 'keluhan', 'kejadian', 'saran'].forEach(function (k) { isian.F[k] = v['F_' + k] || ''; });
    isian.G = { kondisi: v.G_kondisi || '', ket: v.G_kondisi && v.G_kondisi !== 'Stabil' ? v.G_ket || '' : '' };
    isian.H = { nama: v.H_nama || '' };
    return { isian: isian, catatan: v.catatan_tambahan || '' };
  }
  function cekTtv(el) {
    var g = function (n) { var i = qs('[name=C_' + n + ']', el); return i ? i.value : ''; }, w = [], t = String(g('tensi')).split('/'), s = +t[0], d = +t[1];
    if (s && (s >= 140 || s < 90)) w.push('Tekanan darah ' + g('tensi') + ' di luar rentang normal');
    if (d && (d >= 90 || d < 60) && !(s >= 140)) w.push('Diastolik ' + d + ' mmHg perlu diperhatikan');
    if (+g('nadi') && (+g('nadi') > 100 || +g('nadi') < 60)) w.push('Nadi ' + g('nadi') + '×/mnt');
    if (+g('suhu') && +g('suhu') >= 37.5) w.push('Suhu ' + g('suhu') + '°C (subfebris/demam)');
    if (+g('spo2') && +g('spo2') < 95) w.push('SpO₂ ' + g('spo2') + '% di bawah 95%');
    if (+g('gds') && (+g('gds') > 200 || +g('gds') < 70)) w.push('GDS ' + g('gds') + ' mg/dL');
    var box = qs('[data-peringatan-ttv]', el); if (box) box.innerHTML = w.length ? '<div class="panel-peringatan">' + ic('heart-pulse', 'k') + '<div><b>Perhatikan:</b> ' + e(w.join(' · ')) + '. Bila menetap, pilih kondisi <b>Perlu pemantauan</b> di bagian G.</div></div>' : '';
  }
  function statusSeksi(el, f) {
    var v = UI.bacaForm(el), ok = {};
    ok.A = true;
    ok.B = (f.B || []).every(function (x, i) { return v['B_' + i]; });
    ok.C = ['tensi', 'nadi', 'suhu', 'spo2'].every(function (k) { return v['C_' + k] !== '' && v['C_' + k] != null; });
    ok.D = qsa('[data-seksi=D] .yt', el).every(function (y) { return qs('input:checked', y); });
    ok.E = true; ok.H = true;
    ok.F = ['bab', 'bak', 'makan_pagi', 'makan_siang', 'makan_malam'].every(function (k) { return v['F_' + k]; });
    ok.G = !!v.G_kondisi && (v.G_kondisi === 'Stabil' || !!v.G_ket);
    var n = 0, tot = 0;
    var akar = el.closest('.lembar');
    qsa('[data-seksi]', el).forEach(function (s) { var k = s.dataset.seksi, b = qs('[data-status-seksi]', s); tot++; if (ok[k]) n++; if (b) { b.className = 'lencana ' + (ok[k] ? 'ok' : 'netral'); b.innerHTML = '<i></i>' + (ok[k] ? 'Lengkap' : 'Belum'); } var nb = akar && qs('.seksi-nav [data-nav="' + k + '"]', akar); if (nb) { nb.classList.toggle('ok', !!ok[k]); if (ok[k]) nb.classList.remove('salah'); } });
    var p = akar && qs('[data-progres-lap]', akar); if (p) { p.querySelector('i').style.width = Math.round(n / tot * 100) + '%'; var t = qs('[data-progres-teks]', akar); if (t) t.textContent = n + '/' + tot + ' bagian lengkap'; }
    return n === tot;
  }
  function pasangFormLaporan(el, f) {
    UI.pasangForm(el); var ttd = UI.ttd(qs('[data-ttd]', el));
    el.addEventListener('change', function (ev) {
      var t = ev.target;
      if (/^B_\d+$/.test(t.name)) { var k = qs('[name=Bket_' + t.name.slice(2) + ']', el); if (k) k.classList.toggle('sembunyi', t.value !== 'T'); var fl = t.closest('.fld'); if (fl) fl.classList.remove('salah'); }
      if (t.name === 'G_kondisi') { qs('[data-k=keterangan_kondisi]', el).classList.toggle('sembunyi', t.value === 'Stabil'); qs('[data-k=kondisi_pasien]', el).classList.remove('salah'); }
      statusSeksi(el, f);
    });
    el.addEventListener('input', U.debounce(function (ev) { if (/^C_/.test(ev.target.name)) cekTtv(el); statusSeksi(el, f); }, 150));
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-a=semua-ya]')) { qsa('[data-seksi=B] input[value=Y]', el).forEach(function (r) { r.checked = true; }); qsa('[name^=Bket_]', el).forEach(function (i) { i.classList.add('sembunyi'); }); qsa('[data-seksi=B] .fld.salah', el).forEach(function (x) { x.classList.remove('salah'); }); statusSeksi(el, f); }
      if (ev.target.closest('[data-a=hapus-ttd]')) ttd.hapus();
    });
    cekTtv(el); statusSeksi(el, f);
    return ttd;
  }
  /* Kunci draf lokal (sessionStorage: hilang saat tab ditutup — tidak menyimpan data kesehatan permanen di perangkat) */
  function kunciDraf(kw) { return 'cc_draf_lap_' + kw.pasien_id + '_' + kw.shift + '_' + kw.tanggal; }

  /* ---------- Lembar kerja A–H per bagian (Clinical Assist): tidak ada form panjang ke bawah ---------- */
  var NAMA_SEKSI = { A: 'Identitas', B: 'ADL', C: 'TTV', D: 'Obat', E: 'Alat medis', F: 'Eliminasi & nutrisi', G: 'Kondisi', H: 'Pengesahan' };
  function navSeksi(form) { return '<nav class="seksi-nav" aria-label="Bagian laporan">' + qsa('[data-seksi]', form).map(function (s) { var k = s.dataset.seksi; return '<button type="button" data-nav="' + k + '"><span class="h">' + k + '</span>' + e(NAMA_SEKSI[k] || k) + '</button>'; }).join('') + '</nav>'; }
  function pasangSeksi(lembar, form) {
    var urut = qsa('[data-seksi]', form).map(function (s) { return s.dataset.seksi; }), kini = urut[0];
    function tampil(k, gulir) {
      kini = k; qsa('[data-seksi]', form).forEach(function (s) { var on = s.dataset.seksi === k; s.classList.toggle('tutup', !on); s.classList.remove('buka-anim'); if (on) { void s.offsetWidth; s.classList.add('buka-anim'); } });
      qsa('.seksi-nav [data-nav]', lembar).forEach(function (b) { b.classList.toggle('aktif', b.dataset.nav === k); if (b.dataset.nav === k && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
      var i = urut.indexOf(k), sb = qs('[data-sebelum]', lembar), sl = qs('[data-lanjut]', lembar);
      if (sb) sb.disabled = i <= 0; if (sl) { sl.disabled = i >= urut.length - 1; sl.classList.toggle('sembunyi', i >= urut.length - 1); }
      if (gulir) { var r = lembar.getBoundingClientRect(); if (r.top < 60) window.scrollBy({ top: r.top - 76, behavior: 'smooth' }); }
      if (k === 'H') setTimeout(function () { window.dispatchEvent(new Event('ttd-ukur')); }, 30);
    }
    lembar.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-nav]'); if (b) return tampil(b.dataset.nav, true);
      if (ev.target.closest('[data-sebelum]')) return tampil(urut[Math.max(0, urut.indexOf(kini) - 1)], true);
      if (ev.target.closest('[data-lanjut]')) return tampil(urut[Math.min(urut.length - 1, urut.indexOf(kini) + 1)], true);
    });
    tampil(kini);
    return { tampil: tampil, keGalat: function () { var f = qs('.fld.salah', form); qsa('.seksi-nav [data-nav]', lembar).forEach(function (b) { b.classList.toggle('salah', !!qs('[data-seksi="' + b.dataset.nav + '"] .fld.salah', form)); }); if (f) { var s = f.closest('[data-seksi]'); if (s) tampil(s.dataset.seksi, true); setTimeout(function () { var i = f.querySelector('input,select,textarea'); if (i) i.focus({ preventScroll: true }); }, 60); } } };
  }
  function itemAntrean(o) {
    return '<a class="antrean-item' + (o.aktif ? ' aktif' : '') + '"' + (o.href ? ' href="' + o.href + '"' : ' href="javascript:void 0"') + (o.data ? Object.keys(o.data).map(function (k) { return ' data-' + k + '="' + e(o.data[k]) + '"'; }).join('') : '') + '>' + (o.ava ? UI.ava(o.ava, 'k') : '') + '<div class="tumpuk"><b>' + e(o.judul) + '</b><span>' + o.sub + '</span></div><div class="kanan-i">' + (o.jam ? '<span class="jam-i">' + e(o.jam) + '</span>' : '') + (o.lencana || '') + '</div></a>';
  }

  function halamanFormPerawat(ctx) {
    var tanggal = ctx.q.tanggal || U.hariIni();
    return Q('laporan.konteks', { tanggal: tanggal }, { ttl: 15000 }).then(function (k) {
      if (ctx.basi()) return;
      var daftar = k.kewajiban || [], kw = daftar.filter(function (x) { return x.pasien_id === ctx.q.pasien && x.shift === ctx.q.shift; })[0];
      if (!kw && !ctx.q.pasien && window.innerWidth > 1100) { var pertama = daftar.filter(function (x) { return !x.laporan_id; })[0] || daftar[0]; if (pertama) { R.ke('laporan?pasien=' + pertama.pasien_id + '&shift=' + pertama.shift + '&tanggal=' + pertama.tanggal, true); return; } }
      var terkirim = daftar.filter(function (x) { return x.laporan_id; }).length;
      var kiri = '<div class="kartu split-kiri"><div class="kartu-kepala"><div><h2>Antrean pasien</h2><p>' + daftar.length + ' kewajiban · ' + terkirim + ' terkirim</p></div></div><div class="antrean-alat">' + UI.segmen([{ v: U.hariIni(), l: 'Hari ini' }, { v: U.tambahHari(U.hariIni(), -1), l: 'Kemarin' }], tanggal, 'tgl') + '</div><div class="antrean">' +
        (daftar.length ? daftar.map(function (x) { var sudah = !!x.laporan_id, telat = !sudah && new Date() > U.parse(x.batas); return itemAntrean({ aktif: kw && kw.pasien_id === x.pasien_id && kw.shift === x.shift, href: '#/laporan?pasien=' + encodeURIComponent(x.pasien_id) + '&shift=' + encodeURIComponent(x.shift) + '&tanggal=' + x.tanggal, ava: x.nama_pasien, judul: x.nama_pasien, sub: 'Shift ' + e(x.shift_label) + ' · batas ' + U.jam(x.batas), lencana: UI.lencana(sudah ? 'Terkirim' : telat ? 'Terlambat' : 'Belum', sudah ? 'ok' : telat ? 'bahaya' : 'warn') }); }).join('') : '<div class="antrean-kosong">Tidak ada penugasan aktif pada tanggal ini.</div>') + '</div></div>';
      var kanan;
      if (!kw) kanan = '<div class="kartu lembar boleh-sembunyi"><div class="lembar-kosong">' + UI.kosong(daftar.length ? 'Pilih pasien dari antrean' : 'Tidak ada kewajiban laporan', daftar.length ? 'Lembar kerja laporan A–H akan terbuka di sini.' : 'Tidak ada penugasan aktif pada tanggal ini.') + '</div></div>';
      else if (kw.laporan_id) kanan = '<div class="kartu lembar boleh-sembunyi"><div class="lembar-kepala"><button type="button" class="btn ikon kecil hantu split-balik" data-balik aria-label="Kembali ke antrean">' + ic('arrow-left') + '</button>' + UI.ava(kw.nama_pasien, 'b') + '<div class="tumbuh"><h2>' + e(kw.nama_pasien) + '</h2><div class="meta"><span class="tag merek">Shift ' + e(kw.shift_label) + '</span>' + UI.lencana(kw.status || 'Terkirim', 'ok') + '<span class="tag mono">' + e(kw.laporan_id) + '</span></div></div></div><div class="lembar-isi" data-ringkas>' + '<div style="padding:30px;display:grid;place-items:center">' + A.htmlPemuat('Memuat laporan') + '</div></div><div class="lembar-kaki"><span class="tumbuh kecil redup">' + ic('circle-check', 'k') + ' Laporan sudah terkirim. Revisi tersedia dari detail laporan.</span><button type="button" class="btn primer" data-lihat="' + e(kw.laporan_id) + '">' + ic('eye') + 'Buka detail & revisi</button></div></div>';
      else {
        var draf = null; try { draf = JSON.parse(sessionStorage.getItem(kunciDraf(kw)) || 'null'); } catch (x) { }
        kanan = '<div class="kartu lembar boleh-sembunyi" data-lembar><div class="lembar-kepala"><button type="button" class="btn ikon kecil hantu split-balik" data-balik aria-label="Kembali ke antrean">' + ic('arrow-left') + '</button>' + UI.ava(kw.nama_pasien, 'b') + '<div class="tumbuh" style="min-width:0"><span class="label-mikro">Laporan harian · ' + e(kw.shift_label) + '</span><h2>' + e(kw.nama_pasien) + '</h2><div class="meta"><span class="tag">' + U.tglP(kw.tanggal) + '</span><span class="tag ' + (new Date() > U.parse(kw.batas) ? '' : 'merek') + '">' + ic('alarm-clock', 'k') + ' Batas ' + U.waktu(kw.batas) + ' · ' + U.relatif(kw.batas) + '</span></div></div><div class="lembar-progres"><b data-progres-teks>0/8 bagian lengkap</b><div class="meter" data-progres-lap><i style="width:0"></i></div></div></div>' +
          (draf ? '<div class="panel-info" style="margin:14px 20px 0">' + ic('history', 'k') + '<div class="tumbuh">Draf tersimpan dipulihkan dari sesi ini.</div><button type="button" class="btn mini hantu" data-a="buang-draf">Mulai dari awal</button></div>' : '') +
          '<div data-nav-wadah></div><form data-lap class="lembar-isi" novalidate>' + htmlFormLaporan(kw, k.format, draf) + '</form>' +
          '<div class="lembar-kaki"><button type="button" class="btn kecil" data-sebelum>' + ic('chevron-left') + '<span>Sebelumnya</span></button><button type="button" class="btn kecil" data-lanjut><span>Berikutnya</span>' + ic('chevron-right') + '</button><span class="tumbuh kecil redup potong" title="Diteruskan ke ' + e(kw.penerima || 'penanggung jawab') + '">' + ic('send', 'k') + ' Diteruskan ke ' + e(kw.penerima || 'penanggung jawab') + '</span><button type="button" class="btn primer" data-a="kirim" style="--h:42px">' + ic('send') + '<span>Kirim laporan</span></button></div></div>';
      }
      ctx.el.innerHTML = UI.kepala('Laporan Harian', U.tglP(k.tanggal) + ' · isi per bagian A–H, draf tersimpan otomatis di sesi ini') + '<div class="split masuk' + (kw ? ' lihat-lembar' : '') + '">' + kiri + kanan + '</div>';
      ctx.on('click', '[data-segmen=tgl] button', function (b) { R.ke('laporan?tanggal=' + b.dataset.v); });
      ctx.on('click', '[data-lihat]', function (b) { A.F.detailLaporan(b.dataset.lihat); });
      ctx.on('click', '[data-balik]', function () { R.ke('laporan?tanggal=' + tanggal + '&daftar=1'); });
      if (kw) ctx.remah([kw.nama_pasien]);
      if (kw && kw.laporan_id) { Q('laporan.detail', { id: kw.laporan_id }).then(function (l) { var w = qs('[data-ringkas]', ctx.el); if (w) w.innerHTML = htmlIsianLaporan(l); }).catch(function (er) { var w = qs('[data-ringkas]', ctx.el); if (w) w.innerHTML = '<div class="panel-bahaya">' + ic('circle-alert', 'k') + '<div>' + e(er.message) + '</div></div>'; }); return; }
      if (!kw || kw.laporan_id) return;
      var form = qs('[data-lap]', ctx.el), lembar = qs('[data-lembar]', ctx.el), ttd, nav;
      qs('[data-nav-wadah]', ctx.el).outerHTML = navSeksi(form);
      ctx.nanti(function () { ttd = pasangFormLaporan(form, k.format); nav = pasangSeksi(lembar, form); });
      var simpanDraf = U.debounce(function () { try { var b = bacaLaporan(form, k.format, kw); b.isian.catatan_tambahan = b.catatan; sessionStorage.setItem(kunciDraf(kw), JSON.stringify(b.isian)); } catch (x) { } }, 600);
      form.addEventListener('input', simpanDraf); form.addEventListener('change', simpanDraf);
      ctx.aksi({
        'buang-draf': function () { try { sessionStorage.removeItem(kunciDraf(kw)); } catch (x) { } R.tampilkan(); },
        kirim: function (b) {
          var d = bacaLaporan(form, k.format, kw); d.isian.H.ttd = ttd ? ttd.data() : '';
          UI.kerja(b, function () { return T('laporan.kirim', { tanggal: kw.tanggal, pasien_id: kw.pasien_id, shift: kw.shift, isian: d.isian, catatan_tambahan: d.catatan }); }, { form: form }).then(function (r) {
            try { sessionStorage.removeItem(kunciDraf(kw)); } catch (x) { }
            var m = UI.modal({ judul: 'Laporan terkirim', ikon: 'circle-check', ikonKelas: 'ok', sempit: true, tanpaTutupLuar: true, isi: '<p>Laporan <b class="mono">' + e(r.id) + '</b> tersimpan dengan status ' + UI.lencana(r.status_ketepatan) + '.</p><p class="redup kecil mt-8">' + (r.kirim_pj === 'Antri' ? 'Pesan ke penanggung jawab sedang dikirim melalui WhatsApp/Email.' : 'Notifikasi ke penanggung jawab sedang nonaktif.') + '</p>' + (r.tawarKasus ? '<div class="panel-peringatan mt-12">' + ic('circle-alert', 'k') + '<div class="tumbuh">Kondisi pasien tidak stabil. Buat kasus agar koordinator menindaklanjuti dengan SLA.</div></div>' : ''),
              kaki: (r.tawarKasus ? '<button type="button" class="btn" data-kasus>' + ic('circle-alert') + 'Buat kasus</button>' : '') + '<button type="button" class="btn primer" data-tutup>Selesai</button>', saatTutup: function () { R.ke('laporan?tanggal=' + kw.tanggal + '&daftar=1'); } });
            var bk = m.el.querySelector('[data-kasus]'); if (bk) bk.onclick = function () { m.tutup(); setTimeout(function () { A.F.buatKasus && A.F.buatKasus({ jenis: 'Kondisi Lapangan', divisi_asal: 'Keperawatan', pasien_id: kw.pasien_id, judul: 'Perubahan kondisi — ' + kw.nama_pasien, deskripsi: d.isian.G.ket, prioritas: d.isian.G.kondisi === 'Mengalami perubahan kondisi' ? 'Tinggi' : 'Sedang', ref_laporan: r.id }); }, 350); };
          }).catch(function (er) { if (er.code === 'CONFLICT' && er.fields && er.fields.laporan_id) A.F.detailLaporan(er.fields.laporan_id); else if (nav) nav.keGalat(); });
        }
      });
    });
  }

  /* ---------- Detail laporan (laci) ---------- */
  function htmlIsianLaporan(l) {
    var f = l.format || {}, i = l.isian || {}, B = i.B || [], C = i.C || {}, D = i.D || {}, F = i.F || {}, Gg = i.G || {}, h = '';
    var tv = function (lbl, v, sat, warn) { return '<div class="t' + (warn ? ' peringatan' : '') + '"><div class="label-mikro">' + lbl + '</div><div class="v">' + e(v || '—') + '<small>' + sat + '</small></div></div>'; }, s = +String(C.tensi || '').split('/')[0];
    h += '<div class="ttv">' + tv('Tensi', C.tensi, 'mmHg', s >= 140 || (s && s < 90)) + tv('Nadi', C.nadi, '×/mnt', +C.nadi > 100 || (+C.nadi && +C.nadi < 60)) + tv('Suhu', C.suhu, '°C', +C.suhu >= 37.5) + tv('SpO₂', C.spo2, '%', +C.spo2 && +C.spo2 < 95) + (C.gds ? tv('GDS', C.gds, 'mg/dL', +C.gds > 200 || +C.gds < 70) : '') + '</div>';
    h += '<div class="panel-lembut mt-12"><div class="baris rata"><b>G · Kondisi</b>' + A.F.lencanaKondisi(Gg.kondisi || l.kondisi_pasien) + '</div>' + (Gg.ket ? '<p class="mt-8">' + e(Gg.ket) + '</p>' : '') + '</div>';
    var tdk = B.map(function (v, k) { return v === 'T' ? '<li>' + e((f.B || [])[k]) + ((i.Bket || {})[k] ? ' — <span class="redup">' + e(i.Bket[k]) + '</span>' : '') + '</li>' : ''; }).join('');
    h += '<h3 class="mt-16">B · Aktivitas dasar</h3><p class="kecil redup mt-4">' + B.filter(function (v) { return v === 'Y'; }).length + ' dari ' + (f.B || []).length + ' aktivitas dilakukan.</p>' + (tdk ? '<ul class="kecil" style="margin:6px 0 0;padding-left:18px;color:var(--warn)">' + tdk + '</ul>' : '');
    var ob = (D.obat || []).concat(D.insulin || []);
    if (ob.length) h += '<h3 class="mt-16">D · Obat</h3><div class="daftar panel-lembut mt-8" style="padding:0">' + ob.map(function (o) { return '<div class="item" style="padding:8px 12px"><span class="tumbuh"><b>' + e(o.nama) + '</b> <span class="redup">' + e(o.dosis || '') + ' · ' + e(o.jam || '') + '</span></span>' + UI.lencana(o.v === 'Y' ? 'Diberikan' : o.v === 'T' ? 'Tidak diberikan' : '—', o.v === 'Y' ? 'ok' : o.v === 'T' ? 'bahaya' : 'netral') + '</div>'; }).join('') + '</div>';
    if (i.E) h += '<h3 class="mt-16">E · Alat medis</h3><div class="baris bungkus mt-8">' + (f.E || []).map(function (x, k) { return i.E[k] === 'Y' ? '<span class="tag merek">' + ic('check', 'k') + ' ' + e(x) + '</span>' : ''; }).join('') + '</div>';
    h += '<h3 class="mt-16">F · Eliminasi & nutrisi</h3><dl class="info-grid mt-8"><div><dt>BAB</dt><dd>' + e(F.bab || '—') + (F.bab_ket ? ' · ' + e(F.bab_ket) : '') + '</dd></div><div><dt>BAK</dt><dd>' + e(F.bak || '—') + (F.bak_ket ? ' · ' + e(F.bak_ket) : '') + '</dd></div><div><dt>Makan pagi · siang · malam</dt><dd>' + e([F.makan_pagi, F.makan_siang, F.makan_malam].map(function (x) { return x || '—'; }).join(' · ')) + '</dd></div><div><dt>Minum</dt><dd>' + e(F.minum || '—') + '</dd></div><div class="penuh"><dt>Keluhan</dt><dd>' + e(F.keluhan || '—') + '</dd></div><div class="penuh"><dt>Kejadian khusus</dt><dd>' + e(F.kejadian || '—') + '</dd></div><div class="penuh"><dt>Saran</dt><dd>' + e(F.saran || '—') + '</dd></div>' + (l.catatan_tambahan ? '<div class="penuh"><dt>Catatan tambahan</dt><dd>' + e(l.catatan_tambahan) + '</dd></div>' : '') + '</dl>';
    return h;
  }
  A.F.detailLaporan = function (id) {
    var m = UI.laci({ judul: 'Memuat laporan…', ikon: 'clipboard-list', isi: '<div style="padding:40px;display:grid;place-items:center">' + A.htmlPemuat('Memuat laporan', id) + '</div>' });
    Q('laporan.detail', { id: id }).then(function (l) {
      var me = A.Sesi.me, h = '<div class="baris bungkus">' + UI.lencana(l.status_ketepatan) + '<span class="tag">' + e(l.shift_label) + '</span><span class="tag mono">' + e(l.id) + '</span>' + (l.revisi_ke ? '<span class="lencana warn"><i></i>Revisi ke-' + l.revisi_ke + '</span>' : '') + '</div>' +
        '<dl class="info-grid mt-12"><div><dt>Perawat</dt><dd>' + e(l.nama_perawat) + '</dd></div><div><dt>Diisi</dt><dd>' + U.waktu(l.waktu_isi) + '</dd></div><div><dt>Kirim ke penanggung jawab</dt><dd>' + UI.lencana(l.status_kirim_pj) + '</dd></div><div><dt>Waktu kirim</dt><dd>' + U.waktu(l.waktu_kirim_pj) + '</dd></div></dl><hr class="pemisah">' + htmlIsianLaporan(l);
      if ((l.kirim || []).length) h += '<h3 class="mt-16">Riwayat pengiriman</h3><div class="daftar panel-lembut mt-8" style="padding:0">' + l.kirim.map(function (k) { return '<div class="item" style="padding:8px 12px">' + ic(k.kanal === 'WA' ? 'message-circle' : 'mail', 'k') + '<span class="tumbuh">' + e(k.tujuan) + ' <span class="redup">· ' + e(k.kanal) + '</span></span>' + UI.lencana(k.status) + '<span class="kecil redup">' + U.waktu(k.waktu) + '</span></div>'; }).join('') + '</div>';
      if ((l.riwayat_revisi || []).length) h += '<h3 class="mt-16">Riwayat revisi</h3><div class="lini mt-8">' + l.riwayat_revisi.map(function (r) { return '<div class="e"><b>Versi ' + r.versi + '</b><time>' + U.waktu(r.waktu) + '</time><p>Direvisi oleh ' + e(r.oleh) + ': ' + e(r.alasan) + '</p></div>'; }).join('') + '</div>';
      m.el.querySelector('h2').textContent = l.nama_pasien; m.el.querySelector('.ov-kepala p') ? null : m.el.querySelector('.ov-kepala .tumpuk').insertAdjacentHTML('beforeend', '<p>' + U.tglP(l.tanggal) + ' · ' + e(l.shift_label) + '</p>');
      m.isi.innerHTML = h;
      var bisaRevisi = me.peran === 'PRW' && l.perawat_id === me.perawat_id, bisaKasus = /ADM|KEP/.test(me.peran);
      m.kaki.innerHTML = '<div class="kiri"><button type="button" class="btn kecil" data-cetak>' + ic('printer') + 'Cetak</button></div>' + (bisaKasus ? '<button type="button" class="btn" data-kasus>' + ic('circle-alert') + 'Buat kasus</button>' : '') + (bisaRevisi ? '<button type="button" class="btn" data-revisi>' + ic('pencil') + 'Revisi</button>' : '') + '<button type="button" class="btn primer" data-tutup>Tutup</button>';
      m.on('click', '[data-cetak]', function () { var w = window.open('', '_blank'); if (!w) return UI.toast('Izinkan pop-up untuk mencetak.', 'warn'); w.document.write('<html><head><title>Laporan ' + e(l.id) + '</title><link rel="stylesheet" href="css/style.css"></head><body style="padding:24px;background:#fff"><h1>Laporan Harian — ' + e(l.nama_pasien) + '</h1><p class="redup">' + U.tglP(l.tanggal) + ' · ' + e(l.shift_label) + ' · ' + e(l.nama_perawat) + '</p><hr class="pemisah">' + htmlIsianLaporan(l) + '<script>setTimeout(function(){print()},400)<\/script></body></html>'); w.document.close(); });
      m.on('click', '[data-kasus]', function () { m.tutup(); setTimeout(function () { A.F.buatKasus({ jenis: 'Kondisi Lapangan', divisi_asal: 'Keperawatan', pasien_id: l.pasien_id, perawat_id: l.perawat_id, judul: (l.kondisi_pasien !== 'Stabil' ? l.kondisi_pasien : 'Tindak lanjut laporan') + ' — ' + l.nama_pasien, deskripsi: (l.keterangan_kondisi || '') + ' (laporan ' + l.id + ')', prioritas: l.kondisi_pasien === 'Mengalami perubahan kondisi' ? 'Tinggi' : 'Sedang', ref_laporan: l.id }); }, 320); });
      m.on('click', '[data-revisi]', function () { m.tutup(); setTimeout(function () { revisiLaporan(l); }, 320); });
    }).catch(function (er) { m.tutup(); UI.galat(er); });
  };
  function revisiLaporan(l) {
    Q('laporan.konteks', { tanggal: l.tanggal }).then(function (k) {
      var kw = k.kewajiban.filter(function (x) { return x.pasien_id === l.pasien_id && x.shift === l.shift; })[0] || { nama_pasien: l.nama_pasien, shift_label: l.shift_label, tanggal: l.tanggal, info: {} };
      var isi = Object.assign({}, l.isian, { catatan_tambahan: l.catatan_tambahan });
      var m = UI.laci({ judul: 'Revisi laporan ' + l.id, sub: e(l.nama_pasien) + ' · ' + e(l.shift_label), ikon: 'pencil', lebar: true, isi: '<div class="panel-info mb-12">' + ic('info', 'k') + '<div>Versi lama tetap tersimpan di riwayat revisi dan terlihat oleh koordinator.</div></div><form data-rev novalidate>' + htmlFormLaporan(kw, k.format, isi) + '<div class="fld mt-12" data-k="alasan"><label>Alasan revisi <span class="wajib">*</span></label><textarea class="inp" name="alasan_rev" rows="2" placeholder="mis. salah input suhu"></textarea><span class="galat"></span></div></form>', kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-simpan>' + ic('save') + 'Simpan revisi</button>' });
      var form = m.el.querySelector('[data-rev]'); setTimeout(function () { pasangFormLaporan(form, k.format); }, 60);
      m.on('click', '[data-simpan]', function (b) { var d = bacaLaporan(form, k.format, kw), al = form.querySelector('[name=alasan_rev]').value.trim(); if (!al) return UI.tandaiGalat(form, { alasan: 'Wajib diisi' }); UI.kerja(b, function () { return T('laporan.revisi', { id: l.id, alasan: al, isian: d.isian, catatan_tambahan: d.catatan }); }, { form: form }).then(function () { m.tutup(); UI.toast(A.API.pesan || 'Revisi tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { }); });
    }).catch(UI.galat);
  }

  /* ---------- Monitoring laporan (Keperawatan / Admin / Operasional): split antrean hari ini + lembar laporan ---------- */
  function halamanMonitoring(ctx) {
    var st = ctx.st; st.tab = ctx.q.tab || st.tab || 'monitor'; st.dari = st.dari || U.tambahHari(U.hariIni(), -6); st.sampai = st.sampai || U.hariIni();
    var hari = U.hariIni(), filt = { dari: st.dari, sampai: st.sampai, shift: st.shift || '', kondisi: st.kondisi || '', status: st.status || '' };
    return Promise.all([Q('laporan.kepatuhan', {}), st.tab === 'semua' ? Q('laporan.list', filt) : st.tab === 'monitor' ? Q('laporan.list', { dari: hari, sampai: hari }) : Promise.resolve(null)]).then(function (h) {
      if (ctx.basi()) return;
      var k = h[0], rows = h[1], t = k.total, tbl;
      var html = UI.kepala('Laporan Harian HC', 'Kepatuhan pengisian laporan A–H & pengiriman ke penanggung jawab · ' + U.tgl(k.dari) + ' – ' + U.tgl(k.sampai), '<button type="button" class="btn kecil" data-a="ingatkan-semua">' + ic('bell-ring') + '<span>Ingatkan semua yang belum</span></button>') +
        '<div class="grid g4 kpi-baris masuk">' + UI.kpi({ label: 'Kepatuhan 30 hari', nilai: U.angka(t.persen, 1) + '<small>%</small>', utama: true, meter: t.persen, ikon: 'clipboard-check', sub: t.tepat + ' tepat · ' + t.telat + ' telat dari ' + t.wajib }) + UI.kpi({ label: 'Belum masuk hari ini', nilai: U.angka(k.belum_hari_ini.length), ikon: 'clock-alert', sub: 'lewat batas shift' }) + UI.kpi({ label: 'Belum masuk kemarin', nilai: U.angka(k.belum_kemarin.length), ikon: 'clipboard-x', sub: 'perlu klarifikasi' }) + UI.kpi({ label: 'Terlambat (30 hari)', nilai: U.angka(t.telat), ikon: 'alarm-clock', sub: U.persen(t.wajib ? t.telat / t.wajib * 100 : 0) + ' dari kewajiban' }) + '</div>' +
        '<div class="mt-16">' + UI.tab([{ id: 'monitor', l: 'Antrean hari ini', i: 'activity' }, { id: 'statistik', l: 'Statistik', i: 'chart-column' }, { id: 'perawat', l: 'Per perawat', i: 'users-round', n: k.perawat.length }, { id: 'semua', l: 'Semua laporan', i: 'list' }], st.tab) + '</div>';
      var antre = [];
      if (st.tab === 'monitor') {
        k.belum_hari_ini.forEach(function (b, i) { antre.push({ kunci: 'B' + i, belum: b, hari: 'hari ini' }); });
        k.belum_kemarin.forEach(function (b, i) { antre.push({ kunci: 'K' + i, belum: b, hari: 'kemarin' }); });
        (rows || []).slice().sort(function (a, b) { return a.waktu_isi < b.waktu_isi ? 1 : -1; }).forEach(function (l) { antre.push({ kunci: 'L' + l.id, lap: l }); });
        if (!st.pilihLap || !antre.some(function (x) { return x.kunci === st.pilihLap; })) st.pilihLap = antre.length ? antre[0].kunci : '';
        var masuk = (rows || []).length;
        html += '<div class="split pudar" data-split><div class="kartu split-kiri"><div class="kartu-kepala"><div><h2>Antrean laporan</h2><p>' + masuk + ' masuk hari ini · ' + (k.belum_hari_ini.length + k.belum_kemarin.length) + ' belum masuk</p></div></div><div class="antrean-alat">' + UI.cari(st.qa, 'Cari pasien / perawat…') + '</div><div class="antrean" data-antrean></div></div><div class="kartu lembar boleh-sembunyi" data-lembar-mon></div></div>';
      } else if (st.tab === 'statistik') {
        html += '<div class="grid g-2-1 pudar">' + G.kartu('g-kep', 'Kepatuhan harian', 'Persentase laporan tepat waktu per hari', { tinggi: 240 }) + '<div class="kartu"><div class="kartu-kepala"><div><h2>Kepatuhan per wilayah</h2></div></div><div class="kartu-isi">' + G.hbar(k.wilayah.map(function (w) { return { n: w.wilayah, v: w.persen, sub: w.jumlah_pasien + ' pasien', warna: w.persen >= 95 ? 'var(--s3)' : w.persen >= 80 ? 'var(--s1)' : 'var(--s4)' }; }), { fmt: function (v) { return U.persen(v); } }) + '</div></div></div>';
      } else if (st.tab === 'perawat') {
        html += '<div class="saring pudar">' + UI.cari(st.q, 'Cari perawat…') + '</div><div class="kartu pudar"><div data-tabel></div></div>';
      } else {
        html += '<div class="saring pudar"><input type="date" class="inp kecil" data-f="dari" value="' + st.dari + '" style="width:auto" aria-label="Dari"><span class="redup">s/d</span><input type="date" class="inp kecil" data-f="sampai" value="' + st.sampai + '" style="width:auto" aria-label="Sampai">' + UI.pilih('shift', ctx.boot.shift.map(function (s) { return { v: s.kode, l: s.label }; }), st.shift, { semua: 'Semua shift', k: 'kecil', style: 'width:auto' }) + UI.pilih('kondisi', KONDISI, st.kondisi, { semua: 'Semua kondisi', k: 'kecil', style: 'width:auto' }) + UI.pilih('status', ['Tepat Waktu', 'Terlambat'], st.status, { semua: 'Semua ketepatan', k: 'kecil', style: 'width:auto' }) + UI.cari(st.q, 'Cari pasien / perawat…') + '<button type="button" class="btn kecil" data-a="csv">' + ic('download') + 'CSV</button></div><div class="kartu pudar"><div data-tabel></div></div>';
      }
      ctx.el.innerHTML = html;
      if (st.tab === 'monitor') {
        var gambarAntre = function () {
          var q = (st.qa || '').toLowerCase(), w = qs('[data-antrean]', ctx.el), grup = '';
          w.innerHTML = antre.filter(function (x) { var r = x.lap || x.belum; return !q || U.cocok(r, q, ['nama_pasien', 'nama_perawat']); }).map(function (x) {
            var r = x.lap || x.belum, label = x.lap ? 'Masuk hari ini' : 'Belum masuk · ' + x.hari, kepala = label !== grup ? '<div class="label-mikro antrean-grup">' + label + '</div>' : ''; grup = label;
            return kepala + itemAntrean({ aktif: x.kunci === st.pilihLap, data: { pilih: x.kunci }, ava: r.nama_pasien, judul: r.nama_pasien, sub: e(r.nama_perawat) + ' · ' + e(r.shift_label || r.shift), jam: x.lap ? U.jam(x.lap.waktu_isi) : '', lencana: x.lap ? A.F.lencanaKondisi(x.lap.kondisi_pasien) : UI.lencana('Lewat ' + U.angka(x.belum.telat_jam, 1) + ' jam', 'bahaya') });
          }).join('') || '<div class="antrean-kosong">' + (q ? 'Tidak ada yang cocok.' : 'Belum ada laporan hari ini.') + '</div>';
        };
        var gambarLembar = function () {
          var w = qs('[data-lembar-mon]', ctx.el), x = antre.filter(function (a) { return a.kunci === st.pilihLap; })[0]; if (!w) return;
          var balik = '<button type="button" class="btn ikon kecil hantu split-balik" data-balik aria-label="Kembali ke antrean">' + ic('arrow-left') + '</button>';
          if (!x) { w.innerHTML = '<div class="lembar-kosong">' + UI.kosong('Pilih laporan dari antrean', 'Detail laporan A–H tampil di sini.') + '</div>'; return; }
          if (x.belum) { var b = x.belum, tglB = x.hari === 'kemarin' ? U.tambahHari(hari, -1) : hari; w.innerHTML = '<div class="lembar-kepala">' + balik + UI.ava(b.nama_pasien, 'b') + '<div class="tumbuh"><h2>' + e(b.nama_pasien) + '</h2><div class="meta">' + UI.lencana('Belum masuk · ' + x.hari, 'bahaya') + '<span class="tag">Shift ' + e(b.shift) + '</span></div></div></div><div class="lembar-isi"><div class="panel-peringatan">' + ic('clock-alert', 'k') + '<div>Laporan dari <b>' + e(b.nama_perawat) + '</b> sudah lewat batas <b>' + U.angka(b.telat_jam, 1) + ' jam</b>. Kirim pengingat WhatsApp; bila belum masuk lebih dari 3 jam, sistem mengeskalasi ke koordinator.</div></div><dl class="info-grid mt-16"><div><dt>Perawat</dt><dd>' + e(b.nama_perawat) + '</dd></div><div><dt>Shift</dt><dd>' + e(b.shift) + '</dd></div><div><dt>Tanggal</dt><dd>' + U.tglP(tglB) + '</dd></div><div><dt>Terlambat</dt><dd>' + U.angka(b.telat_jam, 1) + ' jam</dd></div></dl></div><div class="lembar-kaki"><span class="tumbuh"></span><button type="button" class="btn primer" data-a="ingatkan" data-perawat="' + e(b.perawat_id) + '" data-pasien="' + e(b.pasien_id) + '" data-shift="' + e(b.shift) + '" data-tanggal="' + tglB + '">' + ic('bell-ring') + 'Kirim pengingat</button></div>'; return; }
          var l0 = x.lap;
          w.innerHTML = '<div class="lembar-kepala">' + balik + UI.ava(l0.nama_pasien, 'b') + '<div class="tumbuh" style="min-width:0"><span class="label-mikro">' + U.tglP(l0.tanggal) + ' · ' + e(l0.shift_label) + '</span><h2>' + e(l0.nama_pasien) + '</h2><div class="meta">' + UI.lencana(l0.status_ketepatan) + A.F.lencanaKondisi(l0.kondisi_pasien) + '<span class="tag">' + e(l0.nama_perawat) + '</span><span class="tag mono">' + e(l0.id) + '</span></div></div></div><div class="lembar-isi" data-isi-lap><div style="padding:30px;display:grid;place-items:center">' + A.htmlPemuat('Memuat laporan') + '</div></div><div class="lembar-kaki"><button type="button" class="btn kecil" data-lap-detail="' + e(l0.id) + '">' + ic('panel-left-close') + 'Detail lengkap</button><span class="tumbuh"></span>' + (/ADM|KEP/.test(ctx.me.peran) ? '<button type="button" class="btn primer" data-kasus-lap="' + e(l0.id) + '">' + ic('circle-alert') + 'Buat kasus</button>' : '') + '</div>';
          Q('laporan.detail', { id: l0.id }).then(function (l) { var isi = qs('[data-isi-lap]', w); if (isi && st.pilihLap === x.kunci) { isi.innerHTML = '<dl class="info-grid mb-12"><div><dt>Diisi</dt><dd>' + U.waktu(l.waktu_isi) + '</dd></div><div><dt>Kirim ke penanggung jawab</dt><dd>' + UI.lencana(l.status_kirim_pj) + '</dd></div></dl>' + htmlIsianLaporan(l); isi.classList.add('pudar'); } w._lap = l; }).catch(function (er) { var isi = qs('[data-isi-lap]', w); if (isi) isi.innerHTML = '<div class="panel-bahaya">' + ic('circle-alert', 'k') + '<div>' + e(er.message) + '</div></div>'; });
        };
        gambarAntre(); gambarLembar();
        ctx.on('click', '[data-pilih]', function (a) { st.pilihLap = a.dataset.pilih; qsa('[data-pilih]', ctx.el).forEach(function (x) { x.classList.toggle('aktif', x === a); }); qs('[data-split]', ctx.el).classList.add('lihat-lembar'); var w = qs('[data-lembar-mon]', ctx.el); w.classList.remove('pudar'); void w.offsetWidth; w.classList.add('pudar'); gambarLembar(); if (window.innerWidth <= 1100) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        ctx.on('click', '[data-balik]', function () { qs('[data-split]', ctx.el).classList.remove('lihat-lembar'); });
        ctx.on('input', '[data-f=q]', U.debounce(function (i) { st.qa = i.value; gambarAntre(); }, 150));
        ctx.on('click', '[data-lap-detail]', function (b) { A.F.detailLaporan(b.dataset.lapDetail); });
        ctx.on('click', '[data-kasus-lap]', function () { var l = (qs('[data-lembar-mon]', ctx.el) || {})._lap; if (!l) return; A.F.buatKasus({ jenis: 'Kondisi Lapangan', divisi_asal: 'Keperawatan', pasien_id: l.pasien_id, perawat_id: l.perawat_id, judul: (l.kondisi_pasien !== 'Stabil' ? l.kondisi_pasien : 'Tindak lanjut laporan') + ' — ' + l.nama_pasien, deskripsi: (l.keterangan_kondisi || '') + ' (laporan ' + l.id + ')', prioritas: l.kondisi_pasien === 'Mengalami perubahan kondisi' ? 'Tinggi' : 'Sedang', ref_laporan: l.id }); });
      }
      if (st.tab === 'statistik') ctx.grafik(function () { var hh = k.harian; G.garis(qs('#g-kep', ctx.el), { label: hh.map(function (x) { return x.tanggal; }), seri: [{ nama: 'Kepatuhan', warna: 'var(--merek)', data: hh.map(function (x) { return x.persen; }) }], fmt: function (v) { return U.persen(v); }, fmtSumbu: function (v) { return Math.round(v) + '%'; }, maks: 100, acuan: 95, acuanLabel: 'Target 95%', area: true, labelPendek: U.tglK, labelTip: U.tglP, tipEkstra: function (i) { return '<div class="tr"><span>Tepat · telat · belum</span><b>' + hh[i].tepat + ' · ' + hh[i].telat + ' · ' + hh[i].belum + '</b></div>'; } }); });
      if (st.tab === 'perawat') tbl = UI.tabel(qs('[data-tabel]', ctx.el), { rows: k.perawat, idKunci: 'perawat_id', urut: 'persen', arah: 1, cariKunci: ['nama'], klik: function (r) { st.tab = 'semua'; st.q = r.nama; R.muatUlang(); }, kolom: [{ k: 'nama', l: 'Perawat', f: function (r) { return '<div class="baris">' + UI.ava(r.nama, 'k') + '<b>' + e(r.nama) + '</b></div>'; } }, { k: 'wajib', l: 'Wajib', kelas: 'kanan' }, { k: 'tepat', l: 'Tepat', kelas: 'kanan' }, { k: 'telat', l: 'Telat', kelas: 'kanan' }, { k: 'belum', l: 'Belum', kelas: 'kanan', f: function (r) { return '<span class="' + (r.belum ? 'bahaya-t tebal' : '') + '">' + r.belum + '</span>'; } }, { k: 'persen', l: 'Kepatuhan', f: function (r) { return '<div class="baris" style="min-width:140px"><div class="meter tumbuh ' + (r.persen >= 95 ? 'ok' : r.persen >= 80 ? '' : 'warn') + '"><i style="width:' + r.persen + '%"></i></div><b class="kecil angka">' + U.persen(r.persen, 0) + '</b></div>'; } }] });
      if (st.tab === 'semua') tbl = UI.tabel(qs('[data-tabel]', ctx.el), { rows: rows, cariKunci: ['nama_pasien', 'nama_perawat', 'id'], klik: function (r) { A.F.detailLaporan(r.id); }, kolom: [{ k: 'tanggal', l: 'Tanggal', f: function (r) { return '<div class="utama-sel">' + U.tgl(r.tanggal) + '</div><div class="sub-sel">' + e(r.shift_label) + '</div>'; } }, { k: 'nama_pasien', l: 'Pasien', f: function (r) { return '<b>' + e(r.nama_pasien) + '</b>'; } }, { k: 'nama_perawat', l: 'Perawat' }, { k: 'tensi', l: 'TTV', urut: false, f: A.F.ttvMini }, { k: 'kondisi_pasien', l: 'Kondisi', f: function (r) { return A.F.lencanaKondisi(r.kondisi_pasien); } }, { k: 'status_ketepatan', l: 'Ketepatan', f: function (r) { return UI.lencana(r.status_ketepatan); } }, { k: 'status_kirim_pj', l: 'Kirim PJ', f: function (r) { return UI.lencana(r.status_kirim_pj); } }, { k: 'waktu_isi', l: 'Diisi', kelas: 'kanan', f: function (r) { return U.waktu(r.waktu_isi); } }] });
      if (tbl && st.q) tbl.cari(st.q);
      ctx.on('click', '[data-tab]', function (b) { st.tab = b.dataset.tab; R.muatUlang(); });
      if (st.tab !== 'monitor') ctx.on('input', '[data-f=q]', U.debounce(function (i) { st.q = i.value; if (tbl) tbl.cari(i.value); }, 150));
      ctx.on('change', 'select[data-f], input[type=date][data-f]', function (i) { st[i.dataset.f] = i.value; R.muatUlang(); });
      function ingatkan(b, rr) { return UI.kerja(b, function () { return rr.reduce(function (pp, x) { return pp.then(function () { return T('laporan.ingatkan', { perawat_id: x.perawat_id, pasien_id: x.pasien_id, shift: x.shift, tanggal: x.tanggal || U.hariIni() }, { diam: true }); }); }, Promise.resolve()); }); }
      ctx.aksi({
        ingatkan: function (b) { ingatkan(b, [{ perawat_id: b.dataset.perawat, pasien_id: b.dataset.pasien, shift: b.dataset.shift, tanggal: b.dataset.tanggal }]).then(function () { UI.toast(A.API.pesan || 'Pengingat dikirim.', 'ok'); b.innerHTML = ic('check', 'k') + 'Terkirim'; b.disabled = true; }).catch(function () { }); },
        'ingatkan-semua': function (b) { if (!k.belum_hari_ini.length) return UI.toast('Tidak ada laporan yang belum masuk hari ini.', 'ok'); ingatkan(b, k.belum_hari_ini).then(function () { UI.toast('Pengingat dikirim ke ' + k.belum_hari_ini.length + ' perawat.', 'ok'); }).catch(function () { }); },
        csv: function () { if (tbl) tbl.csv('laporan-harian-' + st.dari + '-' + st.sampai); }
      });
      if (ctx.q.id) setTimeout(function () { A.F.detailLaporan(ctx.q.id); }, 200);
    });
  }
  R.daftar('laporan', { judul: 'Laporan Harian HC', kerangka: 'tabel', render: function (ctx) { return ctx.me.peran === 'PRW' ? halamanFormPerawat(ctx) : halamanMonitoring(ctx); } });

  /* ===================== RIWAYAT SAYA (perawat) ===================== */
  R.daftar('riwayat', {
    judul: 'Riwayat Saya', kerangka: 'tabel',
    render: function (ctx) {
      var st = ctx.st; st.bulan = st.bulan || U.bulanIni();
      var dari = st.bulan + '-01', sampai = U.tambahHari(U.tambahBulan(st.bulan, 1) + '-01', -1);
      return Q('laporan.list', { dari: dari, sampai: sampai }).then(function (rows) {
        if (ctx.basi()) return;
        var tepat = rows.filter(function (r) { return r.status_ketepatan === 'Tepat Waktu'; }).length;
        ctx.el.innerHTML = UI.kepala('Riwayat Laporan Saya', 'Laporan yang sudah Anda kirim · revisi tersedia dari detail laporan', '<input type="month" class="inp kecil" data-bulan value="' + st.bulan + '" style="width:auto" aria-label="Bulan">') +
          '<div class="grid g3 kpi-baris masuk">' + UI.kpi({ label: 'Laporan terkirim', nilai: U.angka(rows.length), utama: true, ikon: 'send', sub: U.bulan(st.bulan) }) + UI.kpi({ label: 'Tepat waktu', nilai: U.angka(tepat), ikon: 'badge-check', sub: U.persen(rows.length ? tepat / rows.length * 100 : 0, 0) }) + UI.kpi({ label: 'Terlambat', nilai: U.angka(rows.length - tepat), ikon: 'alarm-clock', sub: 'perhatikan batas shift' }) + '</div>' +
          '<div class="tumpuk celah-8 mt-16 masuk-2">' + (rows.length ? Object.keys(U.kelompok(rows, 'tanggal')).sort().reverse().map(function (tg) { var g = rows.filter(function (r) { return r.tanggal === tg; }); return '<div class="label-mikro mt-8">' + U.tglP(tg) + '</div>' + g.map(function (l) { return '<div class="kartu klik pad" data-lap="' + e(l.id) + '" style="padding:14px"><div class="baris celah-12"><span class="ikon-ov">' + ic('clipboard-list', 'k') + '</span><div class="tumpuk tumbuh"><b>' + e(l.nama_pasien) + ' · ' + e(l.shift_label) + '</b><span class="kecil redup">' + A.F.ttvMini(l) + '</span></div><div class="tumpuk" style="align-items:flex-end">' + UI.lencana(l.status_ketepatan) + A.F.lencanaKondisi(l.kondisi_pasien) + '</div></div></div>'; }).join(''); }).join('') : '<div class="kartu pad">' + UI.kosong('Belum ada laporan bulan ini', 'Laporan yang Anda kirim akan muncul di sini.') + '</div>') + '</div>';
        ctx.on('change', '[data-bulan]', function (i) { st.bulan = i.value || U.bulanIni(); R.muatUlang(); });
        ctx.on('click', '[data-lap]', function (k) { A.F.detailLaporan(k.dataset.lap); });
      });
    }
  });

  /* ===================== IDENTIFIKASI PASIEN (handover) — split: antrean form + lembar bertab ===================== */
  var IDF_BAG = [['kondisi_umum', 'Kondisi umum pasien', 'Kesadaran, mobilitas, komunikasi, kebiasaan'], ['tindakan_dasar', 'Tindakan dasar harian', 'Mandi, perawatan kulit, alih baring, ROM'], ['tindakan_kdm', 'Kebutuhan dasar manusia (KDM)', 'Eliminasi, nutrisi, alat medis'], ['penyakit_penyerta', 'Penyakit penyerta & alergi', ''], ['kegiatan_pagi', 'Rutinitas pagi', '06.00–11.00'], ['kegiatan_siang', 'Rutinitas siang', '11.00–15.00'], ['kegiatan_sore', 'Rutinitas sore', '15.00–18.00'], ['kegiatan_malam', 'Rutinitas malam', '18.00–06.00'], ['perlakuan_keluarga', 'Sikap & kebiasaan keluarga', ''], ['perlakuan_pasien', 'Cara pendekatan ke pasien', ''], ['hak_perawat_ket', 'Hak & fasilitas perawat', 'Kamar, makan, waktu ibadah'], ['saran_perawat', 'Saran untuk perawat penerima', '']];
  var IDF_GRUP = [{ k: 'A', l: 'Kondisi & tindakan', b: [0, 1, 2, 3] }, { k: 'B', l: 'Rutinitas harian', b: [4, 5, 6, 7] }, { k: 'C', l: 'Keluarga & pendekatan', b: [8, 9] }, { k: 'D', l: 'Hak & saran', b: [10, 11] }];
  R.daftar('identifikasi', {
    judul: 'Identifikasi Pasien', kerangka: 'tabel',
    render: function (ctx) {
      var st = ctx.st, kep = /ADM|KEP/.test(ctx.me.peran); st.tab = st.tab || 'aktif';
      return Q('idf.list', {}).then(function (rows) {
        if (ctx.basi()) return;
        var aktif = rows.filter(function (r) { return r.status !== 'Ditinjau'; }), sel = st.tab === 'aktif' ? aktif : rows;
        if (ctx.q.id) st.pilih = ctx.q.id;
        if (!st.pilih || !rows.some(function (r) { return r.id === st.pilih; })) st.pilih = window.innerWidth > 1100 && sel.length ? sel[0].id : '';
        ctx.el.innerHTML = UI.kepala('Identifikasi Pasien', 'Form serah terima (handover) saat rotasi/infal — wajib ditinjau koordinator sebelum diteruskan ke perawat penerima', kep ? UI.btn('Minta identifikasi', { k: 'primer kecil', a: 'minta', i: 'send', kunci: 'n' }) : '') +
          UI.tab([{ id: 'aktif', l: 'Perlu tindakan', n: aktif.length }, { id: 'semua', l: 'Semua', n: rows.length }], st.tab) +
          '<div class="split pudar' + (ctx.q.id ? ' lihat-lembar' : '') + '" data-split><div class="kartu split-kiri"><div class="kartu-kepala"><div><h2>Antrean form</h2><p>' + sel.length + ' form · ' + aktif.filter(function (f) { return f.terlambat; }).length + ' terlambat</p></div></div><div class="antrean">' +
          (sel.length ? sel.map(function (f) { return itemAntrean({ aktif: f.id === st.pilih, data: { idf: f.id }, ava: f.nama_pasien, judul: f.nama_pasien, sub: e(f.alasan) + ' · ' + e(f.nama_perawat), lencana: f.terlambat ? UI.lencana('Terlambat', 'bahaya') : UI.lencana(f.status) }); }).join('') : '<div class="antrean-kosong">' + (st.tab === 'aktif' ? 'Tidak ada form yang perlu ditindaklanjuti.' : 'Belum ada form identifikasi.') + '</div>') +
          '</div></div><div class="kartu lembar boleh-sembunyi" data-lembar-idf></div></div>';
        var w = qs('[data-lembar-idf]', ctx.el);
        function muat() { if (!st.pilih) { w.innerHTML = '<div class="lembar-kosong">' + UI.kosong('Pilih form dari antrean', 'Lembar identifikasi pasien terbuka di sini.') + '</div>'; return; } w.innerHTML = '<div style="padding:48px;display:grid;place-items:center">' + A.htmlPemuat('Memuat form') + '</div>'; lembarIdf(w, st.pilih, ctx); }
        muat();
        ctx.on('click', '[data-tab]', function (b) { st.tab = b.dataset.tab; R.muatUlang(); });
        ctx.on('click', '[data-idf]', function (a) { st.pilih = a.dataset.idf; qsa('[data-idf]', ctx.el).forEach(function (x) { x.classList.toggle('aktif', x === a); }); qs('[data-split]', ctx.el).classList.add('lihat-lembar'); w.classList.remove('pudar'); void w.offsetWidth; w.classList.add('pudar'); muat(); if (window.innerWidth <= 1100) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        ctx.on('click', '[data-balik]', function () { qs('[data-split]', ctx.el).classList.remove('lihat-lembar'); });
        ctx.aksi({ minta: function () { mintaIdf(); } });
      });
    }
  });
  function lembarIdf(w, id, ctx) {
    Q('idf.detail', { id: id }).then(function (f) {
      if (ctx.st.pilih !== id) return;
      var isi = f.boleh_isi, wajib = (f.format || {}).wajib || [];
      var h = '<div class="lembar-kepala"><button type="button" class="btn ikon kecil hantu split-balik" data-balik aria-label="Kembali ke antrean">' + ic('arrow-left') + '</button>' + UI.ava(f.nama_pasien, 'b') + '<div class="tumbuh" style="min-width:0"><span class="label-mikro">' + e(f.id) + ' · ' + e(f.alasan) + '</span><h2>' + e(f.nama_pasien) + '</h2><div class="meta">' + UI.lencana(f.status) + '<span class="tag">' + e(f.nama_perawat) + (f.penerima ? ' → ' + e(f.penerima) : '') + '</span>' + (f.usia ? '<span class="tag">' + f.usia + ' th</span>' : '') + '</div></div></div>';
      h += '<nav class="seksi-nav" aria-label="Bagian form">' + IDF_GRUP.map(function (g, i) { var lengkap = g.b.every(function (j) { return f[IDF_BAG[j][0]]; }); return '<button type="button" data-nav="' + g.k + '" class="' + (lengkap ? 'ok' : '') + '"><span class="h">' + (i + 1) + '</span>' + e(g.l) + '</button>'; }).join('') + '</nav>';
      h += '<form class="lembar-isi" data-idf-form novalidate><div class="panel-lembut mb-12"><dl class="info-grid"><div class="penuh"><dt>Diagnosa</dt><dd>' + e(f.diagnosa || '—') + '</dd></div><div><dt>Perawat pengisi</dt><dd>' + e(f.nama_perawat) + '</dd></div><div><dt>Perawat penerima</dt><dd>' + e(f.penerima || '—') + '</dd></div></dl></div>' +
        IDF_GRUP.map(function (g) { return '<section class="seksi-lap" data-seksi="' + g.k + '"><header><b class="tumbuh">' + e(g.l) + '</b></header><div class="badan"><div class="form">' + g.b.map(function (j) { var b = IDF_BAG[j], wj = wajib.indexOf(b[0]) > -1; return '<div class="fld" data-k="' + b[0] + '"><label>' + (j + 1) + '. ' + e(b[1]) + (wj ? ' <span class="wajib">*</span>' : '') + (b[2] ? ' <span class="redup" style="font-weight:400">· ' + e(b[2]) + '</span>' : '') + '</label>' + (isi ? '<textarea class="inp" name="' + b[0] + '" rows="3">' + e(f[b[0]] || '') + '</textarea>' : '<div class="panel-lembut" style="white-space:pre-wrap;font-size:13px">' + (f[b[0]] ? e(f[b[0]]) : '<span class="redup-2">—</span>') + '</div>') + '<span class="galat"></span></div>'; }).join('') + '</div></div></section>'; }).join('') +
        (f.status === 'Ditinjau' ? '<div class="panel-ok mt-16">' + ic('badge-check', 'k') + '<div>Ditinjau oleh <b>' + e(f.ditinjau_oleh) + '</b> · ' + U.waktu(f.tanggal_ditinjau) + '. Formulir tersedia bagi perawat penerima.</div></div>' : '') + '</form>';
      h += '<div class="lembar-kaki"><button type="button" class="btn kecil" data-sebelum>' + ic('chevron-left') + '<span>Sebelumnya</span></button><button type="button" class="btn kecil" data-lanjut><span>Berikutnya</span>' + ic('chevron-right') + '</button><span class="tumbuh"></span><button type="button" class="btn kecil hantu" data-cetak>' + ic('printer') + 'Cetak</button>' + (isi ? '<button type="button" class="btn" data-draf>' + ic('save') + 'Simpan draf</button><button type="button" class="btn primer" data-kirim>' + ic('send') + 'Kirim ke koordinator</button>' : '') + (f.boleh_tinjau ? '<button type="button" class="btn primer" data-tinjau>' + ic('badge-check') + 'Tandai sudah ditinjau</button>' : '') + '</div>';
      w.innerHTML = h;
      var form = qs('[data-idf-form]', w); UI.pasangForm(form);
      var nav = pasangSeksi(w, form);
      w.onclick = function (ev) {
        var b = ev.target.closest('[data-draf],[data-kirim],[data-tinjau],[data-cetak]'); if (!b) return;
        if (b.hasAttribute('data-cetak')) return window.print();
        if (b.hasAttribute('data-tinjau')) return UI.kerja(b, function () { return T('idf.tinjau', { id: f.id }); }).then(function () { UI.toast(A.API.pesan, 'ok'); R.muatUlang(); }).catch(function () { });
        var kirim = b.hasAttribute('data-kirim');
        UI.kerja(b, function () { return T('idf.simpan', { id: f.id, data: UI.bacaForm(form), kirim: kirim }); }, { form: form }).then(function () { UI.toast(kirim ? 'Formulir terkirim ke koordinator untuk ditinjau.' : 'Draf tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { nav.keGalat(); });
      };
    }).catch(function (er) { w.innerHTML = '<div class="lembar-kosong">' + UI.kosong('Form tidak dapat dibuka', er.message) + '</div>'; });
  }
  function mintaIdf(pre) {
    Q('penugasan.list', {}).then(function (d) {
      var tg = d.rows.filter(function (t) { return t.status === 'Berjalan'; });
      UI.formModal({ judul: 'Minta Identifikasi Pasien', ikon: 'send', sub: 'Perawat yang sedang bertugas akan mendapat notifikasi untuk mengisi form handover', data: pre || {}, fields: [{ k: 'penugasan_id', l: 'Penugasan (pasien · perawat pengisi)', t: 'pilih', wajib: true, opsi: tg.map(function (t) { return { v: t.id, l: t.nama_pasien + ' · ' + t.nama_perawat + ' (' + t.peran + ')' }; }) }, { k: 'alasan', l: 'Alasan', t: 'pilih', wajib: true, opsi: ['Handover Pergantian (Rotasi)', 'Handover Pergantian (Infal)', 'Evaluasi', 'Pasien baru', 'Perubahan kondisi'] }, { k: 'perawat_penerima_id', l: 'Perawat penerima (opsional)', t: 'pilih', opsi: d.siaga.map(function (s) { return { v: s.id, l: s.nama + ' · siaga' }; }).concat(tg.map(function (t) { return { v: t.perawat_id, l: t.nama_perawat }; })).filter(function (x, i, a) { return a.findIndex(function (y) { return y.v === x.v; }) === i; }) }],
        simpan: function (v) { return T('idf.minta', v); }, selesai: function () { R.muatUlang(); } });
    }).catch(UI.galat);
  }
  A.F.mintaIdf = mintaIdf;

  /* ===================== HOME VISIT — split: antrean kunjungan + lembar kerja tindakan ===================== */
  /* Checklist prosedur umum keperawatan sebagai alat bantu di lokasi. Tidak ada kolom khusus di server:
     item yang dicentang ikut tersimpan sebagai ringkasan di awal "Hasil tindakan". */
  var CEKLIS_AWAL = ['Identifikasi pasien (nama & tanggal lahir) sesuai jadwal', 'Kebersihan tangan & alat pelindung diri', 'Alat dan bahan siap, kemasan steril utuh'];
  var CEKLIS_JENIS = {
    'Infus Vitamin': ['Order, dosis, dan tanggal kedaluwarsa cairan dicek', 'Akses IV terpasang, tetesan lancar, area tusukan baik', 'Keluhan & reaksi dipantau selama infus'],
    'Pasang NGT': ['Panjang selang diukur sebelum insersi', 'Posisi selang dikonfirmasi sebelum digunakan', 'Selang difiksasi & panjangnya ditandai'],
    'Lepas NGT': ['Pemberian makan dihentikan sebelum pelepasan', 'Selang dilepas perlahan dan dicek keutuhannya', 'Keluhan setelah pelepasan dipantau'],
    'Pasang Kateter': ['Insersi dengan teknik aseptik', 'Balon dikembangkan sesuai ukuran kateter', 'Selang & kantong urine difiksasi di bawah kandung kemih'],
    'Lepas Kateter': ['Balon dikempiskan sepenuhnya sebelum dilepas', 'Kateter dilepas perlahan dan dicek keutuhannya', 'Keluarga diedukasi memantau BAK pertama'],
    'Perawatan Luka': ['Luka dikaji: ukuran, eksudat, tanda infeksi', 'Luka dibersihkan sesuai order', 'Balutan baru terpasang rapi'],
    'Injeksi': ['Prinsip benar obat dicek (obat, dosis, rute, waktu, pasien)', 'Lokasi injeksi sesuai rute', 'Reaksi setelah injeksi dipantau']
  };
  var CEKLIS_AKHIR = ['Edukasi pasien/keluarga diberikan', 'Limbah medis & benda tajam dibuang sesuai prosedur'];
  function ceklisUntuk(j) { return CEKLIS_AWAL.concat(CEKLIS_JENIS[j] || []).concat(CEKLIS_AKHIR); }
  R.daftar('homevisit', {
    judul: 'Home Visit', kerangka: 'tabel',
    render: function (ctx) {
      var st = ctx.st, p = ctx.me.peran, koor = p === 'HVK' || p === 'ADM'; st.bulan = st.bulan || U.bulanIni(); st.tab = st.tab || 'aktif';
      return Q('hv.list', { bulan: st.bulan }).then(function (rows) {
        if (ctx.basi()) return;
        var hari = U.hariIni(), grup = { aktif: rows.filter(function (r) { return r.status === 'Terjadwal'; }), hariini: rows.filter(function (r) { return r.tanggal === hari; }), selesai: rows.filter(function (r) { return r.status === 'Selesai'; }), batal: rows.filter(function (r) { return r.status === 'Batal'; }) };
        var sel = (grup[st.tab] || rows).slice().sort(function (a, b) { return (a.tanggal + a.jadwal_jam) < (b.tanggal + b.jadwal_jam) ? (st.tab === 'selesai' ? 1 : -1) : (st.tab === 'selesai' ? -1 : 1); }), omzet = U.jumlah(grup.selesai, 'biaya');
        if (ctx.q.id && rows.some(function (r) { return r.id === ctx.q.id; })) { st.pilih = ctx.q.id; var x0 = rows.filter(function (r) { return r.id === ctx.q.id; })[0]; if (!sel.some(function (r) { return r.id === x0.id; })) sel.unshift(x0); }
        if (!st.pilih || !rows.some(function (r) { return r.id === st.pilih; })) st.pilih = window.innerWidth > 1100 && sel.length ? sel[0].id : '';
        ctx.el.innerHTML = UI.kepala('Home Visit', 'Tindakan medis kunjungan rumah · informed consent wajib sebelum tindakan', '<input type="month" class="inp kecil" data-bulan value="' + st.bulan + '" style="width:auto" aria-label="Bulan">' + (koor ? UI.btn('Jadwalkan kunjungan', { k: 'primer kecil', a: 'baru', i: 'calendar-plus', kunci: 'n' }) : '')) +
          '<div class="grid g4 kpi-baris masuk">' + UI.kpi({ label: 'Hari ini', nilai: grup.hariini.length, utama: true, ikon: 'stethoscope', sub: U.tglP(hari) }) + UI.kpi({ label: 'Terjadwal', nilai: grup.aktif.length, ikon: 'calendar-days', sub: grup.aktif.filter(function (r) { return r.status_consent !== 'Disetujui'; }).length + ' belum consent' }) + UI.kpi({ label: 'Selesai', nilai: grup.selesai.length, ikon: 'circle-check', sub: U.bulan(st.bulan) }) + UI.kpi({ label: 'Nilai tindakan', nilai: U.rpS(omzet), ikon: 'wallet', sub: 'kunjungan selesai' }) + '</div>' +
          '<div class="mt-16">' + UI.tab([{ id: 'aktif', l: 'Terjadwal', n: grup.aktif.length }, { id: 'hariini', l: 'Hari ini', n: grup.hariini.length }, { id: 'selesai', l: 'Selesai', n: grup.selesai.length }, { id: 'batal', l: 'Batal', n: grup.batal.length }], st.tab) + '</div>' +
          '<div class="split pudar' + (ctx.q.id ? ' lihat-lembar' : '') + '" data-split><div class="kartu split-kiri"><div class="kartu-kepala"><div><h2>Antrean kunjungan</h2><p>' + sel.length + ' kunjungan · ' + U.bulan(st.bulan) + '</p></div></div><div class="antrean">' +
          (sel.length ? sel.map(function (x) { var ok = x.status_consent === 'Disetujui'; return itemAntrean({ aktif: x.id === st.pilih, data: { hv: x.id }, ava: x.nama_pasien, judul: x.jenis_tindakan + ' · ' + x.nama_pasien, sub: U.tglK(x.tanggal) + ' · ' + e(x.nama_perawat || '') + ' · ' + e(x.wilayah || ''), jam: String(x.jadwal_jam || '').replace(':', '.'), lencana: x.status === 'Terjadwal' ? UI.lencana(ok ? 'Consent OK' : 'Consent belum', ok ? 'ok' : 'warn') : UI.lencana(x.status) }); }).join('') : '<div class="antrean-kosong">Tidak ada kunjungan pada tab ini.</div>') +
          '</div></div><div class="kartu lembar boleh-sembunyi" data-lembar-hv></div></div>';
        var w = qs('[data-lembar-hv]', ctx.el);
        function gambar() { var x = rows.filter(function (r) { return r.id === st.pilih; })[0]; if (!x) { w.innerHTML = '<div class="lembar-kosong">' + UI.kosong('Pilih kunjungan dari antrean', 'Lembar kerja tindakan terbuka di sini: consent digital, checklist, dan foto dokumentasi.') + '</div>'; return; } lembarHV(w, x); }
        gambar();
        ctx.on('change', '[data-bulan]', function (i) { st.bulan = i.value || U.bulanIni(); R.muatUlang(); });
        ctx.on('click', '[data-tab]', function (b) { st.tab = b.dataset.tab; R.muatUlang(); });
        ctx.on('click', '[data-hv]', function (a) { st.pilih = a.dataset.hv; qsa('[data-hv]', ctx.el).forEach(function (x) { x.classList.toggle('aktif', x === a); }); qs('[data-split]', ctx.el).classList.add('lihat-lembar'); w.classList.remove('pudar'); void w.offsetWidth; w.classList.add('pudar'); gambar(); if (window.innerWidth <= 1100) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        ctx.on('click', '[data-balik]', function () { qs('[data-split]', ctx.el).classList.remove('lihat-lembar'); });
        ctx.aksi({ baru: function () { jadwalHV(); } });
        if (ctx.q.baru && koor) setTimeout(jadwalHV, 150);
      });
    }
  });
  function ilustrasiHV(j) { j = String(j); return /infus|vitamin/i.test(j) ? 'hv-infus' : /ngt/i.test(j) ? 'hv-ngt' : /kateter/i.test(j) ? 'hv-kateter' : 'hv-luka'; }
  function jadwalHV() {
    Promise.all([Q('crud.list', { mod: 'pasien' }), Q('crud.list', { mod: 'perawat_hv' })]).then(function (r) {
      var ps = r[0].rows.filter(function (x) { return x.jenis_layanan === 'HV' && x.status !== 'Nonaktif'; }), pr = r[1].rows.filter(function (x) { return x.status === 'Aktif'; });
      UI.formModal({ judul: 'Jadwalkan kunjungan', ikon: 'calendar-plus', data: { tanggal: U.tambahHari(U.hariIni(), 1), jadwal_jam: '10:00' }, fields: [{ k: 'pasien_id', l: 'Pasien home visit', t: 'pilih', wajib: true, opsi: ps.map(function (x) { return { v: x.id, l: x.nama_pasien + ' · ' + x.wilayah }; }) }, { k: 'jenis_tindakan', l: 'Jenis tindakan', t: 'pilih', wajib: true, opsi: A.Sesi.boot.master.jenis_tindakan_hv, lebar: 'l3' }, { k: 'biaya', l: 'Biaya tindakan', t: 'rupiah', wajib: true, lebar: 'l3' }, { k: 'tanggal', l: 'Tanggal', t: 'tanggal', wajib: true, lebar: 'l3' }, { k: 'jadwal_jam', l: 'Jam', t: 'jam', wajib: true, lebar: 'l3' }, { k: 'perawat_hv_id', l: 'Perawat home visit', t: 'pilih', wajib: true, opsi: pr.map(function (x) { return { v: x.id, l: x.nama + ' · ' + (x.kompetensi_tindakan || x.jabatan) }; }) }],
        simpan: function (v) { return T('hv.jadwal', { data: v }); }, selesai: function () { R.muatUlang(); } });
    }).catch(UI.galat);
  }
  function lembarHV(w, x) {
    var me = A.Sesi.me, milik = me.peran === 'ADM' || (me.peran === 'HV' && x.perawat_hv_id === me.perawat_id), koor = me.peran === 'HVK' || me.peran === 'ADM', ok = x.status_consent === 'Disetujui', langkah = x.status === 'Selesai' ? 3 : ok ? 2 : 1;
    var h = '<div class="lembar-kepala"><button type="button" class="btn ikon kecil hantu split-balik" data-balik aria-label="Kembali ke antrean">' + ic('arrow-left') + '</button><span class="ikon-ov" style="width:48px;height:48px;border-radius:14px;overflow:hidden;background:#F1F5F9"><img src="assets/ilustrasi/' + ilustrasiHV(x.jenis_tindakan) + '.svg" alt="" style="width:100%;height:100%;object-fit:cover"></span><div class="tumbuh" style="min-width:0"><span class="label-mikro">' + e(x.id) + ' · ' + U.tglP(x.tanggal) + ' · ' + e(String(x.jadwal_jam).replace(':', '.')) + '</span><h2>' + e(x.jenis_tindakan) + '</h2><div class="meta">' + UI.lencana(x.status) + '<span class="tag">' + e(x.nama_pasien) + '</span><span class="tag">' + ic('user-round', 'k') + ' ' + e(x.nama_perawat || '—') + '</span>' + UI.lencana(ok ? 'Consent OK' : 'Consent belum', ok ? 'ok' : 'warn') + '</div></div></div>';
    h += '<div class="stepper v2">' + ['Jadwal', 'Informed consent', 'Tindakan & dokumentasi', 'Selesai'].map(function (s, i) { return '<div class="s ' + (i < langkah ? 'selesai' : i === langkah ? 'aktif' : '') + '"><i></i>' + e(s) + '</div>'; }).join('') + '</div><div class="lembar-isi">';
    h += '<dl class="info-grid panel-lembut"><div><dt>Pasien</dt><dd>' + e(x.nama_pasien) + '</dd></div><div><dt>Biaya</dt><dd>' + U.rp(x.biaya) + '</dd></div><div class="penuh"><dt>Alamat</dt><dd>' + e(x.alamat || '—') + '</dd></div><div><dt>Perawat</dt><dd>' + e(x.nama_perawat || '—') + '</dd></div><div><dt>Kontak keluarga</dt><dd>' + e(x.nama_pj || '—') + (x.no_wa_pj ? ' · <a href="' + U.wa(x.no_wa_pj) + '" target="_blank" rel="noopener">' + e(x.no_wa_pj) + '</a>' : '') + '</dd></div></dl>';
    if (x.status === 'Batal') h += '<div class="panel-bahaya mt-12">' + ic('circle-x', 'k') + '<div>Kunjungan dibatalkan. ' + e(x.catatan_tambahan || '') + '</div></div>';
    else if (!ok) h += '<h3 class="mt-16">Informed consent digital</h3>' + (milik ? '<div class="panel-peringatan mt-8">' + ic('lock', 'k') + '<div>Lembar tindakan <b>terkunci</b> sampai pasien/keluarga menyetujui tindakan <b>' + e(x.jenis_tindakan) + '</b> dan menandatangani di bawah.</div></div><form data-consent class="mt-12" novalidate>' + UI.form([{ k: 'consent_oleh', l: 'Nama pemberi persetujuan', wajib: true, lebar: 'l3', bawaan: x.nama_pj }, { k: 'consent_relasi', l: 'Hubungan dengan pasien', t: 'pilih', wajib: true, lebar: 'l3', opsi: ['Pasien sendiri', 'Suami', 'Istri', 'Anak', 'Orang tua', 'Saudara', 'Wali'] }, { k: 'setuju', l: 'Persetujuan', t: 'cek', teks: 'Saya telah mendapat penjelasan tujuan, manfaat, dan risiko tindakan ' + x.jenis_tindakan + ', serta menyetujui tindakan dilakukan.' }]) + '<div class="fld mt-12" data-k="ttd"><label>Tanda tangan pasien / keluarga</label><canvas class="ttd-kanvas" data-ttd-c></canvas><div class="baris rata"><span class="bantu">Minta keluarga menandatangani di layar.</span><button type="button" class="btn mini hantu" data-hapus-ttd>' + ic('eraser', 'k') + 'Hapus</button></div><span class="galat"></span></div></form>' : '<p class="redup kecil mt-8">Menunggu perawat home visit meminta persetujuan di lokasi.</p>');
    else if (x.status !== 'Selesai') {
      h += '<div class="panel-ok mt-12">' + ic('file-check', 'k') + '<div>Consent <b class="mono">' + e(x.consent_id) + '</b> disetujui oleh ' + e(x.consent_oleh) + ' (' + e(x.consent_relasi) + ').</div></div>';
      if (milik) {
        var cl = ceklisUntuk(x.jenis_tindakan);
        h += '<form data-tindakan class="mt-16" novalidate><div class="baris rata"><h3>Checklist tindakan · ' + e(x.jenis_tindakan) + '</h3><span class="kecil redup" data-ceklis-hit>0/' + cl.length + '</span></div><p class="kecil redup mt-4">Item yang dicentang ikut tersimpan pada catatan hasil tindakan.</p><div class="ceklis mt-8">' + cl.map(function (c, i) { return '<label><input type="checkbox" data-ceklis="' + i + '">' + e(c) + '</label>'; }).join('') + '</div>' +
          '<h3 class="mt-16">Bukti foto</h3><div class="foto-ganda mt-8">' + ['sebelum', 'sesudah'].map(function (s) { return '<div class="fld" data-k="foto_' + s + '"><label class="unggah" for="hv-foto-' + s + '">' + ic('camera', 'b') + '<b>Foto ' + s + ' tindakan</b><span data-nama>Ambil atau pilih foto</span><input type="file" id="hv-foto-' + s + '" name="foto_' + s + '" accept="image/*" capture="environment" hidden></label><span class="galat"></span></div>'; }).join('') + '</div>' +
          '<div class="form mt-16"><div class="fld" data-k="hasil_tindakan"><label>Hasil tindakan <span class="wajib">*</span></label><textarea class="inp" name="hasil_tindakan" rows="3" placeholder="mis. NGT Fr 16 terpasang, posisi dicek, fiksasi hidung kanan"></textarea><span class="galat"></span></div><div class="fld" data-k="catatan_tambahan"><label>Catatan / edukasi keluarga</label><textarea class="inp" name="catatan_tambahan" rows="2"></textarea><span class="galat"></span></div></div>' +
          '<div class="fld mt-12" data-k="ttd"><label>Tanda tangan pasien / keluarga (bukti tindakan selesai)</label><canvas class="ttd-kanvas" data-ttd-t></canvas><div class="baris" style="justify-content:flex-end"><button type="button" class="btn mini hantu" data-hapus-ttd>' + ic('eraser', 'k') + 'Hapus</button></div><span class="galat"></span></div></form>';
      }
    } else h += '<div class="panel-ok mt-12">' + ic('badge-check', 'k') + '<div>Tindakan selesai · consent <b class="mono">' + e(x.consent_id) + '</b></div></div><div class="grid g2 mt-12"><div><div class="label-mikro mb-12">Sebelum</div>' + A.F.gambar(x.foto_sebelum_url, 'Foto sebelum') + '</div><div><div class="label-mikro mb-12">Sesudah</div>' + A.F.gambar(x.foto_sesudah_url, 'Foto sesudah') + '</div></div><h3 class="mt-16">Hasil tindakan</h3><p class="mt-4" style="white-space:pre-line">' + e(x.hasil_tindakan || '—') + '</p>' + (x.catatan_tambahan ? '<p class="redup kecil mt-8">' + e(x.catatan_tambahan) + '</p>' : '');
    h += '</div><div class="lembar-kaki">' + (koor && x.status === 'Terjadwal' ? '<button type="button" class="btn bahaya kecil" data-batal>' + ic('circle-x') + 'Batalkan</button>' : '') + '<span class="tumbuh"></span>' + (milik && !ok && x.status === 'Terjadwal' ? '<button type="button" class="btn primer" data-simpan-consent>' + ic('file-signature') + 'Simpan consent</button>' : '') + (milik && ok && x.status === 'Terjadwal' ? '<button type="button" class="btn primer" data-selesai>' + ic('circle-check') + 'Selesaikan tindakan</button>' : '') + '</div>';
    w.innerHTML = h;
    A.F.muatBerkas(w);
    var kc = w.querySelector('[data-ttd-c]'), kt = w.querySelector('[data-ttd-t]'), ttd = null;
    qsa('form', w).forEach(UI.pasangForm);
    setTimeout(function () { if (kc) ttd = UI.ttd(kc); if (kt) ttd = UI.ttd(kt); }, 60);
    w.onchange = function (ev) { if (ev.target.matches('[data-ceklis]')) { var n = qsa('[data-ceklis]:checked', w).length, t = qsa('[data-ceklis]', w).length; qs('[data-ceklis-hit]', w).textContent = n + '/' + t; } };
    w.onclick = function (ev) {
      var b;
      if (ev.target.closest('[data-hapus-ttd]')) { if (ttd) ttd.hapus(); return; }
      if ((b = ev.target.closest('[data-simpan-consent]'))) { var f = w.querySelector('[data-consent]'), v = UI.bacaForm(f); v.ttd = ttd ? ttd.data() : ''; v.id = x.id; if (!UI.cekWajib(f, [{ k: 'consent_oleh', l: 'Nama pemberi persetujuan', wajib: true }, { k: 'consent_relasi', l: 'Hubungan dengan pasien', wajib: true }])) return; if (!v.setuju) return UI.tandaiGalat(f, { setuju: 'Wajib dicentang' }); UI.kerja(b, function () { return T('hv.consent', v); }, { form: f }).then(function () { UI.toast(A.API.pesan, 'ok'); R.muatUlang(); }).catch(function () { }); return; }
      if ((b = ev.target.closest('[data-selesai]'))) {
        var ft = w.querySelector('[data-tindakan]'), g = {};
        if (!qs('[name=foto_sebelum]', ft).files.length) g.foto_sebelum = 'Foto sebelum tindakan wajib.'; if (!qs('[name=foto_sesudah]', ft).files.length) g.foto_sesudah = 'Foto sesudah tindakan wajib.'; if (!qs('[name=hasil_tindakan]', ft).value.trim()) g.hasil_tindakan = 'Hasil tindakan wajib diisi.';
        if (Object.keys(g).length) { UI.tandaiGalat(ft, g); return; }
        var item = qsa('[data-ceklis]', ft), dicentang = item.filter(function (c) { return c.checked; });
        UI.kerja(b, function () { return UI.bacaBerkas(ft, 6).then(function (bk) { var v = UI.bacaForm(ft); v.id = x.id; v.ttd = ttd ? ttd.data() : ''; if (dicentang.length) v.hasil_tindakan = 'Checklist ' + dicentang.length + '/' + item.length + ': ' + dicentang.map(function (c) { return c.parentNode.textContent.trim(); }).join('; ') + '.\n' + v.hasil_tindakan; Object.keys(v).forEach(function (k) { if (/^\d+$/.test(k)) delete v[k]; }); return Promise.all([bk.foto_sebelum ? U.kecilkanGambar(bk.foto_sebelum, 900) : '', bk.foto_sesudah ? U.kecilkanGambar(bk.foto_sesudah, 900) : '']).then(function (fx) { v.foto_sebelum = fx[0]; v.foto_sesudah = fx[1]; return T('hv.selesai', v); }); }); }, { form: ft }).then(function () { UI.toast(A.API.pesan, 'ok'); R.muatUlang(); }).catch(function () { });
        return;
      }
      if ((b = ev.target.closest('[data-batal]'))) UI.konfirmasi({ judul: 'Batalkan kunjungan?', pesan: x.jenis_tindakan + ' untuk ' + x.nama_pasien + ' pada ' + U.tgl(x.tanggal) + '.', alasan: 'Alasan pembatalan', bahaya: true, ok: 'Batalkan kunjungan' }).then(function (v) { if (!v) return; T('hv.batal', { id: x.id, alasan: v.alasan }).then(function () { UI.toast(A.API.pesan || 'Kunjungan dibatalkan.', 'ok'); R.muatUlang(); }).catch(UI.galat); });
    };
  }
})();
