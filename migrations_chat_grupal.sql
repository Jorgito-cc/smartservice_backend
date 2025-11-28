-- ============================================
-- MIGRACIONES PARA CHAT GRUPAL
-- ============================================
-- Ejecutar estas migraciones en PostgreSQL
-- para habilitar el chat grupal con ofertas

-- 1. Agregar precio_ofrecido y fotos a solicitud_servicio
ALTER TABLE solicitud_servicio 
ADD COLUMN IF NOT EXISTS precio_ofrecido DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS fotos JSON NULL;

-- 2. Modificar chat_mensaje para soportar chat grupal
ALTER TABLE chat_mensaje 
ADD COLUMN IF NOT EXISTS id_solicitud INTEGER NULL,
ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS es_oferta BOOLEAN DEFAULT FALSE;

-- 3. Agregar foreign key para id_solicitud
ALTER TABLE chat_mensaje 
ADD CONSTRAINT IF NOT EXISTS fk_chat_solicitud 
FOREIGN KEY (id_solicitud) REFERENCES solicitud_servicio(id_solicitud) 
ON DELETE CASCADE;

-- 4. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_chat_solicitud ON chat_mensaje(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_chat_es_oferta ON chat_mensaje(es_oferta);

-- 5. Hacer id_servicio nullable (ya que ahora puede ser null en chat grupal)
-- Nota: Si ya existe, puede que necesites hacer esto manualmente
-- ALTER TABLE chat_mensaje ALTER COLUMN id_servicio DROP NOT NULL;

-- Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitud_servicio' 
    AND column_name IN ('precio_ofrecido', 'fotos');

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_mensaje' 
    AND column_name IN ('id_solicitud', 'precio', 'es_oferta');

