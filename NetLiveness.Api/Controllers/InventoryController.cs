using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using ClosedXML.Excel;

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

        [HttpGet("export-form")]
        public async Task<IActionResult> GetZimmetForm([FromQuery] string ids)
        {
            if (string.IsNullOrEmpty(ids)) return BadRequest("ID listesi boş.");

            var idList = ids.Split(',').Select(int.Parse).ToList();
            var invItem = await _context.Inventory.FindAsync(idList[0]);
            if (invItem == null) return NotFound("Envanter bulunamadı.");

            var personnel = await _context.Personnels.FirstOrDefaultAsync(p => p.AdSoyad == invItem.AssignedTo);

            string templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "ZimmetSablon.xlsx");
            if (!System.IO.File.Exists(templatePath))
            {
                templatePath = Path.Combine(AppContext.BaseDirectory, "Templates", "ZimmetSablon.xlsx");
            }

            if (!System.IO.File.Exists(templatePath))
            {
                Console.WriteLine($"[ERROR] Şablon bulunamadı. Aranan yollar: {Directory.GetCurrentDirectory()}/Templates/ZimmetSablon.xlsx VE {AppContext.BaseDirectory}/Templates/ZimmetSablon.xlsx");
                return NotFound("Sistem Hatası: Zimmet şablon dosyası sunucuda bulunamadı. Lütfen teknik ekibe bildirin.");
            }

            byte[] fileContent;
            string assignedToName = invItem.AssignedTo ?? "Personel_Bilinmiyor";
            string safeName = assignedToName
                .Replace("ı", "i").Replace("İ", "I")
                .Replace("ğ", "g").Replace("Ğ", "G")
                .Replace("ü", "u").Replace("Ü", "U")
                .Replace("ş", "s").Replace("Ş", "S")
                .Replace("ö", "o").Replace("Ö", "O")
                .Replace("ç", "c").Replace("Ç", "C")
                .Replace(" ", "_");

            try
            {
                using (var workbook = new XLWorkbook(templatePath))
                {
                    var sheet = workbook.Worksheet(1);
                    var items = await _context.Inventory
                        .Where(i => idList.Contains(i.Id))
                        .ToListAsync();

                    // Personel Bilgileri
                    sheet.Cell("B8").Value = $"{assignedToName} ({invItem.Firma ?? "REPKON"})";
                    sheet.Cell("E8").Value = personnel?.SicilNo ?? "—";

                    // Ürün Bilgileri (11. satırdan başla)
                    int startRow = 11;
                    for (int i = 0; i < items.Count; i++)
                    {
                        var itm = items[i];
                        int r = startRow + i;
                        sheet.Cell(r, 2).SetValue($"{itm.Brand} {itm.Model}");
                        sheet.Cell(r, 4).SetValue(itm.SerialNo ?? "—");
                        sheet.Cell(r, 5).SetValue(itm.AssignedAt.ToString("dd.MM.yyyy"));
                        sheet.Cell(r, 6).SetValue(assignedToName);
                        
                        // Border settings
                        var rowRange = sheet.Range(r, 2, r, 6);
                        rowRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                        rowRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                    }

                    foreach (var cell in sheet.CellsUsed())
                    {
                        if (cell.DataType != XLDataType.Text) continue;
                        var cellValue = cell.GetValue<string>();
                        if (string.IsNullOrWhiteSpace(cellValue)) continue;

                        if (cellValue.Contains("{{"))
                        {
                            var text = cellValue;
                            text = text.Replace("{{TARİH}}", DateTime.Now.ToString("dd.MM.yyyy"));
                            text = text.Replace("{{AD_SOYAD}}", invItem.AssignedTo);
                            text = text.Replace("{{DEPARTMAN}}", personnel?.Bolum ?? "—");
                            text = text.Replace("{{SİCİL_NO}}", personnel?.SicilNo ?? "—");
                            text = text.Replace("{{TESLİM_EDEN}}", "Mustafa GÜDE");
                            cell.SetValue(text);
                        }
                    }

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        fileContent = stream.ToArray();
                    }
                }

                return File(fileContent, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Zimmet_{safeName}.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Excel oluşturulurken hata: {ex.Message}");
            }
        }

        [HttpGet("{id:int}")]
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
            _context.Logs.Add(new AuditLogEntry { Action = "INVENTORY_CREATED", Details = $"Yeni zimmet/envanter kaydı oluşturuldu: {inventoryItem.Brand} {inventoryItem.Model} (Atanan: {inventoryItem.AssignedTo}, Firma: {inventoryItem.Firma})", Operator = operatorInfo });

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
