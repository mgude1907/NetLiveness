using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Diagnostics;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UpdaterController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public UpdaterController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetUpdateHistory()
        {
            var history = await _context.SystemUpdates.OrderByDescending(u => u.DateInstalled).ToListAsync();
            return Ok(history);
        }

        [HttpGet("check")]
        public async Task<IActionResult> CheckForUpdates()
        {
            var settings = await _context.Set<AppSettings>().FirstOrDefaultAsync();
            var currentVersion = settings?.AppVersion ?? "v1.0.0";

            // Normalde burada httpClient ile Github veya Sunucunuzdaki version.json okunur.
            // Simülasyon için: Eğer versiyon v1.0.0 ise, v1.1.0 güncellemesi var diyelim.
            if (currentVersion == "v1.0.0")
            {
                return Ok(new
                {
                    HasUpdate = true,
                    CurrentVersion = currentVersion,
                    LatestVersion = "v1.1.0",
                    ReleaseDate = DateTime.Now.ToString("dd.MM.yyyy"),
                    Changelog = new[] 
                    {
                        "Şirket Rehberi (Directory) Modülü eklendi.",
                        "Rehber için Excel/CSV İçe ve Dışa aktarma özellikleri getirildi.",
                        "Personel listesiyle Şirket Rehberi otomatik senkronize edildi.",
                        "Audit Log (Sistem İşlem Logları) altyapısı genişletildi.",
                        "WMI Sağlık tarama sistemindeki donma sorunları çözüldü."
                    },
                    DownloadUrl = "https://example.com/api/v1.1.0.zip" // Temsili
                });
            }

            return Ok(new { HasUpdate = false, CurrentVersion = currentVersion });
        }

        [HttpPost("install")]
        public async Task<IActionResult> InstallUpdate([FromBody] InstallRequest request)
        {
            try
            {
                var scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "update.ps1");

                // Update.ps1 Scripting (Gerçek senaryoda web'den zip indirip üzerine yazar)
                // Sistem şu an geliştirme (Dev) ortamında olduğu için dosyaları silmesini engelleyerek sadece simüle ediyoruz.
                var psScript = $@"
                    Write-Host 'Guncelleme baslatiliyor...'
                    Start-Sleep -Seconds 2
                    
                    Write-Host 'NetLiveness API durduruluyor...'
                    # Stop-Process -Name 'NetLiveness.Api' -Force -ErrorAction SilentlyContinue
                    # Gerçek sunucuda burada API durdurulur. Geliştirme ortamında pas geçiyoruz.
                    
                    Start-Sleep -Seconds 3
                    
                    Write-Host 'Dosyalar indiriliyor ({request.DownloadUrl})...'
                    # Invoke-WebRequest -Uri '{request.DownloadUrl}' -OutFile 'update.zip'
                    # Expand-Archive -Path 'update.zip' -DestinationPath '.\' -Force
                    
                    Start-Sleep -Seconds 4
                    Write-Host 'Guncelleme islemi tamamlandi, servis baslatiliyor...'
                    # Start-Process 'dotnet' -ArgumentList 'run' -WindowStyle Hidden
                ";

                await System.IO.File.WriteAllTextAsync(scriptPath, psScript);

                // Asenkron olarak ayrılmış bir process'te çalıştır
                var processInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-ExecutionPolicy Bypass -File \"{scriptPath}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                Process.Start(processInfo);

                // Güncellemeyi Sisteme (Veritabanına) Kaydet
                var settings = await _context.Set<AppSettings>().FirstOrDefaultAsync();
                if (settings != null)
                {
                    settings.AppVersion = request.LatestVersion;
                }

                _context.SystemUpdates.Add(new SystemUpdate
                {
                    Version = request.LatestVersion,
                    Description = "Sürüm Notları:\n" + string.Join("\n", request.Changelog),
                    DateInstalled = DateTime.Now
                });

                _context.Logs.Add(new AuditLogEntry
                {
                    Action = "Sistem Güncellemesi",
                    Details = $"Sistem otomatik olarak {request.LatestVersion} sürümüne güncellendi.",
                    Operator = "Sistem/Updater",
                    Date = DateTime.Now
                });

                await _context.SaveChangesAsync();

                return Ok(new { message = "Güncelleme komut dosyası tetiklendi. Sistem birkaç saniye içinde yeniden başlayacak." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Güncelleme başlatılamadı: {ex.Message}");
            }
        }
    }

    public class InstallRequest
    {
        public string LatestVersion { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
        public string[] Changelog { get; set; } = Array.Empty<string>();
    }
}
