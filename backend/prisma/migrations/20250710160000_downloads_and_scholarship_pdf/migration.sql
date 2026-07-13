-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN "applicationMode" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "scholarships" ADD COLUMN "pdfUrl" TEXT;

-- CreateTable
CREATE TABLE "public_downloads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'form',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileLabel" TEXT NOT NULL DEFAULT 'PDF',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "public_downloads_category_idx" ON "public_downloads"("category");
