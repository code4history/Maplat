# Mock-geolocation
Mock for ```navigator.geolocation```.

### [Russian readme](https://github.com/2gis/mock-geolocation/blob/master/README_RU.md) ###

### [Demo](http://2gis.github.io/mock-geolocation/) ###

```javascript
var point = [54.980206086231, 82.898068362003];

geolocate.use();

navigator.geolocation.getCurrentPosition(function(position) {
  assert(position.coords.latitude).equal(point[0]);
  assert(position.coords.longitude).equal(point[1]);
});

geolocate.send({lat: point[0], lng: point[1]});

geolocate.restore();
```
## Installation
Manually:
```html
<script src="geolocate.js"></script>
```
From ```npm```:
```
npm install mock-geolocation
```
As ```CommonJS``` or ```AMD``` module:
```javascript
var geolocate = require('mock-geolocation');
```
## API
### .use()
Replace the native ```navigator.geolocation``` object
### .restore()
Restore ```navigator.geolocation``` in original state
### .send([options])
This method emulates the finding position after calling [getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation.getCurrentPosition) and [watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation.watchPosition) method.
Updates position from ```options``` which may include the following parameters from [positions.coords](https://developer.mozilla.org/en-US/docs/Web/API/Coordinates) and [timestamp](https://developer.mozilla.org/en-US/docs/Web/API/Position.timestamp).
```javascript
navigator.geolocation.getCurrentPosition(function(position) {
  console.log(position);
});

geolocate.send({
  latitude: 50,
  longitude: 10,
  accuracy: 5,
  timestamp: 3000
});

/* {
  coords: {
    accuracy: 5,
    altitude: null
    altitudeAccuracy: null,
    heading: null,
    latitude: 50
    longitude: 10,
    speed: null
  },
  timestamp: 3000
} */

navigator.geolocation.getCurrentPosition(function(position) {
  console.log(position);
});

geolocate.send();

/* Show same position {
  coords: {
    accuracy: 5,
    altitude: null
    altitudeAccuracy: null,
    heading: null,
    latitude: 50
    longitude: 10,
    speed: null
  },
  timestamp: 3000
} */
```
### .change(options)
Change current position and call ```success callback``` of ```watchPosition``` method.
Updates position from ```options``` which may include the following parameters from [positions.coords](https://developer.mozilla.org/en-US/docs/Web/API/Coordinates) and [timestamp](https://developer.mozilla.org/en-US/docs/Web/API/Position.timestamp).
```javascript
navigator.geolocation.watchPosition(function(position) {
  console.log(position.coords.latitude + ', ' + position.coords.longitude);
});

geolocate.send();
// 54.9799, 82.89683699999999

geolocate.change({lat: 10, lng: 15});
// 10, 15

geolocate.change({lat: 25});
// 25, 15
```
### .sendError([options])
Call ```error callback``` of ```getCurrentPosition``` method.
```options``` may include the parameters [code and message](https://developer.mozilla.org/en-US/docs/Web/API/PositionError).
### .changeError([options])
Call ```error callback``` of ```watchPosition``` method.
```options``` may include the parameters [code and message](https://developer.mozilla.org/en-US/docs/Web/API/PositionError).
