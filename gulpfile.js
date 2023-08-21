// Gulp
const gulp = require('gulp');

// Sass/CSS stuff
const sass = require('gulp-dart-sass');
const prefix = require('gulp-autoprefixer');
const minifycss = require('gulp-clean-css');

// JavaScript
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

// Assets
// const imagemin = require('gulp-imagemin');
const sourcemap = require('gulp-sourcemaps');

gulp.task('sass-src', function () {
    return gulp
        .src(['./src/scss/*.scss'])
        .pipe(concat('main.scss'))
        .pipe(sourcemap.init())
        .pipe(
            sass({
                includePaths: ['./src/scss'],
                outputStyle: 'expanded',
            }),
        )
        .pipe(prefix('last 1 version', '> 1%'))
        .pipe(minifycss())
        .pipe(sourcemap.write('./'))
        .pipe(gulp.dest('./dist/css'));
});

// Uglify JS
gulp.task('uglify', function () {
    return gulp
        .src(['./src/js/*.js'])
        .pipe(sourcemap.init())
        .pipe(concat('main.js'))
        // .pipe(babel({ presets: ['@babel/preset-env', '@babel/preset-react'] }))
        .pipe(uglify())
        .pipe(sourcemap.write('./'))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('default', function () {
    // watch me getting Sassy
    gulp.watch(
        ['./src/scss/**/*.scss'],
        gulp.series('sass-src'),
    );
    // make my JavaScript ugly
    gulp.watch('./src/js/*.js', gulp.series('uglify'));
});
