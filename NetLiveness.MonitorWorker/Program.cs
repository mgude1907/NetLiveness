using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Services;
using Serilog;
using Serilog.Events;

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/worker_log.txt", 
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss}] [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try 
{
    Log.Information("Starting NetLiveness Monitor Worker...");
    var builder = Host.CreateApplicationBuilder(args);
    if (OperatingSystem.IsWindows())
    {
        builder.Services.AddWindowsService();
    }
    builder.Services.AddSerilog(); // Use Serilog
    builder.Services.AddHttpClient();

    // Configure SQLite Database (shared with API)
    var dbPath = ResolveSharedDbPath();
    var connectionString = $"Data Source={dbPath};Cache=Shared;Mode=ReadWriteCreate;Default Timeout=10;";
    builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

    // Register Background Services
    builder.Services.AddHostedService<NetworkMonitorService>();
    builder.Services.AddHostedService<SslMonitorService>();
    builder.Services.AddHostedService<UserActivityService>();
    builder.Services.AddHostedService<FileMovementService>();

    var host = builder.Build();

    // Ensure WAL mode for better concurrency between API and Monitor
    using (var scope = host.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.OpenConnection();
        context.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
    }

    host.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

static string ResolveSharedDbPath()
{
    var fromEnv = Environment.GetEnvironmentVariable("NETLIVENESS_DB_PATH");
    if (!string.IsNullOrWhiteSpace(fromEnv))
    {
        return Path.GetFullPath(fromEnv);
    }

    var candidates = new[]
    {
        Path.Combine(AppContext.BaseDirectory, "..", "api", "netliveness_v2.db"),
        Path.Combine(AppContext.BaseDirectory, "..", "Backend", "netliveness_v2.db"),
        Path.Combine(AppContext.BaseDirectory, "netliveness_v2.db"),
    };

    foreach (var candidate in candidates)
    {
        var full = Path.GetFullPath(candidate);
        if (File.Exists(full))
        {
            return full;
        }
    }

    return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "api", "netliveness_v2.db"));
}
