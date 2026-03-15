-- REPORTE DE PERFORMANCE GENERAL
-- Análisis completo del estado actual de la base de datos

-- 1. Estadísticas generales de las tablas
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename

-- 2. Uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read as index_reads,
    idx_tup_fetch as index_fetches,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname

-- 3. Tamaño de tablas e índices
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC

-- 4. Queries más lentas (si pg_stat_statements está habilitado)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- 
-- SELECT 
--     query,
--     calls,
--     total_exec_time,
--     mean_exec_time,
--     rows,
--     100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10

-- 5. Configuración actual relevante para JOINs
SELECT name, setting, unit, short_desc
FROM pg_settings
WHERE name IN (
    'work_mem',
    'shared_buffers',
    'effective_cache_size',
    'random_page_cost',
    'seq_page_cost',
    'enable_hashjoin',
    'enable_mergejoin',
    'enable_nestloop',
    'hash_mem_multiplier'
)
ORDER BY name

-- 6. Análisis de distribución de datos
SELECT 
    'clientes' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(DISTINCT LEFT(email, POSITION('@' IN email) - 1)) as dominios_unicos
FROM clientes

UNION ALL

SELECT 
    'pedidos' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(DISTINCT cliente_id) as clientes_unicos
FROM pedidos

-- 7. Estadísticas de uso de memoria
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = current_database()
