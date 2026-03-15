-- Creación de tablas para análisis de performance de vehículos
-- Este script se ejecuta automáticamente al iniciar el contenedor
-- NOTA: Índices se crean después de insertar datos para optimizar performance

-- Tabla principal de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    patente VARCHAR(10) UNIQUE NOT NULL,
    fecha_patentamiento DATE NOT NULL,
    chofer_designado VARCHAR(100) NOT NULL,
    desgaste INTEGER CHECK (desgaste >= 0 AND desgaste <= 100),
    kilometraje INTEGER NOT NULL
);

-- Tabla de Autos (relación 1:1 con vehículos)
CREATE TABLE IF NOT EXISTS autos (
    vehiculo_id INTEGER PRIMARY KEY REFERENCES vehiculos(id) ON DELETE CASCADE,
    vencimiento_matafuego DATE NOT NULL
);

-- Tabla de Motos (relación 1:1 con vehículos)
CREATE TABLE IF NOT EXISTS motos (
    vehiculo_id INTEGER PRIMARY KEY REFERENCES vehiculos(id) ON DELETE CASCADE,
    cilindrada INTEGER NOT NULL,
    seguro_terceros BOOLEAN NOT NULL
);

-- Tabla de Camiones (relación 1:1 con vehículos)
CREATE TABLE IF NOT EXISTS camiones (
    vehiculo_id INTEGER PRIMARY KEY REFERENCES vehiculos(id) ON DELETE CASCADE,
    cubiertas_auxilio INTEGER NOT NULL,
    limite_km_diario INTEGER NOT NULL
);

-- Índices básicos (solo PKs creados arriba)
-- Los índices de performance se crearán en 03-create-indexes-after-data.sql
