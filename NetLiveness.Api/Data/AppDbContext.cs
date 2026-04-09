using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Terminal> Terminals { get; set; }
        public DbSet<Personnel> Personnels { get; set; }
        public DbSet<StockItem> Stock { get; set; }
        public DbSet<InventoryItem> Inventory { get; set; }
        public DbSet<SslItem> SslItems { get; set; }
        public DbSet<AuditLogEntry> Logs { get; set; }
        public DbSet<AppSettings> Settings { get; set; }

        public DbSet<AccessColumn> AccessColumns { get; set; }
        public DbSet<AccessGrant> AccessGrants { get; set; }
        public DbSet<NistRequirement> NistRequirements { get; set; }
        public DbSet<IsoRequirement> IsoRequirements { get; set; }
        public DbSet<FacilityRequirement> FacilityRequirements { get; set; }
        public DbSet<Iso9001Requirement> Iso9001Requirements { get; set; }
        public DbSet<UserActivityTarget> UserActivityTargets { get; set; }
        public DbSet<UserAppActivity> UserAppActivities { get; set; }

        public DbSet<Onboarding> Onboardings { get; set; }
        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<DirectoryEntry> DirectoryEntries { get; set; }
        public DbSet<SystemUpdate> SystemUpdates { get; set; }
        public DbSet<FeedbackEntry> Feedbacks { get; set; }
        public DbSet<ComplianceDocument> ComplianceDocuments { get; set; }
        public DbSet<InternalSurvey> Surveys { get; set; }
        public DbSet<SurveyQuestion> SurveyQuestions { get; set; }
        public DbSet<SurveyResponse> SurveyResponses { get; set; }
        public DbSet<SurveyAnswer> SurveyAnswers { get; set; }
        public DbSet<BackupSnapshot> Backups { get; set; }
        public DbSet<FileMovementAlert> FileMovementAlerts { get; set; }
        public DbSet<SoftwareLicense> SoftwareLicenses { get; set; }
        
        // Bütçe
        public DbSet<ItBudgetCategory> ItBudgetCategories { get; set; }
        public DbSet<ItBudgetItem> ItBudgetItems { get; set; }
        
        // Chat
        public DbSet<ChatChannel> ChatChannels { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<ChatChannelMember> ChatChannelMembers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Seed default settings
            modelBuilder.Entity<AppSettings>().HasData(new AppSettings { Id = 1 });
        }
    }
}
