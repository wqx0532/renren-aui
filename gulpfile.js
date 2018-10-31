var gulp   = require('gulp')
var $      = require('gulp-load-plugins')()
var fs     = require('fs')
var path   = require('path')
var del    = require('del')
var colors = require('colors')
var child_process = require('child_process')

var env  = 'dev'  // 环境变量

var isCreateAuiSkin  = false
var styleFileDir     = './src/scss'
var styleFileDirTemp = `${styleFileDir}-temp`
var skin             = 'blue'

/**
 * 复制文件
 */
gulp.task('copyFiles', () => {
  return gulp.src([
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
  return gulp.src(['./src/pages/**/*.html'])
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
  return gulp.src([`${isCreateAuiSkin ? styleFileDirTemp : styleFileDir}/aui.scss`])
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: require('./package.json')['element-theme'].browsers,
      cascade: false
    }))
    .pipe($.rename({ suffix: `-${skin}` }))
    .pipe(gulp.dest('./dist/css'))
    .pipe($.cleanCss())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/css'))
    .pipe($.connect.reload())
})

/**
 * 图片
 */
gulp.task('images', () => {
  return gulp.src(['./src/img/**/*.{gif,jpeg,jpg,png}'])
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
  return gulp.src(['./src/js/aui.js'])
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
  gulp.watch(['./src/pages/**/*.html', './src/templates/**/*.html'], ['pages'])
  gulp.watch(['./src/scss/**/*.{scss,css}'], ['styles', 'create-aui-skin'])
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
  gulp.start(['copyFiles', 'pages', 'styles', 'images', 'scripts', 'watch', 'webserver', 'create-aui-skin'])
})

gulp.task('build', () => {
  del.sync(['./dist/**'])
  env = 'prod'
  gulp.start(['copyFiles', 'pages', 'styles', 'images', 'scripts',  'create-aui-skin'])
})

/**
 * 创建element主题
 */
gulp.task('create-element-theme', () => {
  var et               = require('element-theme')
  var etOptions        = require('./package.json')['element-theme']
  var themeList        = require('./src/skins.json').filter(item => !item.hasBuild)
  var themeFileDir     = etOptions.config.replace(/(.*\/)[^\/]+/, '$1')
  var variablesDirTemp = etOptions.config.replace(/(.*\/)(.+)(\.scss)/, '$1$2-temp$3')
  if (themeList.length <= 0) { return del.sync(variablesDirTemp) }

  // 删除临时文件，保证本次操作正常执行
  del.sync(variablesDirTemp)

  // 拷贝一份scss样式文件夹，作为构建的临时处理文件夹
  child_process.spawnSync('cp', ['-r', etOptions.config, variablesDirTemp])

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

      // 修改variables-element-temp.scss文件中的$--color-primary主题变量值
      var data = fs.readFileSync(variablesDirTemp, 'utf8')
      var result = data.replace(/\$--color-primary:(.*) !default;/, `$--color-primary:${themeList[0].color} !default;`)
      fs.writeFileSync(path.resolve(variablesDirTemp), result)

      // 调用element-theme插件，生成element组件主题
      etOptions.config = variablesDirTemp
      etOptions.out = etOptions.out.replace(/(.*\/)[^\/]+/, `$1${themeList[0].name}`)
      et.run(etOptions, () => {
        themeList.splice(0, 1)
        fnCreate(themeList)
      })
    } else {
      // 删除临时文件
      del.sync(variablesDirTemp)
      console.log('\n')
      console.log(colors.green('-------------------- 构建完毕，删除临时文件 -------------------------'))
      console.log(variablesDirTemp)
      console.log('\n')

      // 删除主题不需要的部分文件
      var files = [
        `${themeFileDir}/**/*.css`,
        `!${themeFileDir}/**/index.css`,
        `!${themeFileDir}/**/fonts`
      ]
      del.sync(files)
      console.log(colors.green('-------------------- 构建完毕，删除主题多余文件 -------------------------'))
      console.log(files)
      console.log('\n')
    }
  }
})

/**
 * 创建aui皮肤
 */
gulp.task('create-aui-skin', () => {
  var variablesDir     = `${styleFileDirTemp}/variables.scss`
  var skinList         = require('./src/skins.json').filter(item => !item.hasBuild)
  if (skinList.length <= 0) { return del.sync(styleFileDirTemp) }

  // 删除临时文件，保证本次操作正常执行
  del.sync(styleFileDirTemp)

  // 拷贝一份scss样式文件夹，作为构建的临时处理文件夹
  child_process.spawnSync('cp', ['-r', styleFileDir, styleFileDirTemp])
  
  // 开始构建生成
  isCreateAuiSkin = true
  fnCreate(skinList)

  function fnCreate (skinList) {
    if (skinList.length >= 1) {
      console.log('\n')
      console.log(colors.green('-------------------- 待构建，皮肤 -------------------------'))
      console.log(skinList)
      console.log('\n')
      console.log(colors.green('-------------------- 构建中，皮肤 -------------------------'))
      console.log(skinList[0])
      console.log('\n')

      // 修改variables.scss文件中的$--color-primary皮肤变量值
      var data = fs.readFileSync(variablesDir, 'utf8')
      var result = data.replace(/\$--color-primary:(.*) !default;/, `$--color-primary:${skinList[0].color} !default;`)
      fs.writeFileSync(path.resolve(variablesDir), result)

      // 调用stylesTask，生成aui皮肤
      skin = skinList[0].name
      gulp.start(['styles'], () => {
        skinList.splice(0, 1)
        fnCreate(skinList)
      })
    } else {
      // 删除临时文件
      del.sync(styleFileDirTemp)
      console.log('\n')
      console.log(colors.green('-------------------- 构建完毕，删除临时文件 -------------------------'))
      console.log(styleFileDirTemp)
      console.log('\n')
    }
  }
})
