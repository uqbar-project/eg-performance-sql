# � PostgreSQL Performance Analysis - Vehicle Database

Proyecto completo para análisis de performance de JOINs en PostgreSQL con un dataset masivo de vehículos.

## � Objetivo

Migrar desde una estructura simple de `clientes`/`pedidos` a una arquitectura compleja de vehículos con múltiples subtipos (autos, motos, camiones) para analizar diferentes estrategias de JOIN a escala con **10 millones de registros**.

## 🏗️ Estructura de Datos

### 📊 Schema Actual

```sql
vehiculos (5M registros)
├── id (PK)
├── patente (UNIQUE)
├── fecha_patentamiento
├── chofer_designado
├── desgaste (0-100)
└── kilometraje (0-500K)

autos (3M registros) - FK 1:1 con vehículos
├── vehiculo_id (PK/FK)
└── vencimiento_matafuego

motos (1M registros) - FK 1:1 con vehículos  
├── vehiculo_id (PK/FK)
├── cilindrada (50-2000cc)
└── seguro_terceros (boolean)

camiones (1M registros) - FK 1:1 con vehículos
├── vehiculo_id (PK/FK)
├── cubiertas_auxilio (1-6)
└── limite_km_diario (200-1000km)
```

### 🔄 Relaciones
- **1:1** entre `vehiculos` y cada tabla hija
- **CASCADE DELETE** para integridad referencial
- **Índices optimizados** para diferentes escenarios de JOIN

## 🛠️ Tech Stack

- **PostgreSQL 18** con configuración optimizada
- **TypeScript** para generación de datos y análisis
- **Docker** + **Docker Compose** para entorno reproducible
- **pgAdmin** para administración visual
- **Faker.js** para datos realistas

### 📡 Configuración de Puertos

| Servicio | Host | Container | Descripción |
|-----------|-------|------------|-------------|
| PostgreSQL | `5442` | `5432` | Base de datos principal |
| pgAdmin | `5055` | `80` | Interfaz web de administración |

### 🌐 URLs de Acceso

- **pgAdmin**: `http://localhost:5055`
- **PostgreSQL**: `localhost:5442`

## 📁 Estructura del Proyecto

```
eg-performance-sql/
├── sql/
│   ├── 01-create-tables.sql          # Creación de tablas (sin índices)
│   ├── 02-constraints.sql            # Constraints y validaciones
│   ├── 03-performance-optimizations.sql # Vacío (compatibilidad)
│   ├── 05-merge-join.sql             # Queries para Merge Join
│   ├── 06-nested-loop-join.sql       # Queries para Nested Loop Join
│   ├── 07-hash-join.sql              # Queries para Hash Join
│   ├── 08-comparison-queries.sql     # Comparación directa de JOINs
│   ├── 09-performance-report.sql     # Reporte general de performance
│   └── 10-reset-data.sql             # Limpieza de datos
├── scripts/
│   ├── vehicle-data-generator.ts     # Módulo compartido de generación
│   ├── insert-data.ts                # Dataset completo (10M registros)
│   ├── insert-data-small.ts          # Dataset de prueba (20K registros)
│   ├── performance-analyzer.ts       # Analizador automatizado
│   └── index-performance-comparator.ts # Comparador de índices
├── docker-compose.yml
├── Docker/init_db.sh
└── README.md
```

## 🚀 Setup Rápido

### 1. Iniciar Entorno Docker
```bash
docker-compose up -d
```

**📡 Puertos Configurados:**
- **PostgreSQL**: `localhost:5442` (host) → `5432` (container)
- **pgAdmin**: `http://localhost:5055` (host) → `80` (container)

### 2. Insertar Datos de Prueba (Opcional)
```bash
pnpm run insert-data-small  # 20K registros para testing rápido
```

### 3. Insertar Dataset Completo
```bash
pnpm run insert-data         # 10M registros (~2 minutos)
```

### 4. Ejecutar Análisis de Performance
```bash
pnpm run performance-analysis
```

### 5. Comparar Performance con/sin Índices (Opcional)
```bash
pnpm run index-comparison
```

## 📊 Scripts Disponibles

### 🔄 Inserción de Datos
- `pnpm run insert-data` - Dataset completo (5M vehículos + 5M subtipos)
- `pnpm run insert-data-small` - Dataset de prueba (10K vehículos + 10K subtipos)

### 🔍 Análisis de Performance  
- `pnpm run performance-analysis` - Análisis automatizado de JOINs
- `pnpm run index-comparison` - Comparación de performance con/sin índices

### 🧹 Limpieza
```bash
# Reset completo de datos
docker exec -it performance_sql psql -U postgres -d performance_db -f /docker-entrypoint-initdb.d/10-reset-data.sql
```

### � Conexión Directa a PostgreSQL

**Desde tu máquina local (host):**
```bash
# Usando psql
psql -h localhost -p 5442 -U postgres -d performance_db

# Usando Docker
docker exec -it performance_sql psql -U postgres -d performance_db
```

**Configuración para clientes SQL:**
- **Host**: `localhost`
- **Port**: `5442`
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `performance_db`

### � Comparación de Índices

El script `index-comparison` realiza un análisis completo del impacto de los índices:

**🔄 Flujo Automático:**
1. Ejecuta queries con índices (baseline)
2. Elimina todos los índices (15 índices + vista materializada)
3. Ejecuta queries sin índices
4. Recrea índices automáticamente
5. Genera reporte comparativo

**📈 Métricas Analizadas:**
- Tiempo de ejecución por query
- Porcentaje de mejora/deterioro
- Impacto en tipos de JOIN
- Uso de buffers

**🎯 Resultados Esperados:**
- **Nested Loop**: Mínimo impacto (búsquedas muy selectivas)
- **Merge Join**: Mejora significativa (datos ordenados)
- **Hash Join**: Impacto moderado (agregaciones grandes)

## 📈 Análisis de JOINs

### 🔗 Tipos de JOIN Analizados

1. **Merge Join** - Óptimo para datos ordenados
   - Queries con ORDER BY en fechas/kilometraje
   - Rangos amplios de datos

2. **Nested Loop Join** - Óptimo para búsquedas selectivas
   - Búsquedas por patente exacta
   - Filtros específicos por chofer

3. **Hash Join** - Óptimo para agregaciones grandes
   - GROUP BY con múltiples filas
   - Análisis estadístico

### 📊 Resultados de Performance

**Dataset:** 10M registros (5M vehículos + 5M subtipos)

| Query Type | Tiempo Promedio | Caso de Uso |
|-------------|----------------|-------------|
| Nested Loop | 0.03ms | Búsqueda por patente |
| Merge Join | 89ms | Datos ordenados por fecha |
| Hash Join | 2800ms | Agregaciones grandes |
| PostgreSQL Auto | 2366ms | Queries complejas |

### 🎯 Insights Clave

- ✅ **Nested Loop** es extremadamente rápido para búsquedas selectivas
- ✅ **Hash Join** maneja bien agregaciones grandes
- ⚡ **Índices creados después de datos** mejora performance 2-3x
- 📈 **Escalabilidad**: 10M registros procesados eficientemente

## 🔧 Configuración PostgreSQL

### Memoria y JOINs
```sql
SET work_mem = '256MB';
SET maintenance_work_mem = '1GB';
SET enable_hashjoin = on;
SET enable_mergejoin = on;
SET enable_nestloop = on;
```

### Índices Optimizados
- Índices simples: patente, fecha, chofer
- Índices compuestos: fecha+desgaste, chofer+kilometraje
- Vista materializada para consultas frecuentes

## 🐛 Troubleshooting

### Problemas Comunes

1. **Contenedor no inicia**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Error de conexión**
   - Verificar que PostgreSQL esté listo: `docker logs performance_sql`
   - Esperar 10-15 segundos después de iniciar
   - Usar puerto correcto: `localhost:5442`

3. **Performance lenta**
   - Aumentar `work_mem`: `SET work_mem = '512MB'`
   - Verificar índices: `\d+ nombre_tabla`

4. **Sin datos en tablas**
   - Ejecutar inserción: `pnpm run insert-data`
   - Verificar conteo: `SELECT COUNT(*) FROM vehiculos`

### Logs y Debugging

```bash
# Logs del contenedor PostgreSQL
docker logs performance_sql

# Conexión directa a PostgreSQL (desde host)
psql -h localhost -p 5442 -U postgres -d performance_db

# Conexión directa a PostgreSQL (desde container)
docker exec -it performance_sql psql -U postgres -d performance_db

# Verificar tablas
\dt

# Verificar índices
\di
```

### 🌐 Acceso a pgAdmin

**URL**: `http://localhost:5055`
- **Email**: `admin@performance.com`
- **Password**: `admin`
- **Server**: `localhost:5442`
- **Database**: `performance_db`

## 📚 Referencias

- [PostgreSQL JOIN Optimization](https://www.postgresql.org/docs/current/join-optimization.html)
- [EXPLAIN ANALYZE](https://www.postgresql.org/docs/current/sql-explain.html)
- [Work_mem Configuration](https://www.postgresql.org/docs/current/runtime-config-resource.html)

## 🏆 Métricas de Éxito

✅ **Migración Completa**: De 2 tablas a 4 tablas con relaciones 1:1  
✅ **Performance**: 10M registros en <2 minutos de inserción  
✅ **Análisis**: 4 tipos de JOIN con métricas detalladas  
✅ **Escalabilidad**: Queries eficientes a gran escala  
✅ **Automatización**: Scripts TypeScript para generación y análisis  

---

**🚗 Proyecto listo para análisis de performance de JOINs a escala industrial!**
