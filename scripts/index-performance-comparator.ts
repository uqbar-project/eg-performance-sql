import { Client } from 'pg'

interface PerformanceMetrics {
  queryName: string
  executionTimeMs: number
  planningTimeMs: number
  totalCost: number
  actualRowsProcessed: number
  joinType?: string
  bufferUsage?: {
    sharedBlocksRead: number
    sharedBlocksHit: number
    tempBlocksRead: number
    tempBlocksWritten: number
  }
}

interface ComparisonResult {
  withIndexes: PerformanceMetrics[]
  withoutIndexes: PerformanceMetrics[]
  performanceGain: {
    queryName: string
    timeWithIndexes: number
    timeWithoutIndexes: number
    improvementPercentage: number
    fasterWithIndexes: boolean
  }[]
}

const postgresConnection = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'performance_db'
})

async function executeQueryWithPerformanceAnalysis(queryName: string, sqlQuery: string): Promise<PerformanceMetrics> {
  console.log(`\n🔍 Ejecutando: ${queryName}`)
  
  const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`
  const queryResult = await postgresConnection.query(explainQuery)
  
  const executionPlan = queryResult.rows[0]['QUERY PLAN'][0]
  const executionTime = executionPlan['Execution Time']
  const planningTime = executionPlan['Planning Time']
  const totalCost = executionPlan.Plan['Total Cost']
  const actualRowsProcessed = executionPlan.Plan['Actual Rows']
  
  return {
    queryName,
    executionTimeMs: executionTime,
    planningTimeMs: planningTime,
    totalCost,
    actualRowsProcessed,
    joinType: extractJoinTypeFromPlan(executionPlan.Plan),
    bufferUsage: extractBufferUsageFromPlan(executionPlan.Plan)
  }
}

function extractJoinTypeFromPlan(plan: any): string | undefined {
  if (plan['Node Type']?.includes('Join')) {
    return plan['Node Type']
  }
  
  if (plan.Plans) {
    return plan.Plans
      .map((subPlan: any) => extractJoinTypeFromPlan(subPlan))
      .find((joinType: string | undefined) => joinType !== undefined)
  }
  
  return undefined
}

function extractBufferUsageFromPlan(plan: any): PerformanceMetrics['bufferUsage'] {
  const buffers = plan['Buffers'] || {}
  return {
    sharedBlocksRead: buffers['Shared Read Blocks'] || 0,
    sharedBlocksHit: buffers['Shared Hit Blocks'] || 0,
    tempBlocksRead: buffers['Temp Read Blocks'] || 0,
    tempBlocksWritten: buffers['Temp Written Blocks'] || 0
  }
}

async function recreateAllIndexes(): Promise<void> {
  console.log('\n🔧 Recreando todos los índices de performance...')
  
  // Configuración para construcción eficiente de índices
  await postgresConnection.query('SET maintenance_work_mem = \'1GB\'')
  await postgresConnection.query('SET work_mem = \'256MB\'')
  
  // Índices para tabla principal de vehículos
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON vehiculos(patente)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_fecha_patentamiento ON vehiculos(fecha_patentamiento)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_chofer_designado ON vehiculos(chofer_designado)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_desgaste ON vehiculos(desgaste)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_kilometraje ON vehiculos(kilometraje)')
  
  // Índices compuestos para diferentes escenarios de JOIN
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_fecha_desgaste ON vehiculos(fecha_patentamiento, desgaste DESC)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_chofer_kilometraje ON vehiculos(chofer_designado, kilometraje DESC)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_patente_desgaste ON vehiculos(patente, desgaste)')
  
  // Índices para tablas hijas
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_autos_vencimiento_matafuego ON autos(vencimiento_matafuego)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_motos_cilindrada ON motos(cilindrada)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_motos_seguro_terceros ON motos(seguro_terceros)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_camiones_cubiertas_auxilio ON camiones(cubiertas_auxilio)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_camiones_limite_km_diario ON camiones(limite_km_diario)')
  
  // Vista materializada para consultas frecuentes de vehículos
  await postgresConnection.query(`
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
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_mv_vehiculos_estadisticas_id ON mv_vehiculos_estadisticas(id)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_mv_vehiculos_estadisticas_tipo ON mv_vehiculos_estadisticas(tipo_vehiculo)')
  await postgresConnection.query('CREATE INDEX IF NOT EXISTS idx_mv_vehiculos_estadisticas_chofer ON mv_vehiculos_estadisticas(chofer_designado)')
  
  // Resetear maintenance_work_mem a valor normal
  await postgresConnection.query('RESET maintenance_work_mem')
  
  // Actualizar estadísticas
  await postgresConnection.query('ANALYZE')
  
  console.log('   ✅ Todos los índices recreados exitosamente')
}

async function dropAllIndexes(): Promise<void> {
  console.log('\n🗑️ Eliminando todos los índices de performance...')
  
  const indexesToDrop = [
    'idx_vehiculos_patente',
    'idx_vehiculos_fecha_patentamiento',
    'idx_vehiculos_chofer_designado',
    'idx_vehiculos_desgaste',
    'idx_vehiculos_kilometraje',
    'idx_vehiculos_fecha_desgaste',
    'idx_vehiculos_chofer_kilometraje',
    'idx_vehiculos_patente_desgaste',
    'idx_autos_vencimiento_matafuego',
    'idx_motos_cilindrada',
    'idx_motos_seguro_terceros',
    'idx_camiones_cubiertas_auxilio',
    'idx_camiones_limite_km_diario',
    'mv_vehiculos_estadisticas',
    'idx_mv_vehiculos_estadisticas_id',
    'idx_mv_vehiculos_estadisticas_tipo',
    'idx_mv_vehiculos_estadisticas_chofer'
  ]
  
  for (const indexName of indexesToDrop) {
    try {
      if (indexName.startsWith('mv_')) {
        await postgresConnection.query(`DROP MATERIALIZED VIEW IF EXISTS ${indexName}`)
      } else {
        await postgresConnection.query(`DROP INDEX IF EXISTS ${indexName}`)
      }
      console.log(`   ✅ Eliminado: ${indexName}`)
    } catch (error) {
      console.log(`   ⚠️ No se pudo eliminar: ${indexName}`)
    }
  }
}

function getTestQueries(): Array<{name: string, query: string}> {
  return [
    {
      name: 'Merge Join - Vehículos y Autos Ordenados',
      query: `
        SELECT 
          v.id, v.patente, v.fecha_patentamiento, v.chofer_designado, v.desgaste, v.kilometraje,
          a.vencimiento_matafuego
        FROM vehiculos v
        INNER JOIN autos a ON v.id = a.vehiculo_id
        WHERE v.fecha_patentamiento BETWEEN '2020-01-01' AND '2023-12-31'
          AND v.desgaste > 50
        ORDER BY v.fecha_patentamiento, a.vencimiento_matafuego
        LIMIT 10000
      `
    },
    {
      name: 'Nested Loop Join - Búsqueda Selectiva por Patente',
      query: `
        SELECT 
          v.id, v.patente, v.fecha_patentamiento, v.chofer_designado, v.desgaste, v.kilometraje,
          a.vencimiento_matafuego
        FROM vehiculos v
        INNER JOIN autos a ON v.id = a.vehiculo_id
        WHERE v.patente = 'ABC123'
          AND v.desgaste > 75
      `
    },
    {
      name: 'Hash Join - Agregación Grande por Chofer',
      query: `
        SELECT 
          v.chofer_designado,
          COUNT(*) as total_vehiculos,
          AVG(v.desgaste) as desgaste_promedio,
          AVG(v.kilometraje) as kilometraje_promedio,
          COUNT(a.vehiculo_id) as total_autos
        FROM vehiculos v
        LEFT JOIN autos a ON v.id = a.vehiculo_id
        WHERE v.desgaste > 50
          AND v.kilometraje > 10000
        GROUP BY v.chofer_designado
        HAVING COUNT(*) > 5
        ORDER BY total_vehiculos DESC
        LIMIT 1000
      `
    },
    {
      name: 'PostgreSQL Auto - Query Compleja Múltiples Tablas',
      query: `
        SELECT 
          v.chofer_designado,
          CASE 
            WHEN a.vehiculo_id IS NOT NULL THEN 'Auto'
            WHEN m.vehiculo_id IS NOT NULL THEN 'Moto'
            WHEN c.vehiculo_id IS NOT NULL THEN 'Camion'
            ELSE 'Desconocido'
          END as tipo_vehiculo,
          COUNT(*) as total_vehiculos,
          AVG(v.desgaste) as desgaste_promedio,
          AVG(v.kilometraje) as kilometraje_promedio,
          MIN(v.fecha_patentamiento) as patentamiento_mas_antiguo
        FROM vehiculos v
        LEFT JOIN autos a ON v.id = a.vehiculo_id
        LEFT JOIN motos m ON v.id = m.vehiculo_id
        LEFT JOIN camiones c ON v.id = c.vehiculo_id
        WHERE v.fecha_patentamiento >= '2020-01-01'
          AND v.desgaste BETWEEN 30 AND 80
        GROUP BY v.chofer_designado, tipo_vehiculo
        HAVING COUNT(*) > 3
        ORDER BY total_vehiculos DESC, tipo_vehiculo
        LIMIT 500
      `
    }
  ]
}

async function runPerformanceComparison(): Promise<void> {
  try {
    await postgresConnection.connect()
    console.log('🚗 Iniciando comparación de performance con/sin índices...')
    
    const testQueries = getTestQueries()
    
    // 1. Ejecutar queries CON índices
    console.log('\n📊 === EJECUTANDO CON ÍNDICES ===')
    const resultsWithIndexes: PerformanceMetrics[] = []
    
    for (const testQuery of testQueries) {
      const result = await executeQueryWithPerformanceAnalysis(testQuery.name, testQuery.query)
      resultsWithIndexes.push(result)
      
      console.log(`⏱️ ${testQuery.name}: ${result.executionTimeMs.toFixed(2)}ms`)
    }
    
    // 2. Eliminar índices
    await dropAllIndexes()
    
    // 3. Ejecutar queries SIN índices
    console.log('\n📊 === EJECUTANDO SIN ÍNDICES ===')
    const resultsWithoutIndexes: PerformanceMetrics[] = []
    
    for (const testQuery of testQueries) {
      const result = await executeQueryWithPerformanceAnalysis(testQuery.name, testQuery.query)
      resultsWithoutIndexes.push(result)
      
      console.log(`⏱️ ${testQuery.name}: ${result.executionTimeMs.toFixed(2)}ms`)
    }
    
    // 4. Recrear índices
    await recreateAllIndexes()
    
    // 5. Generar reporte de comparación
    const comparisonResult: ComparisonResult = {
      withIndexes: resultsWithIndexes,
      withoutIndexes: resultsWithoutIndexes,
      performanceGain: []
    }
    
    console.log('\n📈 === REPORTE DE COMPARACIÓN ===')
    console.log('=' .repeat(80))
    
    for (let i = 0; i < testQueries.length; i++) {
      const withIndex = resultsWithIndexes[i]
      const withoutIndex = resultsWithoutIndexes[i]
      
      const improvementPercentage = ((withoutIndex.executionTimeMs - withIndex.executionTimeMs) / withoutIndex.executionTimeMs) * 100
      const fasterWithIndexes = withIndex.executionTimeMs < withoutIndex.executionTimeMs
      
      comparisonResult.performanceGain.push({
        queryName: testQueries[i].name,
        timeWithIndexes: withIndex.executionTimeMs,
        timeWithoutIndexes: withoutIndex.executionTimeMs,
        improvementPercentage,
        fasterWithIndexes
      })
      
      const status = fasterWithIndexes ? '✅ MEJOR' : '❌ PEOR'
      const improvement = fasterWithIndexes ? `${improvementPercentage.toFixed(2)}% más rápido` : `${Math.abs(improvementPercentage).toFixed(2)}% más lento`
      
      console.log(`\n🔍 ${testQueries[i].name}`)
      console.log(`   📊 CON índices: ${withIndex.executionTimeMs.toFixed(2)}ms`)
      console.log(`   📊 SIN índices: ${withoutIndex.executionTimeMs.toFixed(2)}ms`)
      console.log(`   ${status} ${improvement}`)
    }
    
    // 6. Resumen general
    const totalWithIndexes = resultsWithIndexes.reduce((sum, r) => sum + r.executionTimeMs, 0)
    const totalWithoutIndexes = resultsWithoutIndexes.reduce((sum, r) => sum + r.executionTimeMs, 0)
    const overallImprovement = ((totalWithoutIndexes - totalWithIndexes) / totalWithoutIndexes) * 100
    
    console.log('\n🎯 === RESUMEN GENERAL ===')
    console.log(`⏱️ Tiempo total CON índices: ${totalWithIndexes.toFixed(2)}ms`)
    console.log(`⏱️ Tiempo total SIN índices: ${totalWithoutIndexes.toFixed(2)}ms`)
    console.log(`📈 Mejora general: ${overallImprovement.toFixed(2)}%`)
    
    if (overallImprovement > 0) {
      console.log('✅ Los índices mejoran significativamente el rendimiento')
    } else {
      console.log('⚠️ Los índices no muestran mejora significativa en estas queries')
    }
    
    console.log('\n🎉 Comparación de performance completada!')
    
  } catch (error) {
    console.error('❌ Error en comparación de performance:', error)
    throw error
  } finally {
    await postgresConnection.end()
  }
}

runPerformanceComparison()
