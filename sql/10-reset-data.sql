-- Script para limpiar datos y resetear tablas de vehículos

-- Deshabilitar constraints temporalmente
SET session_replication_role = replica;

-- Limpiar tablas en orden correcto (respetando FKs)
TRUNCATE TABLE camiones RESTART IDENTITY CASCADE;
TRUNCATE TABLE motos RESTART IDENTITY CASCADE;
TRUNCATE TABLE autos RESTART IDENTITY CASCADE;
TRUNCATE TABLE vehiculos RESTART IDENTITY CASCADE;

-- Rehabilitar constraints
SET session_replication_role = DEFAULT;

-- Resetear secuencias
ALTER SEQUENCE vehiculos_id_seq RESTART WITH 1;

-- Limpiar vista materializada
DROP MATERIALIZED VIEW IF EXISTS mv_vehiculos_estadisticas;

-- Confirmar cambios
COMMIT;

-- Mostrar estado actual
SELECT 
    'vehiculos' as tabla, 
    COUNT(*) as registros 
FROM vehiculos
UNION ALL
SELECT 
    'autos' as tabla, 
    COUNT(*) as registros 
FROM autos
UNION ALL
SELECT 
    'motos' as tabla, 
    COUNT(*) as registros 
FROM motos
UNION ALL
SELECT 
    'camiones' as tabla, 
    COUNT(*) as registros 
FROM camiones;
