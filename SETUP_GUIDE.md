# NetLiveness Kurulum Klavuzu (Yeni Bilgisayar)

Bu proje, modern bir kurumsal izleme ve rehber sistemidir. Projeyi farklı bir bilgisayarda (ev/ofis) çalıştırmak için aşağıdaki adımları takip edin.

### 📋 Ön Gereksinimler
Sistemde şunların kurulu olduğundan emin olun:
1.  **Node.js (v18+):** [nodejs.org](https://nodejs.org/)
2.  **.NET 8 SDK:** [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/8.0)
3.  **Git:** [git-scm.com](https://git-scm.com/)

---

### 🚀 Adım Adım Kurulum

#### 1. Projeyi GitHub'dan İndirin
Terminali açın ve projeyi kopyalamak istediğiniz klasöre gidin:
```bash
git clone https://github.com/mgude1907/NetLiveness.git
cd NetLiveness
```

#### 2. Frontend (Arayüz) Kurulumu
```bash
cd netliveness-frontend
npm install
# Çalıştırmak için:
npm run dev
```

#### 3. Backend (API) ve Veritabanı Kurulumu
Yeni bir terminal açın ve şu komutları izleyin:
```bash
cd NetLiveness.Api
dotnet restore

# Veritabanı Şemasını Oluşturma (İlk sefere mahsus):
dotnet ef database update

# API'yi Çalıştırmak için:
dotnet run
```

#### 4. Monitor Worker (İzleme Servisi) Kurulumu
Yeni bir terminal açın:
```bash
cd NetLiveness.MonitorWorker
dotnet restore
dotnet run
```

---

### 💡 Önemli Notlar

*   **Veri Taşıma:** GitHub yedeği sadece kodları içerir. İş bilgisayarınızdaki gerçek personel veya anket verilerini de taşımak isterseniz; iş bilgisayarınızdaki `NetLiveness.Api/netliveness_v2.db` dosyasını yeni bilgisayarınızdaki aynı klasöre kopyalamanız yeterlidir.
*   **Hata Giderme (EF Core):** Eğer `dotnet ef` komutu bulunamadı hatası alırsanız, şu komutla aracı kurun:
    `dotnet tool install --global dotnet-ef`

---
© 2026 REPKON DIGITAL ECOSYSTEM
