-- Preserve the GPS capture time and make retries idempotent.
ALTER TABLE "Telemetry"
ADD COLUMN "clientEventId" TEXT,
ADD COLUMN "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Telemetry_clientEventId_key" ON "Telemetry"("clientEventId");
CREATE INDEX "Telemetry_vehiculeId_capturedAt_idx" ON "Telemetry"("vehiculeId", "capturedAt");
