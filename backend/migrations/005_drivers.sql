CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_code text NOT NULL,
  name text NOT NULL,
  pf_number text NOT NULL DEFAULT '',
  depot_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS drivers_unique_name ON drivers (depot_code, lower(name));