/* =====================================================================
 * CAPTEN CARE — HALAMAN UTAMA
 * Masuk, Dashboard per peran, Analitik Penjualan, Operasional Harian,
 * Target & KPI, Profil, Bantuan & SOP.
 * ===================================================================== */
(function () {
  'use strict';
  var A = window.CCApp, U = A.U, ic = A.ic, UI = A.UI, G = A.G, Kal = A.Kal, Q = A.Q, T = A.T, R = A.Router, qs = A.qs, qsa = A.qsa, e = U.e;
  A.F = A.F || {};
  var PERAN_INFO = { ADM: 'Admin / Direksi', KEP: 'Keperawatan', PRW: 'Perawat HC', HV: 'Home Visit', HVK: 'Koordinator HV', CS: 'Customer Service', HRD: 'HRD', OPS: 'Operasional', KEU: 'Keuangan', PC: 'Admin Petty Cash' };
  function sapa() { var j = new Date().getHours(); return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam'; }
  function namaDepan(n) { var s = String(n || '').replace(/^(dr\.|Ns\.|Bdn\.|CG\.|Tn\.|Ny\.|Bpk\.|Ibu|H\.|Hj\.)\s*/g, '').replace(/,.*$/, '').trim().split(/\s+/); if (s.length > 1 && /^[A-Za-z]\.?$/.test(s[0].replace(/\.$/, '')) ) return s[1]; return s[0] || n; }
  A.F.sapa = sapa; A.F.namaDepan = namaDepan;
  function lencanaKondisi(k) { return UI.lencana(k || '—', k === 'Stabil' ? 'ok' : k === 'Perlu pemantauan' ? 'warn' : k ? 'bahaya' : 'netral'); }
  A.F.lencanaKondisi = lencanaKondisi;
  function ttvMini(l) { return '<span class="ttv-mini mono" title="Tensi · nadi · suhu · SpO₂"><b>' + e(l.tensi || '—') + '</b><i>N ' + e(l.nadi || '—') + '</i><i>' + e(l.suhu || '—') + '°</i><i>' + e(l.spo2 || '—') + '%</i></span>'; }
  A.F.ttvMini = ttvMini;

  /* ===================== HALAMAN MASUK (v2) ===================== */
  /* Panel kiri: grid arsitektural + "Live Patient Status Card" — DATA FIKTIF STATIS, tidak pernah data pasien asli
     (halaman masuk terbuka untuk publik). Panel kanan: form ringkas + satu tombol Akses Cepat Mode Demo. */
  function kartuPratinjau() {
    var j = new Date(), jam = (j.getHours() < 10 ? '0' : '') + j.getHours() + '.' + (j.getMinutes() < 10 ? '0' : '') + j.getMinutes();
    return '<div class="lg-kartu" aria-hidden="true"><div class="lg-atas"><span class="lg-live"><i></i>LIVE · PENUGASAN AKTIF</span><span class="lg-waktu" data-lg-jam>' + jam + ' WIB</span></div>' +
      '<div class="lg-pasien"><span class="ava b" data-w="4">KW</span><div class="tumbuh" style="min-width:0"><b>Ny. Kartini Wulandari</b><span>74 th · Pasca stroke iskemik · Paket VIP</span></div><span class="lg-badge"><i></i>Home Care Aktif</span></div>' +
      '<div class="lg-perawat"><span class="ava k" data-w="1">DA</span><span class="tumbuh">Bertugas: <b>Ns. Dewi Anggraini, S.Kep</b></span><span>Shift Pagi · hari ke-12/30</span></div>' +
      '<div class="lg-ttv"><div><small>Tensi</small><b>128/82</b></div><div><small>Nadi</small><b>78</b></div><div><small>Suhu</small><b>36,6°</b></div><div><small>SpO₂</small><b>98%</b></div></div>' +
      '<div class="lg-lini"><div class="e ok"><time>07.42</time><b>Laporan shift malam</b> terkirim ke keluarga via WhatsApp</div><div class="e ok"><time>09.15</time><b>Obat pagi</b> diberikan sesuai jadwal</div><div class="e jalan"><time>11.30</time><b>Alih baring &amp; ROM pasif</b> sedang berlangsung</div></div>' +
      '<div class="lg-progres"><span>Laporan A–H</span><div class="meter"><i style="width:75%"></i></div><b style="color:#E2E8F0">6/8</b></div>' +
      '<div class="lg-catatan">PRATINJAU ILUSTRASI · DATA FIKTIF</div></div>';
  }
  R.daftar('masuk', {
    bebas: true,
    render: function (wadah) {
      var demo = A.API.mode === 'demo';
      wadah.innerHTML = '<div class="masuk-hal"><section class="masuk-kiri v2"><div class="baris celah-12"><span class="sb-logo"><img src="assets/logo.svg" alt="" data-logo></span><div class="sb-brand"><b data-brand>Capten Care</b><span data-tagline>Integrated Management System</span></div></div>' +
        '<div class="lg-panggung">' + kartuPratinjau() + '</div>' +
        '<div class="lg-kaki"><span>' + ic('clipboard-check') + 'Laporan A–H terstandar</span><span>' + ic('shield-check') + 'Izin berbasis peran</span><span>' + ic('qr-code') + 'Dokumen ber-QR</span></div></section>' +
        '<section class="masuk-kanan"><div class="masuk-kartu masuk v2"><div class="lg-merek-hp"><span class="sb-logo" style="background:var(--gelap)"><img src="assets/logo.svg" alt="" data-logo></span><div><b style="font:700 15px var(--f-judul)" data-brand>Capten Care</b><div class="kecil redup">Integrated Management System</div></div></div>' +
        '<span class="label-mikro">Masuk ke akun</span><h1 class="mt-4">Portal Operasional Terpadu</h1><p class="mikro">Masukkan kredensial Anda untuk mengakses sistem rekam medis &amp; penugasan.</p>' +
        '<form class="mt-24" data-form-masuk novalidate><div class="form"><div class="fld" data-k="username"><label for="m-user">Username</label><div class="inp-ikon">' + ic('user-round') + '<input class="inp" id="m-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Nama pengguna dari Admin" required></div><span class="galat"></span></div>' +
        '<div class="fld" data-k="pin"><label for="m-pin">PIN / Kata sandi</label><div class="inp-ikon">' + ic('lock-keyhole') + '<input class="inp" id="m-pin" name="pin" type="password" autocomplete="current-password" placeholder="••••••" required><button type="button" class="btn ikon hantu mini" data-lihat style="position:absolute;right:8px;top:50%;transform:translateY(-50%)" aria-label="Tampilkan PIN">' + ic('eye', 'k') + '</button></div><span class="galat"></span></div></div>' +
        '<div class="panel-bahaya mt-12 sembunyi" data-pesan-galat>' + ic('circle-alert', 'k') + '<span></span></div>' +
        '<button type="submit" class="btn primer penuh mt-16" data-masuk>' + ic('log-in') + '<span>Masuk</span><kbd>↵</kbd></button></form>' +
        (demo ? '<div class="pemisah-atau">atau</div><button type="button" class="demo-cepat" data-demo-cepat aria-haspopup="listbox" aria-expanded="false"><span class="zap">' + ic('zap') + '</span><span class="tumbuh"><b>Akses Cepat Mode Demo</b><small>Pilih peran — form terisi & langsung masuk</small></span>' + ic('chevron-down', 'panah') + '</button>' : '') +
        '<div class="baris rata mt-24 kecil redup"><a href="#/f/karir">' + ic('briefcase', 'k') + ' Lowongan perawat</a><a href="#/v">' + ic('qr-code', 'k') + ' Verifikasi dokumen</a></div></div></section></div>';
      Q('publik.tema', {}).then(function (t) { var b = (t && t.branding) || {}; A.Tema.terapkan(b); if (b.logo_url) qsa('[data-logo]', wadah).forEach(function (i) { i.src = b.logo_url; }); qsa('[data-brand]', wadah).forEach(function (nb) { nb.textContent = b.nama_brand || 'Capten Care'; }); }).catch(function () { });
      var form = qs('[data-form-masuk]', wadah), galat = qs('[data-pesan-galat]', wadah), tombol = qs('[data-masuk]', wadah);
      var jamT = setInterval(function () { var el = qs('[data-lg-jam]', wadah); if (!el || !document.body.contains(el)) return clearInterval(jamT); var j = new Date(); el.textContent = (j.getHours() < 10 ? '0' : '') + j.getHours() + '.' + (j.getMinutes() < 10 ? '0' : '') + j.getMinutes() + ' WIB'; }, 20000);
      UI.pasangForm(form);
      function masuk(u, p, b) {
        galat.classList.add('sembunyi');
        UI.kerja(b, function () { return A.Sesi.masuk(u, p); }).then(function (boot) {
          var tujuan = R._tujuan && !/masuk/.test(R._tujuan) ? R._tujuan.replace(/^#\/?/, '') : 'dashboard'; R._tujuan = null;
          A.Shell.terpasang = false; R.ke(tujuan, true);
          setTimeout(function () { UI.toast(sapa() + ', ' + namaDepan(boot.me.nama) + '. Anda masuk sebagai ' + boot.me.peran_label + '.', 'ok'); }, 250);
        }).catch(function (er) { galat.classList.remove('sembunyi'); qs('span', galat).textContent = er.message; if (er.code === 'LOCKED') galat.className = 'panel-peringatan mt-12'; else galat.className = 'panel-bahaya mt-12'; qs('#m-pin', wadah).select(); });
      }
      form.addEventListener('submit', function (ev) { ev.preventDefault(); var v = UI.bacaForm(form); if (!v.username || !v.pin) { UI.tandaiGalat(form, { username: !v.username ? 'Isi username' : '', pin: !v.pin ? 'Isi PIN' : '' }); return; } masuk(v.username, v.pin, tombol); });
      wadah.addEventListener('click', function (ev) {
        var dc = ev.target.closest('[data-demo-cepat]');
        if (dc) {
          dc.setAttribute('aria-expanded', 'true');
          var pop = UI.pop(dc, A.PERAN_DEMO.map(function (p) { return { l: p.l, i: ikonPeran(p.u), fn: function () { qs('#m-user', wadah).value = p.u; qs('#m-pin', wadah).value = p.p; masuk(p.u, p.p, tombol); } }; }));
          pop.classList.add('demo-pop'); pop.style.minWidth = dc.offsetWidth + 'px';
          qsa('.pop-item', pop).forEach(function (b, i) { b.insertAdjacentHTML('beforeend', '<small>' + e(A.PERAN_DEMO[i].u) + '</small>'); });
          var r = dc.getBoundingClientRect(), y = r.bottom + 6; if (y + pop.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - pop.offsetHeight - 6); pop.style.left = r.left + 'px'; pop.style.top = y + 'px';
          var tutup = setInterval(function () { if (!document.body.contains(pop)) { dc.setAttribute('aria-expanded', 'false'); clearInterval(tutup); } }, 200);
          return;
        }
        var l = ev.target.closest('[data-lihat]'); if (l) { var i = qs('#m-pin', wadah); i.type = i.type === 'password' ? 'text' : 'password'; l.innerHTML = ic(i.type === 'password' ? 'eye' : 'eye-off', 'k'); }
      });
      setTimeout(function () { var i = qs('#m-user', wadah); if (i && window.innerWidth > 860) i.focus(); }, 80);
    }
  });
  function ikonPeran(u) { return { direksi: 'shield-check', koordinator: 'heart-pulse', perawat: 'stethoscope', homevisit: 'syringe', perawathv: 'syringe', cs: 'message-circle-more', hrd: 'briefcase', operasional: 'activity', keuangan: 'landmark', pettycash: 'piggy-bank' }[u] || 'user-round'; }

  /* ===================== DASHBOARD ===================== */
  function kartuTindakan(rows, judul) {
    return '<div class="kartu"><div class="kartu-kepala"><div><h2>' + e(judul || 'Perlu tindakan') + '</h2><p>Diurutkan dari paling mendesak</p></div><span class="lencana ' + (rows.some(function (r) { return r.tingkat === 'kritis'; }) ? 'bahaya denyut' : 'netral') + '"><i></i>' + rows.length + ' item</span></div><div class="kartu-isi rapat"><div class="daftar">' +
      (rows.length ? rows.slice(0, 6).map(function (r) { return '<div class="item klik" data-rute="' + r.rute + '?id=' + encodeURIComponent(r.kode || '') + '"><span class="tingkat ' + e(r.tingkat) + '"></span><div class="tumpuk tumbuh"><b class="potong">' + e(r.judul) + '</b><span class="potong">' + e(r.kode) + ' · ' + e(r.sub) + '</span></div><span class="btn mini">' + e(r.aksi || 'Buka') + ic('arrow-right', 'k') + '</span></div>'; }).join('') + (rows.length > 6 ? '<a class="item klik" href="#/' + (rows[6].rute || 'kasus') + '" style="justify-content:center"><span class="kecil tebal info-t baris" style="gap:4px;white-space:nowrap">+' + (rows.length - 6) + ' item lainnya ' + ic('arrow-right', 'k') + '</span></a>' : '') : UI.kosong('Semua beres', 'Tidak ada yang perlu ditindaklanjuti saat ini.')) + '</div></div></div>';
  }
  function kartuTarget(rows) {
    return '<div class="kartu"><div class="kartu-kepala"><div><h2>Target bulan ini</h2><p>Realisasi dihitung otomatis dari data</p></div><a class="btn mini hantu" href="#/target">Semua ' + ic('arrow-right', 'k') + '</a></div><div class="kartu-isi">' + (rows.length ? rows.slice(0, 6).map(function (t) { var p = Math.round(U.n(t.persen)); return '<div class="mt-12"><div class="baris rata kecil"><span class="tebal potong">' + e(t.indikator) + '</span><span class="angka">' + (t.satuan === 'Rp' ? U.rpS(t.realisasi) : U.angka(t.realisasi, 1) + (t.satuan === '%' ? '%' : ' ' + e(t.satuan))) + ' <span class="redup">/ ' + (t.satuan === 'Rp' ? U.rpS(t.target) : U.angka(t.target) + (t.satuan === '%' ? '%' : '')) + '</span></span></div><div class="meter mt-4 ' + (p >= 100 ? 'ok' : p >= 75 ? '' : p >= 50 ? 'warn' : 'bahaya') + '"><i style="width:' + Math.min(100, p) + '%"></i></div><div class="kecil redup mt-4">' + e(t.divisi) + ' · ' + p + '% tercapai</div></div>'; }).join('') : '<p class="redup kecil">Belum ada target untuk periode ini.</p>') + '</div></div>';
  }
  function tabelLaporan(rows, judul) {
    return '<div class="kartu"><div class="kartu-kepala"><div><h2>' + e(judul || 'Laporan harian terbaru') + '</h2><p>Klik baris untuk melihat isian lengkap A–H</p></div><a class="btn mini hantu" href="#/laporan">Semua laporan ' + ic('arrow-right', 'k') + '</a></div><div class="kartu-isi rapat"><div class="tabel-wadah"><table class="tabel responsif"><thead><tr><th>Pasien</th><th>Perawat · shift</th><th>TTV</th><th>Kondisi · ketepatan</th><th class="kanan">Diisi</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (l) { return '<tr class="klik" data-lap="' + e(l.id) + '"><td class="utama-m" data-l="Pasien"><div class="utama-sel">' + e(l.nama_pasien) + '</div><div class="sub-sel potong" style="max-width:220px">' + e(l.diagnosa || '') + '</div></td><td data-l="Perawat"><div class="potong" style="max-width:170px">' + e(l.nama_perawat) + '</div><div class="sub-sel">Shift ' + e(l.shift_label || l.shift) + '</div></td><td data-l="TTV">' + ttvMini(l) + '</td><td data-l="Kondisi" style="white-space:nowrap">' + lencanaKondisi(l.kondisi_pasien) + '<div class="sub-sel">' + e(l.status_ketepatan || '') + '</div></td><td class="kanan" data-l="Diisi" style="white-space:nowrap">' + U.relatif(l.waktu_isi) + '</td></tr>'; }).join('') : '<tr><td colspan="5">' + UI.kosong('Belum ada laporan', 'Laporan hari ini akan tampil di sini.') + '</td></tr>') + '</tbody></table></div></div></div>';
  }
  function grafikKepatuhan(ctx, d, id) {
    ctx.grafik(function () { var el = qs('#' + id, ctx.el); if (!el) return; var h = d.kepatuhan_harian || []; G.garis(el, { label: h.map(function (x) { return x.tanggal; }), seri: [{ nama: 'Kepatuhan', warna: 'var(--merek)', data: h.map(function (x) { return x.persen; }) }], fmt: function (v) { return U.angka(v, 1) + '%'; }, fmtSumbu: function (v) { return Math.round(v) + '%'; }, maks: 100, acuan: 95, acuanLabel: 'Target 95%', area: true, labelPendek: U.tglK, labelTip: U.tglP, tipEkstra: function (i) { var x = h[i]; return '<div class="tr"><span>Tepat · Telat · Belum</span><b>' + x.tepat + ' · ' + x.telat + ' · ' + x.belum + '</b></div>'; }, aria: 'Kepatuhan laporan 30 hari' }); });
  }
  function grafikKasus(ctx, d, id) {
    ctx.grafik(function () { var el = qs('#' + id, ctx.el); if (!el) return; var g = d.grafik_kasus || []; G.batang(el, { label: g.map(function (x) { return x.label; }), seri: [{ nama: 'Selesai', data: g.map(function (x) { return x.selesai; }), warna: 'var(--s3)' }, { nama: 'Proses', data: g.map(function (x) { return x.proses; }), warna: 'var(--s1)' }, { nama: 'Masuk', data: g.map(function (x) { return x.masuk; }), warna: 'var(--s4)' }, { nama: 'Overdue', data: g.map(function (x) { return x.overdue; }), warna: 'var(--s2)' }], tumpuk: true, labelPendek: U.tglK, labelTip: function (l) { return 'Periode mulai ' + U.tgl(l); }, tinggi: 220, aria: 'Kasus per periode' }); });
  }
  function bukaLaporan(ctx) { ctx.on('click', '[data-lap]', function (t) { if (A.F.detailLaporan) A.F.detailLaporan(t.dataset.lap); }); }

  /* ===================== DASHBOARD (v2) =====================
   * Peran operasional (Admin, Keperawatan, Operasional, CS, Home Visit): kalender jadi hero,
   * 3 pill statistik ramping, panel kanan "Jadwal hari ini" + "Perlu tindakan mendesak".
   * Peran lain (Perawat, HRD, Keuangan, Petty Cash): dashboard khusus versi ramping (pill, tanpa tumpukan kartu). */
  var PERAN_KALENDER = /^(ADM|KEP|OPS|CS|HV|HVK)$/;
  R.daftar('dashboard', {
    judul: 'Dashboard',
    render: function (ctx) {
      var me = ctx.me, p = me.peran, st = ctx.st, kal = PERAN_KALENDER.test(p);
      st.bulan = st.bulan || U.bulanIni(); st.mati = st.mati || {}; st.pilih = st.pilih || U.hariIni();
      var sumber = [Q('dash.data', { rentang: 30 })];
      if (kal) sumber.push(/ADM|KEP|OPS|CS/.test(p) ? Q('penugasan.list', {}) : Promise.resolve(null), /ADM|OPS|HV/.test(p) ? Q('hv.list', { bulan: st.bulan }) : Promise.resolve(null), Q('kasus.list', {}));
      return Promise.all(sumber.map(function (x, i) { return i ? x.catch(function () { return null; }) : x; })).then(function (h) {
        if (ctx.basi()) return;
        var d = h[0], tgl = U.tglP(d.tanggal), isi = '';
        var kepala = UI.kepala(sapa() + ', ' + namaDepan(me.nama), tgl + ' · ' + e(me.peran_label), '<button type="button" class="btn kecil" data-a="segar">' + ic('refresh-cw') + '<span>Segarkan</span></button>');
        if (kal) isi = dashKalender(ctx, d, h);
        else if (p === 'PRW') isi = dashPerawat(ctx, d);
        else if (p === 'HRD') isi = dashHRD(ctx, d);
        else if (p === 'PC') isi = dashPC(ctx, d);
        else isi = dashKeuangan(ctx, d);
        ctx.el.innerHTML = kepala + isi;
        bukaLaporan(ctx);
        ctx.aksi({
          segar: function (b) { UI.kerja(b, function () { return Q('dash.data', { rentang: 30 }, { paksa: true }); }).then(function () { R.muatUlang(); A.Shell.muatGauge(); UI.toast('Dashboard diperbarui.', 'ok'); }); },
          ingatkan: function (b) { UI.kerja(b, function () { return T('laporan.ingatkan', { perawat_id: b.dataset.perawat, pasien_id: b.dataset.pasien, shift: b.dataset.shift, tanggal: d.tanggal }); }).then(function () { UI.toast(A.API.pesan || 'Pengingat dikirim ke perawat.', 'ok'); b.innerHTML = ic('check', 'k') + 'Terkirim'; b.disabled = true; }).catch(function () { }); }
        });
      });
    }
  });
  function kartuMendesak(rows) {
    rows = (rows || []).slice().sort(function (a, b) { var o = { kritis: 0, tinggi: 1, peringatan: 1 }; return (o[a.tingkat] == null ? 2 : o[a.tingkat]) - (o[b.tingkat] == null ? 2 : o[b.tingkat]); });
    var kritis = rows.filter(function (r) { return r.tingkat === 'kritis'; }).length;
    return '<div class="kartu"><div class="kartu-kepala"><div><h2>Perlu tindakan mendesak</h2><p>Tiket SLA overdue & item kritis</p></div><span class="lencana ' + (kritis ? 'bahaya denyut' : 'netral') + '"><i></i>' + rows.length + '</span></div><div class="kartu-isi rapat"><div class="daftar">' +
      (rows.length ? rows.slice(0, 5).map(function (r) { return '<div class="item klik" data-rute="' + e(r.rute) + '?id=' + encodeURIComponent(r.kode || '') + '"><span class="tingkat ' + e(r.tingkat) + '"></span><div class="tumpuk tumbuh"><b class="potong">' + e(r.judul) + '</b><span class="potong">' + e(r.kode) + ' · ' + e(r.sub) + '</span></div>' + ic('chevron-right', 'k') + '</div>'; }).join('') + (rows.length > 5 ? '<a class="item klik" href="#/' + (rows[5].rute || 'kasus') + '" style="justify-content:center"><span class="kecil tebal info-t baris" style="gap:4px;white-space:nowrap">+' + (rows.length - 5) + ' item lainnya ' + ic('arrow-right', 'k') + '</span></a>' : '') : UI.kosong('Semua beres', 'Tidak ada tiket overdue maupun item kritis.')) + '</div></div></div>';
  }
  function pilStatistik(ctx, d) {
    var p = ctx.me.peran, k = d.kpi || {};
    if (p === 'CS') { var c = d.cs || {}, l = c.lead || {}; return UI.pil({ ik: 'user-plus', l: 'Lead masuk', n: U.angka(l.masuk), s: 'belum di-follow up', rute: 'pipeline', k: 'utama' }) + UI.pil({ ik: 'message-circle-more', l: 'Follow-up', n: U.angka(l.followup), s: '≤ 2 hari: ' + U.persen(k.lead_followup_persen, 0), rute: 'pipeline' }) + UI.pil({ ik: 'handshake', l: 'Deal bulan ini', n: U.angka(l.deal), s: (c.so_saya || 0) + ' SO saya', rute: 'sales' }); }
    if (p === 'HV' || p === 'HVK') { var hv = d.hv || {}; return UI.pil({ ik: 'stethoscope', l: 'Kunjungan hari ini', n: U.angka((hv.hari_ini || []).length), rute: 'homevisit', k: 'utama' }) + UI.pil({ ik: 'calendar-days', l: 'Terjadwal', n: U.angka(hv.terjadwal), s: 'termasuk hari ini', rute: 'homevisit' }) + UI.pil({ ik: 'circle-check', l: 'Selesai bulan ini', n: U.angka(hv.bulan_ini), rute: 'homevisit' }); }
    return UI.pil({ ik: 'contact-round', l: 'Pasien aktif', n: U.angka(k.pasien_aktif), s: U.angka(k.pasien_hc) + ' HC · ' + U.angka(k.pasien_hv) + ' HV', rute: 'pasien', k: 'utama' }) +
      UI.pil({ ik: 'users-round', l: 'Perawat bertugas', n: U.angka(k.perawat_aktif), s: (k.perawat_utama || 0) + ' utama · ' + (k.perawat_infal || 0) + ' infal · ' + (k.perawat_siaga || 0) + ' siaga', rute: 'penugasan' }) +
      UI.pil({ ik: 'circle-alert', l: 'Kasus aktif', n: U.angka(k.kasus_aktif), s: '<span class="' + (k.kasus_overdue ? 'bahaya-t' : '') + '">' + (k.kasus_overdue || 0) + ' overdue</span> · SLA ' + U.persen(k.sla_persen, 0), rute: 'kasus', k: k.kasus_overdue ? 'bahaya' : '' });
  }
  function dashKalender(ctx, d, h) {
    var p = ctx.me.peran, st = ctx.st, tugas = h[1] ? h[1].rows || [] : null, hv = h[2], kasus = h[3] ? h[3].rows || [] : [];
    var kat = [], ev = Kal.kumpulkan({ tugas: tugas || [], hv: hv || [], kasus: kasus }, null);
    if (tugas) kat.push('hc'); if (hv) kat.push('hv'); if (tugas) kat.push('rot'); kat.push('sla');
    function gambarKal() {
      var w = qs('[data-kal-wadah]', ctx.el), a = qs('[data-agenda]', ctx.el); if (!w) return;
      w.innerHTML = Kal.html({ bulan: st.bulan, ev: ev, kat: kat, mati: st.mati, pilih: st.pilih, maks: 3, kaki: '<span>' + ic('info', 'k') + ' Klik tanggal untuk melihat jadwalnya · klik item untuk membuka detail</span><a href="#/jadwal" class="kecil tebal">Buka Jadwal &amp; Kalender →</a>' });
      var list = (ev[st.pilih] || []).filter(function (x) { return !st.mati[x.kat]; }), hariIni = st.pilih === U.hariIni();
      a.innerHTML = '<div class="kartu-kepala"><div><h2>' + (hariIni ? 'Jadwal hari ini' : 'Jadwal ' + e(U.tglK(st.pilih))) + '</h2><p>' + e(U.tglP(st.pilih)) + ' · ' + list.length + ' item</p></div>' + (hariIni ? '' : '<button type="button" class="btn mini hantu" data-kalh-nav="0">Hari ini</button>') + '</div><div class="kartu-isi rapat">' + Kal.agenda(list, UI.kosong(hariIni ? 'Tidak ada jadwal hari ini' : 'Tidak ada jadwal', 'Tidak ada kunjungan, rotasi, maupun tenggat SLA pada tanggal ini.')) + '</div>';
    }
    var html = '<div class="pil-baris masuk">' + pilStatistik(ctx, d) + '</div>' +
      '<div class="kalh-tata masuk-2"><div data-kal-wadah></div><div class="panel-kanan"><div class="kartu" data-agenda></div>' + kartuMendesak(d.perlu_tindakan) + '</div></div>';
    if (p === 'HV' || p === 'HVK') {
      var hvd = d.hv || {};
      html += '<div class="grid g2 mt-16 masuk-3"><div class="kartu"><div class="kartu-kepala"><div><h2>Tindakan bulan ini</h2><p>Per jenis tindakan home visit</p></div></div><div class="kartu-isi">' + G.hbar(Object.keys(hvd.per_tindakan || {}).map(function (k) { return { n: k, v: hvd.per_tindakan[k] }; }).sort(function (a, b) { return b.v - a.v; }), { fmt: function (v) { return v + '×'; }, warna: 'var(--kat-hv)' }) + '</div></div>' + kartuTarget(d.target || []) + '</div>';
    } else {
      html += '<div class="grid g-2-1 mt-16 masuk-3">' + G.kartu('g-kepatuhan', 'Kepatuhan laporan harian', '30 hari terakhir · garis putus-putus = target 95%', { tinggi: 230 }) + kartuTarget(d.target || []) + '</div>';
      if (p === 'KEP') html += '<div class="grid g2 mt-16 masuk-4"><div class="kartu"><div class="kartu-kepala"><div><h2>Laporan belum masuk</h2><p>Lewat batas waktu shift hari ini</p></div><span class="lencana ' + ((d.belum_masuk || []).length ? 'bahaya' : 'ok') + '"><i></i>' + (d.belum_masuk || []).length + '</span></div><div class="kartu-isi rapat"><div class="daftar">' + ((d.belum_masuk || []).length ? d.belum_masuk.map(function (b) { return '<div class="item">' + UI.ava(b.nama_perawat, 'k') + '<div class="tumpuk tumbuh"><b class="potong">' + e(b.nama_perawat) + '</b><span class="potong">' + e(b.nama_pasien) + ' · ' + e(b.shift) + ' · ' + U.angka(b.telat_jam, 1) + ' jam</span></div><button type="button" class="btn mini" data-a="ingatkan" data-perawat="' + e(b.perawat_id) + '" data-pasien="' + e(b.pasien_id) + '" data-shift="' + e(b.shift) + '">' + ic('bell-ring', 'k') + 'Ingatkan</button></div>'; }).join('') : UI.kosong('Semua laporan masuk', '')) + '</div></div></div>' +
        '<div class="kartu"><div class="kartu-kepala"><div><h2>Pantau kondisi pasien</h2><p>Laporan 3 hari terakhir dengan kondisi tidak stabil</p></div></div><div class="kartu-isi rapat"><div class="daftar">' + ((d.pantau || []).length ? d.pantau.map(function (l) { return '<div class="item klik" data-lap="' + e(l.id) + '"><span class="tingkat ' + (l.kondisi_pasien === 'Perlu pemantauan' ? 'peringatan' : 'kritis') + '"></span><div class="tumpuk tumbuh"><b class="potong">' + e(l.nama_pasien) + '</b><span class="potong">' + U.tglK(l.tanggal) + ' · ' + e(l.shift_label) + ' · ' + e(l.nama_perawat) + '</span></div>' + lencanaKondisi(l.kondisi_pasien) + '</div>'; }).join('') : UI.kosong('Semua pasien stabil', '')) + '</div></div></div></div>';
      if (p !== 'CS') html += '<div class="mt-16 masuk-4">' + tabelLaporan(d.laporan_terbaru || []) + '</div>';
      grafikKepatuhan(ctx, d, 'g-kepatuhan');
    }
    ctx.nanti(gambarKal);
    ctx.on('click', '[data-kalh-chip]', function (b) { var k = b.dataset.kalhChip; if (st.mati[k]) delete st.mati[k]; else st.mati[k] = true; gambarKal(); });
    function pilihHari(s) { st.pilih = s.dataset.kalhHari; qsa('.kalh-sel.pilih', ctx.el).forEach(function (x) { x.classList.remove('pilih'); }); s.classList.add('pilih'); gambarKal(); var a = qs('[data-agenda]', ctx.el); if (a && window.innerWidth <= 1100) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    ctx.on('click', '[data-kalh-hari]', function (s, ev) { if (ev.target.closest('[data-rute]')) return; pilihHari(s); });
    ctx.on('keydown', '[data-kalh-hari]', function (s, ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pilihHari(s); } });
    ctx.on('keydown', '.agenda-item', function (s, ev) { if (ev.key === 'Enter') R.ke(s.dataset.rute); });
    ctx.on('click', '[data-kalh-nav]', function (b) { var v = +b.dataset.kalhNav; if (v === 0) { st.bulan = U.bulanIni(); st.pilih = U.hariIni(); } else { st.bulan = U.tambahBulan(st.bulan, v); st.pilih = st.bulan === U.bulanIni() ? U.hariIni() : st.bulan + '-01'; } if (hv) R.muatUlang(); else gambarKal(); });
    return html;
  }
  function dashPerawat(ctx, d) {
    var kp = d.kepatuhan || {}, tugas = d.tugas_hari || [], sudah = tugas.filter(function (t) { return t.laporan_id; }).length, h = '';
    h += '<div class="pil-baris masuk">' + UI.pil({ ik: 'clipboard-pen', l: 'Laporan hari ini', n: sudah + '/' + tugas.length, s: tugas.length - sudah ? (tugas.length - sudah) + ' belum dikirim' : 'semua terkirim', rute: 'laporan', k: 'utama' }) + UI.pil({ ik: 'badge-check', l: 'Tepat waktu bulan ini', n: U.angka(kp.persen == null ? 100 : kp.persen, 1) + '%', s: (kp.tepat || 0) + ' dari ' + (kp.wajib || 0), rute: 'riwayat' }) + UI.pil({ ik: 'clipboard-list', l: 'Identifikasi diminta', n: U.angka(d.idf_diminta || 0), rute: 'identifikasi', k: d.idf_diminta ? 'bahaya' : '' }) + '</div>';
    if (d.idf_diminta) h += '<div class="panel-peringatan mb-12 masuk">' + ic('clipboard-pen') + '<div class="tumbuh"><b>Form Identifikasi Pasien diminta</b><div>Koordinator meminta Anda mengisi ' + d.idf_diminta + ' form identifikasi pasien (handover).</div></div><a class="btn mini" href="#/identifikasi">Isi sekarang</a></div>';
    h += '<div class="grid g-2-1 masuk-2"><div class="tumpuk celah-12"><div class="label-mikro">Tugas laporan hari ini</div>' + (tugas.length ? tugas.map(function (t, i) {
      var ada = !!t.laporan_id, telat = !ada && new Date() > U.parse(t.batas);
      return '<div class="kartu pad masuk-' + Math.min(4, i + 1) + '"><div class="baris atas celah-12">' + UI.ava(t.nama_pasien, 'b') + '<div class="tumpuk tumbuh"><b style="font:700 15px var(--f-judul)">' + e(t.nama_pasien) + '</b><span class="redup kecil">' + e(t.diagnosa) + '</span><div class="baris bungkus mt-4"><span class="tag merek">' + ic('clock', 'k') + ' Shift ' + e(t.shift_label) + '</span><span class="tag">' + e(t.peran) + '</span>' + UI.lencana(ada ? (t.status || 'Terkirim') : telat ? 'Terlambat' : 'Belum Diisi', ada ? 'ok' : telat ? 'bahaya' : 'warn') + '</div></div></div>' +
        '<div class="baris rata mt-12 bungkus"><span class="kecil redup">' + ic('alarm-clock', 'k') + ' Batas kirim ' + U.waktu(t.batas) + (ada ? '' : ' · ' + U.relatif(t.batas)) + '</span>' + (ada ? '<button type="button" class="btn kecil" data-lap="' + e(t.laporan_id) + '">' + ic('eye') + 'Lihat laporan</button>' : '<a class="btn primer" href="#/laporan?pasien=' + e(t.pasien_id) + '&shift=' + e(t.shift) + '">' + ic('clipboard-pen') + 'Isi laporan sekarang</a>') + '</div></div>';
    }).join('') : '<div class="kartu pad">' + UI.kosong('Tidak ada tugas laporan hari ini', 'Anda tidak memiliki penugasan aktif pada tanggal ini.') + '</div>') + '</div>' +
      '<div class="tumpuk celah-12"><div class="label-mikro">Riwayat terakhir</div><div class="kartu"><div class="kartu-isi rapat"><div class="daftar">' + ((d.riwayat || []).length ? d.riwayat.map(function (l) { return '<div class="item klik" data-lap="' + e(l.id) + '"><div class="tumpuk tumbuh"><b>' + U.tglK(l.tanggal) + ' · ' + e(l.shift_label) + '</b><span class="potong">' + e(l.nama_pasien) + ' · ' + ttvMini(l) + '</span></div>' + UI.lencana(l.status_ketepatan) + '</div>'; }).join('') : UI.kosong('Belum ada laporan', '')) + '</div></div><div class="kartu-kaki"><span>Laporan 7 hari terakhir</span><a href="#/riwayat" class="tebal">Semua riwayat →</a></div></div></div></div>';
    return h;
  }
  function dashHRD(ctx, d) {
    var r = d.hrd || {}, tahap = r.tahap || {}, urut = ['Lamaran Masuk', 'Seleksi Berkas', 'Interview', 'Tes', 'Diterima', 'Ditolak'];
    var h = '<div class="pil-baris masuk">' + UI.pil({ ik: 'users-round', l: 'Perawat terdaftar', n: U.angka(r.perawat_total), rute: 'perawat', k: 'utama' }) + UI.pil({ ik: 'file-clock', l: 'Kontrak ≤ 30 hari', n: U.angka(r.kontrak), s: 'perlu evaluasi', rute: 'perawat?tab=kontrak', k: r.kontrak ? 'bahaya' : '' }) + UI.pil({ ik: 'graduation-cap', l: 'Masa training', n: U.angka(r.training), rute: 'perawat' }) + UI.pil({ ik: 'arrow-left-right', l: 'Turnover bulan ini', n: U.angka(r.turnover_bulan), rute: 'turnover' }) + '</div>';
    h += '<div class="grid g2 masuk-2"><div class="kartu"><div class="kartu-kepala"><div><h2>Pipeline rekrutmen</h2><p>Jumlah pelamar per tahap</p></div><a class="btn mini hantu" href="#/rekrutmen">Kelola ' + ic('arrow-right', 'k') + '</a></div><div class="kartu-isi"><div class="corong">' + urut.filter(function (t) { return tahap[t] != null; }).map(function (t) { var maks = Math.max.apply(null, Object.keys(tahap).map(function (k) { return tahap[k]; }).concat([1])); return '<div class="t"><span class="kecil">' + e(t) + '</span><div><div class="b" style="width:' + Math.max(8, tahap[t] / maks * 100) + '%;background:' + (t === 'Ditolak' ? '#94A3B8' : t === 'Diterima' ? 'var(--s3)' : 'var(--s1)') + '">' + tahap[t] + '</div></div><span class="kecil redup">pelamar</span></div>'; }).join('') + '</div></div></div>' +
      '<div class="kartu"><div class="kartu-kepala"><div><h2>Kontrak segera berakhir</h2><p>Siapkan SPKWT perpanjangan atau evaluasi</p></div></div><div class="kartu-isi rapat"><div class="daftar">' + ((d.kontrak || []).length ? d.kontrak.map(function (k) { return '<div class="item klik" data-rute="perawat?id=' + e(k.id) + '">' + UI.ava(k.nama, 'k') + '<div class="tumpuk tumbuh"><b class="potong">' + e(k.nama) + '</b><span>' + e(k.jabatan) + ' · ' + e(k.divisi) + '</span></div><div class="tumpuk" style="align-items:flex-end"><b class="kecil">' + U.tgl(k.akhir_kontrak) + '</b>' + UI.lencana(k.sisa_hari + ' hari lagi', k.sisa_hari <= 14 ? 'bahaya' : 'warn') + '</div></div>'; }).join('') : UI.kosong('Tidak ada kontrak berakhir', '')) + '</div></div></div></div>';
    return h;
  }
  function kartuMutasi(d) {
    return '<div class="kartu"><div class="kartu-kepala"><div><h2>Mutasi petty cash terbaru</h2><p>6 transaksi terakhir</p></div><a class="btn mini primer" href="#/pettycash?baru=1">' + ic('plus', 'k') + 'Ajukan pengeluaran</a></div><div class="kartu-isi rapat"><div class="daftar">' + ((d.mutasi_pc || []).length ? d.mutasi_pc.map(function (m) { return '<div class="item"><span class="ikon-ov ' + (m.tipe === 'Masuk' ? 'ok' : '') + '" style="width:34px;height:34px">' + ic(m.tipe === 'Masuk' ? 'arrow-down-left' : 'arrow-up-right', 'k') + '</span><div class="tumpuk tumbuh"><b class="potong">' + e(m.keterangan) + '</b><span>' + U.tgl(m.tanggal) + ' · ' + e(m.kategori || m.tipe) + '</span></div><div class="tumpuk" style="align-items:flex-end"><b class="angka ' + (m.tipe === 'Masuk' ? 'ok-t' : '') + '">' + (m.tipe === 'Masuk' ? '+' : '−') + U.rp(m.nominal) + '</b>' + UI.lencana(m.status) + '</div></div>'; }).join('') : UI.kosong('Belum ada mutasi', '')) + '</div></div></div>';
  }
  function dashPC(ctx, d) {
    var aj = d.pengajuan || {};
    return '<div class="pil-baris masuk">' + UI.pil({ ik: 'piggy-bank', l: 'Saldo petty cash', n: U.rpS(d.saldo_pc), s: 'per hari ini', rute: 'pettycash', k: 'utama' }) + UI.pil({ ik: 'hourglass', l: 'Pengajuan petty cash', n: U.angka(aj.pc), s: 'menunggu Keuangan', rute: 'pettycash' }) + UI.pil({ ik: 'banknote', l: 'Pengajuan gaji', n: U.angka(aj.gaji), s: 'menunggu pembayaran' }) + '</div><div class="masuk-2">' + kartuMutasi(d) + '</div>';
  }
  function dashKeuangan(ctx, d) {
    var keu = d.keuangan || {}, aj = d.pengajuan || {};
    var h = '<div class="pil-baris masuk">' + UI.pil({ ik: 'trending-up', l: 'Omzet SO bulan ini', n: U.rpS(keu.omzet), s: (keu.so_jumlah || 0) + ' SO' + (keu.margin_persen != null ? ' · margin ' + U.persen(keu.margin_persen) : ''), rute: 'analitik', k: 'utama' }) + UI.pil({ ik: 'wallet', l: 'Pembayaran diterima', n: U.rpS(keu.terbayar_bulan), s: 'bulan berjalan', rute: 'sales?tab=invoice' }) + UI.pil({ ik: 'receipt-text', l: 'Piutang', n: U.rpS(keu.piutang), s: '<span class="' + (keu.invoice_terlambat ? 'bahaya-t' : '') + '">' + (keu.invoice_terlambat || 0) + ' lewat jatuh tempo</span>', rute: 'sales?tab=invoice', k: keu.invoice_terlambat ? 'bahaya' : '' }) + UI.pil({ ik: 'hourglass', l: 'Pengajuan menunggu', n: U.angka((aj.gaji || 0) + (aj.pc || 0)), s: (aj.gaji || 0) + ' gaji · ' + (aj.pc || 0) + ' petty cash', rute: 'keuangan' }) + '</div>';
    h += '<div class="grid g-2-1 masuk-2">' + kartuMendesak(d.perlu_tindakan) + kartuTarget(d.target || []) + '</div><div class="mt-16 masuk-3">' + kartuMutasi(d) + '</div>';
    return h;
  }

  /* ===================== ANALITIK PENJUALAN ===================== */
  R.daftar('analitik', {
    judul: 'Analitik Penjualan',
    render: function (ctx) {
      var st = ctx.st; st.bulan = st.bulan || 6; st.paket = st.paket || ''; st.status_klien = st.status_klien || ''; st.cs = st.cs || '';
      return Q('analitik.penjualan', { bulan: st.bulan, paket: st.paket, status_klien: st.status_klien, cs: st.cs }).then(function (d) {
        if (ctx.basi()) return;
        var r = d.ringkas, bm = d.boleh_margin, bl = d.bulan, kini = bl[bl.length - 1] || {};
        var h = UI.kepala('Analitik Penjualan', 'Omzet, margin, konversi, dan piutang dari Sales Order & pembayaran · ' + U.bulan(kini.bulan) + (r.hpp_estimasi && bm ? ' · <span class="lencana warn"><i></i>HPP sebagian masih estimasi</span>' : ''), '<button type="button" class="btn kecil" data-a="csv">' + ic('download') + '<span>Ekspor CSV</span></button><button type="button" class="btn kecil" data-a="cetak">' + ic('printer') + '<span>Cetak</span></button>');
        h += '<div class="saring masuk">' + UI.segmen([{ v: 3, l: '3 bulan' }, { v: 6, l: '6 bulan' }, { v: 12, l: '12 bulan' }], st.bulan, 'bulan') + UI.pilih('paket', d.filter.paket.map(function (x) { return { v: x.id, l: x.nama }; }), st.paket, { semua: 'Semua paket', style: 'width:auto;min-width:150px' }) + UI.pilih('status_klien', ['New', 'Existing'], st.status_klien, { semua: 'Klien baru & lama', style: 'width:auto' }) + (ctx.me.peran !== 'CS' ? UI.pilih('cs', d.filter.cs.map(function (x) { return { v: x.id, l: x.nama }; }), st.cs, { semua: 'Semua CS', style: 'width:auto;min-width:170px' }) : '<span class="lencana info"><i></i>Menampilkan SO Anda</span>') + ((st.paket || st.status_klien || st.cs) ? '<button type="button" class="btn kecil hantu" data-a="reset">' + ic('x', 'k') + 'Reset filter</button>' : '') + '</div>';
        h += '<div class="grid g4 kpi-baris masuk-2">' + UI.kpi({ label: 'Omzet bulan ini', nilai: U.rpS(r.omzet), delta: r.omzet_delta, sub: 'vs bulan lalu', ikon: 'trending-up', utama: true, spark: G.spark(bl.map(function (x) { return x.omzet; }), 'var(--merek)') }) +
          UI.kpi({ label: 'Sales order', nilai: U.angka(r.so), delta: r.so_delta, sub: 'rata-rata ' + U.rpS(r.rata_nilai) + '/SO', ikon: 'receipt-text', spark: G.spark(bl.map(function (x) { return x.so; })) }) +
          UI.kpi({ label: 'Pembayaran diterima', nilai: U.rpS(r.terbayar), delta: r.terbayar_delta, sub: 'kas masuk bulan ini', ikon: 'wallet', spark: G.spark(bl.map(function (x) { return x.terbayar; }), 'var(--s3)') }) +
          (bm ? UI.kpi({ label: 'Margin kotor', nilai: U.rpS(r.margin), delta: r.margin_delta, sub: 'margin ' + U.persen(r.margin_persen), ikon: 'percent', spark: G.spark(bl.map(function (x) { return x.margin; }), 'var(--s3)') }) : UI.kpi({ label: 'Konversi lead → deal', nilai: U.persen(r.konversi), sub: 'periode terpilih', ikon: 'funnel' })) + '</div>';
        h += '<div class="grid g4 kpi-baris mt-16 masuk-3">' + UI.kpi({ label: 'Total omzet ' + st.bulan + ' bulan', nilai: U.rpS(r.total_omzet), sub: bm ? 'margin ' + U.rpS(r.total_margin) : 'semua SO terhitung', ikon: 'sigma' }) + UI.kpi({ label: 'Konversi lead → deal', nilai: U.persen(r.konversi), sub: d.funnel.map(function (f) { return f.jumlah; }).join(' → '), ikon: 'filter' }) + UI.kpi({ label: 'Piutang berjalan', nilai: U.rpS(r.piutang), sub: 'semua invoice belum lunas', ikon: 'hourglass', rute: 'sales?tab=invoice' }) + UI.kpi({ label: 'Klien baru bulan ini', nilai: U.angka(kini.new), sub: U.angka(kini.existing) + ' klien perpanjangan', ikon: 'user-plus' }) + '</div>';
        h += '<div class="grid g-2-1 mt-16">' + G.kartu('g-omzet', 'Omzet vs pembayaran diterima', 'Per bulan · Rupiah', { tinggi: 260, legenda: G.legenda([{ nama: 'Omzet SO', warna: 'var(--s1)' }, { nama: 'Terbayar', warna: 'var(--s3)' }]) }) + G.kartu('g-klien', 'Klien baru vs perpanjangan', 'Jumlah SO per bulan', { tinggi: 260, legenda: G.legenda([{ nama: 'New', warna: 'var(--s1)' }, { nama: 'Existing', warna: 'var(--s4)' }]) }) + '</div>';
        if (bm) h += '<div class="grid g2 mt-16">' + G.kartu('g-margin', 'Margin kotor per bulan', 'Omzet − HPP (gaji perawat + estimasi biaya tambahan)', { tinggi: 220 }) + '<div class="kartu"><div class="kartu-kepala"><div><h2>Umur piutang</h2><p>Sisa tagihan menurut keterlambatan</p></div></div><div class="kartu-isi">' + G.hbar(Object.keys(d.aging).map(function (k, i) { return { n: k, v: d.aging[k], warna: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'][i] }; }), { fmt: U.rpS }) + '</div></div></div>';
        h += '<div class="grid g3 mt-16"><div class="kartu"><div class="kartu-kepala"><div><h2>Per paket</h2><p>Nilai SO periode terpilih</p></div></div><div class="kartu-isi">' + G.hbar(d.paket.map(function (x) { return { n: x.paket, v: x.nilai, sub: x.jumlah + ' SO' }; }), { fmt: U.rpS }) + '</div></div>' +
          '<div class="kartu"><div class="kartu-kepala"><div><h2>Per wilayah</h2><p>Nilai SO periode terpilih</p></div></div><div class="kartu-isi">' + G.hbar(d.wilayah.slice(0, 8).map(function (x) { return { n: x.wilayah, v: x.nilai, sub: x.jumlah + ' SO' }; }), { fmt: U.rpS, warna: 'var(--s3)' }) + '</div></div>' +
          '<div class="kartu"><div class="kartu-kepala"><div><h2>Durasi kontrak</h2><p>Jumlah SO per lama kontrak</p></div></div><div class="kartu-isi">' + G.hbar(Object.keys(d.durasi).map(function (k) { return { n: k, v: d.durasi[k] }; }), { fmt: function (v) { return v + ' SO'; }, warna: 'var(--s4)' }) + '</div></div></div>';
        h += '<div class="grid g3 mt-16"><div class="kartu"><div class="kartu-kepala"><div><h2>Corong penjualan</h2><p>Lead → follow-up → deal → SO</p></div></div><div class="kartu-isi"><div class="corong">' + d.funnel.map(function (f, i) { var m = d.funnel[0].jumlah || 1; return '<div class="t"><span class="kecil">' + e(f.tahap) + '</span><div><div class="b" style="width:' + Math.max(10, f.jumlah / m * 100) + '%;background:' + ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab'][i] + '">' + f.jumlah + '</div></div><span class="kecil redup angka">' + (i ? U.persen(f.jumlah / m * 100, 0) : '100%') + '</span></div>'; }).join('') + '</div></div></div>' +
          '<div class="kartu"><div class="kartu-kepala"><div><h2>Sumber lead</h2><p>Konversi per kanal</p></div></div><div class="kartu-isi rapat"><table class="tabel"><thead><tr><th>Sumber</th><th class="kanan">Lead</th><th class="kanan">Deal</th><th class="kanan">Konversi</th></tr></thead><tbody>' + d.sumber.map(function (s) { return '<tr><td>' + e(s.sumber) + '</td><td class="kanan angka">' + s.lead + '</td><td class="kanan angka">' + s.deal + '</td><td class="kanan"><b class="angka">' + U.persen(s.konversi, 0) + '</b></td></tr>'; }).join('') + '</tbody></table></div></div>' +
          '<div class="kartu"><div class="kartu-kepala"><div><h2>Kinerja CS</h2><p>Nilai SO periode terpilih</p></div></div><div class="kartu-isi">' + G.hbar(d.cs.map(function (x) { return { n: x.nama, v: x.nilai, sub: x.jumlah + ' SO' }; }), { fmt: U.rpS }) + '</div></div></div>';
        h += '<div class="kartu mt-16"><div class="kartu-kepala"><div><h2>Sales order terbesar</h2><p>8 SO dengan nilai tertinggi pada periode terpilih</p></div><a class="btn mini hantu" href="#/sales">Buka Sales Order ' + ic('arrow-right', 'k') + '</a></div><div class="kartu-isi rapat"><div id="t-top"></div></div></div>';
        ctx.el.innerHTML = h;
        UI.tabel(qs('#t-top', ctx.el), { rows: d.top, idKunci: 'id', klik: function (r) { R.ke('sales?id=' + r.id); }, kolom: [{ k: 'pasien', l: 'Pasien', f: function (x) { return '<div class="utama-sel">' + e(x.pasien) + '</div><div class="sub-sel">' + e(x.id) + ' · ' + U.tgl(x.tanggal) + '</div>'; } }, { k: 'paket', l: 'Paket', f: function (x) { return '<span class="tag merek">' + e(x.paket) + '</span>'; } }, { k: 'kontrak', l: 'Kontrak' }, { k: 'status_klien', l: 'Klien', f: function (x) { return UI.lencana(x.status_klien); } }, { k: 'total', l: 'Total', kelas: 'kanan', f: function (x) { return '<b class="angka">' + U.rp(x.total) + '</b>'; } }].concat(bm ? [{ k: 'margin', l: 'Margin', kelas: 'kanan', f: function (x) { return '<span class="angka">' + U.rp(x.margin) + '</span> <span class="redup kecil">' + U.persen(x.total ? x.margin / x.total * 100 : 0, 0) + '</span>'; } }] : []) });
        var lbl = bl.map(function (x) { return x.label; });
        ctx.grafik(function () { G.batang(qs('#g-omzet', ctx.el), { label: lbl, seri: [{ nama: 'Omzet SO', data: bl.map(function (x) { return x.omzet; }) }, { nama: 'Terbayar', data: bl.map(function (x) { return x.terbayar; }), warna: 'var(--s3)' }], fmt: U.rp, fmtSumbu: U.rpS, kiri: 62, tinggi: 260, aria: 'Omzet dan pembayaran per bulan', labelX: 'Bulan' }); });
        ctx.grafik(function () { G.batang(qs('#g-klien', ctx.el), { label: lbl, seri: [{ nama: 'New', data: bl.map(function (x) { return x.new; }) }, { nama: 'Existing', data: bl.map(function (x) { return x.existing; }), warna: 'var(--s4)' }], tumpuk: true, tinggi: 260, fmt: function (v) { return U.angka(v) + ' SO'; }, fmtSumbu: U.angka, labelX: 'Bulan' }); });
        if (bm) ctx.grafik(function () { G.garis(qs('#g-margin', ctx.el), { label: lbl, seri: [{ nama: 'Margin', data: bl.map(function (x) { return x.margin; }), warna: 'var(--s3)' }], fmt: U.rp, fmtSumbu: U.rpS, kiri: 62, area: true, tinggi: 220, tipEkstra: function (i) { var x = bl[i]; return '<div class="tr"><span>Margin %</span><b>' + U.persen(x.omzet ? x.margin / x.omzet * 100 : 0) + '</b></div>'; }, labelX: 'Bulan' }); });
        ctx.on('click', '[data-segmen=bulan] button', function (b) { st.bulan = +b.dataset.v; R.muatUlang(); });
        ctx.on('change', 'select[data-f]', function (s) { st[s.dataset.f] = s.value; R.muatUlang(); });
        ctx.aksi({
          reset: function () { st.paket = st.status_klien = st.cs = ''; R.muatUlang(); },
          cetak: function () { window.print(); },
          csv: function () { U.unduh('analitik-penjualan-' + U.hariIni() + '.csv', U.csv(bl, [{ k: 'bulan', l: 'Bulan' }, { k: 'so', l: 'Jumlah SO' }, { k: 'omzet', l: 'Omzet' }, { k: 'terbayar', l: 'Terbayar' }].concat(bm ? [{ k: 'hpp', l: 'HPP' }, { k: 'margin', l: 'Margin' }] : []).concat([{ k: 'new', l: 'SO New' }, { k: 'existing', l: 'SO Existing' }, { k: 'rata', l: 'Rata-rata nilai SO' }])), 'text/csv'); UI.toast('CSV analitik diunduh.', 'ok'); }
        });
      });
    }
  });

  /* ===================== OPERASIONAL HARIAN ===================== */
  R.daftar('operasional', {
    judul: 'Operasional Harian',
    render: function (ctx) {
      return Q('ops.harian', {}).then(function (d) {
        if (ctx.basi()) return;
        var a = d.angka, rk = d.rekap;
        var h = UI.kepala('Operasional Harian', U.tglP(d.tanggal) + ' · pantauan lintas divisi & rekap eksekutif untuk Direksi', '<button type="button" class="btn kecil" data-a="wa-massal">' + ic('message-circle') + '<span>Pesan pengingat absen</span></button><button type="button" class="btn kecil primer" data-a="rekap">' + ic('send') + '<span>Kirim rekap ke Direksi</span></button>');
        h += '<div class="grid g5 kpi-baris masuk">' + [['Pasien aktif', a.pasien_aktif, 'contact-round', 'pasien', true], ['Perawat aktif', a.perawat_aktif, 'users-round', 'perawat'], ['Laporan masuk', a.laporan_masuk, 'clipboard-check', 'laporan'], ['Laporan telat', a.laporan_telat, 'alarm-clock', 'laporan'], ['Belum absen', a.belum_absen, 'calendar-x', 'absensi'], ['Belum lapor kemarin', a.belum_lapor_kemarin, 'clipboard-x', 'laporan'], ['Pasien tanpa perawat', a.pasien_tanpa_perawat, 'user-x', 'penugasan'], ['Kasus belum selesai', a.kasus_belum_selesai, 'circle-alert', 'kasus'], ['Lead belum follow-up', a.lead_belum_followup, 'message-circle-warning', 'pipeline']].slice(0, 10).map(function (x) { return UI.kpi({ label: x[0], nilai: U.angka(x[1]), ikon: x[2], rute: x[3], utama: x[4], sub: x[1] && /telat|Belum|tanpa|belum/.test(x[0]) ? '<span class="warn-t tebal">perlu ditindaklanjuti</span>' : 'hari ini' }); }).join('') + '</div>';
        h += '<div class="grid g3 mt-16 masuk-2">' + daftarOps('Belum absen hari ini', d.belum_absen, function (b) { return '<div class="item">' + UI.ava(b.nama, 'k') + '<div class="tumpuk tumbuh"><b class="potong">' + e(b.nama) + '</b><span class="potong">' + e(b.pasien) + ' · ' + e(b.shift) + ' · ' + e(b.peran) + '</span></div>' + (b.no_wa ? '<a class="btn mini ikon hantu" target="_blank" rel="noopener" href="' + U.wa(b.no_wa, 'Halo ' + namaDepan(b.nama) + ', mohon konfirmasi kehadiran hari ini di ' + b.pasien + '. Terima kasih.') + '" title="WhatsApp">' + ic('message-circle', 'k') + '</a>' : '') + '</div>'; }, 'calendar-check') +
          daftarOps('Belum lapor kemarin', d.belum_lapor_kemarin, function (b) { return '<div class="item"><span class="tingkat kritis"></span><div class="tumpuk tumbuh"><b class="potong">' + e(b.nama_perawat) + '</b><span class="potong">' + e(b.nama_pasien) + ' · ' + e(b.shift) + ' · ' + e(b.wilayah) + '</span></div><span class="kecil bahaya-t tebal">' + U.angka(b.telat_jam, 0) + ' jam</span></div>'; }, 'clipboard-check') +
          daftarOps('Perawat siaga', d.siaga, function (s) { return '<div class="item klik" data-rute="perawat?id=' + e(s.id) + '">' + UI.ava(s.nama, 'k') + '<div class="tumpuk tumbuh"><b class="potong">' + e(s.nama) + '</b><span class="potong">' + e(s.kompetensi) + ' · ' + e(s.wilayah) + '</span></div>' + UI.lencana('Siaga') + '</div>'; }, 'shield') + '</div>';
        h += '<div class="grid g-2-1 mt-16 masuk-3"><div class="kartu"><div class="kartu-kepala"><div><h2>Kepatuhan per wilayah</h2><p>30 hari · laporan & pengiriman ke penanggung jawab</p></div></div><div class="kartu-isi rapat"><div class="tabel-wadah"><table class="tabel responsif"><thead><tr><th>Wilayah</th><th class="kanan">Pasien</th><th class="kanan">Wajib</th><th class="kanan">Tepat</th><th class="kanan">Telat</th><th class="kanan">Belum</th><th>Kepatuhan</th><th class="kanan">Terkirim PJ</th></tr></thead><tbody>' + d.wilayah.map(function (w) { return '<tr><td class="utama-m" data-l="Wilayah"><b>' + e(w.wilayah) + '</b></td><td class="kanan angka" data-l="Pasien">' + w.jumlah_pasien + '</td><td class="kanan angka" data-l="Wajib">' + w.wajib + '</td><td class="kanan angka" data-l="Tepat">' + w.tepat + '</td><td class="kanan angka" data-l="Telat">' + w.telat + '</td><td class="kanan angka" data-l="Belum">' + w.belum + '</td><td data-l="Kepatuhan" style="min-width:130px"><div class="baris"><div class="meter tumbuh ' + (w.persen >= 95 ? 'ok' : w.persen >= 80 ? '' : 'warn') + '"><i style="width:' + w.persen + '%"></i></div><b class="kecil angka">' + U.persen(w.persen, 0) + '</b></div></td><td class="kanan angka" data-l="Terkirim PJ">' + U.persen(w.persen_pj, 0) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>' +
          '<div class="kartu"><div class="kartu-kepala"><div><h2>Rekap eksekutif hari ini</h2><p>' + (rk ? 'Terakhir disimpan oleh ' + e(rk.dibuat_oleh) + ' · ' + U.waktu(rk.diubah_pada || rk.dibuat_pada) : 'Belum ada rekap hari ini') + '</p></div></div><div class="kartu-isi"><div class="fld" data-k="catatan"><label>Catatan untuk Direksi</label><textarea class="inp" rows="6" data-catatan placeholder="Contoh: Kondisi pasien ventilator stabil setelah rotasi infal. Stok oksigen depo BSD aman.">' + e(rk ? rk.catatan_eksekutif : '') + '</textarea><span class="bantu">Angka operasional di kiri ikut tersimpan otomatis.</span></div><div class="baris mt-12" style="justify-content:flex-end"><button type="button" class="btn kecil" data-a="simpan-rekap">' + ic('save') + 'Simpan</button><button type="button" class="btn kecil primer" data-a="rekap">' + ic('send') + 'Simpan & kirim</button></div></div></div></div>';
        h += '<div class="grid g2 mt-16">' + kartuTindakan(d.perlu_tindakan || [], 'Perlu tindakan lintas divisi') + daftarOps('Kasus belum selesai', d.kasus_belum, function (k) { return '<div class="item klik" data-rute="kasus?id=' + e(k.id) + '"><span class="tingkat ' + (k.status === 'Overdue' ? 'kritis' : 'peringatan') + '"></span><div class="tumpuk tumbuh"><b class="potong">' + e(k.judul) + '</b><span class="potong">' + e(k.id) + ' · ' + e(k.jenis) + ' · PIC ' + e(k.pic_nama || '-') + '</span></div>' + UI.lencana(k.status) + '</div>'; }, 'circle-check') + '</div>';
        ctx.el.innerHTML = h;
        function simpan(b, kirim) { var c = qs('[data-catatan]', ctx.el).value; UI.kerja(b, function () { return T('ops.rekapSimpan', { catatan: c, kirim: kirim }); }).then(function () { UI.toast(A.API.pesan, 'ok'); R.muatUlang(); }).catch(function () { }); }
        ctx.aksi({
          'simpan-rekap': function (b) { simpan(b, false); }, rekap: function (b) { simpan(b, true); },
          'wa-massal': function () { var t = d.belum_absen.filter(function (b) { return b.no_wa; }); if (!t.length) return UI.toast('Semua perawat sudah absen.', 'ok'); var teks = t.map(function (b) { return '• ' + b.nama + ' (' + b.pasien + ')'; }).join('\n'); UI.modal({ judul: 'Pengingat absen', ikon: 'message-circle', sub: t.length + ' perawat belum absen', isi: '<p class="redup kecil mb-12">Buka WhatsApp per perawat, atau kirim lewat Blast WA (menu WhatsApp & Notifikasi) bila notifikasi WA sudah diaktifkan.</p><div class="daftar panel-lembut" style="padding:0">' + t.map(function (b) { return '<div class="item">' + UI.ava(b.nama, 'k') + '<div class="tumpuk tumbuh"><b>' + e(b.nama) + '</b><span>' + e(b.pasien) + '</span></div><a class="btn mini" target="_blank" rel="noopener" href="' + U.wa(b.no_wa, 'Halo ' + namaDepan(b.nama) + ', mohon konfirmasi kehadiran hari ini di ' + b.pasien + '. Terima kasih.') + '">' + ic('message-circle', 'k') + 'WhatsApp</a></div>'; }).join('') + '</div>', kaki: '<button type="button" class="btn" data-salin>' + ic('copy') + 'Salin daftar</button><button type="button" class="btn primer" data-tutup>Selesai</button>' }).on('click', '[data-salin]', function () { U.salin(teks); }); }
        });
      });
    }
  });
  function daftarOps(judul, rows, fn, ikonKosong) { return '<div class="kartu"><div class="kartu-kepala"><div><h2>' + e(judul) + '</h2></div><span class="lencana ' + (rows.length ? 'warn' : 'ok') + '"><i></i>' + rows.length + '</span></div><div class="kartu-isi rapat"><div class="daftar" style="max-height:340px;overflow:auto">' + (rows.length ? rows.slice(0, 30).map(fn).join('') : UI.kosong('Tidak ada', 'Semua dalam kondisi baik.')) + '</div></div></div>'; }

  /* ===================== TARGET & KPI ===================== */
  R.daftar('target', {
    judul: 'Target & KPI',
    render: function (ctx) {
      var st = ctx.st; st.periode = st.periode || U.bulanIni();
      return Q('target.capaian', { periode: st.periode }).then(function (d) {
        if (ctx.basi()) return;
        var adm = ctx.me.peran === 'ADM', rows = d.rows, tercapai = rows.filter(function (r) { return r.tercapai; }).length, rata = rows.length ? U.jumlah(rows, function (r) { return Math.min(100, U.n(r.persen)); }) / rows.length : 0;
        var h = UI.kepala('Target & KPI', 'Realisasi dihitung otomatis dari data operasional · notifikasi capaian dikirim di minggu ke-3', '<input type="month" class="inp kecil" data-periode value="' + st.periode + '" style="width:auto" aria-label="Periode">' + (adm ? UI.btn('Tambah target', { k: 'primer kecil', a: 'tambah', i: 'plus', kunci: 'n' }) : ''));
        h += '<div class="grid g4 kpi-baris masuk">' + UI.kpi({ label: 'Rata-rata capaian', nilai: U.angka(rata, 1) + '<small>%</small>', meter: rata, utama: true, ikon: 'gauge', sub: U.bulan(st.periode) }) + UI.kpi({ label: 'Target tercapai', nilai: tercapai + '<small>/' + rows.length + '</small>', sub: 'indikator', ikon: 'trophy' }) + UI.kpi({ label: 'Kepatuhan laporan', nilai: U.persen(d.kpi.kepatuhan_7h), sub: '7 hari terakhir', ikon: 'clipboard-check' }) + UI.kpi({ label: 'SLA kasus', nilai: U.persen(d.kpi.sla_persen, 0), sub: d.kpi.kasus_overdue + ' kasus overdue', ikon: 'timer' }) + '</div>';
        var grup = U.kelompok(rows, 'divisi');
        h += '<div class="grid g2 mt-16 masuk-2">' + Object.keys(grup).map(function (dv) { return '<div class="kartu"><div class="kartu-kepala"><div><h2>' + e(dv) + '</h2><p>' + grup[dv].length + ' indikator</p></div></div><div class="kartu-isi">' + grup[dv].map(function (t) { var p = Math.round(U.n(t.persen)), fm = function (v) { return t.satuan === 'Rp' ? U.rp(v) : U.angka(v, 1) + (t.satuan === '%' ? '%' : ' ' + t.satuan); }; return '<div class="panel-lembut mt-8"><div class="baris rata atas"><div class="tumpuk"><b>' + e(t.indikator) + '</b><span class="kecil redup">' + (t.sumber_otomatis ? ic('zap', 'k') + ' otomatis' : 'manual') + '</span></div>' + UI.lencana(t.tercapai ? 'Tercapai' : p >= 75 ? 'Hampir' : 'Di bawah target', t.tercapai ? 'ok' : p >= 75 ? 'info' : 'warn') + '</div><div class="baris rata mt-8 kecil"><span class="angka"><b style="font:700 18px var(--f-judul)">' + fm(t.realisasi) + '</b> <span class="redup">dari ' + fm(t.target) + '</span></span><b class="angka">' + p + '%</b></div><div class="meter mt-4 ' + (p >= 100 ? 'ok' : p >= 75 ? '' : p >= 50 ? 'warn' : 'bahaya') + '"><i style="width:' + Math.min(100, p) + '%"></i></div>' + (adm ? '<div class="baris mt-8" style="justify-content:flex-end"><button type="button" class="btn mini hantu" data-a="ubah" data-id="' + e(t.id) + '">' + ic('pencil', 'k') + 'Ubah</button></div>' : '') + '</div>'; }).join('') + '</div></div>'; }).join('') + '</div>';
        if (!rows.length) h += '<div class="kartu pad mt-16">' + UI.kosong('Belum ada target untuk ' + U.bulan(st.periode), adm ? 'Tambahkan target per divisi; realisasi otomatis dapat dipilih dari sumber data.' : '') + '</div>';
        ctx.el.innerHTML = h;
        function form(t) {
          UI.formModal({ judul: t ? 'Ubah target' : 'Tambah target', ikon: 'gauge', data: t || { periode: st.periode }, fields: [{ k: 'periode', l: 'Periode', t: 'bulan', wajib: true, lebar: 'l3' }, { k: 'divisi', l: 'Divisi', t: 'pilih', opsi: ['Keperawatan', 'Home Visit', 'Customer Service', 'Keuangan', 'Operasional', 'HRD'], wajib: true, lebar: 'l3' }, { k: 'indikator', l: 'Indikator', wajib: true, ph: 'mis. Kepatuhan laporan harian' }, { k: 'satuan', l: 'Satuan', t: 'pilih', opsi: ['%', 'Rp', 'orang', 'klien', 'tindakan', 'kasus'], wajib: true, lebar: 'l2' }, { k: 'target', l: 'Target', t: 'angka', wajib: true, lebar: 'l2' }, { k: 'realisasi', l: 'Realisasi manual', t: 'angka', lebar: 'l2', bantu: 'Kosongkan bila otomatis' }, { k: 'sumber_otomatis', l: 'Sumber realisasi otomatis', t: 'pilih', opsi: d.sumber.map(function (s) { return { v: s.kode, l: s.label }; }), kosong: '— Manual —' }],
            simpan: function (v) { if (t) v.id = t.id; return T('crud.simpan', { mod: 'target', data: v }); }, selesai: function () { R.muatUlang(); } });
        }
        ctx.on('change', '[data-periode]', function (i) { st.periode = i.value || U.bulanIni(); R.muatUlang(); });
        ctx.aksi({ tambah: function () { form(null); }, ubah: function (b) { form(rows.filter(function (r) { return r.id === b.dataset.id; })[0]); } });
      });
    }
  });

  /* ===================== PROFIL & GANTI PIN ===================== */
  R.daftar('profil', {
    judul: 'Profil Saya', bebas: true,
    render: function (ctx) {
      var me = ctx.me, kuat = /ADM|KEU|PC/.test(me.peran), wajib = me.wajib_ganti_pin;
      ctx.el.innerHTML = UI.kepala('Profil Saya', 'Informasi akun dan keamanan') + (wajib ? '<div class="panel-peringatan mb-12 masuk">' + ic('shield-alert') + '<div><b>Wajib ganti PIN/kata sandi</b><div>Akun Anda memakai PIN awal dari Admin. Ganti sekarang sebelum melanjutkan ke menu lain.</div></div></div>' : '') +
        '<div class="grid g-1-2 masuk"><div class="kartu pad"><div class="tumpuk" style="align-items:center;text-align:center;gap:8px">' + UI.ava(me.nama, 'xl') + '<h2>' + e(me.nama) + '</h2>' + UI.lencana(me.peran_label, 'gelap') + '</div><hr class="pemisah"><dl class="info-grid" style="grid-template-columns:1fr"><div><dt>Username</dt><dd class="mono">' + e(me.username) + '</dd></div><div><dt>WhatsApp</dt><dd>' + e(me.no_wa || '—') + '</dd></div><div><dt>Email</dt><dd>' + e(me.email || '—') + '</dd></div>' + (me.perawat_id ? '<div><dt>ID Perawat</dt><dd class="mono">' + e(me.perawat_id) + '</dd></div>' : '') + '</dl></div>' +
        '<div class="kartu"><div class="kartu-kepala"><div><h2>Ganti ' + (kuat ? 'kata sandi' : 'PIN') + '</h2><p>' + (kuat ? 'Minimal 8 karakter, kombinasikan huruf & angka.' : 'Minimal 6 digit angka. PIN ini juga dipakai untuk menandatangani dokumen.') + '</p></div></div><div class="kartu-isi"><form data-pin novalidate>' + UI.form([{ k: 'lama', l: (kuat ? 'Kata sandi' : 'PIN') + ' saat ini', t: 'sandi', wajib: true }, { k: 'baru', l: (kuat ? 'Kata sandi' : 'PIN') + ' baru', t: 'sandi', wajib: true, lebar: 'l3' }, { k: 'ulang', l: 'Ulangi', t: 'sandi', wajib: true, lebar: 'l3' }]) + '<div class="baris mt-16" style="justify-content:flex-end"><button type="button" class="btn primer" data-a="simpan">' + ic('key-round') + 'Simpan</button></div></form>' +
        '<hr class="pemisah"><div class="panel-info">' + ic('shield-check', 'k') + '<div>Sesi berlaku 12 jam sejak aktivitas terakhir. PIN disimpan sebagai hash di server — Admin pun tidak dapat melihatnya. Salah PIN 5× akan mengunci akun 15 menit.</div></div></div></div></div>';
      var form = qs('[data-pin]', ctx.el); UI.pasangForm(form);
      ctx.aksi({ simpan: function (b) {
        var v = UI.bacaForm(form); if (!v.lama || !v.baru) return UI.tandaiGalat(form, { lama: !v.lama ? 'Wajib diisi' : '', baru: !v.baru ? 'Wajib diisi' : '' });
        if (v.baru !== v.ulang) return UI.tandaiGalat(form, { ulang: 'Tidak sama dengan yang baru' });
        UI.kerja(b, function () { return T('auth.gantiPin', { lama: v.lama, baru: v.baru }); }, { form: form }).then(function () { UI.toast(A.API.pesan || 'Tersimpan.', 'ok'); ctx.me.wajib_ganti_pin = false; A.Sesi.me.wajib_ganti_pin = false; form.reset(); if (wajib) R.ke('dashboard'); }).catch(function () { });
      } });
    }
  });

  /* ===================== BANTUAN & SOP ===================== */
  var SOP = [
    { r: 'PRW', j: 'Mengisi laporan harian A–H', i: 'clipboard-pen', s: ['Buka menu Laporan Harian HC — tugas shift hari ini tampil otomatis.', 'Isi bagian B (ADL) dengan Ya/Tidak, C tanda vital wajib (tensi, nadi, suhu, SpO₂).', 'Centang obat yang diberikan di bagian D, isi eliminasi & nutrisi di F.', 'Pilih kondisi pasien (G). Bila "Perlu pemantauan" atau "Mengalami perubahan kondisi", koordinator mendapat notifikasi seketika.', 'Tanda tangan di H lalu Kirim. Laporan langsung diteruskan ke penanggung jawab via WA/Email.', 'Batas kirim: Pagi 16.00, Siang 23.59, Malam 08.00 esok, 24 Jam 20.00. Lewat batas = Terlambat.'] },
    { r: 'KEP', j: 'Rotasi & handover perawat', i: 'repeat', s: ['Menu Penugasan & Rotasi → pilih penugasan → Rotasi.', 'Pilih perawat pengganti (saran perawat siaga tampil di atas) dan tanggal efektif.', 'Centang "Minta Identifikasi Pasien" agar perawat lama mengisi form handover sebelum serah terima.', 'Sistem mencatat turnover, memperbarui penerima laporan, dan menyiapkan Surat Tugas baru.'] },
    { r: 'CS', j: 'Lead → Sales Order → Invoice', i: 'receipt-text', s: ['Catat lead di Pipeline CS (sumber, kebutuhan, paket minat). Follow-up maksimal 2 hari.', 'Seret kartu ke kolom Deal → buat Sales Order (harga mengikuti paket; ubah harga wajib alasan).', 'Terbitkan invoice dari SO. Nomor NIS/MM/YY/NNNNN dikunci server.', 'Kirim invoice via WA/Email; Keuangan mencatat pembayaran dan status berubah otomatis.', 'H-3 akhir kontrak sistem menyiapkan Draf Perpanjangan — tinggal setujui atau tolak.'] },
    { r: 'HV', j: 'Home Visit dengan informed consent', i: 'stethoscope', s: ['Koordinator HV menjadwalkan kunjungan (pasien, perawat HV, tindakan, biaya).', 'Di lokasi: minta persetujuan keluarga (informed consent) + tanda tangan digital. Tanpa consent, tindakan TIDAK dapat dicatat.', 'Unggah foto sebelum & sesudah tindakan, isi hasil tindakan, lalu Selesai.'] },
    { r: 'KEU', j: 'Penggajian perawat', i: 'banknote', s: ['Keperawatan/Keuangan menekan Hitung gaji periode — sistem membaca absensi, libur, lembur, kasbon, seragam.', 'Koreksi bila perlu (wajib alasan), lalu Keperawatan Ajukan dengan rekap absensi.', 'Keuangan Setujui → unduh Daftar Pembayaran Gaji → transfer → tandai Done per perawat.', 'Metode A: gaji deal − libur di luar jatah × potongan. Metode B: hari kerja × fee harian.'] },
    { r: 'ADM', j: 'Pengaturan & keamanan', i: 'settings', s: ['Pengaturan → Gaji: semua angka berlaku efektif per tanggal dan tersimpan riwayatnya.', 'Pengaturan → Tampilan: ganti logo, warna, font, kepadatan tanpa mengubah kode.', 'Token Fonnte disimpan di Script Properties (tersamar), tidak pernah tampil di layar.', 'Data tidak pernah dihapus permanen: gunakan Arsip/Nonaktif/Batal dengan alasan.', 'Akun demo HARUS dihapus/dinonaktifkan sebelum dipakai di produksi.'] }
  ];
  R.daftar('bantuan', {
    judul: 'Bantuan & SOP',
    render: function (ctx) {
      var p = ctx.me.peran;
      var urut = SOP.slice().sort(function (a, b) { return (b.r === p || (p === 'HVK' && b.r === 'HV')) - (a.r === p || (p === 'HVK' && a.r === 'HV')); });
      ctx.el.innerHTML = UI.kepala('Bantuan & SOP', 'Panduan singkat per peran. SOP untuk peran Anda ditampilkan paling atas.', '<button type="button" class="btn kecil" data-a="pintasan">' + ic('keyboard') + '<span>Pintasan keyboard</span></button>') +
        '<div class="grid g2 masuk">' + urut.map(function (s, i) { return '<div class="kartu"><div class="kartu-kepala"><div class="baris"><span class="ikon-ov">' + ic(s.i) + '</span><div><h2>' + e(s.j) + '</h2><p>Untuk ' + e(PERAN_INFO[s.r]) + (s.r === p ? ' · <b class="info-t">peran Anda</b>' : '') + '</p></div></div></div><div class="kartu-isi"><ol style="margin:0;padding-left:20px;display:grid;gap:6px;font-size:13px;color:var(--tinta-2)">' + s.s.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ol></div></div>'; }).join('') + '</div>' +
        '<div class="kartu pad mt-16"><div class="baris celah-12 bungkus"><span class="ikon-ov">' + ic('life-buoy') + '</span><div class="tumbuh"><h2>Butuh bantuan lebih lanjut?</h2><p class="redup kecil">Hubungi Admin sistem melalui WhatsApp kantor. Sertakan tangkapan layar & waktu kejadian.</p></div><a class="btn" href="' + U.wa((ctx.boot.profil || {}).telepon || '', 'Halo Admin Capten Care, saya butuh bantuan aplikasi:') + '" target="_blank" rel="noopener">' + ic('message-circle') + 'Hubungi Admin</a></div></div>';
      ctx.aksi({ pintasan: function () { var ev = new KeyboardEvent('keydown', { key: '?' }); document.dispatchEvent(ev); } });
    }
  });
})();
