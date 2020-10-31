const { getDeviceInstanceFromService } = require('./device')
const query = require('./query')

const services = query.start()
const devices = new Map()

services.on('up', (service) => {
  const device = getDeviceInstanceFromService(service)
  devices.set(device.name, device)
  console.log(device)
})

services.on('down', (service) => {
  const { name } = service
  const device = devices.get(name)
  if (device) {
    device.isActive = false
  }
})
