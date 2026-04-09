using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetInventory()
        {
            return await _context.Inventory.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryItem>> GetInventoryItem(int id)
        {
            var inventoryItem = await _context.Inventory.FindAsync(id);

            if (inventoryItem == null)
            {
                return NotFound();
            }

            return inventoryItem;
        }

        [HttpPost]
        public async Task<ActionResult<InventoryItem>> PostInventoryItem(InventoryItem inventoryItem)
        {
            inventoryItem.AssignedAt = DateTime.Now;
            _context.Inventory.Add(inventoryItem);
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "INVENTORY_CREATED", Details = $"Yeni zimmet/envanter kaydı oluşturuldu: {inventoryItem.Brand} {inventoryItem.Model} (Atanan: {inventoryItem.AssignedTo})", Operator = operatorInfo });

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInventoryItem), new { id = inventoryItem.Id }, inventoryItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutInventoryItem(int id, InventoryItem inventoryItem)
        {
            if (id != inventoryItem.Id)
            {
                return BadRequest();
            }

            _context.Entry(inventoryItem).State = EntityState.Modified;

            try
            {
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { Action = "INVENTORY_UPDATED", Details = $"Zimmet/Envanter kaydı güncellendi: {inventoryItem.Brand} {inventoryItem.Model}", Operator = operatorInfo });

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InventoryItemExists(id))
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
        public async Task<IActionResult> DeleteInventoryItem(int id)
        {
            var inventoryItem = await _context.Inventory.FindAsync(id);
            if (inventoryItem == null)
            {
                return NotFound();
            }

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "INVENTORY_DELETED", Details = $"Zimmet/Envanter kaydı silindi: {inventoryItem.Brand} {inventoryItem.Model}", Operator = operatorInfo });

            _context.Inventory.Remove(inventoryItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/return")]
        public async Task<IActionResult> ReturnToStock(int id)
        {
            var invItem = await _context.Inventory.FindAsync(id);
            if (invItem == null) return NotFound();

            var stockItem = new StockItem
            {
                Category = invItem.Category,
                Brand = invItem.Brand,
                Model = invItem.Model,
                SerialNo = invItem.SerialNo,
                PcIsmi = invItem.PcIsmi,
                Status = "Sağlam",
                EnvanterTuru = invItem.EnvanterTuru,
                AddedAt = DateTime.Now
            };

            _context.Inventory.Remove(invItem);
            _context.Stock.Add(stockItem);

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry
            {
                Action = "INV_RETURN",
                Details = $"{invItem.Model} ({invItem.SerialNo}) zimmetten düşülerek stoğa aktarıldı.",
                Operator = operatorInfo
            });

            await _context.SaveChangesAsync();
            return Ok(stockItem);
        }

        private bool InventoryItemExists(int id)
        {
            return _context.Inventory.Any(e => e.Id == id);
        }
    }
}
