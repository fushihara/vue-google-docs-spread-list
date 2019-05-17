//const StatsPlugin = require('stats-webpack-plugin'); // 作成したjsの中に入っているモジュールが何バイトの容量を使っているかチェックする
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
    devServer: {
      clientLogLevel: 'info'
    },
    devtool: "cheap-module-source-map", // vue-cli-service build --mode development で出力したjsでeval("ソースコード")の部分を無くす時はon
  },
  pages: {
    index: {
      entry: "src/main.ts",
      template: "src/index.html",
      filename: "index.html",
    }
  },
  filenameHashing: true,
  publicPath: process.env.PUBLIC_PATH ||  "/", // 通常は「/」 servの時のURLと、build app の時に使われるっぽい
  outputDir: "build-result/unused" // buildの時、引数で指定されるので未使用のはず
}