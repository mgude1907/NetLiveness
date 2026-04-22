using System;

namespace NetLiveness.Api.Models
{
    public class Terminal
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Host { get; set; } = "";
        public string Mac { get; set; } = "";
        public string SwitchPort { get; set; } = "";
        public string Company { get; set; } = "Merkez";
        public string Country { get; set; } = "Türkiye";
        public string Location { get; set; } = "";
        public string Description { get; set; } = "";
        public string DeviceType { get; set; } = "PC";
        public bool? Maintenance { get; set; } = false;
        
        // Sadece Ping atsın, WMI denemesin
        public bool? SkipWmi { get; set; } = false;
        
        public string Status { get; set; } = "UNK";
        public long? RttMs { get; set; } = 0;
        public DateTime? LastCheck { get; set; } = DateTime.Now;

        // Sağlık İzleme Alanları
        public double? DiskSizeGb { get; set; } = 0;
        public double? DiskFreeGb { get; set; } = 0;
        public int? CpuUsage { get; set; } = 0;
        public int? RamUsage { get; set; } = 0; // % olarak

        // Kimlik Doğrulama (Cihaza özel)
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? LastError { get; set; }

        public bool? EnableFileMonitoring { get; set; } = false;
        public string? MonitoredPaths { get; set; } = "C:\\Users;D:\\Projects";
        public string? MonitoredExtensions { get; set; } = "sldprt;dwg;dxf;step;iam;ipt";
        public int? FileThresholdMb { get; set; } = 25;

        // Kullanıcı İzleme Ayarları
        public bool EnableUserActivity { get; set; } = false;
        public string UserActivityGroup { get; set; } = "Genel";

        // Canlı Durum Bilgileri
        public string? LastUserName { get; set; }
        public DateTime? LastActivityTime { get; set; }
    }

    public class FileMovementAlert
    {
        public int Id { get; set; }
        public string PcName { get; set; } = "";
        public string UserName { get; set; } = "";
        public string FileName { get; set; } = "";
        public string FilePath { get; set; } = "";
        public string Extension { get; set; } = "";
        public long FileSize { get; set; } = 0;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsFlagged { get; set; } = false;
        public string? Description { get; set; }
    }

    public class Personnel
    {
        public int Id { get; set; }
        public string Ad { get; set; } = "";
        public string Soyad { get; set; } = "";
        public string AdSoyad { get; set; } = "";
        public string Bolum { get; set; } = "";
        public string Gorev { get; set; } = "";
        public string Firma { get; set; } = "";
        public string SicilNo { get; set; } = "";
        public string KartNo { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public DateTime? GirisTarih { get; set; }
        public DateTime? ResignedAt { get; set; }
        public string? UserID { get; set; }
        public string? WindowsLogin { get; set; }
        
        // Card-Specific Security Fields
        public string? PhotoUrl { get; set; }
        public string? KgbNo { get; set; }
        public string? PrivacyLevel { get; set; } = "MİLLİ GİZLİ";
        public DateTime? KgbExpiryDate { get; set; }
        public string? ApprovedBy { get; set; } = "NERGİS ÇELİK";
        public string? ApproverTitle { get; set; } = "GÜVENLİK KOORDİNATÖRÜ";
    }

    public class StockItem
    {
        public int Id { get; set; }
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? SerialNo { get; set; }
        public string? PcIsmi { get; set; }
        public string? IpAddress { get; set; }
        public string? Status { get; set; } = "Sağlam";
        public string? EnvanterTuru { get; set; } = "Personel Envanteri";
        public DateTime AddedAt { get; set; } = DateTime.Now;
    }

    public class InventoryItem
    {
        public int Id { get; set; }
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? SerialNo { get; set; }
        public string? PcIsmi { get; set; }
        public string? IpAddress { get; set; }
        public string? EnvanterTuru { get; set; } = "Personel Envanteri";
        public string? AssignedTo { get; set; }
        public string? Firma { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.Now;
    }

    public class SslItem
    {
        public int Id { get; set; }
        public string Domain { get; set; } = "";
        public string Owner { get; set; } = "";
        public string Environment { get; set; } = "PROD";
        public DateTime ExpiryDate { get; set; }
        
        public int DaysLeft { get; set; }
        public string Status { get; set; } = "UNK";
    }

    public class AuditLogEntry
    {
        public int Id { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string Action { get; set; } = "";
        public string Details { get; set; } = "";
        public string Operator { get; set; } = "System";
        public string Category { get; set; } = "SYSTEM"; // SYSTEM, SECURITY, NETWORK, INVENTORY, SUPPORT, PERSONNEL
    }

    public class AppSettings
    {
        public int Id { get; set; }
        public int PingIntervalMs { get; set; } = 5000;
        public bool SmtpEnabled { get; set; } = false;
        public string SmtpServer { get; set; } = "";
        public int SmtpPort { get; set; } = 587;
        public string SmtpUser { get; set; } = "";
        public string SmtpPass { get; set; } = "";
        public string AlertEmailTo { get; set; } = ""; // Keep for general alerts
        public string AdminEmailTo { get; set; } = ""; // İdari İşler
        public string ItEmailTo { get; set; } = ""; // BT Departmanı
        public string GlpiUrl { get; set; } = "";
        public string GlpiAppToken { get; set; } = "";
        public string GlpiUserToken { get; set; } = "";
        
        // Auto-Update Configuration
        public string AppVersion { get; set; } = "v1.0.0";
        public string UpdaterUrl { get; set; } = "https://raw.githubusercontent.com/username/repo/main/version.json";
        public string ZimmetTemplatePath { get; set; } = "";
        public string FirmsList { get; set; } = "Merkez,Şube-1,RET,RMK,RUT,RSS,RMT,RPT,CLR,KARDELN,RET BEYLERBEYI,RET UMRANIYE,RET OMERLI";

        // WMI Yetkilendirme
        public string WmiUser { get; set; } = "";
        public string WmiPass { get; set; } = "";
        public string WmiDomain { get; set; } = "";
        public string AppLogo { get; set; } = ""; // Base64 image
        public string AppTitle { get; set; } = "REPKON";

        // Personnel Integration
        public string PersonnelIntegrationType { get; set; } = "None"; // None, SQL
        public string PersonnelSqlHost { get; set; } = "";
        public string PersonnelSqlDatabase { get; set; } = "";
        public string PersonnelSqlUser { get; set; } = "";
        public string PersonnelSqlPass { get; set; } = "";
        public string PersonnelSqlAuthType { get; set; } = "SQL"; // SQL, Windows
        public string PersonnelIntegrationSqlQuery { get; set; } = "SELECT PersonelNo, Ad, Soyad, Bolum, Firma, UserID, GirisTarih, CikisTarih FROM [dbo].[Sicil]";
        public DateTime? PersonnelIntegrationLastSync { get; set; }
        
        // Phishing Settings
        public string? PhishingSmtpHost { get; set; } = "smtp.gmail.com";
        public int PhishingSmtpPort { get; set; } = 587;
        public string? PhishingSmtpUser { get; set; } = "";
        public string? PhishingSmtpPass { get; set; } = "";
        public string? PhishingTrackingUrl { get; set; } = "http://localhost:3001/track";
    }

    public class SystemUpdate
    {
        public int Id { get; set; }
        public string Version { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime DateInstalled { get; set; } = DateTime.Now;
    }

    public class AccessColumn
    {
        public int Id { get; set; }
        public string Category { get; set; } = "SYSTEM";
        public string Name { get; set; } = "";
        public int DisplayOrder { get; set; } = 0;
    }

    public class AccessGrant
    {
        public int Id { get; set; }
        public int PersonnelId { get; set; }
        public int AccessColumnId { get; set; }
        public string AccessLevel { get; set; } = "R"; // R, W, R/W
    }

    public class FeedbackEntry
    {
        public int Id { get; set; }
        public string SenderName { get; set; } = "";
        public string Subject { get; set; } = "";
        public string Message { get; set; } = "";
        public bool IsRead { get; set; } = false;
        public DateTime DateSubmitted { get; set; } = DateTime.Now;
    }

    public class NistRequirement
    {
        public int Id { get; set; }
        public string RequirementId { get; set; } = ""; // e.g., "3.1.1"
        public string Family { get; set; } = ""; // e.g., "Access Control"
        public string Description { get; set; } = "";
        public string Status { get; set; } = "Not Implemented"; // Implemented, Partially, Not Implemented, N/A
        public string Comments { get; set; } = "";
        public string? DocumentPath { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }

    public class IsoRequirement
    {
        public int Id { get; set; }
        public string RequirementId { get; set; } = ""; // e.g., "A.5.1"
        public string Family { get; set; } = ""; // e.g., "Organizational Controls"
        public string Description { get; set; } = "";
        public string Status { get; set; } = "Not Implemented";
        public string Comments { get; set; } = "";
        public string? DocumentPath { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }

    public class FacilityRequirement
    {
        public int Id { get; set; }
        public string RequirementId { get; set; } = ""; // e.g., "TG-1"
        public string Family { get; set; } = ""; // e.g., "Fiziksel Güvenlik"
        public string Description { get; set; } = "";
        public string Status { get; set; } = "Uygulanmadı";
        public string Comments { get; set; } = "";
        public string? DocumentPath { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }

    public class Iso9001Requirement
    {
        public int Id { get; set; }
        public string RequirementId { get; set; } = ""; // e.g., "KLT-1"
        public string Family { get; set; } = ""; // e.g., "BT Hizmet Yönetimi"
        public string Description { get; set; } = "";
        public string Status { get; set; } = "Uygulanmadı";
        public string Comments { get; set; } = "";
        public string? DocumentPath { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
    public class UserActivityTarget
    {
        public int Id { get; set; }
        public string PcName { get; set; } = "";
        public string Group { get; set; } = "Genel";
        public bool IsEnabled { get; set; } = true;
        public DateTime LastCheck { get; set; }
    }

    public class UserAppActivity
    {
        public int Id { get; set; }
        public string PcName { get; set; } = "";
        public string UserName { get; set; } = "";
        public string AppName { get; set; } = "";
        public string WindowTitle { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public int DurationSeconds { get; set; } = 30; // Polling interval
        public bool IsActive { get; set; } = false; // Whether the app was actively used during this period
    }

    public class Onboarding
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Company { get; set; } = "";
        public string Manager { get; set; } = "";
        public DateTime StartDate { get; set; } = DateTime.Now;
        public string HomeAddress { get; set; } = "";
        public string MobilePhone { get; set; } = "";
        public string Email { get; set; } = "";
        public string Status { get; set; } = "Bekliyor"; // Bekliyor, Tamamlandı vs.
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class AppUser
    {
        public int Id { get; set; }
        public string Username { get; set; } = ""; // Kullanıcı adı (Genelde e-postayı taşıyacak veya ayrı kullanılabilir)
        public string Email { get; set; } = ""; // Yeni zorunlu e-posta alanı
        public string PasswordHash { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Permissions { get; set; } = "Dashboard,Terminals,Reports"; // Yönetim izini
        public bool IsAdmin { get; set; } = false;
        public bool IsActive { get; set; } = true; // Admin panelinden yönetilebilmesi için
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<ChatChannelMember> Memberships { get; set; } = new List<ChatChannelMember>();
    }

    public class DirectoryEntry
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string MobilePhone { get; set; } = "";
        public string InternalPhone { get; set; } = ""; // Dahili
        public string Email { get; set; } = "";
        public string Department { get; set; } = "";
        public string Position { get; set; } = "";
        public string ImageUrl { get; set; } = "";
    }

    public class InternalSurvey
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class SurveyQuestion
    {
        public int Id { get; set; }
        public int SurveyId { get; set; }
        public string Text { get; set; } = "";
        public string Type { get; set; } = "text"; // text, radio, checkbox
        public string Options { get; set; } = ""; // JSON string for choices
        public int Order { get; set; } = 0;
    }

    public class SurveyResponse
    {
        public int Id { get; set; }
        public int SurveyId { get; set; }
        public string ParticipantName { get; set; } = "Anonim";
        public DateTime SubmittedAt { get; set; } = DateTime.Now;
    }

    public class SurveyAnswer
    {
        public int Id { get; set; }
        public int ResponseId { get; set; }
        public int QuestionId { get; set; }
        public string Value { get; set; } = "";
    }

    public class BackupSnapshot
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string FilePath { get; set; } = "";
        public bool DbOnly { get; set; } = false;
        public long SizeBytes { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class HelpRequest
    {
        public int Id { get; set; }
        public string SenderName { get; set; } = "";
        public string SenderEmail { get; set; } = "";
        public string Subject { get; set; } = "";
        public string Message { get; set; } = "";
        public string Category { get; set; } = "Genel"; // Donanım, Yazılım, Ağ, Diğer
        public string Priority { get; set; } = "Düşük"; // Düşük, Orta, Yüksek, Kritik
        public string Status { get; set; } = "Açık"; // Açık, İşlemde, Çözüldü, Kapalı
        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastUpdate { get; set; } = DateTime.Now;
        public string? AssignedTo { get; set; } // BT Personeli İsmi
        public string? Resolution { get; set; } // Çözüm notu
        public DateTime? ResolvedAt { get; set; } // Çözülme tarihi
        public DateTime? SlaDeadline { get; set; } // Hedef çözüm tarihi
        public string? ScreenshotPath { get; set; } // Ekran görüntüsü dosya yolu
        
        // Navigation properties
        public virtual ICollection<HelpRequestReply> Replies { get; set; } = new List<HelpRequestReply>();
    }

    public class HelpRequestReply
    {
        public int Id { get; set; }
        public int HelpRequestId { get; set; }
        public string SenderName { get; set; } = ""; // Admin veya Personel
        public string Message { get; set; } = "";
        public bool IsFromAdmin { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string? AttachmentPath { get; set; }
    }

    public class SoftwareLicense
    {
        public int Id { get; set; }
        public string SoftwareName { get; set; } = "";
        public string LicenseKey { get; set; } = "";
        public string LicenseType { get; set; } = "Retail"; // Retail, OEM, Volume, Subscription
        public DateTime? ExpirationDate { get; set; }
        public string AssignedTo { get; set; } = ""; // Personel veya Cihaz ismi
        public string Notes { get; set; } = "";
        public DateTime AddedAt { get; set; } = DateTime.Now;
    }
}
