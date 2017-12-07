var gulp = require('gulp'),
    execSync = require('child_process').execSync,
    concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	header = require('gulp-header'),
    os = require('os'),
    fs = require('fs');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');
var cmd = os.type().toString().match('Windows') !== null  ? 'r.js.cmd' : 'r.js';

gulp.task('build', ['concat_promise'], function(){
    fs.unlinkSync('./js/maplat_withoutpromise.js');
});

gulp.task('concat_promise', ['build_withoutpromise'], function() {
	return gulp.src(['./js/aigle-es5.min.js', 'js/maplat_withoutpromise.js'])
    	.pipe(concat('maplat.js'))
	    .pipe(uglify({ 
        	output:{
          		comments: /^[! \*]/
        	}
	    }))
    	.pipe(header(banner, {pkg: pkg}))
    	.pipe(gulp.dest('./js/'));
});

gulp.task('build_withoutpromise', function() {
    execSync(cmd + ' -o rjs_config.js')
});