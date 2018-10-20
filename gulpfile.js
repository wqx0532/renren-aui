var gulp = require('gulp')
var $    = require('gulp-load-plugins')()
var del  = require('del')

var env = 'dev' // 环境变量

/**
 * 复制文件
 */
gulp.task('copyFiles', () => {
  gulp.src([
    './src/**',
    '!./src/{styles,styles/**}',
    '!./src/{images,images/**}',
    '!./src/{scripts,scripts/**}'
  ])
    .pipe(gulp.dest('./dist'))
})

/**
 * 页面
 */
gulp.task('pages', () => {
  gulp.src(['./src/pages/**/*.html'])
    .pipe($.if(env === 'prod', $.replace(/src=\"(.*)\/vue.js\"/g, (match, p1) => {
      return `src="${p1}/vue.min.js"`
    })))
    .pipe(gulp.dest('./dist/pages'))
    .pipe($.connect.reload())
})

/**
 * 样式
 */
gulp.task('styles', function() {
  gulp.src(['./src/scss/aui.scss'])
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: [
        '> 1%',
        'last 2 versions',
        'not ie <= 10'
      ],
      cascade: false
    }))
    .pipe(gulp.dest('./dist/styles'))
    .pipe($.minifyCss())
    .pipe($.concat('aui.min.css'))
    .pipe(gulp.dest('./dist/styles'))
    .pipe($.connect.reload())
});

/**
 * 图片
 */
gulp.task('images', () => {
  gulp.src(['./src/images/**/*.{gif,jpeg,jpg,png}'])
    .pipe($.imagemin({
      'optimizationLevel': 5, // 优化等级，取值范围:0-7（默认3）
      'progressive': true,    // 无损压缩jpg图片
      'interlaced': true,     // 隔行扫描gif进行渲染
      'multipass': true       // 多次优化svg直到完全优化
    }))
    .pipe(gulp.dest('./dist/images'))
    .pipe($.connect.reload())
})

/**
 * 脚本
 */
gulp.task('scripts', () => {
  gulp.src(['./src/scripts/aui.js'])
    .pipe($.babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('./dist/scripts'))
    .pipe($.uglify())
    .on('error', (e) => {
      $.util.log($.util.colors.red('[Error]'), e.toString())
    })
    .pipe($.concat('aui.min.js'))
    .pipe(gulp.dest('./dist/scripts'))
    .pipe($.connect.reload())
})

/**
 * 监听
 */
gulp.task('watch', () => {
  gulp.watch(['./src/pages/**/*.html'], ['pages'])
  gulp.watch(['./src/images/**/*.{gif,jpeg,jpg,png}'], ['images'])
  gulp.watch(['./src/scripts/**/*.js'], ['scripts'])
})

/**
 * 本地web服务器
 */
gulp.task('webserver', () => {
  $.connect.server({
    'port': 9000,
    'root': './dist',
    'livereload': true
  })
})

gulp.task('serve', () => {
  env = 'dev'
  gulp.start(['copyFiles', 'pages', 'styles', 'images', 'scripts', 'watch', 'webserver'])
})

gulp.task('build', () => {
  del.sync(['./dist/**'])
  env = 'prod'
  gulp.start(['copyFiles', 'pages', 'styles', 'images', 'scripts'])
})
