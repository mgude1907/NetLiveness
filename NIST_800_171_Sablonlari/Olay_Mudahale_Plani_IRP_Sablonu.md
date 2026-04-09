# Olay Müdahale Planı (Incident Response Plan - IRP)
*(NIST SP 800-171 Rev 2 Uyumlu)*

**Kurum Adı:** REPKON  
**Doküman Sürümü:** 1.0  
**Tarih:** [Tarih Giriniz]  

---

## 1. Olay Müdahale Ekibi (CSIRT)
| Görev/Rol | İsim | İletişim Numarası | E-Posta |
| --- | --- | --- | --- |
| Olay Yöneticisi | [Bilişim Müdürü] | | |
| Teknik Olay Sorumlusu | [Güvenlik / Sistem Uzmanı] | | |
| İletişim Sorumlusu | [Kurumsal İletişim / Hukuk] | | |

## 2. Olay Tanımları ve Seviyelendirme
Aşağıdakiler güvenlik ihlali veya olayı olarak kabul edilir:
- **Düşük (Low):** Bireysel kötü amaçlı yazılım tespiti (Antivirüs engelledi), şüpheli spam vb.
- **Orta (Medium):** Hesap ele geçirme teşebbüsleri, yerel sistem anormallikleri.
- **Yüksek (High):** Veri sızıntısı (CUI maruz kalması), fidye yazılımı (Ransomware) enfeksiyonu, sistemlerin devre dışı kalması.

## 3. Olay Müdahale Aşamaları
### 3.1. Hazırlık (Preparation)
Olaylara zamanında müdahale için log sistemleri, yedeklemeler ve iletişim kanalları sürekli ayakta tutulur. Yılda en az [X] kez olay müdahale tatbikatı yapılacaktır.

### 3.2. Tespit ve Analiz (Detection & Analysis)
Potansiyel ihlaller SIEM üzerinden veya kullanıcı bildirimleriyle incelenir. İhlal tespit edilirse sistem loglarına (Firewall, AD) bakılarak olayın kapsamı belirlenir.

### 3.3. Sınırlandırma (Containment)
- Zarar gören veya risk altındaki sistem derhal ağdan izole edilecektir (Fiziksel koparma veya Firewall bloklaması).
- Şifreler hemen sıfırlanacaktır.

### 3.4. Yok Etme ve Kurtarma (Eradication & Recovery)
- Kötü amaçlı yazılım veya sızılan açık kapatılır.
- Sistem son sağlam yedeğe (Backup) çekilerek tekrar ayağa kaldırılır.
- Yeniden başlatılan sistemlerde anomali izlemesi %100 kapasiteyle yapılır.

### 3.5. Olay Sonrası Analiz (Post-Incident Activity)
- Olayın neden yaşandığı (Kök Neden Analizi - Root Cause Analysis) belgelenir.
- Bir daha yaşanmaması için teknolojik (Yazılım, Kural) veya prosedürel dersler POA&M (Eylem Planı) dökümanına eklenir.

## 4. Olay Bildirim Zorunluluğu
Eğer dışarıya açık bir Kontrollü Sınıflandırılmamış Bilgi (CUI) ihlali tespit edildiyse, durumu [Kamu/Bağlı Kuruluş Adı]'na **[Örn: 72]** saat içerisinde yasal olarak raporlamakla yükümlüyüz.

---
*Acil Durum İşlem Akışı Onayı:*
___________________________
