-- COMPARACIÓN DE TIPOS DE JOIN - MISMA QUERY, DIFERENTES ESTRATEGIAS

-- Query base para comparación
-- Obtenemos clientes con sus pedidos más recientes

-- 1. Dejar que PostgreSQL elija el mejor plan
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email,
    p.id as pedido_id,
    p.fecha,
    p.monto_total
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id BETWEEN 50000 AND 150000
  AND p.fecha >= '2023-01-01'
ORDER BY c.id, p.fecha DESC
LIMIT 1000

-- 2. Forzar Merge Join
SET enable_hashjoin = off
SET enable_nestloop = off
SET enable_mergejoin = on

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email,
    p.id as pedido_id,
    p.fecha,
    p.monto_total
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id BETWEEN 50000 AND 150000
  AND p.fecha >= '2023-01-01'
ORDER BY c.id, p.fecha DESC
LIMIT 1000

-- 3. Forzar Nested Loop Join
SET enable_hashjoin = off
SET enable_mergejoin = off
SET enable_nestloop = on

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email,
    p.id as pedido_id,
    p.fecha,
    p.monto_total
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id BETWEEN 50000 AND 150000
  AND p.fecha >= '2023-01-01'
ORDER BY c.id, p.fecha DESC
LIMIT 1000

-- 4. Forzar Hash Join
SET enable_mergejoin = off
SET enable_nestloop = off
SET enable_hashjoin = on

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email,
    p.id as pedido_id,
    p.fecha,
    p.monto_total
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id BETWEEN 50000 AND 150000
  AND p.fecha >= '2023-01-01'
ORDER BY c.id, p.fecha DESC
LIMIT 1000

-- Resetear configuración
SET enable_hashjoin = on
SET enable_mergejoin = on
SET enable_nestloop = on
