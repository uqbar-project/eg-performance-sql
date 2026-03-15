# 🚀 PostgreSQL JOIN Performance Analysis

Proyecto para analizar y comparar la performance de diferentes tipos de JOINs en PostgreSQL con datasets grandes.

## 📊 Objetivo

Comparar la performance entre tres tipos de JOINs:
- **Merge Join**: Óptimo para datos ordenados
- **Nested Loop Join**: Óptimo para datasets pequeños con filtros selectivos  
- **Hash Join**: Óptimo para datasets grandes sin orden

## 🛠️ Stack Tecnológico

- **Node.js 22 LTS** con TypeScript
- **PostgreSQL 18** en Docker
- **pnpm** como gestor de paquetes
- **ESLint** con flat config
- **tsx** para ejecución rápida de TypeScript

## 🏗️ Estructura del Proyecto

```
eg-performance-sql/
├── src/
│   └── index.ts                 # Conexión de prueba
├── scripts/
│   ├── insert-data.ts           # Inserción 2M clientes + 10M pedidos
│   ├── insert-data-small.ts     # Inserción 10K clientes + 50K pedidos
│   └── performance-analyzer.ts # Análisis comparativo de JOINs
├── sql/
│   ├── 01-create-tables.sql           # Creación de tablas
│   ├── 02-constraints.sql             # FKs y constraints
│   ├── 03-performance-optimizations.sql # Índices y vistas
│   ├── 04-reset-data.sql             # Limpieza de datos
│   ├── 05-merge-join.sql             # Queries para Merge Join
│   ├── 06-nested-loop-join.sql       # Queries para Nested Loop Join
│   ├── 07-hash-join.sql              # Queries para Hash Join
│   ├── 08-comparison-queries.sql      # Comparación directa
│   └── 09-performance-report.sql      # Reporte general
├── docker-compose.yml                 # Configuración Docker
├── package.json                      # Dependencias y scripts
├── tsconfig.json                     # Configuración TypeScript
├── eslint.config.js                  # ESLint flat config
└── .nvmrc                          # Versión Node.js
```

## 🚀 Configuración Inicial

### 1. Requisitos

```bash
# Node.js 22 LTS
nvm use lts/jod

# pnpm
npm install -g pnpm

# Docker y Docker Compose
docker --version
docker-compose --version
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Levantar Base de Datos

```bash
# Iniciar PostgreSQL y pgAdmin
docker-compose up -d

# Verificar que esté corriendo
docker-compose ps
```

Accesos:
- **PostgreSQL**: `localhost:5432`
  - Usuario: `postgres`
  - Password: `postgres`
  - Base: `performance_db`
- **pgAdmin**: `http://localhost:5051`
  - Email: `admin@phm.edu.ar`
  - Password: `admin`

## 📥 Inserción de Datos

### Para Testing (10K clientes + 50K pedidos)

```bash
pnpm run insert-data-small
```

### Para Producción (2M clientes + 10M pedidos)

```bash
pnpm run insert-data
```

⚠️ **Nota**: La inserción completa puede tardar 15-30 minutos

## 🔍 Análisis de Performance

### 1. Ejecutar Análisis Automatizado

```bash
pnpm run performance-analysis
```

Este script ejecuta diferentes tipos de JOINs y genera un reporte comparativo con:
- Tiempos de ejecución
- Uso de buffers
- Tipo de JOIN utilizado
- Recomendación del mejor tipo

### 2. Ejecutar Queries Manuales

Conéctate a PostgreSQL y ejecuta los scripts SQL:

```bash
# Con psql
psql -h localhost -p 5432 -U postgres -d performance_db

# O usar pgAdmin en http://localhost:5051
```

#### Forzar Merge Join
```sql
\i sql/05-merge-join.sql
```

#### Forzar Nested Loop Join  
```sql
\i sql/06-nested-loop-join.sql
```

#### Forzar Hash Join
```sql
\i sql/07-hash-join.sql
```

#### Comparación Directa
```sql
\i sql/08-comparison-queries.sql
```

### 3. Reporte General de Performance

```sql
\i sql/09-performance-report.sql
```

## 📈 Métricas Analizadas

### Tiempos
- **Execution Time**: Tiempo total de ejecución
- **Planning Time**: Tiempo de planificación
- **Total Cost**: Costo estimado por PostgreSQL

### Recursos
- **Buffers Hit/Read**: Uso de memoria caché
- **Temp Blocks**: Uso de disco temporal
- **Actual Rows**: Filas procesadas realmente

### JOIN Types
- **Merge Join**: Requiere datos ordenados
- **Nested Loop**: Iteración externa-interna
- **Hash Join**: Tabla hash en memoria

## 🧹 Limpieza y Reset

Para limpiar todos los datos y empezar de nuevo:

### Opción 1: Usar script de reset (recomendado)
```bash
docker exec -it performance_sql psql -U postgres -d performance_db -f /docker-entrypoint-initdb.d/04-reset-data.sql
```

### Opción 2: Manual directo
```bash
docker exec -it performance_sql psql -U postgres -d performance_db -c "TRUNCATE TABLE pedidos RESTART IDENTITY CASCADE; TRUNCATE TABLE clientes RESTART IDENTITY CASCADE;"
```

### Opción 3: Reiniciar completamente
```bash
docker-compose down -v
docker-compose up -d
pnpm run insert-data-small
```

**Nota**: Después de resetear, necesitas recrear la vista materializada:
```bash
docker exec -it performance_sql psql -U postgres -d performance_db -f /docker-entrypoint-initdb.d/03-performance-optimizations.sql
```

## 🔧 Configuración de PostgreSQL

Los scripts ajustan automáticamente:

```sql
-- Para forzar tipos específicos de JOIN
SET enable_hashjoin = off
SET enable_mergejoin = off  
SET enable_nestloop = off

-- Configuración de memoria
SET work_mem = '256MB'
SET hash_mem_multiplier = 2.0
```

## 📊 Resultados Esperados

### Merge Join
- **Mejor para**: Datos ordenados, datasets grandes
- **Ventaja**: Una sola pasada sobre los datos
- **Desventaja**: Requiere ordenamiento previo

### Nested Loop Join
- **Mejor para**: Filtros muy selectivos, datasets pequeños
- **Ventaja**: No requiere memoria adicional
- **Desventaja**: Complejidad O(n*m)

### Hash Join
- **Mejor para**: Datasets grandes sin orden
- **Ventaja**: Rápido para igualdades
- **Desventaja**: Uso intensivo de memoria

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión**: Verificar que Docker esté corriendo
2. **Sin datos**: Ejecutar scripts de inserción primero
3. **Performance lenta**: Aumentar `work_mem` en PostgreSQL
4. **Errores TypeScript**: Ejecutar `pnpm install` y `pnpm run lint:fix`

### Logs de Docker

```bash
# Ver logs de PostgreSQL
docker-compose logs db

# Ver logs de pgAdmin
docker-compose logs pgadmin
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm run start` | Conexión de prueba a PostgreSQL |
| `pnpm run insert-data-small` | Insertar datos de prueba |
| `pnpm run insert-data` | Insertar dataset completo |
| `pnpm run performance-analysis` | Ejecutar análisis completo |
| `pnpm run lint` | Verificar código TypeScript |
| `pnpm run lint:fix` | Corregir automáticamente |

## 🤝 Contribuciones

1. Fork del proyecto
2. Crear feature branch
3. Realizar cambios
4. Ejecutar tests de performance
5. Pull request

## 📄 Licencia

MIT License - Ver archivo LICENSE

---

**🎯 Objetivo Final**: Entender cuándo usar cada tipo de JOIN para optimizar consultas en PostgreSQL con grandes volúmenes de datos.
