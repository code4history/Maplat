define(["ol3"], function(ol) {
    // スマホタッチで中間ズームを許す
    ol.interaction.PinchZoom.handleUpEvent_ = function(mapBrowserEvent) {
        if (this.targetPointers.length < 2) {
            var map = mapBrowserEvent.map;
            var view = map.getView();
            view.setHint(ol.View.Hint.INTERACTING, -1);
            //var resolution = view.getResolution();
            // Zoom to final resolution, with an animation, and provide a
            // direction not to zoom out/in if user was pinching in/out.
            // Direction is > 0 if pinching out, and < 0 if pinching in.
            //var direction = this.lastScaleDelta_ - 1;
            //ol.interaction.Interaction.zoom(map, view, resolution,
            //    this.anchor_, this.duration_, direction);
            return false;
        } else {
            return true;
        }
    };

    ol.View.prototype.getDecimalZoom = function() {
        var offset;
        var resolution = this.getResolution();

        offset = Math.log(this.maxResolution_ / resolution) / Math.log(2);
        return offset !== undefined ? this.minZoom_ + offset : offset;
    };

    ol.control.CustomControl = function(opt_options) {

        var options = opt_options || {};

        var button = document.createElement('button');
        button.innerHTML = options.character;

        button.addEventListener('click', options.callback, false);
        button.addEventListener('touchstart', options.callback, false);

        var element = document.createElement('div');
        element.className = options.cls + ' ol-unselectable ol-control';
        element.appendChild(button);

        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });

    };
    ol.inherits(ol.control.CustomControl, ol.control.Control);

    ol.control.CompassRotate = function(opt_options) {
        var options = opt_options || {};
        options.autoHide = false;
        var span = document.createElement('span');
        span.innerHTML = '<i class="fa fa-compass fa-lg ol-compass-fa"></i>';
        options.label = span;
        options.render = function(mapEvent) {
            var frameState = mapEvent.frameState;
            if (!frameState) {
                return;
            }
            var view = this.getMap().getView();
            var rotation = frameState.viewState.rotation;
            var center   = view.getCenter();
            var zoom     = view.getDecimalZoom();
            if (rotation != this.rotation_ || center[0] != this.center_[0] || center[1] != this.center_[1] || zoom != this.zoom_) {
                var contains = this.element.classList.contains("no_rotation");
                if (!contains && rotation === 0) {
                    this.element.classList.add("no_rotation");
                } else if (contains && rotation !== 0) {
                    this.element.classList.remove("no_rotation");
                }
                var self = this;
                var source = this.getMap().getLayers().item(0).getSource();
                source.size2MercsAsync().then(function(mercs){
                    var rot = source.mercs2MercRotation(mercs);
                    var transform = 'rotate(' + rot + 'rad)';
                    self.label_.style.msTransform = transform;
                    self.label_.style.webkitTransform = transform;
                    self.label_.style.transform = transform;
                });
            }
            this.rotation_ = rotation;
            this.center_   = center;
            this.zoom_     = zoom;
        };
        ol.control.Rotate.call(this, options);
        this.center_ = [];
        this.zoom_ = undefined;
    };
    ol.inherits(ol.control.CompassRotate, ol.control.Rotate);

    ol.const = ol.const ? ol.const : {};
    ol.const.MERC_MAX = 20037508.342789244;
    ol.const.MERC_CROSSMATRIX = [
        [ 0.0, 0.0],
        [ 0.0, 1.0],
        [ 1.0, 0.0],
        [ 0.0,-1.0],
        [-1.0, 0.0]
    ];

    var gpsStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'parts/bluedot.png'
        }))
    });
    var accCircleStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: [128,128,256,0.2]
        }),
        stroke: new ol.style.Stroke({
            color: [128,128,256,1.0],
            width: 3
        })
    });
    var markerDefaultStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1.0],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'parts/defaultpin.png'
        }))
    });

    ol.source.setCustomFunction = function(target) {
        target.prototype.getMap = function() {
            if (this._map) {
                return this._map;
            }

            var map = this._map = new ol.MaplatMap({
                gps_callback : this._gps_callback,
                home_callback : this._home_callback,
                source : this,
                div : this.map_option.div,
                center : this.map_option.default_center,
                zoom : this.map_option.default_zoom,
                rotation : this.map_option.default_rotation
            });

            /*var self = this;
            this._map.on('click', function(evt) {
                var stringifyFunc = ol.coordinate.createStringXY(8);
                var coordinate = evt.coordinate;
                self.xy2MercAsync(coordinate).then(function(values){
                    var outstr = stringifyFunc(values);//ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326"));
                    console.log(outstr);
                    outstr = stringifyFunc(ol.proj.transform(values, "EPSG:3857", "EPSG:4326"));
                    console.log(outstr);
                    self.merc2XyAsync(values).then(function(values2){
                        var outstr = stringifyFunc(values2);
                        console.log(outstr);
                    });
                });
                var promise = self.size2MercsAsync(coordinate);
                promise.then(function(vals){
                    console.log("########");
                    console.log(vals);
                    promise2 = self.mercs2SizeAsync(vals);
                    promise2.then(function(vals2){
                        console.log("********");
                        console.log(vals2);  
                    });
                });


                var stringifyFunc = ol.coordinate.createStringXY(8);//initPrecision);
                var outstr = stringifyFunc(coordinate);//ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326"));
                console.log(outstr);
            });*/

            return this._map;
        };

        target.prototype.getRadius = function(size) {
            var radius = Math.floor(Math.min(size[0],size[1]) / 4);
            var zoom = this._map.getView().getDecimalZoom();
            var ratio = radius * ol.const.MERC_MAX / 128 / Math.pow(2,zoom);
            return ratio;
        };

        target.prototype.mercsFromGivenZoom = function(center, zoom) {
            var size  = this._map.getSize();
            var pixel = Math.floor(Math.min(size[0],size[1]) / 4);

            var delta = pixel * ol.const.MERC_MAX / 128 / Math.pow(2,zoom);
            var cross = ol.const.MERC_CROSSMATRIX.map(function(xy){
                return [xy[0]*delta+center[0],xy[1]*delta+center[1]];
            });
            return cross;
        };

        target.prototype.mercsFromGPSValue = function(lnglat, acc) {
            var merc = ol.proj.transform(lnglat, "EPSG:4326", "EPSG:3857");
            var latrad = lnglat[1] * Math.PI / 180;
            var delta = acc / Math.cos(latrad);
            var cross = ol.const.MERC_CROSSMATRIX.map(function(xy){
                return [xy[0]*delta+merc[0],xy[1]*delta+merc[1]];
            });
            return cross;
        };

        target.prototype.rotateMatrix = function(xys) {
            var theta = 1.0 * this._map.getView().getRotation();
            var result = [];
            for (var i=0;i<xys.length;i++) {
                var xy = xys[i];
                var x = xy[0] * Math.cos(theta) - xy[1] * Math.sin(theta);
                var y = xy[0] * Math.sin(theta) + xy[1] * Math.cos(theta);
                result.push([x,y]);
            }
            return result;
        }

        target.prototype.size2Xys = function(center) {
            if (!center) {
                center = this._map.getView().getCenter();
            }
            var size   = this._map.getSize();
            var radius = this.getRadius(size);
            var crossDelta = this.rotateMatrix(ol.const.MERC_CROSSMATRIX);
            var cross = crossDelta.map(function(xy){
                return [xy[0]*radius+center[0],xy[1]*radius+center[1]];
            });
            cross.push(size);
            return cross;
        };

        target.prototype.size2MercsAsync = function(center) {
            var cross = this.size2Xys(center);
            var self = this;
            var promises = cross.map(function(val, index) {
                if (index == 5) return val;
                return self.xy2MercAsync(val);
            });
            return Promise.all(promises);
        };

        target.prototype.mercs2SizeAsync = function(mercs) {
            var self = this;
            var promises = mercs.map(function(merc,index) {
                if (index == 5) return merc;
                return self.merc2XyAsync(merc);
            });
            return Promise.all(promises).then(function(xys){
                var size = self.xys2Size(xys);
                return size;
            });
        };

        target.prototype.xys2Size = function(xys) {
            var center = xys[0];
            var size   = xys[5];
            var nesw   = xys.slice(1,5);
            var neswDelta = nesw.map(function(val){
                return [val[0] - center[0],val[1] - center[1]];
            });
            var normal = [[0.0,1.0],[1.0,0.0],[0.0,-1.0],[-1.0,0.0]];
            var abss = 0;
            var cosx = 0;
            var sinx = 0;
            for (var i = 0; i < 4; i++) {
                var delta = neswDelta[i];
                var norm  = normal[i];
                var abs   = Math.sqrt(Math.pow(delta[0], 2) + Math.pow(delta[1], 2));
                abss     += abs;
                var outer = delta[0] * norm[1] - delta[1] * norm[0];
                var inner = Math.acos((delta[0] * norm[0] + delta[1] * norm[1]) / abs);
                var theta = outer > 0.0 ? -1.0 * inner : inner;
                cosx     += Math.cos(theta);
                sinx     += Math.sin(theta);
            }
            var scale = abss / 4.0;
            var omega = Math.atan2(sinx, cosx);

            if (!size) size = this._map.getSize();
            var radius = Math.floor(Math.min(size[0],size[1]) / 4);
            var zoom = Math.log(radius * ol.const.MERC_MAX / 128 / scale) / Math.log(2);

            return [center,zoom,omega];
        }

        target.prototype.mercs2MercRotation = function(xys) {
            var center = xys[0];
            var size   = xys[5];
            var nesw   = xys.slice(1,5);
            var neswDelta = nesw.map(function(val){
                return [val[0] - center[0],val[1] - center[1]];
            });
            var normal = [[0.0,1.0],[1.0,0.0],[0.0,-1.0],[-1.0,0.0]];
            var abss = 0;
            var cosx = 0;
            var sinx = 0;
            for (var i = 0; i < 4; i++) {
                var delta = neswDelta[i];
                var norm  = normal[i];
                var abs   = Math.sqrt(Math.pow(delta[0], 2) + Math.pow(delta[1], 2));
                abss     += abs;
                var outer = delta[0] * norm[1] - delta[1] * norm[0];
                var inner = Math.acos((delta[0] * norm[0] + delta[1] * norm[1]) / abs);
                var theta = outer > 0.0 ? -1.0 * inner : inner;
                cosx     += Math.cos(theta);
                sinx     += Math.sin(theta);
            }
            var scale = abss / 4.0;
            var omega = Math.atan2(sinx, cosx);

            return omega;
        }

        target.prototype.setGPSCallback = function(func) {
            this._gps_callback = func;
        }
    };
    ol.source.setCustomInitialize = function(self, options) {
        self.sourceID = options.sourceID;
        self.map_option = options.map_option || {};
        self._gps_callback = options.gps_callback || function () {};
        self._home_callback = options.home_callback || function () {};
    }

    ol.source.nowMap = function(opt_options) {
        var options = opt_options || {};
        ol.source.OSM.call(this, options);
        ol.source.setCustomInitialize(this, options);
    };
    ol.inherits(ol.source.nowMap, ol.source.OSM);
    ol.source.nowMap.createAsync = function(options) {
        var promise = new Promise(function(resolve, reject) {
            var obj = new ol.source.nowMap(options);
            resolve(obj);
        });
        return promise;
    };
    ol.source.setCustomFunction(ol.source.nowMap);
    ol.source.nowMap.prototype.xy2MercAsync = function(xy) {
        var promise = new Promise(function(resolve, reject) {
            resolve(xy);    
        });
        return promise;        
    };
    ol.source.nowMap.prototype.merc2XyAsync = function(merc) {
        var promise = new Promise(function(resolve, reject) {
            resolve(merc);            
        });
        return promise;
    };
    ol.source.tmsMap = function(opt_options) {
        var options = opt_options || {};
        ol.source.nowMap.call(this, options);
    };
    ol.inherits(ol.source.tmsMap, ol.source.nowMap);
    ol.source.tmsMap.createAsync = function(options) {
        var promise = new Promise(function(resolve, reject) {
            var obj = new ol.source.tmsMap(options);
            resolve(obj);
        });
        return promise;
    };

    ol.MaplatMap = function(opt_options) {
        opt_options = opt_options || {};
        this._gps_source = new ol.source.Vector({
            "wrapX" : false
        });
        var vectorLayer = new ol.layer.Vector({
            source: this._gps_source
        });

        this._marker_source = new ol.source.Vector({
            "wrapX" : false
        });
        var markerLayer = new ol.layer.Vector({
            source: this._marker_source
        });

        var overlayLayer = this._overlay_group = new ol.layer.Group();

        var options =  {
            controls: [
                new ol.control.Attribution(),
                new ol.control.CompassRotate(),
                new ol.control.Zoom(),
                new ol.control.CustomControl({
                    character: '<i class="fa fa-crosshairs fa-lg"></i>',
                    cls: "gps",
                    callback: opt_options.gps_callback
                }),
                new ol.control.CustomControl({
                    character: '<i class="fa fa-home fa-lg"></i>',
                    cls: "home",
                    callback: opt_options.home_callback
                })
            ],
            layers: [
                new ol.layer.Tile({
                    source: opt_options.source
                }),
                overlayLayer,
                vectorLayer,
                markerLayer
            ],
            target: opt_options.div,
            view: new ol.View({
                center: opt_options.default_center || [0,0],
                zoom: opt_options.default_zoom || 2,
                rotation: opt_options.default_rotation || 0
            })
        };

        ol.Map.call(this, options);
    };
    ol.inherits(ol.MaplatMap, ol.Map);

    ol.MaplatMap.prototype.setGPSPosition = function(xy, rad) {
        var src = this._gps_source;
        src.clear();
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(xy)
        });
        iconFeature.setStyle(gpsStyle);
        var circle = new ol.Feature({
            geometry: new ol.geom.Circle(xy, rad)
        });
        circle.setStyle(accCircleStyle);
        src.addFeature(iconFeature);
        src.addFeature(circle);
    };

    ol.MaplatMap.prototype.setMarker = function(xy, data, markerStyle) {
        var src = this._marker_source;
        data['geometry'] = new ol.geom.Point(xy);
        var iconFeature = new ol.Feature(data);
        if (!markerStyle) markerStyle = markerDefaultStyle;
        iconFeature.setStyle(markerStyle);
        src.addFeature(iconFeature);
    };

    ol.MaplatMap.prototype.exchangeSource = function (source) {
        var layers = this.getLayers();
        var layer  = layers.item(0);
        layer.setSource(source);
        source._map = this;
    };

    ol.MaplatMap.prototype.setLayer = function (source) {
        var layers = this._overlay_group;
        layers.clear();
        if (source) {
            var layer = new ol.layer.Tile({
                source: source
            });
            layers.push(layer);
        }
    };

    ol.MathEx = {};

    ol.MathEx.randomFromCenter = function(center, pow) {
        return center + (Math.random() - 0.5) * pow;
    };

    ol.MathEx.recursiveRound = function(val, decimal) {
        if (val instanceof Array) return val.map(function(item){return ol.MathEx.recursiveRound(item,decimal);});
        var dec_val = Math.pow(10,decimal);
        return Math.round(val * dec_val) / dec_val;
    };

    ol.MathEx.getDistance = function(lnglat1, lnglat2) {
        function radians(deg){
            return deg * Math.PI / 180;
        }

        return 6378.14 * Math.acos(Math.cos(radians(lnglat1[1]))*
                Math.cos(radians(lnglat2[1]))*
                Math.cos(radians(lnglat2[0])-radians(lnglat1[0]))+
                Math.sin(radians(lnglat1[1]))*
                Math.sin(radians(lnglat2[1])));
    };

    return ol;
});