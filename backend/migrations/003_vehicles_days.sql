CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_code text NOT NULL,
  bus_no text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (depot_code, bus_no)
);

CREATE TABLE IF NOT EXISTS kmpl_days (
  depot_code text NOT NULL,
  entry_date date NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (depot_code, entry_date)
);

INSERT INTO vehicles (depot_code, bus_no)
SELECT DISTINCT depot_code, bus_no FROM kmpl_entries
ON CONFLICT DO NOTHING;

INSERT INTO kmpl_days (depot_code, entry_date)
SELECT DISTINCT depot_code, entry_date FROM kmpl_entries
ON CONFLICT DO NOTHING;