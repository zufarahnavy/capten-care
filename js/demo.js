/* =====================================================================
 * CAPTEN CARE — ADAPTOR MODE DEMO (peramban)
 * Menjalankan logika server yang sama (logika-*.js) di peramban dengan
 * penyimpanan localStorage. Dipakai bila CONFIG.USE_MOCK = true atau
 * server Apps Script belum terhubung. Pengiriman WA/Email disimulasikan.
 * ===================================================================== */
(function (root) {
  'use strict';
  var KUNCI = 'cc_demo_db_v1', KUNCI_PROP = 'cc_demo_prop_v1', VERSI_SEED = '1.0.6';
  var mem = {}, props = {}, kotor = {}, timer = null;
  var store = (function () { try { var t = '__t'; root.localStorage.setItem(t, '1'); root.localStorage.removeItem(t); return root.localStorage; } catch (e) { var m = {}; return { getItem: function (k) { return m[k] === undefined ? null : m[k]; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; } })();

  /* ---------- SHA-256 & HMAC sinkron (untuk hash PIN, token, hash dokumen) ---------- */
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), i, j, res = '', words = [], blen = ascii.length * 8, hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pl = k.length, isC = {};
    for (var c = 2; pl < 64; c++) { if (!isC[c]) { for (i = 0; i < 313; i += c) isC[i] = c; hash[pl] = (mp(c, .5) * mw) | 0; k[pl++] = (mp(c, 1 / 3) * mw) | 0; } }
    hash = hash.slice(0, 8); ascii += '\x80'; while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); if (j >> 8) return; words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((blen / mw) | 0); words[words.length] = (blen);
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oh = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oh[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; res += ((b < 16) ? 0 : '') + b.toString(16); }
    return res;
  }
  function utf8(s) { return unescape(encodeURIComponent(s)); }
  function hexKeBin(h) { var s = ''; for (var i = 0; i < h.length; i += 2) s += String.fromCharCode(parseInt(h.substr(i, 2), 16)); return s; }
  function hmac(kunci, pesan) { kunci = utf8(kunci); if (kunci.length > 64) kunci = hexKeBin(sha256(kunci)); while (kunci.length < 64) kunci += '\x00'; var o = '', ip = ''; for (var i = 0; i < 64; i++) { o += String.fromCharCode(kunci.charCodeAt(i) ^ 0x5c); ip += String.fromCharCode(kunci.charCodeAt(i) ^ 0x36); } return sha256(o + hexKeBin(sha256(ip + utf8(pesan)))); }
  function b64(s) { return btoaU(utf8(s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atobU(s))); }
  function btoaU(s) { return typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64'); }
  function atobU(s) { return typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary'); }
  function uuid() { var c = root.crypto; if (c && c.randomUUID) return c.randomUUID(); var d = Date.now() + Math.random() * 1e9; return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (x) { var r = (d + Math.random() * 16) % 16 | 0; d = Math.floor(d / 16); return (x === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }

  /* ---------- Basis data localStorage (per tab, ditulis tertunda) ---------- */
  function muat() { try { var raw = store.getItem(KUNCI); mem = raw ? JSON.parse(raw) : {}; } catch (e) { mem = {}; } try { props = JSON.parse(store.getItem(KUNCI_PROP) || '{}'); } catch (e) { props = {}; } }
  function simpanSekarang() { try { store.setItem(KUNCI, JSON.stringify(mem)); store.setItem(KUNCI_PROP, JSON.stringify(props)); } catch (e) { if (root.console) console.warn('Penyimpanan demo penuh:', e.message); } kotor = {}; }
  function tandaiKotor(t) { kotor[t] = 1; if (timer) clearTimeout(timer); timer = setTimeout(simpanSekarang, 250); }
  function tabel(t) { return mem[t] || (mem[t] = []); }
  var idx = {};
  function indeks(t) { if (!idx[t] || idx[t].n !== tabel(t).length) { var m = {}; tabel(t).forEach(function (r, i) { m[r.id] = i; }); idx[t] = { n: tabel(t).length, m: m }; } return idx[t].m; }
  var db = {
    all: function (t) { return tabel(t); },
    get: function (t, id) { var i = indeks(t)[id]; return i === undefined ? null : tabel(t)[i]; },
    insert: function (t, rows) { var a = tabel(t); rows.forEach(function (r) { a.push(r); }); tandaiKotor(t); },
    update: function (t, id, patch) { var i = indeks(t)[id]; if (i === undefined) throw new Error('Baris ' + id + ' tidak ada di ' + t); var r = tabel(t)[i]; Object.keys(patch).forEach(function (k) { r[k] = patch[k]; }); tandaiKotor(t); return r; },
    updateMany: function (t, daftar) { var m = indeks(t), a = tabel(t); daftar.forEach(function (p) { var i = m[p.id]; if (i === undefined) return; Object.keys(p).forEach(function (k) { if (k !== 'id') a[i][k] = p[k]; }); }); tandaiKotor(t); }
  };
  function seq(kunci, t, prefix) {
    var k = 'SEQ_' + kunci;
    if (props[k] === undefined) { var max = 0; tabel(t).forEach(function (r) { if (String(r.id).indexOf(prefix) === 0) { var n = parseInt(String(r.id).slice(prefix.length), 10); if (n > max) max = n; } }); props[k] = max; }
    props[k] = Number(props[k]) + 1; return props[k];
  }

  /* ---------- Simulasi antrean WA / Email ---------- */
  function prosesAntrean(o) {
    o = o || {}; var T = CC.T, rows = tabel(T.NOTIF), cfg = CC.set('notif'), hasil = { terkirim: 0, gagal: 0 }, now = CC.u.dt(), blast = {};
    tabel(T.BLAST).forEach(function (b) { if (b.status === 'Berjalan') blast[b.id] = { b: b, kuota: Number(b.ukuran_batch) || 20 }; });
    rows.forEach(function (r) {
      if (r.status !== 'Antri' || r.kanal === 'INAPP') return;
      if (r.blast_id) { if (o.blastId && r.blast_id !== o.blastId) return; var bb = blast[r.blast_id]; if (!bb || bb.kuota <= 0) return; bb.kuota--; }
      else if (o.hanyaBlast) return;
      var gagal = r.kanal === 'WA' && /0{4}$|9999$/.test(r.tujuan);
      r.status = gagal ? 'Gagal' : 'Terkirim'; r.percobaan = Number(r.percobaan || 0) + 1; r.respon = gagal ? 'number not registered (simulasi)' : 'OK (simulasi mode demo)'; r.dikirim_pada = now;
      if (gagal) hasil.gagal++; else hasil.terkirim++;
      if (r.blast_id && blast[r.blast_id]) { var b = blast[r.blast_id].b; b[gagal ? 'gagal' : 'terkirim'] = Number(b[gagal ? 'gagal' : 'terkirim'] || 0) + 1; }
      if (r.event === 'LAPORAN_TERKIRIM' && r.ref_id) { var l = db.get(T.LHC, r.ref_id); if (l) { l.status_kirim_pj = gagal ? 'Gagal — dicoba ulang' : 'Terkirim ' + r.kanal; l.waktu_kirim_pj = now; } }
    });
    Object.keys(blast).forEach(function (id) { var b = blast[id].b; if (!rows.some(function (r) { return r.blast_id === id && r.status === 'Antri'; })) { b.status = 'Selesai'; b.selesai_pada = now; } });
    tandaiKotor(T.NOTIF); tandaiKotor(T.BLAST); tandaiKotor(T.LHC);
    var w = CC.u.hp08; tabel(T.CRM).forEach(function (k) { var n = rows.filter(function (r) { return r.dikirim_pada === now && r.status === 'Terkirim' && (r.tujuan === CC.u.hp62(k.no_wa) || r.tujuan === k.email); }).length; if (n) { k.jumlah_pesan = Number(k.jumlah_pesan || 0) + n; k.terakhir_dihubungi = now; } });
    return hasil;
  }

  var antreanTimer = null;
  var env = {
    mode: 'demo', db: db, seq: seq,
    now: function () { return new Date(); },
    uuid: uuid, b64: b64, unb64: unb64,
    hmac: function (s) { return hmac(props.SESSION_SECRET || (props.SESSION_SECRET = uuid() + uuid()), s); },
    hashPin: function (pin, salt) { var h = String(pin); for (var i = 0; i < 40; i++) h = hmac(String(salt), h + salt); return h; },
    hashTeks: function (s) { return sha256(utf8(s)); },
    samaAman: function (a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; var r = 0; for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; },
    lock: function (fn) { return fn(); },
    tunda: function () { },
    catat: function (m) { if (root.console) console.warn('[demo]', m); },
    qr: function (teks) { try { if (typeof qrcode !== 'function') return ''; var q = qrcode(0, 'M'); q.addData(String(teks)); q.make(); return q.createDataURL(3, 2); } catch (e) { return ''; } },
    simpanBerkas: function (data, nama) { var s = String(data || ''); return { id: nama, url: s.length < 260000 ? s : 'assets/ilustrasi/kosong.svg' }; },
    antreanBaru: function () { if (antreanTimer) clearTimeout(antreanTimer); antreanTimer = setTimeout(function () { prosesAntrean({}); simpanSekarang(); }, 1500); },
    prosesAntrean: prosesAntrean,
    validasiWA: function (nomor) { var out = {}; nomor.forEach(function (n) { out[n] = /3$/.test(n) ? 'Tidak Terdaftar' : 'Terdaftar'; }); return out; },
    perangkatWA: function () { return { device: '6281190872210', device_status: 'connect (simulasi)', package: 'Demo', quota: 'tak terbatas (simulasi)', expired: '-' }; },
    rahasiaStatus: function () { var t = props.FONNTE_TOKEN || ''; return { FONNTE_TOKEN: { ada: !!t, samar: t ? t.slice(0, 4) + '••••••' + t.slice(-3) : '' } }; },
    rahasiaAda: function (k) { return !!props[k]; },
    simpanRahasia: function (k, v) { if (['FONNTE_TOKEN'].indexOf(k) === -1) throw new Error('Kunci tidak diizinkan.'); if (v === '__HAPUS__') delete props[k]; else props[k] = String(v).slice(0, 200); simpanSekarang(); return this.rahasiaStatus()[k]; },
    kuotaEmail: function () { return 100; },
    statusTrigger: function () { return { aktif: true, keterangan: 'Disimulasikan di peramban (mode demo)' }; },
    statusSistem: function () { var raw = store.getItem(KUNCI) || ''; return { mode: 'Demo (peramban)', penyimpanan_kb: Math.round(raw.length / 1024), backup_terakhir: props.BACKUP_TERAKHIR || '-', seed: props.SEED_VERSI }; },
    getProp: function (k) { return props[k] || ''; }, setProp: function (k, v) { props[k] = v; },
    bumpCache: function () { }
  };

  var Demo = {
    siapkan: function () {
      muat();
      CC.env = env;
      // data demo relatif terhadap tanggal hari ini → dibuat ulang bila versi berubah atau sudah > 2 hari
      var umur = props.SEED_PADA ? CC.u.selisihHari(props.SEED_PADA, CC.u.tgl()) : 99;
      if (props.SEED_VERSI !== VERSI_SEED || !tabel(CC.T.USER).length || umur > 2) { Demo.reset(true); return { baru: true, alasan: umur > 2 && props.SEED_VERSI ? 'tanggal' : 'awal' }; }
      return { baru: false };
    },
    reset: function (diam) {
      mem = {}; idx = {}; var secret = props.SESSION_SECRET, token = props.FONNTE_TOKEN; props = { SESSION_SECRET: secret || uuid() + uuid() }; if (token) props.FONNTE_TOKEN = token;
      CC.env = env; CC._setCache = null;
      var t0 = Date.now(), r = CC.isiDataDemo({});
      Object.keys(props).forEach(function (k) { if (k.indexOf('SEQ_') === 0) delete props[k]; });
      props.SEED_VERSI = VERSI_SEED; props.SEED_PADA = CC.u.dt();
      simpanSekarang();
      if (!diam && root.console) console.info('Data demo dibuat ulang dalam', Date.now() - t0, 'ms', r);
      return r;
    },
    handle: function (req) { var r = CC.handle(req); return r; },
    simpan: simpanSekarang,
    prosesAntrean: prosesAntrean,
    _sha256: sha256
  };
  root.CCDemo = Demo;
})(typeof window !== 'undefined' ? window : globalThis);
