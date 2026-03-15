-- FORZAR MERGE JOIN
-- Queries para forzar Merge Join con vehículos
-- Merge Join es óptimo para datos ordenados y grandes datasets

-- Configuración para forzar Merge Join
SET enable_hashjoin = off;
SET enable_nestloop = off;
SET enable_mergejoin = on;
SET work_mem = '256MB';

-- Query 1: Merge Join entre vehículos y autos ordenados por fecha
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.id,
    v.patente,
    v.fecha_patentamiento,
    v.chofer_designado,
    v.desgaste,
    v.kilometraje,
    a.vencimiento_matafuego
FROM vehiculos v
INNER JOIN autos a ON v.id = a.vehiculo_id
WHERE v.fecha_patentamiento BETWEEN '2020-01-01' AND '2023-12-31'
  AND v.desgaste > 50
ORDER BY v.fecha_patentamento, a.vencimiento_matafuego
LIMIT 10000;

-- Query 2: Merge Join con vehículos y motos ordenados por kilometraje
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.id,
    v.patente,
    v.kilometraje,
    v.chofer_designado,
    m.cilindrada,
    m.seguro_terceros
FROM vehiculos v
INNER JOIN motos m ON v.id = m.vehiculo_id
WHERE v.kilometraje BETWEEN 50000 AND 200000
  AND m.cilindrada > 500
ORDER BY v.kilometraje DESC, m.cilindrada
LIMIT 8000;

-- Query 3: Merge Join complejo con múltiples tablas ordenadas
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.id,
    v.patente,
    v.fecha_patentamiento,
    v.chofer_designado,
    v.desgaste,
    v.kilometraje,
    COALESCE(a.vencimiento_matafuego, NULL) as vencimiento_matafuego,
    COALESCE(m.cilindrada, NULL) as cilindrada,
    COALESCE(c.cubiertas_auxilio, NULL) as cubiertas_auxilio
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id  
LEFT JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.fecha_patentamiento >= '2018-01-01'
  AND v.kilometraje <= 300000
ORDER BY v.fecha_patentamiento, v.kilometraje
LIMIT 15000;

-- Query 4: Merge Join para análisis de desgaste por fecha
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    EXTRACT(YEAR FROM v.fecha_patentamiento) as anio_patentamiento,
    AVG(v.desgaste) as desgaste_promedio,
    COUNT(*) as total_vehiculos,
    AVG(v.kilometraje) as kilometraje_promedio
FROM vehiculos v
INNER JOIN autos a ON v.id = a.vehiculo_id
WHERE v.fecha_patentamiento >= '2015-01-01'
GROUP BY EXTRACT(YEAR FROM v.fecha_patentamiento)
ORDER BY anio_patentamiento;

-- Resetear configuración
SET enable_hashjoin = on;
SET enable_nestloop = on;
