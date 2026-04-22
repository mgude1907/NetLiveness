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

            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                // Kullanıcının belirttiği güncelleme merkezi
                var updateUrl = "http://191.168.6.101/updates/version.json";
                var response = await client.GetFromJsonAsync<RemoteUpdateInfo>(updateUrl);

                if (response != null && response.Version != currentVersion)
                {
                    return Ok(new
                    {
                        HasUpdate = true,
                        CurrentVersion = currentVersion,
                        LatestVersion = response.Version,
                        ReleaseDate = response.Date,
                        Changelog = response.Changelog,
                        DownloadUrl = response.DownloadUrl
                    });
                }
            }
            catch (Exception ex)
            {
                // Uzak sunucuya erişilemiyorsa veya dosya yoksa sessizce hata dön
                return Ok(new { HasUpdate = false, CurrentVersion = currentVersion, Error = "Güncelleme sunucusuna erişilemedi." });
            }

            return Ok(new { HasUpdate = false, CurrentVersion = currentVersion });
        }

        [HttpPost("install")]
        public async Task<IActionResult> InstallUpdate([FromBody] InstallRequest request)
        {
            try
            {
                var scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "update.ps1");

                // Profesyonel Update Scripti - Servisleri bilen yapıda
                var psScript = $@"
                    Write-Host 'NetLiveness Güncellemesi Başlatılıyor...' -ForegroundColor Cyan
                    Start-Sleep -Seconds 2
                    
                    # 1. Servisleri Durdur
                    Write-Host 'Servisler durduruluyor...'
                    sc.exe stop NetLiveness_API
                    sc.exe stop NetLiveness_Worker
                    Start-Sleep -Seconds 5
                    
                    # 2. İndirme ve Çıkarma
                    Write-Host 'Yeni sürüm indiriliyor: {request.DownloadUrl}'
                    $zipFile = 'temp_update.zip'
                    try {{
                        Invoke-WebRequest -Uri '{request.DownloadUrl}' -OutFile $zipFile
                        Write-Host 'Dosyalar çıkarılıyor...'
                        Expand-Archive -Path $zipFile -DestinationPath '.\' -Force
                        Remove-Item $zipFile
                    }} catch {{
                        Write-Host 'Hata: Güncelleme dosyası indirilemedi!' -ForegroundColor Red
                        sc.exe start NetLiveness_API
                        exit
                    }}
                    
                    # 3. Servisleri Başlat
                    Write-Host 'Güncelleme tamamlandı, servisler başlatılıyor...'
                    sc.exe start NetLiveness_API
                    sc.exe start NetLiveness_Worker
                    
                    Write-Host 'Sistem başarıyla güncellendi.' -ForegroundColor Green
                ";

                await System.IO.File.WriteAllTextAsync(scriptPath, psScript);

                // Bağımsız süreçte çalıştır
                Process.Start(new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-ExecutionPolicy Bypass -File \"{scriptPath}\"",
                    UseShellExecute = true,
                    CreateNoWindow = false // Kullanıcı görsün ne olduğunu
                });

                // Versiyonu güncelle
                var settings = await _context.Set<AppSettings>().FirstOrDefaultAsync();
                if (settings != null) settings.AppVersion = request.LatestVersion;

                // Geçmişe ekle
                _context.SystemUpdates.Add(new SystemUpdate
                {
                    Version = request.LatestVersion,
                    Description = "Sürüm Notları:\n" + string.Join("\n", request.Changelog),
                    DateInstalled = DateTime.Now
                });

                await _context.SaveChangesAsync();

                return Ok(new { message = "Güncelleme komutu başarıyla gönderildi. Servisler birkaç saniye içinde yeniden başlayacak." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Güncelleme başlatılamadı: {ex.Message}");
            }
        }
    }

    public class RemoteUpdateInfo
    {
        public string Version { get; set; } = "";
        public string Date { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
        public string[] Changelog { get; set; } = Array.Empty<string>();
    }

    public class InstallRequest
    {
        public string LatestVersion { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
        public string[] Changelog { get; set; } = Array.Empty<string>();
    }
}
