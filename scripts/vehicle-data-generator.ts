import { Client } from 'pg'
import * as faker from 'faker'

export interface Vehicle {
  patente: string
  fechaPatentamiento: string
  choferDesignado: string
  desgaste: number
  kilometraje: number
}

export interface Auto {
  vehiculoId: number
  vencimientoMatafuego: string
}

export interface Moto {
  vehiculoId: number
  cilindrada: number
  seguroTerceros: boolean
}

export interface Camion {
  vehiculoId: number
  cubiertasAuxilio: number
  limiteKmDiario: number
}

export interface DataConfig {
  batchSize: number
  totalVehiculos: number
  totalAutos: number
  totalMotos: number
  totalCamiones: number
  reportFrequency: number
}

export function createClient(): Client {
  return new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'performance_db'
  })
}

export function generateVehicleData(index: number): Vehicle {
  const patente = generatePatente(index)
  const fechaPatentamiento = faker.date.past(20)
  const choferDesignado = faker.name.findName()
  const desgaste = faker.datatype.number({ min: 0, max: 100 })
  const kilometraje = faker.datatype.number({ min: 0, max: 500000 })
  
  return {
    patente,
    fechaPatentamiento: fechaPatentamiento.toISOString(),
    choferDesignado,
    desgaste,
    kilometraje
  }
}

export function generatePatente(index: number): string {
  // Generar patentes únicas: ABC123 o AA123BB
  if (index % 2 === 0) {
    // Formato ABC123
    const letters = faker.random.arrayElements(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], 3).join('')
    const numbers = String(index % 1000).padStart(3, '0')
    return `${letters}${numbers}`
  } else {
    // Formato AA123BB
    const letters1 = faker.random.arrayElements(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], 2).join('')
    const numbers = String(index % 1000).padStart(3, '0')
    const letters2 = faker.random.arrayElements(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], 2).join('')
    return `${letters1}${numbers}${letters2}`
  }
}

export function generateAutoData(vehiculoId: number): Auto {
  const vencimientoMatafuego = faker.date.between('2024-01-01', '2026-12-31')
  
  return {
    vehiculoId,
    vencimientoMatafuego: vencimientoMatafuego.toISOString()
  }
}

export function generateMotoData(vehiculoId: number): Moto {
  const cilindrada = faker.random.arrayElement([50, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 900, 1000, 1200, 1500, 1800, 2000])
  const seguroTerceros = faker.datatype.boolean()
  
  return {
    vehiculoId,
    cilindrada,
    seguroTerceros
  }
}

export function generateCamionData(vehiculoId: number): Camion {
  const cubiertasAuxilio = faker.datatype.number({ min: 1, max: 6 })
  const limiteKmDiario = faker.datatype.number({ min: 200, max: 1000 })
  
  return {
    vehiculoId,
    cubiertasAuxilio,
    limiteKmDiario
  }
}

export async function insertVehicleData(client: Client, config: DataConfig): Promise<void> {
  console.log(`Insertando ${config.totalVehiculos} vehículos...`)
  
  const insertionRanges = Array.from({ length: Math.ceil(config.totalVehiculos / config.batchSize) }, (_, index) => {
    const startIndex = index * config.batchSize
    const endIndex = Math.min(startIndex + config.batchSize, config.totalVehiculos)
    return { startIndex, endIndex }
  })
  
  for (const { startIndex, endIndex } of insertionRanges) {
    const batchVehicles = Array.from({ length: endIndex - startIndex }, (_, batchIndex) => 
      generateVehicleData(startIndex + batchIndex)
    )
    
    const sqlValues = batchVehicles.map(vehicle => 
      `('${vehicle.patente}', '${vehicle.fechaPatentamiento}', '${vehicle.choferDesignado.replace(/'/g, "''")}', ${vehicle.desgaste}, ${vehicle.kilometraje})`
    ).join(',')
    
    const sqlQuery = `INSERT INTO vehiculos (patente, fecha_patentamiento, chofer_designado, desgaste, kilometraje) VALUES ${sqlValues}`
    await client.query(sqlQuery)
    
    if ((endIndex) % config.reportFrequency === 0 || endIndex >= config.totalVehiculos) {
      console.log(`Vehículos insertados: ${endIndex}/${config.totalVehiculos}`)
    }
  }
}

export async function insertAutoData(client: Client, config: DataConfig): Promise<void> {
  console.log(`Insertando ${config.totalAutos} autos...`)
  
  const insertionRanges = Array.from({ length: Math.ceil(config.totalAutos / config.batchSize) }, (_, index) => {
    const startIndex = index * config.batchSize
    const endIndex = Math.min(startIndex + config.batchSize, config.totalAutos)
    return { startIndex, endIndex }
  })
  
  for (const { startIndex, endIndex } of insertionRanges) {
    const batchAutos = Array.from({ length: endIndex - startIndex }, (_, batchIndex) => 
      generateAutoData(startIndex + batchIndex + 1)
    )
    
    const sqlValues = batchAutos.map(auto => 
      `(${auto.vehiculoId}, '${auto.vencimientoMatafuego}')`
    ).join(',')
    
    const sqlQuery = `INSERT INTO autos (vehiculo_id, vencimiento_matafuego) VALUES ${sqlValues}`
    await client.query(sqlQuery)
    
    if ((endIndex) % config.reportFrequency === 0 || endIndex >= config.totalAutos) {
      console.log(`Autos insertados: ${endIndex}/${config.totalAutos}`)
    }
  }
}

export async function insertMotoData(client: Client, config: DataConfig): Promise<void> {
  console.log(`Insertando ${config.totalMotos} motos...`)
  
  const insertionRanges = Array.from({ length: Math.ceil(config.totalMotos / config.batchSize) }, (_, index) => {
    const startIndex = index * config.batchSize
    const endIndex = Math.min(startIndex + config.batchSize, config.totalMotos)
    return { startIndex, endIndex }
  })
  
  for (const { startIndex, endIndex } of insertionRanges) {
    const batchMotos = Array.from({ length: endIndex - startIndex }, (_, batchIndex) => 
      generateMotoData(config.totalAutos + startIndex + batchIndex + 1)
    )
    
    const sqlValues = batchMotos.map(moto => 
      `(${moto.vehiculoId}, ${moto.cilindrada}, ${moto.seguroTerceros})`
    ).join(',')
    
    const sqlQuery = `INSERT INTO motos (vehiculo_id, cilindrada, seguro_terceros) VALUES ${sqlValues}`
    await client.query(sqlQuery)
    
    if ((endIndex) % config.reportFrequency === 0 || endIndex >= config.totalMotos) {
      console.log(`Motos insertadas: ${endIndex}/${config.totalMotos}`)
    }
  }
}

export async function insertCamionData(client: Client, config: DataConfig): Promise<void> {
  console.log(`Insertando ${config.totalCamiones} camiones...`)
  
  const insertionRanges = Array.from({ length: Math.ceil(config.totalCamiones / config.batchSize) }, (_, index) => {
    const startIndex = index * config.batchSize
    const endIndex = Math.min(startIndex + config.batchSize, config.totalCamiones)
    return { startIndex, endIndex }
  })
  
  for (const { startIndex, endIndex } of insertionRanges) {
    const batchCamiones = Array.from({ length: endIndex - startIndex }, (_, batchIndex) => 
      generateCamionData(config.totalAutos + config.totalMotos + startIndex + batchIndex + 1)
    )
    
    const sqlValues = batchCamiones.map(camion => 
      `(${camion.vehiculoId}, ${camion.cubiertasAuxilio}, ${camion.limiteKmDiario})`
    ).join(',')
    
    const sqlQuery = `INSERT INTO camiones (vehiculo_id, cubiertas_auxilio, limite_km_diario) VALUES ${sqlValues}`
    await client.query(sqlQuery)
    
    if ((endIndex) % config.reportFrequency === 0 || endIndex >= config.totalCamiones) {
      console.log(`Camiones insertados: ${endIndex}/${config.totalCamiones}`)
    }
  }
}

export async function runInsertion(config: DataConfig, isTesting: boolean = false): Promise<void> {
  const client = createClient()
  
  try {
    await client.connect()
    console.log('Conectado a PostgreSQL')
    
    const startTime = Date.now()
    
    // Paso 1: Insertar datos (sin índices para máxima velocidad)
    await insertVehicleData(client, config)
    await insertAutoData(client, config)
    await insertMotoData(client, config)
    await insertCamionData(client, config)
    
    // Paso 2: Actualizar estadísticas básicas
    await client.query('ANALYZE')
    
    const afterDataTime = Date.now()
    const dataDuration = (afterDataTime - startTime) / 1000
    
    const dataType = isTesting ? 'Datos de prueba' : 'Datos'
    console.log(`\n✅ ${dataType} insertados exitosamente en ${dataDuration.toFixed(2)} segundos`)
    console.log(`Total vehículos: ${config.totalVehiculos}`)
    console.log(`Total autos: ${config.totalAutos}`)
    console.log(`Total motos: ${config.totalMotos}`)
    console.log(`Total camiones: ${config.totalCamiones}`)
    console.log(`Total registros: ${config.totalVehiculos + config.totalAutos + config.totalMotos + config.totalCamiones}`)
    
    // Paso 3: Crear índices (bulk operation eficiente)
    console.log('\n🔧 Creando índices para optimizar performance...')
    const indexStartTime = Date.now()
    
    await createIndexesAfterData(client)
    
    const indexEndTime = Date.now()
    const indexDuration = (indexEndTime - indexStartTime) / 1000
    
    console.log(`✅ Índices creados en ${indexDuration.toFixed(2)} segundos`)
    
    // Paso 4: Actualizar estadísticas finales con índices
    await client.query('ANALYZE')
    
    const totalTime = (indexEndTime - startTime) / 1000
    console.log(`\n🎯 Proceso completado en ${totalTime.toFixed(2)} segundos totales`)
    console.log(`   - Inserción: ${dataDuration.toFixed(2)}s`)
    console.log(`   - Índices: ${indexDuration.toFixed(2)}s`)
    
  } catch (error) {
    console.error('❌ Error en inserción:', error)
    throw error
  } finally {
    await client.end()
  }
}

async function createIndexesAfterData(client: Client): Promise<void> {
  // Configuración de work_mem para construcción eficiente de índices
  await client.query('SET maintenance_work_mem = \'1GB\'')
  await client.query('SET work_mem = \'256MB\'')
  
  // Índices para tabla principal de vehículos
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON vehiculos(patente)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_fecha_patentamiento ON vehiculos(fecha_patentamiento)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_chofer_designado ON vehiculos(chofer_designado)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_desgaste ON vehiculos(desgaste)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_kilometraje ON vehiculos(kilometraje)')
  
  // Índices compuestos para diferentes escenarios de JOIN
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_fecha_desgaste ON vehiculos(fecha_patentamiento, desgaste DESC)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_chofer_kilometraje ON vehiculos(chofer_designado, kilometraje DESC)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_patente_desgaste ON vehiculos(patente, desgaste)')
  
  // Índices para tablas hijas
  await client.query('CREATE INDEX IF NOT EXISTS idx_autos_vencimiento_matafuego ON autos(vencimiento_matafuego)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_motos_cilindrada ON motos(cilindrada)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_motos_seguro_terceros ON motos(seguro_terceros)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_camiones_cubiertas_auxilio ON camiones(cubiertas_auxilio)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_camiones_limite_km_diario ON camiones(limite_km_diario)')
  
  // Vista materializada para consultas frecuentes de vehículos
  await client.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vehiculos_estadisticas AS
    SELECT 
      v.id,
      v.patente,
      v.chofer_designado,
      v.fecha_patentamiento,
      v.desgaste,
      v.kilometraje,
      CASE 
        WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
        WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
        WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
        ELSE 'Desconocido'
      END as tipo_vehiculo,
      COALESCE(a.vencimiento_matafuego, NULL) as vencimiento_matafuego,
      COALESCE(m.cilindrada, NULL) as cilindrada,
      COALESCE(m.seguro_terceros, NULL) as seguro_terceros,
      COALESCE(c.cubiertas_auxilio, NULL) as cubiertas_auxilio,
      COALESCE(c.limite_km_diario, NULL) as limite_km_diario
    FROM vehiculos v
    LEFT JOIN autos a ON v.id = a.vehiculo_id
    LEFT JOIN motos m ON v.id = m.vehiculo_id
    LEFT JOIN camiones c ON v.id = c.vehiculo_id
  `)
  
  // Índices para la vista materializada
  await client.query('CREATE INDEX IF NOT EXISTS idx_mv_vehiculos_estadisticas_id ON mv_vehiculos_estadisticas(id)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_mv_vehiculos_estadisticas_tipo ON mv_vehiculos_estadisticas(tipo_vehiculo)')
  await client.query('CREATE INDEX IF NOT EXISTS idx_mv_vehiculos_estadisticas_chofer ON mv_vehiculos_estadisticas(chofer_designado)')
  
  // Resetear maintenance_work_mem a valor normal
  await client.query('RESET maintenance_work_mem')
}
