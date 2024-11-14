-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "phoneNumber" TEXT,
    "interactionsCount" INTEGER,
    "currentlyTalkingTo" TEXT,
    "lastMessage" TEXT,
    "lastContactAt" DATETIME,
    "status" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Interaction" ("createdAt", "currentlyTalkingTo", "id", "interactionsCount", "lastContactAt", "lastMessage", "name", "phoneNumber", "status", "updatedAt") SELECT "createdAt", "currentlyTalkingTo", "id", "interactionsCount", "lastContactAt", "lastMessage", "name", "phoneNumber", "status", "updatedAt" FROM "Interaction";
DROP TABLE "Interaction";
ALTER TABLE "new_Interaction" RENAME TO "Interaction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
