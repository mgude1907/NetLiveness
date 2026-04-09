using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Models;
using NetLiveness.Api.Data;
using System.Management;
using Renci.SshNet;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TerminalsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TerminalsController> _logger;

        public TerminalsController(AppDbContext context, ILogger<TerminalsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Terminal>>> GetTerminals()
        {
            // Migration logic removed. Terminals should be managed via UI.
            return await _context.Terminals.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Terminal>> GetTerminal(int id)
        {
            var terminal = await _context.Terminals.FindAsync(id);

            if (terminal == null)
            {
                return NotFound();
            }

            return terminal;
        }

        [HttpPost]
        public async Task<ActionResult<Terminal>> PostTerminal(Terminal terminal)
        {
            _context.Terminals.Add(terminal);
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "TERMINAL_CREATED", Details = $"Yeni cihaz eklendi: {terminal.Name} ({terminal.Host})", Operator = operatorInfo });
            
            await _context.SaveChangesAsync();

            _logger.LogInformation($"[SİSTEM-AĞ] Yeni cihaz EKLENDİ. İsim: {terminal.Name} - IP/Host: {terminal.Host}");

            return CreatedAtAction(nameof(GetTerminal), new { id = terminal.Id }, terminal);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTerminal(int id, Terminal terminal)
        {
            if (id != terminal.Id)
            {
                return BadRequest();
            }

            _context.Entry(terminal).State = EntityState.Modified;

            try
            {
                var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
                _context.Logs.Add(new AuditLogEntry { Action = "TERMINAL_UPDATED", Details = $"Cihaz ayarları güncellendi: {terminal.Name} ({terminal.Host})", Operator = operatorInfo });

                await _context.SaveChangesAsync();
                _logger.LogInformation($"[SİSTEM-AĞ] Cihaz bilgileri GÜNCELLENDİ. İsim: {terminal.Name} - IP: {terminal.Host}");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TerminalExists(id))
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
        public async Task<IActionResult> DeleteTerminal(int id)
        {
            var terminal = await _context.Terminals.FindAsync(id);
            if (terminal == null)
            {
                return NotFound();
            }

            _logger.LogWarning($"[SİSTEM-AĞ] Cihaz SİLİNDİ. İsim: {terminal.Name} - IP: {terminal.Host}");
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "TERMINAL_DELETED", Details = $"Cihaz sistemden silindi: {terminal.Name} ({terminal.Host})", Operator = operatorInfo });
            
            _context.Terminals.Remove(terminal);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TerminalExists(int id)
        {
            return _context.Terminals.Any(e => e.Id == id);
        }

        [HttpPost("{id}/wmi-refresh")]
        public async Task<IActionResult> ForceWmiRefresh(int id)
        {
            var t = await _context.Terminals.FindAsync(id);
            if (t == null) return NotFound();

            if (t.SkipWmi == true) return BadRequest("Bu cihaz için sağlık taraması (WMI/SSH) devre dışı bırakılmıştır.");

            var settings = await _context.Settings.FirstOrDefaultAsync();
            if (settings == null) return BadRequest("Settings not found");

            if (t.DeviceType == "Sunucu" || t.DeviceType == "Sanal Makine" || t.DeviceType == "PC")
            {
                await UpdateServerHealthDirectly(t, settings);
            }
            else if (t.DeviceType == "ESXI")
            {
                await UpdateEsxiHealthDirectly(t, settings);
            }
            else
            {
                return BadRequest("Cihaz tipi uyumsuz.");
            }

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "TERMINAL_WMI_SCAN", Details = $"Manuel sağlık/WMI taraması tetiklendi: {t.Name}", Operator = operatorInfo });

            await _context.SaveChangesAsync();
            return Ok(t);
        }

        private async Task UpdateServerHealthDirectly(Terminal t, AppSettings settings)
        {
            try
            {
                var options = new ConnectionOptions();
                string user = !string.IsNullOrEmpty(t.Username) ? t.Username : settings.WmiUser;
                string pass = !string.IsNullOrEmpty(t.Password) ? t.Password : settings.WmiPass;

                bool isLocal = string.Equals(t.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(t.Host, "127.0.0.1") ||
                               string.Equals(t.Host, ".") ||
                               string.Equals(t.Host, Environment.MachineName, StringComparison.OrdinalIgnoreCase);

                if (!string.IsNullOrEmpty(user) && !isLocal)
                {
                    options.Username = user;
                    options.Password = pass;
                    if (!string.IsNullOrEmpty(settings.WmiDomain))
                        options.Authority = "ntlmdomain:" + settings.WmiDomain;
                }
                options.Timeout = TimeSpan.FromSeconds(45);
                var scope = new ManagementScope($@"\\{(isLocal ? "." : t.Host)}\root\cimv2", options);

                await Task.Run(() => scope.Connect());
                if (!scope.IsConnected) throw new Exception("WMI Scope bağlanamadı.");

                await Task.Run(() =>
                {
                    var diskQuery = new ObjectQuery("SELECT Size, FreeSpace FROM Win32_LogicalDisk WHERE DeviceID = 'C:'");
                    using (var searcher = new ManagementObjectSearcher(scope, diskQuery))
                    {
                        searcher.Options.Timeout = TimeSpan.FromSeconds(15);
                        foreach (ManagementObject disk in searcher.Get())
                        {
                            t.DiskSizeGb = Math.Round(Convert.ToDouble(disk["Size"]) / (1024 * 1024 * 1024), 1);
                            t.DiskFreeGb = Math.Round(Convert.ToDouble(disk["FreeSpace"]) / (1024 * 1024 * 1024), 1);
                        }
                    }

                    var cpuQuery = new ObjectQuery("SELECT LoadPercentage FROM Win32_Processor");
                    using (var searcher = new ManagementObjectSearcher(scope, cpuQuery))
                    {
                        searcher.Options.Timeout = TimeSpan.FromSeconds(15);
                        foreach (ManagementObject cpu in searcher.Get())
                        {
                            t.CpuUsage = Convert.ToInt32(cpu["LoadPercentage"]);
                        }
                    }

                    var osQuery = new ObjectQuery("SELECT FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem");
                    using (var searcher = new ManagementObjectSearcher(scope, osQuery))
                    {
                        searcher.Options.Timeout = TimeSpan.FromSeconds(15);
                        foreach (ManagementObject os in searcher.Get())
                        {
                            double totalRam = Convert.ToDouble(os["TotalVisibleMemorySize"]);
                            double freeRam = Convert.ToDouble(os["FreePhysicalMemory"]);
                            t.RamUsage = (int)((totalRam - freeRam) / totalRam * 100);
                        }
                    }
                });

                t.LastError = null;
            }
            catch (Exception ex)
            {
                t.LastError = "WMI: " + (ex is TimeoutException ? "Zaman aşımı" : ex.Message);
                t.DiskSizeGb = 0; t.DiskFreeGb = 0; t.CpuUsage = 0; t.RamUsage = 0;
            }
        }

        private async Task UpdateEsxiHealthDirectly(Terminal t, AppSettings settings)
        {
            string user = !string.IsNullOrEmpty(t.Username) ? t.Username : settings.WmiUser;
            string pass = !string.IsNullOrEmpty(t.Password) ? t.Password : settings.WmiPass;

            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass)) return;

            try
            {
                await Task.Run(() =>
                {
                    var authMethods = new List<AuthenticationMethod>();
                    authMethods.Add(new PasswordAuthenticationMethod(user, pass));
                    var keyboardInt = new KeyboardInteractiveAuthenticationMethod(user);
                    keyboardInt.AuthenticationPrompt += (sender, e) => { foreach (var prompt in e.Prompts) if (prompt.Request.ToLower().Contains("password")) prompt.Response = pass; };
                    authMethods.Add(keyboardInt);

                    var connInfo = new Renci.SshNet.ConnectionInfo(t.Host, 22, user, authMethods.ToArray()) { Timeout = TimeSpan.FromSeconds(45) };
                    using var client = new SshClient(connInfo);
                    client.Connect();

                    var summaryCmd = client.CreateCommand("vim-cmd hostsvc/hostsummary | grep -E 'cpuUsage|memoryUsage|totalMemory|hz'");
                    summaryCmd.CommandTimeout = TimeSpan.FromSeconds(45);
                    var summaryOutput = summaryCmd.Execute();

                    long cpuHz = ParseVimValue(summaryOutput, "hz"), cpuUsage = ParseVimValue(summaryOutput, "cpuUsage");
                    long memTotal = ParseVimValue(summaryOutput, "totalMemory"), memUsage = ParseVimValue(summaryOutput, "memoryUsage");

                    if (cpuHz > 0) t.CpuUsage = (int)((cpuUsage * 1000000.0) / cpuHz * 100);
                    if (memTotal > 0) t.RamUsage = (int)((double)memUsage / memTotal * 100);

                    var diskCmd = client.CreateCommand("df -m | grep /vmfs/volumes/");
                    diskCmd.CommandTimeout = TimeSpan.FromSeconds(45);
                    var diskParts = diskCmd.Execute().Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in diskParts)
                    {
                        var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 4 && parts.Last().StartsWith("/vmfs/volumes/") && double.TryParse(parts[1], out double tot) && double.TryParse(parts[3], out double fre))
                        {
                            if (tot > 5000) { t.DiskSizeGb = Math.Round(tot / 1024, 1); t.DiskFreeGb = Math.Round(fre / 1024, 1); break; }
                        }
                    }
                    t.LastError = null;
                    client.Disconnect();
                });
            }
            catch (Exception ex)
            {
                t.LastError = "SSH: " + (ex is TimeoutException ? "Zaman aşımı" : ex.Message);
                t.DiskSizeGb = 0; t.DiskFreeGb = 0; t.CpuUsage = 0; t.RamUsage = 0;
            }
        }

        [HttpPost("{id}/scan-files")]
        public async Task<IActionResult> ForceScanFiles(int id)
        {
            var t = await _context.Terminals.FindAsync(id);
            if (t == null) return NotFound();

            var settings = await _context.Settings.FirstOrDefaultAsync();
            if (settings == null) return BadRequest("Settings not found");

            try
            {
                var options = new ConnectionOptions {
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
                await Task.Run(() => scope.Connect());

                if (!scope.IsConnected) return BadRequest("Cihaza WMI ile bağlanılamadı. Lütfen IP/Host veya WMI kimlik bilgilerini kontrol edin.");

                var paths = (t.MonitoredPaths ?? "C:\\Users").Split(';', StringSplitOptions.RemoveEmptyEntries);
                var extensions = (t.MonitoredExtensions ?? "sldprt;dwg;dxf;step;iam;ipt").Split(';', StringSplitOptions.RemoveEmptyEntries);
                int foundCount = 0;
                var nowUtc = DateTime.UtcNow;

                foreach (var path in paths)
                {
                    var parts = path.Split(':', 2);
                    if (parts.Length < 2) continue;
                    var drive = parts[0] + ":";
                    var wmiPath = parts[1].Replace("\\", "\\\\");
                    if (!wmiPath.EndsWith("\\\\")) wmiPath += "\\\\";

                    foreach (var ext in extensions)
                    {
                        var sizeBytes = (long)t.FileThresholdMb * 1024 * 1024;
                        // For manual scan, increase searcher timeout to 60s
                        var queryStr = $"SELECT Name, FileName, Extension, FileSize, LastModified, Readable FROM CIM_DataFile " +
                                       $"WHERE Drive='{drive}' AND Path LIKE '{wmiPath}%' " +
                                       $"AND Extension='{ext}' AND FileSize > {sizeBytes}";

                        await Task.Run(() =>
                        {
                            using var searcher = new ManagementObjectSearcher(scope, new ObjectQuery(queryStr));
                            searcher.Options.Timeout = TimeSpan.FromSeconds(60);

                            foreach (ManagementObject file in searcher.Get())
                            {
                                var fileName = file["FileName"]?.ToString() ?? "Unknown";
                                var fullPath = file["Name"]?.ToString() ?? "";
                                var size = Convert.ToInt64(file["FileSize"]);
                                
                                var exists = _context.FileMovementAlerts.Any(a => 
                                    a.PcName == t.Name && a.FilePath == fullPath && a.Timestamp > nowUtc.AddDays(-1));

                                if (!exists)
                                {
                                    _context.FileMovementAlerts.Add(new FileMovementAlert
                                    {
                                        PcName = t.Name,
                                        FileName = fileName,
                                        FilePath = fullPath,
                                        Extension = ext,
                                        FileSize = size,
                                        Timestamp = nowUtc,
                                        Description = $"Manuel tarama: {fileName} ({t.FileThresholdMb}MB üzeri)"
                                    });
                                    foundCount++;
                                }
                            }
                        });
                    }
                }

                if (foundCount > 0) await _context.SaveChangesAsync();
                return Ok(new { message = $"{foundCount} adet yeni kritik dosya hareketi tespit edildi.", count = foundCount });
            }
            catch (Exception ex)
            {
                return BadRequest($"Tarama hatası: {ex.Message}");
            }
        }

        private long ParseVimValue(string output, string key)
        {
            var match = System.Text.RegularExpressions.Regex.Match(output, key + @"\s*=\s*(\d+)");
            if (!match.Success) match = System.Text.RegularExpressions.Regex.Match(output, key + @"\)\s*(\d+)");
            return match.Success && long.TryParse(match.Groups[1].Value, out long val) ? val : 0;
        }
    }
}

