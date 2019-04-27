const StatsPlugin = require('stats-webpack-plugin'); // 作成したjsの中に入っているモジュールが何バイトの容量を使っているかチェックする
module.exports = {
  css: {
    extract: false,
  },
  filenameHashing: false,
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
    plugins: [
      /* new StatsPlugin('stats.json', {
        chunkModules: true,
      }) */
    ],
    //devtool: "cheap-module-source-map", // vue-cli-service build --mode development で出力したjsでeval("ソースコード")の部分を無くす時はon
  },
  pages: {
    index: {
      entry: "src/main.ts",
      template: "src/index.html",
      filename: "index.html",
    }
  },
  filenameHashing: true,
  publicPath: "/", // 通常は「/」
  outputDir: "build-result"
}