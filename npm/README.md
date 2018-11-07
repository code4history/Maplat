# Maplat Tin library

JavaScript library which performs bijective conversion mutually between the coordinate systems of two planes based on the control points.  
This is part of [Maplat](https://github.com/code4nara/Maplat/wiki) project.

## Installation

### node.js

The easiest way to install maplat_tin is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm install maplat_tin
```

### Browser

Use [maplat_tin.js](https://raw.githubusercontent.com/code4nara/Maplat/master/dist/maplat_tin.js)

```html
<script type="text/javascript" src="maplat_tin.js"></script>
```


## How to use (node.js case)

```javascript
var Tin = require('maplat_tin');

var tin = new Tin({
    wh: [500, 500],
    yaxisMode: Tin.YAXIS_FOLLOW
});

tin.setPoints([
  [[100,100], [200, 200]],
  [[200,200], [400, 400]],
  [[150,150], [320, 350]],
  [[200,100], [420, 220]]
]);
tin.updateTinAsync().then(function() {
  if (tin.strict_status == Tin.STATUS_STRICT) {
    console.log('Topology OK: In this case, roundtrip transform is guaranteed');
  } else if (tin.strict_status == Tin.STATUS_LOOSE) {
    console.log('Topology error: In this case, roundtrip transform is not guaranteed');
  } else {
    console.log('Something wrong');
  }

  //Forward transform
  var ord = tin.transform([160, 160], false);
  console.log(ord);
  //ord => [336.0769755832048, 360.048109739503]

  //Backward transform
  var rev = tin.transform(ord, true);
  console.log(rev);
  //rev => [160, 160]

  //Solving triangulated irregular network from many points by scrach takes too many time.
  //So, there are object-serialization method to store solved instance.

  var compiled = tin.getCompiled();

  var tin2 = new Tin();
  tin2.setCompiled(compiled);
  // Compiled triangulated irregular network was set. no "updateTinAsync" call is need.

  var ord2 = tin.transform([160, 160], false);
  console.log(ord2);
  var rev2 = tin.transform(ord2, true);
  console.log(rev2);
  //Same results with ord, rev
}).catch(function(e) {
  if (e == 'TOO LINEAR1' || e == 'TOO LINEAR2') {
    console.log('Given GCP points are too linear, fail to create triangulated irregular network.');
  } else {
    console.log('Something wrong');
  }
});
```

## Options

### wh (method: setWh)
Set width and height of the first coordinate system.  
*NOTE: If setWh was called, TIN network is reset. So need to call updateTinAsync() again.*

### yaxisMode
Set *Tin.YAXIS_FOLLOW* if the y coordinate of the first coordinate system is the same as the direction of the y axis of the second coordinate system, and set *Tin.YAXIS_INVERT* if it is in the opposite direction.  
Default value is *Tin.YAXIS_INVERT*.

### points (method: setPoints)
A set of corresponding points in the first coordinate system and the second coordinate system is specified as an array. Minimum 3 points required. Also, if the alignment of points is too linear, TIN can not be calculated at updateTinAsync and an error occurs.   
*NOTE: If setPoints was called, TIN network is reset. So need to call updateTinAsync() again.*

## Methods

### updateTinAsync()
Return value is Promise. Calcurate TIN asynchronously. Before calling *transform*, this method needs to be completed.

### transform(xy, inverse)
Convert the coordinates. If the value of *inverse* is false, the direction of conversion is from the first coordinate system to the second one, if it is true, the direction of conversion is reverse direction.

## Properties

### strict_status

Confirm after completion of *updateTinAsync()*. When the value is *Tin.STATUS_STRICT*, bijection conversion is guaranteed. In the case of *Tin.STATUS_LOOSE* it is not guaranteed.