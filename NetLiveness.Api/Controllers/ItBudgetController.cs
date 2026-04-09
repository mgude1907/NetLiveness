using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItBudgetController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItBudgetController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{year}")]
        public async Task<IActionResult> GetBudget(int year)
        {
            var categories = await _context.ItBudgetCategories
                .Include(c => c.Items)
                .Where(c => c.Year == year)
                .OrderBy(c => c.OrderIndex)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost("category")]
        public async Task<IActionResult> CreateCategory([FromBody] ItBudgetCategory category)
        {
            if (string.IsNullOrWhiteSpace(category.Name))
                return BadRequest("Kategori adı boş olamaz.");

            // Calculate OrderIndex if not provided
            if (category.OrderIndex == 0)
            {
                var maxOrder = await _context.ItBudgetCategories
                    .Where(c => c.Year == category.Year)
                    .MaxAsync(c => (int?)c.OrderIndex) ?? 0;
                category.OrderIndex = maxOrder + 1;
            }

            _context.ItBudgetCategories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpDelete("category/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var cat = await _context.ItBudgetCategories.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
            if (cat == null) return NotFound();

            // First delete all items
            _context.ItBudgetItems.RemoveRange(cat.Items);
            _context.ItBudgetCategories.Remove(cat);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("item")]
        public async Task<IActionResult> CreateItem([FromBody] ItBudgetItem item)
        {
            if (string.IsNullOrWhiteSpace(item.Name))
                return BadRequest("Kalem adı boş olamaz.");
                
            var categoryExists = await _context.ItBudgetCategories.AnyAsync(c => c.Id == item.CategoryId);
            if (!categoryExists) return BadRequest("Kategori bulunamadı.");

            _context.ItBudgetItems.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpPut("item/{id}")]
        public async Task<IActionResult> UpdateItem(int id, [FromBody] ItBudgetItem item)
        {
            if (id != item.Id) return BadRequest();

            var existing = await _context.ItBudgetItems.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = item.Name;
            existing.CategoryId = item.CategoryId;
            existing.Jan = item.Jan;
            existing.Feb = item.Feb;
            existing.Mar = item.Mar;
            existing.Apr = item.Apr;
            existing.May = item.May;
            existing.Jun = item.Jun;
            existing.Jul = item.Jul;
            existing.Aug = item.Aug;
            existing.Sep = item.Sep;
            existing.Oct = item.Oct;
            existing.Nov = item.Nov;
            existing.Dec = item.Dec;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("item/{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var item = await _context.ItBudgetItems.FindAsync(id);
            if (item == null) return NotFound();

            _context.ItBudgetItems.Remove(item);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
