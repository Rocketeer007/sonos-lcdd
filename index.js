var Sonos = require('sonos').Sonos;
var Listener = require('sonos/lib/events/listener');
var xml2js = require('xml2js');
var util = require('util');
var url = require('url');
var LCDdClient = require('node-lcdd');
var lcd = new LCDdClient('localhost', 13666);

var x = new Listener(new Sonos(process.env.SONOS_HOST || '192.168.2.11'))
x.listen(function (err) {
  if (err) throw err

  x.addService('/MediaRenderer/AVTransport/Event', function (error, sid) {
    if (error) throw err
    console.log('Successfully subscribed, with subscription id', sid)
  })

  x.on('serviceEvent', function (endpoint, sid, data) {
    //console.log('Received event from', endpoint, '(' + sid + ') with data:', data, '\n\n');

    (new xml2js.Parser()).parseString(data['LastChange'], function (err, json) {
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
        switch (currentTrackURI.protocol) {
            case 'aac:':
            case 'x-rincon-mp3radio:':
            case 'hls-radio:':
                isRadio = true;
                break;
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

        //console.log('This track is', (isRadio ? '' : 'not'), 'a radio service');

        var radioTitle = null;
        var radioStream = null;
        var radioShowMd = null;
        var trackTitle = null;
        var trackArtist = null;
        var trackAlbum = null;

        (new xml2js.Parser()).parseString(currentTrackMetaData, function (err, didl) {
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
        
        (new xml2js.Parser()).parseString(enqueuedTransportURIMetaData, function (err, didl) {
            if (err) throw err;
            if (didl != null && didl['DIDL-Lite'] && util.isArray(didl['DIDL-Lite'].item)) {
                var item = didl['DIDL-Lite'].item[0];
                
                radioTitle = util.isArray(item['dc:title']) ? item['dc:title'][0] : null;
            }
        });
        console.log('Now', transportState);
        if (!isRadio) console.log('\tTrack:', trackTitle, '/', trackArtist, '/', trackAlbum);
        console.log('\tRadio:', radioTitle, '/', radioStream, '/', radioShowMd);
    })
  })
})