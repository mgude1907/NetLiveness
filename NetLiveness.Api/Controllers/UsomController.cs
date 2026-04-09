using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.ServiceModel.Syndication;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Linq;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsomController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<UsomController> _logger;

        public UsomController(IHttpClientFactory httpClientFactory, ILogger<UsomController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpGet("rss")]
        public async Task<IActionResult> GetUsomFeed()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(15);
                var feedItems = new List<FeedItem>();

                // 1. Zararlı Bağlantılar
                var addressTask = FetchAddressFeed(client);
                
                // 2. Güvenlik Bildirimleri / Dökümanlar
                var announcementTask = FetchAnnouncementFeed(client);

                await Task.WhenAll(addressTask, announcementTask);

                if (addressTask.Result != null) feedItems.AddRange(addressTask.Result);
                if (announcementTask.Result != null) feedItems.AddRange(announcementTask.Result);

                // Tarihe göre azalan (en yeni en üstte) sırala ve ilk 30'u al
                var sortedFeeds = feedItems
                    .OrderByDescending(f => f.PubDateRaw)
                    .Take(30)
                    .ToList();

                return Ok(sortedFeeds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "USOM veri kaynağı çekilirken hata oluştu.");
                return StatusCode(500, $"USOM veri kaynağı alınırken bir hata oluştu: {ex.Message}");
            }
        }

        private async Task<List<FeedItem>> FetchAddressFeed(HttpClient client)
        {
            var results = new List<FeedItem>();
            try
            {
                var response = await client.GetStringAsync("https://www.usom.gov.tr/api/address/index");
                var doc = System.Text.Json.JsonDocument.Parse(response);
                if (doc.RootElement.TryGetProperty("models", out var models) && models.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var item in models.EnumerateArray())
                    {
                        var dateStr = item.GetProperty("date").GetString();
                        DateTime.TryParse(dateStr, out var pDate);
                        var url = item.GetProperty("url").GetString();
                        var typeCode = item.TryGetProperty("desc", out var d) ? d.GetString() : "";

                        // Açıklamayı detaylandır
                        string descName = typeCode switch {
                            "PH" => "Oltalama (Phishing) Girişimi",
                            "BP" => "Bankacılık Oltalama (Bank Phishing)",
                            "MG" => "Zararlı Yazılım Dağıtımı (Malware Gateway)",
                            _ => "Siber Tehdit Barındıran Adres"
                        };

                        results.Add(new FeedItem
                        {
                            Type = "Zararlı Bağlantı",
                            Title = url,
                            Description = $"Kötü Niyetli Adres Tespit Edildi. Tedbir Nedeni: {descName} [{typeCode}]",
                            Link = "https://www.usom.gov.tr",
                            PubDate = dateStr,
                            PubDateRaw = pDate
                        });
                    }
                }
            }
            catch { }
            return results;
        }

        private async Task<List<FeedItem>> FetchAnnouncementFeed(HttpClient client)
        {
            var results = new List<FeedItem>();
            try
            {
                var response = await client.GetStringAsync("https://www.usom.gov.tr/api/announcement/index");
                var doc = System.Text.Json.JsonDocument.Parse(response);
                if (doc.RootElement.TryGetProperty("models", out var models) && models.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var item in models.EnumerateArray())
                    {
                        var dateStr = item.GetProperty("date").GetString();
                        DateTime.TryParse(dateStr, out var pDate);
                        var title = item.GetProperty("title").GetString() ?? "";
                        var descRaw = item.GetProperty("desc").GetString() ?? "";
                        
                        // HTML etiketlerini çıkartarak salt metin özeti alma
                        var plainDesc = System.Text.RegularExpressions.Regex.Replace(descRaw, "<.*?>", String.Empty).Trim();
                        if (plainDesc.Length > 200) plainDesc = plainDesc.Substring(0, 197) + "...";
                        
                        var lTitle = title.ToLower();
                        string type = (lTitle.Contains("dokuman") || lTitle.Contains("döküman") || lTitle.Contains("rehber") || lTitle.Contains("rapor")) 
                                        ? "Faydalı Döküman" 
                                        : "Güvenlik Bildirimi";

                        results.Add(new FeedItem
                        {
                            Type = type,
                            Title = title,
                            Description = plainDesc.Length > 10 ? plainDesc : "Kritik siber güvenlik uyarısı ve savunma dökümanı yayınlandı.",
                            Link = "https://www.usom.gov.tr",
                            PubDate = dateStr,
                            PubDateRaw = pDate
                        });
                    }
                }
            }
            catch { }
            return results;
        }
    }

    public class FeedItem
    {
        public string Type { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Link { get; set; }
        public string PubDate { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public DateTime PubDateRaw { get; set; }
    }
}
