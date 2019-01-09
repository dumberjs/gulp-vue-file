'use strict';
const test = require('tape');
const streamAssert = require('stream-assert');
const gulp = require('gulp');
const sort = require('gulp-sort');
const gulpVue = require('./index');

test('gulpDumber does not support streaming', t => {
  gulp.src('test1/**/*.vue', {buffer: false})
  .pipe(gulpVue())
  .once('error', function (err) {
    t.equal(err.message, 'Streaming is not supported');
    t.end();
  });
});

test('gulpDumber compiles only vue file', t => {
  gulp.src('test1/**/*.{js,vue}', {sourcemaps: true})
  .pipe(sort()) // sort files for asserting
  .pipe(gulpVue())
  .pipe(streamAssert.length(3))
  .pipe(streamAssert.first(f => {
    t.ok(f.contents.toString().includes("Only template"));
    t.deepEqual(f.sourceMap.sources, ['only-template.vue']);
    t.equal(f.sourceMap.file, 'only-template.js');
  }))
  .pipe(streamAssert.second(f => {
    t.ok(f.contents.toString().includes("Not vue file"));
    t.deepEqual(f.sourceMap.sources, ['pojo.js']);
    t.equal(f.sourceMap.file, 'pojo.js');
  }))
  .pipe(streamAssert.last(f => {
    t.ok(f.contents.toString().includes("'John Doe'"));
    t.ok(f.contents.toString().includes(" color: red;"));
    t.deepEqual(f.sourceMap.sources, ['test.vue']);
    t.equal(f.sourceMap.file, 'test.js');
  }))
  .pipe(streamAssert.end(t.end));
});

test('gulpDumber compiles vue file with src attributes', t => {
  gulp.src('test2/**/*.vue')
  .pipe(gulpVue())
  .pipe(streamAssert.length(1))
  .pipe(streamAssert.first(f => {
    t.ok(f.contents.toString().includes("'John Doe'"));
    t.ok(f.contents.toString().includes(" color: red;"));
    // didn't turn on sourcemaps on gulp.src
    t.notOk(f.sourceMap);
  }))
  .pipe(streamAssert.end(t.end));
});
