using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using NetLiveness.Api.Services;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonnelController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PersonnelIntegrationService _integrationService;

        public PersonnelController(AppDbContext context, PersonnelIntegrationService integrationService)
        {
            _context = context;
            _integrationService = integrationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Personnel>>> GetPersonnels()
        {
            return await _context.Personnels.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Personnel>> GetPersonnel(int id)
        {
            var personnel = await _context.Personnels.FindAsync(id);

            if (personnel == null)
            {
                return NotFound();
            }

            return personnel;
        }

        [HttpPost]
        public async Task<ActionResult<Personnel>> PostPersonnel(Personnel personnel)
        {
            // AdSoyad auto set based on Ad and Soyad
            personnel.AdSoyad = $"{personnel.Ad} {personnel.Soyad}".Trim();
            
            _context.Personnels.Add(personnel);
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "PERSONNEL_CREATED", Details = $"Yeni personel eklendi: {personnel.AdSoyad} ({personnel.Bolum} - {personnel.SicilNo})", Operator = operatorInfo });

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPersonnel), new { id = personnel.Id }, personnel);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPersonnel(int id, Personnel personnel)
        {
            if (id != personnel.Id)
            {
                return BadRequest();
            }

            personnel.AdSoyad = $"{personnel.Ad} {personnel.Soyad}".Trim();
            _context.Entry(personnel).State = EntityState.Modified;

            try
            {
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { Action = "PERSONNEL_UPDATED", Details = $"Personel bilgileri güncellendi: {personnel.AdSoyad}", Operator = operatorInfo });

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PersonnelExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePersonnel(int id)
        {
            var personnel = await _context.Personnels.FindAsync(id);
            if (personnel == null)
            {
                return NotFound();
            }

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "PERSONNEL_DELETED", Details = $"Personel kaydı silindi: {personnel.AdSoyad} ({personnel.SicilNo})", Operator = operatorInfo });

            _context.Personnels.Remove(personnel);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("sync")]
        public async Task<ActionResult> SyncPersonnel()
        {
            try
            {
                var (updated, added, resigned) = await _integrationService.SyncFromSqlAsync();
                
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { 
                    Action = "PERSONNEL_SYNC", 
                    Details = $"Dış sistem senkronizasyonu tamamlandı. Güncellenen: {updated}, Eklenen: {added}, İşten Çıkan: {resigned}", 
                    Operator = operatorInfo 
                });

                return Ok(new { updated, added, resigned, message = "Senkronizasyon başarıyla tamamlandı." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private bool PersonnelExists(int id)
        {
            return _context.Personnels.Any(e => e.Id == id);
        }
    }
}
