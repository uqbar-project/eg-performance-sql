-- Optimizaciones de performance para análisis de JOINs de vehículos
-- ESTE SCRIPT AHORA ESTÁ VACÍO - LOS ÍNDICES SE CREAN EN 04-create-indexes-after-data.sql
-- Se mantiene por compatibilidad con docker-compose.yml

-- NOTA: Los índices se crean después de insertar datos para optimizar performance
-- Ejecutar: docker exec -it performance_sql psql -U postgres -d performance_db -f /docker-entrypoint-initdb.d/04-create-indexes-after-data.sql
