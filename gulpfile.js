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
