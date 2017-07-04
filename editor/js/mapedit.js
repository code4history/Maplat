define(['histmap', 'bootstrap', 'model/map'],
    function(ol, bsn, Map) {
        const {ipcRenderer} = require('electron');
        var backend = require('electron').remote.require('../lib/mapedit');
        backend.init();
        var mapID;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            if (hash[0] == 'mapid') mapID = hash[1];
        }

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
                    illstMap.getView().setCenter(initialCenter);

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
                        var view = mercMap.getView();
                        view.setCenter(results[0]);
                        view.setZoom(results[1]);
                    }
                });
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
