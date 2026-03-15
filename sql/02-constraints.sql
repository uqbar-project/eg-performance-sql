-- Constraints adicionales para las tablas

-- FK con CASCADE para integridad referencial
ALTER TABLE pedidos 
DROP CONSTRAINT IF EXISTS pedidos_cliente_id_fkey,
ADD CONSTRAINT pedidos_cliente_id_fkey 
FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- Check constraints para validación de datos
ALTER TABLE clientes 
ADD CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE pedidos 
ADD CONSTRAINT chk_monto_positivo CHECK (monto_total > 0),
ADD CONSTRAINT chk_fecha_valida CHECK (fecha <= CURRENT_TIMESTAMP);
