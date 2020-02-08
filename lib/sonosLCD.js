/**
 * Dependencies
 */
'use strict';

var Sonos = require('sonos').Sonos;
var Listener = require('sonos/lib/events/listener');
var xml2js = require('xml2js');
var util = require('util');
var url = require('url');
var LCDdClient = require('node-lcdd');

class SonosLCD {
    constructor(host, port, name, lcd) {
        this.lcd = lcd;
        this.scrollSpeed = 2;
        this.screenName = 'SonosInfo-'+name.replace(" ", "");
        this.screenTitle = 'Sonos - '+name;
        this.alertTimeout = 10*1000;

        this.sonosListener = new Listener(new Sonos(host, port));

        this.createScreens(name);
    }
}

SonosLCD.prototype.createScreens = function(deviceName) {
    var self = this;

    self.lcd.addScreen(self.screenName, {
        name: '{'+self.screenTitle+'}',
        priority: 'info'
    }, function createWidgets(err, response) {
        if (err) console.log('Error creating Now Playing Screen:', err);
        else {
            self.lcd.addTitleWidget(self.screenName, 'title', self.screenTitle);
            self.lcd.addIconWidget(self.screenName, 'icon', 1, 2, LCDdClient.ICON_NAME.ELLIPSIS);
            self.lcd.addWidget(self.screenName, 'line1', LCDdClient.WIDGET_TYPE.SCROLLER);
            self.lcd.addWidget(self.screenName, 'line2', LCDdClient.WIDGET_TYPE.SCROLLER);
            self.lcd.addWidget(self.screenName, 'line3', LCDdClient.WIDGET_TYPE.SCROLLER);
        }
    });

    // Only connect to Sonos after connecting to display & initialising
    self.sonosListener.listen(function(err) {
        self.listenSonos(self, err);
    });
}

SonosLCD.prototype.listenSonos = function(self, err) {
    if (err) throw err

    self.sonosListener.addService('/MediaRenderer/AVTransport/Event', function(error, sid) {
        if (error) throw err
        console.log('Successfully subscribed, with subscription id', sid)
    })

    self.sonosListener.on('serviceEvent', function(endpoint, sid, data) {
        //console.log('Received event from', endpoint, '(' + sid + ') with data:', data, '\n\n');

        (new xml2js.Parser()).parseString(data['LastChange'], function(err, json) {
            if (err) throw err;
            if (!json || !json['Event']) throw new Error('No Event in received Event: ', JSON.stringify(json));
            if (!json['Event']['InstanceID'] || !util.isArray(json['Event']['InstanceID'])) throw new Error('No Instance in received Event: ', JSON.stringify(json));
            var eventInstance = json['Event']['InstanceID'][0];
            var transportState = util.isArray(eventInstance['TransportState']) ? eventInstance.TransportState[0].$.val : null;
            var currentTrackURI = util.isArray(eventInstance['CurrentTrackURI']) ? url.parse(eventInstance.CurrentTrackURI[0].$.val) : null;
            var currentTrackMetaData = util.isArray(eventInstance['CurrentTrackMetaData']) ? eventInstance.CurrentTrackMetaData[0].$.val : null;
            var enqueuedTransportURIMetaData = util.isArray(eventInstance['r:EnqueuedTransportURIMetaData']) ? eventInstance['r:EnqueuedTransportURIMetaData'][0].$.val : null;

            //console.log('Transport State:', transportState);
            //console.log('Current Track URI:', currentTrackURI);
            //console.log('Track Metadata:\n', currentTrackMetaData);
            //console.log('URI Metadata:\n', enqueuedTransportURIMetaData, '\n\n');

            var isRadio = false;
            if (currentTrackURI != null) {
              switch (currentTrackURI.protocol) {
                  case 'aac:':
                  case 'x-rincon-mp3radio:':
                  case 'hls-radio:':
                  case 'x-sonosapi-stream':
                      isRadio = true;
                      break;
                  case 'x-sonosprog-spotify:':
                  case 'x-sonos-spotify:':
                  case 'http:':
                  case 'x-file-cifs:':
                  case 'x-sonos-http:':
                      isRadio = false;
                      break;
                  default:
                      isRadio = false;
                      console.log('Unknown Track Protocol:', currentTrackURI.protocol);
              }
            } else {
              console.log('CurrentTrackURI not set in Event: ', JSON.stringify(eventInstance));
            }

            //console.log('This track is', (isRadio ? '' : 'not'), 'a radio service');

            var radioTitle = null;
            var radioStream = null;
            var radioShowMd = null;
            var trackTitle = null;
            var trackArtist = null;
            var trackAlbum = null;

            if (currentTrackMetaData != null) {
              (new xml2js.Parser()).parseString(currentTrackMetaData, function(err, didl) {
                  if (err) throw err;
                  if (didl != null && didl['DIDL-Lite'] && util.isArray(didl['DIDL-Lite'].item)) {
                      var item = didl['DIDL-Lite'].item[0];

                      radioStream = util.isArray(item['r:streamContent']) ? item['r:streamContent'][0] : null;
                      radioShowMd = util.isArray(item['r:radioShowMd']) ? item['r:radioShowMd'][0] : null;
                      trackTitle = util.isArray(item['dc:title']) ? item['dc:title'][0] : null;
                      trackArtist = util.isArray(item['dc:creator']) ? item['dc:creator'][0] : null;
                      trackAlbum = util.isArray(item['upnp:album']) ? item['upnp:album'][0] : null;
                  }
              });
            } else {
              console.log('CurrentTrackMetaData not set in Event: ', JSON.stringify(eventInstance));
            }

            if (enqueuedTransportURIMetaData != null) {
              (new xml2js.Parser()).parseString(enqueuedTransportURIMetaData, function(err, didl) {
                  if (err) throw err;
                  if (didl != null && didl['DIDL-Lite'] && util.isArray(didl['DIDL-Lite'].item)) {
                      var item = didl['DIDL-Lite'].item[0];

                      radioTitle = util.isArray(item['dc:title']) ? item['dc:title'][0] : null;
                  }
              });
            } else {
              console.log('EnqueuedTransportURIMetaData not set in Event: ', JSON.stringify(eventInstance));
            }

            console.log('Now', transportState);
            if (!isRadio) console.log('\tTrack:', trackTitle, '/', trackArtist, '/', trackAlbum);
            console.log('\tRadio:', radioTitle, '/', radioStream, '/', radioShowMd);

            switch (transportState) {
                case 'PAUSED_PLAYBACK':
                    self.lcd.setIconWidget(self.screenName, 'icon', 1, 2, LCDdClient.ICON_NAME.PAUSE);
                    break;
                case 'PLAYING':
                    self.lcd.setIconWidget(self.screenName, 'icon', 1, 2, LCDdClient.ICON_NAME.PLAY);
                    break;
                case 'STOPPED':
                    self.lcd.setIconWidget(self.screenName, 'icon', 1, 2, LCDdClient.ICON_NAME.STOP);
                    break;
                case 'TRANSITIONING':
                    self.lcd.setIconWidget(self.screenName, 'icon', 1, 2, LCDdClient.ICON_NAME.ELLIPSIS);
                    break;
                default:
                    console.log('Transport State is not handled:', transportState);
                    self.lcd.setIconWidget(self.screenName, 'icon', 1, 2, LCDdClient.ICON_NAME.ELLIPSIS);
            }

            if (isRadio) {
                self.lcd.setScrollerWidget(self.screenName, 'line1', 4, 2, 20, 2, LCDdClient.DIRECTION.HORIZONTAL, self.scrollSpeed, radioTitle);
                self.lcd.setScrollerWidget(self.screenName, 'line2', 1, 3, 20, 3, LCDdClient.DIRECTION.HORIZONTAL, self.scrollSpeed, radioStream);
                self.lcd.setScrollerWidget(self.screenName, 'line3', 1, 4, 20, 4, LCDdClient.DIRECTION.HORIZONTAL, self.scrollSpeed, radioShowMd);
            }
            else {
                self.lcd.setScrollerWidget(self.screenName, 'line1', 4, 2, 20, 2, LCDdClient.DIRECTION.HORIZONTAL, self.scrollSpeed, trackTitle);
                self.lcd.setScrollerWidget(self.screenName, 'line2', 1, 3, 20, 3, LCDdClient.DIRECTION.HORIZONTAL, self.scrollSpeed, trackArtist + ' - ' + trackAlbum);
                self.lcd.setScrollerWidget(self.screenName, 'line3', 1, 4, 20, 4, LCDdClient.DIRECTION.HORIZONTAL, self.scrollSpeed, radioTitle);
            }

            // Set the screen into Alert mode
            self.lcd.setScreen(self.screenName, { priority: 'alert' });
            // Revert to normal priority after 10 seconds
            setTimeout(function() {
                self.lcd.setScreen(self.screenName, { priority: 'info' });
            }, self.alertTimeout);
        })
    })
};

module.exports = SonosLCD;
