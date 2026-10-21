#!/usr/bin/env node
/* Kanunlar sekmesinin dosyalarını şifreleyip kanun/ klasörüne yazar.
   Kullanım: node kanun.js <sayfa.html> <düz-dosya-klasörü>
   Düz klasörde her kanun için <no>.json ve <no>.pdf bulunur (Claude'daki yapıtın kanun/ dosyaları).
   Anahtar (KANUN_ANAHTAR) ve kanun listesi (KANUNLAR) sayfadan okunur; anahtar depoya ASLA düz yazılmaz.
   JSON önce gzip ile sıkıştırılır, sonra AES-256-GCM ile şifrelenir: dosya = 12 bayt iv + şifreli veri + etiket. */
const crypto = require("crypto"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const D = __dirname, [sayfaYol, duz] = process.argv.slice(2);
if (!sayfaYol || !duz) { console.error("Kullanım: node kanun.js <sayfa.html> <düz-dosya-klasörü>"); process.exit(1); }
const s = fs.readFileSync(sayfaYol, "utf8");
const a = /var KANUN_ANAHTAR = "([A-Za-z0-9+/=]+)"/.exec(s), l = /var KANUNLAR = (\[.*?\]);/.exec(s);
if (!a || !l) { console.error("Sayfada KANUN_ANAHTAR ya da KANUNLAR bulunamadı."); process.exit(1); }
const anahtar = Buffer.from(a[1], "base64"), liste = JSON.parse(l[1]);
if (anahtar.length !== 32) { console.error("Anahtar 32 bayt değil."); process.exit(1); }
const hedef = path.join(D, "kanun"); fs.mkdirSync(hedef, { recursive: true });
function sifrele(b) { const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", anahtar, iv); return Buffer.concat([iv, c.update(b), c.final(), c.getAuthTag()]); }
const yazilan = new Set();
for (const k of liste) {
  const j = fs.readFileSync(path.join(duz, k.no + ".json")), p = fs.readFileSync(path.join(duz, k.no + ".pdf"));
  const v = crypto.createHash("sha256").update(Buffer.concat([j, p])).digest("hex").slice(0, 10);
  if (v !== k.v) { console.error(k.no + ": dosyalar sayfadaki sürümle (v) uyuşmuyor."); process.exit(1); }
  JSON.parse(j.toString("utf8")); if (p.slice(0, 5).toString() !== "%PDF-") { console.error(k.no + ".pdf geçersiz."); process.exit(1); }
  fs.writeFileSync(path.join(hedef, k.no + ".json.bin"), sifrele(zlib.gzipSync(j, { level: 9 })));
  fs.writeFileSync(path.join(hedef, k.no + ".pdf.bin"), sifrele(p));
  yazilan.add(k.no + ".json.bin"); yazilan.add(k.no + ".pdf.bin");
}
for (const f of fs.readdirSync(hedef)) if (!yazilan.has(f)) fs.unlinkSync(path.join(hedef, f));
console.log(liste.length + " kanun şifrelendi (kanun/).");
