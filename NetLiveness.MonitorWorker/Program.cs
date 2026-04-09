using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Services;

var builder = Host.CreateApplicationBuilder(args);

// Add services to the container.
builder.Services.AddHttpClient();

// Configure SQLite Database (Same as API)
var connectionString = "Data Source=c:\\Users\\mgude\\.gemini\\antigravity\\scratch\\NetLiveness.Api\\netliveness_v2.db;Cache=Shared;Mode=ReadWriteCreate;Default Timeout=10;";
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
