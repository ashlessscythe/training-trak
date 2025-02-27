-- First, add the column as nullable
ALTER TABLE "Document" ADD COLUMN "siteId" TEXT;

-- Update existing documents to use their uploader's site
UPDATE "Document" d
SET "siteId" = u."siteId"
FROM "User" u
WHERE d."uploadedById" = u.id;

-- Make the column required after setting values
ALTER TABLE "Document" ALTER COLUMN "siteId" SET NOT NULL;

-- Create index
CREATE INDEX "Document_siteId_idx" ON "Document"("siteId");

-- Add foreign key constraint
ALTER TABLE "Document" ADD CONSTRAINT "Document_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
