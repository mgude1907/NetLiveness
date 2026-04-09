# Eylem Planı ve Kilometre Taşları (Plan of Action & Milestones - POA&M)
*(NIST SP 800-171 Rev 2 Eksikleri ve Takip Matrisi)*

**Kurum Adı:** REPKON  
**Güncelleme Tarihi:** [Tarih Giriniz]  
**Takip Sorumlusu:** [İsim]  

---

> **Açıklama:** Bu doküman, Sistem Güvenlik Planı'nda (SSP) "Tamamlanmadı" veya "Kısmen Uygulandı" olarak işaretlenen NIST SP 800-171 gereksinimlerinin nasıl ve ne zamana kadar çözüleceğini izlemek için kullanılır. Düzenli olarak (örn: Ayda veya Üç ayda bir) güncellenmelidir.

## Aksiyon Takip Tablosu

| POA&M No | NIST Kuralı | Zafiyet / Eksik Açıklaması | Düzeltme / Planlanan Aksiyon (Mitigation) | Sorumlu Kişi/Departman | Tahmini Bütçe/Kaynak | Planlanan Bitiş Tarihi | Gerçekleşen Bitiş Tarihi | Mevcut Durum |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **001** | *3.1.12* | Uzaktan erişim (VPN) için kullanıcılar yalnızca parola kullanıyor, MFA (İki Adımlı Doğrulama) yok. | Şirket Firewall'u üzerinde MFA yapılandırması etkinleştirilecek ve kullanıcılara Authenticator dağıtılacak. | BT Altyapı | Yok (Mevcut lisans) | `GG.AA.YYYY` | - | `Devam Ediyor` |
| **002** | *3.3.1* | Sunucu logları merkezi bir kaynakta (SIEM) [1] yıldan az tutuluyor. (Şu an 30 gün) | Merkezi Log yönetimi için [Sistem Adı] sipariş edilecek, disk kapasitesi artırılacak. | Bilişim | $ [X.XXX] | `GG.AA.YYYY` | - | `Beklemede` |
| **003** | *3.11.1* | Risk değerlendirme süreçlerimiz yazılı ve formel olarak düzenli yapılmıyor. | Yıllık Siber Güvenlik Risk Analiz Takvimi oluşturulup risk skoru tablosu çıkarılacak. | Kalite / BT | Şirket İçi | `GG.AA.YYYY` | `GG.AA.YYYY` | `Tamamlandı` |
| **004** | *3.8.3* | Şirket geneli satılan donanımların ve eski teçhizatların içindeki verilerin NATO standartlarında güvenli silindiğine dair kanıtımız zayıf. | Disk imha ve Secure Erase makinesi alınarak hurdaya ayrılan cihazlara formel "Disk İmha Formu" uygulanması. | Donanım Sorumlusu | $ [X.XXX] | `GG.AA.YYYY` | - | `Araştırılıyor` |
| **005** | *[Kural]* | [Kendi eksiğinizi buraya yazınız] | [Nasıl düzelteceğinizi yazınız] | [Atanan] | [Bütçe] | `Tarih` | `Tarih` | `Boş` |

---

*Not: Sistemdeki her zayıflık kapatıldığında POA&M tablosundaki durumu "Tamamlandı" yapılarak kapatılan dosyanın kanıtları eklerde saklanmalıdır.*
