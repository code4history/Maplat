var gulp = require('gulp'),
    sha1 = require('sha1'),
    concat = require('gulp-concat'),
    replace = require('gulp-replace'),
    spawn = require('child_process').spawn,
    fs = require('fs-extra'),
    wbBuild = require('workbox-build'),
    zip = require('gulp-zip'),
    psaux = require('psaux'),
    terminate = require('terminate');

gulp.task('server', function() {
    spawn('node', ['server.js'], {
        stdio: 'ignore',
        detached: true
    }).unref();
    return Promise.resolve();
});

gulp.task('stopserver', function() {
    return psaux().then(list => {
        list.filter(ps => {
            return ps.command.match(/server\.js/);
        }).map(ps => {
            terminate(ps.pid, (err) => {
                if (err) {
                    console.log("Terminate server fail: " + err);
                }
                else {
                    console.log('Terminate server done');
                }
            });
        });
    });
});

gulp.task('zip', function() {
    try {
        fs.removeSync('./distribution.zip');
    } catch (e) {
    }
    try {
        fs.removeSync('./distribution');
    } catch (e) {
    }
    try {
        fs.removeSync('./example.zip');
    } catch (e) {
    }
    try {
        fs.removeSync('./example');
    } catch (e) {
    }

    fs.ensureDirSync('./distribution');
    fs.copySync('./dist', './distribution/dist');
    fs.copySync('./parts', './distribution/parts');
    fs.copySync('./fonts', './distribution/fonts');
    fs.copySync('./locales', './distribution/locales');

    return new Promise(function(resolve, reject) {
        gulp.src(['./distribution/**/*'])
            .pipe(zip('distribution.zip'))
            .on('error', reject)
            .pipe(gulp.dest('./'))
            .on('end', resolve);
    }).then(function() {
        fs.moveSync('./distribution', './example');
        fs.copySync('./index.html', './example/index.html');
        fs.copySync('./apps', './example/apps');
        fs.copySync('./maps', './example/maps');
        fs.copySync('./pois', './example/pois');
        fs.copySync('./tiles', './example/tiles');
        fs.copySync('./img', './example/img');
        fs.copySync('./pwa', './example/pwa');
        fs.copySync('./tmbs', './example/tmbs');
        fs.copySync('./service-worker.js', './example/service-worker.js');
        return new Promise(function(resolve, reject) {
            gulp.src(['./example/**/*'])
                .pipe(zip('example.zip'))
                .on('error', reject)
                .pipe(gulp.dest('./'))
                .on('end', resolve);
        });
    }).then(function() {
        fs.removeSync('./example');
    });
});

gulp.task('sw_build', function() {
    return wbBuild.generateSW({
        globDirectory: '.',
        globPatterns: [
            '.',
            'dist/maplat.js',
            'dist/maplat.css',
            'parts/*',
            'locales/*/*',
            'fonts/*'
        ],
        swDest: 'service-worker_.js',
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [{
            urlPattern: /(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+_menu\.jpg|img\/.+\.(?:png|jpg))$/,
            handler: 'staleWhileRevalidate',
            options: {
                cacheName: 'resourcesCache',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            },
        }],
    }).then(function() {
        var unixtime = new Date();
        return new Promise(function(resolve, reject) {
            gulp.src(['./service-worker_.js'])
                .pipe(concat('service-worker.js'))
                .pipe(replace(/self\.__precacheManifest = \[/, "self.__precacheManifest = [\n  {\n    \"url\": \".\",\n    \"revision\": \"" + sha1(unixtime) + "\"\n  },"))
                .on('error', reject)
                .pipe(gulp.dest('./'))
                .on('end', resolve);
        });
    }).then(function() {
        fs.unlinkSync('./service-worker_.js');
    });
});
