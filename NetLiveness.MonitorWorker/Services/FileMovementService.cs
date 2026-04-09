using System.Management;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Services
{
    public class FileMovementService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<FileMovementService> _logger;
        private readonly string[] _targetExtensions = { "sldprt", "dwg", "dxf", "step", "iam", "ipt" };

        public FileMovementService(IServiceScopeFactory scopeFactory, ILogger<FileMovementService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("File Movement Monitoring Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var settings = await context.Settings.FirstOrDefaultAsync(stoppingToken);
                        
                        var terminals = await context.Terminals
                            .Where(t => t.EnableFileMonitoring == true && t.Status == "UP")
                            .ToListAsync(stoppingToken);

                        foreach (var t in terminals)
                        {
                            if (stoppingToken.IsCancellationRequested) break;
                            await ScanTerminalAsync(t, context, settings, stoppingToken);
                        }

                        await context.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in FileMovementService loop.");
                }

                // Scan every 5 minutes (or as configured)
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task ScanTerminalAsync(Terminal t, AppDbContext context, AppSettings settings, CancellationToken ct)
        {
            try
            {
                var options = new ConnectionOptions
                {
                    Timeout = TimeSpan.FromSeconds(30)
                };

                bool isLocal = string.Equals(t.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(t.Host, "127.0.0.1") ||
                               string.Equals(t.Host, ".") ||
                               string.Equals(t.Host, Environment.MachineName, StringComparison.OrdinalIgnoreCase);

                if (!isLocal)
                {
                    options.Username = !string.IsNullOrEmpty(t.Username) ? t.Username : settings.WmiUser;
                    options.Password = !string.IsNullOrEmpty(t.Password) ? t.Password : settings.WmiPass;
                    
                    if (!string.IsNullOrEmpty(settings.WmiDomain))
                        options.Authority = "ntlmdomain:" + settings.WmiDomain;
                }

                var scope = new ManagementScope($@"\\{(isLocal ? "." : t.Host)}\root\cimv2", options);
                await Task.Run(() => scope.Connect(), ct);

                if (!scope.IsConnected) return;

                var paths = (t.MonitoredPaths ?? "C:\\Users").Split(';', StringSplitOptions.RemoveEmptyEntries);
                var extensions = (t.MonitoredExtensions ?? "sldprt;dwg;dxf;step;iam;ipt").Split(';', StringSplitOptions.RemoveEmptyEntries);

                foreach (var path in paths)
                {
                    // WMI Path formatting: C:\Users -> Drive='C:' AND Path='\\Users\\'
                    var parts = path.Split(':', 2);
                    if (parts.Length < 2) continue;
                    
                    var drive = parts[0] + ":";
                    var wmiPath = parts[1].Replace("\\", "\\\\");
                    if (!wmiPath.EndsWith("\\\\")) wmiPath += "\\\\";

                    foreach (var ext in extensions)
                    {
                        var sizeBytes = (long)t.FileThresholdMb * 1024 * 1024;
                        var queryStr = $"SELECT Name, FileName, Extension, FileSize, LastModified, Readable FROM CIM_DataFile " +
                                       $"WHERE Drive='{drive}' AND Path LIKE '{wmiPath}%' " +
                                       $"AND Extension='{ext}' AND FileSize > {sizeBytes}";

                        await Task.Run(() =>
                        {
                            using var searcher = new ManagementObjectSearcher(scope, new ObjectQuery(queryStr));
                            searcher.Options.Timeout = TimeSpan.FromSeconds(30);

                            foreach (ManagementObject file in searcher.Get())
                            {
                                var fileName = file["FileName"]?.ToString() ?? "Unknown";
                                var fullPath = file["Name"]?.ToString() ?? "";
                                var size = Convert.ToInt64(file["FileSize"]);
                                
                                // Check if we already flagged this file on this PC recently
                                var exists = context.FileMovementAlerts.Any(a => 
                                    a.PcName == t.Name && 
                                    a.FilePath == fullPath && 
                                    a.Timestamp > DateTime.Now.AddDays(-1));

                                if (!exists)
                                {
                                    context.FileMovementAlerts.Add(new FileMovementAlert
                                    {
                                        PcName = t.Name,
                                        FileName = fileName,
                                        FilePath = fullPath,
                                        Extension = ext,
                                        FileSize = size,
                                        Timestamp = DateTime.Now,
                                        Description = $"Yeni büyük çizim dosyası tespit edildi: {fileName} ({t.FileThresholdMb}MB üzeri)"
                                    });
                                    
                                    _logger.LogWarning($"CRITICAL FILE DETECTED on {t.Name}: {fullPath} ({size / 1024 / 1024} MB)");
                                }
                            }
                        }, ct);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to scan files on {t.Host}: {ex.Message}");
            }
        }
    }
}
