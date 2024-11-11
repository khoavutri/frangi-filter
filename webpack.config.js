const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const baseConfig = (isProduction) => {
  const config = {
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
    devtool: "source-map",
    mode: isProduction ? "production" : "development",
    watch: false,
  };

  if (!isProduction) {
    config.devServer = {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      open: true,
      host: "0.0.0.0",
      port: 8080,
    };
  }

  return config;
};

module.exports = (() => {
  const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "";
  switch (env) {
    case "production":
      return baseConfig(true);
    case "development":
      return baseConfig(false);
    default:
      return [baseConfig(false), baseConfig(true)];
  }
})();
