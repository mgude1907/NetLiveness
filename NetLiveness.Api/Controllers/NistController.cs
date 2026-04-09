using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NistController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NistController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NistRequirement>>> GetRequirements()
        {
            return await _context.NistRequirements.ToListAsync();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRequirement(int id, NistRequirement req)
        {
            if (id != req.Id) return BadRequest();

            _context.Entry(req).State = EntityState.Modified;
            req.LastUpdated = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.NistRequirements.Any(e => e.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpPost("{id}/upload")]
        public async Task<IActionResult> UploadDocument(int id, IFormFile file)
        {
            var requirement = await _context.NistRequirements.FindAsync(id);
            if (requirement == null) return NotFound();

            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var fileName = $"{requirement.RequirementId}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "nist_docs");
            
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            var filePath = Path.Combine(uploadDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            requirement.DocumentPath = fileName;
            requirement.LastUpdated = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { fileName });
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var requirement = await _context.NistRequirements.FindAsync(id);
            if (requirement == null || string.IsNullOrEmpty(requirement.DocumentPath)) return NotFound();

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "nist_docs", requirement.DocumentPath);
            if (!System.IO.File.Exists(filePath)) return NotFound();

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, "application/octet-stream", requirement.DocumentPath);
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedRequirements()
        {
            try
            {
                var jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "nist_requirements.json");
                if (!System.IO.File.Exists(jsonPath))
                {
                    jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "nist_requirements.json");
                }

                if (!System.IO.File.Exists(jsonPath))
                {
                    return NotFound(new { message = "nist_requirements.json not found." });
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(jsonPath);
                var requirementsDto = System.Text.Json.JsonSerializer.Deserialize<List<NistRequirementDto>>(jsonContent, new System.Text.Json.JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                if (requirementsDto == null) return BadRequest("Invalid JSON data.");

                int addedCount = 0;
                foreach (var reqDto in requirementsDto)
                {
                    var exists = await _context.NistRequirements.AnyAsync(r => r.RequirementId == reqDto.Id);
                    if (!exists)
                    {
                        _context.NistRequirements.Add(new NistRequirement
                        {
                            RequirementId = reqDto.Id,
                            Family = reqDto.Family,
                            Description = reqDto.Description,
                            Status = "Not Implemented",
                            Comments = "",
                            LastUpdated = DateTime.Now
                        });
                        addedCount++;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "NIST Requirements updated.", added = addedCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error seeding data.", error = ex.Message });
            }
        }

        private class NistRequirementDto
        {
            public string Id { get; set; } = string.Empty;
            public string Family { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
        }
    }
}
