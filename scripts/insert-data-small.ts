import { runInsertion, DataConfig } from './vehicle-data-generator'

const config: DataConfig = {
  batchSize: 1000,
  totalVehiculos: 10000,
  totalAutos: 6000,
  totalMotos: 2000,
  totalCamiones: 2000,
  reportFrequency: 5000
}

runInsertion(config, true)
