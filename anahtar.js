#!/usr/bin/env node
/* Parolayı belirler ya da değiştirir: yeni bir anahtar çifti üretir, özel anahtarı paroladan türetilen anahtarla şifreler.
   Kullanım: node anahtar.js "<parola>"   → kilit.json ve acik.pem yazılır. Ardından: node yap.js <sayfa-govdesi.html>
   Parola değişince eski parolayı bilenler yeni içeriği açamaz. Parolayı bu depoya YAZMAYIN. */
const crypto = require("crypto"), fs = require("fs"), path = require("path");
const parola = process.argv[2];
if (!parola || parola.length < 8) { console.error("Parola en az 8 karakter olmalı."); process.exit(1); }
const TUR = 600000;
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const pkcs8 = privateKey.export({ type: "pkcs8", format: "der" });
const tuz = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const anahtar = crypto.pbkdf2Sync(Buffer.from(parola.normalize("NFC"), "utf8"), tuz, TUR, 32, "sha256");
const c = crypto.createCipheriv("aes-256-gcm", anahtar, iv);
const sifreli = Buffer.concat([c.update(pkcs8), c.final(), c.getAuthTag()]);
const acik = publicKey.export({ type: "spki", format: "pem" });
const kimlik = crypto.createHash("sha256").update(acik).digest("hex").slice(0, 16);
fs.writeFileSync(path.join(__dirname, "kilit.json"), JSON.stringify({ v: 1, kimlik, tur: TUR, tuz: tuz.toString("base64"), iv: iv.toString("base64"), ozel: sifreli.toString("base64") }) + "\n");
fs.writeFileSync(path.join(__dirname, "acik.pem"), acik);
console.log("kilit.json ve acik.pem yazıldı; anahtar kimliği", kimlik);
