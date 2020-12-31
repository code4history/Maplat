import { MaplatUi } from "../src/index_packed";
import "../less/ui.less"

const Maplat = window.Maplat = {};

Maplat.createObject = option => new Promise((resolve => {
  const app = new MaplatUi(option);
  app.waitReady.then(() => {
    resolve(app);
  });
}));