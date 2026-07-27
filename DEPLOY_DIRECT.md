# NetLiveness — doğrudan sunucuya yayın (GitHub zorunlu değil)

Kaynak kodu GitHub’da olmak zorunda değil. Önerilen model:

1. Proje **geliştirme bilgisayarınızda** (zip, USB, şirket paylaşımı).
2. Yayın **SSH/rsync** ile Linux sunucuya (veya isteğe bağlı Windows robocopy).
3. Sunucuda **`netliveness_v2.db`** ve **`api/wwwroot/uploads`** deploy sırasında korunur.

---

## Linux sunucu (önerilen)

### Mimari

| Bileşen | Sunucu yolu | Not |
|---------|-------------|-----|
| API + arayüz (wwwroot) | `/opt/netliveness/api` | Port **5006** |
| Monitor Worker | `/opt/netliveness/worker` | Ping/SSH; WMI yalnızca Windows istemcilerde |
| Phishing (Node) | `/opt/netliveness/phishing` | Port **3001**, isteğe bağlı |
| Tray uygulaması | — | Yalnızca Windows masaüstü; Linux sunucuda yok |

### Sunucuda bir kez (root)

Node.js 18+ kurulu olsun. Betikleri sunucuya kopyaladıktan sonra veya repodan:

```bash
sudo bash deploy/linux/bootstrap_server.sh
```

Bu işlem `netliveness` sistem kullanıcısını, `/opt/netliveness` dizinlerini ve **systemd** servislerini hazırlar.

SSH ile şifresiz giriş önerilir (`ssh-copy-id`):

```bash
ssh-copy-id -p 22 netliveness@SUNUCU_IP
```

`netliveness` kullanıcısının `systemctl restart` için sudo yetkisi (örnek `/etc/sudoers.d/netliveness`):

```
netliveness ALL=(ALL) NOPASSWD: /bin/systemctl restart netliveness-api.service netliveness-worker.service netliveness-phishing.service, /bin/systemctl daemon-reload, /bin/systemctl status netliveness-api.service
```

Firewall: **5006** (API/UI), gerekiyorsa **3001** (phishing).

### Geliştirme bilgisayarında (Linux veya WSL)

Depo kökünde:

```bash
cp deploy.env.example deploy.env
nano deploy.env   # DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH
chmod +x deploy/linux/*.sh
./deploy/linux/deploy.sh
```

Betik: frontend + API + worker **linux-x64** derler → `dist/linux` → **rsync** → `systemctl restart`.

Sadece derleme:

```bash
./deploy/linux/build_release.sh
```

### Windows’tan Linux’a deploy

1. **WSL** (Ubuntu) içinde yukarıdaki `deploy.sh` adımları, veya  
2. Git for Windows **Git Bash** + yüklü `rsync`/`ssh` (veya WSL’de rsync).

Geliştirme PC’de .NET 8 SDK ve Node.js WSL içinde kurulu olmalı.

### Linux’ta bilinen sınırlar

- **WMI / dosya izleme / kullanıcı aktivitesi** Windows ajanlarına bağlıdır; worker Linux’ta ping ve SSH ile çalışmaya devam eder.
- İlk veritabanı API ilk çalıştığında `api/netliveness_v2.db` olarak oluşur.

---

## Windows sunucu (isteğe bağlı)

| Geliştirme PC | `deploy.config.example.json` → `deploy.config.json` |
| Yayın | `.\deploy_to_server.ps1` (robocopy + Windows servisleri) |
| Paket | `.\create_package.ps1` → `dist\NetLiveness_Setup` |

Ayrıntı: betik içi yorumlar ve `register_services.ps1`.

---

## GitHub

- Zorunlu değil.
- Kullanırsanız: **private** repo; `.db` ve `deploy.env` asla commit edilmesin.

## Güvenlik

- `deploy.env`, `deploy.config.json`, `dist/` repoda yok.
- Phishing ve API yalnızca **iç ağda** expose edin.

---

Geliştirici kurulumu: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
