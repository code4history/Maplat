define(['ol3', 'aigle'], function(ol, Promise) {
    // スマホタッチで中間ズームを許す
    ol.interaction.PinchZoom.handleUpEvent_ = function(mapBrowserEvent) {
        if (this.targetPointers.length < 2) {
            var map = mapBrowserEvent.map;
            var view = map.getView();
            view.setHint(ol.ViewHint.INTERACTING, -1);
            // var resolution = view.getResolution();
            // Zoom to final resolution, with an animation, and provide a
            // direction not to zoom out/in if user was pinching in/out.
            // Direction is > 0 if pinching out, and < 0 if pinching in.
            // var direction = this.lastScaleDelta_ - 1;
            // ol.interaction.Interaction.zoom(map, view, resolution,
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

    ol.control.CustomControl = function(optOptions) {
        var options = optOptions || {};

        var button = document.createElement('button');
        button.setAttribute('type', 'button');
        var span = document.createElement('span');
        span.innerHTML = options.character;
        button.appendChild(span);

        ol.events.listen(button, ol.events.EventType.CLICK,
            options.callback, this);

        var element = document.createElement('div');
        element.className = options.cls + ' ol-unselectable ol-control';
        element.appendChild(button);

        ol.control.Control.call(this, {
            element: element,
            target: options.target,
            render: options.render
        });
    };
    ol.inherits(ol.control.CustomControl, ol.control.Control);

    ol.control.GoHome = function(optOptions) {
        var options = optOptions || {};
        options.character = '<i class="fa fa-home fa-lg"></i>';
        options.cls = 'home';
        var self = this;
        options.callback = function() {
            var source = self.getMap().getLayers().item(0).getSource();
            source.goHome();
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.GoHome, ol.control.CustomControl);

    ol.control.SetGPS = function(optOptions) {
        var options = optOptions || {};
        options.character = '<i class="fa fa-crosshairs fa-lg"></i>';
        options.cls = 'gps';
        var self = this;
        options.render = function(mapEvent) {
            var frameState = mapEvent.frameState;
            if (!frameState) {
                return;
            }
            var map = this.getMap();
            if (map.geolocation) {
                var tracking = map.geolocation.getTracking();
                var receiving = self.element.classList.contains('receiving_gps');
                if (receiving && !tracking) {
                    this.element.classList.remove('receiving_gps');
                } else if (!receiving && tracking) {
                    this.element.classList.add('receiving_gps');
                }
            }
        };
        options.callback = function() {
            var receiving = self.element.classList.contains('receiving_gps');
            var map = self.getMap();

            map.handleGPS(!receiving);
            if (receiving) {
                self.element.classList.remove('receiving_gps');
            } else {
                self.element.classList.add('receiving_gps');
            }
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.SetGPS, ol.control.CustomControl);

    ol.control.CompassRotate = function(optOptions) {
        var options = optOptions || {};
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
            var center = view.getCenter();
            var zoom = view.getDecimalZoom();
            if (rotation != this.rotation_ || center[0] != this.center_[0] || center[1] != this.center_[1] || zoom != this.zoom_) {
                var contains = this.element.classList.contains('no_rotation');
                if (!contains && rotation === 0) {
                    this.element.classList.add('no_rotation');
                } else if (contains && rotation !== 0) {
                    this.element.classList.remove('no_rotation');
                }
                var self = this;
                var source = this.getMap().getLayers().item(0).getSource();
                if (!source) {
                    var transform = 'rotate(0rad)';
                    self.label_.style.msTransform = transform;
                    self.label_.style.webkitTransform = transform;
                    self.label_.style.transform = transform;
                    return;
                }
                source.size2MercsAsync().then(function(mercs) {
                    var rot = source.mercs2MercRotation(mercs);
                    var transform = 'rotate(' + rot + 'rad)';
                    self.label_.style.msTransform = transform;
                    self.label_.style.webkitTransform = transform;
                    self.label_.style.transform = transform;
                });
            }
            this.rotation_ = rotation;
            this.center_ = center;
            this.zoom_ = zoom;
        };
        ol.control.Rotate.call(this, options);
        this.center_ = [];
        this.zoom_ = undefined;
    };
    ol.inherits(ol.control.CompassRotate, ol.control.Rotate);

    ol.const = ol.const ? ol.const : {};
    ol.const.MERC_MAX = 20037508.342789244;
    ol.const.MERC_CROSSMATRIX = [
        [0.0, 0.0],
        [0.0, 1.0],
        [1.0, 0.0],
        [0.0, -1.0],
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
            color: [128, 128, 256, 0.2]
        }),
        stroke: new ol.style.Stroke({
            color: [128, 128, 256, 1.0],
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
            return this._map;
        };

        target.prototype.goHome = function() {
            var merc = ol.proj.transform(this.home_position, 'EPSG:4326', 'EPSG:3857');
            var map = this._map;
            var view = map.getView();
            var mercs = this.mercsFromGivenZoom(merc, this.merc_zoom);
            this.mercs2SizeAsync(mercs).then(function(size) {
                view.setCenter(size[0]);
                view.setZoom(size[1]);
                view.setRotation(0);
            });
        };

        target.prototype.setGPSMarkerAsync = function(position, ignoreMove) {
            var self = this;
            var map = self.getMap();
            var view = map.getView();
            var mercs = position ? self.mercsFromGPSValue(position.lnglat, position.acc) : ['dummy'];

            return Promise.all(mercs.map(function(merc, index) {
                if (index == 5 || merc == 'dummy') return merc;
                return self.merc2XyAsync(merc);
            })).then(function(xys) {
                var pos = null;
                if (xys[0] != 'dummy') {
                    pos = {xy: xys[0]};
                    if (!self.insideCheckHistMapCoords(xys[0])) {
                        map.handleGPS(false, true);
                        return false;
                    }
                    var news = xys.slice(1);

                    pos.rad = news.reduce(function(prev, curr, index) {
                        var ret = prev + Math.sqrt(Math.pow(curr[0] - pos.xy[0], 2) + Math.pow(curr[1] - pos.xy[1], 2));
                        return index == 3 ? ret / 4.0 : ret;
                    }, 0);
                    if (!ignoreMove) view.setCenter(pos.xy);
                }
                map.setGPSPosition(pos);
                return true;
            });
        };

        target.prototype.setGPSMarker = function(position, ignoreMove) {
            this.setGPSMarkerAsync(position, ignoreMove).then(function() {});
        };

        target.prototype.getRadius = function(size) {
            var radius = Math.floor(Math.min(size[0], size[1]) / 4);
            var zoom = this._map.getView().getDecimalZoom();
            return radius * ol.const.MERC_MAX / 128 / Math.pow(2, zoom);
        };

        target.prototype.mercsFromGivenZoom = function(center, zoom) {
            var size = this._map.getSize();
            var pixel = Math.floor(Math.min(size[0], size[1]) / 4);

            var delta = pixel * ol.const.MERC_MAX / 128 / Math.pow(2, zoom);
            return ol.const.MERC_CROSSMATRIX.map(function(xy) {
                return [xy[0]*delta+center[0], xy[1]*delta+center[1]];
            });
        };

        target.prototype.mercsFromGPSValue = function(lnglat, acc) {
            var merc = ol.proj.transform(lnglat, 'EPSG:4326', 'EPSG:3857');
            var latrad = lnglat[1] * Math.PI / 180;
            var delta = acc / Math.cos(latrad);
            return ol.const.MERC_CROSSMATRIX.map(function(xy) {
                return [xy[0]*delta+merc[0], xy[1]*delta+merc[1]];
            });
        };

        target.prototype.rotateMatrix = function(xys) {
            var theta = 1.0 * this._map.getView().getRotation();
            var result = [];
            for (var i=0; i<xys.length; i++) {
                var xy = xys[i];
                var x = xy[0] * Math.cos(theta) - xy[1] * Math.sin(theta);
                var y = xy[0] * Math.sin(theta) + xy[1] * Math.cos(theta);
                result.push([x, y]);
            }
            return result;
        };

        target.prototype.size2Xys = function(center) {
            if (!center) {
                center = this._map.getView().getCenter();
            }
            var size = this._map.getSize();
            var radius = this.getRadius(size);
            var crossDelta = this.rotateMatrix(ol.const.MERC_CROSSMATRIX);
            var cross = crossDelta.map(function(xy) {
                return [xy[0]*radius+center[0], xy[1]*radius+center[1]];
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
            var promises = mercs.map(function(merc, index) {
                if (index == 5) return merc;
                return self.merc2XyAsync(merc);
            });
            return Promise.all(promises).then(function(xys) {
                return self.xys2Size(xys);
            });
        };

        target.prototype.xys2Size = function(xys) {
            var center = xys[0];
            var size = xys[5];
            var nesw = xys.slice(1, 5);
            var neswDelta = nesw.map(function(val) {
                return [val[0] - center[0], val[1] - center[1]];
            });
            var normal = [[0.0, 1.0], [1.0, 0.0], [0.0, -1.0], [-1.0, 0.0]];
            var abss = 0;
            var cosx = 0;
            var sinx = 0;
            for (var i = 0; i < 4; i++) {
                var delta = neswDelta[i];
                var norm = normal[i];
                var abs = Math.sqrt(Math.pow(delta[0], 2) + Math.pow(delta[1], 2));
                abss += abs;
                var outer = delta[0] * norm[1] - delta[1] * norm[0];
                var inner = Math.acos((delta[0] * norm[0] + delta[1] * norm[1]) / abs);
                var theta = outer > 0.0 ? -1.0 * inner : inner;
                cosx += Math.cos(theta);
                sinx += Math.sin(theta);
            }
            var scale = abss / 4.0;
            var omega = Math.atan2(sinx, cosx);

            if (!size) size = this._map.getSize();
            var radius = Math.floor(Math.min(size[0], size[1]) / 4);
            var zoom = Math.log(radius * ol.const.MERC_MAX / 128 / scale) / Math.log(2);

            return [center, zoom, omega];
        };

        target.prototype.mercs2MercRotation = function(xys) {
            var center = xys[0];
            var nesw = xys.slice(1, 5);
            var neswDelta = nesw.map(function(val) {
                return [val[0] - center[0], val[1] - center[1]];
            });
            var normal = [[0.0, 1.0], [1.0, 0.0], [0.0, -1.0], [-1.0, 0.0]];
            // var abss = 0;
            var cosx = 0;
            var sinx = 0;
            for (var i = 0; i < 4; i++) {
                var delta = neswDelta[i];
                var norm = normal[i];
                var abs = Math.sqrt(Math.pow(delta[0], 2) + Math.pow(delta[1], 2));
                // abss += abs;
                var outer = delta[0] * norm[1] - delta[1] * norm[0];
                var inner = Math.acos((delta[0] * norm[0] + delta[1] * norm[1]) / abs);
                var theta = outer > 0.0 ? -1.0 * inner : inner;
                cosx += Math.cos(theta);
                sinx += Math.sin(theta);
            }
            // var scale = abss / 4.0;
            return Math.atan2(sinx, cosx);
        };
    };
    ol.source.setCustomInitialize = function(self, options) {
        self.sourceID = options.sourceID;
        self.map_option = options.map_option || {};
        self.home_position = options.home_position;
        self.merc_zoom = options.merc_zoom;
        self.fake_gps = options.fake_gps || false;
        self.thumbnail = options.thumbnail || './tmbs/' + (options.mapID || options.sourceID) + '_menu.jpg';
        self.label = options.label;
    };

    ol.source.NowMap = function(optOptions) {
        var options = optOptions || {};
        ol.source.OSM.call(this, options);
        ol.source.setCustomInitialize(this, options);
    };
    ol.inherits(ol.source.NowMap, ol.source.OSM);
    ol.source.NowMap.createAsync = function(options) {
        return new Promise(function(resolve, reject) {
            var obj = new ol.source.NowMap(options);
            resolve(obj);
        });
    };
    ol.source.setCustomFunction(ol.source.NowMap);
    ol.source.NowMap.prototype.xy2MercAsync = function(xy) {
        return new Promise(function(resolve, reject) {
            resolve(xy);
        });
    };
    ol.source.NowMap.prototype.merc2XyAsync = function(merc) {
        return new Promise(function(resolve, reject) {
            resolve(merc);
        });
    };

    ol.source.NowMap.prototype.insideCheckXy = function(xy) {
        return true;
    };

    ol.source.NowMap.prototype.insideCheckHistMapCoords = function(histCoords) {
        return true;
    };

    ol.source.TmsMap = function(optOptions) {
        var options = optOptions || {};
        ol.source.NowMap.call(this, options);
    };
    ol.inherits(ol.source.TmsMap, ol.source.NowMap);
    ol.source.TmsMap.createAsync = function(options) {
        var promise = new Promise(function(resolve, reject) {
            var obj = new ol.source.TmsMap(options);
            resolve(obj);
        });
        return promise;
    };

    ol.MaplatMap = function(optOptions) {
        optOptions = optOptions || {};
        this._gps_source = new ol.source.Vector({
            wrapX: false
        });
        var vectorLayer = new ol.layer.Vector({
            source: this._gps_source
        });

        this._marker_source = new ol.source.Vector({
            wrapX: false
        });
        var markerLayer = new ol.layer.Vector({
            source: this._marker_source
        });

        var overlayLayer = this._overlay_group = new ol.layer.Group();
        var controls = optOptions.off_control ? [] :
            [
                new ol.control.Attribution(),
                new ol.control.CompassRotate(),
                new ol.control.Zoom(),
                new ol.control.SetGPS(),
                new ol.control.GoHome()
            ];

        var options = {
            controls: controls,
            layers: [
                new ol.layer.Tile({
                    source: optOptions.source
                }),
                overlayLayer,
                vectorLayer,
                markerLayer
            ],
            target: optOptions.div,
            view: new ol.View({
                center: optOptions.default_center || [0, 0],
                zoom: optOptions.default_zoom || 2,
                rotation: optOptions.default_rotation || 0
            })
        };
        if (optOptions.off_rotation) {
            options.interactions = ol.interaction.defaults({altShiftDragRotate: false, pinchRotate: false});
        }

        ol.Map.call(this, options);

        var view = this.getView();
        var self = this;
        self.__AvoidFirstMoveStart = true;
        var movestart = function() {
            if (!self.__AvoidFirstMoveStart) self.dispatchEvent('movestart');
            self.__AvoidFirstMoveStart = false;
            view.un('propertychange', movestart);
        };
        view.on('propertychange', movestart);
        self.on('moveend', function() {
            view.on('propertychange', movestart);
        });
    };
    ol.inherits(ol.MaplatMap, ol.Map);

    ol.MaplatMap.prototype.setGPSPosition = function(pos) {
        var src = this._gps_source;
        src.clear();
        if (pos) {
            var iconFeature = new ol.Feature({
                geometry: new ol.geom.Point(pos.xy)
            });
            iconFeature.setStyle(gpsStyle);
            var circle = new ol.Feature({
                geometry: new ol.geom.Circle(pos.xy, pos.rad)
            });
            circle.setStyle(accCircleStyle);
            src.addFeature(iconFeature);
            src.addFeature(circle);
        }
    };

    ol.MaplatMap.prototype.resetMarker = function() {
        var src = this._marker_source;
        src.clear();
    };

    ol.MaplatMap.prototype.setMarker = function(xy, data, markerStyle) {
        var src = this._marker_source;
        data['geometry'] = new ol.geom.Point(xy);
        var iconFeature = new ol.Feature(data);
        if (!markerStyle) markerStyle = markerDefaultStyle;
        else if (typeof markerStyle == 'string') {
            markerStyle = new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 1.0],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    src: markerStyle
                }))
            });
        }
        iconFeature.setStyle(markerStyle);
        src.addFeature(iconFeature);
    };

    ol.MaplatMap.prototype.setLine = function(xys) {
        var src = this._marker_source;
        var lineFeature = new ol.Feature({
            geometry: new ol.geom.LineString(xys),
            name: 'Line'
        });
        src.addFeature(lineFeature);
    };

    ol.MaplatMap.prototype.exchangeSource = function(source) {
        var layers = this.getLayers();
        var layer = layers.item(0);
        layer.setSource(source);
        if (source) {
            source._map = this;
        }
    };

    ol.MaplatMap.prototype.setLayer = function(source) {
        var layers = this._overlay_group.getLayers();
        layers.clear();
        if (source) {
            var layer = new ol.layer.Tile({
                source: source
            });
            layers.push(layer);
        }
    };

    ol.MaplatMap.prototype.getSource = function() {
        return this.getLayers().item(0).getSource();
    };

    ol.MaplatMap.prototype.setOpacity = function(percentage) {
        var opacity = (100 - percentage) / 100;
        var source = this.getSource();
        if (source instanceof ol.source.NowMap) {
            this.getLayers().item(0).setOpacity(1);
            this.getLayers().item(1).setOpacity(opacity);
        } else {
            this.getLayers().item(0).setOpacity(opacity);
        }
    };

    ol.MaplatMap.prototype.handleGPS = function(launch, avoidEventForOff) {
        if (launch) {
            this.dispatchEvent('gps_request');
            this._first_gps_request = true;
            if (!this.geolocation) {
                var geolocation = this.geolocation = new ol.Geolocation({tracking: true});
                // listen to changes in position
                var map = this;
                geolocation.on('change', function(evt) {
                    var source = map.getLayers().item(0).getSource();
                    var lnglat = geolocation.getPosition();
                    var acc = geolocation.getAccuracy();
                    if (source.fake_gps && ol.MathEx.getDistance(source.home_position, lnglat) > source.fake_gps) {
                        lnglat = [ol.MathEx.randomFromCenter(source.home_position[0], 0.001),
                            ol.MathEx.randomFromCenter(source.home_position[1], 0.001)];
                        acc = ol.MathEx.randomFromCenter(15.0, 10);
                    }
                    var gpsVal = {lnglat: lnglat, acc: acc};
                    source.setGPSMarkerAsync(gpsVal, !map._first_gps_request)
                        .then(function(result) {
                            if (!result) {
                                gpsVal = {error: 'gps_out'};
                            }
                            map._first_gps_request = false;
                            map.dispatchEvent(new ol.MapEvent('gps_result', map, gpsVal));
                        });
                });
                geolocation.on('error', function(evt) {
                    var source = map.getLayers().item(0).getSource();
                    var gpsVal = null;
                    if (source.fake_gps) {
                        var lnglat = [ol.MathEx.randomFromCenter(source.home_position[0], 0.001),
                            ol.MathEx.randomFromCenter(source.home_position[1], 0.001)];
                        var acc = ol.MathEx.randomFromCenter(15.0, 10);
                        gpsVal = {lnglat: lnglat, acc: acc};
                    }
                    source.setGPSMarkerAsync(gpsVal, !map._first_gps_request)
                        .then(function(result) {
                            if (!result) {
                                gpsVal = {error: 'gps_out'};
                            }
                            map._first_gps_request = false;
                            map.dispatchEvent(new ol.MapEvent('gps_result', map, gpsVal));
                        });
                });
            } else {
                this.geolocation.setTracking(true);
            }
        } else {
            if (this.geolocation) this.geolocation.setTracking(false);
            var source = this.getLayers().item(0).getSource();
            source.setGPSMarker();
            if (!avoidEventForOff) this.dispatchEvent(new ol.MapEvent('gps_result', map, {error: 'gps_off'}));
        }
    };

    ol.MathEx = {};

    ol.MathEx.randomFromCenter = function(center, pow) {
        return center + (Math.random() - 0.5) * pow;
    };

    ol.MathEx.recursiveRound = function(val, decimal) {
        if (val instanceof Array) return val.map(function(item) {
            return ol.MathEx.recursiveRound(item, decimal);
        });
        var decVal = Math.pow(10, decimal);
        return Math.round(val * decVal) / decVal;
    };

    ol.MathEx.getDistance = function(lnglat1, lnglat2) {
        function radians(deg) {
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
