using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;

namespace NetLiveness.Api.Services
{
    public class GlpiService : IGlpiService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly AppDbContext _context;
        private readonly ILogger<GlpiService> _logger;

        public GlpiService(IHttpClientFactory httpClientFactory, AppDbContext context, ILogger<GlpiService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _context = context;
            _logger = logger;
        }

        private async Task<AppSettings?> GetSettingsAsync()
        {
            return await _context.Settings.FirstOrDefaultAsync();
        }

        private void SetupClient(HttpClient client, AppSettings settings)
        {
            var baseUrl = settings.GlpiUrl.Trim().TrimEnd('/');
            if (!baseUrl.EndsWith("/apirest.php", StringComparison.OrdinalIgnoreCase))
            {
                baseUrl += "/apirest.php";
            }
            
            client.BaseAddress = new Uri(baseUrl + "/");
            
            // Clear existing headers to prevent duplicates
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            
            // Primary GLPI Headers
            client.DefaultRequestHeaders.Add("App-Token", settings.GlpiAppToken);
            client.DefaultRequestHeaders.Add("User-Token", settings.GlpiUserToken);
            
            // Fallback: Authorization header format (modern GLPI)
            if (!string.IsNullOrEmpty(settings.GlpiUserToken))
            {
                client.DefaultRequestHeaders.Add("Authorization", $"user_token {settings.GlpiUserToken}");
            }
        }

        public async Task<(bool success, string message)> TestConnectionAsync(AppSettings? settings = null)
        {
            settings ??= await GetSettingsAsync();
            if (settings == null || string.IsNullOrWhiteSpace(settings.GlpiUrl)) 
                return (false, "GLPI URL yapılandırılmamış.");

            try
            {
                var client = _httpClientFactory.CreateClient();
                SetupClient(client, settings);

                // Use query parameters for initSession as it's the most robust method against header stripping
                var queryUrl = $"initSession?user_token={Uri.EscapeDataString(settings.GlpiUserToken ?? "")}&app_token={Uri.EscapeDataString(settings.GlpiAppToken ?? "")}";
                
                var response = await client.GetAsync(queryUrl);
                if (response.IsSuccessStatusCode)
                {
                    await client.GetAsync("killSession");
                    return (true, "GLPI bağlantısı başarılı!");
                }

                var errorMsg = await response.Content.ReadAsStringAsync();
                return (false, $"GLPI Hatası ({response.StatusCode}): {errorMsg}");
            }
            catch (Exception ex)
            {
                return (false, $"Bağlantı Hatası: {ex.Message}");
            }
        }

        public async Task<string?> CreateTicketAsync(HelpRequest request)
        {
            var settings = await GetSettingsAsync();
            if (settings == null || string.IsNullOrWhiteSpace(settings.GlpiUrl))
            {
                _logger.LogWarning("GLPI integration is not configured. Skipping ticket creation.");
                return null;
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                SetupClient(client, settings);

                // 1. Initialize Session (Using query params for maximum compatibility)
                var queryUrl = $"initSession?user_token={Uri.EscapeDataString(settings.GlpiUserToken ?? "")}&app_token={Uri.EscapeDataString(settings.GlpiAppToken ?? "")}";
                var sessionResponse = await client.GetAsync(queryUrl);
                if (!sessionResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("GLPI Session Init Failed: {Status}", sessionResponse.StatusCode);
                    return null;
                }

                var sessionData = await sessionResponse.Content.ReadFromJsonAsync<GlpiSessionResponse>();
                if (sessionData == null || string.IsNullOrEmpty(sessionData.SessionToken))
                {
                    _logger.LogError("GLPI Session Token not found in response.");
                    return null;
                }

                // 2. Create Ticket
                var ticketInput = new
                {
                    input = new
                    {
                        name = $"[NETLIVENESS] {request.Subject}",
                        content = $"GÖNDEREN: {request.SenderName} ({request.SenderEmail})\n\nKATEGORİ: {request.Category}\nÖNCELİK: {request.Priority}\n\nMESAJ:\n{request.Message}",
                        priority = MapPriority(request.Priority),
                        itilcategories_id = MapCategory(request.Category),
                        status = 1 // 1: Incoming / New
                    }
                };

                client.DefaultRequestHeaders.Remove("User-Token"); // Not needed for subsequent calls
                client.DefaultRequestHeaders.Add("Session-Token", sessionData.SessionToken);

                var ticketResponse = await client.PostAsJsonAsync("Ticket", ticketInput);
                var responseContent = await ticketResponse.Content.ReadAsStringAsync();

                if (!ticketResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("GLPI Ticket Creation Failed: {Status} - {Content}", ticketResponse.StatusCode, responseContent);
                    return null;
                }

                _logger.LogInformation("GLPI Ticket Created Successfully: {Content}", responseContent);

                // 3. Kill Session (Cleanup)
                await client.GetAsync("killSession");

                return responseContent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GLPI Integration Error");
                return null;
            }
        }

        public async Task<(bool success, int count, int matchedCount)> SyncInventoryAsync()
        {
            var settings = await GetSettingsAsync();
            if (settings == null || string.IsNullOrWhiteSpace(settings.GlpiUrl)) return (false, 0, 0);

            try
            {
                var client = _httpClientFactory.CreateClient();
                SetupClient(client, settings);

                // 1. Initialize Session
                var queryUrl = $"initSession?user_token={Uri.EscapeDataString(settings.GlpiUserToken ?? "")}&app_token={Uri.EscapeDataString(settings.GlpiAppToken ?? "")}";
                var sessionResponse = await client.GetAsync(queryUrl);
                if (!sessionResponse.IsSuccessStatusCode) return (false, 0, 0);

                var sessionData = await sessionResponse.Content.ReadFromJsonAsync<GlpiSessionResponse>();
                if (sessionData == null || string.IsNullOrEmpty(sessionData.SessionToken)) return (false, 0, 0);

                client.DefaultRequestHeaders.Remove("User-Token");
                client.DefaultRequestHeaders.Add("Session-Token", sessionData.SessionToken);

                int totalSynced = 0;
                int matchedCount = 0;

                // Sync Categories
                var categoriesToSync = new[] { 
                    ("Computer", "Bilgisayar"), 
                    ("Monitor", "Monitör"),
                    ("Printer", "Yazıcı")
                };

                foreach (var (glpiType, netLivenessCategory) in categoriesToSync)
                {
                    int rangeStart = 0;
                    int rangeSize = 100; // Batch size
                    bool hasMore = true;

                    while (hasMore)
                    {
                        var response = await client.GetAsync($"{glpiType}?expand_dropdowns=true&range={rangeStart}-{rangeStart + rangeSize - 1}");
                        if (!response.IsSuccessStatusCode)
                        {
                            var errBody = await response.Content.ReadAsStringAsync();
                            _logger.LogError("GLPI {Type} Fetch Error: {Status} - {Body}", glpiType, response.StatusCode, errBody);
                            break;
                        }

                        var json = await response.Content.ReadAsStringAsync();
                        if (string.IsNullOrWhiteSpace(json) || json == "[]") 
                        {
                            hasMore = false;
                            continue;
                        }

                        try
                        {
                            var rootNode = JsonNode.Parse(json);
                            if (rootNode is not JsonArray nodes)
                            {
                                _logger.LogWarning("GLPI {Type} response was not a JSON array: {Json}", glpiType, json);
                                hasMore = false;
                                continue;
                            }

                            if (nodes.Count == 0)
                            {
                                hasMore = false;
                                continue;
                            }

                            foreach (var node in nodes)
                            {
                                if (node == null) continue;
                                try
                                {
                                    var (processed, matched) = await ProcessGlpiItemAsync(node, netLivenessCategory);
                                    if (processed)
                                    {
                                        totalSynced++;
                                        if (matched) matchedCount++;
                                    }
                                }
                                catch (Exception itemEx)
                                {
                                    _logger.LogError(itemEx, "Error processing individual GLPI item in {Type}", glpiType);
                                }
                            }

                            // If we received fewer items than requested, we reached the end
                            if (nodes.Count < rangeSize)
                            {
                                hasMore = false;
                            }
                            else
                            {
                                rangeStart += rangeSize;
                            }
                        }
                        catch (JsonException jex)
                        {
                            _logger.LogError(jex, "JSON Parse Error for {Type} at range {Range}. Content snippet: {Snippet}", 
                                glpiType, rangeStart, json.Length > 200 ? json.Substring(0, 200) : json);
                            hasMore = false; // Stop this type to prevent endless loops on bad JSON
                        }
                    }
                }

                // 3. Cleanup
                await client.GetAsync("killSession");
                return (true, totalSynced, matchedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GLPI Overall Inventory Sync Error");
                return (false, 0, 0);
            }
        }

        private async Task<(bool processed, bool matched)> ProcessGlpiItemAsync(JsonNode node, string category)
        {
            var name = node["name"]?.ToString() ?? "";
            var serial = node["serial"]?.ToString() ?? "";
            // Model and Manufacturer handling (Safely parse JsonNode which can be string, number or object)
            string GetNodeValue(JsonNode? n) {
                if (n == null) return "";
                if (n is JsonObject obj) return obj["name"]?.ToString() ?? "";
                return n.ToString();
            }

            var manufacturer = GetNodeValue(node["manufacturers_id"]);
            var model = GetNodeValue(node["computermodels_id"]) 
                     ?? GetNodeValue(node["monitormodels_id"]) 
                     ?? GetNodeValue(node["printermodels_id"])
                     ?? "";
            
            // Try to find IP address from common GLPI fields
            var ipAddress = node["ip"]?.ToString() 
                         ?? node["contact"]?.ToString() // Sometimes used for IP in custom setups
                         ?? "";
            
            // If it's a computer, sometimes networking info is in a sub-node if fetched with certain headers
            // For now we'll pick name/serial and try to find IP in these common locations.

            // Check if there's an assigned user in GLPI
            var glpiUsername = "";
            var usersIdNode = node["users_id"];
            if (usersIdNode is JsonObject userObj)
            {
                glpiUsername = userObj["name"]?.ToString() ?? "";
            }
            else if (usersIdNode != null)
            {
                glpiUsername = usersIdNode.ToString();
            }

            if (string.IsNullOrWhiteSpace(serial)) return (false, false);

            bool matchedWithPersonnel = false;
            Personnel? assignedPersonnel = null;

            if (!string.IsNullOrWhiteSpace(glpiUsername))
            {
                // Try matching by Login (mgude)
                assignedPersonnel = await _context.Personnels
                    .FirstOrDefaultAsync(p => p.WindowsLogin != null && p.WindowsLogin.ToLower() == glpiUsername.ToLower());
                
                if (assignedPersonnel == null)
                {
                    assignedPersonnel = await _context.Personnels
                        .FirstOrDefaultAsync(p => p.UserID != null && p.UserID.ToLower() == glpiUsername.ToLower());
                }

                if (assignedPersonnel != null)
                {
                    matchedWithPersonnel = true;
                }
            }

            if (matchedWithPersonnel && assignedPersonnel != null)
            {
                var existingInventory = await _context.Inventory.FirstOrDefaultAsync(i => i.SerialNo == serial);
                if (existingInventory != null)
                {
                    existingInventory.PcIsmi = name;
                    existingInventory.Model = !string.IsNullOrEmpty(model) ? model : existingInventory.Model;
                    existingInventory.Brand = !string.IsNullOrEmpty(manufacturer) ? manufacturer : existingInventory.Brand;
                    existingInventory.Category = category;
                    existingInventory.AssignedTo = assignedPersonnel.AdSoyad;
                    existingInventory.EnvanterTuru = "GLPI";
                    existingInventory.IpAddress = !string.IsNullOrEmpty(ipAddress) ? ipAddress : existingInventory.IpAddress;
                    _context.Inventory.Update(existingInventory);
                }
                else
                {
                    _context.Inventory.Add(new InventoryItem
                    {
                        PcIsmi = name,
                        SerialNo = serial,
                        Category = category,
                        Brand = manufacturer,
                        Model = model,
                        IpAddress = ipAddress,
                        AssignedTo = assignedPersonnel.AdSoyad,
                        AssignedAt = DateTime.Now,
                        EnvanterTuru = "GLPI"
                    });
                }

                var inStock = await _context.Stock.FirstOrDefaultAsync(s => s.SerialNo == serial);
                if (inStock != null) _context.Stock.Remove(inStock);
            }
            else
            {
                var existingStock = await _context.Stock.FirstOrDefaultAsync(s => s.SerialNo == serial);
                if (existingStock != null)
                {
                    existingStock.PcIsmi = name;
                    existingStock.Model = !string.IsNullOrEmpty(model) ? model : existingStock.Model;
                    existingStock.Brand = !string.IsNullOrEmpty(manufacturer) ? manufacturer : existingStock.Brand;
                    existingStock.Category = category;
                    existingStock.EnvanterTuru = "GLPI";
                    existingStock.IpAddress = !string.IsNullOrEmpty(ipAddress) ? ipAddress : existingStock.IpAddress;
                    _context.Stock.Update(existingStock);
                }
                else
                {
                    _context.Stock.Add(new StockItem
                    {
                        PcIsmi = name,
                        SerialNo = serial,
                        Category = category,
                        Brand = manufacturer,
                        Model = model,
                        IpAddress = ipAddress,
                        Status = "Sağlam",
                        EnvanterTuru = "GLPI",
                        AddedAt = DateTime.Now
                    });
                }

                var inInventory = await _context.Inventory.FirstOrDefaultAsync(i => i.SerialNo == serial);
                if (inInventory != null) _context.Inventory.Remove(inInventory);
            }

            // Save changes per batch or per item - here we keep it per item for safety but could be optimized later
            await _context.SaveChangesAsync();
            return (true, matchedWithPersonnel);
        }


        private int MapPriority(string priority)
        {
            // GLPI Priorities: 1: Very Low, 2: Low, 3: Medium, 4: High, 5: Very High (Major)
            return priority switch
            {
                "Düşük" => 2,
                "Orta" => 3,
                "Yüksek" => 4,
                "Kritik" => 5,
                _ => 3
            };
        }

        private int MapCategory(string category)
        {
            return category switch
            {
                "Donanım" => 1,
                "Yazılım" => 2,
                "Ağ / İnternet" => 3,
                _ => 1
            };
        }

        private class GlpiSessionResponse
        {
            [JsonPropertyName("session_token")]
            public string SessionToken { get; set; } = "";
        }
    }
}
