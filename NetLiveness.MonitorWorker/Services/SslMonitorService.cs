using System.Net.Sockets;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Services
{
    public class SslMonitorService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SslMonitorService> _logger;

        public SslMonitorService(IServiceScopeFactory scopeFactory, ILogger<SslMonitorService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SSL Monitor Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var sslItems = await context.SslItems.ToListAsync(stoppingToken);

                        var tasks = sslItems.Select(s => CheckSslExpiryAsync(s, context, stoppingToken)).ToArray();
                        await Task.WhenAll(tasks);
                        
                        await context.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    // Şık bir şekilde durdurulduğu için loglamaya gerek yok
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurring while checking SSL certificates.");
                }

                try
                {
                    // Check once every 12 hours
                    await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task CheckSslExpiryAsync(SslItem item, AppDbContext context, CancellationToken stoppingToken)
        {
            try
            {
                using var client = new TcpClient();
                await client.ConnectAsync(item.Domain, 443);
                using var stream = new System.Net.Security.SslStream(client.GetStream(), false, (sender, cert, chain, errors) => {
                    item.ExpiryDate = DateTime.Parse(cert.GetExpirationDateString());
                    return true;
                });
                await stream.AuthenticateAsClientAsync(item.Domain);

                item.DaysLeft = (int)(item.ExpiryDate.Date - DateTime.Today).TotalDays;
                item.Status = item.DaysLeft > 0 ? "VALID" : "EXPIRED";

                if (item.DaysLeft <= 7 && item.Status == "VALID")
                {
                    context.Logs.Add(new AuditLogEntry
                    {
                        Action = "SSL_WARNING",
                        Details = $"{item.Domain} (Owner: {item.Owner}) SSL sertifikası bitimine {item.DaysLeft} gün kaldı!",
                        Operator = "System"
                    });
                }
            }
            catch
            {
                item.Status = "ERROR";
            }
        }
    }
}
