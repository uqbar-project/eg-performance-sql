-- Creación de tablas para análisis de performance
-- Este script se ejecuta automáticamente al iniciar el contenedor

-- Tabla Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Tabla Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    monto_total DECIMAL(10,2) NOT NULL
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha);
