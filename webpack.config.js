const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProduction = process.env.NODE_ENV.trim() == "production";

module.exports = {
  entry: {
    khoadev: "./src/index.ts",
  },
  output: {
    library: "khoadev",
    filename: isProduction ? "[name].min.js" : "[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    libraryTarget: "umd",
    clean: isProduction,
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    open: true,
    host: "0.0.0.0",
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
    }),
    new webpack.BannerPlugin({
      banner: "The product is owned by Vu Tri Khoa",
    }),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  mode: isProduction ? "production" : "development",
  watch: false,
};
