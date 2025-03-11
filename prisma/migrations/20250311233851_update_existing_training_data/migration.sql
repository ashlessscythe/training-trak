-- Update existing COMPLETED trainings to be marked as historical
UPDATE "TrainingProgress"
SET "isHistorical" = true
WHERE "status" = 'COMPLETED';
