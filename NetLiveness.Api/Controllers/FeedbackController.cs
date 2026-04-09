using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FeedbackController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetFeedbacks()
        {
            var feedbacks = await _context.Feedbacks.OrderByDescending(f => f.DateSubmitted).ToListAsync();
            return Ok(feedbacks);
        }

        [HttpPost]
        public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackEntry feedback)
        {
            if (string.IsNullOrEmpty(feedback.Message))
                return BadRequest("Mesaj alanı boş bırakılamaz.");

            feedback.DateSubmitted = DateTime.Now;
            feedback.IsRead = false;

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Geri bildiriminiz başarıyla iletildi. Teşekkür ederiz!" });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return NotFound();

            feedback.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeedback(int id)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return NotFound();

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
