/* eslint arrow-body-style: 0 */

import gulp from 'gulp';

import clean from 'gulp-clean';

gulp.task('clean', () => gulp.src('./build', { read: false, allowEmpty: true })
  .pipe(clean({ force: true })));

gulp.task('transpile', gulp.series('clean'), () => gulp.src('./src/**/*.js')
    .on('error', (err) => { console.error(err); }) // eslint-disable-line
  .pipe(gulp.dest('./build/')));
// Rerun the task when a file changes
gulp.task('build', gulp.series('transpile'));
gulp.task('watch', gulp.series('build'), () => gulp.watch('./src/**/*.js', ['transpile']));

gulp.task('default', gulp.series('build'));
