using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Management;
using System.Net.NetworkInformation;
using System.Diagnostics;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserActivityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserActivityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("targets")]
        public async Task<ActionResult<IEnumerable<UserActivityTarget>>> GetTargets()
        {
            // Artık sadece Terminals tablosundan dönüyoruz (UserActivityTarget tipine map ederek frontend uyumu sağlıyoruz)
            var computers = await _context.Terminals
                .Where(t => t.EnableUserActivity || t.DeviceType.ToUpper() == "PC")
                .Select(t => new UserActivityTarget
                {
                    Id = t.Id,
                    PcName = t.Name ?? t.Host,
                    Group = t.UserActivityGroup ?? "Genel",
                    IsEnabled = true,
                    LastCheck = t.LastCheck ?? DateTime.UtcNow
                })
                .ToListAsync();

            return Ok(computers);
        }

        [HttpPost("targets")]
        public async Task<ActionResult<UserActivityTarget>> AddTarget(UserActivityTarget target)
        {
            _context.UserActivityTargets.Add(target);
            
            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "MONITOR_TARGET_ADDED", Details = $"Kullanıcı izleme hedefi eklendi (Eski Sistem/Fallback): {target.PcName}", Operator = operatorInfo });
            
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTargets), new { id = target.Id }, target);
        }

        [HttpDelete("targets/{id}")]
        public async Task<IActionResult> DeleteTarget(int id)
        {
            var target = await _context.UserActivityTargets.FindAsync(id);
            if (target == null) return NotFound();

            var operatorInfo = $"{User.Identity?.Name ?? "Admin"} ({HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Bilinmiyor"})";
            _context.Logs.Add(new AuditLogEntry { Action = "MONITOR_TARGET_DELETED", Details = $"Kullanıcı izleme hedefi kaldırıldı (Eski Sistem/Fallback): {target.PcName}", Operator = operatorInfo });

            _context.UserActivityTargets.Remove(target);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("force-poll/{pcName}")]
        public async Task<IActionResult> ForcePoll(string pcName)
        {
            try
            {
                bool isLocal = string.Equals(pcName, "localhost", StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(pcName, "127.0.0.1") ||
                               string.Equals(pcName, ".") ||
                               string.Equals(pcName, Environment.MachineName, StringComparison.OrdinalIgnoreCase);

                if (isLocal)
                {
                    var processes = System.Diagnostics.Process.GetProcesses();
                    var toAddLocal = new List<UserAppActivity>();
                    var nowLocal = DateTime.UtcNow;
                    var seenAppsLocal = new HashSet<string>();

                    foreach (var p in processes)
                    {
                        try
                        {
                            if (p.SessionId == 0) continue;
                            string name = p.ProcessName + ".exe";
                            if (IsSystemProcess(name)) continue;

                            if (!seenAppsLocal.Contains(name))
                            {
                                toAddLocal.Add(new UserAppActivity
                                {
                                    PcName = pcName,
                                    AppName = name,
                                    WindowTitle = p.MainWindowTitle,
                                    Timestamp = nowLocal,
                                    DurationSeconds = 30,
                                    IsActive = true,
                                    UserName = Environment.UserName
                                });
                                seenAppsLocal.Add(name);
                            }
                        }
                        catch { }
                    }

                    if (toAddLocal.Count > 0)
                    {
                        _context.UserAppActivities.AddRange(toAddLocal);
                        
                        var term = await _context.Terminals.FirstOrDefaultAsync(t => t.Name.ToLower() == pcName.ToLower());
                        if (term != null)
                        {
                            term.LastUserName = Environment.UserName;
                            term.LastActivityTime = DateTime.UtcNow;
                            term.LastCheck = DateTime.UtcNow;
                            term.Status = "UP";
                        }
                        await _context.SaveChangesAsync();
                    }

                    return Ok(new { message = $"{toAddLocal.Count} adet uygulama verisi başarıyla çekildi.", count = toAddLocal.Count });
                }
                else
                {
                    // Ping check
                    using (var ping = new Ping())
                    {
                        try
                        {
                            var reply = await ping.SendPingAsync(pcName, 2000);
                            if (reply.Status != IPStatus.Success)
                            {
                                return BadRequest(new { message = $"Cihaz ulaşılamaz durumda (Ping Hatası: {reply.Status})." });
                            }
                        }
                        catch (Exception ex)
                        {
                            return BadRequest(new { message = $"Cihaz bulunamadı veya DNS hatası: {ex.Message}" });
                        }
                    }

                    var toAdd = new List<UserAppActivity>();
                    int count = 0;

                    var settings = await _context.Settings.FirstOrDefaultAsync();

                    // WMI: async Task.Run + 20 sn timeout
                    string detectedUser = null;
                    await Task.Run(() =>
                    {
                        var options = new ConnectionOptions();
                        options.Timeout = TimeSpan.FromSeconds(45);

                        if (settings != null && !string.IsNullOrEmpty(settings.WmiUser) && !isLocal)
                        {
                            options.Username = settings.WmiUser;
                            options.Password = settings.WmiPass;
                            if (!string.IsNullOrEmpty(settings.WmiDomain))
                                options.Authority = "ntlmdomain:" + settings.WmiDomain;
                        }

                        var scope = new ManagementScope($@"\\{(isLocal ? "." : pcName)}\root\cimv2", options);
                        scope.Connect();

                        // FIRST: Get current logged in user
                        var userQuery = new ObjectQuery("SELECT UserName FROM Win32_ComputerSystem");
                        using var userSearcher = new ManagementObjectSearcher(scope, userQuery);
                        foreach (ManagementObject obj in userSearcher.Get())
                        {
                            detectedUser = obj["UserName"]?.ToString();
                            // Strip domain if present (e.g., "DOMAIN\user" -> "user")
                            if (!string.IsNullOrEmpty(detectedUser) && detectedUser.Contains("\\"))
                            {
                                detectedUser = detectedUser.Split('\\').Last();
                            }
                        }

                        var query = new ObjectQuery("SELECT Name, Caption FROM Win32_Process WHERE SessionId > 0");
                        using var searcher = new ManagementObjectSearcher(scope, query);
                        searcher.Options.Timeout = TimeSpan.FromSeconds(35);

                        var seenApps = new HashSet<string>();
                        var now = DateTime.UtcNow;
                        foreach (ManagementObject obj in searcher.Get())
                        {
                            string name = obj["Name"]?.ToString() ?? "";
                            string title = obj["Caption"]?.ToString() ?? "";
                            if (string.IsNullOrEmpty(name) || IsSystemProcess(name)) continue;

                            if (!seenApps.Contains(name))
                            {
                                toAdd.Add(new UserAppActivity
                                {
                                    PcName          = pcName,
                                    AppName         = name,
                                    WindowTitle     = title,
                                    Timestamp       = now,
                                    DurationSeconds = 30,
                                    IsActive        = true,
                                    UserName        = detectedUser // Store the detected user
                                });
                                seenApps.Add(name);
                            }
                        }
                    }).WaitAsync(TimeSpan.FromSeconds(35));

                    count = toAdd.Count;
                    if (count > 0 || !string.IsNullOrEmpty(detectedUser))
                    {
                        // Update Terminal record with the detected user
                        var term = await _context.Terminals.FirstOrDefaultAsync(t => t.Name.ToLower() == pcName.ToLower() || t.Host.ToLower() == pcName.ToLower());
                        if (term != null)
                        {
                            if (!string.IsNullOrEmpty(detectedUser)) term.LastUserName = detectedUser;
                            term.LastActivityTime = DateTime.UtcNow;
                            term.LastCheck = DateTime.UtcNow;
                            term.Status = "UP";
                        }

                        if (toAdd.Count > 0)
                        {
                            _context.UserAppActivities.AddRange(toAdd);
                        }
                        await _context.SaveChangesAsync();
                    }

                    return Ok(new { message = $"{count} adet uygulama verisi başarıyla çekildi.", count });
                }
            }
            catch (TimeoutException)
            {
                return BadRequest(new { message = "WMI bağlantısı zaman aşımına uğradı (45 sn)." });
            }
            catch (Exception ex)
            {
                // Update terminal with error info even on manual poll failure
                var term = await _context.Terminals.FirstOrDefaultAsync(t => t.Name.ToLower() == pcName.ToLower() || t.Host.ToLower() == pcName.ToLower());
                if (term != null)
                {
                    term.LastError = "WMI Hatası: " + ex.Message;
                    term.Status = "Error";
                    term.LastCheck = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                return BadRequest(new { message = $"Hata: {ex.Message}" });
            }
        }

        private bool IsSystemProcess(string name)
        {
            if (string.IsNullOrEmpty(name)) return true;
            string n = name.Trim().ToLowerInvariant();
            return n.StartsWith("explorer") || n.StartsWith("svchost") || n == "conhost.exe" ||
                   n == "runtimebroker.exe" || n == "taskhostw.exe" || n == "ctfmon.exe" ||
                   n == "searchhost.exe" || n == "searchindexer.exe" || n == "dwm.exe" ||
                   n == "lsass.exe" || n == "services.exe" || n == "winlogon.exe" || n.Contains("logonui") ||
                   n == "fontdrvhost.exe" || n == "sihost.exe" || n == "smartscreen.exe" ||
                   n == "iscsiagent.exe" || n == "tvnserver.exe" || n == "igfxemn.exe" ||
                   n == "searchapp.exe" || n == "textinputhost.exe" || n == "rtkauduservice64.exe" ||
                   n == "securityhealthsystray.exe" || n == "spoolsv.exe" || n == "csrss.exe" ||
                   n == "smss.exe" || n == "system.exe" || n == "idle.exe" || n == "wlanext.exe" ||
                   n == "igfxhk.exe" || n == "applicationframehost.exe" || n == "audiodg.exe" ||
                   n == "wmiapsrv.exe" || n.Contains("whatsapp.root.exe") || n.Contains("eset") ||
                   n.StartsWith("vbox") || n.StartsWith("vmware") || 
                   n == "systemsettings.exe" || n == "backgroundtaskhost.exe" ||
                   n == "filecoauth.exe" || n == "lockapp.exe" || n == "video.ui.exe" ||
                   n == "datamnsrv.exe" || n == "dllhost.exe" || n == "wmiprvse.exe" ||
                   n == "taskmgr.exe" || n == "startmenuexperiencehost.exe" ||
                   n == "shellexperiencehost.exe" || n.Contains("logi") || n.Contains("onedrive") ||
                   n.Contains("dropbox") || n.Contains("googlecrash") || n.Contains("update") ||
                   n == "wininit.exe" || n == "taskeng.exe" || n == "wscntfy.exe" || n == "searchui.exe" ||
                   n.Contains("uninst") || n.Contains("aw-watcher") || n.Contains("aw-server") ||
                   n.Contains("language_server") || n.Contains("sldprocmon") || n.Contains("localservicecontrol") ||
                   n.Contains("lenovo") || n.Contains("adobe") || n.Contains("intel") || n.Contains("nvidia") ||
                   n.Contains("cui") || n.Contains("graphics") || n.Contains("audio") ||
                   n.Contains("esrv") || n.Contains("conisio") || n.Contains("aceventsync") ||
                   n.Contains("daemon") || n.Contains("service") || n.Contains("host.exe");
        }

        // Mesai saati yardımcı metodu: 07:00 - 16:00
        private (DateTime start, DateTime end) GetShiftWindow(DateTime now)
        {
            var shiftStart = now.Hour >= 7 ? now.Date.AddHours(7) : now.Date.AddDays(-1).AddHours(7);
            // End of today (23:59:59) ensures we see activity after 16:00
            var shiftEnd = now.Date.AddDays(1).AddTicks(-1); 
            return (shiftStart, shiftEnd);
        }

        private string GetFriendlyAppName(string exeName)
        {
            if (string.IsNullOrEmpty(exeName)) return "Bilinmeyen";
            string lower = exeName.ToLower();
            
            if (lower == "chrome.exe") return "Google Chrome";
            if (lower == "msedge.exe") return "Microsoft Edge";
            if (lower == "firefox.exe") return "Mozilla Firefox";
            if (lower == "iexplore.exe") return "Internet Explorer";
            if (lower == "explorer.exe") return "Windows Gezgini";
            if (lower.Contains("sldworks")) return "SolidWorks";
            if (lower == "outlook.exe") return "Microsoft Outlook";
            if (lower == "excel.exe") return "Microsoft Excel";
            if (lower == "winword.exe") return "Microsoft Word";
            if (lower == "teams.exe" || lower == "ms-teams.exe") return "Microsoft Teams";
            if (lower == "mattermost.exe") return "Mattermost";
            if (lower == "code.exe" || lower == "cursor.exe") return "VS Code / Cursor";
            if (lower == "whatsapp.exe" || lower.Contains("whatsapp")) return "WhatsApp";
            if (lower == "mstsc.exe") return "Uzak Masaüstü Bağlantısı";
            if (lower == "devenv.exe") return "Visual Studio";
            if (lower == "ssms.exe") return "SQL Server Mgmt Studio";
            if (lower == "vpnui.exe" || lower.Contains("anyconnect")) return "Cisco AnyConnect";
            if (lower.Contains("autocad") || lower == "acad.exe") return "AutoCAD";
            if (lower == "antigravity.exe" || lower == "node.exe") return "Antigravity";
            if (lower == "smartpss.exe") return "SmartPSS";
            if (lower == "ifs.exe") return "IFS Enterprise Explorer";
            
            // Fallback: .exe uzantısını silip baş harfini büyüt
            if (lower.EndsWith(".exe") && exeName.Length > 4)
            {
                string name = exeName.Substring(0, exeName.Length - 4);
                return char.ToUpper(name[0]) + name.Substring(1);
            }
            return exeName;
        }

        [HttpGet("summary/{pcName}")]
        public async Task<ActionResult> GetSummary(string pcName)
        {
            var localNow = DateTime.Now;
            var (localShiftStart, localShiftEnd) = GetShiftWindow(localNow);
            var shiftStart = localShiftStart.ToUniversalTime();
            var shiftEnd = localShiftEnd.ToUniversalTime();

            // Sadece BUGÜNKÜ mesai saatleri içindeki verileri filtrele
            var allActivities = await _context.UserAppActivities
                .Where(a => a.PcName.ToLower() == pcName.ToLower() && a.Timestamp >= shiftStart && a.Timestamp <= shiftEnd)
                .ToListAsync();

            var activities = allActivities.Where(a => !IsSystemProcess(a.AppName)).ToList();

            var summary = activities
                .GroupBy(a => GetFriendlyAppName(a.AppName))
                .Select(g => new
                {
                    AppName              = g.Key,
                    TotalDurationSeconds = g.GroupBy(a => a.Timestamp.Ticks / 300000000).Sum(bucket => bucket.Max(a => a.DurationSeconds)),
                    TotalActiveSeconds   = g.Where(a => a.IsActive).GroupBy(a => a.Timestamp.Ticks / 300000000).Sum(bucket => bucket.Max(a => a.DurationSeconds)),
                    LastSeen             = g.Max(a => a.Timestamp)
                })
                .OrderByDescending(x => x.TotalActiveSeconds)
                .Take(10)
                .ToList();

            return Ok(summary);
        }

        [HttpGet("web-summary/{pcName}")]
        public async Task<ActionResult> GetWebSummary(string pcName)
        {
            var localNow = DateTime.Now;
            var (localShiftStart, localShiftEnd) = GetShiftWindow(localNow);
            var shiftStart = localShiftStart.ToUniversalTime();
            var shiftEnd = localShiftEnd.ToUniversalTime();
            var browsers = new[] { "chrome.exe", "msedge.exe", "firefox.exe", "iexplore.exe" };

            // Sadece BUGÜNKÜ mesai saatleri içindeki verileri filtrele
            var activities = await _context.UserAppActivities
                .Where(a => a.PcName.ToLower() == pcName.ToLower() && a.Timestamp >= shiftStart && a.Timestamp <= shiftEnd)
                .Where(a => browsers.Contains(a.AppName.ToLower()) && !string.IsNullOrEmpty(a.WindowTitle))
                .ToListAsync();

            var webSummary = activities
                .Select(a =>
                {
                    string title = a.WindowTitle ?? "";
                    string domain = "Diğer";

                    if (title.Contains(" - "))
                        domain = title.Split(" - ").Last().Trim();
                    else if (title.Contains("|"))
                        domain = title.Split("|").Last().Trim();
                    else if (!string.IsNullOrWhiteSpace(title))
                        domain = title;

                    return new { Domain = domain, Duration = a.DurationSeconds };
                })
                .GroupBy(x => x.Domain)
                .Select(g => new
                {
                    Domain       = g.Key,
                    TotalSeconds = g.Sum(x => x.Duration)
                })
                .OrderByDescending(x => x.TotalSeconds)
                .Take(10)
                .ToList();

            return Ok(webSummary);
        }

        [HttpGet("latest/{pcName}")]
        public async Task<ActionResult> GetLatest(string pcName)
        {
            var activities = await _context.UserAppActivities
                .Where(a => a.PcName.ToLower() == pcName.ToLower())
                .OrderByDescending(a => a.Timestamp)
                .Take(10)
                .ToListAsync();

            return Ok(activities);
        }
        [HttpGet("detailed-stats/{pcName}")]
        public async Task<ActionResult> GetDetailedStats(string pcName)
        {
            var utcNow = DateTime.UtcNow;
            var localNow = DateTime.Now;
            
            // 07:00 - 16:00 Mesai Saati Mantığı (Local)
            var (localShiftStart, localShiftEnd) = GetShiftWindow(localNow);
            var shiftStart = localShiftStart.ToUniversalTime();
            var shiftEnd = localShiftEnd.ToUniversalTime();
            
            var weekAgo = utcNow.AddDays(-7);
            var monthAgo = utcNow.AddDays(-30);

            var activities = await _context.UserAppActivities
                .Where(a => a.PcName.ToLower() == pcName.ToLower() && a.Timestamp >= monthAgo)
                .ToListAsync();

            int CalculateDeduplicatedSeconds(IEnumerable<UserAppActivity> src, bool activeOnly = false)
            {
                var query = activeOnly ? src.Where(a => a.IsActive) : src;
                return query
                    .GroupBy(a => a.Timestamp.Ticks / 300000000)
                    .Sum(g => g.Max(a => a.DurationSeconds));
            }

            // SolidWorks Filtresi
            var sldKey = "SLDWORKS";
            var sldFilter = activities.Where(a => a.AppName.Contains(sldKey, StringComparison.OrdinalIgnoreCase));

            var stats = new
            {
                Activity = new
                {
                    // Günlük veriyi mesai saatleri (07:00 - 16:00) ile kısıtla
                    Daily = CalculateDeduplicatedSeconds(activities.Where(a => a.Timestamp >= shiftStart && a.Timestamp <= shiftEnd)),
                    Weekly = CalculateDeduplicatedSeconds(activities.Where(a => a.Timestamp >= weekAgo)),
                    Monthly = CalculateDeduplicatedSeconds(activities)
                },
                SolidWorks = new
                {
                    DailyTotal = CalculateDeduplicatedSeconds(sldFilter.Where(a => a.Timestamp >= shiftStart && a.Timestamp <= shiftEnd)),
                    DailyActive = CalculateDeduplicatedSeconds(sldFilter.Where(a => a.Timestamp >= shiftStart && a.Timestamp <= shiftEnd), true),
                    
                    WeeklyTotal = CalculateDeduplicatedSeconds(sldFilter.Where(a => a.Timestamp >= weekAgo)),
                    WeeklyActive = CalculateDeduplicatedSeconds(sldFilter.Where(a => a.Timestamp >= weekAgo), true),
                    
                    MonthlyTotal = CalculateDeduplicatedSeconds(sldFilter),
                    MonthlyActive = CalculateDeduplicatedSeconds(sldFilter, true)
                },
                ShiftInfo = new { Start = shiftStart, End = shiftEnd }
            };

            return Ok(stats);
        }

        [HttpGet("report")]
        public async Task<ActionResult> GetReport([FromQuery] string pcName, [FromQuery] string startDate, [FromQuery] string endDate)
        {
            if (string.IsNullOrEmpty(pcName)) return BadRequest(new { message = "Hedef cihaz seçilmelidir." });

            if (!DateTime.TryParse(startDate, out var start) || !DateTime.TryParse(endDate, out var end))
            {
                return BadRequest(new { message = "Geçersiz tarih formatı." });
            }
            
            // Mesai başlangıcı 07:00, bitiş 16:00
            start = start.Date.AddHours(7);
            end = end.Date.AddHours(16);

            var dbActivities = await _context.UserAppActivities
                .Where(a => a.PcName.ToLower() == pcName.ToLower() && a.Timestamp >= start && a.Timestamp <= end)
                .ToListAsync();

            // Sadece mesai saatleri içindeki verileri al
            var shiftActivities = dbActivities.Where(a => a.Timestamp.Hour >= 7 && a.Timestamp.Hour < 16).ToList();
            var lockActivities = shiftActivities.Where(a => a.AppName.Contains("lockapp", StringComparison.OrdinalIgnoreCase) || a.AppName.Contains("logonui", StringComparison.OrdinalIgnoreCase)).ToList();
            
            var activities = shiftActivities.Where(a => !IsSystemProcess(a.AppName)).ToList();

            int CalcSeconds(IEnumerable<UserAppActivity> src, bool activeOnly = false)
            {
                var q = activeOnly ? src.Where(a => a.IsActive) : src;
                return q.GroupBy(a => a.Timestamp.Ticks / 300000000).Sum(g => g.Max(a => a.DurationSeconds));
            }

            var totalOpenSeconds = CalcSeconds(activities);
            var totalActiveSeconds = CalcSeconds(activities, true);

            // SolidWorks Detay
            var sldActivities = activities.Where(a => a.AppName.Contains("SLDWORKS", StringComparison.OrdinalIgnoreCase));
            var solidWorksOpenSeconds = CalcSeconds(sldActivities);
            var solidWorksActiveSeconds = CalcSeconds(sldActivities, true);
            
            var browsers = new[] { "chrome.exe", "msedge.exe", "firefox.exe", "iexplore.exe" };
            var webSummary = activities
                .Where(a => browsers.Contains(a.AppName.ToLower()) && !string.IsNullOrEmpty(a.WindowTitle))
                .Select(a =>
                {
                    string title = a.WindowTitle ?? "";
                    string domain = "Diğer";
                    if (title.Contains(" - ")) domain = title.Split(" - ").Last().Trim();
                    else if (title.Contains("|")) domain = title.Split("|").Last().Trim();
                    else if (!string.IsNullOrWhiteSpace(title)) domain = title;
                    return new { Domain = domain, Duration = a.DurationSeconds, TimeKey = a.Timestamp.Ticks / 300000000 };
                })
                .GroupBy(x => x.Domain)
                .Select(g => new
                {
                    Domain = g.Key,
                    TotalSeconds = g.GroupBy(x => x.TimeKey).Sum(bucket => bucket.Max(x => x.Duration))
                })
                .OrderByDescending(x => x.TotalSeconds)
                .Take(10)
                .ToList();

            var topApps = activities
                .GroupBy(a => GetFriendlyAppName(a.AppName))
                .Select(g => new
                {
                    AppName = g.Key,
                    TotalSeconds = CalcSeconds(g),
                    ActiveSeconds = CalcSeconds(g, true)
                })
                .OrderByDescending(x => x.ActiveSeconds)
                .Take(10)
                .ToList();

            // Günlük bazlı mesai dağılımı
            var dailyBreakdown = activities
                .GroupBy(a => a.Timestamp.Date)
                .Select(g => new
                {
                    Date = g.Key.ToString("dd.MM.yyyy"),
                    TotalSeconds = CalcSeconds(g),
                    ActiveSeconds = CalcSeconds(g, true),
                    IdleSeconds = CalcSeconds(lockActivities.Where(la => la.Timestamp.Date == g.Key.Date)),
                    SolidWorksOpen = CalcSeconds(g.Where(a => a.AppName.Contains("SLDWORKS", StringComparison.OrdinalIgnoreCase))),
                    SolidWorksActive = CalcSeconds(g.Where(a => a.AppName.Contains("SLDWORKS", StringComparison.OrdinalIgnoreCase)), true)
                })
                .OrderBy(x => x.Date)
                .ToList();

            return Ok(new
            {
                PcName = pcName,
                DateRange = $"{start:dd.MM.yyyy} - {end:dd.MM.yyyy}",
                ShiftHours = "07:00 - 16:00",
                TotalOpenSeconds = totalOpenSeconds,
                TotalActiveSeconds = totalActiveSeconds,
                IdleSeconds = CalcSeconds(lockActivities),
                SolidWorksOpenSeconds = solidWorksOpenSeconds,
                SolidWorksActiveSeconds = solidWorksActiveSeconds,
                TopApps = topApps,
                TopWebsites = webSummary,
                DailyBreakdown = dailyBreakdown
            });
        }

        [HttpGet("global-dashboard")]
        public async Task<ActionResult> GetGlobalDashboard([FromQuery] string pcName = null)
        {
            var utcNow = DateTime.UtcNow;
            var localNow = DateTime.Now;
            var (localShiftStart, localShiftEnd) = GetShiftWindow(localNow);
            var shiftStart = localShiftStart.ToUniversalTime();
            var shiftEnd = localShiftEnd.ToUniversalTime();

            // Tüm aktif ve pasif cihazları alarak kimlerin "Online" olduğunu bilelim
            var terminals = await _context.Terminals.ToListAsync();
            var personnels = await _context.Personnels.ToListAsync();
            var userMap = new Dictionary<string, string>();
            foreach (var p in personnels) 
            {
                if (!string.IsNullOrEmpty(p.UserID)) userMap[p.UserID.ToLower()] = p.AdSoyad;
                if (!string.IsNullOrEmpty(p.WindowsLogin)) userMap[p.WindowsLogin.ToLower()] = p.AdSoyad;
            }

            var query = _context.UserAppActivities
                .Where(a => a.Timestamp >= shiftStart && a.Timestamp <= shiftEnd);

            if (!string.IsNullOrEmpty(pcName) && pcName != "ALL")
            {
                var lowerPc = pcName.ToLower();
                query = query.Where(a => a.PcName.ToLower() == lowerPc);
                terminals = terminals.Where(t => t.Name.ToLower() == lowerPc).ToList();
            }

            var dbActivities = await query.ToListAsync();
            var lockActivities = dbActivities.Where(a => a.AppName.Contains("lockapp", StringComparison.OrdinalIgnoreCase) || a.AppName.Contains("logonui", StringComparison.OrdinalIgnoreCase)).ToList();

            var activities = dbActivities.Where(a => !IsSystemProcess(a.AppName)).ToList();

            // Her gruptan (bucket) tekrarı (deduplicate) kaldırıp genel saniye hesaplama
            int CalcSeconds(IEnumerable<UserAppActivity> src, bool activeOnly = false, bool groupByApp = true)
            {
                var q = activeOnly ? src.Where(a => a.IsActive) : src;
                // PC Name + (Opsiyonel App Name) + 10s Bucket ile gruplayıp mükerrer kaydı önleyerek gerçek süreyi topla
                return q.GroupBy(a => a.PcName).Sum(pcGroup => 
                {
                    if (groupByApp)
                    {
                        // Uygulama bazlı (Donut Chart gibi)
                        return pcGroup.GroupBy(a => new { a.AppName, Bucket = a.Timestamp.Ticks / 300000000 })
                                      .Sum(g => g.Max(a => a.DurationSeconds));
                    }
                    else
                    {
                        // Genel aktivite bazlı (Eğer PC'de o an herhangi bir uygulama aktifse 30sn say)
                        return pcGroup.GroupBy(a => a.Timestamp.Ticks / 300000000)
                                      .Sum(g => g.Max(a => a.DurationSeconds));
                    }
                });
            }

            var totalOpenSeconds = CalcSeconds(activities, activeOnly: false, groupByApp: false);
            var totalActiveSeconds = CalcSeconds(activities, activeOnly: true, groupByApp: false);
            var productivity = totalOpenSeconds > 0 ? (int)Math.Round(((double)totalActiveSeconds / totalOpenSeconds) * 100) : 0;
            
            var idleSeconds = CalcSeconds(lockActivities);

            // Şüpheli / Eğlence App'leri (basit bir tanım olarak WhatsApp vb.)
            var suspiciousApps = activities.Where(a => a.AppName.Contains("whatsapp", StringComparison.OrdinalIgnoreCase) || a.AppName.Contains("game", StringComparison.OrdinalIgnoreCase));
            var suspiciousSeconds = CalcSeconds(suspiciousApps);

            // SolidWorks Aktif Kullanım (Farklı süreçleri tek bir SolidWorks aktivitesi olarak say)
            var sldApps = activities.Where(a => a.AppName.Contains("SLDWORKS", StringComparison.OrdinalIgnoreCase) || a.AppName.Contains("SolidWorks", StringComparison.OrdinalIgnoreCase));
            var sldSeconds = CalcSeconds(sldApps, activeOnly: false, groupByApp: false);

            // Autodesk Aktif Kullanım (Geniş Liste: AEC ve PDMC Koleksiyonları Dahil)
            var autodeskApps = activities.Where(a => 
                a.AppName.Contains("acad", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("revit", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("inventor", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("3dsmax", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("roamer", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("fusion360", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("adsk", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("autodesk", StringComparison.OrdinalIgnoreCase) ||
                a.AppName.Contains("civil3d", StringComparison.OrdinalIgnoreCase)
            );
            var autodeskSeconds = CalcSeconds(autodeskApps, activeOnly: false, groupByApp: false);

            // Uygulama Kullanım Çizelgesi (Donut Chart)
            var appUsageList = activities
                .GroupBy(a => GetFriendlyAppName(a.AppName))
                .Select(g => new
                {
                    AppName = g.Key,
                    ActiveSeconds = CalcSeconds(g, true)
                })
                .OrderByDescending(x => x.ActiveSeconds)
                .Take(5)
                .ToList();

            // Gün İçindeki Aktivite Çizgisi (Line Chart) -> Saatlik Toplam Aktiflik (Yerel Saate Göre)
            var activityBuckets = activities
                .GroupBy(a => a.Timestamp.ToLocalTime().Hour)
                .ToDictionary(g => g.Key, g => CalcSeconds(g, activeOnly: true, groupByApp: false));

            var activityTrend = new List<object>();
            int currentHr = localNow.Hour;
            // Shift starts at 07:00. End at 16:00 or current hour.
            int endHr = Math.Max(16, currentHr); 
            
            for (int h = 7; h <= endHr; h++)
            {
                activityTrend.Add(new
                {
                    Hour = $"{h:D2}:00",
                    ActiveSeconds = activityBuckets.ContainsKey(h) ? activityBuckets[h] : 0
                });
            }

            var recentThreshold = utcNow.AddMinutes(-5);
            var targetTerminals = terminals.Where(t => t.EnableUserActivity || (t.DeviceType?.ToUpper() == "PC")).ToList();
            
            var onlinePCs = targetTerminals.Select(t => {
                var lastActivity = dbActivities.Where(a => a.PcName.ToLower() == t.Name.ToLower()).OrderByDescending(a => a.Timestamp).FirstOrDefault();
                
                string rawUser = lastActivity?.UserName ?? t.LastUserName ?? "";
                string displayName = "Unknown User";

                if (!string.IsNullOrEmpty(rawUser))
                {
                    var lookupKey = rawUser.ToLower();
                    if (userMap.TryGetValue(lookupKey, out var realName))
                        displayName = $"{realName} ({rawUser})";
                    else
                        displayName = rawUser;
                }

                string status = "Idle";
                if (t.Status == "Error") status = "Error";
                else if (t.Status != "UP") status = "Offline";
                else if (lastActivity != null && lastActivity.Timestamp >= recentThreshold) status = "Online";

                return new
                {
                    Employee = t.Name,
                    UserName = displayName,
                    LastSeen = lastActivity?.Timestamp ?? t.LastCheck ?? DateTime.MinValue,
                    CurrentTask = lastActivity != null ? GetFriendlyAppName(lastActivity.AppName) : "",
                    Status = status,
                    LastError = t.LastError
                };
            }).ToList();

            var isOutsideShift = localNow.Hour < 7 || localNow.Hour >= 16;
            
            int totalActive = 0;
            int totalIdle = 0;
            int totalOvertime = 0;
            int totalPassive = 0;
            int totalError = 0;

            foreach (var pc in onlinePCs)
            {
                if (pc.Status == "Offline" || pc.Status == "Error")
                {
                    if (pc.Status == "Error") totalError++;
                    totalPassive++; 
                    continue;
                }

                bool isOnline = (pc.Status == "Online");
                if (isOutsideShift)
                {
                    if (isOnline) totalOvertime++;
                    else totalPassive++;
                }
                else
                {
                    if (isOnline) totalActive++;
                    else totalIdle++;
                }
            }

            return Ok(new
            {
                AverageProductivity = productivity,
                TotalAppUsageTime = totalOpenSeconds,
                SolidWorksUsageTime = sldSeconds,
                AutodeskUsageTime = autodeskSeconds,
                TotalActiveEmployees = totalActive,
                TotalIdleEmployees = totalIdle,
                TotalOvertimeEmployees = totalOvertime,
                TotalPassiveEmployees = totalPassive,
                TotalErrorTerminals = totalError,
                AppUsageList = appUsageList,
                ActivityTrend = activityTrend,
                EmployeesOnline = onlinePCs.Select(x => new {
                    x.Employee,
                    x.UserName,
                    LastSeen = x.LastSeen == DateTime.MinValue ? "N/A" : x.LastSeen.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    x.CurrentTask,
                    x.Status,
                    x.LastError
                }).OrderByDescending(x => x.Status).ThenBy(x => x.Employee).ToList(),
                ShiftInfo = new { Start = localShiftStart, End = localShiftEnd }
            });
        }
    }
}
