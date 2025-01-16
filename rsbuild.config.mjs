import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';

const ReactCompilerConfig = {
  target: '18',
};
export default defineConfig({
  environments: {
    widget: {
      output: {
        distPath: {
          root: 'widget/static',
          js: '',
          css: '',
        },
        legalComments: 'none',
        filename: {
          js: '[name].js',
          css: '[name].css',
        },
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
  plugins: [pluginReact(), pluginBabel({
    include: /\.(?:jsx|tsx)$/,
    babelLoaderOptions(opts) {
      opts.plugins?.unshift([
        'babel-plugin-react-compiler',
        ReactCompilerConfig,
      ]);
    },
  })],
});
