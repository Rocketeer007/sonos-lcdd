/**
 * Dependencies
 */
var SonosLCD = require('./lib/sonosLCD');
var LCDdClient = require('node-lcdd');

// Connect to the LCD Display Server
var lcd = new LCDdClient('localhost', 13666, 'sonos');

// Once the LCD is ready, look for Sonos devices
lcd.on('ready', function() {
    // HACK - For cloud9, I'm using localhost, and setting up an SSH Tunnel to the real Sonos
    var s = new SonosLCD(process.env.SONOS_HOST || 'localhost', process.env.SONOS_PORT || 1400, lcd);
});


