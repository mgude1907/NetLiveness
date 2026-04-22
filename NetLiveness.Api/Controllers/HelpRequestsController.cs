using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly AppDbContext _context;
        private readonly IGlpiService _glpiService;
        private readonly IWebHostEnvironment _env;

        public HelpRequestsController(AppDbContext context, IGlpiService glpiService, IWebHostEnvironment env)
        {
            _context = context;
            _glpiService = glpiService;
            _env = env;
        }

        // --- PUBLIC: Submit a request ---
        [HttpPost]
        public async Task<IActionResult> Submit([FromForm] HelpRequest req, IFormFile? screenshot)
        {
            if (screenshot != null && screenshot.Length > 0)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(screenshot.FileName);
                var dir = Path.Combine(_env.WebRootPath, "uploads", "helpdesk");
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                
                var filePath = Path.Combine(dir, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await screenshot.CopyToAsync(stream);
                }
                req.ScreenshotPath = "/uploads/helpdesk/" + fileName;
            }

            req.CreatedAt = DateTime.Now;
            req.LastUpdate = DateTime.Now;
            req.Status = "Açık";
            
            // SLA Hesabı (Kritik: 4 saat, Diğer: 24 saat)
            req.SlaDeadline = req.Priority == "Kritik" ? DateTime.Now.AddHours(4) : DateTime.Now.AddHours(24);

            _context.HelpRequests.Add(req);
            
            _context.Logs.Add(new AuditLogEntry { 
                Action = "HELP_REQUEST_CREATED", 
                Details = $"Yeni destek talebi: {req.Subject} ({req.Priority})", 
                Operator = "Son Kullanıcı",
                Category = "SUPPORT"
            });
            
            await _context.SaveChangesAsync();

            // GLPI Sync
            _ = Task.Run(async () => {
                try { await _glpiService.CreateTicketAsync(req); } catch { }
            });

            return Ok(new { message = "Talebiniz başarıyla alındı.", id = req.Id });
        }

        // --- ADMIN: List all ---
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.HelpRequests
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return Ok(requests);
        }

        // --- ADMIN: Get Details with Replies ---
        [HttpGet("{id}/replies")]
        public async Task<IActionResult> GetReplies(int id)
        {
            var replies = await _context.HelpRequestReplies
                .Where(r => r.HelpRequestId == id)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();
            return Ok(replies);
        }

        // --- SHARED: Add Reply ---
        [HttpPost("{id}/replies")]
        public async Task<IActionResult> PostReply(int id, [FromForm] string message, [FromForm] bool isAdmin, IFormFile? attachment)
        {
            var request = await _context.HelpRequests.FindAsync(id);
            if (request == null) return NotFound();

            var reply = new HelpRequestReply
            {
                HelpRequestId = id,
                Message = message,
                IsFromAdmin = isAdmin,
                SenderName = isAdmin ? "BT Destek" : request.SenderName,
                CreatedAt = DateTime.Now
            };

            if (attachment != null && attachment.Length > 0)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(attachment.FileName);
                var dir = Path.Combine(_env.WebRootPath, "uploads", "helpdesk");
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                
                var filePath = Path.Combine(dir, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await attachment.CopyToAsync(stream);
                }
                reply.AttachmentPath = "/uploads/helpdesk/" + fileName;
            }

            _context.HelpRequestReplies.Add(reply);
            
            // Talebi güncelle
            request.LastUpdate = DateTime.Now;
            if (isAdmin && request.Status == "Açık") request.Status = "İşlemde";

            await _context.SaveChangesAsync();
            return Ok(reply);
        }

        // --- ADMIN: Assign Ticket ---
        [HttpPut("{id}/assign")]
        public async Task<IActionResult> Assign(int id, [FromBody] string assignee)
        {
            var request = await _context.HelpRequests.FindAsync(id);
            if (request == null) return NotFound();

            request.AssignedTo = assignee;
            request.LastUpdate = DateTime.Now;
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { 
                Action = "HELP_REQUEST_ASSIGNED", 
                Details = $"Talep {id} numaralı talep {assignee} kişisine atandı.", 
                Operator = operatorInfo,
                Category = "SUPPORT"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Talep {assignee} kişisine atandı." });
        }

        // --- ADMIN: Update Status / Resolution ---
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] HelpRequest update)
        {
            var request = await _context.HelpRequests.FindAsync(id);
            if (request == null) return NotFound();

            request.Status = update.Status;
            request.Priority = update.Priority;
            request.Category = update.Category;
            request.Resolution = update.Resolution;
            request.LastUpdate = DateTime.Now;

            if (request.Status == "Çözüldü" || request.Status == "Kapalı")
                request.ResolvedAt = DateTime.Now;
            else
                request.ResolvedAt = null;

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { 
                Action = "HELP_REQUEST_UPDATED", 
                Details = $"{id} numaralı talep güncellendi. Yeni Statü: {request.Status}", 
                Operator = operatorInfo,
                Category = "SUPPORT"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Talep güncellendi." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var request = await _context.HelpRequests.FindAsync(id);
            if (request == null) return NotFound();

            _context.HelpRequests.Remove(request);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Talep silindi." });
        }
    }
}
