const { merge } = require('webpack-merge');
const base = require("./base");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(base, {
  mode: "production",
  output: {
    filename: "bundle.min.js"
  },
  performance: {
    hints: false,
    maxEntrypointSize: 3512000,
    maxAssetSize: 512000
  },
  devtool: false,
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        exclude: /node_modules/,
        terserOptions: {
          output: {
            comments:false,
          }
        }
      })
    ]
  }
});
