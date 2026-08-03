-- Default admin account for local development.
-- Login compares the plaintext password against PasswordHash (see AuthController),
-- so admin / admin logs in. Idempotent: only inserts if 'admin' does not exist.

INSERT INTO "AppUsers" ("Username", "Email", "PasswordHash", "FullName", "Permissions", "IsAdmin", "IsActive", "CreatedAt")
SELECT 'admin', 'admin@repkon.local', 'admin', 'Sistem Yöneticisi',
       'Dashboard,Terminals,Reports,Onboarding,Settings,Users', 1, 1, '2026-03-24T12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM "AppUsers" WHERE "Username" = 'admin');
