import { CustomControl, control_settings } from "./maplat_control";
import { Geolocation } from "./geolocation";
import bsn from "../legacy/bootstrap-native";

export class SetGPS extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["gps"]
      ? `<img src="${control_settings["gps"]}">`
      : '<i class="far fa-location-crosshairs fa-lg"></i>';
    options.cls = "gps";
    options.render = function (mapEvent) {
      const frameState = mapEvent.frameState;
      if (!frameState) {
        return;
      }
    };
    options.callback = function () {
      const ui = this.ui;
      const map = ui.core.mapObject;
      const overlayLayer = map.getLayer("overlay").getLayers().item(0);
      const firstLayer = map.getLayers().item(0);
      const source = (overlayLayer ? overlayLayer.getSource() : firstLayer.getSource());
      const geolocation = this.geolocation;

      if (!geolocation.getTracking()) {
        geolocation.setTracking(true);
        geolocation.once("change", () => {
          const lnglat = geolocation.getPosition();
          const acc = geolocation.getAccuracy();
          if (!lnglat || !acc) return;
          source.setGPSMarker({ lnglat, acc }).then((insideCheck) => {
            if (!insideCheck) {
              source.setGPSMarker();
            }
          });
        });
      } else {
        const lnglat = geolocation.getPosition();
        const acc = geolocation.getAccuracy();
        if (!lnglat || !acc) return;
        source.setGPSMarkerAsync({ lnglat, acc }).then((insideCheck) => {
          if (!insideCheck) {
            source.setGPSMarker();
          }
        });
      }
    };

    super(options);
    
    console.log("Start!!");
    this.ui = options.ui;
    this.moveTo_ = false;

    if (options.alwaysGpsOn) {
      this.alwaysGpsOn = true;
    }

    if (control_settings["gps"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }

    this.initGeolocation();
  }

  async initGeolocation() {
    await this.ui.core.waitReady;

    const geolocation = this.geolocation = new Geolocation({
      timerBase: this.ui.core.fakeGps,
      homePosition: this.ui.core.homePosition
    });
    geolocation.setTracking(true);

    geolocation.on("change", () => {
      const map = this.ui.core.mapObject;
      const overlayLayer = map.getLayer("overlay").getLayers().item(0);
      const firstLayer = map.getLayers().item(0);
      const source = (overlayLayer ? overlayLayer.getSource() : firstLayer.getSource());
      const lnglat = geolocation.getPosition();
      const acc = geolocation.getAccuracy();
      if (!lnglat || !acc) return;
      source.setGPSMarkerAsync({ lnglat, acc }, !this.moveTo_).then((insideCheck) => {
        this.moveTo_ = false;
        if (!insideCheck) {
          source.setGPSMarker();
        }
      });
    });
  
    geolocation.on("error", (evt) => {
      console.log("#### GPS Error ####");
      console.log(evt);
      const code = evt.code;
      if (code === 3) return;
      geolocation.setTracking(false);

      this.ui.core.mapDivDocument.querySelector(".modal_title").innerText = this.ui.core.t("app.gps_error");
      this.ui.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = this.ui.core.t(code === 1 ? "app.user_gps_deny" :
        code === 2 ? "app.gps_miss" : "app.gps_timeout");
      const modalElm = this.ui.core.mapDivDocument.querySelector(".modalBase");
      const modal = new bsn.Modal(modalElm, { root: this.ui.core.mapDivDocument });
      this.ui.modalSetting("gpsD");
      modal.show();
    });

    this.ui.core.addEventListener("mapChanged", () => {
      console.log("#### Hoge ####");
      if (geolocation.getTracking()) {
        const map = this.ui.core.mapObject;
        console.log("#####");
        console.log(map);
        const overlayLayer = map.getLayer("overlay").getLayers().item(0);
        const firstLayer = map.getLayers().item(0);
        const source = (overlayLayer ? overlayLayer.getSource() : firstLayer.getSource());
        const lnglat = geolocation.getPosition();
        const acc = geolocation.getAccuracy();
        if (!lnglat || !acc) return;
        source.setGPSMarkerAsync({ lnglat, acc }, true).then((insideCheck) => {
          if (!insideCheck) {
            source.setGPSMarker();
          }
        });
      }
    });    
  }
}
