import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';

const ReactCompilerConfig = {
  target: '18',
};
export default defineConfig({
  output: {
    distPath: {
      root: 'widget/',
    },
    filename: {
      js: 'seal.js',
      css: 'seal.css',
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
      console.log('simon', config?.output);
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
