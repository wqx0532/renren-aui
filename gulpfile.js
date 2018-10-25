var gulp   = require('gulp')
var $      = require('gulp-load-plugins')()
var fs     = require('fs')
var path   = require('path')
var del    = require('del')
var colors = require('colors')
var child_process = require('child_process')

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
    .pipe($.htmlTagInclude())
    .pipe($.if(env === 'prod', $.replace(/src=\"(.*)\/vue.js\"/g, (match, p1) => {
      return `src="${p1}/vue.min.js"`
    })))
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

/**
 * element主题
 */
gulp.task('element-theme', () => {
  var themeList        = require('./src/skins.json').filter(item => !item.hasBuild)
  var styleFileDir     = './src/scss'
  var styleFileDirTemp = `${styleFileDir}-temp`
  var themeFileDir     = './src/element-theme'
  var et               = require('element-theme')
  var etOptions        = require('./package.json')['element-theme']
  
  if (themeList.length <= 0) { return del(styleFileDirTemp) }

  // 删除临时文件，保证本次操作正常执行
  del(styleFileDirTemp)

  // 拷贝一份scss样式文件夹，作为构建的临时处理文件夹
  child_process.spawnSync('cp', ['-r', styleFileDir, styleFileDirTemp])

  // 开始构建生成
  fnCreate(themeList)

  function fnCreate (themeList) {
    if (themeList.length >= 1) {
      console.log('\n')
      console.log(colors.green('-------------------- 待构建，主题 -------------------------'))
      console.log(themeList)
      console.log('\n')
      console.log(colors.green('-------------------- 构建中，主题 -------------------------'))
      console.log(themeList[0])
      console.log('\n')

      // 修改.scss临时文件中的$--color-primary主题变量值
      var data = fs.readFileSync(etOptions.config, 'utf8')
      var result = data.replace(/\$--color-primary:(.*) !default;/, `$--color-primary:${themeList[0].color} !default;`)
      fs.writeFileSync(path.resolve(etOptions.config), result)

      // 调用element-theme插件，生成element组件主题
      etOptions.out = `${themeFileDir}/${themeList[0].name}`
      et.run(etOptions, () => {
        themeList.splice(0, 1)
        fnCreate(themeList)
      })
    } else {
      // 删除临时文件
      del(styleFileDirTemp)
      console.log('\n')
      console.log(colors.green('-------------------- 构建完毕，删除临时文件 -------------------------'))
      console.log(styleFileDirTemp)
      console.log('\n')
      
      // 删除主题不需要的部分文件
      var files = [
        `${themeFileDir}/**/*.css`,
        `!${themeFileDir}/**/index.css`,
        `!${themeFileDir}/**/fonts`
      ]
      del(files)
      console.log(colors.green('-------------------- 构建完毕，删除主题独立组件文件 -------------------------'))
      console.log(files)
      console.log('\n')
    }
  }
})