var gulp = require('gulp'),
    execSync = require('child_process').execSync,
    spawn = require('child_process').spawn,
    concat = require('gulp-concat'),
    header = require('gulp-header'),
    zip = require('gulp-zip'),
    replace = require('gulp-replace'),
    os = require('os'),
    fs = require('fs-extra'),
    wbBuild = require('workbox-build');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' * Copyright (c) 2015- Kohei Otsuka, Code for Nara, RekishiKokudo project',
  ' *',
  ' * Permission is hereby granted, free of charge, to any person obtaining a copy',
  ' * of this software and associated documentation files (the "Software"), to deal',
  ' * in the Software without restriction, including without limitation the rights',
  ' * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  ' * copies of the Software, and to permit persons to whom the Software is',
  ' * furnished to do so, subject to the following conditions:',
  ' *',
  ' * The above copyright notice and this permission notice shall be included in all',
  ' * copies or substantial portions of the Software.',
  ' *',
  ' * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  ' * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  ' * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  ' * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  ' * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  ' * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  ' * SOFTWARE.',
  ' */',
  ''].join('\n');
var isWin = os.type().toString().match('Windows') !== null;

gulp.task('server', function() {
    return spawn('node', ['server.js'], {
        stdio: 'ignore',
        detached: true
    }).unref();
});

gulp.task('build', ['create_example'], function() {
    fs.removeSync('./example');
});

gulp.task('create_example', ['concat_promise', 'css_build'], function() {
    fs.unlinkSync('./dist/maplat_withoutpromise.js');
    fs.unlinkSync('./dist/maplat_core_withoutpromise.js');

    try {
        fs.removeSync('./example.zip');
    } catch (e) {
    }
    try {
        fs.removeSync('./example');
    } catch (e) {
    }

    fs.ensureDirSync('./example');
    fs.copySync('./dist', './example/dist');
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
    gulp.src(['./lib/aigle-es5.min.js', 'dist/maplat_core_withoutpromise.js'])
        .pipe(concat('maplat_core.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/'));
    return gulp.src(['./lib/aigle-es5.min.js', 'dist/maplat_withoutpromise.js'])
        .pipe(concat('maplat.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('build_withoutpromise', ['config'], function() {
    var cmd = isWin ? 'r.js.cmd' : 'r.js';
    execSync(cmd + ' -o rjs_config_core.js');
    execSync(cmd + ' -o rjs_config_ui.js');
});

gulp.task('less', function() {
    var lesses = ['ol-maplat', 'font-awesome', 'bootstrap', 'swiper', 'core', 'ui'];
    lesses.map(function(less) {
        execSync('lessc -x less/' + less + '.less > css/' + less + '.css');
    });
});

gulp.task('css_build', ['less'], function() {
    var cmd = isWin ? 'r.js.cmd' : 'r.js';
    execSync(cmd + ' -o cssIn=css/core.css out=dist/maplat_core.css');
    execSync(cmd + ' -o cssIn=css/ui.css out=dist/maplat.css');
});

gulp.task('config', ['config_core', 'config_ui'], function() {
});

gulp.task('config_core', function() {
    configMaker('core');
});

gulp.task('config_ui', function() {
    configMaker('ui');
});

var configMaker = function(name) {
    var out = name == 'ui' ? '' : name + '_';
    gulp.src(['./js/polyfill.js', './js/config.js', './js/loader.js'])
        .pipe(concat('config_' + name + '.js'))
        .pipe(replace(/\s+name:[^\n]+,\n\s+out:[^\n]+,\n\s+include:[^\n]+,/, ''))
        .pipe(replace(/\{app\}/, name))
        .pipe(replace(/\{name\}/, name))
        .pipe(gulp.dest('./js/'));
    return gulp.src(['./js/config.js'])
        .pipe(concat('rjs_config_' + name + '.js'))
        .pipe(replace(/\{name\}/g, name))
        .pipe(replace(/\{out\}/, out))
        .pipe(gulp.dest('./'));
};

gulp.task('sw-build', function() {
    return wbBuild.generateSW({
        globDirectory: '.',
        globPatterns: [
            '.',
            'dist/maplat.js',
            'dist/maplat.css',
        ],
        swDest: 'service-worker.js',
        runtimeCaching: [{
            // Match any request ends with .png, .jpg, .jpeg or .svg.
            urlPattern: /\.(?:png|jpg|jpeg|svg|css|json)$/,

            // Apply a cache-first strategy.
            handler: 'cacheFirst',

            options: {
                // Use a custom cache name.
                cacheName: 'maplatCache',

                // Only cache 10 images.
                //expiration: {
                //    maxEntries: 10,
                //},
            },
        },{
            // Match any request ends with .png, .jpg, .jpeg or .svg.
            urlPattern: /^https?:/,

            // Apply a cache-first strategy.
            handler: 'cacheFirst',

            options: {
                // Use a custom cache name.
                cacheName: 'externalCache',

                // Only cache 10 images.
                //expiration: {
                //    maxEntries: 10,
                //},
            },
        }],
    });
});
