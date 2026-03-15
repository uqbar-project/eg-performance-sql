import { runInsertion, DataConfig } from './vehicle-data-generator'

const config: DataConfig = {
  batchSize: 10000,
  totalVehiculos: 5000000,
  totalAutos: 3000000,
  totalMotos: 1000000,
  totalCamiones: 1000000,
  reportFrequency: 100000
}

runInsertion(config, false)
