using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using NetLiveness.Api.Services;
using System.Diagnostics;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PersonnelIntegrationService _integrationService;
        private readonly IGlpiService _glpiService;

        public SettingsController(AppDbContext context, PersonnelIntegrationService integrationService, IGlpiService glpiService)
        {
            _context = context;
            _integrationService = integrationService;
            _glpiService = glpiService;
        }

        [HttpGet]
        public async Task<ActionResult<AppSettings>> GetSettings()
        {
            var settings = await _context.Settings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new AppSettings { Id = 1 };
                _context.Settings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return settings;
        }

        [HttpPut]
        public async Task<IActionResult> PutSettings(AppSettings settings)
        {
            var current = await _context.Settings.FirstOrDefaultAsync();
            if (current == null)
            {
                settings.Id = 1;
                _context.Settings.Add(settings);
            }
            else
            {
                settings.Id = current.Id;
                _context.Entry(current).CurrentValues.SetValues(settings);
            }

            var logoStatus = string.IsNullOrEmpty(settings.AppLogo) ? "Boş" : $"{settings.AppLogo.Length} karakter";
            System.IO.File.AppendAllText("system_logs.txt", $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [Info] Ayarlar Güncellendi. Logo Boyutu: {logoStatus}\n");

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "SETTINGS_UPDATED", Details = "Sistem genel ayarları güncellendi", Operator = operatorInfo, Category = "SYSTEM" });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("health")]
        public async Task<ActionResult> GetHealth()
        {
            var status = new
            {
                api = "Çalışıyor",
                worker = IsWorkerRunning() ? "Çalışıyor" : "Durduruldu",
                database = await CheckDatabase() ? "Bağlı" : "Hata",
                timestamp = DateTime.Now
            };
            return Ok(status);
        }

        private bool IsWorkerRunning()
        {
            // Hem .exe hem de dotnet run (dotnet.exe) durumlarını kontrol et
            var processes = Process.GetProcesses();
            return processes.Any(p => p.ProcessName.Contains("NetLiveness.MonitorWorker", StringComparison.OrdinalIgnoreCase));
        }

        private async Task<bool> CheckDatabase()
        {
            try { return await _context.Database.CanConnectAsync(); }
            catch { return false; }
        }

        [HttpPost("start-worker")]
        public ActionResult StartWorker()
        {
            if (IsWorkerRunning()) return BadRequest("Worker zaten çalışıyor.");

            try
            {
                var workerPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "NetLiveness.MonitorWorker");
                var proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "dotnet",
                        Arguments = "run",
                        WorkingDirectory = workerPath,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                proc.Start();
                return Ok(new { message = "Worker başlatma komutu gönderildi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Worker başlatılamadı: {ex.Message}");
            }
        }

        [HttpPost("restart")]
        public async Task<ActionResult> Restart([FromServices] Microsoft.Extensions.Hosting.IHostApplicationLifetime lifetime)
        {
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "SYSTEM_RESTART", Details = "Yönetici tarafından sistem yeniden başlatma/kapatma komutu gönderildi", Operator = operatorInfo, Category = "SYSTEM" });
            await _context.SaveChangesAsync();

            try 
            {
                System.IO.File.AppendAllText("system_logs.txt", $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [Warning] Sistem {operatorInfo} tarafından yeniden başlatılıyor...\n");
            } catch {}

            _ = Task.Run(async () =>
            {
                await Task.Delay(1000);
                lifetime.StopApplication();
            });
            return Ok(new { message = "Sunucuya yeniden başlatma komutu iletildi. Sunucu kapanıp servis yöneticisi tarafından tekrar açılacaktır." });
        }

        [HttpPost("test-personnel-connection")]
        public async Task<ActionResult> TestPersonnelConnection([FromBody] AppSettings settings)
        {
            var (success, message) = await _integrationService.TestConnectionAsync(settings);
            if (success) return Ok(new { message });
            return BadRequest(new { message });
        }

        [HttpPost("test-glpi-connection")]
        public async Task<ActionResult> TestGlpiConnection([FromBody] AppSettings settings)
        {
            var (success, message) = await _glpiService.TestConnectionAsync(settings);
            if (success) return Ok(new { message });
            return BadRequest(new { message });
        }

        [HttpPost("sync-glpi-inventory")]
        public async Task<ActionResult> SyncGlpiInventory()
        {
            var (success, count, matchedCount) = await _glpiService.SyncInventoryAsync();
            if (success)
            {
                var message = matchedCount > 0 
                    ? $"GLPI senkronizasyonu tamamlandı. Toplam {count} varlık işlendi, {matchedCount} cihaz personellerle otomatik eşleştirildi."
                    : $"GLPI senkronizasyonu tamamlandı. {count} varlık işlendi (personel eşleşmesi bulunamadı).";

                return Ok(new { message, count, matchedCount });
            }
            return BadRequest(new { message = "GLPI senkronizasyonu başarısız oldu. GLPI bağlantı ayarlarını kontrol edin." });
        }
    }
}
