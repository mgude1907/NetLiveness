using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Net.Mail;
using System.Net;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OnboardingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OnboardingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Onboarding>>> GetOnboardings()
        {
            return await _context.Onboardings.OrderByDescending(o => o.CreatedAt).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Onboarding>> CreateOnboarding(Onboarding onboarding)
        {
            onboarding.CreatedAt = DateTime.Now;
            _context.Onboardings.Add(onboarding);
            await _context.SaveChangesAsync();

            // Try to send email
            _ = SendNotificationEmailAsync(onboarding); // Fire and forget

            return CreatedAtAction(nameof(GetOnboardings), new { id = onboarding.Id }, onboarding);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOnboarding(int id, Onboarding updated)
        {
            if (id != updated.Id) return BadRequest();

            _context.Entry(updated).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOnboarding(int id)
        {
            var onboarding = await _context.Onboardings.FindAsync(id);
            if (onboarding == null) return NotFound();

            _context.Onboardings.Remove(onboarding);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task SendNotificationEmailAsync(Onboarding onboarding)
        {
            try
            {
                var settings = await _context.Settings.FirstOrDefaultAsync();
                if (settings == null || !settings.SmtpEnabled) return;

                using var client = new SmtpClient(settings.SmtpServer, settings.SmtpPort)
                {
                    Credentials = new NetworkCredential(settings.SmtpUser, settings.SmtpPass),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(settings.SmtpUser, "REPKON Yönetim Sistemi"),
                    Subject = $"Yeni İş Başı: {onboarding.FirstName} {onboarding.LastName}",
                    Body = $@"
                        <h3>Yeni Personel İş Başı Bildirimi</h3>
                        <p>Aşağıdaki personel için iş başı kaydı oluşturulmuştur. Lütfen gerekli BT/İdari donanım ve erişim hazırlıklarını yapınız.</p>
                        <table border='1' cellpadding='5' cellspacing='0'>
                            <tr><td><b>Ad Soyad</b></td><td>{onboarding.FirstName} {onboarding.LastName}</td></tr>
                            <tr><td><b>Şirket</b></td><td>{onboarding.Company}</td></tr>
                            <tr><td><b>Bağlı Olduğu Yönetici</b></td><td>{onboarding.Manager}</td></tr>
                            <tr><td><b>İş Başı Tarihi</b></td><td>{onboarding.StartDate:dd.MM.yyyy}</td></tr>
                            <tr><td><b>Cep Telefonu</b></td><td>{onboarding.MobilePhone}</td></tr>
                            <tr><td><b>Email</b></td><td>{onboarding.Email}</td></tr>
                            <tr><td><b>Ev Adresi</b></td><td>{onboarding.HomeAddress}</td></tr>
                        </table>
                    ",
                    IsBodyHtml = true
                };

                // Add recipients
                var emailsStr = $"{settings.ItEmailTo},{settings.AdminEmailTo}";
                var emails = emailsStr.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                if (emails != null && emails.Length > 0)
                {
                    foreach (var email in emails)
                    {
                        mailMessage.To.Add(email.Trim());
                    }
                    await client.SendMailAsync(mailMessage);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending onboarding email: {ex.Message}");
            }
        }
    }
}
