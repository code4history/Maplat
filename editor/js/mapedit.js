define(['histmap', 'bootstrap', 'underscore', 'model/map', 'contextmenu'],
    function(ol, bsn, _, Map, ContextMenu) {
        var labelFontStyle = "Normal 12px Arial";
        const {ipcRenderer} = require('electron');
        var backend = require('electron').remote.require('../lib/mapedit');
        backend.init();
        var mapID;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            if (hash[0] == 'mapid') mapID = hash[1];
        }

        function getTextWidth ( _text, _fontStyle ) {
            var canvas = undefined,
                context = undefined,
                metrics = undefined;

            canvas = document.createElement( "canvas" )

            context = canvas.getContext( "2d" );

            context.font = _fontStyle;
            metrics = context.measureText( _text );

            return metrics.width;
        }

        function gcpsToMarkers (gcps) {
            illstMap.resetMarker();
            mercMap.resetMarker();

            for (var i=0; i<gcps.length; i++) {
                var gcp = gcps[i];
                var mapXyIllst = illstSource.xy2HistMapCoords(gcp[0]);

                var labelWidth = getTextWidth( (i + 1), labelFontStyle ) + 10;

                var iconSVG = '<svg ' +
                    'version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                    'x="0px" y="0px" width="' + labelWidth + 'px" height="20px" ' +
                    'viewBox="0 0 ' + labelWidth + ' 20" enable-background="new 0 0 ' + labelWidth + ' 20" xml:space="preserve">'+
                    '<polygon x="0" y="0" points="0,0 ' + labelWidth + ',0 ' + labelWidth + ',16 ' + (labelWidth / 2 + 4) + ',16 ' +
                    (labelWidth / 2) + ',20 ' + (labelWidth / 2 - 4) + ',16 0,16 0,0" stroke="#000000" fill="#DEEFAE" stroke-width="2"></polygon>' +
                    //'<rect x="0" y="0" width="' + labelWidth + '" height="16" stroke="#000000" fill="#DEEFAE" stroke-width="2"></rect>' +
                    '<text x="5" y="13" fill="#000000" font-family="Arial" font-size="12" font-weight="normal">' + (i + 1) + '</text>' +
                    '</svg>';

                var imageElement = new Image();
                imageElement.src = 'data:image/svg+xml,' + encodeURIComponent( iconSVG );

                var iconStyle = new ol.style.Style({
                    "image": new ol.style.Icon({
                        "img": imageElement,
                        "imgSize":[labelWidth, 70],
                        "anchor": [0.5, 1],
                        "offset": [0, -50]
                    })
                });

                illstMap.setMarker(mapXyIllst, { gcpIndex: i }, iconStyle);
                mercMap.setMarker(gcp[1], { gcpIndex: i }, iconStyle);
            }
        }


        var app = {};
        //マーカードラッグ用(Exampleよりコピペ)
        /**
         * @constructor
         * @extends {ol.interaction.Pointer}
         */
        app.Drag = function() {
            ol.interaction.Pointer.call(this, {
                handleDownEvent: app.Drag.prototype.handleDownEvent,
                handleDragEvent: app.Drag.prototype.handleDragEvent,
                handleMoveEvent: app.Drag.prototype.handleMoveEvent,
                handleUpEvent: app.Drag.prototype.handleUpEvent
            });

            /**
             * @type {ol.Pixel}
             * @private
             */
            this.coordinate_ = null;

            /**
             * @type {string|undefined}
             * @private
             */
            this.cursor_ = 'pointer';

            /**
             * @type {ol.Feature}
             * @private
             */
            this.feature_ = null;

            /**
             * @type {string|undefined}
             * @private
             */
            this.previousCursor_ = undefined;

            //マーカーレイヤのみ対象とするようにlayerFilterを設定
            this.layerFilter = 'MarkerLayer';

        };
        ol.inherits(app.Drag, ol.interaction.Pointer);

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `true` to start the drag sequence.
         */
        app.Drag.prototype.handleDownEvent = function(evt) {
            var map = evt.map;

            var this_ = this;
            var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                return feature;
            }, {}, function(layer) {
                return layer.get('name') == this_.layerFilter;
            });

            if (feature) {
                this.coordinate_ = evt.coordinate;
                this.feature_ = feature;
            }

            return !!feature;
        };

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         */
        app.Drag.prototype.handleDragEvent = function(evt) {
            var map = evt.map;

            var this_ = this;
            var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                return feature;
            }, {}, function(layer) {
                return layer.get('name') == this_.layerFilter;
            });

            var deltaX = evt.coordinate[0] - this.coordinate_[0];
            var deltaY = evt.coordinate[1] - this.coordinate_[1];

            var geometry = /** @type {ol.geom.SimpleGeometry} */
                (this.feature_.getGeometry());
            geometry.translate(deltaX, deltaY);

            this.coordinate_[0] = evt.coordinate[0];
            this.coordinate_[1] = evt.coordinate[1];
        };

        /**
         * @param {ol.MapBrowserEvent} evt Event.
         */
        app.Drag.prototype.handleMoveEvent = function(evt) {
            if (this.cursor_) {
                var map = evt.map;

                var this_ = this;
                var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                    return feature;
                }, {}, function(layer) {
                    return layer.get("name") == this_.layerFilter;
                });

                var element = evt.map.getTargetElement();
                if (feature) {
                    if (element.style.cursor != this.cursor_) {
                        this.previousCursor_ = element.style.cursor;
                        element.style.cursor = this.cursor_;
                    }
                } else if (this.previousCursor_ !== undefined) {
                    element.style.cursor = this.previousCursor_;
                    this.previousCursor_ = undefined;
                }
            }
        };

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `false` to stop the drag sequence.
         */
        app.Drag.prototype.handleUpEvent = function(evt) {
            var map = evt.map;
            var isIllst = map == illstMap;
            var feature = this.feature_;
            var xy = feature.getGeometry().getCoordinates();
            xy = isIllst ? illstSource.histMapCoords2Xy(xy) : xy;

            var gcpIndex = feature.get('gcpIndex');
            var gcps = mapObject.get('gcps');
            gcps[gcpIndex][isIllst ? 0 : 1] = xy;
            mapObject.set('gcps', gcps);
            mapObject.trigger('change:gcps', mapObject, gcps);
            mapObject.trigger('change', mapObject);
            console.log('Dirty: ' + mapObject.dirty());
            console.log(gcps[gcpIndex]);

            this.coordinate_ = null;
            this.feature_ = null;
            return false;
        };

        var illstMap = new ol.MaplatMap({
            div: 'illstMap'
        });
        var illstSource;

        var mapObject;
        if (mapID) {
            var mapIDElm = document.querySelector('#mapID');
            mapIDElm.value = mapID;
            mapIDElm.setAttribute('disabled', true);
            document.querySelector('#createID').setAttribute('disabled', true);
            backend.request(mapID);
        } else {
            mapObject = new Map({});
        }
        ipcRenderer.on('mapData', function(event, arg) {
            mapObject = new Map(arg);
            console.log(mapObject);
            document.querySelector('#mapName').value = mapObject.get('title');
            ol.source.HistMap.createAsync({
                mapID: mapID,
                url: mapObject.get('url'),
                width: mapObject.get('width'),
                height: mapObject.get('height'),
                attr: mapObject.get('attr'),
                noload: true
            },{})
                .then(function(source) {
                    illstSource = source;
                    illstMap.exchangeSource(illstSource);
                    var initialCenter = illstSource.xy2HistMapCoords([mapObject.get('width') / 2, mapObject.get('height') / 2]);
                    var illstView = illstMap.getView();
                    illstView.setCenter(initialCenter);

                    var gcps = mapObject.get('gcps');
                    if (gcps && gcps.length > 0) {
                        var center;
                        var zoom;
                        if (gcps.length == 1) {
                            center = gcps[0][1];
                            zoom = 16;
                        } else {
                            var results = gcps.reduce(function(prev, curr, index) {
                                var merc = curr[1];
                                prev[0][0] = prev[0][0] + merc[0];
                                prev[0][1] = prev[0][1] + merc[1];
                                if (merc[0] > prev[1][0]) prev[1][0] = merc[0];
                                if (merc[1] > prev[1][1]) prev[1][1] = merc[1];
                                if (merc[0] < prev[2][0]) prev[2][0] = merc[0];
                                if (merc[1] < prev[2][1]) prev[2][1] = merc[1];
                                if (index == gcps.length - 1) {
                                    var center = [prev[0][0]/gcps.length, prev[0][1]/gcps.length];
                                    var deltax = prev[1][0] - prev[2][0];
                                    var deltay = prev[1][1] - prev[2][1];
                                    var delta = deltax > deltay ? deltax : deltay;
                                    var zoom = Math.log(600 / 256 * ol.const.MERC_MAX * 2 / deltax) / Math.log(2);
                                    return [center, zoom];
                                } else return prev;
                            },[[0,0],[-1*ol.const.MERC_MAX,-1*ol.const.MERC_MAX],[ol.const.MERC_MAX,ol.const.MERC_MAX]]);
                        }
                        var mercView = mercMap.getView();
                        mercView.setCenter(results[0]);
                        mercView.setZoom(results[1]);

                        gcpsToMarkers(gcps);

                        illstMap.addInteraction(new app.Drag());
                        mercMap.addInteraction(new app.Drag());
                    }
                }).catch(function (err) {
                    console.log(err);
                });
        });
        var illstContext = new ContextMenu({
            width: 170,
            defaultItems: false,
            items: [
                {
                    text: 'Add a Marker',
                    classname: 'some-style-class', // you can add this icon with a CSS class
                                                   // instead of `icon` property (see next line)
                    icon: 'img/marker.png',  // this can be relative or absolute
                    callback: function() {}
                }
            ]
        });
        illstMap.addControl(illstContext);
        var illstRestore = false;
        illstContext.on('open', function(evt){
            var feature = illstMap.forEachFeatureAtPixel(evt.pixel, function(ft, l){
                return ft;
            });
            if (feature) {
                illstContext.clear();
                //removeMarkerItem.data = {
                //    marker: feature
                //};
                illstContext.push({
                    text: 'Remove this Marker',
                    icon: 'img/marker.png',
                    callback: function() {},
                    data: feature
                });
                illstRestore = true;
            } else if (illstRestore) {
                illstContext.clear();
                //contextmenu.extend(contextmenu_items);
                //contextmenu.extend(contextmenu.getDefaultItems());
                illstRestore = false;
            }
        });

        var mercMap = new ol.MaplatMap({
            div: 'mercMap'
        });
        var mercSource;
        ol.source.HistMap.createAsync('osm', {})
            .then(function(source) {
                mercSource = source;
                mercMap.exchangeSource(mercSource);
            });
        var contextmenu = new ContextMenu({
            width: 170,
            defaultItems: false,
            items: [
                {
                    text: 'Add a Marker',
                    classname: 'some-style-class', // you can add this icon with a CSS class
                                                   // instead of `icon` property (see next line)
                    icon: 'img/marker.png',  // this can be relative or absolute
                    callback: function() {}
                }
            ]
        });
        mercMap.addControl(contextmenu);

        var myModal = new bsn.Modal(document.getElementById('staticModal'), {});

        ipcRenderer.on('showModal', function(event, arg) {
            myModal.show();
        });

        ipcRenderer.on('hideModal', function(event, arg) {
            myModal.hide();
        });

        var myMapTab = document.querySelector('a[href="#gcpsTab"]');
        myMapTab.addEventListener('shown.bs.tab', function(event) {
            illstMap.updateSize();
            mercMap.updateSize();
        });
    });
