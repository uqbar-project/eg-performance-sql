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

// Utilidad flatMap para arrays
function flatMap<T, U>(array: T[], mapper: (item: T) => U[]): U[] {
  return array.reduce<U[]>((acc, item) => acc.concat(mapper(item)), [])
}

const postgresConnection = new Client({
  host: 'localhost',
  port: 5432,
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

function createTestQueries() {
  return [
    {
      name: 'Merge Join - Datos Ordenados',
      setup: 'SET enable_hashjoin = off; SET enable_nestloop = off;',
      query: `
        SELECT c.id, c.nombre, COUNT(p.id) as total_pedidos
        FROM clientes c
        INNER JOIN pedidos p ON c.id = p.cliente_id
        WHERE c.id BETWEEN 1 AND 100000
        GROUP BY c.id, c.nombre
        ORDER BY c.id
        LIMIT 1000
      `
    },
    {
      name: 'Nested Loop Join - Filtro Selectivo',
      setup: 'SET enable_hashjoin = off; SET enable_mergejoin = off;',
      query: `
        SELECT c.id, c.nombre, p.id as pedido_id, p.monto_total
        FROM clientes c
        INNER JOIN pedidos p ON c.id = p.cliente_id
        WHERE c.id = 12345
          AND p.fecha >= '2023-01-01'
        ORDER BY p.fecha DESC
        LIMIT 100
      `
    },
    {
      name: 'Hash Join - Agregación Grande',
      setup: 'SET enable_mergejoin = off; SET enable_nestloop = off;',
      query: `
        SELECT 
          c.id, c.nombre,
          COUNT(p.id) as total_pedidos,
          AVG(p.monto_total) as promedio_monto,
          SUM(p.monto_total) as total_monto
        FROM clientes c
        INNER JOIN pedidos p ON c.id = p.cliente_id
        WHERE c.id BETWEEN 100000 AND 500000
          AND p.fecha >= '2022-01-01'
        GROUP BY c.id, c.nombre
        HAVING COUNT(p.id) > 5
        ORDER BY total_monto DESC
        LIMIT 1000
      `
    },
    {
      name: 'PostgreSQL Auto - Query Compleja',
      setup: 'SET enable_hashjoin = on; SET enable_mergejoin = on; SET enable_nestloop = on;',
      query: `
        SELECT 
          c.id, c.nombre, c.email,
          p.id as pedido_id, p.fecha, p.monto_total,
          ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.fecha DESC) as pedido_rank
        FROM clientes c
        INNER JOIN pedidos p ON c.id = p.cliente_id
        WHERE c.id BETWEEN 50000 AND 150000
          AND p.monto_total > 100
        ORDER BY c.id, p.fecha DESC
        LIMIT 1000
      `
    }
  ]
}

async function executeAllPerformanceTests(): Promise<QueryPerformanceMetrics[]> {
  const testQueries = createTestQueries()
  
  const performanceResults = await Promise.all(
    testQueries.map(async ({ name, setup, query }) => {
      await postgresConnection.query(setup)
      const result = await executeQueryWithPerformanceAnalysis(name, query)
      
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

function calculatePerformanceSummary(queryResults: QueryPerformanceMetrics[]): PerformanceAnalysisReport['performanceSummary'] {
  const executionTimes = queryResults.map(result => result.executionTimeMs)
  const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
  
  const fastestQuery = queryResults.reduce((fastest, current) => 
    current.executionTimeMs < fastest.executionTimeMs ? current : fastest
  ).queryName
  
  const slowestQuery = queryResults.reduce((slowest, current) => 
    current.executionTimeMs > slowest.executionTimeMs ? current : slowest
  ).queryName
  
  return {
    fastestQuery,
    slowestQuery,
    averageExecutionTime,
    optimalJoinType: determineOptimalJoinType(queryResults)
  }
}

function determineOptimalJoinType(queryResults: QueryPerformanceMetrics[]): string {
  const joinTypePerformance = queryResults
    .filter(result => result.joinType)
    .reduce((acc, result) => {
      const joinType = result.joinType!
      if (!acc[joinType]) {
        acc[joinType] = []
      }
      acc[joinType].push(result.executionTimeMs)
      return acc
    }, {} as { [key: string]: number[] })
  
  return Object.entries(joinTypePerformance)
    .map(([joinType, times]) => ({
      joinType,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }))
    .reduce((best, current) => 
      current.averageTime < best.averageTime ? current : best
    , { joinType: 'N/A', averageTime: Infinity })
    .joinType
}

function generatePerformanceReport(queryResults: QueryPerformanceMetrics[]): PerformanceAnalysisReport {
  return {
    analysisTimestamp: new Date().toISOString(),
    queryResults,
    performanceSummary: calculatePerformanceSummary(queryResults)
  }
}

function printQueryResults(queryResults: QueryPerformanceMetrics[]): void {
  queryResults.forEach((queryResult, index) => {
    console.log(`\n${index + 1}. ${queryResult.queryName}`)
    console.log(`   ⏱️  Tiempo: ${queryResult.executionTimeMs.toFixed(2)}ms`)
    console.log(`   📈 Costo: ${queryResult.totalCost.toFixed(2)}`)
    console.log(`   🔗 JOIN: ${queryResult.joinType || 'N/A'}`)
    console.log(`   📁 Rows: ${queryResult.actualRowsProcessed}`)
    if (queryResult.bufferUsage) {
      const totalTempBlocks = queryResult.bufferUsage.tempBlocksRead + queryResult.bufferUsage.tempBlocksWritten
      console.log(`   💾 Buffers - Hit: ${queryResult.bufferUsage.sharedBlocksHit}, Read: ${queryResult.bufferUsage.sharedBlocksRead}, Temp: ${totalTempBlocks}`)
    }
  })
}

function printPerformanceSummary(summary: PerformanceAnalysisReport['performanceSummary']): void {
  console.log('\n📋 RESUMEN:')
  console.log(`   🏆 Más rápido: ${summary.fastestQuery}`)
  console.log(`   🐌 Más lento: ${summary.slowestQuery}`)
  console.log(`   ⏱️  Tiempo promedio: ${summary.averageExecutionTime.toFixed(2)}ms`)
  console.log(`   🔗 Mejor tipo de JOIN: ${summary.optimalJoinType}`)
}

function printCompleteReport(report: PerformanceAnalysisReport): void {
  console.log('\n' + '='.repeat(80))
  console.log('📈 REPORTE DE PERFORMANCE DE JOINS')
  console.log('='.repeat(80))
  console.log(`🕐 Timestamp: ${report.analysisTimestamp}`)
  
  console.log('\n📊 RESULTADOS POR QUERY:')
  printQueryResults(report.queryResults)
  
  printPerformanceSummary(report.performanceSummary)
  
  console.log('\n' + '='.repeat(80))
}

async function runPerformanceAnalysis(): Promise<void> {
  try {
    await postgresConnection.connect()
    console.log('🚀 Iniciando análisis de performance de JOINs')
    
    const queryResults = await executeAllPerformanceTests()
    const performanceReport = generatePerformanceReport(queryResults)
    
    printCompleteReport(performanceReport)
    
  } catch (error) {
    console.error('❌ Error en análisis:', error)
  } finally {
    await postgresConnection.end()
  }
}

runPerformanceAnalysis()
