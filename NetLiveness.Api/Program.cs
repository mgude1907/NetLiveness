using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Middleware;
using System.IO;
using Microsoft.Extensions.Logging;
using NetLiveness.Api.Models;
using NetLiveness.Api.Services;

var builder = WebApplication.CreateBuilder(args);

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

// Configure File Logging for Diagnostics Dashboard
builder.Logging.AddProvider(new FileLoggerProvider());

// Registered Background Services (MOVED TO MONITOR WORKER SERVICE)
// builder.Services.AddHostedService<NetLiveness.Api.Services.NetworkMonitorService>();
// builder.Services.AddHostedService<NetLiveness.Api.Services.SslMonitorService>();
// builder.Services.AddHostedService<NetLiveness.Api.Services.UserActivityService>();

// Configure SQLite Database
var connectionString = "Data Source=c:\\Users\\mgude\\.gemini\\antigravity\\scratch\\NetLiveness.Api\\netliveness_v2.db;Cache=Shared;Mode=ReadWriteCreate;Default Timeout=10;";
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

// --- Database Optimization & Safety (Moved after single app build) --- //
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try {
        context.Database.OpenConnection();
        context.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
        context.Database.ExecuteSqlRaw("PRAGMA synchronous=NORMAL;");
        
        // --- Safe Migrations --- //
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS ComplianceDocuments (Id INTEGER PRIMARY KEY AUTOINCREMENT, Standard TEXT NOT NULL, FileName TEXT NOT NULL, FilePath TEXT NOT NULL, UploadDate TEXT NOT NULL, Description TEXT NULL);");
        
        /* Legacy Surveys check removed to prevent migration errors */

        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS Surveys (Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NULL, IsActive INTEGER NOT NULL DEFAULT 1, CreatedAt TEXT NOT NULL);");
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS SurveyQuestions (Id INTEGER PRIMARY KEY AUTOINCREMENT, SurveyId INTEGER NOT NULL, Text TEXT NOT NULL, Type TEXT NOT NULL, Options TEXT NULL, ""Order"" INTEGER NOT NULL DEFAULT 0);");
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS SurveyResponses (Id INTEGER PRIMARY KEY AUTOINCREMENT, SurveyId INTEGER NOT NULL, ParticipantName TEXT NOT NULL, SubmittedAt TEXT NOT NULL);");
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS SurveyAnswers (Id INTEGER PRIMARY KEY AUTOINCREMENT, ResponseId INTEGER NOT NULL, QuestionId INTEGER NOT NULL, Value TEXT NOT NULL);");
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS Backups (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Description TEXT NULL, FilePath TEXT NOT NULL, DbOnly INTEGER NOT NULL DEFAULT 0, SizeBytes INTEGER NOT NULL DEFAULT 0, CreatedAt TEXT NOT NULL);");
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS HelpRequests (Id INTEGER PRIMARY KEY AUTOINCREMENT, SenderName TEXT, SenderEmail TEXT, Subject TEXT, Message TEXT, Category TEXT, Priority TEXT, Status TEXT, CreatedAt TEXT, Resolution TEXT, ResolvedAt TEXT);");
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS SoftwareLicenses (Id INTEGER PRIMARY KEY AUTOINCREMENT, SoftwareName TEXT NOT NULL, LicenseKey TEXT, LicenseType TEXT DEFAULT 'Retail', ExpirationDate TEXT, AssignedTo TEXT, Notes TEXT, AddedAt TEXT);");
        
        // Helper to check column existence in SQLite (Robust version)
        Func<string, string, bool> columnExists = (tableName, columnName) => {
            try {
                context.Database.ExecuteSqlRaw($"SELECT {columnName} FROM {tableName} LIMIT 1");
                return true;
            } catch {
                return false;
            }
        };

        Action<string, string, string> ensureColumn = (tableName, columnName, alterSql) => {
            if (!columnExists(tableName, columnName)) {
                try { context.Database.ExecuteSqlRaw(alterSql); } catch { }
            }
        };

        ensureColumn("HelpRequests", "Resolution", "ALTER TABLE HelpRequests ADD COLUMN Resolution TEXT;");
        ensureColumn("HelpRequests", "ResolvedAt", "ALTER TABLE HelpRequests ADD COLUMN ResolvedAt TEXT;");
        ensureColumn("HelpRequests", "ScreenshotPath", "ALTER TABLE HelpRequests ADD COLUMN ScreenshotPath TEXT;");

        // --- File Monitoring Migrations --- //
        context.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS FileMovementAlerts (
            Id INTEGER PRIMARY KEY AUTOINCREMENT, PcName TEXT NOT NULL, UserName TEXT, FileName TEXT NOT NULL, FilePath TEXT, Extension TEXT, FileSize INTEGER NOT NULL, Timestamp TEXT NOT NULL, IsFlagged INTEGER NOT NULL DEFAULT 0, Description TEXT
        );");
        
        ensureColumn("Terminals", "EnableFileMonitoring", "ALTER TABLE Terminals ADD COLUMN EnableFileMonitoring INTEGER NOT NULL DEFAULT 0;");
        ensureColumn("Terminals", "MonitoredPaths", "ALTER TABLE Terminals ADD COLUMN MonitoredPaths TEXT;");
        ensureColumn("Terminals", "FileThresholdMb", "ALTER TABLE Terminals ADD COLUMN FileThresholdMb INTEGER NOT NULL DEFAULT 25;");
        ensureColumn("Terminals", "MonitoredExtensions", "ALTER TABLE Terminals ADD COLUMN MonitoredExtensions TEXT;");
        ensureColumn("Terminals", "EnableUserActivity", "ALTER TABLE Terminals ADD COLUMN EnableUserActivity INTEGER NOT NULL DEFAULT 0;");
        ensureColumn("Terminals", "UserActivityGroup", "ALTER TABLE Terminals ADD COLUMN UserActivityGroup TEXT DEFAULT 'Genel';");
        ensureColumn("Terminals", "LastUserName", "ALTER TABLE Terminals ADD COLUMN LastUserName TEXT;");
        ensureColumn("Terminals", "LastActivityTime", "ALTER TABLE Terminals ADD COLUMN LastActivityTime TEXT;");
        ensureColumn("Terminals", "LastError", "ALTER TABLE Terminals ADD COLUMN LastError TEXT;");

        // --- Personnel Migrations --- //
        ensureColumn("Personnels", "WindowsLogin", "ALTER TABLE Personnels ADD COLUMN WindowsLogin TEXT;");
        ensureColumn("Inventory", "Firma", "ALTER TABLE Inventory ADD COLUMN Firma TEXT;");

        // --- NULL Value Cleanup --- //
        try {
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET DiskSizeGb = 0 WHERE DiskSizeGb IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET DiskFreeGb = 0 WHERE DiskFreeGb IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET CpuUsage = 0 WHERE CpuUsage IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET RamUsage = 0 WHERE RamUsage IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET RttMs = 0 WHERE RttMs IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET SkipWmi = 0 WHERE SkipWmi IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET Maintenance = 0 WHERE Maintenance IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET EnableFileMonitoring = 0 WHERE EnableFileMonitoring IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE Terminals SET FileThresholdMb = 25 WHERE FileThresholdMb IS NULL;");
        } catch { }

        // Legacy target sync removed.

        // Ensure Uploads directory exists
        var uploadDir = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", "helpdesk");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);
    } catch (Exception ex) {
        Console.WriteLine($"Database Init Warning: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseAuthorization();

// --- Additional Endpoints --- //
app.MapGet("/api/file-alerts", async (AppDbContext context) => {
    var alerts = await context.FileMovementAlerts.OrderByDescending(a => a.Timestamp).Take(200).ToListAsync();
    return Results.Ok(alerts);
});

app.MapDelete("/api/file-alerts/{id}", async (int id, AppDbContext context) => {
    var alert = await context.FileMovementAlerts.FindAsync(id);
    if (alert == null) return Results.NotFound();
    context.FileMovementAlerts.Remove(alert);
    await context.SaveChangesAsync();
    return Results.NoContent();
});

app.MapControllers();
app.MapHub<NetLiveness.Api.Hubs.ChatHub>("/chathub");
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.Now }));
app.Run();

// --- Simple File Logger Implementation --- //
public class FileLoggerProvider : ILoggerProvider
{
    public ILogger CreateLogger(string categoryName) => new FileLogger();
    public void Dispose() { }
}

public class FileLogger : ILogger
{
    public IDisposable BeginScope<TState>(TState state) => null;
    // Sadece Warning ve Error seviyelerini logla (gösterge panelini doldurmamak için)
    public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Warning;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;
        var msg = formatter(state, exception);
        if (exception != null) msg += $"\n{exception}";
        
        try 
        {
            var logLine = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{logLevel}] {msg}\n";
            File.AppendAllText("system_logs.txt", logLine);
            
            // Eğer dosya çok büyürse son 50kb kalsın (basit log rotation)
            var info = new FileInfo("system_logs.txt");
            if (info.Length > 200 * 1024) {
                var lines = File.ReadAllLines("system_logs.txt").TakeLast(500);
                File.WriteAllLines("system_logs.txt", lines);
            }
        } 
        catch { }
    }
}
