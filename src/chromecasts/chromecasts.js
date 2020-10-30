const { Client, DefaultMediaReceiver } = require('castv2-client')
const query = require('./src/query')

const services = query.start()

services.on('up', (service) => {
  console.log('service up', service.name, service.txtRecord ? service.txtRecord.fn : null)
  ondeviceup(service.host)
})

services.on('down', (service) => {
  console.log('service down', service, service.txtRecord ? service.txtRecord.fn : null)
})

function ondeviceup(host) {

  var client = new Client()

  client.connect(host, function() {
    console.log('connected, launching app ...')

    client.getStatus((err, response) => {
      console.log('status', err, response)

      client.getSessions((error, sess) => {
        console.log('Got sessions', error, sess)
        var session = sess[0]
        if (session && session.appId === DefaultMediaReceiver.APP_ID) {
          client.join(session, DefaultMediaReceiver, onJoin)
        } else {
          client.launch(DefaultMediaReceiver, onLaunch)
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

        function onLaunch (err, player) {
          if (err) {
            return console.error(err)
          }

          var media = {
            // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
            // contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
            contentId: 'http://10.0.1.13:8080/DominicanRepublic.mp4',
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
      })
    })
  })

  client.on('error', function(err) {
    console.log('Error: %s', err.message)
    client.close()
  })

}
