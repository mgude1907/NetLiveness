using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System.Data;

namespace NetLiveness.Api.Services
{
    public class PersonnelIntegrationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PersonnelIntegrationService> _logger;

        public PersonnelIntegrationService(AppDbContext context, ILogger<PersonnelIntegrationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(int updated, int added, int resigned)> SyncFromSqlAsync()
        {
            var settings = await _context.Settings.FirstOrDefaultAsync();
            if (settings == null || settings.PersonnelIntegrationType != "SQL" || string.IsNullOrWhiteSpace(settings.PersonnelSqlHost))
            {
                throw new Exception("SQL Entegrasyonu yapılandırılmamış veya aktif değil.");
            }

            var externalPersonnel = new List<Personnel>();

            // 1. Bağlantı dizesini oluştur
            var builder = new SqlConnectionStringBuilder
            {
                DataSource = settings.PersonnelSqlHost,
                InitialCatalog = settings.PersonnelSqlDatabase,
                IntegratedSecurity = settings.PersonnelSqlAuthType == "Windows",
                TrustServerCertificate = true // Genellikle Meyer/IFS yerel sunucuları için gereklidir
            };

            if (settings.PersonnelSqlAuthType == "SQL")
            {
                builder.UserID = settings.PersonnelSqlUser;
                builder.Password = settings.PersonnelSqlPass;
            }

            string connectionString = builder.ConnectionString;

            // 1. Dış veri kaynağından verileri çek
            try
            {
                using (var conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    using (var cmd = new SqlCommand(settings.PersonnelIntegrationSqlQuery, conn))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var personelNo = reader["PersonelNo"]?.ToString() ?? "";
                                var sicilNoRaw = reader["SicilNo"]?.ToString() ?? "";
                                
                                // Boşsa diğerine bak, en son sicilNoRaw'a bak
                                var sicilNo = string.IsNullOrWhiteSpace(personelNo) ? sicilNoRaw : personelNo;
                                
                                // Başındaki sıfırları temizle (Örn: 00345 -> 345)
                                sicilNo = sicilNo.TrimStart('0');
                                
                                if (string.IsNullOrWhiteSpace(sicilNo)) continue;

                                var cikisTarihRaw = reader["CikisTarih"];
                                DateTime? cikisTarih = (cikisTarihRaw == DBNull.Value) ? null : Convert.ToDateTime(cikisTarihRaw);
                                
                                var girisTarihRaw = reader["GirisTarih"];
                                DateTime? girisTarih = (girisTarihRaw == DBNull.Value) ? null : Convert.ToDateTime(girisTarihRaw);

                                externalPersonnel.Add(new Personnel
                                {
                                    SicilNo = sicilNo,
                                    Ad = reader["Ad"]?.ToString() ?? "",
                                    Soyad = reader["Soyad"]?.ToString() ?? "",
                                    Bolum = reader["BolumAdi"]?.ToString() ?? "", // Sayı ID yerine cbo_Bolum'dan isim
                                    Gorev = reader["GorevAdi"]?.ToString() ?? "", // Sayı ID yerine cbo_Gorev'den isim
                                    Firma = reader["FirmaAdi"]?.ToString() ?? "", 
                                    KartNo = reader["CardID"]?.ToString() ?? "",
                                    GirisTarih = girisTarih,
                                    ResignedAt = cikisTarih,
                                    IsActive = (cikisTarih == null),
                                    AdSoyad = $"{reader["Ad"]} {reader["Soyad"]}".Trim(),
                                    UserID = reader["UserID"]?.ToString() ?? "",
                                    WindowsLogin = (reader.GetSchemaTable()?.Select("ColumnName = 'WindowsLogin'").Length > 0 ? reader["WindowsLogin"]?.ToString() : 
                                                   reader.GetSchemaTable()?.Select("ColumnName = 'LoginName'").Length > 0 ? reader["LoginName"]?.ToString() : null) ?? ""
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dış SQL kaynağından veri çekilirken hata oluştu.");
                throw;
            }

            // 2. Veritabanı ile karşılaştır ve güncelle
            int updated = 0, added = 0, resigned = 0;
            var localPersonnel = await _context.Personnels.ToListAsync();
            var externalSicilNos = externalPersonnel.Select(x => x.SicilNo).ToHashSet();

            // Yeni ekle veya güncelle
            foreach (var ext in externalPersonnel)
            {
                var existing = localPersonnel.FirstOrDefault(x => x.SicilNo == ext.SicilNo);
                if (existing != null)
                {
                    // Üzerine yaz (Gelen veri her zaman güncel kabul edilir)
                    existing.Ad = ext.Ad;
                    existing.Soyad = ext.Soyad;
                    existing.AdSoyad = ext.AdSoyad;
                    existing.Bolum = ext.Bolum;
                    existing.Firma = ext.Firma;
                    existing.KartNo = ext.KartNo;
                    existing.GirisTarih = ext.GirisTarih;
                    existing.Gorev = ext.Gorev;
                    existing.IsActive = ext.IsActive;
                    existing.ResignedAt = ext.ResignedAt;
                    existing.UserID = ext.UserID;
                    existing.WindowsLogin = ext.WindowsLogin;
                    updated++;
                }
                else
                {
                    _context.Personnels.Add(ext);
                    added++;
                }
            }

            // Dış sistemde tamamen silinmiş olanları 'İşten Çıkan' olarak işaretle
            foreach (var local in localPersonnel.Where(p => p.IsActive))
            {
                if (!externalSicilNos.Contains(local.SicilNo))
                {
                    local.IsActive = false;
                    local.ResignedAt = DateTime.Now; // Dış sistemde kaydı kalmamış, şu anı çıkış sayıyoruz
                    resigned++;
                }
            }

            settings.PersonnelIntegrationLastSync = DateTime.Now;
            await _context.SaveChangesAsync();

            return (updated, added, resigned);
        }

        public async Task<(bool success, string message)> TestConnectionAsync(AppSettings settings)
        {
            try
            {
                if (settings == null || string.IsNullOrWhiteSpace(settings.PersonnelSqlHost))
                    return (false, "Bağlantı ayarları eksik. Lütfen 'Server Name' alanını doldurun.");

                var authType = settings.PersonnelSqlAuthType ?? "SQL";
                var isWindows = string.Equals(authType, "Windows", StringComparison.OrdinalIgnoreCase);

                var builder = new SqlConnectionStringBuilder
                {
                    DataSource = settings.PersonnelSqlHost,
                    InitialCatalog = settings.PersonnelSqlDatabase,
                    IntegratedSecurity = isWindows,
                    TrustServerCertificate = true,
                    ConnectTimeout = 10 
                };

                if (!isWindows)
                {
                    builder.UserID = settings.PersonnelSqlUser;
                    builder.Password = settings.PersonnelSqlPass;
                    
                    if (string.IsNullOrWhiteSpace(builder.UserID))
                    {
                        return (false, "SQL Kimlik Doğrulaması seçili ancak 'Login' (Kullanıcı Adı) boş bırakılmış.");
                    }
                }

                using (var conn = new SqlConnection(builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    return (true, "Bağlantı başarılı!");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Bağlantı hatası: {ex.Message}");
            }
        }
    }
}
