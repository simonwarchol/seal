const { rspack } = require('@rspack/core');

module.exports = {
  devtool: false, // Disable source maps

  entry: {
    seal: './src/widget.jsx',
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                },
              },
            },
          },
          { loader: 'babel-loader' },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.tsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.css$/i,
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
        type: 'javascript/auto',
      },
    ],
  },
  output: {
    library: {
      // do not specify a `name` here
      type: 'module',
    },// Optional: Ensure the file extension is suitable for ESM
    path: 'widget/static',
  },
  plugins: [new rspack.CssExtractRspackPlugin({})],

};
