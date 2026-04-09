# Sistem Güvenlik Planı (System Security Plan - SSP)
*(NIST SP 800-171 Rev 2 Uyumlu)*

**Kurum:** REPKON  
**Sistem Adı:** [Kapsamdaki Sistem/Proje Adı]  
**Plan Sürümü:** 1.0  
**Tarih:** [Tarih Giriniz]  

---

## 1. Sistem Açıklaması
**1.1. Sistemin Amacı:**  
[Sistemin hangi süreçlerde kullanıldığına dair iş amacı buraya eklenecektir.]

**1.2. Sistem Mimarisi (Topoloji Özeti):**  
[Veritabanları, sunucular, switchler veya bulut bileşenleri dahil sistem alanları buraya yazılır. Varsa ek doküman referansı verilir.]

## 2. Sistem Yetkilileri ve İletişim
| Rol | İsim | E-Posta / Telefon |
| --- | --- | --- |
| Sistem Sahibi | [Yönetici] | |
| Güvenlik Yöneticisi | [Bilişim Sorumlusu] | |
| BT İrtibatı | [Teknik Personel] | |

## 3. Donanım ve Yazılım Envanteri Özeti
| Bileşen Tipi | İşletim Sistemi / Marka | Lokasyon / IP | Temel İşlev |
| --- | --- | --- | --- |
| Sunucu | [Örn: Windows Server 2022] | [Örn: VM-Host 1] | Active Directory & File Server |
| Ağ Cihazı | [Örn: Fortinet FW] | [Örn: Veri Merkezi] | Firewall & VPN Gateway |

## 4. Güvenlik Kontrollerinin Uygulanması (NIST 3.1 - 3.14)

*(NOT: Aşağıdaki her bir madde için mevcut durumunuzu, kullandığınız araçları veya eksikleri açıklayınız.)*

### 3.1. Erişim Kontrolü (Access Control)
**Mevcut Durum / Uygulama Yöntemi:**
[Örn: Active Directory Grup Politikaları ile departman bazlı kısıtlamalar yapılmıştır. VPN erişiminde IPSec kullanılmaktadır...]

### 3.2. Farkındalık ve Eğitim (Awareness and Training)
**Mevcut Durum / Uygulama Yöntemi:**
[Örn: Personeller işe girişte siber güvenlik eğitimi alır. Yılda bir kez CUI işleme eğitimi tekrarlanır...]

### 3.3. Denetim ve Kayıt Tutma (Audit and Accountability)
**Mevcut Durum / Uygulama Yöntemi:**
[Örn: Güvenlik logları merkezi bir SIEM sistemine gönderilir. Loglar 1 yıl boyunca saklanmaktadır...]

### 3.4. Yapılandırma Yönetimi (Configuration Management)
**Mevcut Durum / Uygulama Yöntemi:**
[Örn: Yazılım güncellemeleri aylık periyotlarla WSUS üzerinden dağıtılır. Sunucu konfigürasyon değişiklikleri onay prosedürüne tabidir...]

### 3.5. Kimlik Doğrulama (Identification and Authentication)
**Mevcut Durum / Uygulama Yöntemi:**
[Örn: Tüm kullanıcılara Office 365 MFA ve VPN için 2FA entegre edilmiştir...]

*(Şablonda diğer başlıkları (3.6'dan 3.14'e kadar) kendi süreçlerinize göre detaylandırmaya devam ediniz.)*
