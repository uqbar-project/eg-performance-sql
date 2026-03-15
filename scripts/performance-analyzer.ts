import { Client } from 'pg'

interface QueryPerformanceMetrics {
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

interface PerformanceAnalysisReport {
  analysisTimestamp: string
  queryResults: QueryPerformanceMetrics[]
  performanceSummary: {
    fastestQuery: string
    slowestQuery: string
    averageExecutionTime: number
    optimalJoinType: string
  }
}

interface TestQuery {
  name: string
  setup: string
  query: string
}

// Utilidad flatMap para arrays
function flatMap<T, U>(array: T[], mapper: (item: T) => U[]): U[] {
  return array.reduce<U[]>((acc, item) => acc.concat(mapper(item)), [])
}

function createTestQueries(): TestQuery[] {
  return [
    {
      name: 'Merge Join - Vehículos y Autos Ordenados',
      setup: 'SET enable_hashjoin = off; SET enable_nestloop = off; SET enable_mergejoin = on; SET work_mem = \'256MB\';',
      query: `
        SELECT 
          v.id,
          v.patente,
          v.fecha_patentamiento,
          v.chofer_designado,
          v.desgaste,
          v.kilometraje,
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
      setup: 'SET enable_hashjoin = off; SET enable_mergejoin = off; SET enable_nestloop = on; SET work_mem = \'256MB\';',
      query: `
        SELECT 
          v.id,
          v.patente,
          v.fecha_patentamiento,
          v.chofer_designado,
          v.desgaste,
          v.kilometraje,
          a.vencimiento_matafuego
        FROM vehiculos v
        INNER JOIN autos a ON v.id = a.vehiculo_id
        WHERE v.patente = 'ABC123'
          AND v.desgaste > 75
      `
    },
    {
      name: 'Hash Join - Agregación Grande por Chofer',
      setup: 'SET enable_mergejoin = off; SET enable_nestloop = off; SET enable_hashjoin = on; SET work_mem = \'256MB\';',
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
      setup: 'SET enable_hashjoin = on; SET enable_mergejoin = on; SET enable_nestloop = on; SET work_mem = \'256MB\';',
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

const postgresConnection = new Client({
  host: 'localhost',
  port: 5442,  // Puerto 5442 en host local
  user: 'postgres',
  password: 'postgres',
  database: 'performance_db'
})

async function executeQueryWithPerformanceAnalysis(queryName: string, sqlQuery: string): Promise<QueryPerformanceMetrics> {
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

function extractBufferUsageFromPlan(plan: any): QueryPerformanceMetrics['bufferUsage'] {
  const buffers = plan['Buffers'] || {}
  return {
    sharedBlocksRead: buffers['Shared Read Blocks'] || 0,
    sharedBlocksHit: buffers['Shared Hit Blocks'] || 0,
    tempBlocksRead: buffers['Temp Read Blocks'] || 0,
    tempBlocksWritten: buffers['Temp Written Blocks'] || 0
  }
}

async function executeAllPerformanceTests(): Promise<QueryPerformanceMetrics[]> {
  const testQueries = createTestQueries()
  
  const performanceResults = await Promise.all(
    testQueries.map(async (testQuery: TestQuery) => {
      await postgresConnection.query(testQuery.setup)
      const result = await executeQueryWithPerformanceAnalysis(testQuery.name, testQuery.query)
      
      logQueryPerformance(result)
      return result
    })
  )
  
  return performanceResults
}

function logQueryPerformance(result: QueryPerformanceMetrics): void {
  console.log(`⏱️  Tiempo ejecución: ${result.executionTimeMs.toFixed(2)}ms`)
  console.log(`📊 Tipo de JOIN: ${result.joinType || 'N/A'}`)
  console.log(`💾 Buffers - Hit: ${result.bufferUsage?.sharedBlocksHit}, Read: ${result.bufferUsage?.sharedBlocksRead}`)
}

function generatePerformanceSummary(results: QueryPerformanceMetrics[]): PerformanceAnalysisReport['performanceSummary'] {
  const executionTimes = results.map(result => result.executionTimeMs)
  const fastestQuery = results.reduce((prev, current) => 
    prev.executionTimeMs < current.executionTimeMs ? prev : current
  )
  const slowestQuery = results.reduce((prev, current) => 
    prev.executionTimeMs > current.executionTimeMs ? prev : current
  )
  const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
  
  const joinTypeFrequency = results.reduce((acc, result) => {
    if (result.joinType) {
      acc[result.joinType] = (acc[result.joinType] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  
  const optimalJoinType = Object.entries(joinTypeFrequency)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown'
  
  return {
    fastestQuery: fastestQuery.queryName,
    slowestQuery: slowestQuery.queryName,
    averageExecutionTime,
    optimalJoinType
  }
}

async function runPerformanceAnalysis(): Promise<void> {
  try {
    await postgresConnection.connect()
    console.log('🚗 Iniciando análisis de performance para vehículos...')
    
    const queryResults = await executeAllPerformanceTests()
    const performanceSummary = generatePerformanceSummary(queryResults)
    
    const analysisReport: PerformanceAnalysisReport = {
      analysisTimestamp: new Date().toISOString(),
      queryResults,
      performanceSummary
    }
    
    console.log('\n� REPORTE DE ANÁLISIS DE PERFORMANCE')
    console.log('=' .repeat(50))
    console.log(`� Fecha: ${analysisReport.analysisTimestamp}`)
    console.log(`⚡ Query más rápida: ${performanceSummary.fastestQuery}`)
    console.log(`🐌 Query más lenta: ${performanceSummary.slowestQuery}`)
    console.log(`⏱️ Tiempo promedio: ${performanceSummary.averageExecutionTime.toFixed(2)}ms`)
    console.log(`🔗 JOIN óptimo: ${performanceSummary.optimalJoinType}`)
    
    console.log('\n� DETALLE DE QUERIES:')
    console.log('-'.repeat(50))
    
    queryResults.forEach(result => {
      console.log(`\n🔍 ${result.queryName}`)
      console.log(`   ⏱️ Ejecución: ${result.executionTimeMs.toFixed(2)}ms`)
      console.log(`   📋 Planificación: ${result.planningTimeMs.toFixed(2)}ms`)
      console.log(`   💰 Costo: ${result.totalCost.toFixed(2)}`)
      console.log(`   📊 Filas: ${result.actualRowsProcessed}`)
      
      if (result.joinType) {
        console.log(`   🔗 JOIN: ${result.joinType}`)
      }
      
      if (result.bufferUsage) {
        const hitRate = result.bufferUsage.sharedBlocksHit > 0 
          ? (result.bufferUsage.sharedBlocksHit / (result.bufferUsage.sharedBlocksHit + result.bufferUsage.sharedBlocksRead) * 100).toFixed(2)
          : '0.00'
        console.log(`   🎯 Cache Hit Rate: ${hitRate}%`)
      }
    })
    
    console.log('\n✅ Análisis completado exitosamente')
    
  } catch (error) {
    console.error('❌ Error en análisis de performance:', error)
    throw error
  } finally {
    await postgresConnection.end()
  }
}

runPerformanceAnalysis()
