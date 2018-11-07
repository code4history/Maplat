# Maplat Tin library

JavaScript library which performs bijective conversion mutually between the coordinate systems of two planes based on the control points.  
This is part of [Maplat](https://github.com/code4nara/Maplat/wiki) project.

## Installation

The easiest way to install maplat_tin is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm install maplat_tin
```

## How to use

```javascript
const Tin = require('maplat_tin')

const tin = new Tin({
    wh: [500, 500],
    strictMode: Tin.MODE_AUTO,
    vertexMode: Tin.VERTEX_PLAIN,
    yaxisMode: Tin.YAXIS_FOLLOW
})

tin.setPoints([
  [[100,100], [200, 200]],
  [[200,200], [400, 400]],
  [[150,150], [320, 350]],
  [[200,100], [420, 220]]
])
tin.updateTinAsync().then(() => {
  if (tin.strict_status == Tin.STATUS_STRICT) {
    console.log('Topology OK: In this case, roundtrip transform is guaranteed')
  } else if (tin.strict_status == Tin.STATUS_LOOSE) {
    console.log('Topology error: In this case, roundtrip transform is not guaranteed')
  } else {
    console.log('Something wrong')
  }

  //Forward transform
  const ord = tin.transform([160, 160], false)
  console.log(ord)
  //ord => [336.0769755832048, 360.048109739503]

  //Backward transform
  const rev = tin.transform(ord, true)
  console.log(rev)
  //rev => [160, 160]

  //Solving triangulated irregular network from many points by scrach takes too many time.
  //So, there are object-serialization method to store solved instance.

  const compiled = tin.getCompiled()

  const tin2 = new Tin({})
  tin2.setCompiled(compiled)
  // Compiled triangulated irregular network was set. no "updateTinAsync" call is need.

  const ord2 = tin.transform([160, 160], false)
  console.log(ord2)
  const rev2 = tin.transform(ord2, true)
  console.log(rev2)
  //Same results with ord, rev
})
```

