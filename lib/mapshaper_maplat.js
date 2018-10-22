(function(){
    var VERSION = '0.4.31';

    var error = function() {
        var msg = utils.toArray(arguments).join(' ');
        throw new Error(msg);
    };

    var utils = {
        extend: function(o) {
            var dest = o || {},
                n = arguments.length,
                key, i, src;
            for (i=1; i<n; i++) {
                src = arguments[i] || {};
                for (key in src) {
                    if (src.hasOwnProperty(key)) {
                        dest[key] = src[key];
                    }
                }
            }
            return dest;
        },

        isArray: function(obj) {
            return Array.isArray(obj);
        },

        // NaN -> true
        isNumber: function(obj) {
            // return toString.call(obj) == '[object Number]'; // ie8 breaks?
            return obj != null && obj.constructor == Number;
        },

        isInteger: function(obj) {
            return Utils.isNumber(obj) && ((obj | 0) === obj);
        },

        isString: function(obj) {
            return obj != null && obj.toString === String.prototype.toString;
            // TODO: replace w/ something better.
        },

        isBoolean: function(obj) {
            return obj === true || obj === false;
        },

        // Array like: has length property, is numerically indexed and mutable.
        // TODO: try to detect objects with length property but no indexed data elements
        isArrayLike: function(obj) {
            if (!obj) return false;
            if (utils.isArray(obj)) return true;
            if (utils.isString(obj)) return false;
            if (obj.length === 0) return true;
            if (obj.length > 0) return true;
            return false;
        }
    };

    // Similar to isFinite() but does not convert strings or other types
    utils.isFiniteNumber = function(val) {
        return val === 0 || !!val && val.constructor == Number && val !== Infinity && val !== -Infinity;
    };

    // Calc sum, skip falsy and NaN values
    // Assumes: no other non-numeric objects in array
    //
    utils.sum = function(arr, info) {
        if (!utils.isArrayLike(arr)) error ("utils.sum() expects an array, received:", arr);
        var tot = 0,
            nan = 0,
            val;
        for (var i=0, n=arr.length; i<n; i++) {
            val = arr[i];
            if (val) {
                tot += val;
            } else if (isNaN(val)) {
                nan++;
            }
        }
        if (info) {
            info.nan = nan;
        }
        return tot;
    };

    // Support for iterating over array-like objects, like typed arrays
    utils.forEach = function(arr, func, ctx) {
        if (!utils.isArrayLike(arr)) {
            throw new Error("#forEach() takes an array-like argument. " + arr);
        }
        for (var i=0, n=arr.length; i < n; i++) {
            func.call(ctx, arr[i], i);
        }
    };

    utils.initializeArray = function(arr, init) {
        for (var i=0, len=arr.length; i<len; i++) {
            arr[i] = init;
        }
        return arr;
    };

    var geom = {
        //R: R,
        //D2R: D2R,
        //degreesToMeters: degreesToMeters,
        segmentHit: segmentHit,
        segmentIntersection: segmentIntersection,
        distanceSq: distanceSq,
        //distance2D: distance2D,
        //distance3D: distance3D,
        //innerAngle: innerAngle,
        //innerAngle2: innerAngle2,
        //signedAngle: signedAngle,
        //bearing: bearing,
        //signedAngleSph: signedAngleSph,
        //standardAngle: standardAngle,
        //convLngLatToSph: convLngLatToSph,
        //lngLatToXYZ: lngLatToXYZ,
        //xyzToLngLat: xyzToLngLat,
        //sphericalDistance: sphericalDistance,
        //greatCircleDistance: greatCircleDistance,
        //pointSegDistSq: pointSegDistSq,
        //pointSegDistSq3D: pointSegDistSq3D,
        //innerAngle3D: innerAngle3D,
        //triangleArea: triangleArea,
        //triangleArea3D: triangleArea3D,
        //cosine: cosine,
        //cosine3D: cosine3D
    };

    geom.segmentIntersection = segmentIntersection;
    geom.segmentHit = segmentHit;
    geom.lineIntersection = lineIntersection;
    geom.orient2D = orient2D;
    geom.outsideRange = outsideRange;

    geom.clampToCloseRange = function(a, b, c) {
        var lim;
        if (geom.outsideRange(a, b, c)) {
            lim = Math.abs(a - b) < Math.abs(a - c) ? b : c;
            if (Math.abs(a - lim) > 1e-16) {
                trace("[clampToCloseRange()] large clamping interval", a, b, c);
            }
            a = lim;
        }
        return a;
    };

    // a: coordinate of point
    // b: endpoint coordinate of segment
    // c: other endpoint of segment
    function outsideRange(a, b, c) {
        var out;
        if (b < c) {
            out = a < b || a > c;
        } else if (b > c) {
            out = a > b || a < c;
        } else {
            out = a != b;
        }
        return out;
    }

    function containsBounds(a, b) {
        return a[0] <= b[0] && a[2] >= b[2] && a[1] <= b[1] && a[3] >= b[3];
    }

    // Find the interection between two 2D segments
    // Returns 0, 1 or two x, y locations as null, [x, y], or [x1, y1, x2, y2]
    // Special cases:
    // If the segments touch at an endpoint of both segments, it is not treated as an intersection
    // If the segments touch at a T-intersection, it is treated as an intersection
    // If the segments are collinear and partially overlapping, each subsumed endpoint
    //    is counted as an intersection (there will be one or two)
    //
    function segmentIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
        var hit = segmentHit(ax, ay, bx, by, cx, cy, dx, dy),
            p = null;
        if (hit) {
            p = crossIntersection(ax, ay, bx, by, cx, cy, dx, dy);
            if (!p) { // collinear if p is null
                p = collinearIntersection(ax, ay, bx, by, cx, cy, dx, dy);
            } else if (endpointHit(ax, ay, bx, by, cx, cy, dx, dy)) {
                p = null; // filter out segments that only intersect at an endpoint
            }
        }
        return p;
    }

    // Source: Sedgewick, _Algorithms in C_
    // (Tried various other functions that failed owing to floating point errors)
    function segmentHit(ax, ay, bx, by, cx, cy, dx, dy) {
        return orient2D(ax, ay, bx, by, cx, cy) *
            orient2D(ax, ay, bx, by, dx, dy) <= 0 &&
            orient2D(cx, cy, dx, dy, ax, ay) *
            orient2D(cx, cy, dx, dy, bx, by) <= 0;
    }

    // Get intersection point if segments are non-collinear, else return null
    // Assumes that segments have been intersect
    function crossIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
        var p = lineIntersection(ax, ay, bx, by, cx, cy, dx, dy);
        var nearest;
        if (p) {
            // Re-order operands so intersection point is closest to a (better precision)
            // Source: Jonathan Shewchuk http://www.cs.berkeley.edu/~jrs/meshpapers/robnotes.pdf
            nearest = nearestPoint(p[0], p[1], ax, ay, bx, by, cx, cy, dx, dy);
            if (nearest == 1) {
                p = lineIntersection(bx, by, ax, ay, cx, cy, dx, dy);
            } else if (nearest == 2) {
                p = lineIntersection(cx, cy, dx, dy, ax, ay, bx, by);
            } else if (nearest == 3) {
                p = lineIntersection(dx, dy, cx, cy, ax, ay, bx, by);
            }
        }
        if (p) {
            clampIntersectionPoint(p, ax, ay, bx, by, cx, cy, dx, dy);
        }
        return p;
    }

    // Assume segments s1 and s2 are collinear and overlap; find one or two internal endpoints
    function collinearIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
        var minX = Math.min(ax, bx, cx, dx),
            maxX = Math.max(ax, bx, cx, dx),
            minY = Math.min(ay, by, cy, dy),
            maxY = Math.max(ay, by, cy, dy),
            useY = maxY - minY > maxX - minX,
            coords = [];

        if (useY ? inside(ay, minY, maxY) : inside(ax, minX, maxX)) {
            coords.push(ax, ay);
        }
        if (useY ? inside(by, minY, maxY) : inside(bx, minX, maxX)) {
            coords.push(bx, by);
        }
        if (useY ? inside(cy, minY, maxY) : inside(cx, minX, maxX)) {
            coords.push(cx, cy);
        }
        if (useY ? inside(dy, minY, maxY) : inside(dx, minX, maxX)) {
            coords.push(dx, dy);
        }
        if (coords.length != 2 && coords.length != 4) {
            coords = null;
            trace("Invalid collinear segment intersection", coords);
        } else if (coords.length == 4 && coords[0] == coords[2] && coords[1] == coords[3]) {
            // segs that meet in the middle don't count
            coords = null;
        }
        return coords;
    }

    function endpointHit(ax, ay, bx, by, cx, cy, dx, dy) {
        return ax == cx && ay == cy || ax == dx && ay == dy ||
            bx == cx && by == cy || bx == dx && by == dy;
    }

    // returns a positive value if the points a, b, and c are arranged in
    // counterclockwise order, a negative value if the points are in clockwise
    // order, and zero if the points are collinear.
    // Source: Jonathan Shewchuk http://www.cs.berkeley.edu/~jrs/meshpapers/robnotes.pdf
    function orient2D(ax, ay, bx, by, cx, cy) {
        return determinant2D(ax - cx, ay - cy, bx - cx, by - cy);
    }

    // Determinant of matrix
    //  | a  b |
    //  | c  d |
    function determinant2D(a, b, c, d) {
        return a * d - b * c;
    }

    // Return id of nearest point to x, y, among x0, y0, x1, y1, ...
    function nearestPoint(x, y, x0, y0) {
        var minIdx = -1,
            minDist = Infinity,
            dist;
        for (var i = 0, j = 2, n = arguments.length; j < n; i++, j += 2) {
            dist = distanceSq(x, y, arguments[j], arguments[j+1]);
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        return minIdx;
    }

    function lineIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
        var den = determinant2D(bx - ax, by - ay, dx - cx, dy - cy);
        var eps = 1e-18;
        var m, p;
        if (den === 0) return null;
        m = orient2D(cx, cy, dx, dy, ax, ay) / den;
        if (den <= eps && den >= -eps) {
            // tiny denominator = low precision; using one of the endpoints as intersection
            p = findEndpointInRange(ax, ay, bx, by, cx, cy, dx, dy);
            if (!p) {
                trace('[lineIntersection()]');
                geom.debugSegmentIntersection([], ax, ay, bx, by, cx, cy, dx, dy);
            }
        } else {
            p = [ax + m * (bx - ax), ay + m * (by - ay)];
        }
        return p;
    }

    function findEndpointInRange(ax, ay, bx, by, cx, cy, dx, dy) {
        var p = null;
        if (!outsideRange(ax, cx, dx) && !outsideRange(ay, cy, dy)) {
            p = [ax, ay];
        } else if (!outsideRange(bx, cx, dx) && !outsideRange(by, cy, dy)) {
            p = [bx, by];
        } else if (!outsideRange(cx, ax, bx) && !outsideRange(cy, ay, by)) {
            p = [cx, cy];
        } else if (!outsideRange(dx, ax, bx) && !outsideRange(dy, ay, by)) {
            p = [dx, dy];
        }
        return p;
    }

    function clampIntersectionPoint(p, ax, ay, bx, by, cx, cy, dx, dy) {
        // Handle intersection points that fall outside the x-y range of either
        // segment by snapping to nearest endpoint coordinate. Out-of-range
        // intersection points can be caused by floating point rounding errors
        // when a segment is vertical or horizontal. This has caused problems when
        // repeatedly applying bbox clipping along the same segment
        var x = p[0],
            y = p[1];
        // assumes that segment ranges intersect
        x = geom.clampToCloseRange(x, ax, bx);
        x = geom.clampToCloseRange(x, cx, dx);
        y = geom.clampToCloseRange(y, ay, by);
        y = geom.clampToCloseRange(y, cy, dy);
        p[0] = x;
        p[1] = y;
    }

    function inside(x, minX, maxX) {
        return x > minX && x < maxX;
    }

    function trace() {
        if (internal.TRACING) {
            internal.logArgs(arguments);
        }
    }

    function distanceSq(ax, ay, bx, by) {
        var dx = ax - bx,
            dy = ay - by;
        return dx * dx + dy * dy;
    }





    function Bounds() {
        if (arguments.length > 0) {
            this.setBounds.apply(this, arguments);
        }
    }

    Bounds.prototype.toString = function() {
        return JSON.stringify({
            xmin: this.xmin,
            xmax: this.xmax,
            ymin: this.ymin,
            ymax: this.ymax
        });
    };

    Bounds.prototype.toArray = function() {
        return this.hasBounds() ? [this.xmin, this.ymin, this.xmax, this.ymax] : [];
    };

    Bounds.prototype.hasBounds = function() {
        return this.xmin <= this.xmax && this.ymin <= this.ymax;
    };

    Bounds.prototype.sameBounds =
        Bounds.prototype.equals = function(bb) {
            return bb && this.xmin === bb.xmin && this.xmax === bb.xmax &&
                this.ymin === bb.ymin && this.ymax === bb.ymax;
        };

    Bounds.prototype.width = function() {
        return (this.xmax - this.xmin) || 0;
    };

    Bounds.prototype.height = function() {
        return (this.ymax - this.ymin) || 0;
    };

    Bounds.prototype.area = function() {
        return this.width() * this.height() || 0;
    };

    Bounds.prototype.empty = function() {
        this.xmin = this.ymin = this.xmax = this.ymax = void 0;
        return this;
    };

    Bounds.prototype.setBounds = function(a, b, c, d) {
        if (arguments.length == 1) {
            // assume first arg is a Bounds or array
            if (utils.isArrayLike(a)) {
                b = a[1];
                c = a[2];
                d = a[3];
                a = a[0];
            } else {
                b = a.ymin;
                c = a.xmax;
                d = a.ymax;
                a = a.xmin;
            }
        }

        this.xmin = a;
        this.ymin = b;
        this.xmax = c;
        this.ymax = d;
        if (a > c || b > d) this.update();
        // error("Bounds#setBounds() min/max reversed:", a, b, c, d);
        return this;
    };


    Bounds.prototype.centerX = function() {
        var x = (this.xmin + this.xmax) * 0.5;
        return x;
    };

    Bounds.prototype.centerY = function() {
        var y = (this.ymax + this.ymin) * 0.5;
        return y;
    };

    Bounds.prototype.containsPoint = function(x, y) {
        if (x >= this.xmin && x <= this.xmax &&
            y <= this.ymax && y >= this.ymin) {
            return true;
        }
        return false;
    };

// intended to speed up slightly bubble symbol detection; could use intersects() instead
// TODO: fix false positive where circle is just outside a corner of the box
    Bounds.prototype.containsBufferedPoint =
        Bounds.prototype.containsCircle = function(x, y, buf) {
            if ( x + buf > this.xmin && x - buf < this.xmax ) {
                if ( y - buf < this.ymax && y + buf > this.ymin ) {
                    return true;
                }
            }
            return false;
        };

    Bounds.prototype.intersects = function(bb) {
        if (bb.xmin <= this.xmax && bb.xmax >= this.xmin &&
            bb.ymax >= this.ymin && bb.ymin <= this.ymax) {
            return true;
        }
        return false;
    };

    Bounds.prototype.contains = function(bb) {
        if (bb.xmin >= this.xmin && bb.ymax <= this.ymax &&
            bb.xmax <= this.xmax && bb.ymin >= this.ymin) {
            return true;
        }
        return false;
    };

    Bounds.prototype.shift = function(x, y) {
        this.setBounds(this.xmin + x,
            this.ymin + y, this.xmax + x, this.ymax + y);
    };

    Bounds.prototype.padBounds = function(a, b, c, d) {
        this.xmin -= a;
        this.ymin -= b;
        this.xmax += c;
        this.ymax += d;
    };

// Rescale the bounding box by a fraction. TODO: implement focus.
// @param {number} pct Fraction of original extents
// @param {number} pctY Optional amount to scale Y
//
    Bounds.prototype.scale = function(pct, pctY) { /*, focusX, focusY*/
        var halfWidth = (this.xmax - this.xmin) * 0.5;
        var halfHeight = (this.ymax - this.ymin) * 0.5;
        var kx = pct - 1;
        var ky = pctY === undefined ? kx : pctY - 1;
        this.xmin -= halfWidth * kx;
        this.ymin -= halfHeight * ky;
        this.xmax += halfWidth * kx;
        this.ymax += halfHeight * ky;
    };

// Return a bounding box with the same extent as this one.
    Bounds.prototype.cloneBounds = // alias so child classes can override clone()
        Bounds.prototype.clone = function() {
            return new Bounds(this.xmin, this.ymin, this.xmax, this.ymax);
        };

    Bounds.prototype.clearBounds = function() {
        this.setBounds(new Bounds());
    };

    Bounds.prototype.mergePoint = function(x, y) {
        if (this.xmin === void 0) {
            this.setBounds(x, y, x, y);
        } else {
            // this works even if x,y are NaN
            if (x < this.xmin)  this.xmin = x;
            else if (x > this.xmax)  this.xmax = x;

            if (y < this.ymin) this.ymin = y;
            else if (y > this.ymax) this.ymax = y;
        }
    };

// expands either x or y dimension to match @aspect (width/height ratio)
// @focusX, @focusY (optional): expansion focus, as a fraction of width and height
    Bounds.prototype.fillOut = function(aspect, focusX, focusY) {
        if (arguments.length < 3) {
            focusX = 0.5;
            focusY = 0.5;
        }
        var w = this.width(),
            h = this.height(),
            currAspect = w / h,
            pad;
        if (isNaN(aspect) || aspect <= 0) {
            // error condition; don't pad
        } else if (currAspect < aspect) { // fill out x dimension
            pad = h * aspect - w;
            this.xmin -= (1 - focusX) * pad;
            this.xmax += focusX * pad;
        } else {
            pad = w / aspect - h;
            this.ymin -= (1 - focusY) * pad;
            this.ymax += focusY * pad;
        }
        return this;
    };

    Bounds.prototype.update = function() {
        var tmp;
        if (this.xmin > this.xmax) {
            tmp = this.xmin;
            this.xmin = this.xmax;
            this.xmax = tmp;
        }
        if (this.ymin > this.ymax) {
            tmp = this.ymin;
            this.ymin = this.ymax;
            this.ymax = tmp;
        }
    };

    Bounds.prototype.transform = function(t) {
        this.xmin = this.xmin * t.mx + t.bx;
        this.xmax = this.xmax * t.mx + t.bx;
        this.ymin = this.ymin * t.my + t.by;
        this.ymax = this.ymax * t.my + t.by;
        this.update();
        return this;
    };

// Returns a Transform object for mapping this onto Bounds @b2
// @flipY (optional) Flip y-axis coords, for converting to/from pixel coords
//
    Bounds.prototype.getTransform = function(b2, flipY) {
        var t = new Transform();
        t.mx = b2.width() / this.width() || 1; // TODO: better handling of 0 w,h
        t.bx = b2.xmin - t.mx * this.xmin;
        if (flipY) {
            t.my = -b2.height() / this.height() || 1;
            t.by = b2.ymax - t.my * this.ymin;
        } else {
            t.my = b2.height() / this.height() || 1;
            t.by = b2.ymin - t.my * this.ymin;
        }
        return t;
    };

    Bounds.prototype.mergeCircle = function(x, y, r) {
        if (r < 0) r = -r;
        this.mergeBounds([x - r, y - r, x + r, y + r]);
    };

    Bounds.prototype.mergeBounds = function(bb) {
        var a, b, c, d;
        if (bb instanceof Bounds) {
            a = bb.xmin, b = bb.ymin, c = bb.xmax, d = bb.ymax;
        } else if (arguments.length == 4) {
            a = arguments[0];
            b = arguments[1];
            c = arguments[2];
            d = arguments[3];
        } else if (bb.length == 4) {
            // assume array: [xmin, ymin, xmax, ymax]
            a = bb[0], b = bb[1], c = bb[2], d = bb[3];
        } else {
            error("Bounds#mergeBounds() invalid argument:", bb);
        }

        if (this.xmin === void 0) {
            this.setBounds(a, b, c, d);
        } else {
            if (a < this.xmin) this.xmin = a;
            if (b < this.ymin) this.ymin = b;
            if (c > this.xmax) this.xmax = c;
            if (d > this.ymax) this.ymax = d;
        }
        return this;
    };


    // An interface for managing a collection of paths.
    // Constructor signatures:
    //
    // ArcCollection(arcs)
    //    arcs is an array of polyline arcs; each arc is an array of points: [[x0, y0], [x1, y1], ... ]
    //
    // ArcCollection(nn, xx, yy)
    //    nn is an array of arc lengths; xx, yy are arrays of concatenated coords;
    function ArcCollection() {
        var _xx, _yy,  // coordinates data
            _ii, _nn,  // indexes, sizes
            _zz, _zlimit = 0, // simplification
            _bb, _allBounds, // bounding boxes
            _arcIter, _filteredArcIter; // path iterators

        if (arguments.length == 1) {
            initLegacyArcs(arguments[0]);  // want to phase this out
        } else if (arguments.length == 3) {
            initXYData.apply(this, arguments);
        } else {
            error("ArcCollection() Invalid arguments");
        }

        function initLegacyArcs(arcs) {
            var xx = [], yy = [];
            var nn = arcs.map(function(points) {
                var n = points ? points.length : 0;
                for (var i=0; i<n; i++) {
                    xx.push(points[i][0]);
                    yy.push(points[i][1]);
                }
                return n;
            });
            initXYData(nn, xx, yy);
        }

        function initXYData(nn, xx, yy) {
            var size = nn.length;
            if (nn instanceof Array) nn = new Uint32Array(nn);
            if (xx instanceof Array) xx = new Float64Array(xx);
            if (yy instanceof Array) yy = new Float64Array(yy);
            _xx = xx;
            _yy = yy;
            _nn = nn;
            _zz = null;
            _zlimit = 0;
            _filteredArcIter = null;

            // generate array of starting idxs of each arc
            _ii = new Uint32Array(size);
            for (var idx = 0, j=0; j<size; j++) {
                _ii[j] = idx;
                idx += nn[j];
            }

            if (idx != _xx.length || _xx.length != _yy.length) {
                error("ArcCollection#initXYData() Counting error");
            }

            initBounds();
            // Pre-allocate some path iterators for repeated use.
            _arcIter = new ArcIter(_xx, _yy);
            return this;
        }

        function initZData(zz) {
            if (!zz) {
                _zz = null;
                _zlimit = 0;
                _filteredArcIter = null;
            } else {
                if (zz.length != _xx.length) error("ArcCollection#initZData() mismatched arrays");
                if (zz instanceof Array) zz = new Float64Array(zz);
                _zz = zz;
                _filteredArcIter = new FilteredArcIter(_xx, _yy, _zz);
            }
        }

        function initBounds() {
            var data = calcArcBounds(_xx, _yy, _nn);
            _bb = data.bb;
            _allBounds = data.bounds;
        }

        function calcArcBounds(xx, yy, nn) {
            var numArcs = nn.length,
                bb = new Float64Array(numArcs * 4),
                bounds = new Bounds(),
                arcOffs = 0,
                arcLen,
                j, b;
            for (var i=0; i<numArcs; i++) {
                arcLen = nn[i];
                if (arcLen > 0) {
                    j = i * 4;
                    b = internal.calcArcBounds(xx, yy, arcOffs, arcLen);
                    bb[j++] = b[0];
                    bb[j++] = b[1];
                    bb[j++] = b[2];
                    bb[j] = b[3];
                    arcOffs += arcLen;
                    bounds.mergeBounds(b);
                }
            }
            return {
                bb: bb,
                bounds: bounds
            };
        }

        this.updateVertexData = function(nn, xx, yy, zz) {
            initXYData(nn, xx, yy);
            initZData(zz || null);
        };

        // Give access to raw data arrays...
        this.getVertexData = function() {
            return {
                xx: _xx,
                yy: _yy,
                zz: _zz,
                bb: _bb,
                nn: _nn,
                ii: _ii
            };
        };

        this.getCopy = function() {
            var copy = new ArcCollection(new Int32Array(_nn), new Float64Array(_xx),
                new Float64Array(_yy));
            if (_zz) {
                copy.setThresholds(new Float64Array(_zz));
                copy.setRetainedInterval(_zlimit);
            }
            return copy;
        };

        function getFilteredPointCount() {
            var zz = _zz, z = _zlimit;
            if (!zz || !z) return this.getPointCount();
            var count = 0;
            for (var i=0, n = zz.length; i<n; i++) {
                if (zz[i] >= z) count++;
            }
            return count;
        }

        function getFilteredVertexData() {
            var len2 = getFilteredPointCount();
            var arcCount = _nn.length;
            var xx2 = new Float64Array(len2),
                yy2 = new Float64Array(len2),
                zz2 = new Float64Array(len2),
                nn2 = new Int32Array(arcCount),
                i=0, i2 = 0,
                n, n2;

            for (var arcId=0; arcId < arcCount; arcId++) {
                n2 = 0;
                n = _nn[arcId];
                for (var end = i+n; i < end; i++) {
                    if (_zz[i] >= _zlimit) {
                        xx2[i2] = _xx[i];
                        yy2[i2] = _yy[i];
                        zz2[i2] = _zz[i];
                        i2++;
                        n2++;
                    }
                }
                if (n2 < 2) error("Collapsed arc"); // endpoints should be z == Infinity
                nn2[arcId] = n2;
            }
            return {
                xx: xx2,
                yy: yy2,
                zz: zz2,
                nn: nn2
            };
        }

        this.getFilteredCopy = function() {
            if (!_zz || _zlimit === 0) return this.getCopy();
            var data = getFilteredVertexData();
            var copy = new ArcCollection(data.nn, data.xx, data.yy);
            copy.setThresholds(data.zz);
            return copy;
        };

        // Return arcs as arrays of [x, y] points (intended for testing).
        this.toArray = function() {
            var arr = [];
            this.forEach(function(iter) {
                var arc = [];
                while (iter.hasNext()) {
                    arc.push([iter.x, iter.y]);
                }
                arr.push(arc);
            });
            return arr;
        };

        this.toJSON = function() {
            return this.toArray();
        };

        // @cb function(i, j, xx, yy)
        this.forEachArcSegment = function(arcId, cb) {
            var fw = arcId >= 0,
                absId = fw ? arcId : ~arcId,
                zlim = this.getRetainedInterval(),
                n = _nn[absId],
                step = fw ? 1 : -1,
                v1 = fw ? _ii[absId] : _ii[absId] + n - 1,
                v2 = v1,
                count = 0;

            for (var j = 1; j < n; j++) {
                v2 += step;
                if (zlim === 0 || _zz[v2] >= zlim) {
                    cb(v1, v2, _xx, _yy);
                    v1 = v2;
                    count++;
                }
            }
            return count;
        };

        // @cb function(i, j, xx, yy)
        this.forEachSegment = function(cb) {
            var count = 0;
            for (var i=0, n=this.size(); i<n; i++) {
                count += this.forEachArcSegment(i, cb);
            }
            return count;
        };

        this.transformPoints = function(f) {
            var xx = _xx, yy = _yy, arcId = -1, n = 0, p;
            for (var i=0, len=xx.length; i<len; i++, n--) {
                while (n === 0) {
                    n = _nn[++arcId];
                }
                p = f(xx[i], yy[i], arcId);
                if (p) {
                    xx[i] = p[0];
                    yy[i] = p[1];
                }
            }
            initBounds();
        };

        // Return an ArcIter object for each path in the dataset
        //
        this.forEach = function(cb) {
            for (var i=0, n=this.size(); i<n; i++) {
                cb(this.getArcIter(i), i);
            }
        };

        // Iterate over arcs with access to low-level data
        //
        this.forEach2 = function(cb) {
            for (var arcId=0, n=this.size(); arcId<n; arcId++) {
                cb(_ii[arcId], _nn[arcId], _xx, _yy, _zz, arcId);
            }
        };

        this.forEach3 = function(cb) {
            var start, end, xx, yy, zz;
            for (var arcId=0, n=this.size(); arcId<n; arcId++) {
                start = _ii[arcId];
                end = start + _nn[arcId];
                xx = _xx.subarray(start, end);
                yy = _yy.subarray(start, end);
                if (_zz) zz = _zz.subarray(start, end);
                cb(xx, yy, zz, arcId);
            }
        };

        // Remove arcs that don't pass a filter test and re-index arcs
        // Return array mapping original arc ids to re-indexed ids. If arr[n] == -1
        // then arc n was removed. arr[n] == m indicates that the arc at n was
        // moved to index m.
        // Return null if no arcs were re-indexed (and no arcs were removed)
        //
        this.filter = function(cb) {
            var map = new Int32Array(this.size()),
                goodArcs = 0,
                goodPoints = 0;
            for (var i=0, n=this.size(); i<n; i++) {
                if (cb(this.getArcIter(i), i)) {
                    map[i] = goodArcs++;
                    goodPoints += _nn[i];
                } else {
                    map[i] = -1;
                }
            }
            if (goodArcs === this.size()) {
                return null;
            } else {
                condenseArcs(map);
                if (goodArcs === 0) {
                    // no remaining arcs
                }
                return map;
            }
        };

        function condenseArcs(map) {
            var goodPoints = 0,
                goodArcs = 0,
                copyElements = utils.copyElements,
                k, arcLen;
            for (var i=0, n=map.length; i<n; i++) {
                k = map[i];
                arcLen = _nn[i];
                if (k > -1) {
                    copyElements(_xx, _ii[i], _xx, goodPoints, arcLen);
                    copyElements(_yy, _ii[i], _yy, goodPoints, arcLen);
                    if (_zz) copyElements(_zz, _ii[i], _zz, goodPoints, arcLen);
                    _nn[k] = arcLen;
                    goodPoints += arcLen;
                    goodArcs++;
                }
            }

            initXYData(_nn.subarray(0, goodArcs), _xx.subarray(0, goodPoints),
                _yy.subarray(0, goodPoints));
            if (_zz) initZData(_zz.subarray(0, goodPoints));
        }

        this.dedupCoords = function() {
            var arcId = 0, i = 0, i2 = 0,
                arcCount = this.size(),
                zz = _zz,
                arcLen, arcLen2;
            while (arcId < arcCount) {
                arcLen = _nn[arcId];
                arcLen2 = internal.dedupArcCoords(i, i2, arcLen, _xx, _yy, zz);
                _nn[arcId] = arcLen2;
                i += arcLen;
                i2 += arcLen2;
                arcId++;
            }
            if (i > i2) {
                initXYData(_nn, _xx.subarray(0, i2), _yy.subarray(0, i2));
                if (zz) initZData(zz.subarray(0, i2));
            }
            return i - i2;
        };

        this.getVertex = function(arcId, nth) {
            var i = this.indexOfVertex(arcId, nth);
            return {
                x: _xx[i],
                y: _yy[i]
            };
        };

        this.indexOfVertex = function(arcId, nth) {
            var absId = arcId < 0 ? ~arcId : arcId,
                len = _nn[absId];
            if (nth < 0) nth = len + nth;
            if (absId != arcId) nth = len - nth - 1;
            if (nth < 0 || nth >= len) error("[ArcCollection] out-of-range vertex id");
            return _ii[absId] + nth;
        };

        // Test whether the vertex at index @idx is the endpoint of an arc
        this.pointIsEndpoint = function(idx) {
            var ii = _ii,
                nn = _nn;
            for (var j=0, n=ii.length; j<n; j++) {
                if (idx === ii[j] || idx === ii[j] + nn[j] - 1) return true;
            }
            return false;
        };

        // Tests if arc endpoints have same x, y coords
        // (arc may still have collapsed);
        this.arcIsClosed = function(arcId) {
            var i = this.indexOfVertex(arcId, 0),
                j = this.indexOfVertex(arcId, -1);
            return i != j && _xx[i] == _xx[j] && _yy[i] == _yy[j];
        };

        // Tests if first and last segments mirror each other
        // A 3-vertex arc with same endpoints tests true
        this.arcIsLollipop = function(arcId) {
            var len = this.getArcLength(arcId),
                i, j;
            if (len <= 2 || !this.arcIsClosed(arcId)) return false;
            i = this.indexOfVertex(arcId, 1);
            j = this.indexOfVertex(arcId, -2);
            return _xx[i] == _xx[j] && _yy[i] == _yy[j];
        };

        this.arcIsDegenerate = function(arcId) {
            var iter = this.getArcIter(arcId);
            var i = 0,
                x, y;
            while (iter.hasNext()) {
                if (i > 0) {
                    if (x != iter.x || y != iter.y) return false;
                }
                x = iter.x;
                y = iter.y;
                i++;
            }
            return true;
        };

        this.getArcLength = function(arcId) {
            return _nn[absArcId(arcId)];
        };

        this.getArcIter = function(arcId) {
            var fw = arcId >= 0,
                i = fw ? arcId : ~arcId,
                iter = _zz && _zlimit ? _filteredArcIter : _arcIter;
            if (i >= _nn.length) {
                error("#getArcId() out-of-range arc id:", arcId);
            }
            return iter.init(_ii[i], _nn[i], fw, _zlimit);
        };

        this.getShapeIter = function(ids) {
            return new ShapeIter(this).init(ids);
        };

        // Add simplification data to the dataset
        // @thresholds is either a single typed array or an array of arrays of removal thresholds for each arc;
        //
        this.setThresholds = function(thresholds) {
            var n = this.getPointCount(),
                zz = null;
            if (!thresholds) {
                // nop
            } else if (thresholds.length == n) {
                zz = thresholds;
            } else if (thresholds.length == this.size()) {
                zz = flattenThresholds(thresholds, n);
            } else {
                error("Invalid threshold data");
            }
            initZData(zz);
            return this;
        };

        function flattenThresholds(arr, n) {
            var zz = new Float64Array(n),
                i = 0;
            arr.forEach(function(arr) {
                for (var j=0, n=arr.length; j<n; i++, j++) {
                    zz[i] = arr[j];
                }
            });
            if (i != n) error("Mismatched thresholds");
            return zz;
        }

        // bake in current simplification level, if any
        this.flatten = function() {
            if (_zlimit > 0) {
                var data = getFilteredVertexData();
                this.updateVertexData(data.nn, data.xx, data.yy);
                _zlimit = 0;
            } else {
                _zz = null;
            }
        };

        this.getRetainedInterval = function() {
            return _zlimit;
        };

        this.setRetainedInterval = function(z) {
            _zlimit = z;
            return this;
        };

        this.getRetainedPct = function() {
            return this.getPctByThreshold(_zlimit);
        };

        this.setRetainedPct = function(pct) {
            if (pct >= 1) {
                _zlimit = 0;
            } else {
                _zlimit = this.getThresholdByPct(pct);
                _zlimit = internal.clampIntervalByPct(_zlimit, pct);
            }
            return this;
        };

        // Return array of z-values that can be removed for simplification
        //
        this.getRemovableThresholds = function(nth) {
            if (!_zz) error("[arcs] Missing simplification data.");
            var skip = nth | 1,
                arr = new Float64Array(Math.ceil(_zz.length / skip)),
                z;
            for (var i=0, j=0, n=this.getPointCount(); i<n; i+=skip) {
                z = _zz[i];
                if (z != Infinity) {
                    arr[j++] = z;
                }
            }
            return arr.subarray(0, j);
        };

        this.getArcThresholds = function(arcId) {
            if (!(arcId >= 0 && arcId < this.size())) {
                error("[arcs] Invalid arc id:", arcId);
            }
            var start = _ii[arcId],
                end = start + _nn[arcId];
            return _zz.subarray(start, end);
        };

        this.getPctByThreshold = function(val) {
            var arr, rank, pct;
            if (val > 0) {
                arr = this.getRemovableThresholds();
                rank = utils.findRankByValue(arr, val);
                pct = arr.length > 0 ? 1 - (rank - 1) / arr.length : 1;
            } else {
                pct = 1;
            }
            return pct;
        };

        this.getThresholdByPct = function(pct) {
            var tmp = this.getRemovableThresholds(),
                rank, z;
            if (tmp.length === 0) { // No removable points
                rank = 0;
            } else {
                rank = Math.floor((1 - pct) * (tmp.length + 2));
            }

            if (rank <= 0) {
                z = 0;
            } else if (rank > tmp.length) {
                z = Infinity;
            } else {
                z = utils.findValueByRank(tmp, rank);
            }
            return z;
        };

        this.arcIntersectsBBox = function(i, b1) {
            var b2 = _bb,
                j = i * 4;
            return b2[j] <= b1[2] && b2[j+2] >= b1[0] && b2[j+3] >= b1[1] && b2[j+1] <= b1[3];
        };

        this.arcIsContained = function(i, b1) {
            var b2 = _bb,
                j = i * 4;
            return b2[j] >= b1[0] && b2[j+2] <= b1[2] && b2[j+1] >= b1[1] && b2[j+3] <= b1[3];
        };

        this.arcIsSmaller = function(i, units) {
            var bb = _bb,
                j = i * 4;
            return bb[j+2] - bb[j] < units && bb[j+3] - bb[j+1] < units;
        };

        // TODO: allow datasets in lat-lng coord range to be flagged as planar
        this.isPlanar = function() {
            return !internal.probablyDecimalDegreeBounds(this.getBounds());
        };

        this.size = function() {
            return _ii && _ii.length || 0;
        };

        this.getPointCount = function() {
            return _xx && _xx.length || 0;
        };

        this.getBounds = function() {
            return _allBounds.clone();
        };

        this.getSimpleShapeBounds = function(arcIds, bounds) {
            bounds = bounds || new Bounds();
            for (var i=0, n=arcIds.length; i<n; i++) {
                this.mergeArcBounds(arcIds[i], bounds);
            }
            return bounds;
        };

        this.getSimpleShapeBounds2 = function(arcIds, arr) {
            var bbox = arr || [],
                bb = _bb,
                id = absArcId(arcIds[0]) * 4;
            bbox[0] = bb[id];
            bbox[1] = bb[++id];
            bbox[2] = bb[++id];
            bbox[3] = bb[++id];
            for (var i=1, n=arcIds.length; i<n; i++) {
                id = absArcId(arcIds[i]) * 4;
                if (bb[id] < bbox[0]) bbox[0] = bb[id];
                if (bb[++id] < bbox[1]) bbox[1] = bb[id];
                if (bb[++id] > bbox[2]) bbox[2] = bb[id];
                if (bb[++id] > bbox[3]) bbox[3] = bb[id];
            }
            return bbox;
        };

        this.getMultiShapeBounds = function(shapeIds, bounds) {
            bounds = bounds || new Bounds();
            if (shapeIds) { // handle null shapes
                for (var i=0, n=shapeIds.length; i<n; i++) {
                    this.getSimpleShapeBounds(shapeIds[i], bounds);
                }
            }
            return bounds;
        };

        this.mergeArcBounds = function(arcId, bounds) {
            if (arcId < 0) arcId = ~arcId;
            var offs = arcId * 4;
            bounds.mergeBounds(_bb[offs], _bb[offs+1], _bb[offs+2], _bb[offs+3]);
        };
    }

    ArcCollection.prototype.inspect = function() {
        var n = this.getPointCount(), str;
        if (n < 50) {
            str = JSON.stringify(this.toArray());
        } else {
            str = '[ArcCollection (' + this.size() + ')]';
        }
        return str;
    };

    // Constructor takes arrays of coords: xx, yy, zz (optional)
    //
    // Iterate over the points of an arc
    // properties: x, y
    // method: hasNext()
    // usage:
    //   while (iter.hasNext()) {
    //     iter.x, iter.y; // do something w/ x & y
    //   }
    //
    function ArcIter(xx, yy) {
        this._i = 0;
        this._n = 0;
        this._inc = 1;
        this._xx = xx;
        this._yy = yy;
        this.i = 0;
        this.x = 0;
        this.y = 0;
    }

    ArcIter.prototype.init = function(i, len, fw) {
        if (fw) {
            this._i = i;
            this._inc = 1;
        } else {
            this._i = i + len - 1;
            this._inc = -1;
        }
        this._n = len;
        return this;
    };

    ArcIter.prototype.hasNext = function() {
        var i = this._i;
        if (this._n > 0) {
            this._i = i + this._inc;
            this.x = this._xx[i];
            this.y = this._yy[i];
            this.i = i;
            this._n--;
            return true;
        }
        return false;
    };


    var api = {};
    var internal = {
        VERSION: VERSION, // export version
        LOGGING: false,
        QUIET: false,
        TRACING: false,
        VERBOSE: false,
        defs: {}
    };

    internal.calcArcBounds = function(xx, yy, start, len) {
        var i = start | 0,
            n = isNaN(len) ? xx.length - i : len + i,
            x, y, xmin, ymin, xmax, ymax;
        if (n > 0) {
            xmin = xmax = xx[i];
            ymin = ymax = yy[i];
        }
        for (i++; i<n; i++) {
            x = xx[i];
            y = yy[i];
            if (x < xmin) xmin = x;
            if (x > xmax) xmax = x;
            if (y < ymin) ymin = y;
            if (y > ymax) ymax = y;
        }
        return [xmin, ymin, xmax, ymax];
    };

    internal.findSegmentIntersections = (function() {

        // Re-use buffer for temp data -- Chrome's gc starts bogging down
        // if large buffers are repeatedly created.
        var buf;
        function getUint32Array(count) {
            var bytes = count * 4;
            if (!buf || buf.byteLength < bytes) {
                buf = new ArrayBuffer(bytes);
            }
            return new Uint32Array(buf, 0, count);
        }

        return function(arcs) {
            var bounds = arcs.getBounds(),
                // TODO: handle spherical bounds
                spherical = !arcs.isPlanar() &&
                    containsBounds(internal.getWorldBounds(), bounds.toArray()),
                ymin = bounds.ymin,
                yrange = bounds.ymax - ymin,
                stripeCount = internal.calcSegmentIntersectionStripeCount(arcs),
                stripeSizes = new Uint32Array(stripeCount),
                stripeId = stripeCount > 1 ? multiStripeId : singleStripeId,
                i, j;

            function multiStripeId(y) {
                return Math.floor((stripeCount-1) * (y - ymin) / yrange);
            }

            function singleStripeId(y) {return 0;}

            // Count segments in each stripe
            arcs.forEachSegment(function(id1, id2, xx, yy) {
                var s1 = stripeId(yy[id1]),
                    s2 = stripeId(yy[id2]);
                while (true) {
                    stripeSizes[s1] = stripeSizes[s1] + 2;
                    if (s1 == s2) break;
                    s1 += s2 > s1 ? 1 : -1;
                }
            });

            // Allocate arrays for segments in each stripe
            var stripeData = getUint32Array(utils.sum(stripeSizes)),
                offs = 0;
            var stripes = [];
            utils.forEach(stripeSizes, function(stripeSize) {
                var start = offs;
                offs += stripeSize;
                stripes.push(stripeData.subarray(start, offs));
            });
            // Assign segment ids to each stripe
            utils.initializeArray(stripeSizes, 0);

            arcs.forEachSegment(function(id1, id2, xx, yy) {
                var s1 = stripeId(yy[id1]),
                    s2 = stripeId(yy[id2]),
                    count, stripe;
                while (true) {
                    count = stripeSizes[s1];
                    stripeSizes[s1] = count + 2;
                    stripe = stripes[s1];
                    stripe[count] = id1;
                    stripe[count+1] = id2;
                    if (s1 == s2) break;
                    s1 += s2 > s1 ? 1 : -1;
                }
            });

            // Detect intersections among segments in each stripe.
            var raw = arcs.getVertexData(),
                intersections = [],
                arr;
            for (i=0; i<stripeCount; i++) {
                arr = internal.intersectSegments(stripes[i], raw.xx, raw.yy);
                for (j=0; j<arr.length; j++) {
                    intersections.push(arr[j]);
                }
            }
            return internal.dedupIntersections(intersections);
        };
    })();

    internal.getWorldBounds = function(e) {
        e = utils.isFiniteNumber(e) ? e : 1e-10;
        return [-180 + e, -90 + e, 180 - e, 90 - e];
    };

    internal.probablyDecimalDegreeBounds = function(b) {
        var world = internal.getWorldBounds(-1), // add a bit of excess
            bbox = (b instanceof Bounds) ? b.toArray() : b;
        return containsBounds(world, bbox);
    };

    internal.calcSegmentIntersectionStripeCount = function(arcs) {
        var yrange = arcs.getBounds().height(),
            segLen = internal.getAvgSegment2(arcs)[1],
            count = 1;
        if (segLen > 0 && yrange > 0) {
            count = Math.ceil(yrange / segLen / 20);
        }
        return count || 1;
    };

    // Return average magnitudes of dx, dy (with simplification)
    internal.getAvgSegment2 = function(arcs) {
        var dx = 0, dy = 0;
        var count = arcs.forEachSegment(function(i, j, xx, yy) {
            dx += Math.abs(xx[i] - xx[j]);
            dy += Math.abs(yy[i] - yy[j]);
        });
        return [dx / count || 0, dy / count || 0];
    };

    // Find intersections among a group of line segments
    //
    // TODO: handle case where a segment starts and ends at the same point (i.e. duplicate coords);
    //
    // @ids: Array of indexes: [s0p0, s0p1, s1p0, s1p1, ...] where xx[sip0] <= xx[sip1]
    // @xx, @yy: Arrays of x- and y-coordinates
    //
    internal.intersectSegments = function(ids, xx, yy) {
        var lim = ids.length - 2,
            intersections = [];
        var s1p1, s1p2, s2p1, s2p2,
            s1p1x, s1p2x, s2p1x, s2p2x,
            s1p1y, s1p2y, s2p1y, s2p2y,
            hit, seg1, seg2, i, j;

        // Sort segments by xmin, to allow efficient exclusion of segments with
        // non-overlapping x extents.
        internal.sortSegmentIds(xx, ids); // sort by ascending xmin

        i = 0;
        while (i < lim) {
            s1p1 = ids[i];
            s1p2 = ids[i+1];
            s1p1x = xx[s1p1];
            s1p2x = xx[s1p2];
            s1p1y = yy[s1p1];
            s1p2y = yy[s1p2];
            // count++;

            j = i;
            while (j < lim) {
                j += 2;
                s2p1 = ids[j];
                s2p1x = xx[s2p1];

                if (s1p2x < s2p1x) break; // x extent of seg 2 is greater than seg 1: done with seg 1
                //if (s1p2x <= s2p1x) break; // this misses point-segment intersections when s1 or s2 is vertical

                s2p1y = yy[s2p1];
                s2p2 = ids[j+1];
                s2p2x = xx[s2p2];
                s2p2y = yy[s2p2];

                // skip segments with non-overlapping y ranges
                if (s1p1y >= s2p1y) {
                    if (s1p1y > s2p2y && s1p2y > s2p1y && s1p2y > s2p2y) continue;
                } else {
                    if (s1p1y < s2p2y && s1p2y < s2p1y && s1p2y < s2p2y) continue;
                }

                // skip segments that are adjacent in a path (optimization)
                // TODO: consider if this eliminates some cases that should
                // be detected, e.g. spikes formed by unequal segments
                if (s1p1 == s2p1 || s1p1 == s2p2 || s1p2 == s2p1 || s1p2 == s2p2) {
                    continue;
                }

                // test two candidate segments for intersection
                hit = segmentIntersection(s1p1x, s1p1y, s1p2x, s1p2y,
                    s2p1x, s2p1y, s2p2x, s2p2y);
                if (hit) {
                    seg1 = [s1p1, s1p2];
                    seg2 = [s2p1, s2p2];
                    intersections.push(internal.formatIntersection(hit, seg1, seg2, xx, yy));
                    if (hit.length == 4) {
                        // two collinear segments may have two endpoint intersections
                        intersections.push(internal.formatIntersection(hit.slice(2), seg1, seg2, xx, yy));
                    }
                }
            }
            i += 2;
        }
        return intersections;

        // @p is an [x, y] location along a segment defined by ids @id1 and @id2
        // return array [i, j] where i and j are the same endpoint ids with i <= j
        // if @p coincides with an endpoint, return the id of that endpoint twice
        function getEndpointIds(id1, id2, p) {
            var i = id1 < id2 ? id1 : id2,
                j = i === id1 ? id2 : id1;
            if (xx[i] == p[0] && yy[i] == p[1]) {
                j = i;
            } else if (xx[j] == p[0] && yy[j] == p[1]) {
                i = j;
            }
            return [i, j];
        }
    };

    // @xx array of x coords
    // @ids an array of segment endpoint ids [a0, b0, a1, b1, ...]
    // Sort @ids in place so that xx[a(n)] <= xx[b(n)] and xx[a(n)] <= xx[a(n+1)]
    internal.sortSegmentIds = function(xx, ids) {
        internal.orderSegmentIds(xx, ids);
        internal.quicksortSegmentIds(xx, ids, 0, ids.length-2);
    };

    internal.orderSegmentIds = function(xx, ids, spherical) {
        function swap(i, j) {
            var tmp = ids[i];
            ids[i] = ids[j];
            ids[j] = tmp;
        }
        for (var i=0, n=ids.length; i<n; i+=2) {
            if (xx[ids[i]] > xx[ids[i+1]]) {
                swap(i, i+1);
            }
        }
    };

    internal.insertionSortSegmentIds = function(arr, ids, start, end) {
        var id, id2;
        for (var j = start + 2; j <= end; j+=2) {
            id = ids[j];
            id2 = ids[j+1];
            for (var i = j - 2; i >= start && arr[id] < arr[ids[i]]; i-=2) {
                ids[i+2] = ids[i];
                ids[i+3] = ids[i+1];
            }
            ids[i+2] = id;
            ids[i+3] = id2;
        }
    };

    internal.quicksortSegmentIds = function (a, ids, lo, hi) {
        var i = lo,
            j = hi,
            pivot, tmp;
        while (i < hi) {
            pivot = a[ids[(lo + hi >> 2) << 1]]; // avoid n^2 performance on sorted arrays
            while (i <= j) {
                while (a[ids[i]] < pivot) i+=2;
                while (a[ids[j]] > pivot) j-=2;
                if (i <= j) {
                    tmp = ids[i];
                    ids[i] = ids[j];
                    ids[j] = tmp;
                    tmp = ids[i+1];
                    ids[i+1] = ids[j+1];
                    ids[j+1] = tmp;
                    i+=2;
                    j-=2;
                }
            }

            if (j - lo < 40) internal.insertionSortSegmentIds(a, ids, lo, j);
            else internal.quicksortSegmentIds(a, ids, lo, j);
            if (hi - i < 40) {
                internal.insertionSortSegmentIds(a, ids, i, hi);
                return;
            }
            lo = i;
            j = hi;
        }
    };

    internal.dedupIntersections = function(arr) {
        var index = {};
        return arr.filter(function(o) {
            var key = internal.getIntersectionKey(o);
            if (key in index) {
                return false;
            }
            index[key] = true;
            return true;
        });
    };

    // Get an indexable key from an intersection object
    // Assumes that vertex ids of o.a and o.b are sorted
    internal.getIntersectionKey = function(o) {
        return o.a.join(',') + ';' + o.b.join(',');
    };

    internal.formatIntersection = function(xy, s1, s2, xx, yy) {
        var x = xy[0],
            y = xy[1],
            a, b;
        s1 = internal.formatIntersectingSegment(x, y, s1[0], s1[1], xx, yy);
        s2 = internal.formatIntersectingSegment(x, y, s2[0], s2[1], xx, yy);
        a = s1[0] < s2[0] ? s1 : s2;
        b = a == s1 ? s2 : s1;
        return {x: x, y: y, a: a, b: b};
    };

    internal.formatIntersectingSegment = function(x, y, id1, id2, xx, yy) {
        var i = id1 < id2 ? id1 : id2,
            j = i === id1 ? id2 : id1;
        if (xx[i] == x && yy[i] == y) {
            j = i;
        } else if (xx[j] == x && yy[j] == y) {
            i = j;
        }
        return [i, j];
    };

    api.internal = internal;

    // Expose internal objects for testing
    utils.extend(api.internal, {
        ArcCollection: ArcCollection,
        ArcIter: ArcIter
    });

    if (typeof define === "function" && define.amd) {
        //define("mapshaper", api);
        define([], function() {
            return api;
        });
    } else if (typeof module === "object" && module.exports) {
        module.exports = api;
    } else if (window) {
        window.mapshaper = api;
    }
}());