using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using NetLiveness.Api.Models;
using NetLiveness.Api.Data;
using NetLiveness.Api.Services;
using Dapper;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HelpRequestsController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly IWebHostEnvironment _env;
        private readonly AppDbContext _context;
        private readonly IGlpiService _glpiService;

        public HelpRequestsController(IConfiguration config, IWebHostEnvironment env, AppDbContext context, IGlpiService glpiService)
        {
            _connectionString = config.GetConnectionString("Default") ?? "Data Source=netliveness_v2.db";
            _env = env;
            _context = context;
            _glpiService = glpiService;
        }

        // PUBLIC: Submit a request with optional screenshot
        [HttpPost]
        public async Task<IActionResult> Submit([FromForm] HelpRequest req, IFormFile? screenshot)
        {
            using var db = new SqliteConnection(_connectionString);
            
            if (screenshot != null && screenshot.Length > 0)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(screenshot.FileName);
                var filePath = Path.Combine(_env.WebRootPath, "uploads", "helpdesk", fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await screenshot.CopyToAsync(stream);
                }
                
                req.ScreenshotPath = "/uploads/helpdesk/" + fileName;
            }

            var sql = @"INSERT INTO HelpRequests (SenderName, SenderEmail, Subject, Message, Category, Priority, Status, CreatedAt, ScreenshotPath)
                        VALUES (@SenderName, @SenderEmail, @Subject, @Message, @Category, @Priority, @Status, @CreatedAt, @ScreenshotPath)";
            
            req.CreatedAt = DateTime.Now;
            req.Status = "Açık";
            await db.ExecuteAsync(sql, req);

            var operatorInfo = $"{User.Identity?.Name ?? "Son Kullanıcı"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "HELP_REQUEST_CREATED", Details = $"Yeni destek talebi gönderildi: {req.Subject}", Operator = operatorInfo });
            await _context.SaveChangesAsync();

            // GLPI Sync (Arka planda çalışır, kullanıcıyı bekletmez)
            _ = Task.Run(async () => {
                try { await _glpiService.CreateTicketAsync(req); } catch { }
            });

            return Ok(new { message = "Talebiniz başarıyla alındı." });
        }

        // ADMIN: List all requests
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            using var db = new SqliteConnection(_connectionString);
            var sql = "SELECT * FROM HelpRequests ORDER BY CreatedAt DESC";
            var requests = await db.QueryAsync<HelpRequest>(sql);
            return Ok(requests);
        }

        // ADMIN: Update status/priority/resolution
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] HelpRequest req)
        {
            using var db = new SqliteConnection(_connectionString);
            var sql = @"UPDATE HelpRequests 
                        SET Status = @Status, Priority = @Priority, Category = @Category, 
                            Resolution = @Resolution, ResolvedAt = @ResolvedAt
                        WHERE Id = @Id";
            
            req.Id = id;
            if (req.Status == "Çözüldü" || req.Status == "Kapalı")
            {
                req.ResolvedAt ??= DateTime.Now;
            }
            else
            {
                req.ResolvedAt = null;
            }

            await db.ExecuteAsync(sql, req);
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "HELP_REQUEST_UPDATED", Details = $"Destek talebi yönergesi/durumu güncellendi (Yeni Durum: {req.Status}) - Talep ID: {id}", Operator = operatorInfo });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Talep güncellendi." });
        }

        // ADMIN: Statistics for reports
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] string start, [FromQuery] string end)
        {
            using var db = new SqliteConnection(_connectionString);
            var sql = @"SELECT SenderName, Category, Status, Priority, CreatedAt 
                        FROM HelpRequests 
                        WHERE CreatedAt >= @start AND CreatedAt <= @end";
            
            var data = await db.QueryAsync<dynamic>(sql, new { start, end });
            return Ok(data);
        }

        // ADMIN: Delete
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var db = new SqliteConnection(_connectionString);
            await db.ExecuteAsync("DELETE FROM HelpRequests WHERE Id = @id", new { id });
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "HELP_REQUEST_DELETED", Details = $"Destek talebi sistemden kalıcı olarak silindi (Talep ID: {id})", Operator = operatorInfo });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Talep silindi." });
        }
    }
}
