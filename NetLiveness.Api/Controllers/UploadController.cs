using Microsoft.AspNetCore.Mvc;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Dosya seçilmedi.");

            // Yalnızca resim dosyalarına izin ver
            if (!file.ContentType.StartsWith("image/"))
                return BadRequest("Lütfen geçerli bir resim dosyası yükleyin.");

            // uploads klasörünü oluştur
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Benzersiz isim oluştur
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Dosyaya erişilebilecek URL yolu
            return Ok(new { url = $"/uploads/{uniqueFileName}" });
        }

        [HttpPost("video")]
        public async Task<IActionResult> UploadTrainingMedia(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Dosya seçilmedi.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var isVideo = file.ContentType?.StartsWith("video/", StringComparison.OrdinalIgnoreCase) == true;
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".mp4", ".webm", ".mov", ".mkv", ".ppt", ".pptx", ".pdf"
            };

            if (!isVideo && !allowed.Contains(extension))
                return BadRequest("Lütfen video (.mp4, .webm) veya sunum (.ppt, .pptx, .pdf) dosyası yükleyin.");

            if (!allowed.Contains(extension))
                extension = ".mp4";

            var videosFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "videos");
            if (!Directory.Exists(videosFolder))
                Directory.CreateDirectory(videosFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(videosFolder, uniqueFileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/videos/{uniqueFileName}" });
        }
    }
}
