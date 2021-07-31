const gulp = require("gulp");
const fs = require("fs-extra");
const zip = require("gulp-zip");
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const minimist = require('minimist');
const spawn = require("child_process").spawn;
const pwaAssetGenerator = require('pwa-asset-generator');

const options = minimist(process.argv.slice(2), {
  string: [
    "target",
    "color",
    "name",
    "short"
  ],
  default: {
    target: "sample",
    color: "#f6f0d3",
    name: "Maplat",
    short: "Maplat"
  }
});

const manifest_template = {
  "name": "Maplat",
  "short_name": "Maplat",
  "background_color": "#f6f0d3",
  "icons": [],
  "start_url": "",
  "scope":"",
  "display": "standalone"
};

gulp.task("zip", async () => {
  try {
    fs.removeSync("./distribution.zip");
  } catch (e) { }
  try {
    fs.removeSync("./distribution");
  } catch (e) { }
  try {
    fs.removeSync("./example.zip");
  } catch (e) { }
  try {
    fs.removeSync("./example");
  } catch (e) { }

  fs.copySync("./dist/assets", "./distribution");

  await new Promise((resolve, reject) => {
    gulp
      .src(["./distribution/**/*"])
      .pipe(zip("distribution.zip"))
      .on("error", reject)
      .pipe(gulp.dest("./"))
      .on("end", resolve);
  });
  fs.removeSync("./distribution");

  fs.copySync("./dist", "./example");
  fs.copySync("./apps", "./example/apps");
  fs.copySync("./maps", "./example/maps");
  fs.copySync("./pois", "./example/pois");
  fs.copySync("./tiles", "./example/tiles");
  fs.copySync("./img", "./example/img");
  fs.copySync("./pwa", "./example/pwa");
  fs.copySync("./tmbs", "./example/tmbs");

  await new Promise((resolve, reject) => {
    gulp
      .src(["./example/**/*"])
      .pipe(zip("example.zip"))
      .on("error", reject)
      .pipe(gulp.dest("./"))
      .on("end", resolve);
  });
  fs.removeSync("./example");
});

gulp.task("publish:assets", async () => {
  try {
    fs.removeSync("./assets");
  } catch (e) { }
  fs.copySync("./dist/assets", "./assets");
  fs.copySync("./dist/service-worker.js", "./service-worker.js");
  fs.copySync("./dist/service-worker.js.map", "./service-worker.js.map");
  fs.copySync("./dist/service-worker.js.LICENSE.txt", "./service-worker.js.LICENSE.txt");
});

gulp.task("publish:plat", async () => {
  const target = options.target;
  let apps = {};
  let settings = {};
  try {
    apps = require(`./apps/${target}.json`);
  } catch(e) {}
  try {
    settings = require(`./pwa/templates/${target}/settings.json`);
  } catch(e) {}
  const sample = settings.isSample ? "sample" : target;
  const title = settings.title || (apps.app_name ? (apps.app_name.ja || apps.app_name) : "");
  let description = settings.description || (apps.description ? (apps.description.ja || apps.description) : "");
  if (!description) description = `古地図/絵地図街歩きアプリMaplat:「${title}」版`;
  const color = settings.isSample ? "#780508" : (settings.color || options.color);
  const name = settings.name || options.name;
  const short = settings.short || options.short;
  const splash = !(settings.isSample || target === "sample") ?
    `https://s.maplat.jp/r/${target}map/img/${target}_splash.png` :
    `https://s.maplat.jp/r/${target}map/pwa/sample/apple-splash-1334-750.png`;
  const manifest = Object.assign({}, manifest_template);
  manifest.name = name;
  manifest.short_name = short;
  manifest.background_color = color;
  manifest.theme_color = color;
  manifest.start_url = `https://s.maplat.jp/r/${target}map/`;
  manifest.scope = `/r/${target}map/`;
  await new Promise((resolve, reject) => {
    gulp
      .src(["pwa/templates/template.html"])
      .pipe(rename(`./${target}map.html`))
      .pipe(replace(/\{\{title}}/g, title))
      .pipe(replace(/\{\{appid}}/g, target))
      .pipe(replace(/\{\{description}}/g, description))
      .pipe(replace(/\{\{splash}}/g, splash))
      .pipe(replace(/\{\{sample}}/g, sample))
      .on("error", reject)
      .pipe(gulp.dest("./"))
      .on("end", resolve);
  });
  fs.writeFileSync(`./pwa/${target}_manifest.json`, JSON.stringify(manifest, null, 2));

  return pwaAssetGenerator.generateImages(
    `./pwa/templates/${sample}/appicon.svg`,
    `./pwa/${sample}`,
    {
      background: color,
      index: `./${target}map.html`,
      manifest: `./pwa/${target}_manifest.json`,
      favicon: true,
      mstile: true,
      type: "png"
    });

});