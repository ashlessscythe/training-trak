-- CreateTable
CREATE TABLE "_PositionSOPs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PositionSOPs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PositionSOPs_B_index" ON "_PositionSOPs"("B");

-- AddForeignKey
ALTER TABLE "_PositionSOPs" ADD CONSTRAINT "_PositionSOPs_A_fkey" FOREIGN KEY ("A") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PositionSOPs" ADD CONSTRAINT "_PositionSOPs_B_fkey" FOREIGN KEY ("B") REFERENCES "SOP"("id") ON DELETE CASCADE ON UPDATE CASCADE;
