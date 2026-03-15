-- Script para limpiar datos y resetear tablas

-- Deshabilitar constraints temporalmente
SET session_replication_role = replica;

-- Limpiar tablas en orden correcto (respetando FKs)
TRUNCATE TABLE pedidos RESTART IDENTITY CASCADE;
TRUNCATE TABLE clientes RESTART IDENTITY CASCADE;

-- Rehabilitar constraints
SET session_replication_role = DEFAULT;

-- Resetear secuencias
ALTER SEQUENCE clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE pedidos_id_seq RESTART WITH 1;

-- Limpiar vista materializada
DROP MATERIALIZED VIEW IF EXISTS mv_cliente_estadisticas;

-- Confirmar cambios
COMMIT;

-- Mostrar estado actual
SELECT 
    'clientes' as tabla, 
    COUNT(*) as registros 
FROM clientes
UNION ALL
SELECT 
    'pedidos' as tabla, 
    COUNT(*) as registros 
FROM pedidos;
