import { Client } from 'pg'
import * as faker from 'faker'

interface Cliente {
  fullName: string
  address: string
  email: string
}

interface Pedido {
  orderDate: string
  customerId: number
  totalAmount: number
}

// Para testing: cantidades más pequeñas
const BATCH_SIZE = 1000
const TOTAL_CLIENTES = 10000
const TOTAL_PEDIDOS = 50000

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'performance_db'
})

function generateCustomerData(): Cliente {
  const fullName = faker.name.findName()
  const email = faker.internet.email(fullName).toLowerCase()
  const address = faker.address.streetAddress()
  
  return { fullName, address, email }
}

function generateOrderData(customerId: number): Pedido {
  const orderDate = faker.date.past(2)
  const totalAmount = parseFloat(faker.datatype.number({ min: 10, max: 5000, precision: 0.01 }).toString())
  
  return {
    orderDate: orderDate.toISOString(),
    customerId,
    totalAmount
  }
}

async function insertCustomerData(): Promise<void> {
  console.log(`Insertando ${TOTAL_CLIENTES} clientes...`)
  
  const insertionRanges = Array.from({ length: Math.ceil(TOTAL_CLIENTES / BATCH_SIZE) }, (_, index) => {
    const startIndex = index * BATCH_SIZE
    const endIndex = Math.min(startIndex + BATCH_SIZE, TOTAL_CLIENTES)
    return { startIndex, endIndex }
  })
  
  for (const { startIndex, endIndex } of insertionRanges) {
    const batchCustomers = Array.from({ length: endIndex - startIndex }, () => generateCustomerData())
    
    const sqlValues = batchCustomers.map(customer => 
      `('${customer.fullName.replace(/'/g, "''")}', '${customer.address.replace(/'/g, "''")}', '${customer.email}')`
    ).join(',')
    
    const sqlQuery = `INSERT INTO clientes (nombre, direccion, email) VALUES ${sqlValues}`
    await client.query(sqlQuery)
    
    if ((endIndex) % 5000 === 0 || endIndex >= TOTAL_CLIENTES) {
      console.log(`Clientes insertados: ${endIndex}/${TOTAL_CLIENTES}`)
    }
  }
}

async function insertOrderData(): Promise<void> {
  console.log(`Insertando ${TOTAL_PEDIDOS} pedidos...`)
  
  const insertionRanges = Array.from({ length: Math.ceil(TOTAL_PEDIDOS / BATCH_SIZE) }, (_, index) => {
    const startIndex = index * BATCH_SIZE
    const endIndex = Math.min(startIndex + BATCH_SIZE, TOTAL_PEDIDOS)
    return { startIndex, endIndex }
  })
  
  for (const { startIndex, endIndex } of insertionRanges) {
    const batchOrders = Array.from({ length: endIndex - startIndex }, () => {
      const customerId = faker.datatype.number({ min: 1, max: TOTAL_CLIENTES })
      return generateOrderData(customerId)
    })
    
    const sqlValues = batchOrders.map(order => 
      `('${order.orderDate}', ${order.customerId}, ${order.totalAmount})`
    ).join(',')
    
    const sqlQuery = `INSERT INTO pedidos (fecha, cliente_id, monto_total) VALUES ${sqlValues}`
    await client.query(sqlQuery)
    
    if ((endIndex) % 5000 === 0 || endIndex >= TOTAL_PEDIDOS) {
      console.log(`Pedidos insertados: ${endIndex}/${TOTAL_PEDIDOS}`)
    }
  }
}

async function main(): Promise<void> {
  try {
    await client.connect()
    console.log('Conectado a PostgreSQL')
    
    const startTime = Date.now()
    
    await insertCustomerData()
    await insertOrderData()
    
    // Actualizar estadísticas
    await client.query('ANALYZE')
    await client.query('REFRESH MATERIALIZED VIEW mv_cliente_estadisticas')
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    console.log(`\n✅ Datos de prueba insertados exitosamente en ${duration.toFixed(2)} segundos`)
    
    // Verificar conteos
    const clientesResult = await client.query('SELECT COUNT(*) FROM clientes')
    const pedidosResult = await client.query('SELECT COUNT(*) FROM pedidos')
    
    console.log(`Total clientes: ${clientesResult.rows[0].count}`)
    console.log(`Total pedidos: ${pedidosResult.rows[0].count}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

main()
