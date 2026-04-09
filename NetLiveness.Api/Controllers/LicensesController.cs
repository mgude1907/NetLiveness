using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LicensesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LicensesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SoftwareLicense>>> GetLicenses()
        {
            return await _context.SoftwareLicenses.OrderByDescending(x => x.AddedAt).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SoftwareLicense>> GetLicense(int id)
        {
            var license = await _context.SoftwareLicenses.FindAsync(id);
            if (license == null) return NotFound();
            return license;
        }

        [HttpPost]
        public async Task<ActionResult<SoftwareLicense>> PostLicense(SoftwareLicense license)
        {
            license.AddedAt = DateTime.Now;
            _context.SoftwareLicenses.Add(license);

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { 
                Action = "LICENSE_CREATED", 
                Details = $"Yeni lisans eklendi: {license.SoftwareName} ({license.LicenseType})", 
                Operator = operatorInfo 
            });

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLicense), new { id = license.Id }, license);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutLicense(int id, SoftwareLicense license)
        {
            if (id != license.Id) return BadRequest();

            _context.Entry(license).State = EntityState.Modified;

            try
            {
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { 
                    Action = "LICENSE_UPDATED", 
                    Details = $"Lisans güncellendi: {license.SoftwareName}", 
                    Operator = operatorInfo 
                });
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LicenseExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLicense(int id)
        {
            var license = await _context.SoftwareLicenses.FindAsync(id);
            if (license == null) return NotFound();

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { 
                Action = "LICENSE_DELETED", 
                Details = $"Lisans silindi: {license.SoftwareName}", 
                Operator = operatorInfo 
            });

            _context.SoftwareLicenses.Remove(license);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LicenseExists(int id)
        {
            return _context.SoftwareLicenses.Any(e => e.Id == id);
        }
    }
}
