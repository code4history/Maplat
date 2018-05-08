var gulp = require('gulp'),
    execSync = require('child_process').execSync,
    spawn = require('child_process').spawn,
    concat = require('gulp-concat'),
    header = require('gulp-header'),
    zip = require('gulp-zip'),
    os = require('os'),
    fs = require('fs-extra');

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