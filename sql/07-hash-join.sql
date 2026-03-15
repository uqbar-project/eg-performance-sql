-- FORZAR HASH JOIN
-- El Hash Join funciona mejor con datasets grandes donde no hay orden y no hay índices útiles

-- Configuración para favorecer Hash Join
SET enable_mergejoin = off
SET enable_nestloop = off
SET work_mem = '512MB'
SET hash_mem_multiplier = 2.0

-- Query que fuerza Hash Join
-- Join entre datasets grandes sin orden
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email,
    COUNT(p.id) as total_pedidos,
    AVG(p.monto_total) as promedio_monto,
    SUM(p.monto_total) as total_monto
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id BETWEEN 100000 AND 500000  -- Rango grande
  AND p.fecha >= '2022-01-01'
GROUP BY c.id, c.nombre, c.email
HAVING COUNT(p.id) > 5
ORDER BY total_monto DESC
LIMIT 1000

-- Hash Join con LEFT JOIN para incluir clientes sin pedidos
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email,
    COALESCE(COUNT(p.id), 0) as total_pedidos,
    COALESCE(SUM(p.monto_total), 0) as total_monto
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id BETWEEN 200000 AND 600000
GROUP BY c.id, c.nombre, c.email
ORDER BY total_pedidos DESC
LIMIT 1000

-- Hash Join semi-join (clientes que tienen pedidos caros)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email
FROM clientes c
WHERE EXISTS (
    SELECT 1 FROM pedidos p 
    WHERE p.cliente_id = c.id 
      AND p.monto_total > 3000
    LIMIT 1
)
ORDER BY c.id
LIMIT 500
