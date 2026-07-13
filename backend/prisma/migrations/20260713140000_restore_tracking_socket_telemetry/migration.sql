-- Restore the columns required by WebSocket tracking after the previous
-- development migration removed them.
ALTER TABLE "Telemetry"
ADD COLUMN "clientEventId" UUID,
ADD COLUMN "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Telemetry_clientEventId_key"
ON "Telemetry"("clientEventId");

CREATE INDEX "Telemetry_vehiculeId_capturedAt_idx"
ON "Telemetry"("vehiculeId", "capturedAt");
