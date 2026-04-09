using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
        {
            // İhtiyaca göre şifreleri gizleyebilirsiniz:
            var users = await _context.AppUsers.Select(u => new AppUser
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Permissions = u.Permissions,
                IsAdmin = u.IsAdmin,
                CreatedAt = u.CreatedAt
            }).ToListAsync();

            return users;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AppUser>> GetUser(int id)
        {
            var user = await _context.AppUsers.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            user.PasswordHash = null; // Parolayı dışarı vermemek için
            return user;
        }

        [HttpPost]
        public async Task<ActionResult<AppUser>> PostUser(AppUser user)
        {
            // Kullanıcı adı kontolü
            if (await _context.AppUsers.AnyAsync(u => u.Username == user.Username))
                return BadRequest("Bu kullanıcı adı zaten alınmış.");

            _context.AppUsers.Add(user);
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "USER_CREATED", Details = $"Yeni sistem kullanıcısı kayıt edildi: {user.Username}", Operator = operatorInfo });
            
            await _context.SaveChangesAsync();

            user.PasswordHash = null;
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, AppUser user)
        {
            if (id != user.Id)
            {
                return BadRequest();
            }

            var existingUser = await _context.AppUsers.FindAsync(id);
            if (existingUser == null) return NotFound();

            existingUser.Username = user.Username;
            existingUser.FullName = user.FullName;
            existingUser.Permissions = user.Permissions;
            existingUser.IsAdmin = user.IsAdmin;

            // Şifre boş gelmediyse güncellenir
            if (!string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                existingUser.PasswordHash = user.PasswordHash;
            }

            try
            {
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { Action = "USER_UPDATED", Details = $"Sistem kullacısı bilgileri/yetkileri güncellendi: {existingUser.Username}", Operator = operatorInfo });

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (user.IsAdmin && await _context.AppUsers.CountAsync(u => u.IsAdmin) <= 1)
            {
                 return BadRequest("Sistemdeki son yönetici hesabı silinemez.");
            }

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "USER_DELETED", Details = $"Sistem kullanıcısı kalıcı olarak silindi: {user.Username}", Operator = operatorInfo });

            _context.AppUsers.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.AppUsers.Any(e => e.Id == id);
        }
    }
}
