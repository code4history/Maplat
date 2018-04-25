var gulp = require('gulp'),
    execSync = require('child_process').execSync,
    spawn = require('child_process').spawn,
    concat = require('gulp-concat'),
    header = require('gulp-header'),
    zip = require('gulp-zip'),
    os = require('os'),
    fs = require('fs-extra'),
    glob = require('glob');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');
var isWin = os.type().toString().match('Windows') !== null;

gulp.task('server', function(){
    return spawn('node', ['server.js'], {
        stdio: 'ignore',
        detached: true
    }).unref();
});

gulp.task('build', ['create_example', 'css_build'], function() {
    fs.removeSync('./example');
});

gulp.task('create_example', ['concat_promise'], function() {
    fs.unlinkSync('./js/maplat_withoutpromise.js');

    try {
        fs.removeSync('./example.zip');
    } catch (e) {
    }
    try {
        fs.removeSync('./example');
    } catch (e) {
    }

    fs.ensureDirSync('./example');
    fs.copySync('./js/maplat.js', './example/js/maplat.js');
    fs.copySync('./css', './example/css');
    fs.copySync('./locales', './example/locales');
    fs.copySync('./parts', './example/parts');
    fs.copySync('./fonts', './example/fonts');
    fs.copySync('./apps/example_sample.json', './example/apps/sample.json');
    fs.copySync('./maps/morioka.json', './example/maps/morioka.json');
    fs.copySync('./maps/morioka_ndl.json', './example/maps/morioka_ndl.json');
    fs.copySync('./tiles/morioka', './example/tiles/morioka');
    fs.copySync('./tiles/morioka_ndl', './example/tiles/morioka_ndl');
    fs.copySync('./tmbs/morioka_menu.jpg', './example/tmbs/morioka_menu.jpg');
    fs.copySync('./tmbs/morioka_ndl_menu.jpg', './example/tmbs/morioka_ndl_menu.jpg');
    fs.copySync('./tmbs/osm_menu.jpg', './example/tmbs/osm_menu.jpg');
    fs.copySync('./tmbs/gsi_menu.jpg', './example/tmbs/gsi_menu.jpg');
    fs.copySync('./img/houonji.jpg', './example/img/houonji.jpg');
    fs.copySync('./img/ishiwari_zakura.jpg', './example/img/ishiwari_zakura.jpg');
    fs.copySync('./img/mitsuishi_jinja.jpg', './example/img/mitsuishi_jinja.jpg');
    fs.copySync('./img/moriokaginko.jpg', './example/img/moriokaginko.jpg');
    fs.copySync('./img/moriokajo.jpg', './example/img/moriokajo.jpg');
    fs.copySync('./img/sakurayama_jinja.jpg', './example/img/sakurayama_jinja.jpg');
    fs.copySync('./example.html', './example/index.html');

    return gulp.src(['./example/*', './example/*/*', './example/*/*/*', './example/*/*/*/*', './example/*/*/*/*/*'])
        .pipe(zip('example.zip'))
        .pipe(gulp.dest('./'));
});

gulp.task('concat_promise', ['build_withoutpromise'], function() {
    return gulp.src(['./js/aigle-es5.min.js', 'js/maplat_withoutpromise.js'])
        .pipe(concat('maplat.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./js/'));
});

gulp.task('build_withoutpromise', function() {
    var cmd = isWin ? 'r.js.cmd' : 'r.js';
    execSync(cmd + ' -o rjs_config.js');
});

gulp.task('less', function() {
    var lesses = ['ol', 'font-awesome', 'bootstrap', 'swiper', 'app'];
    lesses.map(function(less) {
        execSync('lessc -x css/' + less + '.less > css/' + less + '.css');
    });
});

gulp.task('css_build', ['less'], function() {
    var cmd = isWin ? 'r.js.cmd' : 'r.js';
    execSync(cmd + ' -o cssIn=css/app.css out=css/maplat.css');
});

var mobileTestCopy = [
    'css/app.css',
    'css/bootstrap.css',
    'css/swiper.css',
    'css/font-awesome.css',
    'css/ol.css',
    'js/aigle-es5.min.js',
    'js/require.min.js',
    'js/config.js',
    'js/i18nextXHRBackend.min.js',
    'js/ol-debug.js',
    'js/ol-custom.js',
    'js/i18next.min.js',
    'js/turf_maplat.min.js',
    'js/swiper.min.js',
    'js/bootstrap-native.js',
    'js/mapshaper_maplat.js',
    'js/detect-element-resize.js',
    'js/app.js',
    'js/histmap.js',
    'js/histmap_tin.js',
    'js/sprintf.js',
    'js/tin.js'
];
var mobileCopy = [
    'css/maplat.css',
    'js/maplat.js'
];
var mobileBaseCopy = [
    'js/maplatBridge.js',
    'locales/en/translation.json',
    'locales/ja/translation.json',
    'parts/bluedot.png',
    'parts/defaultpin.png',
    'parts/redcircle.png'
];

function removeResource() {
    var files = [
        './mobile_android/app/src/main/res/raw',
        './mobile_ios/mobile_ios/Maplat.bundle'
    ];
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        try {
            fs.removeSync(file);
        } catch (e) {
        }
    }
}

function copyResource(files) {
    for (var i=0; i<files.length; i++) {
        var copy = files[i];
        var copyTo = copy.replace(/[\/\.\-]/g, '_').toLowerCase();
        fs.copySync(copy, './mobile_android/app/src/main/res/raw/' + copyTo);
        fs.copySync(copy, './mobile_ios/mobile_ios/Maplat.bundle/' + copy);
    }
}

gulp.task('mobile_build_test', function() {
    removeResource();
    copyResource(mobileTestCopy);
    copyResource(mobileBaseCopy);
    fs.copySync('mobile_test.html', './mobile_android/app/src/main/res/raw/mobile_html');
    fs.copySync('mobile_test.html', './mobile_ios/mobile_ios/Maplat.bundle/mobile.html');
});

gulp.task('mobile_build', function() {
    removeResource();
    copyResource(mobileCopy);
    copyResource(mobileBaseCopy);
    fs.copySync('mobile.html', './mobile_android/app/src/main/res/raw/mobile_html');
    fs.copySync('mobile.html', './mobile_ios/mobile_ios/Maplat.bundle/mobile.html');
});
