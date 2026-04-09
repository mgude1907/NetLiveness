using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Text.Json;

namespace NetLiveness.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Iso9001Controller : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public Iso9001Controller(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Iso9001Requirement>>> GetRequirements()
        {
            return await _context.Iso9001Requirements.OrderBy(r => r.Id).ToListAsync();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRequirement(int id, Iso9001Requirement requirement)
        {
            if (id != requirement.Id) return BadRequest();

            requirement.LastUpdated = DateTime.Now;
            _context.Entry(requirement).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RequirementExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedRequirements()
        {
            if (await _context.Iso9001Requirements.AnyAsync())
            {
                return BadRequest(new { message = "Liste zaten mevcut." });
            }

            try
            {
                var jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "iso9001_requirements.json");
                if (!System.IO.File.Exists(jsonPath))
                {
                    return NotFound(new { message = "iso9001_requirements.json bulunamadı." });
                }

                var jsonString = await System.IO.File.ReadAllTextAsync(jsonPath);
                var requirements = JsonSerializer.Deserialize<List<Iso9001Requirement>>(jsonString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (requirements != null)
                {
                    foreach (var req in requirements)
                    {
                        req.Id = 0; // Let DB generate ID
                        req.Status = "Uygulanmadı";
                        req.LastUpdated = DateTime.Now;
                    }
                    _context.Iso9001Requirements.AddRange(requirements);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "ISO 9001 (BT) listesi başarıyla oluşturuldu." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Veri oluşturma hatası.", error = ex.Message });
            }
        }

        [HttpPost("upload/{id}")]
        public async Task<IActionResult> UploadDocument(int id, IFormFile file)
        {
            var requirement = await _context.Iso9001Requirements.FindAsync(id);
            if (requirement == null) return NotFound();

            if (file == null || file.Length == 0) return BadRequest("Dosya seçilmedi.");

            var uploadsPath = Path.Combine(_env.ContentRootPath, "iso9001_docs");
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var fileName = $"{id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            requirement.DocumentPath = fileName;
            requirement.LastUpdated = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { fileName });
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var requirement = await _context.Iso9001Requirements.FindAsync(id);
            if (requirement == null || string.IsNullOrEmpty(requirement.DocumentPath))
                return NotFound();

            var filePath = Path.Combine(_env.ContentRootPath, "iso9001_docs", requirement.DocumentPath);
            if (!System.IO.File.Exists(filePath)) return NotFound();

            var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(bytes, "application/octet-stream", requirement.DocumentPath);
        }

        private bool RequirementExists(int id)
        {
            return _context.Iso9001Requirements.Any(e => e.Id == id);
        }
    }
}
