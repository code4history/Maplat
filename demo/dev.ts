import { MaplatUi } from '../src/index';
// Import styles - Vite will process these automatically
import '../less/maplat-specific.less';
import '../less/contextmenu.css';
import '../less/swiper4.css';

// @ts-ignore
const mapboxgl = window.mapboxgl;
// @ts-ignore
const maplibregl = window.maplibregl;

var option: any = {
    enableCache: true,
    restoreSession: true,
    stateUrl: true,
    markerList: true,
    enableShare: true,
    enableHideMarker: true,
    enableMarkerList: true,
    enableBorder: true,
    presentationMode: true,
    pwaManifest: true,
    northTop: true,
    mapboxgl: mapboxgl,
    maplibregl: maplibregl,
    mapboxToken: "pk.eyJ1IjoicmVraXNoaWtva3VkbyIsImEiOiJjazRoMmF3dncwODU2M2ttdzI2aDVqYXVwIn0.8Hb9sekgjfck6Setxk5uVg",
    googleApiKey: "AIzaSyB0v_F9EVPbE7R2uOm6Mixrtzts21DEICc",
    lang: 'ja'
};

var hashes = (window.location.href.split('#!'))[0];
var hashesArr = hashes.slice(window.location.href.indexOf('?') + 1).split('&');
for (var i = 0; i < hashesArr.length; i++) {
    var hash = hashesArr[i].split('=');
    option[hash[0]] = hash[1] == 'true' ? true : hash[1] == 'false' ? false : hash[1];
}

MaplatUi.createObject(option).then(function (app) {
    app.addEventListener('clickMarker', function (evt: any) {
        console.log(evt);
    });
    app.addEventListener('clickMap', function (evt: any) {
        console.log(evt);
    });
    app.core!.waitReady.then(() => {
        app.core!.addLine({
            lnglats: [[141.151995, 39.701599], [141.151137, 39.703736], [141.1521671, 39.7090232]],
            stroke: {
                color: '#ffcc33',
                width: 2
            }
        });
    });
});
