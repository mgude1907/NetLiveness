using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLogEntry>>> GetLogs()
        {
            return await _context.Logs.OrderByDescending(l => l.Date).Take(100).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<AuditLogEntry>> PostLog(AuditLogEntry log)
        {
            log.Date = DateTime.Now;
            _context.Logs.Add(log);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLogs), new { id = log.Id }, log);
        }
    }
}
