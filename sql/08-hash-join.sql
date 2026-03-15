-- FORZAR HASH JOIN
-- Queries para forzar Hash Join con vehículos
-- Hash Join es óptimo para datasets grandes sin orden específico

-- Configuración para forzar Hash Join
SET enable_mergejoin = off;
SET enable_nestloop = off;
SET enable_hashjoin = on;
SET work_mem = '256MB';

-- Query 1: Hash Join para agregación grande por chofer
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.chofer_designado,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    COUNT(a.vehiculo_id) as total_autos
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
WHERE v.desgaste > 50
  AND v.kilometraje > 10000
GROUP BY v.chofer_designado
HAVING COUNT(*) > 5
ORDER BY total_vehiculos DESC
LIMIT 1000;

-- Query 2: Hash Join para análisis por tipo de vehículo
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    MIN(v.fecha_patentamiento) as patentamiento_mas_antiguo,
    MAX(v.fecha_patentamiento) as patentamiento_mas_reciente
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2018-01-01'
GROUP BY tipo_vehiculo
ORDER BY total_vehiculos DESC;

-- Query 3: Hash Join para análisis de cilindrada de motos
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    m.cilindrada,
    COUNT(*) as total_motos,
    COUNT(CASE WHEN m.seguro_terceros = true THEN 1 END) as con_seguro,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio
FROM vehiculos v
INNER JOIN motos m ON v.id = m.vehiculo_id
WHERE v.kilometraje BETWEEN 20000 AND 150000
GROUP BY m.cilindrada
HAVING COUNT(*) > 100
ORDER BY cilindrada;

-- Query 4: Hash Join complejo con múltiples agregaciones
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    EXTRACT(YEAR FROM v.fecha_patentamiento) as anio,
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    COUNT(CASE WHEN v.desgaste > 80 THEN 1 END) as alto_desgaste,
    COUNT(CASE WHEN v.kilometraje > 200000 THEN 1 END) as alto_kilometraje
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2015-01-01'
  AND v.fecha_patentamiento <= '2023-12-31'
GROUP BY anio, tipo_vehiculo
ORDER BY anio, total_vehiculos DESC
LIMIT 100;

-- Query 5: Hash Join para análisis de camiones por capacidad
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.cubiertas_auxilio,
    c.limite_km_diario,
    COUNT(*) as total_camiones,
    AVG(v.desgaste) as desgaste_promedio,
    AVG(v.kilometraje) as kilometraje_promedio,
    COUNT(CASE WHEN v.desgaste > 70 THEN 1 END) as mantenimiento_urgente
FROM vehiculos v
INNER JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.kilometraje > 50000
GROUP BY c.cubiertas_auxilio, c.limite_km_diario
HAVING COUNT(*) > 50
ORDER BY total_camiones DESC
LIMIT 50;

-- Resetear configuración
SET enable_mergejoin = on;
SET enable_nestloop = on;
