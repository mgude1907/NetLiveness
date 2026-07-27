# NetLiveness — doğrudan sunucuya yayın (GitHub zorunlu değil)

Kurumsal ortamda kaynak kodu **GitHub’da tutmak zorunda değilsiniz**. Önerilen model:

1. Proje yalnızca **geliştirme bilgisayarınızda** (veya şirket içi ağ paylaşımında) durur.
2. Yayın: `deploy_to_server.ps1` ile **doğrudan sunucuya** kopyalanır.
3. Sunucuda kalıcı veriler (`netliveness_v2.db`, `wwwroot/uploads`) deploy sırasında **silinmez**.

## Ön koşullar

| Nerede | Gereksinim |
|--------|------------|
| Geliştirme PC | .NET 8 SDK, Node.js 18+, Windows PowerShell |
| Sunucu | Windows Server veya Windows 10/11, .NET çalışma zamanı gerekmez (self-contained publish) |
| Ağ | Admin paylaşımı (`\\SUNUCU\C$...`) veya dosya paylaşımı; yönetici yetkisi |

Sunucuda ilk kurulumda **WinRM** açıksa `-RegisterServicesOnServer` ile servis kaydı uzaktan yapılabilir; değilse paketi kopyaladıktan sonra sunucuda `register_services.ps1` çalıştırın.

## Tek seferlik yapılandırma

Depo kökünde:

```powershell
Copy-Item deploy.config.example.json deploy.config.json
notepad deploy.config.json
```

`ServerHost` ve `RemoteInstallPath` değerlerini kendi sunucunuza göre düzenleyin.  
`deploy.config.json` **Git’e eklenmez** (yerel / gizli kalır).

Sunucuya ilk kez bağlanırken yönetici paylaşımı için oturum açmış olmanız gerekir (ör. `\\191.168.6.101\C$` erişimi).

## Her yayın (deploy)

Geliştirme bilgisayarında, depo kökünde **Yönetici PowerShell**:

```powershell
.\deploy_to_server.ps1
```

Bu betik sırasıyla:

1. `create_package.ps1` — frontend build, API/Worker/Tray publish → `dist\NetLiveness_Setup`
2. Uzaktaki servisleri durdurur (yapılandırmada açıksa)
3. `robocopy` ile sunucuya kopyalar (`netliveness_v2.db` ve `uploads` hariç)
4. Servisleri yeniden başlatır

Sadece kopyalamak (derleme yapılmış paket varsa):

```powershell
.\deploy_to_server.ps1 -SkipBuild
```

İlk kurulumda servis kaydı (WinRM gerekir):

```powershell
.\deploy_to_server.ps1 -RegisterServicesOnServer
```

WinRM yoksa sunucuda Yönetici olarak:

```powershell
cd "C:\Program Files\NetLiveness"
.\register_services.ps1 -InstallRoot "C:\Program Files\NetLiveness"
sc.exe start NetLiveness_API
sc.exe start NetLiveness_Worker
```

## Sadece paket oluşturma (USB / manuel kopya)

```powershell
.\create_package.ps1
```

Çıktı: `dist\NetLiveness_Setup` — klasörü USB veya RDP ile sunucuya taşıyıp `Kurulum_Baslat.bat` da kullanılabilir.

## GitHub ne olacak?

- **Zorunlu değil** — projeyi zip veya şirket içi NAS’ta da tutabilirsiniz.
- GitHub kullanırsanız: **private** repo, sırlar ve `.db` dosyaları asla commit edilmesin; sunucu verisi yalnızca sunucuda kalsın.
- Eski public commit’lerde hassas dosya kaldıysa: parola rotasyonu + isteğe bağlı `git filter-repo`.

## Güvenlik özeti

- `deploy.config.json` ve `dist/` yerelde kalır, repoya girmez.
- API kimlik bilgileri ve SMTP şifreleri yalnızca çalışma zamanında (veritabanı / ortam değişkenleri), repoda değil.
- Phishing modülü yalnızca iç ağda çalıştırılmalıdır.

---

Ayrıntılı geliştirici kurulumu için: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
