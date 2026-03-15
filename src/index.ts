import { Client } from 'pg'

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'performance_db'
})

async function main() {
  try {
    await client.connect()
    console.log('Conectado a PostgreSQL')
    
    const result = await client.query('SELECT version()')
    console.log('PostgreSQL version:', result.rows[0].version)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

main()
