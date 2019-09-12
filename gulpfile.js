var gulp = require('gulp'),
    fs = require('fs-extra'),
    zip = require('gulp-zip');

gulp.task('zip', function() {
    try {
        fs.removeSync('./web_set.zip');
    } catch (e) {
    }
    try {
        fs.removeSync('./web_set');
    } catch (e) {
    }

    fs.ensureDirSync('./web_set');
    fs.copySync('./dist', './web_set/dist');
    fs.copySync('./parts', './web_set/parts');

    return new Promise(function(resolve, reject) {
        gulp.src(['./web_set/*', './web_set/*/*'])
            .pipe(zip('web_set.zip'))
            .on('error', reject)
            .pipe(gulp.dest('./'))
            .on('end', resolve);
    }).then(function() {
        fs.removeSync('./web_set');
    });
});