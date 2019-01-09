'use strict';
const through = require('through2');
const PluginError = require('plugin-error');
const path = require('path');
const {createDefaultCompiler, assemble} = require('@vue/component-compiler');
const applySourceMap = require('vinyl-sourcemaps-apply');
const PLUGIN_NAME = 'vue-file';

module.exports = function (opts) {
         // compiler options
  const {script, style, template, resolve,
         // assemble options
         normalizer, styleInjector, styleInjectorSSR} = opts || {};

  const vueCompiler = createDefaultCompiler({script, style, template, resolve});

  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming is not supported'));
      return;
    }

    if (file.isBuffer()) {
      if (file.extname === '.vue') {
        const content = file.contents.toString();

        const result = assemble(
          vueCompiler,
          file.path,
          vueCompiler.compileToDescriptor(file.path, content),
          {normalizer, styleInjector, styleInjectorSSR}
        );

        file.extname = '.js';
        file.contents = Buffer.from(result.code);

        const {map} = result;
        if (file.sourceMap) {
          // With .vue file only contains <template> node,
          // @vue/component-compiler doesn't insert sourcesContent.
          // I don't quite understand.
          if (!map.sourcesContent) map.sourcesContent = [content];
          // Normalize file path
          map.sources = map.sources.map(f => path.relative(file.base, f));
          map.file = file.basename;
          applySourceMap(file, map);
        }
      }
    }

    cb(null, file);
  });
};
