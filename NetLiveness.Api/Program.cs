using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Middleware;
using System.IO;
using Microsoft.Extensions.Logging;
using NetLiveness.Api.Models;
using NetLiveness.Api.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// --- Serilog Configuration --- //
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/api_log.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();
builder.Host.UseWindowsService();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// Increase JSON and Payload Limits for large logos (Base64)
builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.MaxDepth = 128; // Standard 64 might be tight for deep trees
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options => {
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50 MB
    options.MemoryBufferThreshold = int.MaxValue;
});

builder.WebHost.ConfigureKestrel(serverOptions => {
    serverOptions.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50 MB
});

builder.Services.AddScoped<NetLiveness.Api.Services.PersonnelIntegrationService>();
builder.Services.AddScoped<IGlpiService, GlpiService>();

// builder.Services.AddHostedService<NetLiveness.Api.Services.UserActivityService>();

// Configure SQLite Database
var connectionString = builder.Configuration.GetConnectionString("Default") ?? "Data Source=netliveness_v2.db;Cache=Shared;Mode=ReadWriteCreate;Default Timeout=10;";
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

// Configure CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => 
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

// Expose on specific network interface
// Expose on all network interfaces for maximum accessibility
builder.WebHost.UseUrls("http://0.0.0.0:5006");

var app = builder.Build();

// --- Database Optimization & Safety --- //
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try {
        context.Database.OpenConnection();
        context.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
        context.Database.ExecuteSqlRaw("PRAGMA synchronous=NORMAL;");
        
        // --- Core Tables --- //
        string[] initSqls = {
            @"CREATE TABLE IF NOT EXISTS ComplianceDocuments (Id INTEGER PRIMARY KEY AUTOINCREMENT, Standard TEXT NOT NULL, FileName TEXT NOT NULL, FilePath TEXT NOT NULL, UploadDate TEXT NOT NULL, Description TEXT NULL);",
            @"CREATE TABLE IF NOT EXISTS Surveys (Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NULL, IsActive INTEGER NOT NULL DEFAULT 1, CreatedAt TEXT NOT NULL);",
            @"CREATE TABLE IF NOT EXISTS SurveyQuestions (Id INTEGER PRIMARY KEY AUTOINCREMENT, SurveyId INTEGER NOT NULL, Text TEXT NOT NULL, Type TEXT NOT NULL, Options TEXT NULL, ""Order"" INTEGER NOT NULL DEFAULT 0);",
            @"CREATE TABLE IF NOT EXISTS SurveyResponses (Id INTEGER PRIMARY KEY AUTOINCREMENT, SurveyId INTEGER NOT NULL, ParticipantName TEXT NOT NULL, SubmittedAt TEXT NOT NULL);",
            @"CREATE TABLE IF NOT EXISTS SurveyAnswers (Id INTEGER PRIMARY KEY AUTOINCREMENT, ResponseId INTEGER NOT NULL, QuestionId INTEGER NOT NULL, Value TEXT NOT NULL);",
            @"CREATE TABLE IF NOT EXISTS Backups (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Description TEXT NULL, FilePath TEXT NOT NULL, DbOnly INTEGER NOT NULL DEFAULT 0, SizeBytes INTEGER NOT NULL DEFAULT 0, CreatedAt TEXT NOT NULL);",
            @"CREATE TABLE IF NOT EXISTS HelpRequests (Id INTEGER PRIMARY KEY AUTOINCREMENT, SenderName TEXT, SenderEmail TEXT, Subject TEXT, Message TEXT, Category TEXT, Priority TEXT, Status TEXT, CreatedAt TEXT, LastUpdate TEXT, AssignedTo TEXT, Resolution TEXT, ResolvedAt TEXT, SlaDeadline TEXT, ScreenshotPath TEXT);",
            @"CREATE TABLE IF NOT EXISTS HelpRequestReplies (Id INTEGER PRIMARY KEY AUTOINCREMENT, HelpRequestId INTEGER NOT NULL, SenderName TEXT NOT NULL, Message TEXT NOT NULL, IsFromAdmin INTEGER NOT NULL DEFAULT 0, CreatedAt TEXT NOT NULL, AttachmentPath TEXT NULL);",
            @"CREATE TABLE IF NOT EXISTS SoftwareLicenses (Id INTEGER PRIMARY KEY AUTOINCREMENT, SoftwareName TEXT NOT NULL, LicenseKey TEXT, LicenseType TEXT DEFAULT 'Retail', ExpirationDate TEXT, AssignedTo TEXT, Notes TEXT, AddedAt TEXT);",
            @"CREATE TABLE IF NOT EXISTS FileMovementAlerts (Id INTEGER PRIMARY KEY AUTOINCREMENT, PcName TEXT NOT NULL, UserName TEXT, FileName TEXT NOT NULL, FilePath TEXT, Extension TEXT, FileSize INTEGER NOT NULL, Timestamp TEXT NOT NULL, IsFlagged INTEGER NOT NULL DEFAULT 0, Description TEXT);"
        };

        foreach(var sql in initSqls) {
            try { context.Database.ExecuteSqlRaw(sql); } catch { }
        }

        // --- Column Enhancements --- //
        var migrations = new (string Table, string Column, string Sql)[] {
            ("HelpRequests", "LastUpdate", "ALTER TABLE HelpRequests ADD COLUMN LastUpdate TEXT;"),
            ("HelpRequests", "AssignedTo", "ALTER TABLE HelpRequests ADD COLUMN AssignedTo TEXT;"),
            ("HelpRequests", "SlaDeadline", "ALTER TABLE HelpRequests ADD COLUMN SlaDeadline TEXT;"),
            ("HelpRequests", "Resolution", "ALTER TABLE HelpRequests ADD COLUMN Resolution TEXT;"),
            ("HelpRequests", "ResolvedAt", "ALTER TABLE HelpRequests ADD COLUMN ResolvedAt TEXT;"),
            ("HelpRequests", "ScreenshotPath", "ALTER TABLE HelpRequests ADD COLUMN ScreenshotPath TEXT;"),
            ("Terminals", "EnableFileMonitoring", "ALTER TABLE Terminals ADD COLUMN EnableFileMonitoring INTEGER NOT NULL DEFAULT 0;"),
            ("Terminals", "MonitoredPaths", "ALTER TABLE Terminals ADD COLUMN MonitoredPaths TEXT;"),
            ("Terminals", "FileThresholdMb", "ALTER TABLE Terminals ADD COLUMN FileThresholdMb INTEGER NOT NULL DEFAULT 25;"),
            ("Terminals", "MonitoredExtensions", "ALTER TABLE Terminals ADD COLUMN MonitoredExtensions TEXT;"),
            ("Terminals", "EnableUserActivity", "ALTER TABLE Terminals ADD COLUMN EnableUserActivity INTEGER NOT NULL DEFAULT 0;"),
            ("Terminals", "UserActivityGroup", "ALTER TABLE Terminals ADD COLUMN UserActivityGroup TEXT DEFAULT 'Genel';"),
            ("Terminals", "LastUserName", "ALTER TABLE Terminals ADD COLUMN LastUserName TEXT;"),
            ("Terminals", "LastActivityTime", "ALTER TABLE Terminals ADD COLUMN LastActivityTime TEXT;"),
            ("Terminals", "LastError", "ALTER TABLE Terminals ADD COLUMN LastError TEXT;"),
            ("Personnels", "WindowsLogin", "ALTER TABLE Personnels ADD COLUMN WindowsLogin TEXT;"),
            ("Inventory", "Firma", "ALTER TABLE Inventory ADD COLUMN Firma TEXT;"),
            ("Settings", "PhishingSmtpHost", "ALTER TABLE Settings ADD COLUMN PhishingSmtpHost TEXT;"),
            ("Settings", "PhishingSmtpPort", "ALTER TABLE Settings ADD COLUMN PhishingSmtpPort INTEGER NOT NULL DEFAULT 587;"),
            ("Settings", "PhishingSmtpUser", "ALTER TABLE Settings ADD COLUMN PhishingSmtpUser TEXT;"),
            ("Settings", "PhishingSmtpPass", "ALTER TABLE Settings ADD COLUMN PhishingSmtpPass TEXT;"),
            ("Settings", "PhishingTrackingUrl", "ALTER TABLE Settings ADD COLUMN PhishingTrackingUrl TEXT;"),
            ("Personnels", "PhotoUrl", "ALTER TABLE Personnels ADD COLUMN PhotoUrl TEXT;"),
            ("Personnels", "KgbNo", "ALTER TABLE Personnels ADD COLUMN KgbNo TEXT;"),
            ("Personnels", "PrivacyLevel", "ALTER TABLE Personnels ADD COLUMN PrivacyLevel TEXT DEFAULT 'MİLLİ GİZLİ';"),
            ("Personnels", "KgbExpiryDate", "ALTER TABLE Personnels ADD COLUMN KgbExpiryDate TEXT;"),
            ("Personnels", "ApprovedBy", "ALTER TABLE Personnels ADD COLUMN ApprovedBy TEXT DEFAULT 'NERGİS ÇELİK';"),
            ("Personnels", "ApproverTitle", "ALTER TABLE Personnels ADD COLUMN ApproverTitle TEXT DEFAULT 'GÜVENLİK KOORDİNATÖRÜ';"),
            ("Logs", "Category", "ALTER TABLE Logs ADD COLUMN Category TEXT DEFAULT 'SYSTEM';")
        };

        foreach(var m in migrations) {
            try { context.Database.ExecuteSqlRaw(m.Sql); } catch { }
        }

        // Ensure Uploads directory exists
        var uploadDir = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", "helpdesk");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);
    } catch (Exception ex) {
        Console.WriteLine($"Database Init Warning: {ex.Message}");
    }
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthorization();

app.UseMiddleware<GlobalExceptionMiddleware>();

// --- Endpoints & Hubs --- //
app.MapControllers();
app.MapHub<NetLiveness.Api.Hubs.ChatHub>("/chathub");
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.Now }));

// --- Inline File Alerts API (legacy) --- //
app.MapGet("/api/file-alerts", async (AppDbContext context) => {
    return Results.Ok(await context.FileMovementAlerts.OrderByDescending(a => a.Timestamp).Take(200).ToListAsync());
});
app.MapDelete("/api/file-alerts/{id}", async (int id, AppDbContext context) => {
    var alert = await context.FileMovementAlerts.FindAsync(id);
    if (alert == null) return Results.NotFound();
    context.FileMovementAlerts.Remove(alert);
    await context.SaveChangesAsync();
    return Results.NoContent();
});

// SPA Fallback: Tüm bilinmeyen rotaları React frontend'ine (index.html) yönlendir
app.MapFallbackToFile("index.html");

app.Run();


