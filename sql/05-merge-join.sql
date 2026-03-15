-- FORZAR MERGE JOIN
-- El Merge Join funciona mejor con datos ordenados y cuando ambos datasets son grandes

-- Configuración para favorecer Merge Join
SET enable_hashjoin = off
SET enable_nestloop = off
SET work_mem = '256MB'

-- Query que fuerza Merge Join
-- Usamos ORDER BY para asegurar que los datos estén ordenados
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
WHERE c.id BETWEEN 1 AND 100000
ORDER BY c.id, p.fecha
LIMIT 1000

-- Alternativa: Merge Join con datos ordenados previamente
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
WITH clientes_ordenados AS (
    SELECT * FROM clientes ORDER BY id
),
pedidos_ordenados AS (
    SELECT * FROM pedidos ORDER BY cliente_id
)
SELECT 
    c.id,
    c.nombre,
    c.email,
    p.id as pedido_id,
    p.fecha,
    p.monto_total
FROM clientes_ordenados c
INNER JOIN pedidos_ordenados p ON c.id = p.cliente_id
WHERE c.id BETWEEN 1 AND 100000
LIMIT 1000
