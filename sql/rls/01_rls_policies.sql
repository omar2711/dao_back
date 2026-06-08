-- Row Level Security policies
-- These apply when connecting with a role other than the table owner.
-- For the NestJS backend connecting as neondb_owner, RLS is bypassed by default.
-- Enable these if you add a restricted application role.

-- Enable RLS on all tables
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;

-- Allow full access to the owner role (the NestJS backend connection)
CREATE POLICY users_owner_all        ON users        FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY doctors_owner_all      ON doctors      FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY patients_owner_all     ON patients     FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY appointments_owner_all ON appointments FOR ALL TO neondb_owner USING (true) WITH CHECK (true);

-- Example: restrict a read-only reporting role (uncomment if needed)
-- CREATE ROLE dao_dent_readonly;
-- CREATE POLICY patients_readonly ON patients FOR SELECT TO dao_dent_readonly USING (true);
-- CREATE POLICY appointments_readonly ON appointments FOR SELECT TO dao_dent_readonly USING (true);
