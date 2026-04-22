using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StockController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockItem>>> GetStock()
        {
            return await _context.Stock.ToListAsync();
        }

        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetStockSummary()
        {
            var stockItems = await _context.Stock.Select(s => new { s.Category, s.Brand, s.Model }).ToListAsync();
            var invItems = await _context.Inventory.Select(i => new { i.Category, i.Brand, i.Model }).ToListAsync();

            var allItems = stockItems.Concat(invItems).ToList();

            var summary = allItems
                .GroupBy(x => new { x.Category, x.Brand, x.Model })
                .Select(g => new
                {
                    Category = g.Key.Category,
                    Brand = g.Key.Brand,
                    Model = g.Key.Model,
                    Count = g.Count()
                })
                .OrderBy(x => x.Category)
                .ThenBy(x => x.Brand)
                .ThenBy(x => x.Model)
                .ToList();

            return summary;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StockItem>> GetStockItem(int id)
        {
            var stockItem = await _context.Stock.FindAsync(id);

            if (stockItem == null)
            {
                return NotFound();
            }

            return stockItem;
        }

        [HttpPost]
        public async Task<ActionResult<StockItem>> PostStockItem(StockItem stockItem)
        {
            stockItem.AddedAt = DateTime.Now;
            _context.Stock.Add(stockItem);

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "STOCK_CREATED", Details = $"Yeni stok ürünü eklendi: {stockItem.Brand} {stockItem.Model} ({stockItem.SerialNo})", Operator = operatorInfo, Category = "INVENTORY" });

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStockItem), new { id = stockItem.Id }, stockItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutStockItem(int id, StockItem stockItem)
        {
            if (id != stockItem.Id)
            {
                return BadRequest();
            }

            _context.Entry(stockItem).State = EntityState.Modified;

            try
            {
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { Action = "STOCK_UPDATED", Details = $"Stok ürünü bilgisi güncellendi: {stockItem.Brand} {stockItem.Model}", Operator = operatorInfo, Category = "INVENTORY" });

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StockItemExists(id))
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
        public async Task<IActionResult> DeleteStockItem(int id)
        {
            var stockItem = await _context.Stock.FindAsync(id);
            if (stockItem == null)
            {
                return NotFound();
            }

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "STOCK_DELETED", Details = $"Stok ürünü silindi: {stockItem.Brand} {stockItem.Model} ({stockItem.SerialNo})", Operator = operatorInfo, Category = "INVENTORY" });

            _context.Stock.Remove(stockItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/assign")]
        public async Task<IActionResult> AssignToPersonnel(int id, [FromBody] string personnelName)
        {
            var stockItem = await _context.Stock.FindAsync(id);
            if (stockItem == null) return NotFound();

            var invItem = new InventoryItem
            {
                Category = stockItem.Category,
                Brand = stockItem.Brand,
                Model = stockItem.Model,
                SerialNo = stockItem.SerialNo,
                PcIsmi = stockItem.PcIsmi,
                EnvanterTuru = stockItem.EnvanterTuru,
                AssignedTo = personnelName,
                AssignedAt = DateTime.Now
            };

            _context.Stock.Remove(stockItem);
            _context.Inventory.Add(invItem);

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry
            {
                Action = "STOCK_ASSIGN",
                Details = $"{stockItem.Model} ({stockItem.SerialNo}) stoğundan alınarak '{personnelName}' personeline zimmetlendi.",
                Operator = operatorInfo,
                Category = "INVENTORY"
            });

            await _context.SaveChangesAsync();
            return Ok(invItem);
        }

        private bool StockItemExists(int id)
        {
            return _context.Stock.Any(e => e.Id == id);
        }
    }
}
