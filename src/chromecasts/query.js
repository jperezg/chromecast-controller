const EventEmitter = require('events')
const mdns = require('mdns')

const servicesEmitter = new EventEmitter()
const browser = mdns.createBrowser(mdns.tcp('googlecast'))

module.exports.start = () => {
  browser.start()
  return servicesEmitter
}

module.exports.stop = () => {
  browser.stop()
}

browser.on('serviceUp', (service) => {
  servicesEmitter.emit('up', service)
})

browser.on('serviceDown', (service) => {
  servicesEmitter.emit('down', service)
})

