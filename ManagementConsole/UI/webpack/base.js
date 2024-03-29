const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ProgressPlugin = require('progress-webpack-plugin');

module.exports = {
  mode: "development",
  devtool: "eval-source-map",
  output: {
    path: __dirname + '/dist/',
    filename: 'bundle.js'
  },
  devServer: {
    static: path.join(__dirname, '../dist/'),
    devMiddleware: {
      writeToDisk: true,
    },
  },
  entry: path.resolve(__dirname, '../src') + '/Game.ts',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml)$/i,
        use: "file-loader"
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    mainFields: ['browser', 'main', 'module'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static' },
      ]
    }),
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true)
    }),
    new CleanWebpackPlugin({
      root: path.resolve(__dirname, "../")
    }),
    new HtmlWebpackPlugin({
      template: "./index.html"
    }),
    new ProgressPlugin({
      activeModules: false,
      entries: true,
      handler(percentage, message, ...args) {
        // custom logic
      },
      modules: true,
      modulesCount: 5000,
      profile: false,
      dependencies: true,
      dependenciesCount: 10000,
      percentBy: null,
    })
  ]
};
