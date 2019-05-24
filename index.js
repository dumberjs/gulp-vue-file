'use strict';
const {Transform} = require('stream');
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

  return new Transform({
    objectMode: true,
    transform: function(file, enc, cb) {
      if (file.isStream()) {
        this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming is not supported'));
        return;
      }

      if (file.isBuffer()) {
        if (file.extname === '.vue') {
          const content = file.contents.toString();

          // need to use localPath instead of file.relative (relative to file.base)
          // as vue compiler needs the path to be related to process.cwd() in order
          // for additional resources locating.
          const localPath = path.relative(file.cwd, file.path);

          const result = assemble(
            vueCompiler,
            localPath,
            vueCompiler.compileToDescriptor(localPath, content),
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
            // Normalize file path to relative to base.
            // This is to match the default behaviour of gulp source map.
            map.sources = map.sources.map(f =>
              normalize(path.relative(file.base, path.resolve(file.cwd, f)))
            );
            map.file = normalize(file.relative);
            applySourceMap(file, map);
          }
        }
      }

      cb(null, file);
    }
  });
};

function normalize(path) {
  return path.replace(/\\/g, '/');
}
