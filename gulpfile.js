var gulp = require('gulp'),
    rjs = require('gulp-requirejs'),
    concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	header = require('gulp-header');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

gulp.task('build', ['concat_promise']);

gulp.task('concat_promise', ['build_withoutpromise'], function() {
	return gulp.src(['./js/aigle-es5.min.js', 'js/maplat_withoutpromise.js'])
    	.pipe(concat('maplat.js'))
	    .pipe(uglify({ 
        	output:{
          		comments: /^!/
        	}
	    }))//{preserveComments: 'some'}))
    	.pipe(header(banner, {pkg: pkg}))
    	.pipe(gulp.dest('./js/'));
});

gulp.task('build_withoutpromise', function() {
    return rjs({
        baseUrl: 'js',
    	name: 'config',
	    out: 'js/maplat_withoutpromise.js',
	    optimize: '',
    	include: ['require.min'],
	    paths: {
    	    'i18n': 'i18next.min',
        	'i18nxhr': 'i18nextXHRBackend.min',
	        'turf': 'turf_maplat.min',
    	    'swiper': 'swiper.min',
        	'ol3': 'ol-debug',
	        'ol-custom': 'ol-custom',
    	    'bootstrap': 'bootstrap-native',
	        'mapshaper': 'mapshaper_maplat',
        	'resize': 'detect-element-resize'
    	},
	    shim: {
    	    'i18nxhr': {
        	    deps: ['i18n']
	        },
    	    'turf': {
        	    exports: 'turf'
	        },
    	    'resize': {
        	    exports: 'addResizeListener'
	        },
    	    'app': {
        	    deps: ['histmap', 'histmap_tin']
	        }
    	}
    })
    .pipe(gulp.dest('./')); // pipe it to the output DIR
});