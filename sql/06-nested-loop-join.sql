-- FORZAR NESTED LOOP JOIN
-- El Nested Loop Join funciona mejor con datasets pequeños o cuando hay filtros muy selectivos

-- Configuración para favorecer Nested Loop Join
SET enable_hashjoin = off
SET enable_mergejoin = off
SET work_mem = '64MB'

-- Query que fuerza Nested Loop Join
-- Usamos filtros selectivos en la tabla externa
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
WHERE c.id = 12345  -- Filtro muy selectivo
  AND p.fecha >= '2023-01-01'
ORDER BY p.fecha DESC
LIMIT 100

-- Alternativa: Nested Loop con índice compuesto
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
WHERE c.nombre LIKE 'Juan%'  -- Búsqueda por nombre (usa índice idx_clientes_nombre)
  AND p.monto_total > 1000
ORDER BY p.monto_total DESC
LIMIT 50

-- Nested Loop anti-join (clientes sin pedidos)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    c.id,
    c.nombre,
    c.email
FROM clientes c
WHERE NOT EXISTS (
    SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id
)
LIMIT 100
