-- COMPARACIÓN DIRECTA DE TIPOS DE JOIN
-- Mismo query con diferentes estrategias de JOIN forzadas

-- Query base: Análisis de vehículos por chofer y tipo
-- Esta query se ejecutará con diferentes configuraciones de JOIN

-- Configuración 1: Solo Merge Join
SET enable_hashjoin = off;
SET enable_nestloop = off;
SET enable_mergejoin = on;
SET work_mem = '256MB';

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.chofer_designado,
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    MIN(v.fecha_patentamiento) as patentamiento_mas_antiguo
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2020-01-01'
  AND v.desgaste BETWEEN 30 AND 80
GROUP BY v.chofer_designado, tipo_vehiculo
HAVING COUNT(*) > 3
ORDER BY total_vehiculos DESC, tipo_vehiculo
LIMIT 500;

-- Configuración 2: Solo Nested Loop Join
SET enable_hashjoin = off;
SET enable_mergejoin = off;
SET enable_nestloop = on;
SET work_mem = '256MB';

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.chofer_designado,
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    MIN(v.fecha_patentamiento) as patentamiento_mas_antiguo
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2020-01-01'
  AND v.desgaste BETWEEN 30 AND 80
GROUP BY v.chofer_designado, tipo_vehiculo
HAVING COUNT(*) > 3
ORDER BY total_vehiculos DESC, tipo_vehiculo
LIMIT 500;

-- Configuración 3: Solo Hash Join
SET enable_mergejoin = off;
SET enable_nestloop = off;
SET enable_hashjoin = on;
SET work_mem = '256MB';

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.chofer_designado,
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    MIN(v.fecha_patentamiento) as patentamiento_mas_antiguo
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2020-01-01'
  AND v.desgaste BETWEEN 30 AND 80
GROUP BY v.chofer_designado, tipo_vehiculo
HAVING COUNT(*) > 3
ORDER BY total_vehiculos DESC, tipo_vehiculo
LIMIT 500;

-- Configuración 4: PostgreSQL Auto (dejamos que elija)
SET enable_hashjoin = on;
SET enable_mergejoin = on;
SET enable_nestloop = on;
SET work_mem = '256MB';

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.chofer_designado,
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    MIN(v.fecha_patentamiento) as patentamiento_mas_antiguo
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2020-01-01'
  AND v.desgaste BETWEEN 30 AND 80
GROUP BY v.chofer_designado, tipo_vehiculo
HAVING COUNT(*) > 3
ORDER BY total_vehiculos DESC, tipo_vehiculo
LIMIT 500;

-- Resetear configuración
SET enable_hashjoin = on
SET enable_mergejoin = on
SET enable_nestloop = on
