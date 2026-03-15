-- FORZAR NESTED LOOP JOIN
-- Queries para forzar Nested Loop Join con vehículos
-- Nested Loop Join es óptimo para datasets pequeños con filtros selectivos

-- Configuración para forzar Nested Loop Join
SET enable_hashjoin = off;
SET enable_mergejoin = off;
SET enable_nestloop = on;
SET work_mem = '256MB';

-- Query 1: Nested Loop Join con búsqueda selectiva por patente
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
WHERE v.patente = 'ABC123'
  AND v.desgaste > 75;

-- Query 2: Nested Loop Join con filtro por chofer específico
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.id,
    v.patente,
    v.chofer_designado,
    v.kilometraje,
    m.cilindrada,
    m.seguro_terceros
FROM vehiculos v
INNER JOIN motos m ON v.id = m.vehiculo_id
WHERE v.chofer_designado = 'John Smith'
  AND v.kilometraje < 10000
  AND m.seguro_terceros = true;

-- Query 3: Nested Loop Join con rango de IDs pequeño
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.id,
    v.patente,
    v.fecha_patentamiento,
    v.chofer_designado,
    v.desgaste,
    c.cubiertas_auxilio,
    c.limite_km_diario
FROM vehiculos v
INNER JOIN camiones c ON v.id = c.vehiculo_id
WHERE v.id BETWEEN 1000 AND 2000
  AND c.cubiertas_auxilio > 3
  AND v.kilometraje > 100000;

-- Query 4: Nested Loop Join con múltiples condiciones selectivas
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
WHERE v.chofer_designado LIKE '%Smith%'
  AND v.desgaste BETWEEN 80 AND 100
  AND v.kilometraje < 50000
LIMIT 100;

-- Query 5: Nested Loop Join con búsqueda por patente con LIKE
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    v.id,
    v.patente,
    v.chofer_designado,
    v.fecha_patentamiento,
    v.desgaste,
    v.kilometraje,
    a.vencimiento_matafuego
FROM vehiculos v
INNER JOIN autos a ON v.id = a.vehiculo_id
WHERE v.patente LIKE 'AB%'
  AND v.fecha_patentamiento > '2022-01-01'
  AND a.vencimiento_matafuego < '2025-12-31'
LIMIT 50;

-- Resetear configuración
SET enable_hashjoin = on;
SET enable_mergejoin = on;
