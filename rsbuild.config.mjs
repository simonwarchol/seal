import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { rspack } from '@rspack/core';

const ReactCompilerConfig = {
  target: '18',
};
export default defineConfig({
  environments: {
    widget: {
      mode: 'production',
      output: {
        distPath: {
          root: 'widget/static',
          js: '',
          css: '',
        },
        filenameHash: false,
        minify: false,

        legalComments: 'none',
        filename: {
          js: '[name].js',
          css: '[name].css',
        },
        sourceMap: false

      },
      mode: 'none',
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
        buildCache: true,

      },
      tools: {
        htmlPlugin: false,
        rspack: (config) => {
          config.experiments.outputModule = true;
          config.module.parser.javascript.dynamicImportMode = 'eager'
          config.optimization.minimizer = []
          config.output.library = {
            type: 'module',
          };
          return config;
        },
      },
      source: {
        entry: {
          index: './src/widget.jsx',
        }
      },
    },
    web: {
      output: {
        distPath: {
          root: 'build/dist/',
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
    })
  ],
});
