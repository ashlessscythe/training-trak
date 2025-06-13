-- CreateTable
CREATE TABLE "SiteAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteAdmin_userId_idx" ON "SiteAdmin"("userId");

-- CreateIndex
CREATE INDEX "SiteAdmin_siteId_idx" ON "SiteAdmin"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteAdmin_userId_siteId_key" ON "SiteAdmin"("userId", "siteId");

-- AddForeignKey
ALTER TABLE "SiteAdmin" ADD CONSTRAINT "SiteAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAdmin" ADD CONSTRAINT "SiteAdmin_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
