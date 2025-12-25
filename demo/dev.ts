import { MaplatUi } from "../src/index";
// Import styles - Vite will process these automatically
import "../less/maplat-specific.less";
import "../less/contextmenu.css";
import "../less/swiper4.css";

const mapboxgl = window.mapboxgl;
const maplibregl = window.maplibregl;

const option = {
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
  mapboxgl,
  maplibregl,
  mapboxToken:
    "pk.eyJ1IjoicmVraXNoaWtva3VkbyIsImEiOiJjazRoMmF3dncwODU2M2ttdzI2aDVqYXVwIn0.8Hb9sekgjfck6Setxk5uVg",
  googleApiKey: "AIzaSyB0v_F9EVPbE7R2uOm6Mixrtzts21DEICc",
  lang: "ja"
};

const hashes = window.location.href.split("#!")[0];
const hashesArr = hashes
  .slice(window.location.href.indexOf("?") + 1)
  .split("&");
for (let i = 0; i < hashesArr.length; i++) {
  const hash: string[] = hashesArr[i].split("=");
  option[hash[0]] =
    hash[1] == "true" ? true : hash[1] == "false" ? false : hash[1];
}

MaplatUi.createObject(option).then(app => {
  app.addEventListener("clickMarker", (evt: CustomEvent) => {
    console.log(evt);
  });
  app.addEventListener("clickMap", (evt: CustomEvent) => {
    console.log(evt);
  });
  app.core!.waitReady.then(() => {
    app.core!.addLine({
      lnglats: [
        [141.151995, 39.701599],
        [141.151137, 39.703736],
        [141.1521671, 39.7090232]
      ],
      stroke: {
        color: "#ffcc33",
        width: 2
      }
    });
  });
});
