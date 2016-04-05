Sonos-LCDd
==========

Sonos-LCDd is a Node.JS module that automatically displays the currently playing track on all local Sonos devices on an LCD display managed by LCDd

Installation
------------

First install and configure [LCDproc](http://www.lcdproc.org/), and get it working with your LCD display

Install latest via source
```
$ git clone https://github.com/Rocketeer007/sonos-lcdd.git
$ cd sonos-lcdd
$ npm install
```

Example usage
-------------
```
$ node index.js

Searching for Sonos devices on network...
Found: Kitchen (@192.168.1.70:1400)
Successfully subscribed, with subscription id uuid:RINCON_B8E937B336B001400_sub0000002317
Now PAUSED_PLAYBACK
        Track: Mr. Brightside / The Killers / Hot Fuss (International Version Ecopac)
        Radio: Muse Radio /  /

```

Development
-----------
```
$ git clone https://github.com/Rocketeer007/sonos-lcdd.git
$ cd sonos-lcdd
$ npm install
$ node index.js
```

Internally, Sonos-LCDd is a thin wrapper around the [node-lcdd](https://github.com/Rocketeer007/node-lcdd) and [node-sonos](https://github.com/bencevans/node-sonos) packages.

Changelog
---------

See [`CHANGELOG.md`](https://github.com/Rocketeer007/sonos-lcdd/blob/master/CHANGELOG.md)
