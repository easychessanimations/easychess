import gulp from 'gulp'
import browserSync from 'browser-sync'

const server = browserSync.create()

function reload(done) {
    server.reload();
    done();
  }
  
  function serve(done) {
    server.init({
        proxy: 'localhost:3000/?nolog=true',
        port: 3000,
        open: true,
        notify: false
    })
    done()
  }

const watch = () => gulp.watch("resources/client/js/*.js", gulp.series(reload))

const serveAndWatch = gulp.series(serve, watch)

const dev = serveAndWatch

export default dev
