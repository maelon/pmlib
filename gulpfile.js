var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean');

//gulp.task('minifycss', function() {
    //return gulp.src('src/*.css')      //压缩的文件
        //.pipe(gulp.dest('dist/css'))   //输出文件夹
        //.pipe(minifycss());   //执行压缩
//});

gulp.task('minifyjs', function() {
    return gulp.src('src/*.js')
        .pipe(concat('pmlib.js'))    //合并所有js到pmlib.js
        .pipe(gulp.dest('dist'))    //输出pmlib.js到文件夹
        .pipe(rename({suffix: '.min'}))   //rename压缩后的文件名
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('dist'));  //输出
});

//gulp.task('clean', function(cb) {
    //del(['dist'], cb)
//});

gulp.task('clean', function() {  
  return gulp.src(['dist'], {read: false})
    .pipe(clean());
});

gulp.task('default', ['clean'], function() {
    gulp.start('minifyjs');
});

