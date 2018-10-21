var gulp = require('gulp')
var $    = require('gulp-load-plugins')()
var del  = require('del')

var env = 'dev' // 环境变量

/**
 * 复制文件
 */
gulp.task('copyFiles', () => {
  gulp.src([
    './src/**/*',
    '!./src/{pages,pages/**}',
    '!./src/{templates,templates/**}',
    '!./src/{scss,scss/**}',
    '!./src/{img,img/**}',
    '!./src/{js,js/**}'
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
    .pipe($.htmlTagInclude())
    .pipe(gulp.dest('./dist/pages'))
    .pipe($.connect.reload())
})

/**
 * 样式
 */
gulp.task('styles', () => {
  gulp.src(['./src/scss/aui.scss'])
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: require('./package.json')['element-theme'].browsers,
      cascade: false
    }))
    .pipe(gulp.dest('./dist/css'))
    .pipe($.cleanCss())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/css'))
    .pipe($.connect.reload())
})

/**
 * 皮肤
 */
gulp.task('skins', () => {
  gulp.src(['./src/scss/skins/**/*.scss'])
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: require('./package.json')['element-theme'].browsers,
      cascade: false
    }))
    .pipe(gulp.dest('./dist/css/skins'))
    .pipe($.cleanCss())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/css/skins'))
    .pipe($.connect.reload())
})

/**
 * 图片
 */
gulp.task('images', () => {
  gulp.src(['./src/img/**/*.{gif,jpeg,jpg,png}'])
    .pipe($.imagemin({
      'optimizationLevel': 5, // 优化等级，取值范围:0-7（默认3）
      'progressive': true,    // 无损压缩jpg图片
      'interlaced': true,     // 隔行扫描gif进行渲染
      'multipass': true       // 多次优化svg直到完全优化
    }))
    .pipe(gulp.dest('./dist/img'))
    .pipe($.connect.reload())
})

/**
 * 脚本
 */
gulp.task('scripts', () => {
  gulp.src(['./src/js/aui.js'])
    .pipe($.babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('./dist/js'))
    .pipe($.uglify())
    .on('error', (e) => {
      $.util.log($.util.colors.red('[Error]'), e.toString())
    })
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/js'))
    .pipe($.connect.reload())
})

/**
 * 监听
 */
gulp.task('watch', () => {
  gulp.watch(['./src/pages/**/*.html', './src/templates/**/*.tmpl'], ['pages'])
  gulp.watch(['./src/scss/**/*.{scss,css}'], ['styles', 'skins'])
  gulp.watch(['./src/img/**/*.{gif,jpeg,jpg,png}'], ['images'])
  gulp.watch(['./src/js/**/*.js'], ['scripts'])
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
  del.sync(['./dist/**'])
  env = 'dev'
  gulp.start(['copyFiles', 'pages', 'styles', 'skins', 'images', 'scripts', 'watch', 'webserver'])
})

gulp.task('build', () => {
  del.sync(['./dist/**'])
  env = 'prod'
  gulp.start(['copyFiles', 'pages', 'styles', 'skins', 'images', 'scripts'])
})
