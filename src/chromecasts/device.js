const { Client, DefaultMediaReceiver } = require('castv2-client')
// const EventEmitter = require('events')

module.exports = {
  getDeviceInstanceFromService
}

class Device {
  client = null

  constructor(data) {
    this.name = data.name 
    this.host = data.host 
    this.port = data.port 
    this.addresses = data.addresses 
    this.friendlyName = data.friendlyName
    this.application = data.application
    this.icon = data.icon 
    this.id = data.id 
    this.cd = data.cd
    this.isActive = data.isActive
    this.connect()
  }

  connect() {
    this.client = new Client()
    this.client.connect(this.host, this._handleConnect.bind(this))
    this.client.on('error', this._handleError.bind(this))
  }

  async _handleConnect() {
    console.log('Connected to', this.friendlyName)
    const status = await this.getStatus()
    console.log('status', status)
    await this.joinActiveSession()
  }

  _handleError(error) {
    console.error('Error', error)
    this.client.close()
  }

  getStatus() {
    return new Promise((resolve, reject) => {
      this.client.getStatus((error, response) => {
        if (error) return reject(error) 
        resolve(response)
      })
    })
  }

  getSessions() {
    return new Promise((resolve, reject) => {
      this.client.getSessions((error, sessions) => {
        if (error) return reject(error)
        resolve(sessions)
      })
    })
  }

  async getActiveSession() {
    const sessions = await this.getSessions()
    return sessions.length ? sessions[0] : null
  }

  async joinActiveSession() {
    const session = await this.getActiveSession()
    
    if (session) {
      console.log('Active session', session)
      if (session && session.appId === DefaultMediaReceiver.APP_ID) {
        this.client.join(session, DefaultMediaReceiver, onJoin)
      }
    }

    function onJoin (err, player) {
      if (err) return console.error(err)

      player.getStatus((err, response) => {
        console.log('got status', err, response)
      })

      player.on('status', function(status) {
        console.log('2 -> status broadcast playerState=%s', status)
      })

      console.log('Joined session', player.session)
    }  
  }

  launchApp() {
    this.client.launch(DefaultMediaReceiver, onLaunch)

    function onLaunch (err, player) {
      if (err) {
        return console.error(err)
      }

      var media = {
        // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
        contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
        contentType: 'video/mp4',
        streamType: 'BUFFERED', // or LIVE

        // Title and cover displayed while buffering
        metadata: {
          type: 0,
          metadataType: 0,
          title: "Big Buck Bunny",
          images: [
            { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' }
          ]
        }
      }

      player.on('status', function(status) {
        console.log('status broadcast playerState=%s', status.playerState)
      })

      console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId)

      player.load(media, { autoplay: true }, function(err, status) {
        console.log('media loaded playerState=%s', status.playerState)

        // Seek to 2 minutes after 15 seconds playing.
        setTimeout(function() {
          player.seek(2*60, function(err, status) {
            //
          })
        }, 15000)

      })
    }
  }
}

function getDeviceInstanceFromService(service) {
  const { name, host, port, addresses } = service
  const { fn, rs, ic, id, cd } = service.txtRecord

  const device = new Device({
    name, 
    host, 
    port, 
    addresses, 
    friendlyName: fn,
    application: rs,
    icon: ic, 
    id, 
    cd,
    isActive: true
  })

  return device
}