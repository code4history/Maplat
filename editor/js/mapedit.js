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
                    illstMap.exchangeSource(source);
                });
        });

        var illstMap = new ol.MaplatMap({
            div: 'illstMap'
        });

        var mercMap = new ol.MaplatMap({
            div: 'mercMap'
        });
        ol.source.HistMap.createAsync('osm', {})
            .then(function(source) {
                mercMap.exchangeSource(source);
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
            illstMap.updateSize();
            mercMap.updateSize();
        });
    });
