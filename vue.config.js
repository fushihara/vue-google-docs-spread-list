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
    devtool: "inline-source-map", // vue-cli-service build --mode development で出力したjsでeval("ソースコード")の部分を無くす時はon
  },
  pages: {
    index: {
      entry: "src/main.ts",
      template: "src/index.html",
      filename: "index.html",
    }
  },
  chainWebpack: config => {
    const svgRule = config.module.rule('svg')
    svgRule.uses.clear();
    svgRule
      .use('url-loader')
      .loader('url-loader')
      .tap(options => {
        // このoptionsの値はundefinedの場合がある。
        if (!options) { options = {}; }
        options.limit = 10 * 1024;
        return options;
      });
    config.module
      .rule('images') // ここのimages とかは、vue-cli をデバッグ実行して変数を見るのが一番早い。結構色々ある
      .use('url-loader')
      .loader('url-loader')
      .tap(options => {
        if (!options) { options = {}; }
        options.limit = 10 * 1024;//画像に対するurl-loaderのオプションを書き換える。デフォルトは4098byte
        return options
      });
  },
  filenameHashing: true,
  publicPath: process.env.PUBLIC_PATH || "/", // 通常は「/」 servの時のURLと、build app の時に使われるっぽい
  outputDir: "build-result/unused" // buildの時、引数で指定されるので未使用のはず
}