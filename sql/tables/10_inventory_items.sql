-- Inventario: catálogo de insumos manejados por la clínica
CREATE TABLE IF NOT EXISTS inventory_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT,
  unit          TEXT NOT NULL DEFAULT 'unidad',  -- unidad, caja, ml, g, par, etc.
  sku           TEXT,
  current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_stock     NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_name     ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);

-- Trigger trg_inventory_items_updated_at en sql/triggers/01_updated_at.sql
