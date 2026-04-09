using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccessMatrixController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AccessMatrixController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/accessmatrix/columns
        [HttpGet("columns")]
        public async Task<ActionResult<IEnumerable<AccessColumn>>> GetColumns()
        {
            return await _context.AccessColumns
                .OrderBy(c => c.Category)
                .ThenBy(c => c.DisplayOrder)
                .ToListAsync();
        }

        // POST: api/accessmatrix/columns
        [HttpPost("columns")]
        public async Task<ActionResult<AccessColumn>> AddColumn(AccessColumn column)
        {
            // Check for duplicates (Category + Name)
            var exists = await _context.AccessColumns.AnyAsync(c => 
                c.Category.ToUpper() == column.Category.ToUpper() && 
                c.Name.ToLower() == column.Name.ToLower());

            if (exists)
            {
                return BadRequest("Bu isimden bu kategoride zaten bir kayıt var.");
            }

            _context.AccessColumns.Add(column);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetColumns), new { id = column.Id }, column);
        }

        // DELETE: api/accessmatrix/columns/{id}
        [HttpDelete("columns/{id}")]
        public async Task<IActionResult> DeleteColumn(int id)
        {
            var column = await _context.AccessColumns.FindAsync(id);
            if (column == null) return NotFound();

            // Sütuna bağlı yetkileri de temizle
            var grants = _context.AccessGrants.Where(g => g.AccessColumnId == id);
            _context.AccessGrants.RemoveRange(grants);
            
            _context.AccessColumns.Remove(column);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // GET: api/accessmatrix/grants
        [HttpGet("grants")]
        public async Task<ActionResult<IEnumerable<AccessGrant>>> GetGrants()
        {
            return await _context.AccessGrants.ToListAsync();
        }

        // POST: api/accessmatrix/grants
        // Request format expects PersonnelId, AccessColumnId, AccessLevel ("R", "W", "R/W", or "" to delete)
        [HttpPost("grants")]
        public async Task<IActionResult> UpsertGrant([FromBody] AccessGrant incomingGrant)
        {
            var existing = await _context.AccessGrants
                .FirstOrDefaultAsync(g => g.PersonnelId == incomingGrant.PersonnelId && g.AccessColumnId == incomingGrant.AccessColumnId);

            if (string.IsNullOrWhiteSpace(incomingGrant.AccessLevel))
            {
                // Delete if level is empty
                if (existing != null)
                {
                    _context.AccessGrants.Remove(existing);
                    await _context.SaveChangesAsync();
                }
                return Ok();
            }

            if (existing != null)
            {
                // Update
                existing.AccessLevel = incomingGrant.AccessLevel;
            }
            else
            {
                // Add
                _context.AccessGrants.Add(new AccessGrant
                {
                    PersonnelId = incomingGrant.PersonnelId,
                    AccessColumnId = incomingGrant.AccessColumnId,
                    AccessLevel = incomingGrant.AccessLevel
                });
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
