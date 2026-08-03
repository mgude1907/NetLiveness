-- Authoritative dev database schema for NetLiveness.Api (SQLite).
--
-- WHY THIS FILE EXISTS: the EF migration history in this repo is broken for a
-- from-scratch build (several tables/columns such as AppUsers, DirectoryEntries,
-- Onboardings, Iso9001Requirements and various Settings/Personnels columns are
-- never created by any migration `Up`, and AppDbContextModelSnapshot is stale),
-- so `dotnet ef database update` fails on a clean DB. The application never
-- calls Database.Migrate() at runtime (see Program.cs), so the DB only needs to
-- match the runtime model.
--
-- This schema was generated from AppDbContext via EF Core `EnsureCreated()`
-- (i.e. the exact runtime model) and therefore reflects the correct schema the
-- API and MonitorWorker expect. It also contains the default Settings row.
--
-- Usage (from repo root, fresh DB):
--   sqlite3 NetLiveness.Api/netliveness_v2.db < dev-db/dev_schema.sql
-- Then seed the admin account:
--   sqlite3 NetLiveness.Api/netliveness_v2.db < dev-db/dev_seed.sql
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "AccessColumns" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AccessColumns" PRIMARY KEY AUTOINCREMENT,
    "Category" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "DisplayOrder" INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "AccessGrants" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AccessGrants" PRIMARY KEY AUTOINCREMENT,
    "PersonnelId" INTEGER NOT NULL,
    "AccessColumnId" INTEGER NOT NULL,
    "AccessLevel" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "AppUsers" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AppUsers" PRIMARY KEY AUTOINCREMENT,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "FullName" TEXT NOT NULL,
    "Permissions" TEXT NOT NULL,
    "IsAdmin" INTEGER NOT NULL,
    "IsActive" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Backups" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Backups" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "FilePath" TEXT NOT NULL,
    "DbOnly" INTEGER NOT NULL,
    "SizeBytes" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "ChatChannels" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ChatChannels" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "OwnerId" INTEGER NULL
);
CREATE TABLE IF NOT EXISTS "ComplianceDocuments" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ComplianceDocuments" PRIMARY KEY AUTOINCREMENT,
    "Standard" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "FilePath" TEXT NOT NULL,
    "UploadDate" TEXT NOT NULL,
    "Description" TEXT NULL
);
CREATE TABLE IF NOT EXISTS "DirectoryEntries" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_DirectoryEntries" PRIMARY KEY AUTOINCREMENT,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "MobilePhone" TEXT NOT NULL,
    "InternalPhone" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Department" TEXT NOT NULL,
    "Position" TEXT NOT NULL,
    "ImageUrl" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "FacilityRequirements" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_FacilityRequirements" PRIMARY KEY AUTOINCREMENT,
    "RequirementId" TEXT NOT NULL,
    "Family" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "Comments" TEXT NOT NULL,
    "DocumentPath" TEXT NULL,
    "LastUpdated" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Feedbacks" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Feedbacks" PRIMARY KEY AUTOINCREMENT,
    "SenderName" TEXT NOT NULL,
    "Subject" TEXT NOT NULL,
    "Message" TEXT NOT NULL,
    "IsRead" INTEGER NOT NULL,
    "DateSubmitted" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "FileMovementAlerts" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_FileMovementAlerts" PRIMARY KEY AUTOINCREMENT,
    "PcName" TEXT NOT NULL,
    "UserName" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "FilePath" TEXT NOT NULL,
    "Extension" TEXT NOT NULL,
    "FileSize" INTEGER NOT NULL,
    "Timestamp" TEXT NOT NULL,
    "IsFlagged" INTEGER NOT NULL,
    "Description" TEXT NULL
);
CREATE TABLE IF NOT EXISTS "HelpRequests" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_HelpRequests" PRIMARY KEY AUTOINCREMENT,
    "SenderName" TEXT NOT NULL,
    "SenderEmail" TEXT NOT NULL,
    "Subject" TEXT NOT NULL,
    "Message" TEXT NOT NULL,
    "Category" TEXT NOT NULL,
    "Priority" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "CreatedAt" TEXT NULL,
    "LastUpdate" TEXT NULL,
    "AssignedTo" TEXT NULL,
    "Resolution" TEXT NULL,
    "ResolvedAt" TEXT NULL,
    "SlaDeadline" TEXT NULL,
    "ScreenshotPath" TEXT NULL
);
CREATE TABLE IF NOT EXISTS "Inventory" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Inventory" PRIMARY KEY AUTOINCREMENT,
    "Category" TEXT NULL,
    "Brand" TEXT NULL,
    "Model" TEXT NULL,
    "SerialNo" TEXT NULL,
    "PcIsmi" TEXT NULL,
    "IpAddress" TEXT NULL,
    "EnvanterTuru" TEXT NULL,
    "AssignedTo" TEXT NULL,
    "Firma" TEXT NULL,
    "AssignedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Iso9001Requirements" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Iso9001Requirements" PRIMARY KEY AUTOINCREMENT,
    "RequirementId" TEXT NOT NULL,
    "Family" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "Comments" TEXT NOT NULL,
    "DocumentPath" TEXT NULL,
    "LastUpdated" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "IsoRequirements" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_IsoRequirements" PRIMARY KEY AUTOINCREMENT,
    "RequirementId" TEXT NOT NULL,
    "Family" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "Comments" TEXT NOT NULL,
    "DocumentPath" TEXT NULL,
    "LastUpdated" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "ItBudgetCategories" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ItBudgetCategories" PRIMARY KEY AUTOINCREMENT,
    "Year" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "OrderIndex" INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "Logs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Logs" PRIMARY KEY AUTOINCREMENT,
    "Date" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "Details" TEXT NOT NULL,
    "Operator" TEXT NOT NULL,
    "Category" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "NistRequirements" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_NistRequirements" PRIMARY KEY AUTOINCREMENT,
    "RequirementId" TEXT NOT NULL,
    "Family" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "Comments" TEXT NOT NULL,
    "DocumentPath" TEXT NULL,
    "LastUpdated" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Onboardings" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Onboardings" PRIMARY KEY AUTOINCREMENT,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Company" TEXT NOT NULL,
    "Manager" TEXT NOT NULL,
    "StartDate" TEXT NOT NULL,
    "HomeAddress" TEXT NOT NULL,
    "MobilePhone" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Personnels" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Personnels" PRIMARY KEY AUTOINCREMENT,
    "Ad" TEXT NOT NULL,
    "Soyad" TEXT NOT NULL,
    "AdSoyad" TEXT NOT NULL,
    "Bolum" TEXT NOT NULL,
    "Gorev" TEXT NOT NULL,
    "Firma" TEXT NOT NULL,
    "SicilNo" TEXT NOT NULL,
    "KartNo" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL,
    "GirisTarih" TEXT NULL,
    "ResignedAt" TEXT NULL,
    "UserID" TEXT NULL,
    "WindowsLogin" TEXT NULL,
    "PhotoUrl" TEXT NULL,
    "KgbNo" TEXT NULL,
    "PrivacyLevel" TEXT NULL,
    "KgbExpiryDate" TEXT NULL,
    "ApprovedBy" TEXT NULL,
    "ApproverTitle" TEXT NULL
);
CREATE TABLE IF NOT EXISTS "Settings" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Settings" PRIMARY KEY AUTOINCREMENT,
    "PingIntervalMs" INTEGER NOT NULL,
    "SmtpEnabled" INTEGER NOT NULL,
    "SmtpServer" TEXT NOT NULL,
    "SmtpPort" INTEGER NOT NULL,
    "SmtpUser" TEXT NOT NULL,
    "SmtpPass" TEXT NOT NULL,
    "AlertEmailTo" TEXT NOT NULL,
    "AdminEmailTo" TEXT NOT NULL,
    "ItEmailTo" TEXT NOT NULL,
    "GlpiUrl" TEXT NOT NULL,
    "GlpiAppToken" TEXT NOT NULL,
    "GlpiUserToken" TEXT NOT NULL,
    "AppVersion" TEXT NOT NULL,
    "UpdaterUrl" TEXT NOT NULL,
    "ZimmetTemplatePath" TEXT NOT NULL,
    "FirmsList" TEXT NOT NULL,
    "WmiUser" TEXT NOT NULL,
    "WmiPass" TEXT NOT NULL,
    "WmiDomain" TEXT NOT NULL,
    "AppLogo" TEXT NOT NULL,
    "AppTitle" TEXT NOT NULL,
    "PersonnelIntegrationType" TEXT NOT NULL,
    "PersonnelSqlHost" TEXT NOT NULL,
    "PersonnelSqlDatabase" TEXT NOT NULL,
    "PersonnelSqlUser" TEXT NOT NULL,
    "PersonnelSqlPass" TEXT NOT NULL,
    "PersonnelSqlAuthType" TEXT NOT NULL,
    "PersonnelIntegrationSqlQuery" TEXT NOT NULL,
    "PersonnelIntegrationLastSync" TEXT NULL,
    "PhishingSmtpHost" TEXT NULL,
    "PhishingSmtpPort" INTEGER NOT NULL,
    "PhishingSmtpUser" TEXT NULL,
    "PhishingSmtpPass" TEXT NULL,
    "PhishingTrackingUrl" TEXT NULL
);
INSERT INTO Settings VALUES(1,5000,0,'',587,'','','','','','','','','v1.0.0','https://raw.githubusercontent.com/username/repo/main/version.json','','Merkez,Şube-1,RET,RMK,RUT,RSS,RMT,RPT,CLR,KARDELN,RET BEYLERBEYI,RET UMRANIYE,RET OMERLI','','','','','REPKON','None','','','','','SQL','SELECT PersonelNo, Ad, Soyad, Bolum, Firma, UserID, GirisTarih, CikisTarih FROM [dbo].[Sicil]',NULL,'smtp.gmail.com',587,'','','http://localhost:3001/track');
CREATE TABLE IF NOT EXISTS "SoftwareLicenses" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SoftwareLicenses" PRIMARY KEY AUTOINCREMENT,
    "SoftwareName" TEXT NOT NULL,
    "LicenseKey" TEXT NOT NULL,
    "LicenseType" TEXT NOT NULL,
    "ExpirationDate" TEXT NULL,
    "AssignedTo" TEXT NOT NULL,
    "Notes" TEXT NOT NULL,
    "AddedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "SslItems" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SslItems" PRIMARY KEY AUTOINCREMENT,
    "Domain" TEXT NOT NULL,
    "Owner" TEXT NOT NULL,
    "Environment" TEXT NOT NULL,
    "ExpiryDate" TEXT NOT NULL,
    "DaysLeft" INTEGER NOT NULL,
    "Status" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Stock" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Stock" PRIMARY KEY AUTOINCREMENT,
    "Category" TEXT NULL,
    "Brand" TEXT NULL,
    "Model" TEXT NULL,
    "SerialNo" TEXT NULL,
    "PcIsmi" TEXT NULL,
    "IpAddress" TEXT NULL,
    "Status" TEXT NULL,
    "EnvanterTuru" TEXT NULL,
    "AddedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "SurveyAnswers" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SurveyAnswers" PRIMARY KEY AUTOINCREMENT,
    "ResponseId" INTEGER NOT NULL,
    "QuestionId" INTEGER NOT NULL,
    "Value" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "SurveyQuestions" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SurveyQuestions" PRIMARY KEY AUTOINCREMENT,
    "SurveyId" INTEGER NOT NULL,
    "Text" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "Options" TEXT NOT NULL,
    "Order" INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "SurveyResponses" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SurveyResponses" PRIMARY KEY AUTOINCREMENT,
    "SurveyId" INTEGER NOT NULL,
    "ParticipantName" TEXT NOT NULL,
    "SubmittedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Surveys" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Surveys" PRIMARY KEY AUTOINCREMENT,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "SystemUpdates" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SystemUpdates" PRIMARY KEY AUTOINCREMENT,
    "Version" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "DateInstalled" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Terminals" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Terminals" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Host" TEXT NOT NULL,
    "Mac" TEXT NOT NULL,
    "SwitchPort" TEXT NOT NULL,
    "Company" TEXT NOT NULL,
    "Country" TEXT NOT NULL,
    "Location" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "DeviceType" TEXT NOT NULL,
    "Maintenance" INTEGER NULL,
    "SkipWmi" INTEGER NULL,
    "Status" TEXT NOT NULL,
    "RttMs" INTEGER NULL,
    "LastCheck" TEXT NULL,
    "DiskSizeGb" REAL NULL,
    "DiskFreeGb" REAL NULL,
    "CpuUsage" INTEGER NULL,
    "RamUsage" INTEGER NULL,
    "Username" TEXT NULL,
    "Password" TEXT NULL,
    "LastError" TEXT NULL,
    "EnableFileMonitoring" INTEGER NULL,
    "MonitoredPaths" TEXT NULL,
    "MonitoredExtensions" TEXT NULL,
    "FileThresholdMb" INTEGER NULL,
    "EnableUserActivity" INTEGER NOT NULL,
    "UserActivityGroup" TEXT NOT NULL,
    "LastUserName" TEXT NULL,
    "LastActivityTime" TEXT NULL
);
CREATE TABLE IF NOT EXISTS "UserActivityTargets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_UserActivityTargets" PRIMARY KEY AUTOINCREMENT,
    "PcName" TEXT NOT NULL,
    "Group" TEXT NOT NULL,
    "IsEnabled" INTEGER NOT NULL,
    "LastCheck" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "UserAppActivities" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_UserAppActivities" PRIMARY KEY AUTOINCREMENT,
    "PcName" TEXT NOT NULL,
    "UserName" TEXT NOT NULL,
    "AppName" TEXT NOT NULL,
    "WindowTitle" TEXT NOT NULL,
    "Timestamp" TEXT NOT NULL,
    "DurationSeconds" INTEGER NOT NULL,
    "IsActive" INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "ChatChannelMembers" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ChatChannelMembers" PRIMARY KEY AUTOINCREMENT,
    "ChannelId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    "JoinedAt" TEXT NOT NULL,
    CONSTRAINT "FK_ChatChannelMembers_AppUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AppUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ChatChannelMembers_ChatChannels_ChannelId" FOREIGN KEY ("ChannelId") REFERENCES "ChatChannels" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "ChatMessages" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ChatMessages" PRIMARY KEY AUTOINCREMENT,
    "ChannelId" INTEGER NULL,
    "RecipientId" INTEGER NULL,
    "UserId" INTEGER NOT NULL,
    "SenderName" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "Timestamp" TEXT NOT NULL,
    "AttachmentUrl" TEXT NULL,
    "AttachmentType" TEXT NULL,
    CONSTRAINT "FK_ChatMessages_AppUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AppUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ChatMessages_ChatChannels_ChannelId" FOREIGN KEY ("ChannelId") REFERENCES "ChatChannels" ("Id")
);
CREATE TABLE IF NOT EXISTS "HelpRequestReplies" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_HelpRequestReplies" PRIMARY KEY AUTOINCREMENT,
    "HelpRequestId" INTEGER NOT NULL,
    "SenderName" TEXT NOT NULL,
    "Message" TEXT NOT NULL,
    "IsFromAdmin" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "AttachmentPath" TEXT NULL,
    CONSTRAINT "FK_HelpRequestReplies_HelpRequests_HelpRequestId" FOREIGN KEY ("HelpRequestId") REFERENCES "HelpRequests" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "ItBudgetItems" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ItBudgetItems" PRIMARY KEY AUTOINCREMENT,
    "CategoryId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Jan" TEXT NOT NULL,
    "Feb" TEXT NOT NULL,
    "Mar" TEXT NOT NULL,
    "Apr" TEXT NOT NULL,
    "May" TEXT NOT NULL,
    "Jun" TEXT NOT NULL,
    "Jul" TEXT NOT NULL,
    "Aug" TEXT NOT NULL,
    "Sep" TEXT NOT NULL,
    "Oct" TEXT NOT NULL,
    "Nov" TEXT NOT NULL,
    "Dec" TEXT NOT NULL,
    CONSTRAINT "FK_ItBudgetItems_ItBudgetCategories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "ItBudgetCategories" ("Id") ON DELETE CASCADE
);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('Settings',1);
CREATE INDEX "IX_ChatChannelMembers_ChannelId" ON "ChatChannelMembers" ("ChannelId");
CREATE INDEX "IX_ChatChannelMembers_UserId" ON "ChatChannelMembers" ("UserId");
CREATE INDEX "IX_ChatMessages_ChannelId" ON "ChatMessages" ("ChannelId");
CREATE INDEX "IX_ChatMessages_UserId" ON "ChatMessages" ("UserId");
CREATE INDEX "IX_HelpRequestReplies_HelpRequestId" ON "HelpRequestReplies" ("HelpRequestId");
CREATE INDEX "IX_ItBudgetItems_CategoryId" ON "ItBudgetItems" ("CategoryId");
COMMIT;
