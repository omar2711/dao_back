-- Inventario: movimientos de stock (entradas, salidas/consumo, ajustes)
-- El consumo por tratamiento/doctor se registra como movimientos type='OUT'
-- con doctor_id / treatment_id / treatment_session_id poblados.
CREATE TABLE IF NOT EXISTS inventory_movements (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id              UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type                 VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST')),
  quantity             NUMERIC(12,2) NOT NULL,
  unit_cost            NUMERIC(10,2),
  reason               TEXT,
  doctor_id            UUID REFERENCES doctors(id) ON DELETE SET NULL,
  treatment_id         UUID REFERENCES treatments(id) ON DELETE SET NULL,
  treatment_session_id UUID REFERENCES treatment_sessions(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_item      ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_doctor    ON inventory_movements(doctor_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_treatment ON inventory_movements(treatment_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_type      ON inventory_movements(type);

-- Trigger trg_inventory_movements_updated_at en sql/triggers/01_updated_at.sql
