-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "targetWeight";

-- CreateTable
CREATE TABLE "TargetAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "assetClass" TEXT,
    "symbol" TEXT,
    "targetWeight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TargetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TargetAllocation_userId_idx" ON "TargetAllocation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TargetAllocation_userId_assetClass_key" ON "TargetAllocation"("userId", "assetClass");

-- CreateIndex
CREATE UNIQUE INDEX "TargetAllocation_userId_symbol_key" ON "TargetAllocation"("userId", "symbol");
