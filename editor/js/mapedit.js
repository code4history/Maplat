define(['ol3', 'bootstrap', 'model/map'],
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
        });

        var map1 = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: 'map1',
            controls: ol.control.defaults({
                attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                    collapsible: false
                })
            }),
            view: new ol.View({
                center: [0, 0],
                zoom: 2
            })
        });
        var map2 = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: 'map2',
            controls: ol.control.defaults({
                attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                    collapsible: false
                })
            }),
            view: new ol.View({
                center: [0, 0],
                zoom: 2
            })
        });

        var myModal = new bsn.Modal(document.getElementById('staticModal'), {});

        ipcRenderer.on('showModal', function(event, arg) {
            myModal.show();
        });

        ipcRenderer.on('hideModal', function(event, arg) {
            myModal.hide();
        });

        var myMapTab = document.querySelector('a[href="#sampleContentB"]');
        myMapTab.addEventListener('shown.bs.tab', function(event) {
            map1.updateSize();
            map2.updateSize();
        });
    });
