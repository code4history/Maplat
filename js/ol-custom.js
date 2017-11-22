define(['ol3', 'aigle', 'resize'], function(ol, Promise, addResizeListener) {
//define(['ol3'], function(ol) {
    // Direct transforamation between 2 projection
    ol.proj.transformDirect = function(xy, src, dist) {
        if (!dist) {
            dist = src;
            src = xy;
            xy = null;
        }
        var srcCode = src.getCode ? src.getCode() : src;
        var distCode = dist.getCode ? dist.getCode() : dist;
        var func = ol.proj.getTransform(src, dist);
        if (func == ol.proj.identityTransform && srcCode != distCode) {
            var srcFunc = ol.proj.getTransform(src, 'EPSG:3857');
            var distFunc = ol.proj.getTransform('EPSG:3857', dist);
            if (srcFunc == ol.proj.identityTransform && srcCode != 'EPSG:3857')
                throw 'Transform of Source projection is not defined.';
            if (distFunc == ol.proj.identityTransform && distCode != 'EPSG:3857')
                throw 'Transform of Distination projection is not defined.';
            func = function(xy) {
                return ol.proj.transform(ol.proj.transform(xy, src, 'EPSG:3857'), 'EPSG:3857', dist);
            };
            var invFunc = function(xy) {
                return ol.proj.transform(ol.proj.transform(xy, dist, 'EPSG:3857'), 'EPSG:3857', src);
            };
            ol.proj.addCoordinateTransforms(src, dist, func, invFunc);
        }

        if (xy) return func(xy);
    };

    ol.View.prototype.getDecimalZoom = function() {
        var offset;
        var resolution = this.getResolution();

        offset = Math.log(this.maxResolution_ / resolution) / Math.log(2);
        return offset !== undefined ? this.minZoom_ + offset : offset;
    };

    /**
     * @classdesc
     * A slider type of control for zooming.
     *
     * Example:
     *
     *     map.addControl(new ol.control.SliderCommon());
     *
     * @constructor
     * @extends {ol.control.Control}
     * @param {olx.control.SliderCommonOptions=} opt_options Zoom slider options.
     * @api
     */
    ol.control.SliderCommon = function(opt_options) {

        var options = opt_options ? opt_options : {};

        /**
         * The direction of the slider. Will be determined from actual display of the
         * container and defaults to ol.control.SliderCommon.Direction_.VERTICAL.
         *
         * @type {ol.control.SliderCommon.Direction_}
         * @private
         */
        this.direction_ = ol.control.SliderCommon.Direction_.VERTICAL;

        /**
         * @type {boolean}
         * @private
         */
        this.dragging_;

        this.value_;

        /**
         * @type {number|undefined}
         * @private
         */
        this.previousX_;

        /**
         * @type {number|undefined}
         * @private
         */
        this.previousY_;

        /**
         * The calculated thumb size (border box plus margins).  Set when initSlider_
         * is called.
         * @type {ol.Size}
         * @private
         */
        this.thumbSize_ = null;

        /**
         * Whether the slider is initialized.
         * @type {boolean}
         * @private
         */
        this.sliderInitialized_ = false;

        /**
         * @type {number}
         * @private
         */
        this.duration_ = options.duration !== undefined ? options.duration : 200;

        /**
         * @type {number}
         * @private
         */
        this.reverse_ = options.reverse !== undefined ? options.reverse : false;

        var className = options.className !== undefined ? options.className : 'ol-slidercommon';
        var thumbElement = document.createElement('button');
        thumbElement.setAttribute('type', 'button');
        thumbElement.className = className + '-thumb ' + ol.css.CLASS_UNSELECTABLE;
        var containerElement = document.createElement('div');
        containerElement.className = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' + ol.css.CLASS_CONTROL;
        containerElement.appendChild(thumbElement);
        /**
         * @type {ol.pointer.PointerEventHandler}
         * @private
         */
        this.dragger_ = new ol.pointer.PointerEventHandler(containerElement);

        ol.events.listen(this.dragger_, ol.pointer.EventType.POINTERDOWN,
            this.handleDraggerStart_, this);
        ol.events.listen(this.dragger_, ol.pointer.EventType.POINTERMOVE,
            this.handleDraggerDrag_, this);
        ol.events.listen(this.dragger_, ol.pointer.EventType.POINTERUP,
            this.handleDraggerEnd_, this);

        ol.events.listen(thumbElement, ol.events.EventType.CLICK,
            ol.events.Event.stopPropagation);

        var render = options.render ? options.render : ol.control.SliderCommon.render;

        ol.control.Control.call(this, {
            element: containerElement,
            render: render
        });
        ol.events.listen(this.element, ol.events.EventType.MOUSEOUT,
            this.handleDraggerEnd_, this);
    };
    ol.inherits(ol.control.SliderCommon, ol.control.Control);


    /**
     * @inheritDoc
     */
    ol.control.SliderCommon.prototype.disposeInternal = function() {
        this.dragger_.dispose();
        ol.control.Control.prototype.disposeInternal.call(this);
    };

    /**
     * The enum for available directions.
     *
     * @enum {number}
     * @private
     */
    ol.control.SliderCommon.Direction_ = {
        VERTICAL: 0,
        HORIZONTAL: 1
    };


    /**
     * @inheritDoc
     */
    ol.control.SliderCommon.prototype.setMap = function(map) {
        ol.control.Control.prototype.setMap.call(this, map);
        if (map) {
            map.render();
        }
    };


    /**
     * Initializes the slider element. This will determine and set this controls
     * direction_ and also constrain the dragging of the thumb to always be within
     * the bounds of the container.
     *
     * @private
     */
    ol.control.SliderCommon.prototype.initSlider_ = function() {
        var container = this.element;
        var containerSize = {
            width: container.offsetWidth, height: container.offsetHeight
        };

        var thumb = container.firstElementChild;
        var computedStyle = getComputedStyle(thumb);
        var thumbWidth = thumb.offsetWidth +
            parseFloat(computedStyle['marginRight']) +
            parseFloat(computedStyle['marginLeft']);
        var thumbHeight = thumb.offsetHeight +
            parseFloat(computedStyle['marginTop']) +
            parseFloat(computedStyle['marginBottom']);
        this.thumbSize_ = [thumbWidth, thumbHeight];

        if (containerSize.width > containerSize.height) {
            this.direction_ = ol.control.SliderCommon.Direction_.HORIZONTAL;
        } else {
            this.direction_ = ol.control.SliderCommon.Direction_.VERTICAL;
        }
        this.setValue(0);
        var self = this;
        addResizeListener(container, function() {
            self.setValue(self.value_);
        });

        this.sliderInitialized_ = true;
    };

    ol.control.SliderCommon.prototype.widthLimit_ = function(event) {
        var container = this.element;
        return container.offsetWidth - this.thumbSize_[0];
    };
    ol.control.SliderCommon.prototype.heightLimit_ = function(event) {
        var container = this.element;
        return container.offsetHeight - this.thumbSize_[1];
    };

    /**
     * Update the SliderCommon element.
     * @param {ol.MapEvent} mapEvent Map event.
     * @this {ol.control.SliderCommon}
     * @api
     */
    ol.control.SliderCommon.render = function(mapEvent) {
        if (!mapEvent.frameState) {
            return;
        }
        if (!this.sliderInitialized_) {
            this.initSlider_();
        }
    };


    /**
     * @param {Event} event The browser event to handle.
     * @private
     */
    ol.control.SliderCommon.prototype.handleContainerClick_ = function(event) {
        var relativePosition = this.getRelativePosition_(
            event.offsetX - this.thumbSize_[0] / 2,
            event.offsetY - this.thumbSize_[1] / 2);

        this.setThumbPosition_(relativePosition);
    };

    /**
     * Handle dragger start events.
     * @param {ol.pointer.PointerEvent} event The drag event.
     * @private
     */
    ol.control.SliderCommon.prototype.handleDraggerStart_ = function(event) {
        if (!this.dragging_ && event.originalEvent.target === this.element.firstElementChild &&
            !this.element.classList.contains('disable')) {
            this.getMap().getView().setHint(ol.ViewHint.INTERACTING, 1);
            this.previousX_ = event.clientX;
            this.previousY_ = event.clientY;
            this.dragging_ = true;
        }
    };

    /**
     * Handle dragger drag events.
     *
     * @param {ol.pointer.PointerEvent|Event} event The drag event.
     * @private
     */
    ol.control.SliderCommon.prototype.handleDraggerDrag_ = function(event) {
        if (this.dragging_) {
            var element = this.element.firstElementChild;
            var deltaX = event.clientX - this.previousX_ + (parseInt(element.style.left, 10) || 0);
            var deltaY = event.clientY - this.previousY_ + (parseInt(element.style.top, 10) || 0);
            var relativePosition = this.getRelativePosition_(deltaX, deltaY);
            this.setThumbPosition_(relativePosition);
            this.previousX_ = event.clientX;
            this.previousY_ = event.clientY;
        }
    };

    /**
     * Handle dragger end events.
     * @param {ol.pointer.PointerEvent|Event} event The drag event.
     * @private
     */
    ol.control.SliderCommon.prototype.handleDraggerEnd_ = function(event) {
        if (this.dragging_) {
            var view = this.getMap().getView();
            view.setHint(ol.ViewHint.INTERACTING, -1);

            /* view.animate({
                resolution: view.constrainResolution(this.currentResolution_),
                duration: this.duration_,
                easing: ol.easing.easeOut
            });*/

            this.dragging_ = false;
            this.previousX_ = undefined;
            this.previousY_ = undefined;
        }
    };

    /**
     * Positions the thumb inside its container according to the given resolution.
     *
     * @param {number} res The res.
     * @private
     */
    ol.control.SliderCommon.prototype.setThumbPosition_ = function(res) {
        var thumb = this.element.firstElementChild;

        if (this.direction_ == ol.control.SliderCommon.Direction_.HORIZONTAL) {
            thumb.style.left = this.widthLimit_() * res + 'px';
        } else {
            thumb.style.top = this.heightLimit_() * res + 'px';
        }
        this.value_ = this.reverse_ ? 1 - res : res;
        this.set('slidervalue', this.value_);
    };

    /**
     * Calculates the relative position of the thumb given x and y offsets.  The
     * relative position scales from 0 to 1.  The x and y offsets are assumed to be
     * in pixel units within the dragger limits.
     *
     * @param {number} x Pixel position relative to the left of the slider.
     * @param {number} y Pixel position relative to the top of the slider.
     * @return {number} The relative position of the thumb.
     * @private
     */
    ol.control.SliderCommon.prototype.getRelativePosition_ = function(x, y) {
        var amount;
        if (this.direction_ === ol.control.SliderCommon.Direction_.HORIZONTAL) {
            amount = x / this.widthLimit_();
        } else {
            amount = y / this.heightLimit_();
        }
        return ol.math.clamp(amount, 0, 1);
    };

    ol.control.SliderCommon.prototype.setValue = function(res) {
        res = this.reverse_ ? 1 - res : res;
        this.setThumbPosition_(res);
    };

    ol.control.SliderCommon.prototype.setEnable = function(cond) {
        var elem = this.element;
        if (cond) {
            elem.classList.remove('disable');
        } else {
            elem.classList.add('disable');
        }
    };

    ol.control.CustomControl = function(optOptions) {
        var options = optOptions || {};

        var button = document.createElement('button');
        button.setAttribute('type', 'button');
        var span = document.createElement('span');
        span.innerHTML = options.character;
        button.appendChild(span);

        button.addEventListener('click', function(e) {
            e.preventDefault();
            options.callback();
        }, false);
        button.addEventListener('dblclick', function(e) { e.preventDefault(); }, false);

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
                var layer = this.getMap().getLayers().item(0);
                var source = layer.getSource ? layer.getSource() : layer.getLayers().item(0).getSource();
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

    ol.control.Maplat = function(optOptions) {
        var options = optOptions || {};
        options.character = '<img src="parts/Maplat.png">';
        options.cls = 'ol-maplat';
        var self = this;
        options.callback = function() {
            window.open('https://github.com/code4nara/Maplat/wiki');
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.Maplat, ol.control.CustomControl);

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
            }).catch(function(err) { throw err; });
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
            return Promise.all(promises).catch(function(err) { throw err; });
        };

        target.prototype.mercs2SizeAsync = function(mercs) {
            var self = this;
            var promises = mercs.map(function(merc, index) {
                if (index == 5) return merc;
                return self.merc2XyAsync(merc);
            });
            return Promise.all(promises).then(function(xys) {
                return self.xys2Size(xys);
            }).catch(function(err) { throw err; });
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
        }).catch(function(err) { throw err; });
    };
    ol.source.setCustomFunction(ol.source.NowMap);
    ol.source.NowMap.prototype.xy2MercAsync = function(xy) {
        return new Promise(function(resolve, reject) {
            resolve(xy);
        }).catch(function(err) { throw err; });
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
        return promise.catch(function(err) { throw err; });
    };

    ol.MaplatMap = function(optOptions) {
        optOptions = optOptions || {};
        var vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                wrapX: false
            })
        });
        vectorLayer.set('name', 'gps');

        var markerLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                wrapX: false
            })
        });
        markerLayer.set('name', 'marker');

        var baseLayer = optOptions.baseLayer ? optOptions.baseLayer :
            new ol.layer.Tile({
                source: optOptions.source
            });
        baseLayer.set('name', 'base');

        var overlayLayer = this._overlay_group = new ol.layer.Group();
        overlayLayer.set('name', 'overlay');

        this.sliderCommon = new ol.control.SliderCommon({reverse: true});
        var controls = optOptions.controls ? optOptions.controls :
            optOptions.off_control ? [] :
            [
                new ol.control.Attribution(),
                new ol.control.CompassRotate(),
                new ol.control.Zoom(),
                new ol.control.SetGPS(),
                new ol.control.GoHome(),
                this.sliderCommon,
                new ol.control.Maplat()
            ];

        var options = {
            controls: controls,
            layers: [
                baseLayer,
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
        if (optOptions.interactions) {
            options.interactions = optOptions.interactions;
        } else if (optOptions.off_rotation) {
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

    ol.MaplatMap.prototype.getLayer = function(name) {
        if (!name) name = 'base';
        var recur = function(layers) {
            var filtered = layers.getArray().map(function(layer) {
                if (layer.get('name') == name) return layer;
                if (layer.getLayers) return recur(layer.getLayers());
                return;
            }).filter(function(layer) {
                return layer;
            });
            if (filtered.length == 0) return;
            return filtered[0];
        };
        return recur(this.getLayers());
    };

    ol.MaplatMap.prototype.getSource = function(name) {
        var layer = this.getLayer(name);
        if (!layer) return;
        return layer.getSource();
    };

    ol.MaplatMap.prototype.setGPSPosition = function(pos) {
        var src = this.getSource('gps');
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
        var src = this.getSource('marker');
        src.clear();
    };

    ol.MaplatMap.prototype.setMarker = function(xy, data, markerStyle) {
        var src = this.getSource('marker');
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
        var src = this.getSource('marker');
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
        var layers = this.getLayer('overlay').getLayers();
        layers.clear();
        if (source) {
            var layer = new ol.layer.Tile({
                source: source
            });
            layers.push(layer);
        }
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
