CREATE TABLE IF NOT EXISTS kmpl_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_code text NOT NULL,
  entry_date date NOT NULL,
  sl_no int NOT NULL,
  bus_no text NOT NULL,
  route_no text NOT NULL DEFAULT '',
  driver1 text NOT NULL DEFAULT '',
  driver2 text NOT NULL DEFAULT '',
  logsheet_no text NOT NULL DEFAULT '',
  km_operated numeric(10,2),
  hsd numeric(10,2),
  thump_status smallint CHECK (thump_status BETWEEN 1 AND 3),
  defects text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (depot_code, entry_date, sl_no)
);
CREATE INDEX IF NOT EXISTS kmpl_depot_date ON kmpl_entries (depot_code, entry_date);