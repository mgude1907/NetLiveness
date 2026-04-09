using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Kullanıcı adı ve şifre zorunludur.");

            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Username == req.Username && u.PasswordHash == req.Password);
            
            if (user == null)
            {
                return Unauthorized("Geçersiz kullanıcı adı veya şifre.");
            }

            // Basit JWT veya Token yerine, hızlı entegrasyon için doğrudan kullanıcı nesnesini dönüyoruz.
            // Frontend tarafında localStorage'a kaydedilip rol/izin bazlı erişim mekanizması işletilecektir.
            return Ok(new
            {
                token = Guid.NewGuid().ToString(), // İleride gerçek JWT ile değiştirilebilir
                user = new
                {
                    id = user.Id,
                    username = user.Username,
                    fullName = user.FullName,
                    permissions = user.Permissions,
                    isAdmin = user.IsAdmin
                }
            });
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Ad Soyad, E-posta ve Şifre zorunludur.");

            var exists = await _context.AppUsers.AnyAsync(u => u.Email == req.Email || u.Username == req.Email);
            if (exists) return BadRequest("Bu e-posta adresi zaten kullanımda.");

            var user = new AppUser
            {
                Email = req.Email,
                Username = req.Email, // Email ile giriş yapılacak, username olarak email kullanılsın
                FullName = req.FullName,
                PasswordHash = req.Password, // Gerçek senaryoda Hashlenmeli
                Permissions = "Chat", // Sadece chat izni ile başlat
                IsAdmin = false,
                IsActive = true
            };

            _context.AppUsers.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kayıt başarılı", userId = user.Id });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
