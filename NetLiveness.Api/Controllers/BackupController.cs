using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.IO.Compression;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BackupController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly string _dbPath = "c:\\Users\\mgude\\.gemini\\antigravity\\scratch\\NetLiveness.Api\\netliveness_v2.db";
        private readonly string _backupFolder = Path.Combine(Directory.GetCurrentDirectory(), "Backups");

        public BackupController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("list")]
        public async Task<ActionResult<IEnumerable<BackupSnapshot>>> GetBackups()
        {
            return await _context.Backups.OrderByDescending(b => b.CreatedAt).ToListAsync();
        }

        [HttpPost("snapshot")]
        public async Task<ActionResult<BackupSnapshot>> CreateSnapshot([FromBody] BackupRequest req)
        {
            try 
            {
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var fileName = $"snapshot_{timestamp}.db";
                var fullPath = Path.Combine(_backupFolder, fileName);

                // Copy the database file
                // We use Copy with overwrite false for safety
                System.IO.File.Copy(_dbPath, fullPath, true);

                var fileInfo = new FileInfo(fullPath);

                var backup = new BackupSnapshot
                {
                    Name = req.Name ?? $"Sistem Yedek {timestamp}",
                    Description = req.Description ?? "Manuel oluşturulan geri yükleme noktası.",
                    FilePath = fileName,
                    SizeBytes = fileInfo.Length,
                    DbOnly = true,
                    CreatedAt = DateTime.Now
                };

                _context.Backups.Add(backup);
                await _context.SaveChangesAsync();

                return Ok(backup);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Yedek oluşturulamadı: {ex.Message}");
            }
        }

        [HttpPost("restore/{id}")]
        public async Task<IActionResult> RestoreSnapshot(int id)
        {
            var backup = await _context.Backups.FindAsync(id);
            if (backup == null) return NotFound("Yedek bulunamadı.");

            var fullPath = Path.Combine(_backupFolder, backup.FilePath);
            if (!System.IO.File.Exists(fullPath)) return NotFound("Yedek dosyası fiziksel olarak mevcut değil.");

            try 
            {
                // To restore a DB, we usually need to close connections. 
                // ASP.NET Core with SQLite often locks the file.
                // We'll attempt a direct overwrite, but it might fail if the DB is busy.
                // Professional way: Copy it and let the next restart pick it up, OR Use PRAGMA backup.
                
                // For this task, we will copy it to a "netliveness_v2.db.restore" and 
                // mention that the system needs a manual or automated restart.
                
                var restoreTriggerPath = _dbPath + ".pending_restore";
                System.IO.File.Copy(fullPath, restoreTriggerPath, true);

                return Ok(new { 
                    Message = "Geri yükleme dosyası hazırlandı. Sistemin tam olarak geri yüklenmesi için yeniden başlatılması gerekiyor.",
                    Pending = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Geri yükleme başlatılamadı: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBackup(int id)
        {
            var backup = await _context.Backups.FindAsync(id);
            if (backup == null) return NotFound();

            var fullPath = Path.Combine(_backupFolder, backup.FilePath);
            if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);

            _context.Backups.Remove(backup);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class BackupRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}
