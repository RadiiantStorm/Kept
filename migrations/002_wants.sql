-- Things you haven't bought yet. Same shape as `items`, minus the clock:
-- a want has no purchase date, so it has no cost-per-month, only a projection.
CREATE TABLE wants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  priced_on   TEXT NOT NULL,
  url         TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX idx_wants_priced_on ON wants (priced_on);
