/* =====================================================================
 * CAPTEN CARE — HALAMAN MASUK (v2.1)
 * Panel kiri: slideshow latar (diatur Admin) + kartu ilustrasi interaktif
 * (skenario fiktif, klik TTV → tren, klik timeline → detail & progres,
 * miring ikut kursor). Semua isi diatur Admin di Pengaturan → Halaman masuk.
 * Panel kanan: form masuk + Akses Cepat Mode Demo.
 * Kartu ilustrasi SELALU fiktif: halaman ini terbuka untuk publik.
 * ===================================================================== */
(function () {
  'use strict';
  var A = window.CCApp, U = A.U, ic = A.ic, UI = A.UI, Q = A.Q, R = A.Router, qs = A.qs, qsa = A.qsa, e = U.e, D = document;
  var KUNCI_CACHE = 'cc_login_v1';
  /* Cadangan tampilan pertama (sebelum respons server pada kunjungan pertama). Sama dengan bawaan server. */
  var CADANGAN = {
    slide: { aktif: true, durasi: 6, transisi: 'pudar', kecepatan: 1200, gelap: 64, acak: false, titik: true, keterangan: true, jeda_hover: true, daftar: [{ id: 'contoh1', url: 'assets/login/contoh-1.jpg', judul: 'Pendampingan perawat di rumah', teks: 'Penugasan, rotasi, dan laporan harian dalam satu portal.' }] },
    kartu: { aktif: true, judul: 'LIVE · PENUGASAN AKTIF', putar: 9, miring: true, blok: { perawat: true, ttv: true, lini: true, progres: true }, skenario: [{ id: 'sk1', label: 'Home Care VIP', pasien: 'Ny. Kartini Wulandari', info: '74 th · Pasca stroke iskemik · Paket VIP', status: 'Home Care Aktif', perawat: 'Ns. Dewi Anggraini, S.Kep', perawat_info: 'Shift Pagi · hari ke-12/30', ttv: [{ k: 'Tensi', v: '128/82', tren: '136/88; 133/86; 131/84; 130/83; 128/82' }, { k: 'Nadi', v: '78', tren: '86; 84; 81; 80; 78' }, { k: 'Suhu', v: '36,6°', tren: '37,2; 37,0; 36,8; 36,7; 36,6' }, { k: 'SpO₂', v: '98%', tren: '95; 96; 97; 97; 98' }], lini: [{ jam: '07.42', judul: 'Laporan shift malam', teks: 'terkirim ke keluarga via WhatsApp', detail: 'Ringkasan laporan A–H shift malam diteruskan ke penanggung jawab keluarga.', status: 'ok', progres: 2 }, { jam: '09.15', judul: 'Obat pagi', teks: 'diberikan sesuai jadwal', detail: 'Bagian D (obat) dicentang lengkap dengan jam pemberian.', status: 'ok', progres: 4 }, { jam: '11.30', judul: 'Alih baring & ROM pasif', teks: 'sedang berlangsung', detail: 'Bagian B (ADL) diisi setelah tindakan selesai.', status: 'jalan', progres: 6 }], progres_label: 'Laporan A–H', progres: 6, progres_maks: 8 }] }
  };
  function gerakDikurangi() { return (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || D.documentElement.dataset.animasi === 'mati'; }
  function jamSekarang() { var j = new Date(); return (j.getHours() < 10 ? '0' : '') + j.getHours() + '.' + (j.getMinutes() < 10 ? '0' : '') + j.getMinutes(); }
  function hidup(el) { return el && el.isConnected; }

  /* ===================== SLIDESHOW LATAR ===================== */
  function Slideshow(root, s) {
    var latar = qs('[data-lg-slide]', root), ket = qs('[data-lg-ket]', root), lapis = qs('.lg-lapis', root);
    var daftar = s && s.aktif ? (s.daftar || []).slice() : [], kurang = gerakDikurangi(), t = null, idx = -1, jeda = false, mati = false, lapisan = [], ac = new AbortController(), sig = { signal: ac.signal };
    lapis.style.setProperty('--lapis', String((s && s.gelap != null ? s.gelap : 72) / 100));
    if (s && s.acak) for (var i = daftar.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = daftar[i]; daftar[i] = daftar[j]; daftar[j] = x; }
    root.classList.toggle('ada-slide', daftar.length > 0);
    if (!daftar.length) { latar.innerHTML = ''; ket.innerHTML = ''; return { hancur: function () { } }; }
    var efek = kurang ? 'pudar' : s.transisi, cepat = kurang ? 200 : s.kecepatan, durasi = s.durasi * 1000;
    latar.dataset.efek = efek; latar.style.setProperty('--sl-cepat', cepat + 'ms'); latar.style.setProperty('--sl-durasi', (durasi + cepat) + 'ms');
    latar.innerHTML = '<div class="lg-sl"></div><div class="lg-sl"></div>'; lapisan = qsa('.lg-sl', latar);
    ket.innerHTML = (s.keterangan ? '<div class="lg-ket-teks" data-ket-teks></div>' : '') + (s.titik && daftar.length > 1 ? '<div class="lg-sl-titik" role="tablist" aria-label="Pilih gambar">' + daftar.map(function (d, i) { return '<button type="button" role="tab" data-sl-ke="' + i + '" aria-label="Gambar ' + (i + 1) + (d.judul ? ': ' + e(d.judul) : '') + '"><i></i></button>'; }).join('') + '</div>' : '');
    function siapkan(i) { return A.Media.ambil(daftar[i].url, 'aset').then(function (url) { if (!url) return ''; return new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(url); }; im.onerror = function () { ok(''); }; im.src = url; }); }); }
    function tampil(i) {
      if (mati || !hidup(root)) return berhenti();
      clearTimeout(t); var ke = (i + daftar.length) % daftar.length;
      siapkan(ke).then(function (url) {
        if (mati || !hidup(root)) return;
        var baru = lapisan[ke % 2 === idx % 2 && idx > -1 ? (idx + 1) % 2 : ke % 2], lama = lapisan.filter(function (l) { return l !== baru; })[0];
        if (url) {
          baru.classList.add('diam'); baru.classList.remove('aktif', 'keluar'); baru.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
          void baru.offsetWidth; baru.classList.remove('diam'); baru.classList.add('aktif');
          if (lama.classList.contains('aktif')) { lama.classList.remove('aktif'); lama.classList.add('keluar'); }
        }
        idx = ke;
        var kt = qs('[data-ket-teks]', ket), d = daftar[ke];
        if (kt) { kt.classList.remove('ganti'); void kt.offsetWidth; kt.innerHTML = d.judul || d.teks ? (d.judul ? '<b>' + e(d.judul) + '</b>' : '') + (d.teks ? '<span>' + e(d.teks) + '</span>' : '') : ''; kt.classList.add('ganti'); }
        qsa('[data-sl-ke]', ket).forEach(function (b, n) { b.classList.toggle('aktif', n === ke); b.setAttribute('aria-selected', String(n === ke)); var bar = b.querySelector('i'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = n === ke && daftar.length > 1 ? 'lgIsiTitik ' + (durasi + cepat) + 'ms linear both' : ''; } });
        jadwal();
      });
    }
    function jadwal() { clearTimeout(t); if (daftar.length < 2 || mati) return; t = setTimeout(function lanjut() { if (!hidup(root)) return berhenti(); if (jeda || D.hidden) { t = setTimeout(lanjut, 600); return; } tampil(idx + 1); }, durasi + cepat); }
    function berhenti() { mati = true; clearTimeout(t); ac.abort(); }
    ket.addEventListener('click', function (ev) { var b = ev.target.closest('[data-sl-ke]'); if (b) tampil(+b.dataset.slKe); }, sig);
    if (s.jeda_hover) { root.addEventListener('mouseenter', function () { jeda = true; qsa('[data-sl-ke] i', ket).forEach(function (i) { i.style.animationPlayState = 'paused'; }); }, sig); root.addEventListener('mouseleave', function () { jeda = false; qsa('[data-sl-ke] i', ket).forEach(function (i) { i.style.animationPlayState = ''; }); }, sig); }
    tampil(0);
    return { hancur: berhenti, ke: tampil };
  }

  /* ===================== KARTU ILUSTRASI INTERAKTIF ===================== */
  function angkaTren(teks) {
    return String(teks || '').split(';').map(function (x) { x = x.trim(); var m = x.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/); if (m) return [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))]; var n = parseFloat(x.replace(',', '.').replace(/[^\d.\-]/g, '')); return isNaN(n) ? null : [n]; }).filter(Boolean);
  }
  function grafikTren(t) {
    var titik = angkaTren(t.tren);
    if (titik.length < 2) return '<div class="lg-tren-kosong">' + ic('info', 'k') + ' Riwayat ' + e(t.k) + ' belum diisi Admin.</div>';
    /* Tensi (a/b) → dua pita (sistolik atas, diastolik bawah), masing-masing berskala sendiri agar tren terbaca */
    var seri = titik[0].length > 1 ? 2 : 1, W = 300, H = 78, kiri = 6, kanan = 30, warna = ['var(--merek)', '#A5B4FC'], nama = seri > 1 ? ['S', 'D'] : [''];
    var pita = seri > 1 ? [[8, 34], [44, 70]] : [[10, 64]];
    var x = function (i) { return kiri + (W - kiri - kanan) * (i / (titik.length - 1)); };
    var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lg-tren-svg" role="img" aria-label="Tren ' + e(t.k) + ' (ilustrasi)"><defs><linearGradient id="lgtg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00C2FF" stop-opacity=".32"/><stop offset="1" stop-color="#00C2FF" stop-opacity="0"/></linearGradient></defs>';
    for (var sI = 0; sI < seri; sI++) {
      var nilai = titik.map(function (p) { return p[sI]; }), min = Math.min.apply(null, nilai), maks = Math.max.apply(null, nilai), r = maks - min || 1, y0 = pita[sI][0], y1 = pita[sI][1];
      var y = function (v) { return y0 + (y1 - y0) * (1 - (v - min) / r); };
      var pts = nilai.map(function (v, i) { return [x(i), y(v)]; }), jalur = A.G._halus(pts);
      if (seri === 1) h += '<path d="' + jalur + 'L' + x(titik.length - 1).toFixed(1) + ',' + (H - 4) + 'L' + x(0).toFixed(1) + ',' + (H - 4) + 'Z" fill="url(#lgtg)"/>';
      h += '<path class="lg-tren-garis" d="' + jalur + '" fill="none" stroke="' + warna[sI] + '" stroke-width="2.2" stroke-linecap="round"/>';
      pts.forEach(function (p, i) { var akhir = i === pts.length - 1; h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (akhir ? 3.6 : 2.2) + '" fill="' + warna[sI] + '"' + (akhir ? ' stroke="#0B132B" stroke-width="1.5"' : '') + '/>'; });
      var lp = pts[pts.length - 1]; h += '<text x="' + (lp[0] + 8).toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) + '" fill="#E2E8F0" font-size="10.5" font-weight="700" font-family="var(--f-judul)">' + String(nilai[nilai.length - 1]).replace('.', ',') + '</text>';
    }
    var awal = titik[0].map(function (v) { return String(v).replace('.', ','); }).join('/'), akhir = titik[titik.length - 1].map(function (v) { return String(v).replace('.', ','); }).join('/');
    return h + '</svg><div class="lg-tren-kaki"><span>' + titik.length + ' catatan terakhir' + (seri > 1 ? ' · atas sistolik, bawah diastolik' : '') + '</span><span>' + e(awal) + ' → <b>' + e(akhir) + '</b></span></div>';
  }
  function Kartu(root, k) {
    var wadah = qs('[data-lg-wadah]', root), sk = k && k.aktif ? (k.skenario || []) : [], i = 0, tren = null, pilihLini = null, t = null, jedaSampai = 0, arahan = false, mati = false, kurang = gerakDikurangi(), ac = new AbortController(), sig = { signal: ac.signal };
    if (!sk.length) { wadah.innerHTML = ''; wadah.classList.add('sembunyi'); return { hancur: function () { } }; }
    wadah.classList.remove('sembunyi');
    var banyak = sk.length > 1, B = k.blok || {};
    wadah.innerHTML = '<div class="lg-kartu" data-lg-kartu tabindex="0" role="group" aria-roledescription="kartu ilustrasi" aria-label="Pratinjau ilustrasi, data fiktif' + (banyak ? '. Panah kiri/kanan untuk ganti skenario' : '') + '"><div class="lg-atas"><span class="lg-live"><i></i>' + e(k.judul) + '</span><span class="lg-waktu" data-lg-jam>' + jamSekarang() + ' WIB</span></div><div data-lg-isi></div><div class="lg-catatan">PRATINJAU ILUSTRASI · DATA FIKTIF</div></div>' +
      (banyak ? '<div class="lg-kendali"><button type="button" class="lg-panah" data-lg-geser="-1" aria-label="Skenario sebelumnya">' + ic('chevron-left', 'k') + '</button><div class="lg-titik">' + sk.map(function (x, n) { return '<button type="button" data-lg-ke="' + n + '" aria-label="' + e(x.label) + '"></button>'; }).join('') + '</div><span class="lg-label" data-lg-label></span><button type="button" class="lg-panah" data-lg-geser="1" aria-label="Skenario berikutnya">' + ic('chevron-right', 'k') + '</button></div>' : '');
    var kartu = qs('[data-lg-kartu]', wadah), isi = qs('[data-lg-isi]', wadah);
    function progresHtml(x, nilai) { var m = x.progres_maks || 8, p = Math.max(0, Math.min(m, nilai)); return '<span>' + e(x.progres_label) + '</span><div class="meter"><i style="transform:scaleX(' + (p / m).toFixed(3) + ')"></i></div><b data-lg-prog>' + p + '/' + m + '</b>'; }
    function gambar(arah) {
      var x = sk[i]; tren = null; pilihLini = null;
      var h = '<div class="lg-pasien"><span class="ava b" data-w="' + U.warna(x.pasien) + '">' + e(U.inisial(x.pasien)) + '</span><div class="tumbuh" style="min-width:0"><b>' + e(x.pasien) + '</b><span>' + e(x.info) + '</span></div>' + (x.status ? '<span class="lg-badge"><i></i>' + e(x.status) + '</span>' : '') + '</div>';
      if (B.perawat && x.perawat) h += '<div class="lg-perawat"><span class="ava k" data-w="' + U.warna(x.perawat) + '">' + e(U.inisial(x.perawat)) + '</span><span class="tumbuh">Bertugas: <b>' + e(x.perawat) + '</b></span><span>' + e(x.perawat_info) + '</span></div>';
      if (B.ttv && x.ttv.length) h += '<div class="lg-ttv" style="--n:' + x.ttv.length + '">' + x.ttv.map(function (v, n) { return '<button type="button" class="lg-ttv-i" data-lg-ttv="' + n + '" aria-expanded="false" title="Lihat tren ' + e(v.k) + '"><small>' + e(v.k) + '</small><b>' + e(v.v) + '</b>' + ic('chart-spline', 'lg-ttv-ik') + '</button>'; }).join('') + '</div><div data-lg-tren></div>';
      if (B.lini && x.lini.length) h += '<div class="lg-lini">' + x.lini.map(function (l, n) { return '<button type="button" class="e ' + e(l.status) + '" data-lg-lini="' + n + '" aria-expanded="false"><span class="lg-lini-teks"><time>' + e(l.jam) + '</time><b>' + e(l.judul) + '</b> ' + e(l.teks) + '</span></button>'; }).join('') + '</div>';
      if (B.progres) h += '<div class="lg-progres" data-lg-progres>' + progresHtml(x, x.progres) + '</div>';
      isi.innerHTML = '<div class="lg-isi-dalam ' + (arah < 0 ? 'dari-kiri' : arah > 0 ? 'dari-kanan' : '') + '">' + h + '</div>';
      qsa('[data-lg-ke]', wadah).forEach(function (b, n) { b.classList.toggle('aktif', n === i); b.setAttribute('aria-current', n === i ? 'true' : 'false'); });
      var lb = qs('[data-lg-label]', wadah); if (lb) lb.textContent = x.label + ' · ' + (i + 1) + '/' + sk.length;
    }
    function ke(n, arah) { i = (n + sk.length) % sk.length; gambar(arah); }
    function setProgres(nilai) { var p = qs('[data-lg-progres]', isi); if (!p) return; var m = sk[i].progres_maks || 8, v = Math.max(0, Math.min(m, nilai)), bar = qs('.meter > i', p), b = qs('[data-lg-prog]', p); if (bar) bar.style.transform = 'scaleX(' + (v / m).toFixed(3) + ')'; if (b) b.textContent = v + '/' + m; }
    function sentuh() { jedaSampai = Date.now() + 15000; }
    function putar() {
      clearTimeout(t); if (!banyak || !k.putar || mati) return;
      t = setTimeout(function cek() { if (!hidup(root)) return berhenti(); if (arahan || D.hidden || Date.now() < jedaSampai) { t = setTimeout(cek, 1000); return; } ke(i + 1, 1); putar(); }, k.putar * 1000);
    }
    function berhenti() { mati = true; clearTimeout(t); ac.abort(); }
    wadah.addEventListener('click', function (ev) {
      var b;
      if ((b = ev.target.closest('[data-lg-geser]'))) { sentuh(); ke(i + Number(b.dataset.lgGeser), Number(b.dataset.lgGeser)); return; }
      if ((b = ev.target.closest('[data-lg-ke]'))) { sentuh(); var n = +b.dataset.lgKe; if (n !== i) ke(n, n > i ? 1 : -1); return; }
      if ((b = ev.target.closest('[data-lg-ttv]'))) {
        sentuh(); var n2 = +b.dataset.lgTtv, w = qs('[data-lg-tren]', isi);
        qsa('[data-lg-ttv]', isi).forEach(function (x) { x.classList.remove('aktif'); x.setAttribute('aria-expanded', 'false'); });
        if (tren === n2) { tren = null; w.innerHTML = ''; return; }
        tren = n2; b.classList.add('aktif'); b.setAttribute('aria-expanded', 'true');
        var v = sk[i].ttv[n2]; w.innerHTML = '<div class="lg-tren"><div class="lg-tren-kepala"><span>Tren ' + e(v.k) + '</span><small>ilustrasi</small></div>' + grafikTren(v) + '</div>';
        if (!kurang) qsa('.lg-tren-garis', w).forEach(function (p) { try { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.transition = 'stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = '0'; }); }); } catch (x) { } });
        return;
      }
      if ((b = ev.target.closest('[data-lg-lini]'))) {
        sentuh(); var n3 = +b.dataset.lgLini, l = sk[i].lini[n3];
        qsa('[data-lg-lini]', isi).forEach(function (x) { x.classList.remove('aktif'); x.setAttribute('aria-expanded', 'false'); var d = qs('.lg-detail', x); if (d) d.remove(); });
        if (pilihLini === n3) { pilihLini = null; setProgres(sk[i].progres); return; }
        pilihLini = n3; b.classList.add('aktif'); b.setAttribute('aria-expanded', 'true');
        if (l.detail) b.insertAdjacentHTML('beforeend', '<span class="lg-detail">' + e(l.detail) + '</span>');
        setProgres(l.progres);
      }
    }, sig);
    kartu.addEventListener('keydown', function (ev) { if (!banyak || ev.target !== kartu) return; if (ev.key === 'ArrowRight') { sentuh(); ke(i + 1, 1); } else if (ev.key === 'ArrowLeft') { sentuh(); ke(i - 1, -1); } });
    wadah.addEventListener('mouseenter', function () { arahan = true; }, sig);
    wadah.addEventListener('mouseleave', function () { arahan = false; kartu.style.transform = ''; kartu.classList.remove('miring'); }, sig);
    wadah.addEventListener('focusin', function () { arahan = true; }, sig); wadah.addEventListener('focusout', function () { arahan = false; }, sig);
    /* Miring 3D mengikuti kursor (hanya mouse/pena presisi, bukan sentuh) */
    if (k.miring && !kurang) kartu.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return; var r = kartu.getBoundingClientRect(), dx = (ev.clientX - r.left) / r.width - .5, dy = (ev.clientY - r.top) / r.height - .5;
      kartu.classList.add('miring'); kartu.style.transform = 'perspective(1000px) rotateX(' + (-dy * 7).toFixed(2) + 'deg) rotateY(' + (dx * 9).toFixed(2) + 'deg) translateZ(0)';
      kartu.style.setProperty('--kilau-x', Math.round((dx + .5) * 100) + '%'); kartu.style.setProperty('--kilau-y', Math.round((dy + .5) * 100) + '%');
    });
    /* Geser (sentuh) untuk ganti skenario */
    var x0 = null; kartu.addEventListener('pointerdown', function (ev) { if (ev.pointerType !== 'mouse') x0 = ev.clientX; });
    kartu.addEventListener('pointerup', function (ev) { if (x0 == null || !banyak) return; var dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 45) { sentuh(); ke(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); } });
    var jamT = setInterval(function () { var el = qs('[data-lg-jam]', wadah); if (!el || !hidup(root) || mati) return clearInterval(jamT); el.textContent = jamSekarang() + ' WIB'; }, 20000);
    gambar(0); putar();
    return { hancur: function () { berhenti(); clearInterval(jamT); }, ke: ke };
  }

  /* ===================== PANEL KIRI (dipakai juga untuk pratinjau di Pengaturan) ===================== */
  function htmlPanelKiri() {
    return '<div class="lg-slide" data-lg-slide aria-hidden="true"></div><div class="lg-lapis" aria-hidden="true"></div>' +
      '<div class="baris celah-12 lg-merek"><span class="sb-logo"><img src="assets/logo.svg" alt="" data-logo></span><div class="sb-brand"><b data-brand>Capten Care</b><span data-tagline>Integrated Management System</span></div></div>' +
      '<div class="lg-panggung"><div class="lg-tumpuk"><div class="lg-kartu-wadah" data-lg-wadah></div></div></div>' +
      '<div class="lg-bawah"><div class="lg-ket" data-lg-ket></div><div class="lg-kaki"><span>' + ic('clipboard-check') + 'Laporan A–H terstandar</span><span>' + ic('shield-check') + 'Izin berbasis peran</span><span>' + ic('qr-code') + 'Dokumen ber-QR</span></div></div>';
  }
  function Panel(root, cfg) {
    root.classList.add('lg21'); if (!qs('[data-lg-slide]', root)) root.innerHTML = htmlPanelKiri();
    var bagian = [];
    function pasang(c) { bagian.forEach(function (b) { b.hancur(); }); bagian = [Slideshow(root, c.slide), Kartu(root, c.kartu)]; }
    pasang(cfg);
    return { perbarui: pasang, hancur: function () { bagian.forEach(function (b) { b.hancur(); }); } };
  }
  A.Masuk = { Panel: Panel, htmlPanelKiri: htmlPanelKiri, grafikTren: grafikTren, angkaTren: angkaTren };

  /* ===================== RUTE: MASUK ===================== */
  R.daftar('masuk', {
    bebas: true,
    render: function (wadah) {
      var demo = A.API.mode === 'demo';
      wadah.innerHTML = '<div class="masuk-hal"><section class="masuk-kiri v2" data-lg-kiri>' + htmlPanelKiri() + '</section>' +
        '<section class="masuk-kanan"><div class="masuk-kartu masuk v2"><div class="lg-merek-hp"><span class="sb-logo" style="background:var(--gelap)"><img src="assets/logo.svg" alt="" data-logo></span><div><b style="font:700 15px var(--f-judul)" data-brand>Capten Care</b><div class="kecil redup">Integrated Management System</div></div></div>' +
        '<span class="label-mikro">Masuk ke akun</span><h1 class="mt-4">Portal Operasional Terpadu</h1><p class="mikro">Masukkan kredensial Anda untuk mengakses sistem rekam medis &amp; penugasan.</p>' +
        '<form class="mt-24" data-form-masuk novalidate><div class="form"><div class="fld" data-k="username"><label for="m-user">Username</label><div class="inp-ikon">' + ic('user-round') + '<input class="inp" id="m-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Nama pengguna dari Admin" required></div><span class="galat"></span></div>' +
        '<div class="fld" data-k="pin"><label for="m-pin">PIN / Kata sandi</label><div class="inp-ikon">' + ic('lock-keyhole') + '<input class="inp" id="m-pin" name="pin" type="password" autocomplete="current-password" placeholder="••••••" required><button type="button" class="btn ikon hantu mini" data-lihat style="position:absolute;right:8px;top:50%;transform:translateY(-50%)" aria-label="Tampilkan PIN">' + ic('eye', 'k') + '</button></div><span class="galat"></span></div></div>' +
        '<div class="panel-bahaya mt-12 sembunyi" data-pesan-galat>' + ic('circle-alert', 'k') + '<span></span></div>' +
        '<button type="submit" class="btn primer penuh mt-16" data-masuk>' + ic('log-in') + '<span>Masuk</span><kbd>↵</kbd></button></form>' +
        (demo ? '<div class="pemisah-atau">atau</div><button type="button" class="demo-cepat" data-demo-cepat aria-haspopup="listbox" aria-expanded="false"><span class="zap">' + ic('zap') + '</span><span class="tumbuh"><b>Akses Cepat Mode Demo</b><small>Pilih peran — form terisi & langsung masuk</small></span>' + ic('chevron-down', 'panah') + '</button>' : '') +
        '<div class="baris rata mt-24 kecil redup"><a href="#/f/karir">' + ic('briefcase', 'k') + ' Lowongan perawat</a><a href="#/v">' + ic('qr-code', 'k') + ' Verifikasi dokumen</a></div></div></section></div>';
      /* Panel kiri: tampil seketika dari cache terakhir (atau cadangan), lalu diperbarui dari server */
      var kiri = qs('[data-lg-kiri]', wadah), simpanan = null;
      try { simpanan = JSON.parse(localStorage.getItem(KUNCI_CACHE) || 'null'); } catch (x) { }
      var cfgAwal = simpanan && simpanan.login || CADANGAN, panel = Panel(kiri, cfgAwal);
      Q('publik.login', {}, { ttl: 0 }).then(function (d) {
        if (!d || !d.login || !hidup(kiri)) return;
        if (JSON.stringify(d.login) !== JSON.stringify(cfgAwal)) panel.perbarui(d.login);
        try { localStorage.setItem(KUNCI_CACHE, JSON.stringify({ login: d.login })); } catch (x) { }
      }).catch(function () { });
      Q('publik.tema', {}).then(function (t) {
        var b = (t && t.branding) || {}; A.Tema.terapkan(b);
        if (b.logo_url) qsa('[data-logo]', wadah).forEach(function (i) { i.src = b.logo_url; });
        qsa('[data-brand]', wadah).forEach(function (nb) { nb.textContent = b.nama_brand || 'Capten Care'; });
        if (b.tagline) qsa('[data-tagline]', wadah).forEach(function (nb) { nb.textContent = b.tagline; });
      }).catch(function () { });
      var form = qs('[data-form-masuk]', wadah), galat = qs('[data-pesan-galat]', wadah), tombol = qs('[data-masuk]', wadah);
      UI.pasangForm(form);
      function masuk(u, p, b) {
        galat.classList.add('sembunyi');
        UI.kerja(b, function () { return A.Sesi.masuk(u, p); }).then(function (boot) {
          var tujuan = R._tujuan && !/masuk/.test(R._tujuan) ? R._tujuan.replace(/^#\/?/, '') : 'dashboard'; R._tujuan = null;
          panel.hancur(); A.Shell.terpasang = false; R.ke(tujuan, true);
          setTimeout(function () { UI.toast(A.F.sapa() + ', ' + A.F.namaDepan(boot.me.nama) + '. Anda masuk sebagai ' + boot.me.peran_label + '.', 'ok'); }, 250);
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
          var tutup = setInterval(function () { if (!D.body.contains(pop)) { dc.setAttribute('aria-expanded', 'false'); clearInterval(tutup); } }, 200);
          return;
        }
        var l = ev.target.closest('[data-lihat]'); if (l) { var i = qs('#m-pin', wadah); i.type = i.type === 'password' ? 'text' : 'password'; l.innerHTML = ic(i.type === 'password' ? 'eye' : 'eye-off', 'k'); }
      });
      setTimeout(function () { var i = qs('#m-user', wadah); if (i && window.innerWidth > 860) i.focus(); }, 80);
    }
  });
  function ikonPeran(u) { return { direksi: 'shield-check', koordinator: 'heart-pulse', perawat: 'stethoscope', homevisit: 'syringe', perawathv: 'syringe', cs: 'message-circle-more', hrd: 'briefcase', operasional: 'activity', keuangan: 'landmark', pettycash: 'piggy-bank' }[u] || 'user-round'; }
})();
