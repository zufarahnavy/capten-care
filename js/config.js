/* =====================================================================
 * KONFIGURASI FRONTEND — satu-satunya berkas yang perlu Anda ubah.
 * Hanya berisi alamat Web App Apps Script (/exec). URL ini BUKAN rahasia:
 * keamanan dijaga token sesi + RBAC di server. JANGAN menaruh token, sandi,
 * atau API key apa pun di sini (rahasia hanya di Script Properties).
 *
 *  GAS_API_URL   : tempel URL Web App, contoh
 *                  https://script.google.com/macros/s/AKfycbwgOGtX7_AtjFFzggQoo9kJABzP7LanifeudgQLse9LB0PCnPL3vsIve1z8XFeE7FY/exec
 *  USE_MOCK      : false  = mode demo (data contoh di peramban, tanpa server)
 *                  false = terhubung ke server Apps Script
 *  FALLBACK_MOCK : false = bila server tidak terjangkau saat membuka aplikasi,
 *                  otomatis beralih ke mode demo dengan banner peringatan.
 *                  Penulisan data TIDAK pernah dialihkan diam-diam.
 * ===================================================================== */
window.CONFIG = {
  GAS_API_URL: "",
  USE_MOCK: true,
  FALLBACK_MOCK: true,
  DEMO_LATENSI_MS: 140
};
