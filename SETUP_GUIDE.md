# NetLiveness Kurulum Klavuzu

Kurumsal izleme ve rehber sistemi. **Üretim sunucusuna yayın için GitHub gerekmez** — bkz. [DEPLOY_DIRECT.md](./DEPLOY_DIRECT.md).

### 📋 Ön Gereksinimler
1.  **Node.js (v18+)**
2.  **.NET 8 SDK**
3.  **Git** — yalnızca kaynak kodu başka bir PC’ye taşımak isterseniz (isteğe bağlı)

---

### 🚀 Geliştirme ortamı (yerel)

Projeyi bir klasöre kopyalayın (USB, zip, şirket paylaşımı veya isteğe bağlı `git clone`).

#### Frontend
```bash
cd netliveness-frontend
npm install
npm run dev
```

#### Backend (API)
```bash
cd NetLiveness.Api
dotnet restore
dotnet ef database update
dotnet run
```

#### Monitor Worker
```bash
cd NetLiveness.MonitorWorker
dotnet restore
dotnet run
```

Hızlı başlatma (Windows): `.\run_all.ps1`

---

### 🖥️ Sunucuya doğrudan deploy (önerilen)

Geliştirme bilgisayarından:

**Linux sunucu (önerilen):** [DEPLOY_DIRECT.md](./DEPLOY_DIRECT.md) — `deploy/linux/deploy.sh`

**Windows sunucu:**

```powershell
Copy-Item deploy.config.example.json deploy.config.json
.\deploy_to_server.ps1
```

---

### 📦 Windows kurulum paketi (Tray + Phishing)

```powershell
.\create_package.ps1
```

Çıktı: `dist\NetLiveness_Setup`. Tray örnek yapılandırma: `NetLiveness_Setup/TrayApp/config.example.json`.

---

### 💡 Önemli Notlar

*   **Veri:** `netliveness_v2.db` ve `wwwroot/uploads` sunucuda kalır; deploy betiği bunları üzerine yazmaz.
*   **EF Core:** `dotnet tool install --global dotnet-ef`

---
© 2026 REPKON DIGITAL ECOSYSTEM
