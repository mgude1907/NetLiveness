using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("channels")]
        public async Task<IActionResult> GetChannels(int? userId)
        {
            IQueryable<ChatChannel> query = _context.ChatChannels;
            
            if (userId.HasValue && userId.Value > 0)
            {
                // Kullanıcın üye olduğu kanalları getir
                query = query.Where(c => _context.ChatChannelMembers.Any(m => m.ChannelId == c.Id && m.UserId == userId.Value));
            }

            var channels = await query.ToListAsync();
            
            // Hiç kanal yoksa ve genel kanalı oluşturmak gerekiyorsa (ilk açılış)
            if (!channels.Any() && !userId.HasValue)
            {
                var defaultChannel = new ChatChannel { Name = "Genel Sohbet", Description = "Şirket içi genel yazışma alanı" };
                _context.ChatChannels.Add(defaultChannel);
                await _context.SaveChangesAsync();
                channels.Add(defaultChannel);
            }
            return Ok(channels);
        }

        [HttpPost("channels")]
        public async Task<IActionResult> CreateChannel([FromBody] ChatChannelRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Kanal adı boş olamaz.");

            var newChannel = new ChatChannel 
            { 
                Name = request.Name, 
                Description = request.Description ?? "",
                OwnerId = request.OwnerId
            };

            _context.ChatChannels.Add(newChannel);
            await _context.SaveChangesAsync();

            // Oluşturan kişiyi otomatik üye yap
            if (request.OwnerId.HasValue)
            {
                _context.ChatChannelMembers.Add(new ChatChannelMember 
                { 
                    ChannelId = newChannel.Id, 
                    UserId = request.OwnerId.Value 
                });
                await _context.SaveChangesAsync();
            }

            return Ok(newChannel);
        }

        [HttpGet("channels/{channelId}/members")]
        public async Task<IActionResult> GetChannelMembers(int channelId)
        {
            var members = await _context.ChatChannelMembers
                .Where(m => m.ChannelId == channelId && m.User != null)
                .Select(m => m.User)
                .Select(u => new { u!.Id, u.FullName, u.Email })
                .ToListAsync();
            return Ok(members);
        }

        [HttpPost("channels/members")]
        public async Task<IActionResult> AddMember([FromBody] ChannelMemberRequest request)
        {
            var user = await _context.AppUsers.FindAsync(request.UserId);
            if (user == null) return NotFound("Kullanıcı bulunamadı.");

            _context.ChatChannelMembers.Add(new ChatChannelMember { ChannelId = request.ChannelId, UserId = request.UserId });
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("channels/members")]
        public async Task<IActionResult> RemoveMember(int channelId, int userId)
        {
            var member = await _context.ChatChannelMembers.FirstOrDefaultAsync(m => m.ChannelId == channelId && m.UserId == userId);
            if (member == null) return NotFound();

            _context.ChatChannelMembers.Remove(member);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("history/{channelId}")]
        public async Task<IActionResult> GetMessageHistory(int channelId)
        {
            var messages = await _context.ChatMessages
                .Where(m => m.ChannelId == channelId && m.RecipientId == null)
                .OrderByDescending(m => m.Timestamp)
                .Take(50)
                .ToListAsync();

            messages.Reverse();
            return Ok(messages);
        }

        [HttpGet("history-private/{userId}/{otherId}")]
        public async Task<IActionResult> GetPrivateHistory(int userId, int otherId)
        {
            var messages = await _context.ChatMessages
                .Where(m => (m.UserId == userId && m.RecipientId == otherId) || 
                            (m.UserId == otherId && m.RecipientId == userId))
                .OrderByDescending(m => m.Timestamp)
                .Take(50)
                .ToListAsync();

            messages.Reverse();
            return Ok(messages);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetChatUsers()
        {
            var users = await _context.AppUsers
                .Select(u => new { u.Id, u.FullName, u.Email, u.IsActive, u.Permissions, u.IsAdmin, u.CreatedAt })
                .ToListAsync();
            return Ok(users);
        }
        
        [HttpPut("users/{id}/toggle-active")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { user.IsActive });
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateRequest request)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
            if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;
            if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
            if (!string.IsNullOrEmpty(request.Password)) user.PasswordHash = request.Password; // Basit şifreleme veya hash kullanılmalı

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null) return NotFound();

            _context.AppUsers.Remove(user);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadMedia([FromServices] Microsoft.AspNetCore.Hosting.IWebHostEnvironment env, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Dosya yok.");

            var folderPath = System.IO.Path.Combine(env.WebRootPath, "uploads");
            if (!System.IO.Directory.Exists(folderPath))
                System.IO.Directory.CreateDirectory(folderPath);

            var fileName = Guid.NewGuid().ToString() + System.IO.Path.GetExtension(file.FileName);
            var filePath = System.IO.Path.Combine(folderPath, fileName);

            using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{fileName}";
            return Ok(new { url = fileUrl });
        }
    }

    public class ChatChannelRequest
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public int? OwnerId { get; set; }
    }

    public class ChannelMemberRequest
    {
        public int ChannelId { get; set; }
        public int UserId { get; set; }
    }

    public class UserUpdateRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public bool? IsActive { get; set; }
    }
}
