var browserSync = require('browser-sync');
var cleancss     = require('gulp-clean-css');
var cp          = require('child_process');
var download = require('gulp-download');
var fs = require('fs');
var gifsicle = require('imagemin-gifsicle');
var gulp        = require('gulp');
var imagemin = require('gulp-imagemin');
var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var jpegtran = require('imagemin-jpegtran');
var messages = {jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'};
var minifyCss = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var paths = require('./gulp_config.js');
var pngquant = require('imagemin-pngquant');
var postcss      = require('gulp-postcss');
var prefix      = require('gulp-autoprefixer');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');
var sass        = require('gulp-sass');
var shell = require('gulp-shell');
var uncss = require('gulp-uncss');


/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.sass')
        .pipe(sass({
            includePaths: ['scss'],
            style: 'compressed',
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(cleancss())
        .pipe(gulp.dest('_includes'))
        .pipe(browserSync.reload({stream:true}))
        // .pipe(gulp.dest('css'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/**/*.sass', ['sass']);
    gulp.watch(['*.html', '_layouts/*.html', '_posts/*','_includes/*', 'assets/js/*', '*.md','_lookbooks/*', '_lyrics/*'], ['jekyll-rebuild']);
});

/**
 * Optimize Images
 */

gulp.task('optimize-images', function () {
    return gulp.src(['_site/**/*.jpg', '_site/**/*.jpeg', '_site/**/*.gif', '_site/**/*.png'])
        .pipe(imagemin({
            progressive: false,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant(), jpegtran(), gifsicle()]
        }))
        .pipe(gulp.dest('_site/'));
});

/**
 * Optimize the HTML
 */

gulp.task('optimize-html', function() {
    return gulp.src('_site/**/*.html')
        .pipe(minifyHTML({
            quotes: true
        }))
        .pipe(gulp.dest('_site/'));
});

/**
 *
 */


/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'optimize-html', 'watch']);

/**
 * Build site with optimized files
 */

gulp.task('build', function(callback){
    runSequence(
        'sass',
        'jekyll-build',
        'optimize-images',
        'optimize-html',
        callback
    );
});