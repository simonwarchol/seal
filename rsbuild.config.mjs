import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { rspack } from '@rspack/core';

const ReactCompilerConfig = {
  target: '18',
};

const isDev = process.env.NODE_ENV === 'development';
console.log('isDev', isDev)
const apiUrl = isDev ? 'http://0.0.0.0:8181' : '/api';

export default defineConfig({
  environments: {
    widget: {
      mode: 'production',
      output: {
        distPath: {
          root: 'seal_widget/static',
          js: '',
          css: '',
        },
        filenameHash: false,
        minify: false,
        dataUriLimit: 100 * 1024,
        legalComments: 'none',
        filename: {
          js: '[name].js',
          css: '[name].css',
        },
        sourceMap: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
      tools: {
        htmlPlugin: false,
        rspack: (config) => {
          config.experiments.outputModule = true;
          config.module.parser.javascript.dynamicImportMode = 'eager';
          config.optimization.minimizer = [];
          config.output.library = {
            type: 'module',
          };
          return config;
        },
      },
      source: {
        entry: {
          index: './src/widget.jsx',
        },
        define: {
          'process.env.BASE_URL': JSON.stringify('http://0.0.0.0:8181'),
          'import.meta.env.BASE_URL': JSON.stringify('http://0.0.0.0:8181'),
        },
      },
    },
  
    web: {
      html: {
        title: 'SEAL',
        appIcon: {
          name: 'SEAL',
          icons: [
            { src: './src/public/icon-192.png', size: 192 },
            { src: './src/public/icon-512.png', size: 512 },
          ],
        },
        favicon: './src/public/favicon.ico',
      },
      output: {
        distPath: {
          root: 'build/dist/',
        },
      },
      source: {
        define: {
          'process.env.BASE_URL': JSON.stringify(apiUrl),
          'import.meta.env.BASE_URL': JSON.stringify(apiUrl),
        },
      },
    },
  },
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift([
          'babel-plugin-react-compiler',
          ReactCompilerConfig,
        ]);
      },
    }),
  ],
});