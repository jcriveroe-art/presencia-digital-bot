-- Actualizar tabla conversaciones con campos de seguimiento
ALTER TABLE conversaciones 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'nuevo',
ADD COLUMN IF NOT EXISTS nombre TEXT,
ADD COLUMN IF NOT EXISTS negocio TEXT,
ADD COLUMN IF NOT EXISTS fecha_ultimo_mensaje TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fecha_ultimo_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS seguimientos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS contador_seguimientos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS caliente BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Tabla de tareas para Juan Carlos
CREATE TABLE IF NOT EXISTS tareas (
  id SERIAL PRIMARY KEY,
  telefono TEXT NOT NULL,
  tipo TEXT NOT NULL,
  mensaje TEXT,
  fecha_programada DATE NOT NULL,
  completada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para el cron
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado ON conversaciones(estado);
CREATE INDEX IF NOT EXISTS idx_conversaciones_caliente ON conversaciones(caliente);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha ON tareas(fecha_programada, completada);
