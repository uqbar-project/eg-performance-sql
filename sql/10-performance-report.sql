-- REPORTE GENERAL DE PERFORMANCE PARA VEHÍCULOS
-- Queries para análisis completo de performance de la base de datos

-- 1. Estadísticas generales de tablas
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Estadísticas de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Tamaños de tablas e índices
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. Distribución de tipos de vehículos
SELECT 
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
GROUP BY tipo_vehiculo
ORDER BY total DESC;

-- 5. Análisis de desgaste por tipo de vehículo
SELECT 
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    ROUND(AVG(v.desgaste), 2) as desgaste_promedio,
    ROUND(STDDEV(v.desgaste), 2) as desgaste_desviacion,
    MIN(v.desgaste) as desgaste_minimo,
    MAX(v.desgaste) as desgaste_maximo,
    COUNT(CASE WHEN v.desgaste > 80 THEN 1 END) as mantenimiento_urgente
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
GROUP BY tipo_vehiculo
ORDER BY total_vehiculos DESC;

-- 6. Análisis de kilometraje por tipo de vehículo
SELECT 
    CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
    END as tipo_vehiculo,
    COUNT(*) as total_vehiculos,
    ROUND(AVG(v.kilometraje), 2) as kilometraje_promedio,
    ROUND(STDDEV(v.kilometraje), 2) as kilometraje_desviacion,
    MIN(v.kilometraje) as kilometraje_minimo,
    MAX(v.kilometraje) as kilometraje_maximo,
    COUNT(CASE WHEN v.kilometraje > 200000 THEN 1 END) as alto_kilometraje
FROM vehiculos v
LEFT JOIN autos a ON v.id = a.vehiculo_id
LEFT JOIN motos m ON v.id = m.vehiculo_id
LEFT JOIN camiones c ON v.id = c.vehiculo_id
GROUP BY tipo_vehiculo
ORDER BY kilometraje_promedio DESC;

-- 7. Top 10 choferes con más vehículos
SELECT 
    v.chofer_designado,
    COUNT(*) as total_vehiculos,
    ROUND(AVG(v.desgaste), 2) as desgaste_promedio,
    ROUND(AVG(v.kilometraje), 2) as kilometraje_promedio,
    COUNT(CASE WHEN v.desgaste > 80 THEN 1 END) as mantenimiento_urgente
FROM vehiculos v
GROUP BY v.chofer_designado
HAVING COUNT(*) > 1
ORDER BY total_vehiculos DESC
LIMIT 10;

-- 8. Análisis de patentamiento por año
SELECT 
    EXTRACT(YEAR FROM v.fecha_patentamiento) as anio,
    COUNT(*) as total_vehiculos,
    ROUND(AVG(v.desgaste), 2) as desgaste_promedio,
    ROUND(AVG(v.kilometraje), 2) as kilometraje_promedio
FROM vehiculos v
WHERE v.fecha_patentamiento >= '2015-01-01'
GROUP BY EXTRACT(YEAR FROM v.fecha_patentamiento)
ORDER BY anio DESC;

-- 9. Análisis específico de motos por cilindrada
SELECT 
    m.cilindrada,
    COUNT(*) as total_motos,
    COUNT(CASE WHEN m.seguro_terceros = true THEN 1 END) as con_seguro,
    ROUND(COUNT(CASE WHEN m.seguro_terceros = true THEN 1 END) * 100.0 / COUNT(*), 2) as porcentaje_con_seguro,
    ROUND(AVG(v.desgaste), 2) as desgaste_promedio,
    ROUND(AVG(v.kilometraje), 2) as kilometraje_promedio
FROM vehiculos v
INNER JOIN motos m ON v.id = m.vehiculo_id
GROUP BY m.cilindrada
ORDER BY total_motos DESC
LIMIT 10;

-- 10. Análisis específico de camiones por capacidad
SELECT 
    c.cubiertas_auxilio,
    c.limite_km_diario,
    COUNT(*) as total_camiones,
    ROUND(AVG(v.desgaste), 2) as desgaste_promedio,
    ROUND(AVG(v.kilometraje), 2) as kilometraje_promedio,
    COUNT(CASE WHEN v.desgaste > 70 THEN 1 END) as mantenimiento_urgente
FROM vehiculos v
INNER JOIN camiones c ON v.id = c.vehiculo_id
GROUP BY c.cubiertas_auxilio, c.limite_km_diario
ORDER BY total_camiones DESC
LIMIT 10;

-- 11. Configuración actual de PostgreSQL
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'work_mem',
    'maintenance_work_mem',
    'effective_cache_size',
    'random_page_cost',
    'cpu_tuple_cost',
    'cpu_operator_cost',
    'enable_hashjoin',
    'enable_mergejoin',
    'enable_nestloop',
    'seq_page_cost'
)
ORDER BY name;

-- 12. Queries más lentas (si hay estadísticas disponibles)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query LIKE '%vehiculos%'
ORDER BY mean_time DESC
LIMIT 10;

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
