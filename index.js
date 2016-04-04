/**
 * Dependencies
 */
var NodeSonos = require('sonos');
var SonosLCD = require('./lib/sonosLCD');
var LCDdClient = require('node-lcdd');

// Connect to the LCD Display Server
var lcd = new LCDdClient('localhost', 13666, 'sonos');

console.log('\nSearching for Sonos devices on network...');
var search = NodeSonos.search();

search.on('DeviceAvailable', function DeviceFound(device, model) {
  var host = device.host;
  var port = device.port;

  device.getZoneAttrs(function ZoneAttrsFound(err, attrs) {
    var name = attrs.CurrentZoneName;

    console.log('Found:', name, '(@'+host+':'+port+')');
  });
});


// Once the LCD is ready, look for Sonos devices
lcd.on('ready', function() {
    // HACK - For cloud9, I'm using localhost, and setting up an SSH Tunnel to the real Sonos
    var s = new SonosLCD(process.env.SONOS_HOST || 'localhost', process.env.SONOS_PORT || 1400, lcd);
});

