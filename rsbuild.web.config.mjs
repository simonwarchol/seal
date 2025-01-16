import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';

const ReactCompilerConfig = {
  target: '18', // '17' | '18' | '19'
};

export default defineConfig({
  output: {
    distPath: {
      root: 'build/dist/',
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
