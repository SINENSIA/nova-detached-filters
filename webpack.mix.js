let path = require('path');
let mix = require('laravel-mix');
let tailwindcss = require('tailwindcss');
let postcssImport = require('postcss-import');

let NovaDevtool = null;
try {
  NovaDevtool = require('laravel-nova-devtool');
} catch (error) {
  NovaDevtool = null;
}

if (NovaDevtool) {
  mix.extend('nova', new NovaDevtool());
} else {
  mix.extend('nova', {
    register() {},
  });
}

mix
  .setPublicPath('dist')
  .js('resources/js/entry.js', 'js')
  .vue({ version: 3 })
  .postCss('resources/css/entry.css', 'dist/css/', [postcssImport(), tailwindcss('tailwind.config.js')])
  .nova('outl1ne/nova-detached-filters')
  .alias({
    'laravel-nova-mixins':
      process.env.NOVA_MIXINS_PATH ||
      path.resolve(__dirname, '../eoelitev2/vendor/laravel/nova/resources/js/mixins'),
  })
  .webpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    },
  });
