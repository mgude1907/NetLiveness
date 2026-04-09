# Kapsamlı Bilgi Güvenliği ve Erişim Politikası
*(NIST SP 800-171 Rev 2 - Temel Güvenlik Politikası)*

**Kurum Adı:** REPKON  
**Doküman Sürümü:** 1.0  
**Tarih:** [Tarih Giriniz]  
**Hazırlayan:** [İsim/Unvan]  
**Onaylayan:** [Yönetim Onayı]  

---

## 1. Amaç
Bu politikanın amacı, kurumumuzdaki Kontrollü Sınıflandırılmamış Bilgilerin (CUI) güvenliğini, gizliliğini ve bütünlüğünü korumak için NIST SP 800-171 Rev. 2 standartlarına uygun yönetmelikleri belirlemektir.

## 2. Kapsam (Scope)
Bu politika, CUI verilerini işleyen, depolayan veya ileten tüm sistemleri, personeli, yüklenicileri ve 3. taraf hizmet sağlayıcıları kapsar.

## 3. Erişim Kontrolü (Access Control - 3.1)
- **Mantıksal Erişim:** Bilgi sistemlerine erişim, yalnızca yetkili kullanıcılarla, yetkili oldukları işlemlerle sınırlandırılacaktır.
- **En Az Ayrıcalık Prensibi:** Kullanıcılara yalnızca görevlerini yerine getirmek için gereken minimum yetkiler verilir.
- **Oturum Yönetimi:** Sistemler [X] dakika işlem yapılmadığında otomatik olarak oturumu kilitleyecek veya sonlandıracaktır.
- **Uzaktan Erişim:** Uzaktan erişim için çok faktörlü kimlik doğrulama (MFA) ve şifreli bağlantı (VPN) kullanılması zorunludur.

## 4. Kimlik Doğrulama (Identification and Authentication - 3.5)
- **Kullanıcı Tanımlaması:** Ortak veya genel parolasız hesaplar (Guest vb.) kullanılamaz. Tüm hesaplar kişiye özeldir.
- **MFA (Çok Faktörlü Kimlik Doğrulama):** Ağa uzaktan bağlanan yerel ve ayrıcalıklı hesaplar için MFA uygulanır.
- **Parola Politikası:** Parolalar en az [X] karakter olmalı, [X] günde bir değiştirilmeli ve karmaşıklık kuralları uygulanmalıdır.

## 5. Medya Koruması (Media Protection - 3.8)
- CUI içeren tüm taşınabilir medya cihazları (USB, Harici Disk vb.) kriptolanmalıdır.
- Medyalar kullanılmadıklarında kilitli dolaplarda fiziksel olarak korunmalıdır.
- Medya imha süreci standartlara uygun olarak [İmha Yöntemi] kullanılarak yapılmalıdır.

## 6. Fiziksel Güvenlik (Physical Protection - 3.10)
- Tesis içerisindeki kritik sistem odalarına erişim loglanacak ve fiziksel erişim kontrol sistemleri (Kart/Biyometrik) kullanılacaktır.
- Ziyaretçilere daima yetkili personel eşlik etmelidir. Ziyaretçi günlükleri en az [X] yıl saklanacaktır.

## 7. Sistem ve İletişim Koruması (System and Communications - 3.13)
- Ağ sınırları ve kritik sistem katmanları güvenlik duvarları (Firewall) ile izole edilmelidir.
- CUI içeren verilerin ağ dışına iletimi şifreli protokollerle (TLS, SSH) yapılmalıdır.
- Kullanıcıların dışa açık/web erişimleri izlenecek ve [Filtreleme Çözümü] ile filtrelenecektir.

---
*İmza / Onay:* 
___________________________
