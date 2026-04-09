CREATE TABLE IF NOT EXISTS "NistRequirements" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "RequirementId" TEXT NOT NULL,
    "Family" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "Comments" TEXT NOT NULL,
    "LastUpdated" TEXT NOT NULL
);
