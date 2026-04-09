CREATE TABLE IF NOT EXISTS "AppUsers" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AppUsers" PRIMARY KEY AUTOINCREMENT,
    "Username" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "FullName" TEXT NOT NULL,
    "Permissions" TEXT NOT NULL,
    "IsAdmin" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL
);
INSERT INTO "AppUsers" ("Username", "PasswordHash", "FullName", "Permissions", "IsAdmin", "CreatedAt") 
VALUES ('admin', 'admin', 'Sistem Yöneticisi', 'Dashboard,Terminals,Reports,Onboarding,Settings,Users', 1, '2026-03-24T12:00:00');
