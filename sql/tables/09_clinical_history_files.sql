-- Archivos adjuntos (imágenes, PDFs) de una historia clínica
CREATE TABLE IF NOT EXISTS clinical_history_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_history_id UUID NOT NULL REFERENCES clinical_histories(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,   -- nombre guardado en disco
  original_name TEXT NOT NULL,   -- nombre original subido
  mime_type     TEXT NOT NULL,
  size          INTEGER NOT NULL,
  url           TEXT NOT NULL,   -- ruta pública relativa, ej /uploads/clinical-histories/<id>/<file>
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_history_files_history
  ON clinical_history_files(clinical_history_id);
