/**
 * Dependencies
 */
var NodeSonos = require('sonos');
var SonosLCD = require('./lib/sonosLCD');
var LCDdClient = require('node-lcdd');

// Connect to the LCD Display Server
var lcd = new LCDdClient('localhost', 13666, 'sonos');

// Once the LCD is ready, look for Sonos devices
lcd.on('ready', function() {
    console.log('\nSearching for Sonos devices on network...');
    var search = NodeSonos.search();

    if (process.env.SONOS_HOST) {
        // Connect to the Sonos device specified in the environment
        // HACK - For cloud9, I'm using localhost, and setting up an SSH Tunnel to the real Sonos
        var s = new SonosLCD(process.env.SONOS_HOST || 'localhost', process.env.SONOS_PORT || 1400, process.env.SONOS_NAME || 'Default', lcd);
    }

    // Whenever a Sonos device is found, create a new screen on the LCD for it
    search.on('DeviceAvailable', function DeviceFound(device, model) {
        var host = device.host;
        var port = device.port;

        device.getZoneAttrs(function ZoneAttrsFound(err, attrs) {
          var name = attrs.CurrentZoneName;

          console.log('Found:', name, '(@'+host+':'+port+')');
          var s = new SonosLCD(host, port, name, lcd);
        });
    });
});

