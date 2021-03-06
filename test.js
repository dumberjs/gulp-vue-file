'use strict';
const test = require('tape');
const streamAssert = require('stream-assert');
const gulp = require('gulp');
const sort = require('gulp-sort');
const url = require('postcss-url');
const gulpVue = require('./index');

test('gulpVue does not support streaming', t => {
  gulp.src('test1/**/*.vue', {buffer: false})
  .pipe(gulpVue())
  .once('error', function (err) {
    t.equal(err.message, 'Streaming is not supported');
    t.end();
  });
});

test('gulpVue compiles only vue file', t => {
  gulp.src('test1/**/*.{js,vue}', {sourcemaps: true})
  .pipe(sort()) // sort files for asserting
  .pipe(gulpVue())
  .pipe(streamAssert.length(3))
  .pipe(streamAssert.first(f => {
    t.ok(f.contents.toString().includes("Only template"));
    t.deepEqual(f.sourceMap.sources, ['1.only-template.vue']);
    t.equal(f.sourceMap.file, '1.only-template.js');
  }))
  .pipe(streamAssert.second(f => {
    t.ok(f.contents.toString().includes("Not vue file"));
    t.deepEqual(f.sourceMap.sources, ['2.pojo.js']);
    t.equal(f.sourceMap.file, '2.pojo.js');
  }))
  .pipe(streamAssert.last(f => {
    t.ok(f.contents.toString().includes("'John Doe'"));
    t.ok(f.contents.toString().includes(" color: red;"));
    t.deepEqual(f.sourceMap.sources, ['3.test.vue']);
    t.equal(f.sourceMap.file, '3.test.js');
  }))
  .pipe(streamAssert.end(t.end));
});

test('gulpVue compiles vue file with src attributes', t => {
  gulp.src('test2/**/*.vue', {sourcemaps: true})
  .pipe(gulpVue({
    style: {
      postcssPlugins: [url({url: 'inline'})]
    }
  }))
  .pipe(streamAssert.length(1))
  .pipe(streamAssert.first(f => {
    t.ok(f.contents.toString().includes("'John Doe'"));
    t.ok(f.contents.toString().includes(" color: red;"));
    t.ok(f.contents.toString().includes("data:image/png;base64,"));
    t.deepEqual(f.sourceMap.sources, ['folder/test.vue']);
    t.equal(f.sourceMap.file, 'folder/test.js');
  }))
  .pipe(streamAssert.end(t.end));
});
