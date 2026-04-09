using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComplianceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly string _uploadPath;

        public ComplianceController(AppDbContext context)
        {
            _context = context;
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "compliance_docs");
            
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

        [HttpGet("docs/{standard}")]
        public async Task<ActionResult<IEnumerable<ComplianceDocument>>> GetDocuments(string standard)
        {
            var standardLower = standard.ToLowerInvariant();
            return await _context.ComplianceDocuments
                .Where(d => d.Standard.ToLower() == standardLower)
                .OrderByDescending(d => d.UploadDate)
                .ToListAsync();
        }

        [HttpPost("docs/{standard}/upload")]
        public async Task<IActionResult> UploadDocument(string standard, IFormFile file, [FromForm] string? description)
        {
            if (file == null || file.Length == 0) return BadRequest("Belge seçilmedi.");

            var fileName = $"{standard}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(_uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var doc = new ComplianceDocument
            {
                Standard = standard.ToUpper(),
                FileName = file.FileName,
                FilePath = fileName,
                Description = description,
                UploadDate = DateTime.Now
            };

            _context.ComplianceDocuments.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(doc);
        }

        [HttpDelete("docs/{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var doc = await _context.ComplianceDocuments.FindAsync(id);
            if (doc == null) return NotFound();

            var filePath = Path.Combine(_uploadPath, doc.FilePath);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.ComplianceDocuments.Remove(doc);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("docs/{id}/download")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var doc = await _context.ComplianceDocuments.FindAsync(id);
            if (doc == null) return NotFound();

            var filePath = Path.Combine(_uploadPath, doc.FilePath);
            if (!System.IO.File.Exists(filePath)) return NotFound();

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var contentType = GetContentType(doc.FilePath);
            
            // Set inline disposition to allow browser preview instead of forced download
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{doc.FileName}\"");
            return File(fileBytes, contentType);
        }

        private string GetContentType(string path)
        {
            var ext = Path.GetExtension(path).ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream",
            };
        }
    }
}
