-- CreateFunction
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- DropTrigger (if exists)
DROP TRIGGER IF EXISTS update_ai_config_updated_at ON "AIConfig";

-- CreateTrigger
CREATE TRIGGER update_ai_config_updated_at
    BEFORE UPDATE ON "AIConfig"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 