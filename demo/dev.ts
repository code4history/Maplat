import { MaplatUi } from "../src/index";
// 旧 UI のスタイル（src/styles/ui.scss）は読まない。旧 API は互換層（src/index.ts）で、
// 画面は <maplat-ui>（Shadow DOM）が描くので、その CSS は Shadow DOM の中に閉じている
// （旧 API の後方互換のため SCSS はリポジトリに残すが、このデモでは要らない）。
import { parseDemoQuery } from "./query";

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
  lang: "ja"
};

// nov26-m5-t2: URL のクエリは appid・lang だけを、形を検査して受け付ける（B-UI-5）
const query = parseDemoQuery(window.location.search);
const appid = query.appid ?? "sample";
const lang = query.lang ?? "ja";
const appOption = { ...option, appid, lang };
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
  // 現在の URL（#! 以前）のクエリを引き継ぎ、appid/lang を更新する。
  // #! 以降は「開いていた地図」等の状態保存であり、地図セット(appid)を
  // 変えたときは相手先に存在しない地図を指し得るため捨てる（HR-14/1）。
  const current = new URL(window.location.href);
  const search = current.searchParams;
  if (appSelect) {
    search.set("appid", appSelect.value);
  }
  if (langSelect) {
    search.set("lang", langSelect.value);
  }
  if (appSelect && appSelect.value !== appid) {
    // 地図セット変更: #! 以降を捨てて再読み込み（pathname + クエリのみ）
    window.location.href = `${current.pathname}?${search.toString()}`;
  } else {
    // 言語のみの変更（同一地図セット）: 状態は有効なので #! を保持する
    window.location.search = search.toString();
  }
};
appSelect?.addEventListener("change", reloadWithQuery);
langSelect?.addEventListener("change", reloadWithQuery);

MaplatUi.createObject(appOption)
  .then(app => {
    if (statusEl) {
      statusEl.textContent = `READY appid=${appid} lang=${lang}`;
    }
    app.addEventListener("clickMarker", (evt: CustomEvent) => {
      console.log(evt);
    });
    app.addEventListener("clickMap", (evt: CustomEvent) => {
      console.log(evt);
    });
  })
  .catch(err => {
    console.error(err);
    if (statusEl) {
      statusEl.textContent = "読み込み失敗（console を参照）";
    }
  });
