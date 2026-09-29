CREATE OR REPLACE FUNCTION assign_training_identifier()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(identifier), 0) + 1
  INTO NEW.identifier
  FROM training
  WHERE organization_id = NEW.organization_id
    AND EXTRACT(YEAR FROM start_date::date) = EXTRACT(YEAR FROM NEW.start_date::date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER training_before_insert_identifier
BEFORE INSERT ON training
FOR EACH ROW EXECUTE FUNCTION assign_training_identifier();
