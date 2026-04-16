using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Globalization;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DirectoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DirectoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/directory (Üye girişi gerektirmez - Herkese açık)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DirectoryEntry>>> GetDirectoryEntries()
        {
            var entries = await _context.DirectoryEntries.ToListAsync();
            var personnels = await _context.Personnels.ToListAsync();

            // Create a fast lookup set for existing entries (composite key of FirstName|LastName)
            var existingKeys = new HashSet<string>(entries.Select(e => $"{e.FirstName.ToLower()}|{e.LastName.ToLower()}"));
            var combined = new List<DirectoryEntry>(entries);

            foreach (var p in personnels)
            {
                var key = $"{p.Ad.ToLower()}|{p.Soyad.ToLower()}";
                if (!existingKeys.Contains(key))
                {
                    combined.Add(new DirectoryEntry
                    {
                        Id = -p.Id,
                        FirstName = p.Ad,
                        LastName = p.Soyad,
                        Department = p.Bolum,
                        Position = p.Gorev,
                        MobilePhone = "",
                        InternalPhone = "",
                        Email = "",
                        ImageUrl = ""
                    });
                    existingKeys.Add(key); // Prevent duplicates from personnels if multiple has same name
                }
            }

            return combined.OrderBy(d => d.FirstName).ToList();
        }

        // GET: api/directory/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DirectoryEntry>> GetDirectoryEntry(int id)
        {
            var entry = await _context.DirectoryEntries.FindAsync(id);

            if (entry == null)
            {
                return NotFound();
            }

            return entry;
        }

        // POST: api/directory (Sadece Yönetim / Yetkililer erişebilir)
        [HttpPost]
        public async Task<ActionResult<DirectoryEntry>> PostDirectoryEntry(DirectoryEntry entry)
        {
            _context.DirectoryEntries.Add(entry);
            
            _context.Logs.Add(new AuditLogEntry {
                Action = "Rehber Kaydı Eklendi",
                Details = $"{entry.FirstName} {entry.LastName} eklendi.",
                Operator = "Sistem/Yönetici",
                Date = DateTime.Now
            });

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDirectoryEntry), new { id = entry.Id }, entry);
        }

        // PUT: api/directory/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDirectoryEntry(int id, DirectoryEntry entry)
        {
            if (id != entry.Id)
            {
                return BadRequest();
            }

            // Eğer id negatifse, bu bir Personel kaydıdır (DirectoryEntry tablosunda henüz yoktur).
            // Bu durumda yeni bir DirectoryEntry oluşturuyoruz.
            if (id < 0)
            {
                entry.Id = 0; // Veritabanında yeni bir ID alması için 0 yapıyoruz.
                _context.DirectoryEntries.Add(entry);
                
                _context.Logs.Add(new AuditLogEntry {
                    Action = "Personel Rehbere Aktarıldı",
                    Details = $"{entry.FirstName} {entry.LastName} personeli düzenlenerek rehbere özel kayıt edildi.",
                    Operator = "Sistem/Yönetici",
                    Date = DateTime.Now
                });
            }
            else
            {
                _context.Entry(entry).State = EntityState.Modified;

                _context.Logs.Add(new AuditLogEntry {
                    Action = "Rehber Kaydı Güncellendi",
                    Details = $"{entry.FirstName} {entry.LastName} kaydı güncellendi.",
                    Operator = "Sistem/Yönetici",
                    Date = DateTime.Now
                });
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (id > 0 && !DirectoryExists(id))
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

        // DELETE: api/directory/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDirectoryEntry(int id)
        {
            var entry = await _context.DirectoryEntries.FindAsync(id);
            if (entry == null)
            {
                return NotFound();
            }

            _context.DirectoryEntries.Remove(entry);
            
            _context.Logs.Add(new AuditLogEntry {
                Action = "Rehber Kaydı Silindi",
                Details = $"{entry.FirstName} {entry.LastName} rehberden silindi.",
                Operator = "Sistem/Yönetici",
                Date = DateTime.Now
            });

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DirectoryExists(int id)
        {
            return _context.DirectoryEntries.Any(e => e.Id == id);
        }

        // GET: api/directory/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv()
        {
            var entries = await _context.DirectoryEntries.OrderBy(d => d.FirstName).ToListAsync();
            
            var csv = new StringBuilder();
            csv.AppendLine("Ad,Soyad,Cep Telefonu,Dahili,Email,Bolum,Pozisyon");

            foreach (var e in entries)
            {
                var ad = e.FirstName?.Replace(",", " ") ?? "";
                var soyad = e.LastName?.Replace(",", " ") ?? "";
                var tel = e.MobilePhone?.Replace(",", " ") ?? "";
                var dahili = e.InternalPhone?.Replace(",", " ") ?? "";
                var mail = e.Email?.Replace(",", " ") ?? "";
                var bolum = e.Department?.Replace(",", " ") ?? "";
                var pozisyon = e.Position?.Replace(",", " ") ?? "";
                
                csv.AppendLine($"{ad},{soyad},{tel},{dahili},{mail},{bolum},{pozisyon}");
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", "SirketRehberi.csv");
        }

        // POST: api/directory/import
        [HttpPost("import")]
        public async Task<IActionResult> ImportCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Geçerli bir CSV dosyası seçilmedi.");

            var addedCount = 0;
            using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
            {
                var isHeader = true;
                while (!reader.EndOfStream)
                {
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    
                    if (isHeader)
                    {
                        isHeader = false;
                        continue;
                    }

                    var columns = line.Split(',');
                    if (columns.Length >= 2)
                    {
                        var firstName = columns[0].Trim();
                        var lastName = columns[1].Trim();

                        // Aynı isimde biri var mı? Yoksa ekle
                        if (!await _context.DirectoryEntries.AnyAsync(e => e.FirstName == firstName && e.LastName == lastName))
                        {
                            var entry = new DirectoryEntry
                            {
                                FirstName = firstName,
                                LastName = lastName,
                                MobilePhone = columns.Length > 2 ? columns[2].Trim() : "",
                                InternalPhone = columns.Length > 3 ? columns[3].Trim() : "",
                                Email = columns.Length > 4 ? columns[4].Trim() : "",
                                Department = columns.Length > 5 ? columns[5].Trim() : "",
                                Position = columns.Length > 6 ? columns[6].Trim() : ""
                            };
                            _context.DirectoryEntries.Add(entry);
                            addedCount++;
                        }
                    }
                }
            }

            if (addedCount > 0)
            {
                _context.Logs.Add(new AuditLogEntry {
                    Action = "Rehber CSV İçeri Aktarma",
                    Details = $"{addedCount} adet yeni personel rehbere eklendi.",
                    Operator = "Sistem/Yönetici",
                    Date = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"{addedCount} kayıt başarıyla içe aktarıldı." });
        }
    }
}
