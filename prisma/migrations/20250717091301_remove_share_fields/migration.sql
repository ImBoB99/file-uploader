/*
  Warnings:

  - You are about to drop the column `shareExpiresAt` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `shareId` on the `Folder` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Folder_shareId_key";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "shareExpiresAt",
DROP COLUMN "shareId";
