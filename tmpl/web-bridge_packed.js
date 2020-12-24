import {MaplatUi} from "../src/index_packed";
// eslint-disable-next-line no-undef
const Maplat = window.Maplat = {};

// eslint-disable-next-line arrow-body-style
Maplat.createObject = (option) => {
  return new Promise(((resolve) => {
    const app = new MaplatUi(option);
    app.waitReady.then(() => {
      resolve(app);
    });
  }));
};