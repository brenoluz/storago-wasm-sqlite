const path = require('path');

module.exports = {
  entry: {
    worker: './src/index.ts',
  },
  mode: 'production',
  devServer: {
    static: {
      directory: path.join(__dirname, 'test'),
    },
    compress: true,
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'pastoral',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
};
