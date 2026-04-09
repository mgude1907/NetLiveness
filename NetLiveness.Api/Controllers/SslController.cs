using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SslController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SslController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SslItem>>> GetSslItems()
        {
            return await _context.SslItems.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SslItem>> GetSslItem(int id)
        {
            var sslItem = await _context.SslItems.FindAsync(id);

            if (sslItem == null)
            {
                return NotFound();
            }

            return sslItem;
        }

        [HttpPost]
        public async Task<ActionResult<SslItem>> PostSslItem(SslItem sslItem)
        {
            _context.SslItems.Add(sslItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSslItem), new { id = sslItem.Id }, sslItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutSslItem(int id, SslItem sslItem)
        {
            if (id != sslItem.Id)
            {
                return BadRequest();
            }

            _context.Entry(sslItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SslItemExists(id))
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
        public async Task<IActionResult> DeleteSslItem(int id)
        {
            var sslItem = await _context.SslItems.FindAsync(id);
            if (sslItem == null)
            {
                return NotFound();
            }

            _context.SslItems.Remove(sslItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool SslItemExists(int id)
        {
            return _context.SslItems.Any(e => e.Id == id);
        }
    }
}
