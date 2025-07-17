/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "shareExpiresAt" TIMESTAMP(3),
ADD COLUMN     "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Folder_shareId_key" ON "Folder"("shareId");
