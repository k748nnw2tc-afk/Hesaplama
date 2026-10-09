#!/usr/bin/env node
/* Claude'daki sayfa gövdesinden (sarmalayıcılı ya da sarmalayıcısız HTML) şifreli web uygulaması içeriğini üretir.
   Kullanım: node yap.js <sayfa.html>
   Yazdıkları: icerik.json (şifreli sayfa) ve sw.js içindeki SURUM. Parola GEREKMEZ: içerik, acik.pem'deki açık anahtarla
   sarılan rastgele bir anahtarla şifrelenir; yalnızca parolayı bilen (kilit.json'daki özel anahtarı açabilen) çözebilir.
   Bu depoya şifresiz sayfa (düz index.html içeriği) ASLA konmaz. */
const crypto = require("crypto"), fs = require("fs"), path = require("path");
const D = __dirname, kaynakYol = process.argv[2];
if (!kaynakYol) { console.error("Kullanım: node yap.js <sayfa.html>"); process.exit(1); }
let k = fs.readFileSync(kaynakYol, "utf8");
const i = k.indexOf("<title>"); if (i < 0) { console.error("<title> bulunamadı."); process.exit(1); }
k = k.slice(i).replace(/\s*<\/body>\s*<\/html>\s*$/, "");
for (const p of ['id="giris"', 'id="p-ana"', 'id="yazi-tipleri"', "var VERI_TARIHI", "window.__girisAtla", 'class="taban"'])
  if (!k.includes(p)) { console.error("Eksik bölüm: " + p); process.exit(1); }
const t = k.indexOf("</title>") + "</title>".length, j = k.indexOf('<div class="giris"');
const bas = k.slice(0, t), kafa = k.slice(t, j); let govde = k.slice(j);
for (const [uzak, yerel] of [["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf.umd.min.js"],
                             ["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js", "jspdf.plugin.autotable.min.js"]]) {
  if (!govde.includes(uzak)) { console.error("Kitaplık etiketi bulunamadı: " + uzak); process.exit(1); }
  govde = govde.replace(uzak, yerel);
}
const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#1c1a19">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Atıl Hukuk">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="favicon.png">
${bas.trim()}
<style>html{box-sizing:border-box;background:#1c1a19}body{margin:0;padding:0}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>
${kafa.trim()}
</head>
<body>
${govde.trim()}
</body>
</html>
`;
const acik = fs.readFileSync(path.join(D, "acik.pem"), "utf8"), kilit = JSON.parse(fs.readFileSync(path.join(D, "kilit.json"), "utf8"));
const kimlik = crypto.createHash("sha256").update(acik).digest("hex").slice(0, 16);
if (kimlik !== kilit.kimlik) { console.error("acik.pem ile kilit.json birbirine ait değil."); process.exit(1); }
const ic = crypto.randomBytes(32), iv = crypto.randomBytes(12);
const c = crypto.createCipheriv("aes-256-gcm", ic, iv);
const veri = Buffer.concat([c.update(Buffer.from(html, "utf8")), c.final(), c.getAuthTag()]);
const sarili = crypto.publicEncrypt({ key: acik, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, ic);
const tarih = (html.match(/var VERI_TARIHI = "([0-9-]+)"/) || [])[1] || "";
fs.writeFileSync(path.join(D, "icerik.json"), JSON.stringify({ v: 1, kimlik, tarih, anahtar: sarili.toString("base64"), iv: iv.toString("base64"), veri: veri.toString("base64") }) + "\n");
const swYol = path.join(D, "sw.js"), surum = crypto.createHash("sha256").update(html).digest("hex").slice(0, 12);
fs.writeFileSync(swYol, fs.readFileSync(swYol, "utf8").replace(/var SURUM = "[^"]*";/, 'var SURUM = "' + surum + '";'));
console.log("icerik.json yazıldı:", veri.length, "bayt şifreli; VERI_TARIHI", tarih, "; sürüm", surum);
