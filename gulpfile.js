var gulp = require("gulp"),
    fs = require("fs-extra"),
    zip = require("gulp-zip");

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

  fs.ensureDirSync("./distribution");
  fs.copySync("./dist", "./distribution/dist");
  fs.copySync("./parts", "./distribution/parts");
  fs.copySync("./fonts", "./distribution/fonts");
  fs.copySync("./locales", "./distribution/locales");

  await new Promise((resolve, reject) => {
    gulp
      .src(["./distribution/**/*"])
      .pipe(zip("distribution.zip"))
      .on("error", reject)
      .pipe(gulp.dest("./"))
      .on("end", resolve);
  });
  fs.moveSync("./distribution", "./example");
  fs.copySync("./index.html", "./example/index.html");
  fs.copySync("./apps", "./example/apps");
  fs.copySync("./maps", "./example/maps");
  fs.copySync("./pois", "./example/pois");
  fs.copySync("./tiles", "./example/tiles");
  fs.copySync("./img", "./example/img");
  fs.copySync("./pwa", "./example/pwa");
  fs.copySync("./tmbs", "./example/tmbs");
  fs.copySync("./service-worker.js", "./example/service-worker.js");

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
