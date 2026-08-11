CREATE TABLE items (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  price_cents  INTEGER NOT NULL CHECK (price_cents > 0),
  purchased_on TEXT NOT NULL,
  ended_on     TEXT,
  url          TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX idx_items_purchased_on ON items (purchased_on);
