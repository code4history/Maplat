define(['ol3', 'bootstrap'],
    function(ol, bsn) {
        const {ipcRenderer} = require('electron');
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

        var settings = require('electron').remote.require('../lib/settings');
        alert(settings.getSetting('saveFolder') + "\n" + settings.getSetting('tmpFolder'));

    });
