-- AlterTable
ALTER TABLE "TermDeposit" ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolutionType" TEXT,
ADD COLUMN     "resolvedAmount" DOUBLE PRECISION,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TermDeposit_maturityDate_idx" ON "TermDeposit"("maturityDate");

-- CreateIndex
CREATE INDEX "TermDeposit_resolvedAt_idx" ON "TermDeposit"("resolvedAt");
