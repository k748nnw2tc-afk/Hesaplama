# Atıl Hukuk Hesaplama Araçları – web uygulaması

Bu depo, https://hesaplama.atilhukuk.com.tr adresindeki parola korumalı web uygulamasının dosyalarını barındırır (GitHub Pages, `gh-pages` dalı). Depo herkese açıktır; sayfanın kendisi yalnızca **şifrelenmiş** olarak (`icerik.json`) durur. Parola ve sayfanın açık hali bu depoda **yoktur** ve buraya asla konmamalıdır.

## Parçalar

| Dosya | Görevi |
| --- | --- |
| `index.html` | Açılış / parola ekranı. Parolayı sorar, `icerik.json`'ı tarayıcıda çözer, "Devam et" ile uygulamayı açar. |
| `icerik.json` | Hesaplama sayfasının şifrelenmiş hali. Her güncellemede yeniden üretilir. |
| `kilit.json` | Parolayla korunan özel anahtar. Yalnızca parola değişince yeniden üretilir. |
| `acik.pem` | Şifrelemede kullanılan açık anahtar (gizli değildir). |
| `yap.js` | `node yap.js <sayfa.html>` → `icerik.json`'ı üretir, içerik değiştiyse `sw.js` sürümünü yeniler. Parola gerektirmez. |
| `anahtar.js` | `node anahtar.js "<yeni parola>"` → yeni `kilit.json` ve `acik.pem`. **Parolayı değiştirir; eski parola herkes için geçersiz olur.** Ardından `yap.js` yeniden çalıştırılmalıdır. |
| `sw.js`, `manifest.webmanifest`, simgeler, `acilis-*.png` | Telefona kurulum, çevrimdışı çalışma ve iPhone açılış görselleri. |
| `jspdf*.js` | PDF rapor için kitaplıklar (yerel kopya). |
| `CNAME` | Alan adı ayarı (`hesaplama.atilhukuk.com.tr`). Silinmemelidir. |

## Sayfanın asıl kaynağı

Hesaplama sayfasının asıl kaynağı, sahibinin Claude hesabındaki **"Atıl Hukuk Hesaplama Araçları"** adlı yayımlanmış sayfadır (artifact): `https://claude.ai/artifact/4qNCCEtQwLvZLKnxU8vmgy`. Tek dosyalık bir HTML sayfasıdır; bütün veriler (tarifeler, oranlar, endeksler) ve hesap kuralları içindeki JavaScript'e gömülüdür. Web uygulaması bu sayfanın şifrelenmiş kopyasıdır.

## Güncelleme nasıl yapılır

1. Claude'daki sayfayı oku (Artifact aracı, `read`), kaydedilen dosyadan `<title>` satırından son `</body>` öncesine kadar olan bölümü al (başındaki sarmalayıcıyı çıkar).
2. Değişikliği bu dosyada yap ve aynı artifact bağlantısına yeniden yayımla (`capabilities`, `icon`, `title` gönderme).
3. Bu depoyu klonla (`gh-pages`), depo klasöründe `node yap.js <o dosyanın yolu>` çalıştır. Açık HTML dosyasını depo klasörüne koyma.
4. `git status` yalnızca `icerik.json` ve (içerik değiştiyse) `sw.js` göstermeli. Commit et ve `git push origin gh-pages`.

Açılış / parola ekranında değişiklik gerekiyorsa `index.html` düzenlenir; iPhone açılış görselleri (`acilis-*.png`) bu ekranın görüntüsünden üretilmiştir, ekranın düzeni değişirse yeniden üretilmelidir.

## Günlük otomatik güncelleme

Sahibinin Claude hesabında **"Atıl Hukuk hesaplama günlük güncelleme"** adlı zamanlanmış görev her sabah 08:52'de (İstanbul) altı hesaplama sekmesinin dayandığı verileri kaynaklardan kontrol eder, Claude'daki sayfayı yeniden yayımlar ve yukarıdaki 3–4. adımlarla bu depoyu günceller ("Günlük veri güncellemesi GG.AA.YYYY" commit'leri).

Görevin bu depoya yazabilmesi için, depoya erişimi olan bir Claude oturumundan oluşturulmuş olması gerekir. Görev yeniden kurulacaksa önce depo o oturuma yazma yetkisiyle eklenmeli, görev ondan sonra oluşturulmalıdır.

## Dikkat

- Parolayı, özel anahtarı ya da sayfanın açık halini bu depoya koymayın.
- `anahtar.js` yalnızca parola bilerek değiştirilecekse çalıştırılır.
- Depo geçmişinde eski şifreli sürümler kalır; parola zayıfsa bu sürümler de açılabilir.
