/* =====================================================================
 * CAPTEN CARE — INTI FRONTEND
 * Utilitas, lapisan API (live/demo + fallback), cache SWR, komponen UI,
 * grafik SVG, router, shell aplikasi, palet ⌘K, dan simulator peran.
 * Tanpa framework & tanpa CDN JavaScript: cepat dibuka di HP.
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var CFG = W.CONFIG || {}, VERSI = '2.0.0';

  /* ===================== UTILITAS ===================== */
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BLN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var U = {
    e: function (s) { return s == null ? '' : String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    n: function (v) { if (typeof v === 'number') return isFinite(v) ? v : 0; var x = Number(String(v == null ? '' : v).replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(x) ? x : 0; },
    angka: function (v, d) { var n = U.n(v); return n.toLocaleString('id-ID', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 }); },
    rp: function (v) { if (v === '' || v == null) return '—'; var n = Math.round(U.n(v)); return (n < 0 ? '−Rp ' : 'Rp ') + Math.abs(n).toLocaleString('id-ID'); },
    rpS: function (v) { var n = U.n(v), a = Math.abs(n), s = n < 0 ? '−' : ''; if (a >= 1e9) return s + 'Rp ' + (a / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M'; if (a >= 1e6) return s + 'Rp ' + (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt'; if (a >= 1e3) return s + 'Rp ' + Math.round(a / 1e3) + ' rb'; return s + 'Rp ' + a; },
    persen: function (v, d) { if (v === '' || v == null) return '—'; return U.angka(v, d == null ? 1 : d) + '%'; },
    parse: function (s) { if (!s) return null; if (s instanceof Date) return s; var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/); if (!m) { var d = new Date(s); return isNaN(d) ? null : d; } return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)); },
    iso: function (d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    hariIni: function () { return U.iso(new Date()); },
    bulanIni: function () { return U.iso(new Date()).slice(0, 7); },
    tambahHari: function (s, n) { var d = U.parse(s) || new Date(); d.setDate(d.getDate() + n); return U.iso(d); },
    tambahBulan: function (b, n) { var p = String(b).split('-'), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); },
    tgl: function (s) { var d = U.parse(s); return d ? d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() : '—'; },
    tglK: function (s) { var d = U.parse(s); return d ? d.getDate() + ' ' + BLN[d.getMonth()] : '—'; },
    tglP: function (s) { var d = U.parse(s); return d ? HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN_P[d.getMonth()] + ' ' + d.getFullYear() : '—'; },
    waktu: function (s) { var d = U.parse(s); if (!d) return '—'; return d.getDate() + ' ' + BLN[d.getMonth()] + ' · ' + pad(d.getHours()) + '.' + pad(d.getMinutes()); },
    jam: function (s) { var d = U.parse(s); return d ? pad(d.getHours()) + '.' + pad(d.getMinutes()) : '—'; },
    bulan: function (b) { if (!b) return '—'; var p = String(b).split('-'); return BLN_P[+p[1] - 1] + ' ' + p[0]; },
    bulanK: function (b) { var p = String(b).split('-'); return BLN[+p[1] - 1] + ' ' + String(p[0]).slice(2); },
    hari: function (s) { var d = U.parse(s); return d ? HARI[d.getDay()] : ''; },
    relatif: function (s) {
      var d = U.parse(s); if (!d) return '—'; var m = Math.round((Date.now() - d.getTime()) / 60000);
      if (m < 1 && m > -1) return 'baru saja'; if (m < 0) { var f = -m; return f < 60 ? 'dalam ' + f + ' mnt' : f < 1440 ? 'dalam ' + Math.round(f / 60) + ' jam' : 'dalam ' + Math.round(f / 1440) + ' hari'; }
      if (m < 60) return m + ' mnt lalu'; if (m < 1440) return Math.round(m / 60) + ' jam lalu'; if (m < 2880) return 'kemarin'; if (m < 43200) return Math.round(m / 1440) + ' hari lalu'; return U.tgl(s);
    },
    selisihHari: function (a, b) { var x = U.parse(a), y = U.parse(b); if (!x || !y) return 0; x.setHours(0, 0, 0, 0); y.setHours(0, 0, 0, 0); return Math.round((y - x) / 864e5); },
    inisial: function (nama) { var s = String(nama || '?').replace(/\b(Ns|dr|Tn|Ny|Bpk|Ibu|CG|Bdn|H|Hj|Sp\.?[A-Z]*|S\.Kep|A\.Md(\.[A-Za-z]+)*|S\.E|Ak|S\.Psi|M\.M|S\.Tr|An)\.?(?=\s|,|$)/g, '').replace(/,.*$/, '').trim().split(/\s+/).filter(Boolean); return ((s[0] || '?')[0] + (s.length > 1 ? s[s.length - 1][0] : '')).toUpperCase(); },
    warna: function (s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 8; },
    hp: function (v) { var s = String(v == null ? '' : v).replace(/[^0-9]/g, ''); if (s.indexOf('62') === 0) s = '0' + s.slice(2); else if (s[0] === '8') s = '0' + s; return s; },
    wa: function (v, teks) { var s = U.hp(v); if (!s) return ''; return 'https://wa.me/62' + s.slice(1) + (teks ? '?text=' + encodeURIComponent(teks) : ''); },
    debounce: function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; },
    salin: function (teks) { try { navigator.clipboard.writeText(teks); } catch (e) { var t = D.createElement('textarea'); t.value = teks; D.body.appendChild(t); t.select(); D.execCommand('copy'); t.remove(); } UI.toast('Disalin ke clipboard', 'ok'); },
    unduh: function (nama, isi, mime) { var b = isi instanceof Blob ? isi : new Blob([isi], { type: mime || 'text/plain;charset=utf-8' }), a = D.createElement('a'); a.href = URL.createObjectURL(b); a.download = nama; D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); },
    csv: function (rows, kolom) { var q = function (v) { v = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }; return '﻿' + [kolom.map(function (k) { return q(k.l || k.k); }).join(';')].concat(rows.map(function (r) { return kolom.map(function (k) { return q(k.csv ? k.csv(r) : r[k.k]); }).join(';'); })).join('\n'); },
    json: function (v, d) { if (v && typeof v === 'object') return v; try { return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    hash: function (s) { s = typeof s === 'string' ? s : JSON.stringify(s); var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; },
    kelompok: function (rows, f) { var o = {}; rows.forEach(function (r) { var k = typeof f === 'function' ? f(r) : r[f]; (o[k] = o[k] || []).push(r); }); return o; },
    jumlah: function (rows, f) { return rows.reduce(function (a, r) { return a + U.n(typeof f === 'function' ? f(r) : r[f]); }, 0); },
    cocok: function (r, q, kunci) { if (!q) return true; q = q.toLowerCase(); return (kunci || Object.keys(r)).some(function (k) { var v = r[k]; return v != null && String(v).toLowerCase().indexOf(q) > -1; }); },
    fileKeData: function (f, maks) { return new Promise(function (ok, gagal) { if (!f) return ok(''); if (f.size > (maks || 4) * 1048576) return gagal(new Error('Ukuran berkas maksimal ' + (maks || 4) + ' MB.')); var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { gagal(new Error('Berkas tidak dapat dibaca.')); }; r.readAsDataURL(f); }); },
    kecilkanGambar: function (dataUrl, maks) { return new Promise(function (ok) { if (!/^data:image\/(png|jpe?g|webp)/.test(dataUrl)) return ok(dataUrl); var img = new Image(); img.onload = function () { var s = Math.min(1, (maks || 1280) / Math.max(img.width, img.height)), c = D.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .82)); }; img.onerror = function () { ok(dataUrl); }; img.src = dataUrl; }); }
  };
  function ic(n, k) { return '<svg class="ik' + (k ? ' ' + k : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function qs(s, el) { return (el || D).querySelector(s); }
  function qsa(s, el) { return Array.prototype.slice.call((el || D).querySelectorAll(s)); }

  /* ===================== STATUS → LENCANA ===================== */
  var STATUS = {
    ok: 'Aktif Berjalan Lunas Terkirim Selesai Disetujui Done TERBIT Stabil Tercatat Dibayarkan Valid Deal Terdaftar Hadir Bertugas Lulus Ditinjau Berhasil Aktif Kembali Diterima Tepat Waktu Terhubung YA Sehat Sudah',
    warn: 'Menunggu Draft Draf Diajukan Terbit Dibayar Sebagian Terjadwal Proses Diproses Perlu pemantauan Terlambat Antri Follow Up Negosiasi Training Interview Seleksi Diminta Diisi Siaga Cuti Sakit Izin MENUNGGU_TTD DRAF Berjalan Sebagian Sebagian Belum Diisi Hampir Not Belum dihitung Dihitung Perpanjangan Draf Perpanjangan Menunggu Persetujuan Kontrak',
    bahaya: 'Overdue Gagal Batal Ditolak Mengalami perubahan kondisi Kritis Resign Putus Dibatalkan DITARIK Tidak Jadi Blacklist Lewat Jatuh Tempo Alpa Belum Masuk Tidak Terdaftar Dihentikan Diberhentikan Terkunci Nonaktif Tidak Lulus',
    info: 'Masuk Lead Masuk Baru Konsultasi New Dihubungi Survei Assessment Infal Utama Prospek Sedang',
    netral: 'Arsip Selesai Kontrak Existing Libur Rendah Tidak Aktif Cadangan'
  };
  var PETA_STATUS = {}; Object.keys(STATUS).forEach(function (k) { STATUS[k].split(' ').forEach(function (s) { PETA_STATUS[s.replace(/ /g, ' ').toLowerCase()] = k; }); });
  function kelasStatus(s) { s = String(s || '').toLowerCase(); if (PETA_STATUS[s]) return PETA_STATUS[s]; if (/gagal|batal|tolak|overdue|terlambat bayar|kritis|putus/.test(s)) return 'bahaya'; if (/terkirim|lunas|selesai|aktif|setuju/.test(s)) return 'ok'; if (/menunggu|antri|draf|proses|ajukan/.test(s)) return 'warn'; return 'netral'; }

  /* ===================== PEMUATAN (progres atas) ===================== */
  var Muat = {
    n: 0, el: null, t: null, w: 0,
    mulai: function () {
      this.n++; if (this.n > 1) return; var el = this.el || (this.el = qs('#progres')); if (!el) return;
      clearTimeout(this.t); this.w = 8; el.style.transition = 'none'; el.style.width = '0'; el.offsetWidth; el.style.transition = ''; el.classList.add('jalan'); el.style.width = '18%';
      var self = this; (function maju() { self.t = setTimeout(function () { if (self.n <= 0) return; self.w = Math.min(92, (parseFloat(el.style.width) || 18) + (92 - (parseFloat(el.style.width) || 18)) * .18); el.style.width = self.w + '%'; maju(); }, 260); })();
    },
    selesai: function () { this.n = Math.max(0, this.n - 1); if (this.n) return; var el = this.el; if (!el) return; clearTimeout(this.t); el.style.width = '100%'; this.t = setTimeout(function () { el.classList.remove('jalan'); setTimeout(function () { el.style.width = '0'; }, 300); }, 220); }
  };
  function htmlPemuat(teks, sub, gelap) {
    return '<div class="pemuat"><div class="orbit"><svg class="jejak" viewBox="0 0 74 74"><circle cx="37" cy="37" r="34"/></svg><svg class="cincin" viewBox="0 0 74 74"><circle cx="37" cy="37" r="34"/></svg><div class="inti"><img src="assets/logo.svg" alt=""></div></div>' +
      '<svg class="ekg" viewBox="0 0 180 36"><path d="M0 18h52l6-10 8 22 7-28 7 24 5-8h95"/></svg>' + (teks ? '<div class="teks-muat">' + U.e(teks) + (sub ? '<span>' + U.e(sub) + '</span>' : '') + '</div>' : '') + '</div>';
  }

  /* ===================== LAPISAN API ===================== */
  var BACA = {};
  ('crud.list auth.boot publik.tema notif.inapp cari.global dash.data pasien.detail pasien.tautanList publik.formInfo perawat.direktori perawat.kontrak penugasan.list absensi.grid libur.list laporan.konteks laporan.list laporan.detail laporan.kepatuhan hv.list idf.list idf.detail pipeline.list kasus.list kasus.mingguan turnover.rekap ops.harian so.list so.cekAdmin invoice.list invoice.detail perpanjangan.list gaji.lihat gaji.daftarBayar gaji.simulasi gaji.cariPerawat pc.buku pc.tahunan keu.laporan target.capaian analitik.penjualan pengaturan.ambil log.list sistem.status notif.config notif.antrean wa.perangkat wa.blastList crm.list crm.stats crm.detail berkas.ambil tpl.list tpl.detail tpl.pratinjau dok.list dok.detail publik.verifikasi invoice.html').split(' ').forEach(function (a) { BACA[a] = 1; });
  function ApiError(code, message, fields) { this.code = code || 'SERVER'; this.message = message || 'Terjadi kesalahan.'; this.fields = fields || null; }
  ApiError.prototype = Object.create(Error.prototype);
  var API = {
    mode: (CFG.USE_MOCK || !CFG.GAS_API_URL || /GANTI|XXXX/.test(CFG.GAS_API_URL)) ? 'demo' : 'live',
    alasanDemo: (CFG.USE_MOCK ? 'config' : (!CFG.GAS_API_URL ? 'kosong' : '')),
    putus: false, token: '', lastMs: 0, versiServer: '',
    _demo: null,
    muatDemo: function () {
      if (this._demo) return this._demo;
      var berkas = ['js/vendor/qrcode.min.js', 'js/logika-inti.js', 'js/logika-modul.js', 'js/logika-bisnis.js', 'js/logika-dok.js', 'js/data-demo.js', 'js/demo.js'];
      this._demo = berkas.reduce(function (p, src) { return p.then(function () { return new Promise(function (ok, gagal) { var s = D.createElement('script'); s.src = src + '?v=' + VERSI; s.onload = ok; s.onerror = function () { gagal(new Error('Gagal memuat ' + src)); }; D.head.appendChild(s); }); }); }, Promise.resolve()).then(function () { try { if (W.CC && W.CC.BAWAAN && W.CC.BAWAAN.branding && !W.CC.BAWAAN.branding.app_url && /^https?:/.test(location.href)) W.CC.BAWAAN.branding.app_url = location.href.split('#')[0]; } catch (x) { } var r = W.CCDemo.siapkan(); if (r && r.baru && r.alasan === 'tanggal') setTimeout(function () { UI.toast('Data demo diperbarui mengikuti tanggal hari ini.', 'info'); }, 1500); return true; });
      return this._demo;
    },
    panggil: function (action, payload, o) {
      o = o || {}; var self = this, req = { action: action, token: this.token, payload: payload || {} };
      if (!o.diam) Muat.mulai();
      var jalan = this.mode === 'demo' ? this._lewatDemo(req, o) : this._lewatLive(req, o, 0);
      return jalan.then(function (res) {
        if (!o.diam) Muat.selesai();
        if (res.tokenBaru) { self.token = res.tokenBaru; Sesi.simpanToken(res.tokenBaru); }
        if (res.ms != null) self.lastMs = res.ms; if (res.v) self.versiServer = res.v;
        if (res.nq > 0 && self.mode === 'live') kurasNotif();
        if (!res.ok) {
          var er = res.error || {};
          if (er.code === 'AUTH_REQUIRED' && action !== 'auth.login' && !o.tanpaKeluar) { Sesi.berakhir(er.message); }
          throw new ApiError(er.code, er.message, er.fields);
        }
        if (!BACA[action] && action !== 'batch') { API.pesan = res.message || ''; Data.setelahTulis(action); }
        if (o.lengkap) return res;
        return res.data;
      }, function (err) { if (!o.diam) Muat.selesai(); throw err instanceof ApiError ? err : new ApiError('JARINGAN', err && err.message ? err.message : 'Koneksi gagal.'); });
    },
    _lewatDemo: function (req, o) {
      var lat = o.instan ? 0 : Number(CFG.DEMO_LATENSI_MS == null ? 140 : CFG.DEMO_LATENSI_MS);
      return this.muatDemo().then(function () {
        return new Promise(function (ok) {
          setTimeout(function () {
            var t0 = performance.now(), res;
            if (req.action === 'batch') res = { ok: true, data: (req.payload.calls || []).map(function (c) { return W.CCDemo.handle({ action: c.action, token: req.token, payload: c.payload || {} }); }) };
            else res = W.CCDemo.handle(req);
            res = JSON.parse(JSON.stringify(res));   // salinan seperti respons jaringan
            res.ms = Math.round(performance.now() - t0);
            ok(res);
          }, BACA[req.action] ? lat * .6 : lat);
        });
      });
    },
    _lewatLive: function (req, o, coba) {
      var self = this, ctrl = W.AbortController ? new AbortController() : null, batas = setTimeout(function () { if (ctrl) ctrl.abort(); }, o.batasMs || 45000);
      return fetch(CFG.GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(req), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { clearTimeout(batas); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (t) { try { return JSON.parse(t); } catch (e) { throw new Error('Respons server bukan JSON. Periksa URL Web App & akses "Anyone".'); } })
        .then(function (res) {
          self.putus = false; Shell.statusKoneksi();
          var sibuk = !res.ok && res.error && res.error.code === 'SERVER_BUSY';
          if (sibuk && coba < 2) return new Promise(function (ok) { setTimeout(ok, 700 * (coba + 1)); }).then(function () { return self._lewatLive(req, o, coba + 1); });
          return res;
        }, function (err) {
          clearTimeout(batas);
          if (BACA[req.action] && coba < 2) return new Promise(function (ok) { setTimeout(ok, 600 * (coba + 1)); }).then(function () { return self._lewatLive(req, o, coba + 1); });
          self.putus = true; Shell.statusKoneksi();
          throw new ApiError('JARINGAN', (err && err.name === 'AbortError') ? 'Server tidak merespons (batas waktu). Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        });
    },
    hangatkan: function (lingkup) { if (this.mode !== 'live') return; try { var k = 'cc_warm_' + lingkup, t = Number(sessionStorage.getItem(k) || 0); if (Date.now() - t < 240000) return; sessionStorage.setItem(k, Date.now()); fetch(CFG.GAS_API_URL + '?w=' + lingkup, { mode: 'no-cors' }).catch(function () { }); } catch (e) { } }
  };
  var kurasNotif = U.debounce(function () { API.panggil('notif.kuras', {}, { diam: true }).catch(function () { }); }, 600);

  /* ===================== CACHE SWR + DEDUPE + BATCH ===================== */
  var Data = {
    c: {}, inflight: {}, epoch: 0, dipakai: {}, antre: null,
    kunci: function (a, p) { return a + '|' + JSON.stringify(p || {}); },
    simpanSesi: U.debounce(function () { if (API.mode !== 'live' || !Sesi.uid) return; try { var o = {}, ks = Object.keys(Data.c).sort(function (a, b) { return Data.c[b].t - Data.c[a].t; }).slice(0, 30); ks.forEach(function (k) { o[k] = Data.c[k]; }); sessionStorage.setItem('cc_swr_' + Sesi.uid, JSON.stringify(o)); } catch (e) { } }, 1200),
    pulihkanSesi: function () { if (API.mode !== 'live' || !Sesi.uid) return; try { var o = JSON.parse(sessionStorage.getItem('cc_swr_' + Sesi.uid) || '{}'); Object.keys(o).forEach(function (k) { o[k].basi = true; Data.c[k] = o[k]; }); } catch (e) { } },
    /* Ambil data baca. Mengembalikan data cache seketika (bila ada) lalu memvalidasi ulang di belakang. */
    ambil: function (a, p, o) {
      o = o || {}; var k = this.kunci(a, p), e = this.c[k], self = this, segar = o.ttl == null ? 30000 : o.ttl;
      this.dipakai[k] = 1;
      if (e && !o.paksa && !e.tulis) {
        if (e.basi || Date.now() - e.t > segar) this._ambilJaringan(a, p, k, true);
        return Promise.resolve(e.d);
      }
      return this._ambilJaringan(a, p, k, false, o);
    },
    _ambilJaringan: function (a, p, k, latar, o) {
      var self = this, ep = this.epoch;
      if (this.inflight[k]) return this.inflight[k];
      var pr = (latar ? this._lewatAntre(a, p, true) : this._lewatAntre(a, p, false, o)).then(function (d) {
        delete self.inflight[k];
        if (ep !== self.epoch && latar) return d;
        var lama = self.c[k], h = U.hash(d);
        self.c[k] = { d: d, t: Date.now(), h: h };
        self.simpanSesi();
        if (latar && lama && lama.h !== h && self.dipakai[k]) Router.segarkanDiam();
        return d;
      }, function (er) { delete self.inflight[k]; if (latar) return null; throw er; });
      this.inflight[k] = pr; return pr;
    },
    /* Penggabung otomatis: panggilan baca pada tik yang sama → 1 eksekusi 'batch' */
    _lewatAntre: function (a, p, diam, o) {
      var self = this;
      if (API.mode === 'demo' || (o && o.langsung)) return API.panggil(a, p, { diam: diam });
      return new Promise(function (ok, gagal) {
        if (!self.antre) { self.antre = []; setTimeout(function () { self._kirimAntre(); }, 0); }
        self.antre.push({ a: a, p: p, ok: ok, gagal: gagal, diam: diam });
      });
    },
    _kirimAntre: function () {
      var q = this.antre; this.antre = null; if (!q || !q.length) return;
      while (q.length) {
        var paket = q.splice(0, 10);
        if (paket.length === 1) { (function (j) { API.panggil(j.a, j.p, { diam: j.diam }).then(j.ok, j.gagal); })(paket[0]); continue; }
        (function (paket) {
          API.panggil('batch', { calls: paket.map(function (j) { return { action: j.a, payload: j.p }; }) }, { diam: paket.every(function (j) { return j.diam; }) }).then(function (hasil) {
            paket.forEach(function (j, i) { var r = hasil[i] || {}; if (r.tokenBaru) { API.token = r.tokenBaru; Sesi.simpanToken(r.tokenBaru); } if (r.ok) j.ok(r.data); else { if (r.error && r.error.code === 'AUTH_REQUIRED') Sesi.berakhir(r.error.message); j.gagal(new ApiError((r.error || {}).code, (r.error || {}).message, (r.error || {}).fields)); } });
          }, function (er) { paket.forEach(function (j) { j.gagal(er); }); });
        })(paket);
      }
    },
    setelahTulis: function () { this.epoch++; var c = this.c; Object.keys(c).forEach(function (k) { c[k].basi = true; c[k].tulis = true; }); Shell.segarkanLencana(); },
    hapusSemua: function () { this.c = {}; this.inflight = {}; this.epoch++; try { Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('cc_swr_') === 0) sessionStorage.removeItem(k); }); } catch (e) { } },
    prefetch: function (daftar) { var self = this; var f = function () { daftar.forEach(function (x) { var k = self.kunci(x[0], x[1]); if (!self.c[k]) self._ambilJaringan(x[0], x[1] || {}, k, true); }); }; if (W.requestIdleCallback) requestIdleCallback(f, { timeout: 2500 }); else setTimeout(f, 900); }
  };
  function Q(a, p, o) { return Data.ambil(a, p, o); }
  function T(a, p, o) { return API.panggil(a, p, o); }   // aksi tulis

  /* ===================== SESI ===================== */
  var Sesi = {
    uid: '', me: null, boot: null,
    muat: function () { try { var s = JSON.parse(localStorage.getItem('cc_sesi') || 'null'); if (s && s.mode === API.mode && s.token) { API.token = s.token; this.uid = s.uid; return true; } } catch (e) { } return false; },
    simpanToken: function (t) { try { var s = JSON.parse(localStorage.getItem('cc_sesi') || '{}'); s.token = t; s.mode = API.mode; localStorage.setItem('cc_sesi', JSON.stringify(s)); } catch (e) { } },
    simpan: function (token, me) { API.token = token; if (this.uid !== me.id) Object.keys(HST).forEach(function (k) { delete HST[k]; }); this.uid = me.id; try { localStorage.setItem('cc_sesi', JSON.stringify({ token: token, uid: me.id, mode: API.mode, nama: me.nama })); } catch (e) { } },
    hapus: function () { API.token = ''; this.uid = ''; this.me = null; this.boot = null; try { localStorage.removeItem('cc_sesi'); } catch (e) { } Data.hapusSemua(); },
    berakhir: function (pesan) { if (!this.me) return; this.hapus(); UI.tutupSemua(); Router.ke('masuk'); setTimeout(function () { UI.toast(pesan || 'Sesi berakhir. Silakan masuk kembali.', 'warn'); }, 200); },
    keluar: function () { var self = this; UI.konfirmasi({ judul: 'Keluar dari aplikasi?', pesan: 'Sesi di perangkat ini akan diakhiri. Data yang belum disimpan akan hilang.', ok: 'Keluar', ikon: 'log-out' }).then(function (v) { if (!v) return; self.hapus(); Shell.hancurkan(); Router.ke('masuk'); UI.toast('Anda telah keluar.', 'ok'); }); },
    masuk: function (username, pin, o) {
      var self = this;
      return T('auth.login', { username: username, pin: pin }, { instan: o && o.instan }).then(function (d) {
        self.simpan(d.token, d.me); Data.hapusSemua(); return self.muatBoot({ instan: o && o.instan });
      });
    },
    muatBoot: function (o) {
      var self = this;
      return API.panggil('auth.boot', {}, { instan: o && o.instan }).then(function (b) { self.boot = b; self.me = b.me; self.uid = b.me.id; Tema.terapkan(b.branding); Data.pulihkanSesi(); return b; });
    }
  };

  /* ===================== TEMA / BRANDING ===================== */
  function hexRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return isNaN(n) ? [0, 194, 255] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function campur(h, putih) { var c = hexRgb(h); return 'rgb(' + c.map(function (v) { return Math.round(v + (255 - v) * putih); }).join(',') + ')'; }
  var Tema = {
    font: {},
    terapkan: function (b) {
      if (!b) return; var r = D.documentElement.style, w = b.warna || {};
      if (w.merek) { var c = hexRgb(w.merek); r.setProperty('--merek', w.merek); r.setProperty('--merek-lembut', campur(w.merek, .9)); r.setProperty('--merek-glow', '0 0 15px rgba(' + c.join(',') + ',.35)'); r.setProperty('--cincin', '0 0 0 3px rgba(' + c.join(',') + ',.28)'); }
      if (w.gelap) { r.setProperty('--gelap', w.gelap); r.setProperty('--gelap-2', campur(w.gelap, .06)); r.setProperty('--gelap-3', campur(w.gelap, .12)); var m = D.querySelector('meta[name=theme-color]'); if (m) m.content = w.gelap; }
      if (w.aksen) { r.setProperty('--merek-tua', w.aksen); r.setProperty('--s1', w.aksen); }
      if (w.latar) r.setProperty('--latar', w.latar); if (w.kartu) r.setProperty('--kartu', w.kartu);
      if (b.font_judul) { this.muatFont(b.font_judul); r.setProperty('--f-judul', "'" + b.font_judul + "', system-ui, sans-serif"); }
      if (b.font_isi) { this.muatFont(b.font_isi); r.setProperty('--f-isi', "'" + b.font_isi + "', system-ui, sans-serif"); }
      if (b.ukuran_dasar) r.setProperty('--fs', Math.min(16, Math.max(13, Number(b.ukuran_dasar))) + 'px');
      var de = D.documentElement; de.dataset.radius = b.radius || 'besar'; de.dataset.kepadatan = b.kepadatan || 'nyaman'; de.dataset.animasi = b.animasi || 'normal';
      if (b.nama_aplikasi) D.title = b.nama_brand ? b.nama_brand + ' — ' + b.nama_aplikasi.replace(/^Capten Care\s*/, '') : b.nama_aplikasi;
    },
    muatFont: function (nama) { if (!nama || /^(Plus Jakarta Sans|Inter|system-ui)$/.test(nama) || this.font[nama]) return; this.font[nama] = 1; var l = D.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(nama).replace(/%20/g, '+') + ':wght@400;500;600;700&display=swap'; D.head.appendChild(l); }
  };

  /* ===================== KOMPONEN UI ===================== */
  var tumpukan = [];
  var UI = {
    ic: ic,
    toast: function (pesan, jenis, o) {
      o = o || {}; var w = qs('#toast'); if (!w) return; jenis = jenis || 'info';
      var ik = { ok: 'circle-check', bahaya: 'circle-x', warn: 'triangle-alert', info: 'info' }[jenis] || 'info', dur = o.durasi || (jenis === 'bahaya' ? 6000 : 3600);
      var el = D.createElement('div'); el.className = 'toast ' + jenis; el.setAttribute('role', jenis === 'bahaya' ? 'alert' : 'status');
      el.innerHTML = ic(ik) + '<div class="tumbuh">' + (o.judul ? '<b>' + U.e(o.judul) + '</b>' : '') + U.e(pesan) + '</div>' + (o.aksi ? '<button type="button">' + U.e(o.aksi.label) + '</button>' : '') + '<i class="waktu" style="animation-duration:' + dur + 'ms"></i>';
      if (o.aksi) el.querySelector('button').onclick = function () { o.aksi.fn(); hilang(); };
      w.appendChild(el); while (w.children.length > (W.innerWidth < 860 ? 2 : 4)) w.firstChild.remove();
      function hilang() { el.classList.add('keluar'); setTimeout(function () { el.remove(); }, 240); }
      var t = setTimeout(hilang, dur); el.onmouseenter = function () { clearTimeout(t); el.querySelector('.waktu').style.animationPlayState = 'paused'; }; el.onmouseleave = function () { el.querySelector('.waktu').style.animationPlayState = 'running'; t = setTimeout(hilang, 1800); };
    },
    galat: function (er, judul) { var m = er && er.message ? er.message : String(er); if (er && er.code === 'MODULE_OFF') judul = 'Fitur belum aktif'; if (er && er.code === 'FORBIDDEN') judul = 'Akses ditolak'; if (er && er.code === 'CONFLICT') judul = 'Tidak dapat diproses'; if (er && er.code === 'LOCKED') judul = 'Terkunci'; UI.toast(m, er && er.code === 'VALIDATION' ? 'warn' : 'bahaya', { judul: judul }); },
    lencana: function (s, kelas) { if (s == null || s === '') return '<span class="redup-2">—</span>'; return '<span class="lencana ' + (kelas || kelasStatus(s)) + '"><i></i>' + U.e(s) + '</span>'; },
    ava: function (nama, k) { return '<span class="ava ' + (k || '') + '" data-w="' + U.warna(nama) + '" title="' + U.e(nama) + '">' + U.e(U.inisial(nama)) + '</span>'; },
    kosong: function (judul, sub, aksi, gambar) { return '<div class="kosong">' + '<img src="assets/ilustrasi/' + (gambar || 'kosong') + '.svg" alt="" loading="lazy">' + '<b>' + U.e(judul || 'Belum ada data') + '</b>' + (sub ? '<p>' + U.e(sub) + '</p>' : '') + (aksi || '') + '</div>'; },
    kerangka: function (jenis) {
      if (jenis === 'tabel') return '<div class="kartu pad">' + [1, 2, 3, 4, 5, 6].map(function (i) { return '<div class="baris celah-12" style="padding:8px 0"><div class="kerangka" style="width:34px;height:34px;border-radius:50%"></div><div class="tumbuh"><div class="kerangka teks" style="width:' + (40 + i * 7 % 40) + '%"></div><div class="kerangka teks" style="width:' + (20 + i * 11 % 30) + '%"></div></div><div class="kerangka teks" style="width:80px"></div></div>'; }).join('') + '</div>';
      return '<div class="kepala-hal"><div style="width:100%"><div class="kerangka judul"></div><div class="kerangka teks" style="width:28%"></div></div></div><div class="grid g4 kpi-baris">' + [1, 2, 3, 4].map(function () { return '<div class="kartu kpi"><div class="kerangka teks" style="width:50%"></div><div class="kerangka" style="height:28px;width:60%;margin-top:10px"></div><div class="kerangka teks" style="width:40%;margin-top:10px"></div></div>'; }).join('') + '</div><div class="grid g-2-1 mt-16"><div class="kerangka blok" style="height:280px"></div><div class="kerangka blok" style="height:280px"></div></div>';
    },
    kepala: function (judul, sub, aksi) { return '<div class="kepala-hal masuk"><div class="judul"><h1>' + U.e(judul) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (aksi ? '<div class="aksi">' + aksi + '</div>' : '') + '</div>'; },
    btn: function (label, o) { o = o || {}; var atr = Object.keys(o.data || {}).map(function (k) { return ' data-' + k + '="' + U.e(o.data[k]) + '"'; }).join(''); return '<button type="button" class="btn ' + (o.k || '') + '"' + (o.a ? ' data-a="' + o.a + '"' : '') + atr + (o.kunci ? ' data-kunci="' + o.kunci + '"' : '') + (o.judul ? ' title="' + U.e(o.judul) + '"' : '') + (o.mati ? ' disabled' : '') + '>' + (o.i ? ic(o.i) : '') + (label ? '<span>' + U.e(label) + '</span>' : '') + (o.kunci ? '<kbd>' + o.kunci.toUpperCase() + '</kbd>' : '') + '</button>'; },
    kpi: function (o) {
      var d = '';
      if (o.delta != null && o.delta !== '') { var dn = U.n(o.delta), kls = dn > 0.05 ? 'naik' : dn < -0.05 ? 'turun' : 'datar'; if (o.deltaBalik) kls = kls === 'naik' ? 'turun' : kls === 'turun' ? 'naik' : kls; d = '<span class="delta ' + kls + '">' + (dn > 0 ? '▲ ' : dn < 0 ? '▼ ' : '') + U.angka(Math.abs(dn), 1) + '%</span>'; }
      return '<div class="kartu kpi' + (o.utama ? ' utama' : '') + (o.rute ? ' klik' : '') + '"' + (o.rute ? ' data-rute="' + o.rute + '"' : '') + '>' + (o.ikon ? '<span class="ikon-kpi">' + ic(o.ikon) + '</span>' : '') + '<div class="label-mikro">' + U.e(o.label) + '</div><div class="nilai">' + o.nilai + '</div><div class="sub">' + d + (o.sub || '') + '</div>' + (o.meter != null ? '<div class="meter mt-8 ' + (o.meterKelas || '') + '"><i style="width:' + Math.min(100, Math.max(0, o.meter)) + '%"></i></div>' : '') + (o.spark ? '<div class="spark">' + o.spark + '</div>' : '') + '</div>';
    },
    tab: function (daftar, aktif, nama) { return '<div class="tab" role="tablist"' + (nama ? ' data-tabgrup="' + nama + '"' : '') + '>' + daftar.map(function (t) { return '<button type="button" role="tab" data-tab="' + t.id + '" class="' + (t.id === aktif ? 'aktif' : '') + '" aria-selected="' + (t.id === aktif) + '">' + (t.i ? ic(t.i, 'k') : '') + U.e(t.l) + (t.n != null ? '<span class="hit">' + t.n + '</span>' : '') + '</button>'; }).join('') + '</div>'; },
    segmen: function (daftar, aktif, nama) { return '<div class="grup-btn" data-segmen="' + (nama || '') + '">' + daftar.map(function (t) { return '<button type="button" data-v="' + U.e(t.v) + '" class="' + (String(t.v) === String(aktif) ? 'aktif' : '') + '">' + U.e(t.l) + '</button>'; }).join('') + '</div>'; },
    pilih: function (nama, opsi, nilai, o) { o = o || {}; return '<select class="inp ' + (o.k || '') + '" data-f="' + nama + '"' + (o.style ? ' style="' + o.style + '"' : '') + ' aria-label="' + U.e(o.label || nama) + '">' + (o.semua ? '<option value="">' + U.e(o.semua) + '</option>' : '') + opsi.map(function (x) { var v = typeof x === 'object' ? x.v : x, l = typeof x === 'object' ? x.l : x; return '<option value="' + U.e(v) + '"' + (String(v) === String(nilai == null ? '' : nilai) ? ' selected' : '') + '>' + U.e(l) + '</option>'; }).join('') + '</select>'; },
    cari: function (nilai, ph) { return '<div class="inp-ikon tumbuh">' + ic('search') + '<input class="inp" data-f="q" type="search" placeholder="' + U.e(ph || 'Cari…') + '" value="' + U.e(nilai || '') + '" autocomplete="off"><kbd>/</kbd></div>'; },

    /* ----- overlay ----- */
    _lapis: function (jenis, o) {
      var lap = D.createElement('div'); lap.className = 'lapis';
      var el = D.createElement('div'); el.className = jenis + ' ' + (o.lebar ? 'lebar' : '') + (o.sempit ? ' sempit' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      el.innerHTML = '<div class="ov-kepala">' + (o.ikon ? '<span class="ikon-ov ' + (o.ikonKelas || '') + '">' + ic(o.ikon) + '</span>' : '') + '<div class="tumpuk"><h2>' + U.e(o.judul || '') + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.kepalaAksi || '') + '<button type="button" class="btn ikon hantu kecil" data-tutup aria-label="Tutup">' + ic('x') + '</button></div><div class="ov-isi">' + (o.isi || '') + '</div>' + (o.kaki !== false ? '<div class="ov-kaki">' + (o.kaki || '<button type="button" class="btn" data-tutup>Tutup</button>') + '</div>' : '');
      D.body.appendChild(lap); D.body.appendChild(el);
      requestAnimationFrame(function () { lap.classList.add('buka'); el.classList.add('buka'); });
      var api = { el: el, isi: el.querySelector('.ov-isi'), kaki: el.querySelector('.ov-kaki'), tertutup: false,
        tutup: function (v) { if (api.tertutup) return; api.tertutup = true; lap.classList.remove('buka'); el.classList.remove('buka'); setTimeout(function () { lap.remove(); el.remove(); }, 300); tumpukan = tumpukan.filter(function (x) { return x !== api; }); if (!tumpukan.length) D.body.style.overflow = ''; if (o.saatTutup) o.saatTutup(v); if (api._fokus && api._fokus.focus) try { api._fokus.focus(); } catch (e) { } },
        on: function (ev, sel, fn) { el.addEventListener(ev, function (e) { var t = e.target.closest(sel); if (t && el.contains(t)) fn(t, e); }); return api; } };
      api._fokus = D.activeElement;
      lap.onclick = function () { if (!o.tanpaTutupLuar) api.tutup(); };
      el.addEventListener('click', function (e) { if (e.target.closest('[data-tutup]')) api.tutup(); });
      tumpukan.push(api); D.body.style.overflow = 'hidden';
      setTimeout(function () { var f = el.querySelector('[autofocus], .ov-isi input:not([type=hidden]):not([readonly]), .ov-isi select, .ov-isi textarea'); if (f && W.innerWidth > 860) f.focus(); }, 60);
      return api;
    },
    modal: function (o) { return UI._lapis('modal', o); },
    laci: function (o) { return UI._lapis('laci', o); },
    tutupAtas: function () { var a = tumpukan[tumpukan.length - 1]; if (a) { a.tutup(); return true; } return false; },
    tutupSemua: function () { tumpukan.slice().forEach(function (a) { a.tutup(); }); },
    konfirmasi: function (o) {
      return new Promise(function (ok) {
        var alasan = o.alasan ? '<div class="fld mt-12" data-k="alasan"><label>' + U.e(typeof o.alasan === 'string' ? o.alasan : 'Alasan') + ' <span class="wajib">*</span></label><textarea class="inp" name="alasan" rows="3" placeholder="' + U.e(o.phAlasan || 'Tulis alasan singkat (wajib, tercatat di log)') + '"></textarea><span class="galat">Alasan wajib diisi (min. 5 karakter).</span></div>' : '';
        var m = UI.modal({ judul: o.judul, ikon: o.ikon || (o.bahaya ? 'triangle-alert' : 'circle-help'), ikonKelas: o.bahaya ? 'bahaya' : (o.ikonKelas || ''), sempit: !o.isi, isi: '<p class="redup" style="font-size:13.5px">' + (o.pesanHtml || U.e(o.pesan || '')) + '</p>' + (o.isi || '') + alasan,
          kaki: '<button type="button" class="btn" data-tutup>' + U.e(o.batal || 'Batal') + '</button><button type="button" class="btn ' + (o.bahaya ? 'bahaya isi-p' : 'primer') + '" data-ok>' + U.e(o.ok || 'Lanjutkan') + '</button>', saatTutup: function (v) { ok(v || false); } });
        m.el.querySelector('[data-ok]').onclick = function () {
          var hasil = { ok: true };
          if (o.alasan) { var t = m.el.querySelector('[name=alasan]'), v = t.value.trim(); if (v.length < 5) { t.closest('.fld').classList.add('salah'); t.focus(); return; } hasil.alasan = v; }
          if (o.baca) { Object.assign(hasil, UI.bacaForm(m.isi)); qsa('[data-f]', m.isi).forEach(function (x) { hasil[x.dataset.f] = x.value; }); }
          m.tutup(hasil);
        };
      });
    },
    pop: function (anchor, item) {
      UI.tutupPop(); var r = anchor.getBoundingClientRect(), el = D.createElement('div'); el.className = 'pop';
      el.innerHTML = item.map(function (x, i) { if (x === '-') return '<hr>'; return '<button type="button" class="pop-item ' + (x.bahaya ? 'bahaya' : '') + '" data-i="' + i + '">' + (x.i ? ic(x.i) : '') + U.e(x.l) + '</button>'; }).join('');
      D.body.appendChild(el); var w = el.offsetWidth, h = el.offsetHeight, x = Math.min(r.right - w, W.innerWidth - w - 8), y = r.bottom + 6; if (y + h > W.innerHeight - 8) y = Math.max(8, r.top - h - 6); el.style.left = Math.max(8, x) + 'px'; el.style.top = y + 'px';
      el.onclick = function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var it = item[+b.dataset.i]; UI.tutupPop(); it.fn && it.fn(); };
      UI._pop = el; setTimeout(function () { D.addEventListener('click', UI._popLuar = function (e) { if (!el.contains(e.target)) UI.tutupPop(); }); }, 0);
      return el;
    },
    tutupPop: function () { if (UI._pop) { UI._pop.remove(); UI._pop = null; D.removeEventListener('click', UI._popLuar); } },
    /* Proses panjang: lapisan dengan EKG + daftar langkah */
    proses: function (judul, langkah) {
      var el = D.createElement('div'); el.className = 'proses-lapis';
      el.innerHTML = '<div class="proses-kartu">' + htmlPemuat(judul, 'Mohon tunggu, jangan tutup halaman ini') + (langkah ? '<ul class="langkah-proses mt-16">' + langkah.map(function (l) { return '<li><i></i>' + U.e(l) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      D.body.appendChild(el); var li = qsa('li', el), api = {
        langkah: function (i) { li.forEach(function (x, j) { x.className = j < i ? 'selesai' : j === i ? 'jalan' : ''; }); },
        selesai: function () { li.forEach(function (x) { x.className = 'selesai'; }); setTimeout(function () { el.style.transition = 'opacity .25s'; el.style.opacity = 0; setTimeout(function () { el.remove(); }, 250); }, 260); },
        gagal: function () { el.remove(); }
      };
      api.langkah(0); return api;
    },
    /* Jalankan aksi tulis dengan tombol berputar + toast + galat terpetakan ke field */
    kerja: function (tombol, fn, o) {
      o = o || {}; if (tombol && tombol.classList.contains('memuat')) return Promise.resolve();
      if (tombol) tombol.classList.add('memuat');
      return Promise.resolve().then(fn).then(function (r) { if (tombol) tombol.classList.remove('memuat'); return r; }, function (er) { if (tombol) tombol.classList.remove('memuat'); if (o.form && er.fields) UI.tandaiGalat(o.form, er.fields); UI.galat(er); throw er; });
    },

    /* ----- form builder ----- */
    form: function (fields, data) {
      data = data || {};
      return '<div class="form">' + fields.map(function (f) {
        if (f.html) return '<div class="fld ' + (f.lebar || '') + '">' + f.html + '</div>';
        if (f.judul) return '<div class="fld"><div class="label-mikro" style="margin-top:6px">' + U.e(f.judul) + '</div></div>';
        var v = data[f.k] != null ? data[f.k] : (f.bawaan != null ? f.bawaan : ''), id = 'f_' + f.k + '_' + Math.random().toString(36).slice(2, 6), inp, atr = (f.wajib ? ' required' : '') + (f.ro ? ' readonly' : '') + (f.ph ? ' placeholder="' + U.e(f.ph) + '"' : '') + (f.maks ? ' maxlength="' + f.maks + '"' : '');
        var t = f.t || 'teks';
        if (t === 'area') inp = '<textarea class="inp" id="' + id + '" name="' + f.k + '" rows="' + (f.baris || 3) + '"' + atr + '>' + U.e(v) + '</textarea>';
        else if (t === 'pilih') inp = '<select class="inp" id="' + id + '" name="' + f.k + '"' + atr + (f.ro ? ' disabled' : '') + '>' + (f.kosong !== false ? '<option value="">' + U.e(f.kosong || '— Pilih —') + '</option>' : '') + (f.opsi || []).map(function (x) { var ov = typeof x === 'object' ? x.v : x, ol = typeof x === 'object' ? x.l : x; return '<option value="' + U.e(ov) + '"' + (String(ov) === String(v) ? ' selected' : '') + '>' + U.e(ol) + '</option>'; }).join('') + '</select>';
        else if (t === 'radio' || t === 'kartu') inp = '<div class="' + (t === 'kartu' ? 'pilihan-kartu' : 'baris bungkus celah-16') + '">' + (f.opsi || []).map(function (x) { var ov = typeof x === 'object' ? x.v : x, ol = typeof x === 'object' ? x.l : x; return '<label class="cek"><input type="radio" name="' + f.k + '" value="' + U.e(ov) + '"' + (String(ov) === String(v) ? ' checked' : '') + '>' + U.e(ol) + '</label>'; }).join('') + '</div>';
        else if (t === 'cek') inp = '<label class="cek"><input type="checkbox" name="' + f.k + '" id="' + id + '"' + (v === true || v === 'YA' || v === 1 ? ' checked' : '') + '>' + U.e(f.teks || f.l) + '</label>';
        else if (t === 'saklar') inp = '<label class="saklar"><input type="checkbox" name="' + f.k + '" id="' + id + '"' + (v === true || v === 'YA' ? ' checked' : '') + '>' + U.e(f.teks || '') + '</label>';
        else if (t === 'rupiah') inp = '<div class="inp-awal"><span>Rp</span><input class="inp angka" inputmode="numeric" data-rupiah id="' + id + '" name="' + f.k + '" value="' + (v === '' ? '' : U.angka(v)) + '"' + atr + '></div>';
        else if (t === 'berkas') inp = '<label class="unggah" for="' + id + '">' + ic('upload') + '<span data-nama>' + U.e(f.ph || 'Pilih berkas (JPG/PNG/PDF, maks. 4 MB)') + '</span><input type="file" id="' + id + '" name="' + f.k + '" accept="' + (f.terima || 'image/*,application/pdf') + '" hidden' + (f.kamera ? ' capture="environment"' : '') + '></label>';
        else { var tp = { angka: 'number', tanggal: 'date', bulan: 'month', jam: 'time', email: 'email', hp: 'tel', sandi: 'password', warna: 'color' }[t] || 'text'; inp = '<input class="inp' + (t === 'angka' ? ' angka' : '') + '" type="' + tp + '" id="' + id + '" name="' + f.k + '" value="' + U.e(v) + '"' + atr + (t === 'hp' ? ' inputmode="tel" pattern="0[0-9]{8,13}"' : '') + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + (t === 'sandi' ? ' autocomplete="new-password"' : '') + '>'; }
        return '<div class="fld ' + (f.lebar || '') + '" data-k="' + f.k + '">' + (t !== 'cek' ? '<label for="' + id + '">' + U.e(f.l) + (f.wajib ? ' <span class="wajib">*</span>' : '') + '</label>' : '') + inp + (f.bantu ? '<span class="bantu">' + f.bantu + '</span>' : '') + '<span class="galat"></span></div>';
      }).join('') + '</div>';
    },
    bacaForm: function (el) {
      var o = {};
      qsa('input[name], select[name], textarea[name]', el).forEach(function (i) {
        if (i.type === 'file') return; if (i.type === 'radio') { if (i.checked) o[i.name] = i.value; else if (!(i.name in o)) o[i.name] = ''; return; }
        if (i.type === 'checkbox') { o[i.name] = i.checked; return; }
        o[i.name] = i.hasAttribute('data-rupiah') ? (i.value.trim() === '' ? '' : U.n(i.value)) : i.type === 'number' ? (i.value === '' ? '' : Number(i.value)) : i.value.trim();
      });
      return o;
    },
    bacaBerkas: function (el, maks) { var hasil = {}, jobs = qsa('input[type=file][name]', el).map(function (i) { var f = i.files && i.files[0]; if (!f) return Promise.resolve(); return U.fileKeData(f, maks).then(function (d) { return /^data:image/.test(d) ? U.kecilkanGambar(d, 1400) : d; }).then(function (d) { hasil[i.name] = d; hasil[i.name + '_nama'] = f.name; }); }); return Promise.all(jobs).then(function () { return hasil; }); },
    tandaiGalat: function (el, fields) { qsa('.fld.salah', el).forEach(function (f) { f.classList.remove('salah'); }); var pertama = null; Object.keys(fields || {}).forEach(function (k) { var f = el.querySelector('.fld[data-k="' + k + '"]'); if (!f) return; f.classList.add('salah'); var g = f.querySelector('.galat'); if (g) g.textContent = fields[k]; if (!pertama) pertama = f; }); if (pertama) { var i = pertama.querySelector('input,select,textarea'); if (i) i.focus(); pertama.scrollIntoView({ block: 'center', behavior: 'smooth' }); } },
    cekWajib: function (el, fields) { var g = {}; fields.forEach(function (f) { if (!f.wajib) return; var i = el.querySelector('[name="' + f.k + '"]'); if (!i) return; var v = i.type === 'checkbox' ? i.checked : i.type === 'radio' ? el.querySelector('[name="' + f.k + '"]:checked') : i.type === 'file' ? i.files.length : String(i.value).trim(); if (!v) g[f.k] = (f.l || f.k) + ' wajib diisi.'; }); if (Object.keys(g).length) { UI.tandaiGalat(el, g); return false; } return true; },
    pasangForm: function (el) {
      el.addEventListener('input', function (e) { var i = e.target; if (i.hasAttribute && i.hasAttribute('data-rupiah')) { var p = i.selectionStart, pjg = i.value.length, n = i.value.replace(/[^0-9]/g, ''); i.value = n ? Number(n).toLocaleString('id-ID') : ''; try { i.setSelectionRange(p + i.value.length - pjg, p + i.value.length - pjg); } catch (x) { } } var f = i.closest && i.closest('.fld.salah'); if (f) f.classList.remove('salah'); });
      el.addEventListener('change', function (e) { var i = e.target; if (i.type === 'file') { var l = i.closest('.unggah'), n = l && l.querySelector('[data-nama]'); if (n && i.files[0]) { n.textContent = i.files[0].name + ' · ' + Math.round(i.files[0].size / 1024) + ' KB'; if (/^image/.test(i.files[0].type)) { var r = new FileReader(); r.onload = function () { var im = l.querySelector('img.pratinjau') || D.createElement('img'); im.className = 'pratinjau'; im.src = r.result; l.insertBefore(im, n); }; r.readAsDataURL(i.files[0]); } } } });
    },
    /* Modal form serbaguna */
    formModal: function (o) {
      var m = UI.modal({ judul: o.judul, sub: o.sub, ikon: o.ikon || 'square-pen', lebar: o.lebar, isi: (o.atas || '') + '<form novalidate data-formmodal>' + UI.form(o.fields, o.data) + '</form>' + (o.bawah || ''),
        kaki: (o.kakiKiri ? '<div class="kiri">' + o.kakiKiri + '</div>' : '') + '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-simpan>' + ic(o.ikonSimpan || 'check') + '<span>' + U.e(o.simpanLabel || 'Simpan') + '</span></button>' });
      var form = m.el.querySelector('form'); UI.pasangForm(form); form.addEventListener('submit', function (e) { e.preventDefault(); });
      if (o.saatBuka) o.saatBuka(m, form);
      m.el.querySelector('[data-simpan]').onclick = function () {
        var b = this; if (!UI.cekWajib(form, o.fields)) return;
        var v = UI.bacaForm(form);
        UI.kerja(b, function () { return UI.bacaBerkas(form).then(function (bk) { Object.assign(v, bk); return o.simpan(v, m, form); }); }, { form: form }).then(function (r) { if (r === false) return; m.tutup(true); if (o.pesan !== false) UI.toast(typeof o.pesan === 'string' ? o.pesan : API.pesan || 'Tersimpan.', 'ok'); if (o.selesai) o.selesai(r); }).catch(function () { });
      };
      return m;
    },
    /* Daftar interaktif (v2: master-detail). Bawaan tampil sebagai KARTU RINGKAS — klik membuka laci
       (slide-over) dari kanan. Tetap bisa ditukar ke TABEL (pilihan diingat per menu). Urut, cari,
       halaman, pilih baris, ekspor CSV tetap sama di kedua tampilan. */
    tabel: function (wadah, o) {
      var rute = (location.hash.match(/^#\/?([^?\/]+)/) || [])[1] || 'x', kunciTampil = 'cc_tampil_' + rute;
      var awal = (function () { try { return localStorage.getItem(kunciTampil); } catch (x) { return null; } })();
      var st = { urut: o.urut || null, arah: o.arah || 1, hal: 0, per: o.per || 25, q: '', pilih: {}, tampil: awal || o.tampil || 'kartu' };
      var kartuWadah = wadah.closest('.kartu');
      function data() {
        var rows = o.rows.filter(function (r) { return U.cocok(r, st.q, o.cariKunci); });
        if (st.urut) { var k = o.kolom.filter(function (c) { return c.k === st.urut; })[0], nil = k && k.nilai ? k.nilai : function (r) { return r[st.urut]; }; rows = rows.slice().sort(function (a, b) { var x = nil(a), y = nil(b); if (typeof x === 'number' || typeof y === 'number') return ((U.n(x)) - (U.n(y))) * st.arah; return String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'id') * st.arah; }); }
        return rows;
      }
      function nilaiSel(c, r, i) { return c.f ? c.f(r, i) : U.e(r[c.k] == null || r[c.k] === '' ? '—' : r[c.k]); }
      function aksiKol(c) { return /aksi-sel/.test(c.kelas || ''); }
      function alat(total) {
        var urutOpsi = o.kolom.filter(function (c) { return c.k && c.urut !== false && !aksiKol(c) && c.l; });
        return '<div class="md-alat"><span>' + U.angka(total) + ' item' + (st.q ? ' · cocok "' + U.e(st.q) + '"' : '') + '</span><div class="baris">' +
          (st.tampil === 'kartu' && urutOpsi.length > 1 ? UI.pilih('urut-md', [{ v: '', l: 'Urutan bawaan' }].concat(urutOpsi.map(function (c) { return { v: c.k, l: 'Urut: ' + c.l }; })), st.urut || '', { k: 'kecil', style: 'width:auto;height:30px', label: 'Urutkan' }) + (st.urut ? '<button type="button" class="btn ikon mini hantu" data-arah aria-label="Balik urutan" title="Balik urutan">' + ic(st.arah > 0 ? 'arrow-up' : 'arrow-down', 'k') + '</button>' : '') : '') +
          '<div class="grup-btn" role="group" aria-label="Tampilan"><button type="button" data-tampil="kartu" class="' + (st.tampil === 'kartu' ? 'aktif' : '') + '" title="Kartu ringkas">' + ic('layout-list') + 'Kartu</button><button type="button" data-tampil="tabel" class="' + (st.tampil === 'tabel' ? 'aktif' : '') + '" title="Tabel">' + ic('table') + 'Tabel</button></div></div></div>';
      }
      function navHal(total, maksHal) {
        return (total > st.per || o.selaluNav) ? '<div class="halaman-nav"' + (st.tampil === 'kartu' ? ' style="border:0;padding:12px 2px 0"' : '') + '><span>' + (st.hal * st.per + 1) + '–' + Math.min(total, st.hal * st.per + st.per) + ' dari ' + U.angka(total) + '</span><div class="baris">' + UI.pilih('per', [10, 25, 50, 100].map(function (n) { return { v: n, l: n + ' / hal' }; }), st.per, { k: 'kecil', style: 'width:auto' }) + '<button type="button" class="btn ikon kecil" data-hal="-1"' + (st.hal ? '' : ' disabled') + ' aria-label="Sebelumnya">' + ic('chevron-left') + '</button><button type="button" class="btn ikon kecil" data-hal="1"' + (st.hal < maksHal ? '' : ' disabled') + ' aria-label="Berikutnya">' + ic('chevron-right') + '</button></div></div>' : '';
      }
      function gambar() {
        var rows = data(), total = rows.length, maksHal = Math.max(0, Math.ceil(total / st.per) - 1); if (st.hal > maksHal) st.hal = maksHal;
        var hal = rows.slice(st.hal * st.per, st.hal * st.per + st.per), kartu = st.tampil === 'kartu';
        if (kartuWadah) kartuWadah.classList.toggle('md-wadah', kartu && total > 0);
        if (!total) { wadah.innerHTML = o.kosong || UI.kosong(st.q ? 'Tidak ada hasil untuk "' + st.q + '"' : 'Belum ada data', st.q ? 'Coba kata kunci lain.' : ''); return; }
        var h = alat(total), bisaKlik = true;
        if (kartu) {
          var utama = o.kolom[0], meta = o.kolom.slice(1).filter(function (c) { return !aksiKol(c); }), aksi = o.kolom.filter(aksiKol);
          h += '<div class="md-daftar">' + hal.map(function (r, i) {
            var id = r[o.idKunci || 'id'], ak = aksi.map(function (c) { return nilaiSel(c, r, i); }).join('');
            return '<div class="md-item' + (bisaKlik ? ' klik' : '') + (o.pilih ? ' ada-cek' : '') + (st.pilih[id] ? ' dipilih' : '') + '" data-baris="' + U.e(id) + '" tabindex="0" role="button" aria-label="Buka detail">' +
              (o.pilih ? '<label class="cek md-cek"><input type="checkbox" data-pilih="' + U.e(id) + '"' + (st.pilih[id] ? ' checked' : '') + ' aria-label="Pilih"></label>' : '') +
              '<div class="md-utama">' + nilaiSel(utama, r, i) + '</div>' +
              '<div class="md-meta">' + meta.map(function (c) { return '<div class="md-f' + (/kanan/.test(c.kelas || '') ? ' angka' : '') + '"><span class="md-l">' + U.e(c.l || '') + '</span><div class="md-v">' + nilaiSel(c, r, i) + '</div></div>'; }).join('') + '</div>' +
              '<div class="md-aksi">' + ak + '</div><span class="md-panah">' + ic('chevron-right', 'k') + '</span></div>';
          }).join('') + '</div>';
          if (o.kaki) h += '<div class="md-kaki tabel-wadah"><table class="tabel"><tfoot>' + o.kaki(rows) + '</tfoot></table></div>';
          h += navHal(total, maksHal);
        } else {
          h += '<div class="tabel-wadah"><table class="tabel responsif"><thead><tr>' + (o.pilih ? '<th style="width:36px"><label class="cek"><input type="checkbox" data-pilih-semua></label></th>' : '') + o.kolom.map(function (c) { return '<th class="' + (c.kelas || '') + (c.urut !== false && c.k ? ' urut' : '') + '" data-urut="' + (c.urut !== false && c.k ? c.k : '') + '"' + (c.lebar ? ' style="width:' + c.lebar + '"' : '') + '>' + U.e(c.l) + (st.urut === c.k ? '<span class="panah">' + (st.arah > 0 ? '↑' : '↓') + '</span>' : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
          h += hal.map(function (r, i) { var id = r[o.idKunci || 'id']; return '<tr class="klik' + (st.pilih[id] ? ' dipilih' : '') + '" data-baris="' + U.e(id) + '">' + (o.pilih ? '<td data-l="Pilih"><label class="cek"><input type="checkbox" data-pilih="' + U.e(id) + '"' + (st.pilih[id] ? ' checked' : '') + '></label></td>' : '') + o.kolom.map(function (c, ci) { return '<td class="' + (c.kelas || '') + (ci === 0 && o.utamaM !== false ? ' utama-m' : '') + '" data-l="' + U.e(c.l) + '">' + nilaiSel(c, r, i) + '</td>'; }).join('') + '</tr>'; }).join('');
          h += '</tbody>' + (o.kaki ? '<tfoot>' + o.kaki(rows) + '</tfoot>' : '') + '</table></div>' + navHal(total, maksHal);
        }
        wadah.innerHTML = h;
        if (o.setelah) o.setelah(wadah, rows);
      }
      function buka(id, el) { var r = o.rows.filter(function (x) { return String(x[o.idKunci || 'id']) === id; })[0]; if (!r) return; if (o.klik) o.klik(r, el); else UI.detailBaris(o, r); }
      wadah.addEventListener('click', function (e) {
        var tb = e.target.closest('[data-tampil]'); if (tb) { st.tampil = tb.dataset.tampil; try { localStorage.setItem(kunciTampil, st.tampil); } catch (x) { } gambar(); return; }
        if (e.target.closest('[data-arah]')) { st.arah = -st.arah; gambar(); return; }
        var th = e.target.closest('th[data-urut]'); if (th && th.dataset.urut) { st.arah = st.urut === th.dataset.urut ? -st.arah : 1; st.urut = th.dataset.urut; gambar(); return; }
        var hb = e.target.closest('[data-hal]'); if (hb) { st.hal += +hb.dataset.hal; gambar(); wadah.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
        if (e.target.closest('label.cek, [data-a], a, button, input, select, tfoot')) return;
        var tr = e.target.closest('[data-baris]'); if (tr) buka(tr.dataset.baris, tr);
      });
      wadah.addEventListener('keydown', function (e) { if (e.key !== 'Enter' && e.key !== ' ') return; var it = e.target.closest && e.target.closest('.md-item[data-baris]'); if (!it || e.target !== it) return; e.preventDefault(); buka(it.dataset.baris, it); });
      wadah.addEventListener('change', function (e) {
        if (e.target.matches('[data-f=per]')) { st.per = +e.target.value; st.hal = 0; gambar(); return; }
        if (e.target.matches('[data-f=urut-md]')) { st.urut = e.target.value || null; st.arah = 1; gambar(); return; }
        if (e.target.matches('[data-pilih]')) { var id = e.target.dataset.pilih; if (e.target.checked) st.pilih[id] = 1; else delete st.pilih[id]; var bar = e.target.closest('[data-baris]'); if (bar) bar.classList.toggle('dipilih', e.target.checked); if (o.saatPilih) o.saatPilih(Object.keys(st.pilih)); }
        if (e.target.matches('[data-pilih-semua]')) { var on = e.target.checked; data().slice(st.hal * st.per, st.hal * st.per + st.per).forEach(function (r) { var id = r[o.idKunci || 'id']; if (on) st.pilih[id] = 1; else delete st.pilih[id]; }); gambar(); if (o.saatPilih) o.saatPilih(Object.keys(st.pilih)); }
      });
      gambar();
      return { cari: function (q) { st.q = q; st.hal = 0; gambar(); }, ganti: function (rows) { o.rows = rows; gambar(); }, dipilih: function () { return Object.keys(st.pilih); }, kosongkanPilihan: function () { st.pilih = {}; gambar(); }, data: data,
        pilihSemua: function () { data().forEach(function (r) { st.pilih[r[o.idKunci || 'id']] = 1; }); gambar(); if (o.saatPilih) o.saatPilih(Object.keys(st.pilih)); },
        csv: function (nama) { U.unduh(nama + '.csv', U.csv(data(), o.kolom.filter(function (c) { return c.k; }).map(function (c) { return { k: c.k, l: c.l, csv: c.csv }; })), 'text/csv;charset=utf-8'); } };
    },
    /* Laci detail umum untuk daftar yang belum punya halaman detail sendiri */
    detailBaris: function (o, r) {
      var kol = o.kolom.filter(function (c) { return !/aksi-sel/.test(c.kelas || ''); }), utama = kol[0];
      var judulHtml = utama ? (utama.f ? utama.f(r, 0) : U.e(r[utama.k])) : '', tmp = D.createElement('div'); tmp.innerHTML = judulHtml;
      var judul = (tmp.querySelector('b, .utama-sel') || tmp).textContent.trim() || 'Detail';
      var isi = '<div class="panel-lembut">' + judulHtml + '</div><dl class="info-grid mt-16">' + kol.slice(1).map(function (c) { var v = c.f ? c.f(r, 0) : U.e(r[c.k] == null || r[c.k] === '' ? '—' : r[c.k]); return '<div><dt>' + U.e(c.l || '') + '</dt><dd>' + v + '</dd></div>'; }).join('') + '</dl>';
      UI.laci({ judul: judul, sub: r.id ? '<span class="mono">' + U.e(r.id) + '</span>' : '', ikon: o.ikonDetail || 'file-text', isi: isi });
    },
    /* Tanda tangan digital (kanvas) */
    ttd: function (kanvas) {
      var ctx = kanvas.getContext('2d'), gambar = false, ada = false, rasio = W.devicePixelRatio || 1;
      /* Ukur ulang saat kanvas tampil/berubah ukuran (mis. bagian H yang semula tersembunyi); goresan dipertahankan */
      function ukur() {
        var r = kanvas.getBoundingClientRect(); if (!r.width || !r.height) return;
        var w = Math.round(r.width * rasio), h = Math.round(r.height * rasio); if (kanvas.width === w && kanvas.height === h) return;
        var lama = ada ? kanvas.toDataURL('image/png') : null;
        kanvas.width = w; kanvas.height = h; ctx.setTransform(rasio, 0, 0, rasio, 0, 0); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0B132B';
        if (lama) { var im = new Image(); im.onload = function () { ctx.drawImage(im, 0, 0, r.width, r.height); }; im.src = lama; }
      }
      if (W.ResizeObserver) new ResizeObserver(function () { ukur(); }).observe(kanvas);
      W.addEventListener('ttd-ukur', ukur);
      setTimeout(ukur, 50);
      function pos(e) { var r = kanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      kanvas.addEventListener('pointerdown', function (e) { gambar = true; ada = true; kanvas.setPointerCapture(e.pointerId); var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
      kanvas.addEventListener('pointermove', function (e) { if (!gambar) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
      kanvas.addEventListener('pointerup', function () { gambar = false; });
      return { hapus: function () { ctx.clearRect(0, 0, kanvas.width, kanvas.height); ada = false; }, ada: function () { return ada; }, data: function () { return ada ? kanvas.toDataURL('image/png') : ''; } };
    }
  };

  /* ===================== GRAFIK SVG (ringan, dengan tooltip & tampilan tabel) ===================== */
  var SERI = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
  var Tip = {
    el: null,
    tampil: function (x, y, html) { var t = this.el || (this.el = qs('#tip')); t.innerHTML = html; t.classList.add('buka'); var w = t.offsetWidth, h = t.offsetHeight, px = x + 14, py = y - h - 12; if (px + w > W.innerWidth - 8) px = x - w - 14; if (py < 8) py = y + 16; t.style.left = px + 'px'; t.style.top = py + 'px'; },
    sembunyi: function () { if (this.el) this.el.classList.remove('buka'); }
  };
  function skalaAtas(m) { if (m <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(m))), n = m / p; var s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10; return s * p; }
  var G = {
    _baris: function (el, o) {
      var w = Math.max(280, el.clientWidth || 600), h = o.tinggi || 240, kiri = o.kiri || 48, kanan = 12, atas = 12, bawah = 26, iw = w - kiri - kanan, ih = h - atas - bawah;
      return { w: w, h: h, kiri: kiri, atas: atas, iw: iw, ih: ih, bawah: bawah };
    },
    _tabel: function (o) { var fmt = o.fmt || U.angka; return '<div class="tabel-grafik tabel-wadah"><table class="tabel"><thead><tr><th>' + U.e(o.labelX || 'Periode') + '</th>' + o.seri.map(function (s) { return '<th class="kanan">' + U.e(s.nama) + '</th>'; }).join('') + '</tr></thead><tbody>' + o.label.map(function (l, i) { return '<tr><td>' + U.e(l) + '</td>' + o.seri.map(function (s) { return '<td class="kanan angka">' + fmt(s.data[i]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; },
    legenda: function (seri, garis) { if (seri.length < 2) return ''; return '<div class="legenda">' + seri.map(function (s, i) { return '<span><i class="' + (garis ? 'gr' : '') + '" style="background:' + (s.warna || SERI[i]) + '"></i>' + U.e(s.nama) + '</span>'; }).join('') + '</div>'; },
    batang: function (el, o) {
      var fmt = o.fmt || U.angka, fmtS = o.fmtSumbu || o.fmt || U.angka, d = this._baris(el, o), n = o.label.length, ns = o.seri.length, tumpuk = !!o.tumpuk;
      var maks = 0; for (var i = 0; i < n; i++) { if (tumpuk) maks = Math.max(maks, o.seri.reduce(function (a, s) { return a + U.n(s.data[i]); }, 0)); else o.seri.forEach(function (s) { maks = Math.max(maks, U.n(s.data[i])); }); }
      var top = skalaAtas(maks * 1.08), grupW = d.iw / n, celah = 2, bw = tumpuk ? Math.min(34, grupW * .6) : Math.min(22, (grupW * .7 - celah * (ns - 1)) / ns);
      var y = function (v) { return d.atas + d.ih - (v / top) * d.ih; };
      var s = '<svg width="' + d.w + '" height="' + d.h + '" viewBox="0 0 ' + d.w + ' ' + d.h + '" role="img" aria-label="' + U.e(o.aria || 'Grafik batang') + '"><g class="kisi">';
      for (var g = 0; g <= 4; g++) { var gy = d.atas + d.ih * g / 4; s += '<line x1="' + d.kiri + '" x2="' + (d.kiri + d.iw) + '" y1="' + gy + '" y2="' + gy + '"/>'; }
      s += '</g><g class="sumbu">'; for (g = 0; g <= 4; g++) s += '<text x="' + (d.kiri - 8) + '" y="' + (d.atas + d.ih * g / 4 + 3) + '" text-anchor="end">' + U.e(fmtS(top * (4 - g) / 4)) + '</text>';
      var lompat = Math.ceil(n / Math.floor(d.iw / 54));
      o.label.forEach(function (l, i) { if (i % lompat) return; s += '<text x="' + (d.kiri + grupW * i + grupW / 2) + '" y="' + (d.h - 8) + '" text-anchor="middle">' + U.e(o.labelPendek ? o.labelPendek(l) : l) + '</text>'; });
      s += '</g><line class="dasar" x1="' + d.kiri + '" x2="' + (d.kiri + d.iw) + '" y1="' + (d.atas + d.ih) + '" y2="' + (d.atas + d.ih) + '"/><g class="batang">';
      for (i = 0; i < n; i++) {
        var x0 = d.kiri + grupW * i + (grupW - (tumpuk ? bw : bw * ns + celah * (ns - 1))) / 2, akum = 0;
        o.seri.forEach(function (sr, si) {
          var v = U.n(sr.data[i]), hh = Math.max(v > 0 ? 1 : 0, (v / top) * d.ih), xx = tumpuk ? x0 : x0 + si * (bw + celah), yy = tumpuk ? y(akum + v) : y(v), r = (!tumpuk || si === ns - 1) ? Math.min(4, bw / 2, hh) : 0;
          var path = 'M' + xx + ',' + (yy + hh) + 'V' + (yy + r) + 'Q' + xx + ',' + yy + ' ' + (xx + r) + ',' + yy + 'H' + (xx + bw - r) + 'Q' + (xx + bw) + ',' + yy + ' ' + (xx + bw) + ',' + (yy + r) + 'V' + (yy + hh) + 'Z';
          if (v > 0) s += '<path d="' + path + '" fill="' + (sr.warna || SERI[si]) + '"' + (tumpuk && si < ns - 1 ? ' stroke="#fff" stroke-width="2"' : '') + '/>';
          akum += v;
        });
        s += '<rect x="' + (d.kiri + grupW * i) + '" y="' + d.atas + '" width="' + grupW + '" height="' + d.ih + '" fill="transparent" data-i="' + i + '" tabindex="0"/>';
      }
      s += '</g></svg>';
      el.innerHTML = '<div class="grafik">' + s + '</div>' + this._tabel(o);
      this._hover(el, o, fmt);
    },
    /* Kurva halus monoton (Fritsch–Carlson): mulus tanpa melampaui nilai data (tidak "tembus" 100%) */
    _halus: function (p) {
      var n = p.length; if (!n) return ''; if (n < 3) return 'M' + p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('L');
      var dx = [], m = [], t = [], i;
      for (i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = dx[i] ? (p[i + 1][1] - p[i][1]) / dx[i] : 0; }
      t[0] = m[0]; t[n - 1] = m[n - 2];
      for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
      for (i = 0; i < n - 1; i++) { if (!m[i]) { t[i] = 0; t[i + 1] = 0; continue; } var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b; if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; } }
      var d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
      for (i = 0; i < n - 1; i++) { var h = dx[i] / 3; d += 'C' + (p[i][0] + h).toFixed(1) + ',' + (p[i][1] + t[i] * h).toFixed(1) + ' ' + (p[i + 1][0] - h).toFixed(1) + ',' + (p[i + 1][1] - t[i + 1] * h).toFixed(1) + ' ' + p[i + 1][0].toFixed(1) + ',' + p[i + 1][1].toFixed(1); }
      return d;
    },
    garis: function (el, o) {
      var fmt = o.fmt || U.angka, fmtS = o.fmtSumbu || fmt, d = this._baris(el, o), n = o.label.length, maks = 0, min = o.min != null ? o.min : 0, uid = 'gg' + Math.random().toString(36).slice(2, 8), self = this;
      o.seri.forEach(function (sr) { sr.data.forEach(function (v) { maks = Math.max(maks, U.n(v)); }); }); var top = o.maks || skalaAtas(maks * 1.08);
      var x = function (i) { return d.kiri + (n === 1 ? d.iw / 2 : d.iw * i / (n - 1)); }, y = function (v) { return d.atas + d.ih - ((U.n(v) - min) / (top - min)) * d.ih; };
      var s = '<svg width="' + d.w + '" height="' + d.h + '" viewBox="0 0 ' + d.w + ' ' + d.h + '" role="img" aria-label="' + U.e(o.aria || 'Grafik garis') + '"><defs>' + o.seri.map(function (sr, si) { var w = sr.warna || SERI[si]; return '<linearGradient id="' + uid + '-' + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + w + ';stop-opacity:.30"/><stop offset=".65" style="stop-color:' + w + ';stop-opacity:.07"/><stop offset="1" style="stop-color:' + w + ';stop-opacity:0"/></linearGradient>'; }).join('') + '</defs><g class="kisi">';
      for (var g = 0; g <= 4; g++) { var gy = d.atas + d.ih * g / 4; s += '<line x1="' + d.kiri + '" x2="' + (d.kiri + d.iw) + '" y1="' + gy + '" y2="' + gy + '"/>'; }
      s += '</g><g class="sumbu">'; for (g = 0; g <= 4; g++) s += '<text x="' + (d.kiri - 8) + '" y="' + (d.atas + d.ih * g / 4 + 3) + '" text-anchor="end">' + U.e(fmtS(min + (top - min) * (4 - g) / 4)) + '</text>';
      var lompat = Math.max(1, Math.ceil(n / Math.floor(d.iw / 58)));
      // label sumbu X: tiap `lompat` titik + titik terakhir; label sebelum yang terakhir dilewati bila terlalu dekat (tidak bertumpuk)
      o.label.forEach(function (l, i) { if (i % lompat && i !== n - 1) return; if (i !== n - 1 && i !== 0 && x(n - 1) - x(i) < 52) return; s += '<text x="' + x(i) + '" y="' + (d.h - 8) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + U.e(o.labelPendek ? o.labelPendek(l) : l) + '</text>'; });
      s += '</g><line class="dasar" x1="' + d.kiri + '" x2="' + (d.kiri + d.iw) + '" y1="' + (d.atas + d.ih) + '" y2="' + (d.atas + d.ih) + '"/>';
      if (o.acuan != null) s += '<line x1="' + d.kiri + '" x2="' + (d.kiri + d.iw) + '" y1="' + y(o.acuan) + '" y2="' + y(o.acuan) + '" stroke="#94A3B8" stroke-dasharray="4 4"/><text class="label-langsung" x="' + (d.kiri + d.iw) + '" y="' + (y(o.acuan) - 5) + '" text-anchor="end">' + U.e(o.acuanLabel || 'Target') + '</text>';
      o.seri.forEach(function (sr, si) {
        var w = sr.warna || SERI[si], pts = sr.data.map(function (v, i) { return [x(i), y(v)]; }), jalur = self._halus(pts);
        if (o.area && si === 0 && n > 1) s += '<path class="area gradien" fill="url(#' + uid + '-' + si + ')" d="' + jalur + 'L' + x(n - 1).toFixed(1) + ',' + (d.atas + d.ih) + 'L' + x(0).toFixed(1) + ',' + (d.atas + d.ih) + 'Z"/>';
        s += '<path class="garis-seri" stroke="' + w + '" d="' + jalur + '"/>';
        if (o.seri.length <= 4) { var li = n - 1; s += '<circle class="titik-akhir" cx="' + x(li) + '" cy="' + y(sr.data[li]) + '" r="4.5" fill="' + w + '" stroke="#fff" stroke-width="2"/>'; }
      });
      s += '<line class="silang" data-silang x1="0" x2="0" y1="' + d.atas + '" y2="' + (d.atas + d.ih) + '" style="display:none"/>';
      for (var i = 0; i < n; i++) { var lx = n === 1 ? d.kiri : x(i) - d.iw / (n - 1) / 2; s += '<rect x="' + Math.max(d.kiri, lx) + '" y="' + d.atas + '" width="' + (n === 1 ? d.iw : d.iw / (n - 1)) + '" height="' + d.ih + '" fill="transparent" data-i="' + i + '" data-x="' + x(i) + '" tabindex="0"/>'; }
      s += '</svg>';
      var pertama = !el.dataset.tergambar; el.dataset.tergambar = '1';
      el.innerHTML = '<div class="grafik">' + s + '</div>' + this._tabel(o);
      if (pertama) qsa('.garis-seri', el).forEach(function (p) { try { var L = p.getTotalLength(); if (!L) return; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.transition = 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = '0'; }); }); } catch (x) { } });
      this._hover(el, o, fmt);
    },
    _hover: function (el, o, fmt) {
      var silang = el.querySelector('[data-silang]');
      function tampil(t, ev) {
        var i = +t.dataset.i, r = t.getBoundingClientRect(), html = '<div class="tj">' + U.e(o.labelTip ? o.labelTip(o.label[i]) : o.label[i]) + '</div>' + o.seri.map(function (s, si) { return '<div class="tr"><i style="background:' + (s.warna || SERI[si]) + '"></i><span>' + U.e(s.nama) + '</span><b>' + fmt(s.data[i]) + '</b></div>'; }).join('') + (o.tipEkstra ? o.tipEkstra(i) : '');
        Tip.tampil(ev && ev.clientX ? ev.clientX : r.left + r.width / 2, ev && ev.clientY ? ev.clientY : r.top + 20, html);
        if (silang && t.dataset.x) { silang.setAttribute('x1', t.dataset.x); silang.setAttribute('x2', t.dataset.x); silang.style.display = ''; }
      }
      el.addEventListener('pointermove', function (e) { var t = e.target.closest('[data-i]'); if (t) tampil(t, e); });
      el.addEventListener('focusin', function (e) { var t = e.target.closest('[data-i]'); if (t) tampil(t); });
      el.addEventListener('pointerleave', function () { Tip.sembunyi(); if (silang) silang.style.display = 'none'; });
      el.addEventListener('focusout', function () { Tip.sembunyi(); });
    },
    hbar: function (rows, o) {
      o = o || {}; var maks = Math.max.apply(null, rows.map(function (r) { return U.n(r.v); }).concat([1])), fmt = o.fmt || U.angka;
      if (!rows.length) return '<p class="redup kecil">Belum ada data.</p>';
      return '<div class="hbar">' + rows.map(function (r) { return '<div class="r" title="' + U.e(r.n + ': ' + fmt(r.v)) + '"><span class="n">' + U.e(r.n) + '</span><span class="b"><i style="width:' + (U.n(r.v) / maks * 100) + '%;background:' + (r.warna || o.warna || 'var(--s1)') + '"></i></span><span class="v">' + fmt(r.v) + (r.sub ? ' <span class="redup" style="font-weight:500">' + U.e(r.sub) + '</span>' : '') + '</span></div>'; }).join('') + '</div>';
    },
    spark: function (data, warna, o) {
      o = o || {}; if (!data || data.length < 2) return ''; var w = o.w || 160, h = o.h || 30, maks = Math.max.apply(null, data.map(U.n)), min = Math.min.apply(null, data.map(U.n)), rng = maks - min || 1;
      var pts = data.map(function (v, i) { return (i * (w - 4) / (data.length - 1) + 2).toFixed(1) + ',' + (h - 3 - (U.n(v) - min) / rng * (h - 6)).toFixed(1); });
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" width="100%" height="' + h + '" aria-hidden="true"><path d="M' + pts.join('L') + '" fill="none" stroke="' + (warna || 'var(--merek-tua)') + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
    },
    kartu: function (id, judul, sub, o) { o = o || {}; return '<div class="kartu ' + (o.kelas || '') + '" data-grafik-kartu="' + id + '"><div class="kartu-kepala"><div><h2>' + U.e(judul) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="baris">' + (o.legenda || '') + (o.tanpaTabel ? '' : '<button type="button" class="btn mini hantu" data-tabel-grafik title="Tampilkan sebagai tabel">' + ic('table', 'k') + 'Tabel</button>') + (o.aksi || '') + '</div></div><div class="kartu-isi"><div id="' + id + '" style="min-height:' + (o.tinggi || 240) + 'px"></div></div></div>'; }
  };

  /* ===================== KOMPONEN v2: PILL, KALENDER HERO, AGENDA, TIMELINE ===================== */
  UI.pil = function (o) {
    return '<a class="pil' + (o.k ? ' pil-' + o.k : '') + '"' + (o.rute ? ' href="#/' + o.rute + '"' : '') + ' title="' + U.e(o.judul || o.l) + '"><span class="pil-ik">' + ic(o.ik || 'circle-dot') + '</span><span>' + U.e(o.l) + '</span><b>' + o.n + '</b>' + (o.s ? '<span class="pil-s">' + o.s + '</span>' : '') + '</a>';
  };
  var Kal = {
    KAT: { hc: { l: 'Home Care', s: 'HC', w: 'var(--kat-hc)' }, hv: { l: 'Home Visit Medis', s: 'HV', w: 'var(--kat-hv)' }, rot: { l: 'Rotasi Perawat', s: 'Rotasi', w: 'var(--kat-rot)' }, sla: { l: 'Kasus/SLA', s: 'SLA', w: 'var(--kat-sla)' }, libur: { l: 'Libur & Cuti', s: 'Libur', w: 'var(--kat-libur)' } },
    /* Kumpulkan event per tanggal dari data yang SUDAH ADA di server (tanpa aksi API baru). */
    kumpulkan: function (src, bulan) {
      var ev = {}, tambah = function (tg, x) { if (!tg) return; tg = String(tg).slice(0, 10); if (bulan && tg.slice(0, 7) !== bulan) return; (ev[tg] = ev[tg] || []).push(x); };
      var semuaT = src.tugas || [], petaT = {}, lanjut = {};
      semuaT.forEach(function (t) { petaT[t.id] = t; if (t.penugasan_asal) lanjut[t.penugasan_asal] = t; });
      function pendek(s, n) { return String(s || '').split(/\s+/).slice(0, n || 2).join(' '); }
      semuaT.forEach(function (t) {
        if (t.status === 'Dibatalkan') return;
        var asal = t.penugasan_asal ? petaT[t.penugasan_asal] : null, ganti = asal && asal.perawat_id !== t.perawat_id, rot = ganti || t.peran === 'Infal', ak = t.tanggal_akhir_aktual || t.tanggal_akhir;
        var jenis = t.peran === 'Infal' ? 'Infal' : ganti ? 'Rotasi' : t.penugasan_asal ? 'Perpanjangan' : 'Mulai';
        tambah(t.tanggal_mulai, { kat: rot ? 'rot' : 'hc', l: jenis + ' · ' + t.nama_pasien, p: pendek(t.nama_pasien), sub: (ganti ? (asal.nama_perawat || '') + ' → ' : '') + t.nama_perawat + ' (' + t.peran + ')', r: 'penugasan?id=' + t.id, urut: 1 });
        var lj = lanjut[t.id];
        if (ak && !(lj && lj.status !== 'Dibatalkan')) tambah(ak, { kat: rot ? 'rot' : 'hc', l: (t.tanggal_akhir_aktual && t.tanggal_akhir_aktual < t.tanggal_akhir ? 'Dihentikan · ' : 'Berakhir · ') + t.nama_pasien, p: 'Akhir · ' + pendek(t.nama_pasien), sub: t.nama_perawat, r: 'penugasan?id=' + t.id, urut: 3 });
      });
      (src.hv || []).forEach(function (x) { if (x.status === 'Batal') return; tambah(x.tanggal, { kat: 'hv', jam: String(x.jadwal_jam || '').slice(0, 5), l: x.jenis_tindakan + ' · ' + x.nama_pasien, p: pendek(x.jenis_tindakan, 2), sub: (x.nama_perawat || '') + (x.status_consent === 'Disetujui' ? ' · consent OK' : x.status === 'Selesai' ? '' : ' · consent belum'), r: 'homevisit?id=' + x.id, urut: 0, status: x.status }); });
      (src.kasus || []).forEach(function (k) { if (!k.sla_tenggat || k.status === 'Selesai' || k.status === 'Dibatalkan') return; tambah(k.sla_tenggat, { kat: 'sla', jam: String(k.sla_tenggat).slice(11, 16), l: 'SLA · ' + k.judul, p: pendek(k.judul, 3), sub: (k.nama_pasien || k.jenis || '') + ' · ' + k.status, r: 'kasus?id=' + k.id, urut: 2, kritis: k.status === 'Overdue' }); });
      (src.libur || []).forEach(function (l) { if (l.status === 'Batal') return; tambah(l.tanggal, { kat: 'libur', l: l.jenis + ' · ' + (l.nama_perawat || ''), p: (l.jenis === 'Libur jatah' ? 'Libur' : l.jenis) + ' · ' + pendek(String(l.nama_perawat || '').replace(/^(Ns\.|CG\.|Bdn\.)\s*/, ''), 1), sub: (l.nama_pasien || '') + (l.nama_pengganti ? ' → ' + l.nama_pengganti : '') + (Number(l.jumlah) > 1 ? ' · ' + l.jumlah + ' hari' : ''), r: 'libur', urut: 4 }); });
      Object.keys(ev).forEach(function (k) { ev[k].sort(function (a, b) { return (a.jam || '99') < (b.jam || '99') ? -1 : (a.jam || '99') > (b.jam || '99') ? 1 : a.urut - b.urut; }); });
      return ev;
    },
    /* o: { bulan, ev, kat:[id], mati:{id:true}, pilih:iso, maks, judul, aksi } */
    html: function (o) {
      var bulan = o.bulan, mati = o.mati || {}, maks = o.maks || 3, pr = bulan.split('-'), awal = new Date(+pr[0], +pr[1] - 1, 1), mulai = new Date(awal), hariIni = U.hariIni(), hit = {};
      mulai.setDate(1 - ((awal.getDay() + 6) % 7));
      Object.keys(o.ev).forEach(function (tg) { if (tg.slice(0, 7) === bulan) o.ev[tg].forEach(function (x) { hit[x.kat] = (hit[x.kat] || 0) + 1; }); });
      var h = '<div class="kartu kalh" data-kalh><div class="kalh-kepala"><h2>' + U.e(o.judul || U.bulan(bulan)) + '</h2><div class="kalh-nav"><button type="button" class="btn ikon kecil hantu" data-kalh-nav="-1" aria-label="Bulan sebelumnya">' + ic('chevron-left') + '</button><button type="button" class="btn ikon kecil hantu" data-kalh-nav="1" aria-label="Bulan berikutnya">' + ic('chevron-right') + '</button><button type="button" class="btn mini" data-kalh-nav="0">Hari ini</button></div><span class="tumbuh"></span>' + (o.aksi || '') + '</div>';
      h += '<div class="kalh-chip-baris" role="group" aria-label="Filter kategori">' + o.kat.map(function (k) { var K = Kal.KAT[k]; return '<button type="button" class="kalh-chip' + (mati[k] ? ' mati' : '') + '" data-kalh-chip="' + k + '" style="--w:' + K.w + '" aria-pressed="' + !mati[k] + '"><i></i>' + U.e(K.l) + '<span class="hit">' + (hit[k] || 0) + '</span></button>'; }).join('') + '</div>';
      h += '<div class="kalh-grid">' + ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(function (d) { return '<div class="kalh-hd">' + d + '</div>'; }).join('');
      for (var i = 0; i < 42; i++) {
        var d = new Date(mulai); d.setDate(mulai.getDate() + i); var iso = U.iso(d), luar = iso.slice(0, 7) !== bulan;
        if (i >= 35 && luar) break;
        var list = (o.ev[iso] || []).filter(function (x) { return !mati[x.kat]; });
        h += '<div class="kalh-sel' + (luar ? ' luar' : '') + (iso === hariIni ? ' ini' : '') + (iso === o.pilih ? ' pilih' : '') + '" data-kalh-hari="' + iso + '" role="button" tabindex="0" aria-label="' + U.e(U.tglP(iso) + ' · ' + list.length + ' jadwal') + '"><span class="kalh-tg">' + d.getDate() + '</span>' +
          list.slice(0, maks).map(function (x) { return '<span class="kalh-ev" style="--w:' + Kal.KAT[x.kat].w + '" data-rute="' + U.e(x.r) + '" title="' + U.e((x.jam ? x.jam + ' · ' : '') + x.l + ' — ' + x.sub) + '"><i></i><span>' + (x.jam ? U.e(x.jam.replace(':', '.')) + ' ' : '') + U.e(x.p || x.l) + '</span></span>'; }).join('') +
          (list.length > maks ? '<span class="kalh-lagi">+' + (list.length - maks) + ' lagi</span>' : '') +
          (list.length ? '<span class="kalh-titik">' + list.slice(0, 4).map(function (x) { return '<i style="--w:' + Kal.KAT[x.kat].w + '"></i>'; }).join('') + '</span>' : '') + '</div>';
      }
      return h + '</div>' + (o.kaki ? '<div class="kalh-kaki">' + o.kaki + '</div>' : '') + '</div>';
    },
    agenda: function (list, kosong) {
      if (!list || !list.length) return '<div style="padding:22px 18px">' + (kosong || UI.kosong('Tidak ada jadwal', 'Hari ini tidak ada kunjungan, rotasi, maupun tenggat SLA.')) + '</div>';
      return '<div class="agenda">' + list.map(function (x) { return '<div class="agenda-item" style="--w:' + Kal.KAT[x.kat].w + '" data-rute="' + U.e(x.r) + '" role="button" tabindex="0"><span class="jam">' + (x.jam ? U.e(x.jam.replace(':', '.')) : '—') + '<small>' + U.e(Kal.KAT[x.kat].s) + '</small></span><span class="bar"></span><span style="min-width:0"><b>' + U.e(x.l) + '</b><span class="sub">' + U.e(x.sub) + '</span></span>' + (x.kritis ? UI.lencana('Overdue', 'bahaya') : x.status === 'Selesai' ? UI.lencana('Selesai', 'ok') : '') + '</div>'; }).join('') + '</div>';
    }
  };
  /* Timeline (Gantt) bulanan. o: { bulan, baris:[{nama, sub, ava, batang:[{mulai, akhir, w, l, judul, data:{k:v}, selesai}]}], kosong } */
  var Gantt = {
    html: function (o) {
      var pr = o.bulan.split('-'), hari = new Date(+pr[0], +pr[1], 0).getDate(), awal = o.bulan + '-01', akhirB = o.bulan + '-' + (hari < 10 ? '0' : '') + hari, hariIni = U.hariIni();
      var h = '<div class="gantt-wadah"><div class="gantt" style="--hari:' + hari + '"><div class="gantt-baris gantt-kepala"><div class="gantt-nm">' + U.e(o.kolom || 'Pasien') + '</div><div class="gantt-hari">';
      for (var i = 1; i <= hari; i++) { var tg = o.bulan + '-' + (i < 10 ? '0' : '') + i, dd = U.parse(tg); h += '<span class="' + (dd.getDay() === 0 ? 'minggu' : '') + (tg === hariIni ? ' ini' : '') + '" title="' + U.tglP(tg) + '">' + i + '</span>'; }
      h += '</div></div>';
      if (!o.baris.length) h += '<div style="padding:28px">' + (o.kosong || UI.kosong('Tidak ada penugasan pada bulan ini', '')) + '</div>';
      o.baris.forEach(function (b) {
        h += '<div class="gantt-baris"><div class="gantt-nm">' + UI.ava(b.ava || b.nama, 'k') + '<div class="tumpuk"><b>' + U.e(b.nama) + '</b><span>' + U.e(b.sub || '') + '</span></div></div><div class="gantt-jalur">';
        b.batang.forEach(function (t) {
          var m = t.mulai < awal ? awal : t.mulai, a = t.akhir > akhirB ? akhirB : t.akhir; if (a < awal || m > akhirB) return;
          var kiri = (U.selisihHari(awal, m)) / hari * 100, lebar = (U.selisihHari(m, a) + 1) / hari * 100;
          var atr = Object.keys(t.data || {}).map(function (k) { return ' data-' + k + '="' + U.e(t.data[k]) + '"'; }).join('');
          h += '<div class="gantt-batang' + (t.selesai ? ' selesai' : '') + (t.mulai < awal ? ' mulai-luar' : '') + (t.akhir > akhirB ? ' akhir-luar' : '') + '" style="--w:' + (t.w || 'var(--kat-hc)') + ';left:calc(' + kiri.toFixed(3) + '% + 2px);width:calc(' + lebar.toFixed(3) + '% - 4px)"' + atr + ' title="' + U.e(t.judul || t.l) + '" role="button" tabindex="0"><i></i><span>' + U.e(t.l) + '</span></div>';
        });
        if (hariIni >= awal && hariIni <= akhirB) h += '<span class="gantt-hariini" style="left:' + ((U.selisihHari(awal, hariIni) + .5) / hari * 100).toFixed(3) + '%"></span>';
        h += '</div></div>';
      });
      return h + '</div></div>';
    }
  };

  /* ===================== ROUTER ===================== */
  var Halaman = {}, PUBLIK = {}, HST = {};
  var Router = {
    sekarang: null, seq: 0, _ctx: null,
    daftar: function (id, def) { Halaman[id] = def; },
    publik: function (id, def) { PUBLIK[id] = def; },
    ke: function (rute, ganti) { var h = '#/' + String(rute).replace(/^#?\/?/, ''); if (ganti) history.replaceState(null, '', h); else if (location.hash !== h) { location.hash = h; return; } this.tampilkan(); },
    parse: function () { var h = decodeURI(location.hash.replace(/^#\/?/, '')), p = h.split('?'), seg = p[0].split('/').filter(Boolean), q = {}; (p[1] || '').split('&').forEach(function (x) { if (!x) return; var kv = x.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); }); return { id: seg[0] || '', arg: seg.slice(1), q: q }; },
    segarkanDiam: U.debounce(function () { if (Router._ctx && !tumpukan.length) Router.tampilkan({ diam: true }); }, 120),
    muatUlang: function () { Router.tampilkan({ diam: true, bingkai: true }); },
    tampilkan: function (o) {
      o = o || {}; var r = this.parse(), self = this;
      UI.tutupPop(); Tip.sembunyi();
      if (PUBLIK[r.id]) { Shell.hancurkan(); var wadahP = qs('#app'), tw = qs('#toast'); wadahP.innerHTML = ''; if (tw) tw.innerHTML = ''; Layar.sembunyikan(); return PUBLIK[r.id].render(wadahP, r.arg, r.q); }
      if (!Sesi.me) { if (r.id !== 'masuk') { Router._tujuan = location.hash; } Shell.hancurkan(); Layar.sembunyikan(); return Halaman.masuk.render(qs('#app'), r.arg, r.q); }
      if (!r.id || r.id === 'masuk') return this.ke('dashboard', true);
      if (Sesi.me.wajib_ganti_pin && r.id !== 'profil') return this.ke('profil?wajib=1', true);
      Shell.pasang();
      var def = Halaman[r.id], menu = (Sesi.boot.menu || []).filter(function (m) { return m.id === r.id; })[0], bebas = def && def.bebas;
      if (!def) return Shell.isiKosong('Halaman tidak ditemukan', 'Alamat "' + r.id + '" tidak tersedia.', 'map-pin-off');
      if (!menu && !bebas) return Shell.isiKosong('Akses ditolak', 'Peran ' + Sesi.me.peran_label + ' tidak memiliki akses ke menu ini. Hubungi Admin bila memerlukan akses.', 'shield-x');
      var pindah = !this.sekarang || this.sekarang.id !== r.id || this.sekarang.arg.join('/') !== r.arg.join('/');
      this.sekarang = r; Shell.aktifkan(r.id, menu, def);
      var seq = ++this.seq, isi = qs('#isi'), wadah = D.createElement('div'); wadah.className = 'isi-hal';
      var st = HST[r.id] = HST[r.id] || {};
      var ctx = { id: r.id, arg: r.arg, q: r.q, st: st, el: wadah, seq: seq, me: Sesi.me, boot: Sesi.boot,
        basi: function () { return seq !== self.seq; },
        segar: function () { Router.muatUlang(); },
        remah: function (r2) { Shell.remah(r.id, menu, def, r2); },
        on: function (ev, sel, fn) { wadah.addEventListener(ev, function (e) { var t = e.target.closest(sel); if (t && wadah.contains(t)) fn(t, e); }); },
        _nanti: [], _ulang: [],
        nanti: function (fn) { this._nanti.push(fn); },
        grafik: function (fn) { this._nanti.push(fn); this._ulang.push(fn); },
        aksi: function (peta) { wadah.addEventListener('click', function (e) { var t = e.target.closest('[data-a]'); if (!t || !wadah.contains(t) || !peta[t.dataset.a]) return; e.preventDefault(); peta[t.dataset.a](t, e); }); }
      };
      this._ctx = ctx; Data.dipakai = {};
      var tSkel = null, gulir = W.scrollY;
      if (o.bingkai) { isi.classList.add('memuat-ulang'); }
      else if (!o.diam) tSkel = setTimeout(function () { if (seq === self.seq) { isi.innerHTML = '<div class="pudar">' + UI.kerangka(def.kerangka) + '</div>'; } }, 90);
      var jalan;
      try { jalan = Promise.resolve(def.render(ctx)); } catch (er) { jalan = Promise.reject(er); }
      jalan.then(function () {
        clearTimeout(tSkel); if (seq !== self.seq) return;
        isi.classList.remove('memuat-ulang');
        if (!o.diam || o.bingkai) wadah.classList.add(o.bingkai ? 'pudar' : 'masuk');
        isi.innerHTML = ''; isi.appendChild(wadah);
        if (o.diam) W.scrollTo(0, gulir); else if (pindah) W.scrollTo(0, 0);
        if (def.setelah) def.setelah(ctx);
        ctx._nanti.forEach(function (fn) { try { fn(); } catch (x) { if (W.console) console.error(x); } });
      }, function (er) {
        clearTimeout(tSkel); if (seq !== self.seq) return; isi.classList.remove('memuat-ulang');
        if (er && er.code === 'AUTH_REQUIRED') return;
        isi.innerHTML = '<div class="kartu pad masuk">' + UI.kosong(er && er.code === 'MODULE_OFF' ? 'Fitur belum diaktifkan' : er && er.code === 'FORBIDDEN' ? 'Akses ditolak' : 'Gagal memuat data', er && er.message ? er.message : String(er), '<button type="button" class="btn primer kecil mt-8" data-ulang>' + ic('rotate-cw') + 'Coba lagi</button>') + '</div>';
        var b = isi.querySelector('[data-ulang]'); if (b) b.onclick = function () { Router.tampilkan(); };
        if (W.console) console.error(er);
      });
    }
  };
  W.addEventListener('hashchange', function () { Router.tampilkan(); });
  // penanda galat isian hilang begitu isian diperbaiki (berlaku untuk semua form)
  ['input', 'change'].forEach(function (ev) { D.addEventListener(ev, function (e) { var f = e.target && e.target.closest && e.target.closest('.fld.salah'); if (f) { f.classList.remove('salah'); var g = f.querySelector('.galat'); if (g) g.textContent = ''; } }, true); });
  var lebarAkhir = W.innerWidth;
  W.addEventListener('resize', U.debounce(function () { if (Math.abs(W.innerWidth - lebarAkhir) < 30) return; lebarAkhir = W.innerWidth; var c = Router._ctx; if (c && c._ulang) c._ulang.forEach(function (fn) { try { fn(); } catch (x) { } }); }, 200));

  /* ===================== LAYAR AWAL ===================== */
  var Layar = {
    tampil: function (teks, sub) { var el = qs('#layar-awal'); if (!el) return; el.classList.remove('hilang'); el.innerHTML = htmlPemuat(teks, sub, true); },
    sembunyikan: function () { var el = qs('#layar-awal'); if (el && !el.classList.contains('hilang')) el.classList.add('hilang'); }
  };

  /* ===================== SHELL APLIKASI ===================== */
  var PERAN_DEMO = [
    { u: 'direksi', p: 'capten2026', l: 'Admin / Direksi' }, { u: 'koordinator', p: '246810', l: 'Keperawatan' }, { u: 'perawat', p: '246810', l: 'Perawat HC' },
    { u: 'homevisit', p: '246810', l: 'Koordinator HV' }, { u: 'perawathv', p: '246810', l: 'Perawat HV' }, { u: 'cs', p: '246810', l: 'Customer Service' },
    { u: 'hrd', p: '246810', l: 'HRD' }, { u: 'operasional', p: '246810', l: 'Operasional' }, { u: 'keuangan', p: 'capten2026', l: 'Keuangan' }, { u: 'pettycash', p: 'capten2026', l: 'Admin Petty Cash' }
  ];
  var NAV_BAWAH = { PRW: ['dashboard', 'laporan', 'riwayat', 'identifikasi'], HV: ['dashboard', 'homevisit', 'jadwal', 'pasien'], CS: ['dashboard', 'pipeline', 'sales', 'kasus'], KEU: ['dashboard', 'sales', 'penggajian', 'keuangan'], KEP: ['dashboard', 'laporan', 'penugasan', 'kasus'], PC: ['dashboard', 'pettycash'], HRD: ['dashboard', 'rekrutmen', 'perawat', 'turnover'], OPS: ['dashboard', 'operasional', 'kasus', 'analitik'], ADM: ['dashboard', 'analitik', 'pasien', 'sales'], HVK: ['dashboard', 'homevisit', 'jadwal', 'pasien'] };
  var Shell = {
    terpasang: false,
    pasang: function () {
      if (this.terpasang) return; this.terpasang = true;
      var b = Sesi.boot, me = Sesi.me, br = b.branding || {}, app = qs('#app'), ciut = (function () { try { return localStorage.getItem('cc_ciut') === '1'; } catch (x) { return false; } })();
      var logo = br.logo_gelap_url || br.logo_url || 'assets/logo.svg';
      // v2: banner kuning dihapus. Mode demo ditandai chip kecil "DEMO"; server terputus → chip merah "TERPUTUS".
      app.innerHTML = '<div class="app' + (ciut ? ' ciut' : '') + '" id="kerangka"><aside class="sidebar" aria-label="Navigasi utama"><div class="sb-kepala"><span class="sb-logo"><img src="' + U.e(br.logo_url || 'assets/logo.svg') + '" alt=""></span><div class="sb-brand"><b>' + U.e(br.nama_brand || 'Capten Care') + '</b><span>' + U.e(br.tagline || 'Integrated System') + '</span></div><button type="button" class="sb-ciut" data-ciut aria-label="Ciutkan menu" title="Ciutkan menu">' + ic('panel-left-close', 'k') + '</button></div>' +
        '<button type="button" class="sb-cari" data-palet>' + ic('search', 'k') + '<span>Cari apa saja…</span><kbd class="kbd">⌘K</kbd></button><nav class="sb-nav" id="sb-nav"></nav>' +
        '<div class="sb-kaki"><div class="sb-user" data-akun>' + UI.ava(me.nama, 'k') + '<div class="tumpuk" style="gap:0"><b class="potong">' + U.e(me.nama) + '</b><span>' + U.e(me.peran_label) + '</span></div>' + ic('chevrons-up-down', 'k') + '</div></div></aside>' +
        '<div class="utama"><header class="topbar"><button type="button" class="btn ikon hantu tb-menu" data-menu-hp aria-label="Buka menu">' + ic('menu') + '</button><nav class="remah" aria-label="Breadcrumb" id="remah"></nav><div class="tb-aksi">' +
        '<button type="button" class="tb-cari" data-palet aria-label="Cari">' + ic('search', 'k') + '<span class="teks">Cari pasien, perawat, invoice…</span><kbd class="kbd">⌘K</kbd></button>' +
        '<a class="gauge" id="gauge" href="#/laporan" hidden aria-label="Kepatuhan operasional"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="jalur" cx="18" cy="18" r="15"/><circle class="busur" cx="18" cy="18" r="15"/></svg><span class="g-teks"><span class="g-lbl"><i></i><span data-g-lbl>Kepatuhan Operasional</span></span><b data-g-nilai>—</b></span></a>' +
        (API.mode === 'demo' ? '<label class="sim" title="Simulator peran: ganti akun demo, menu & izin berubah seketika">' + ic('user-round-cog', 'k') + '<span class="lbl">Peran</span><select data-sim aria-label="Simulator peran">' + PERAN_DEMO.map(function (p) { return '<option value="' + p.u + '"' + (p.u === me.username ? ' selected' : '') + '>' + U.e(p.l) + '</option>'; }).join('') + '</select></label>' : '') +
        '<button type="button" class="mode-chip' + (API.mode === 'demo' ? ' demo' : '') + (API.putus ? ' putus' : '') + '" id="mode-chip" data-status-sistem title="' + (API.putus ? 'Server tidak terjangkau — klik untuk detail' : API.mode === 'demo' ? 'Mode demo: data contoh di peramban ini' : 'Terhubung ke server') + '"><i></i><span class="lbl">' + (API.putus ? 'TERPUTUS' : API.mode === 'demo' ? 'DEMO' : 'LIVE') + '</span></button>' +
        '<button type="button" class="btn ikon hantu lonceng" data-lonceng aria-label="Notifikasi">' + ic('bell') + '<span class="jml" id="jml-notif"' + (b.notif_belum ? '' : ' hidden') + '>' + (b.notif_belum > 99 ? '99+' : b.notif_belum) + '</span></button></div></header>' +
        '<main class="isi" id="isi" tabindex="-1"></main><footer class="kaki-app"><span>' + U.e(br.footer || '© PT. Nusantara Insan Sakti') + ' · ' + U.e(br.nama_aplikasi || '') + '</span><span>v' + VERSI + ' · <a href="#/bantuan">Bantuan & SOP</a> · Tekan <kbd>⌘K</kbd> untuk mencari</span></footer></div></div><nav class="bawah-nav" id="bawah-nav" aria-label="Navigasi cepat"></nav>';
      this.gambarMenu(); this.pasangEvent(); Layar.sembunyikan();
      Data.prefetch(this.daftarPrefetch());
      Poll.mulai();
      this.muatGauge();
    },
    /* Gauge radial "Kepatuhan Operasional": laporan tepat waktu 30 hari (ADM/KEP/OPS).
       Perawat: angka kepatuhan pribadi yang disediakan server (bulan berjalan). Peran lain: tidak tampil. */
    muatGauge: function () {
      var g = qs('#gauge'); if (!g || !Sesi.me) return; var p = Sesi.me.peran;
      function pasang(persen, label, tip, rute) {
        var el = qs('#gauge'); if (!el) return; var v = Math.max(0, Math.min(100, U.n(persen)));
        el.hidden = false; el.href = '#/' + rute; el.title = tip;
        qs('[data-g-lbl]', el).textContent = label; qs('[data-g-nilai]', el).textContent = U.angka(v, 1) + '%';
        var titik = qs('.g-lbl i', el); titik.className = v >= 95 ? '' : v >= 80 ? 'warn' : 'bahaya';
        var busur = qs('.busur', el), keliling = 2 * Math.PI * 15;
        requestAnimationFrame(function () { requestAnimationFrame(function () { busur.style.strokeDashoffset = String(keliling * (1 - v / 100)); }); });
      }
      if (/^(ADM|KEP|OPS)$/.test(p)) Q('laporan.kepatuhan', {}).then(function (k) { var t = (k && k.total) || {}; pasang(t.persen, 'Kepatuhan Operasional', 'Laporan harian tepat waktu, 30 hari terakhir: ' + (t.tepat || 0) + ' tepat dari ' + (t.wajib || 0) + ' kewajiban', 'laporan'); }).catch(function () { });
      else if (p === 'PRW') Q('dash.data', { rentang: 30 }).then(function (d) { var k = (d && d.kepatuhan) || {}; pasang(k.persen == null ? 100 : k.persen, 'Kepatuhan Saya', 'Laporan Anda yang tepat waktu, bulan berjalan: ' + (k.tepat || 0) + ' tepat dari ' + (k.wajib || 0) + ' kewajiban', 'riwayat'); }).catch(function () { });
      else g.hidden = true;
    },
    daftarPrefetch: function () { var p = Sesi.me.peran, d = [['dash.data', { rentang: 30 }], ['notif.inapp', {}]]; if (/ADM|KEU|OPS|CS/.test(p)) d.push(['analitik.penjualan', {}]); if (/ADM|KEP|OPS/.test(p)) d.push(['laporan.kepatuhan', {}]); if (/ADM|CS|KEU|OPS|KEP/.test(p)) d.push(['so.list', {}]); if (p === 'PRW') d.push(['laporan.konteks', {}]); if (/ADM|CS|OPS/.test(p)) d.push(['pipeline.list', {}]); return d; },
    hancurkan: function () { if (!this.terpasang) return; this.terpasang = false; Poll.henti(); Router.sekarang = null; qs('#app').innerHTML = ''; },
    gambarMenu: function () {
      var b = Sesi.boot, menu = b.menu || [], grup = {}, badge = b.badge || {}, aktif = Router.sekarang && Router.sekarang.id;
      menu.forEach(function (m) { (grup[m.grup] = grup[m.grup] || []).push(m); });
      var h = Object.keys(grup).map(function (g) { return '<div class="sb-grup">' + U.e(g) + '</div>' + grup[g].map(function (m) { var n = m.badge ? badge[m.badge] : 0; return '<a class="sb-item' + (m.id === aktif ? ' aktif' : '') + '" href="#/' + m.id + '" data-menu="' + m.id + '" title="' + U.e(m.label) + '">' + ic(m.ikon) + '<span class="sb-lbl">' + U.e(m.label) + '</span>' + (n ? '<span class="sb-badge' + (m.badge === 'kasus' || m.badge === 'laporan' ? ' merah' : '') + '">' + n + '</span><span class="sb-titik"></span>' : '') + '</a>'; }).join(''); }).join('');
      var nav = qs('#sb-nav'); if (nav) nav.innerHTML = h;
      var bn = qs('#bawah-nav'); if (bn) { var ids = (NAV_BAWAH[Sesi.me.peran] || NAV_BAWAH.ADM).filter(function (id) { return menu.some(function (m) { return m.id === id; }); }); bn.innerHTML = ids.map(function (id) { var m = menu.filter(function (x) { return x.id === id; })[0], n = m.badge ? badge[m.badge] : 0; return '<a href="#/' + id + '" data-menu="' + id + '" class="' + (id === aktif ? 'aktif' : '') + '">' + ic(m.ikon) + '<span>' + U.e(m.label.split(' ')[0] === 'Laporan' ? 'Laporan' : m.label.replace(/ &.*| Harian| HC| CS| Penjualan/g, '').split(' ').slice(0, 2).join(' ')) + '</span>' + (n ? '<span class="bd">' + n + '</span>' : '') + '</a>'; }).join('') + '<a href="javascript:void 0" data-menu-hp>' + ic('layout-grid') + '<span>Menu</span></a>'; }
    },
    aktifkan: function (id, menu, def) {
      qsa('[data-menu]').forEach(function (a) { a.classList.toggle('aktif', a.dataset.menu === id); });
      var k = qs('#kerangka'); if (k) k.classList.remove('menu-buka');
      this.remah(id, menu, def);
    },
    remah: function (id, menu, def, ekstra) {
      var r = qs('#remah'); if (!r) return; var grup = menu ? (menu.grup === 'GENERAL' ? 'Sistem' : 'Operasional') : 'Akun';
      var item = ['<li><a href="#/dashboard">' + U.e((Sesi.boot.branding || {}).nama_brand || 'Capten Care') + '</a></li>', '<li>' + grup + '</li>', '<li>' + (ekstra ? '<a href="#/' + id + '">' : '') + U.e(menu ? menu.label : def.judul || id) + (ekstra ? '</a>' : '') + '</li>'];
      (ekstra || []).forEach(function (x) { item.push('<li>' + U.e(x) + '</li>'); });
      r.innerHTML = '<ol>' + item.join('') + '</ol>';
    },
    isiKosong: function (judul, pesan, ikon) { this.pasang(); var isi = qs('#isi'); isi.innerHTML = '<div class="kartu pad masuk" style="max-width:560px;margin:40px auto">' + UI.kosong(judul, pesan, '<a class="btn primer kecil mt-8" href="#/dashboard">' + ic('layout-dashboard') + 'Kembali ke Dashboard</a>') + '</div>'; },
    segarkanLencana: U.debounce(function () { if (!Sesi.me) return; API.panggil('auth.boot', {}, { diam: true }).then(function (b) { var lama = JSON.stringify([Sesi.boot.menu, Sesi.boot.badge, Sesi.boot.modul]); Sesi.boot = b; Sesi.me = b.me; Tema.terapkan(b.branding); if (lama !== JSON.stringify([b.menu, b.badge, b.modul])) Shell.gambarMenu(); Shell.setNotif(b.notif_belum); Shell.muatGauge(); }).catch(function () { }); }, 700),
    setNotif: function (n) { var el = qs('#jml-notif'); if (!el) return; el.hidden = !n; el.textContent = n > 99 ? '99+' : n; },
    statusKoneksi: function () { var c = qs('#mode-chip'); if (!c) return; c.classList.toggle('putus', !!API.putus); var l = qs('.lbl', c); if (l) l.textContent = API.putus ? 'TERPUTUS' : API.mode === 'demo' ? 'DEMO' : 'LIVE'; c.title = API.putus ? 'Server tidak terjangkau — klik untuk detail' : API.mode === 'demo' ? 'Mode demo: data contoh di peramban ini' : 'Terhubung ke server'; },
    pasangEvent: function () {
      var app = qs('#app'), self = this;
      app.addEventListener('click', function (e) {
        var t;
        if ((t = e.target.closest('[data-palet]'))) return Palet.buka();
        if ((t = e.target.closest('[data-ciut]'))) { var k = qs('#kerangka'); k.classList.toggle('ciut'); try { localStorage.setItem('cc_ciut', k.classList.contains('ciut') ? '1' : '0'); } catch (x) { } return; }
        if ((t = e.target.closest('[data-menu-hp]'))) { qs('#kerangka').classList.toggle('menu-buka'); return; }
        if ((t = e.target.closest('[data-lonceng]'))) return Notif.buka(t);
        if ((t = e.target.closest('[data-akun]'))) return self.menuAkun(t);
        if ((t = e.target.closest('[data-status-sistem]'))) return self.infoKoneksi(t);
        if ((t = e.target.closest('[data-reset-demo]'))) return self.resetDemo();
        if ((t = e.target.closest('[data-coba-live]'))) { location.reload(); return; }
        if ((t = e.target.closest('[data-rute]'))) { Router.ke(t.dataset.rute); return; }
        if ((t = e.target.closest('[data-tabel-grafik]'))) { var kk = t.closest('[data-grafik-kartu]'); kk.classList.toggle('tampil-tabel'); t.innerHTML = kk.classList.contains('tampil-tabel') ? ic('chart-column', 'k') + 'Grafik' : ic('table', 'k') + 'Tabel'; return; }
        var k2 = qs('#kerangka'); if (k2 && k2.classList.contains('menu-buka') && !e.target.closest('.sidebar')) k2.classList.remove('menu-buka');
      });
      app.addEventListener('change', function (e) { if (e.target.matches('[data-sim]')) self.gantiPeran(e.target.value, e.target); });
    },
    gantiPeran: function (u, sel) {
      var p = PERAN_DEMO.filter(function (x) { return x.u === u; })[0]; if (!p) return;
      var tujuan = Router.sekarang ? Router.sekarang.id : 'dashboard', isi = qs('#isi');
      sel.disabled = true; isi.classList.add('memuat-ulang');
      Sesi.masuk(p.u, p.p, { instan: true }).then(function (b) {
        sel.disabled = false; Poll.henti(); Shell.terpasang = false; Shell.pasang();
        var boleh = b.menu.some(function (m) { return m.id === tujuan; });
        UI.toast('Sekarang sebagai ' + b.me.nama + ' (' + b.me.peran_label + '). Menu: ' + b.menu.length + ' item.', 'ok', { judul: 'Peran diganti' });
        if (boleh) Router.tampilkan(); else Router.ke('dashboard');
      }, function (er) { sel.disabled = false; isi.classList.remove('memuat-ulang'); UI.galat(er); });
    },
    menuAkun: function (t) { var me = Sesi.me; UI.pop(t, [{ l: me.nama + ' · ' + me.username, i: 'user-round', fn: function () { Router.ke('profil'); } }, { l: 'Profil & ganti PIN', i: 'key-round', fn: function () { Router.ke('profil'); } }, { l: 'Pintasan keyboard', i: 'keyboard', fn: Pintasan.tampil }, { l: 'Bantuan & SOP', i: 'life-buoy', fn: function () { Router.ke('bantuan'); } }, '-', { l: 'Keluar', i: 'log-out', bahaya: true, fn: function () { Sesi.keluar(); } }]); },
    infoKoneksi: function (t) {
      var panel = API.putus ? '<div class="panel-bahaya mb-12">' + ic('wifi-off', 'k') + '<div><b>Server tidak terjangkau.</b> ' + (API.mode === 'demo' ? 'Aplikasi sementara berjalan dalam mode demo dengan data contoh di peramban ini — data asli tidak berubah.' : 'Perubahan tidak dapat disimpan sampai koneksi pulih.') + '</div></div>' : API.mode === 'demo' ? '<div class="panel-info mb-12">' + ic('flask-conical', 'k') + '<div><b>Mode demo.</b> Data contoh tersimpan di peramban ini. Ubah <code>USE_MOCK</code> di <code>js/config.js</code> untuk terhubung ke server.</div></div>' : '';
      var isi = panel + '<div class="info-grid"><div><dt>Mode</dt><dd>' + (API.mode === 'demo' ? 'Demo (data di peramban)' : 'Live — Apps Script') + '</dd></div><div><dt>Status</dt><dd>' + (API.putus ? '<span class="bahaya-t">Terputus</span>' : '<span class="ok-t">Terhubung</span>') + '</dd></div><div><dt>Waktu server terakhir</dt><dd>' + API.lastMs + ' ms</dd></div><div><dt>Versi</dt><dd>Aplikasi v' + VERSI + (API.versiServer ? ' · server v' + U.e(API.versiServer) : '') + '</dd></div><div class="penuh"><dt>Cache peramban</dt><dd>' + Object.keys(Data.c).length + ' set data · otomatis disegarkan setiap 30 detik saat dibuka</dd></div></div>';
      var kiri = API.putus ? '<div class="kiri"><button type="button" class="btn kecil" data-coba-live>' + ic('rotate-cw') + 'Coba sambung lagi</button></div>' : API.mode === 'demo' ? '<div class="kiri"><button type="button" class="btn kecil hantu" data-reset-demo>' + ic('rotate-ccw') + 'Reset data demo</button></div>' : '';
      var m = UI.modal({ judul: 'Status koneksi', ikon: API.putus ? 'wifi-off' : API.mode === 'demo' ? 'flask-conical' : 'radio-tower', ikonKelas: API.putus ? 'bahaya' : '', sempit: true, isi: isi, kaki: kiri + '<button type="button" class="btn" data-tutup>Tutup</button><button type="button" class="btn primer" data-segar>' + ic('refresh-cw') + 'Segarkan data</button>' });
      m.el.querySelector('[data-segar]').onclick = function () { var b = this; UI.kerja(b, function () { Data.hapusSemua(); return API.mode === 'live' && Sesi.me.peran === 'ADM' ? T('sistem.segarkan', {}) : null; }).then(function () { m.tutup(); Router.tampilkan(); Shell.muatGauge(); UI.toast('Data disegarkan dari server.', 'ok'); }); };
      m.on('click', '[data-reset-demo]', function () { m.tutup(); Shell.resetDemo(); });
      m.on('click', '[data-coba-live]', function () { location.reload(); });
    },
    resetDemo: function () { UI.konfirmasi({ judul: 'Reset data demo?', pesan: 'Semua perubahan yang Anda buat di mode demo dihapus dan data contoh dibuat ulang mengikuti tanggal hari ini.', ok: 'Reset data', bahaya: true }).then(function (v) { if (!v) return; var pr = UI.proses('Membuat ulang data demo', ['Menghapus data lama', 'Membuat pasien, perawat & penugasan', 'Membuat laporan, invoice & payroll']); setTimeout(function () { pr.langkah(1); setTimeout(function () { W.CCDemo.reset(); pr.langkah(2); var u = Sesi.me.username, p = PERAN_DEMO.filter(function (x) { return x.u === u; })[0] || PERAN_DEMO[0]; Sesi.masuk(p.u, p.p, { instan: true }).then(function () { pr.selesai(); Shell.terpasang = false; Shell.pasang(); Router.tampilkan(); UI.toast('Data demo dibuat ulang.', 'ok'); }); }, 60); }, 300); }); }
  };

  /* ===================== NOTIFIKASI IN-APP & POLLING ADAPTIF ===================== */
  var RUTE_EVENT = { LAPORAN: 'laporan', KASUS: 'kasus', LEAD: 'pipeline', INVOICE: 'sales', PERPANJANGAN: 'sales', BAYAR: 'sales', GAJI: 'penggajian', PC: 'pettycash', IDF: 'identifikasi', KONDISI: 'laporan', TARGET: 'target', KONTRAK: 'perawat', HV: 'homevisit', DOK: 'dokumen', LIBUR: 'libur', KASBON: 'kasbon', PELAMAR: 'rekrutmen', PENUGASAN: 'penugasan', ROTASI: 'penugasan', PENALTI: 'penalti', BLAST: 'notifikasi', FORM: 'pasien' };
  function ruteEvent(ev) { var k = Object.keys(RUTE_EVENT).filter(function (x) { return String(ev || '').indexOf(x) === 0; })[0]; return k ? RUTE_EVENT[k] : 'dashboard'; }
  var Notif = {
    buka: function (t) {
      var el = UI.pop(t, []); el.classList.add('notif-pop'); el.innerHTML = '<div class="kepala"><b>Notifikasi</b><div class="baris"><button type="button" class="btn mini hantu" data-semua>' + ic('check-check', 'k') + 'Tandai dibaca</button></div></div><div class="daftar-n"><div class="pad" style="padding:24px;display:grid;place-items:center"><span class="cincin-muat"></span></div></div>';
      el.onclick = null;
      Q('notif.inapp', {}, { ttl: 5000 }).then(function (d) {
        var dn = el.querySelector('.daftar-n'); if (!dn) return; Shell.setNotif(d.belum);
        dn.innerHTML = d.rows.length ? d.rows.slice(0, 40).map(function (n) { return '<div class="n' + (n.dibaca ? '' : ' baru') + '" data-id="' + U.e(n.id) + '" data-ev="' + U.e(n.event) + '">' + '<span class="ikon-ov" style="width:32px;height:32px;border-radius:10px">' + ic(/KASUS|ESKALASI|OVERDUE/.test(n.event) ? 'circle-alert' : /KONDISI/.test(n.event) ? 'heart-pulse' : /INVOICE|BAYAR/.test(n.event) ? 'receipt-text' : /GAJI|PC/.test(n.event) ? 'banknote' : 'bell', 'k') + '</span><div class="tumbuh"><b>' + U.e(n.judul) + '</b><p>' + U.e(n.pesan) + '</p><time>' + U.relatif(n.waktu) + '</time></div></div>'; }).join('') : UI.kosong('Tidak ada notifikasi', 'Semua sudah tertangani.');
      }).catch(function (er) { UI.galat(er); });
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-semua]')) { T('notif.baca', { semua: true }, { diam: true }).then(function () { qsa('.n.baru', el).forEach(function (x) { x.classList.remove('baru'); }); Shell.setNotif(0); }); return; }
        var n = e.target.closest('.n'); if (!n) return; T('notif.baca', { id: n.dataset.id }, { diam: true }).catch(function () { }); UI.tutupPop(); Router.ke(ruteEvent(n.dataset.ev));
      });
    }
  };
  var Poll = {
    t: null, aktifPada: Date.now(), terakhir: 0,
    mulai: function () { var self = this; this.henti(); ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { W.addEventListener(ev, self._akt || (self._akt = function () { self.aktifPada = Date.now(); }), { passive: true }); }); this.t = setInterval(function () { self.tik(); }, 15000); },
    henti: function () { clearInterval(this.t); },
    tik: function () { if (D.visibilityState !== 'visible' || !Sesi.me) return; var diam = Date.now() - this.aktifPada > 120000, jeda = diam ? 180000 : 60000; if (Date.now() - this.terakhir < jeda) return; this.terakhir = Date.now(); API.panggil('notif.inapp', {}, { diam: true }).then(function (d) { Shell.setNotif(d.belum); }).catch(function () { }); }
  };

  /* ===================== PALET PERINTAH ⌘K ===================== */
  var Palet = {
    el: null,
    buka: function () {
      if (this.el) return; var self = this, lap = D.createElement('div'); lap.className = 'lapis buka'; lap.style.zIndex = 119;
      var el = D.createElement('div'); el.className = 'palet'; el.setAttribute('role', 'dialog');
      el.innerHTML = '<div class="palet-cari">' + ic('search') + '<input type="text" placeholder="Cari menu, pasien, perawat, invoice, kasus…" aria-label="Cari" autocomplete="off"><kbd>Esc</kbd></div><div class="palet-hasil"></div><div class="palet-kaki"><span><kbd>↑</kbd><kbd>↓</kbd> pilih</span><span><kbd>↵</kbd> buka</span><span><kbd>Esc</kbd> tutup</span><span style="margin-left:auto">' + (Sesi.me ? U.e(Sesi.me.peran_label) : '') + '</span></div>';
      D.body.appendChild(lap); D.body.appendChild(el); this.el = el; this.lap = lap;
      var inp = el.querySelector('input'), hasil = el.querySelector('.palet-hasil'), item = [], pilih = 0, seq = 0;
      function aksiCepat() { var p = Sesi.me.peran, a = []; if (p === 'PRW') a.push({ l: 'Isi laporan harian', s: 'Form A–H', i: 'clipboard-pen', r: 'laporan' }); if (/ADM|CS/.test(p)) { a.push({ l: 'Tambah lead baru', s: 'Pipeline CS', i: 'user-plus', r: 'pipeline?baru=1' }); a.push({ l: 'Buat Sales Order', s: 'Sales Order & Invoice', i: 'receipt-text', r: 'sales?baru=1' }); } if (/ADM|KEP/.test(p)) a.push({ l: 'Buat penugasan', s: 'Penugasan & Rotasi', i: 'repeat', r: 'penugasan?baru=1' }); a.push({ l: 'Ganti PIN', s: 'Profil', i: 'key-round', r: 'profil' }); return a; }
      function gambar(daftarMenu, daftarData, cepat) {
        item = []; var h = '';
        if (cepat && cepat.length) { h += '<div class="palet-grup label-mikro">Aksi cepat</div>'; cepat.forEach(function (x) { item.push(x); h += baris(x); }); }
        if (daftarMenu.length) { h += '<div class="palet-grup label-mikro">Menu</div>'; daftarMenu.forEach(function (m) { var x = { l: m.label, s: m.grup === 'GENERAL' ? 'Sistem' : 'Buka halaman', i: m.ikon, r: m.id }; item.push(x); h += baris(x); }); }
        if (daftarData && daftarData.length) { h += '<div class="palet-grup label-mikro">Data</div>'; daftarData.forEach(function (d) { var x = { l: d.judul, s: d.jenis + ' · ' + d.sub, i: d.ikon || 'file-text', r: d.rute + (d.id ? '?id=' + encodeURIComponent(d.id) : '') }; item.push(x); h += baris(x); }); }
        if (!item.length) h = '<div class="kosong" style="padding:28px">Tidak ada hasil. Coba nama pasien, nomor invoice, atau kode kasus.</div>';
        hasil.innerHTML = h; pilih = Math.min(pilih, item.length - 1); sorot();
      }
      function baris(x) { return '<div class="palet-item" data-i="' + item.length + '">' + ic(x.i) + '<div class="tumpuk" style="gap:0"><b>' + U.e(x.l) + '</b><span>' + U.e(x.s) + '</span></div></div>'; }
      function sorot() { qsa('.palet-item', hasil).forEach(function (x, i) { x.classList.toggle('aktif', i === pilih); if (i === pilih) x.scrollIntoView({ block: 'nearest' }); }); }
      function buka(i) { var x = item[i]; if (!x) return; self.tutup(); Router.ke(x.r); }
      function cari() {
        var q = inp.value.trim().toLowerCase(), menu = (Sesi.boot.menu || []).filter(function (m) { return !q || m.label.toLowerCase().indexOf(q) > -1 || m.id.indexOf(q) > -1; }).slice(0, q ? 6 : 8);
        pilih = 0; gambar(menu, null, q ? [] : aksiCepat());
        if (q.length >= 2) { var s = ++seq; Q('cari.global', { q: q }, { ttl: 20000 }).then(function (d) { if (s === seq && self.el) gambar(menu, d.slice(0, 12), []); }).catch(function () { }); }
      }
      inp.addEventListener('input', U.debounce(cari, 160));
      inp.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { pilih = Math.min(item.length - 1, pilih + 1); sorot(); e.preventDefault(); } else if (e.key === 'ArrowUp') { pilih = Math.max(0, pilih - 1); sorot(); e.preventDefault(); } else if (e.key === 'Enter') { buka(pilih); e.preventDefault(); } });
      hasil.addEventListener('click', function (e) { var x = e.target.closest('[data-i]'); if (x) buka(+x.dataset.i); });
      hasil.addEventListener('mousemove', function (e) { var x = e.target.closest('[data-i]'); if (x && +x.dataset.i !== pilih) { pilih = +x.dataset.i; sorot(); } });
      lap.onclick = function () { self.tutup(); };
      cari(); setTimeout(function () { inp.focus(); }, 20);
    },
    tutup: function () { if (!this.el) return; this.el.remove(); this.lap.remove(); this.el = null; }
  };

  /* ===================== PINTASAN KEYBOARD ===================== */
  var Pintasan = {
    tampil: function () { UI.modal({ judul: 'Pintasan keyboard', ikon: 'keyboard', sempit: true, isi: '<div class="daftar">' + [['⌘K / Ctrl K', 'Buka pencarian & perintah'], ['/', 'Fokus ke kolom cari di halaman'], ['N', 'Tambah data baru (tombol berlabel N)'], ['Esc', 'Tutup jendela / panel'], ['?', 'Tampilkan pintasan ini']].map(function (x) { return '<div class="item" style="padding:9px 0"><span class="tumbuh">' + x[1] + '</span>' + x[0].split(' / ').map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') + '</div>'; }).join('') + '</div>' }); }
  };
  D.addEventListener('keydown', function (e) {
    var ketik = /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName) || (e.target && e.target.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (Sesi.me) { if (Palet.el) Palet.tutup(); else Palet.buka(); } return; }
    if (e.key === 'Escape') { if (Palet.el) { Palet.tutup(); return; } if (UI._pop) { UI.tutupPop(); return; } if (UI.tutupAtas()) return; var k = qs('#kerangka'); if (k) k.classList.remove('menu-buka'); return; }
    if (ketik || e.metaKey || e.ctrlKey || e.altKey || tumpukan.length || Palet.el || !Sesi.me) return;
    if (e.key === '/') { var c = qs('#isi [data-f=q]'); if (c) { e.preventDefault(); c.focus(); } return; }
    if (e.key === '?') { Pintasan.tampil(); return; }
    var b = qs('#isi [data-kunci="' + e.key.toLowerCase() + '"]'); if (b && b.offsetParent) { e.preventDefault(); b.click(); }
  });

  /* ===================== MULAI ===================== */
  function mulai() {
    var sp = D.createElement('div'); sp.style.display = 'none'; sp.innerHTML = W.IKON_SPRITE || ''; D.body.insertBefore(sp, D.body.firstChild);
    var r = Router.parse();
    if (PUBLIK[r.id]) { Layar.sembunyikan(); Router.tampilkan(); return; }
    Layar.tampil('Menyiapkan ruang kerja', API.mode === 'demo' ? 'Mode demo · memuat data contoh' : 'Menghubungkan ke server');
    API.hangatkan('admin');
    var punyaSesi = Sesi.muat();
    var siap = API.mode === 'demo' ? API.muatDemo() : Promise.resolve();
    siap.then(function () {
      if (!punyaSesi) return null;
      return Sesi.muatBoot().catch(function (er) {
        if (er.code === 'JARINGAN' && API.mode === 'live' && CFG.FALLBACK_MOCK !== false) return beralihDemo();
        Sesi.hapus(); return null;
      });
    }).then(function () { Layar.sembunyikan(); Router.tampilkan(); }, function (er) { Layar.sembunyikan(); UI.galat(er); Router.tampilkan(); });
  }
  function beralihDemo() { API.mode = 'demo'; API.putus = true; Sesi.hapus(); return API.muatDemo().then(function () { setTimeout(function () { UI.toast('Server tidak terjangkau. Aplikasi beralih ke mode demo; data asli tidak tersentuh.', 'warn', { judul: 'Mode demo otomatis', durasi: 8000 }); }, 600); return null; }); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') W.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });

  W.CCApp = { U: U, ic: ic, qs: qs, qsa: qsa, API: API, Data: Data, Q: Q, T: T, Sesi: Sesi, UI: UI, G: G, Kal: Kal, Gantt: Gantt, Router: Router, Shell: Shell, Tema: Tema, Layar: Layar, htmlPemuat: htmlPemuat, kelasStatus: kelasStatus, PERAN_DEMO: PERAN_DEMO, VERSI: VERSI, beralihDemo: beralihDemo, ruteEvent: ruteEvent, CFG: CFG, Muat: Muat };
  if (D.readyState === 'complete') setTimeout(mulai, 0); else D.addEventListener('DOMContentLoaded', function () { setTimeout(mulai, 0); });
})(window, document);
