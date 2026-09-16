import { MaplatUi } from "../src/index";
// Import styles - Vite will process these automatically
import "../src/styles/ui.scss";

const mapboxgl = window.mapboxgl;
const maplibregl = window.maplibregl;

/*const geolocate = (window as any).geolocate;
if (geolocate) {
  console.log(geolocate);
  geolocate.use();
  navigator.geolocation.getCurrentPosition(function(position) {
    console.log("###### Coords ######");
    console.log(position.coords);
  });
  setTimeout(() => {
    geolocate.send({ lat: 36.246206, lng: 139.528399 }); // Tatebayashi Station
    geolocate.restore();
  }, 30000);
}*/

const option = {
  enableCache: true,
  restoreSession: false,
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

// クエリ→option 上書き機構が反映した後の現在値（MaplatCore の既定に合わせる）
const queryOption = option as Record<string, unknown>;
const appid = String(queryOption.appid || "sample");
const lang = String(queryOption.lang || "ja");
const statusEl = document.getElementById("status");

// control row の配線: 現在値を選択肢へ復元し、変更時に URL クエリを
// 組み立てて再読み込みする（ライブラリ側の変更は不要）
const appSelect = document.getElementById(
  "app-select"
) as HTMLSelectElement | null;
const langSelect = document.getElementById(
  "lang-select"
) as HTMLSelectElement | null;
if (appSelect) {
  appSelect.value = appid;
}
if (langSelect) {
  langSelect.value = lang;
}
const reloadWithQuery = () => {
  const search = new URLSearchParams();
  if (appSelect) {
    search.set("appid", appSelect.value);
  }
  if (langSelect) {
    search.set("lang", langSelect.value);
  }
  window.location.search = search.toString();
};
appSelect?.addEventListener("change", reloadWithQuery);
langSelect?.addEventListener("change", reloadWithQuery);

MaplatUi.createObject(option).then(app => {
  if (statusEl) {
    statusEl.textContent = `READY appid=${appid} lang=${lang}`;
  }
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
}).catch(err => {
  console.error(err);
  if (statusEl) {
    statusEl.textContent = "読み込み失敗（console を参照）";
  }
});
