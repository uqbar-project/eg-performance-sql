-- Optimizaciones de performance para análisis de JOINs

-- Estadísticas actualizadas para mejor planeamiento de queries
ANALYZE clientes;
ANALYZE pedidos;

-- Configuración de work_mem para operaciones de JOIN
SET work_mem = '256MB';

-- Crear índices adicionales para diferentes escenarios de JOIN
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_fecha 
ON pedidos(cliente_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre 
ON clientes(nombre);

-- Vista materializada para consultas frecuentes
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cliente_estadisticas AS
SELECT 
    c.id,
    c.nombre,
    c.email,
    COUNT(p.id) as total_pedidos,
    COALESCE(SUM(p.monto_total), 0) as monto_acumulado,
    AVG(p.monto_total) as monto_promedio,
    MAX(p.fecha) as ultimo_pedido
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
GROUP BY c.id, c.nombre, c.email;

-- Índice para la vista materializada
CREATE INDEX IF NOT EXISTS idx_mv_cliente_estadisticas_id 
ON mv_cliente_estadisticas(id);
