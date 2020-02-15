import gulp from 'gulp'
import browserSync from 'browser-sync'
import browserify from 'browserify'
import source from 'vinyl-source-stream'

const server = browserSync.create()

function reload(done) {
    server.reload();
    done();
  }
  
  function serve(done) {
    server.init({
        //proxy: 'localhost:3000/?nolog=true',
        proxy: 'localhost:3000/node',
        port: 3000,
        open: true,
        notify: false
    })
    done()
  }

function build() {  
  return (
      browserify({
          entries: ["resources/client/nodejs/index.js"]
      })          
          .bundle()          
          .pipe(source("bundle.js"))          
          .pipe(gulp.dest("dist/js"))
  )
}

//const watch = () => gulp.watch("resources/client/js/*.js", gulp.series(reload))

const watch = () => gulp.watch("resources/client/nodejs/*.js", gulp.series(build, reload))

const serveAndWatch = gulp.series(serve, watch)

const dev = serveAndWatch

export default dev
