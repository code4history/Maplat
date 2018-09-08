define(['ol-custom', 'resize'], function(ol, addResizeListener) {
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

        this.initialValue = options.initialValue;

        var className = options.className !== undefined ? options.className : 'ol-slidercommon';
        var thumbElement = document.createElement('button');
        thumbElement.setAttribute('type', 'button');
        thumbElement.className = className + '-thumb ' + ol.css.CLASS_UNSELECTABLE;
        var containerElement = document.createElement('div');
        containerElement.title = options.tipLabel;
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
        this.setValue(this.initialValue || 0);
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
        button.title = options.tipLabel;
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
                var receiving = self.element.classList.contains('disable');
                if (receiving && !tracking) {
                    this.element.classList.remove('disable');
                } else if (!receiving && tracking) {
                    this.element.classList.add('disable');
                }
            }
        };
        options.callback = function() {
            var receiving = self.element.classList.contains('disable');
            var map = self.getMap();

            map.handleGPS(!receiving);
            if (receiving) {
                self.element.classList.remove('disable');
            } else {
                self.element.classList.add('disable');
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
                var contains = this.element.classList.contains('disable');
                if (!contains && rotation === 0) {
                    this.element.classList.add('disable');
                } else if (contains && rotation !== 0) {
                    this.element.classList.remove('disable');
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

    ol.control.Share = function(optOptions) {
        var options = optOptions || {};
        options.character = '<i class="fa fa-share-alt-square fa-lg"></i>';
        options.cls = 'ol-share';
        var self = this;
        options.callback = function() {
            var map = self.getMap();
            map.dispatchEvent(new ol.MapEvent('click_control', map, {control: 'share'}));
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.Share, ol.control.CustomControl);

    ol.control.Border = function(optOptions) {
        var options = optOptions || {};
        options.character = '<i class="fa fa-clone fa-lg"></i>';
        options.cls = 'ol-border';
        var self = this;
        options.callback = function() {
            var map = self.getMap();
            map.dispatchEvent(new ol.MapEvent('click_control', map, {control: 'border'}));
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.Border, ol.control.CustomControl);

    ol.control.Maplat = function(optOptions) {
        var options = optOptions || {};
        options.character = '<i class="fa fa-question-circle fa-lg"></i>';
        options.cls = 'ol-maplat';
        var self = this;
        options.callback = function() {
            // window.open('https://github.com/code4nara/Maplat/wiki');
            var map = self.getMap();
            map.dispatchEvent(new ol.MapEvent('click_control', map, {control: 'help'}));
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.Maplat, ol.control.CustomControl);

    ol.control.Copyright = function(optOptions) {
        var options = optOptions || {};
        options.character = '<i class="fa fa-info-circle fa-lg"></i>';
        options.cls = 'ol-copyright';
        var self = this;
        options.callback = function() {
            var map = self.getMap();
            map.dispatchEvent(new ol.MapEvent('click_control', map, {control: 'copyright'}));
        };

        ol.control.CustomControl.call(this, options);
    };
    ol.inherits(ol.control.Copyright, ol.control.CustomControl);

    return ol;
});
