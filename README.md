  [![NPM Version][npm-version-image]][npm-site-url]
  [![NPM Downloads][downloads-image]][npm-site-url]
  [![NPM Minzip Size][npm-minzip-filesize]][npm-site-url]
  [![License][license-image]][npm-site-url]
  [![last commit date][last-commit-date-image]][npm-site-url]

<!--URL定義一覧 -->
[npm-site-url]: https://npmjs.org/package/@fushihara/vue-online-document-list
[npm-version-image]: https://img.shields.io/npm/v/@fushihara/vue-online-document-list.svg
[downloads-image]: https://img.shields.io/npm/dm/@fushihara/vue-online-document-list.svg
[npm-minzip-filesize]: https://img.shields.io/bundlephobia/minzip/@fushihara/vue-online-document-list.svg
[license-image]: https://img.shields.io/npm/l/@fushihara/vue-online-document-list.svg
[last-commit-date-image]: https://img.shields.io/github/last-commit/fushihara/vue-online-document-list.svg

# vue online document list

GoogleDriveのdocumentとspreadsheetsやevernoteといったweb上にあるドキュメントを一覧表示＆検索をするvueコンポーネントです。

各種サービスごとにAPIを使う準備が必要なので、このモジュールをインストールしただけでは使えません。

![縦表示](https://github.com/fushihara/vue-google-docs-spread-list/raw/master/document/2019-06-06-01-30-23.png)

![横表示](https://github.com/fushihara/vue-google-docs-spread-list/raw/master/document/2019-06-06-01-30-24.png)

# 特長

- ドキュメントの一覧は縦表示・横表示対応。
  - 横画面の時も、PCでマウスホイールの上下移動に対応。
- スマホ対応。
- GoogleDriveのdocument、spreadsheet、evernoteに対応。
  - GoogleDriveはAPI登録が必要。
  - evernoteはapiサーバの設置が必要。
- 対応サービスのファイル名絞り込み＆ファイルの中身絞り込み対応
  - 検索ボックスにテキストが入力されるとリアルタイムでファイル名で検索を行います。ファイル名検索はオンメモリで行いますので高速です。
  - 同時に、googleDriveとevernoteのapiを使ってファイルの中身検索を行います。中身検索の結果は各サービスのapi依存です。

# 使い方

## 初期化

初期化の方法。最低でも、以下の手順でUIが表示される事の確認は出来る。

### npm上で使う方法

cliで以下を実行
```
> npm install @fushihara/vue-online-document-list
```

vueファイル上で以下の記述

```
// HelloWorld.vue
<template>
  <div style="border:solid 1px black;background:#EEE;padding:10px;">
    <OnlineDocumentList v-bind="OnlineDocumentListData"></OnlineDocumentList>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import OnlineDocumentList from '@fushihara/vue-online-document-list';
export default Vue.extend({
  mounted: function () { },
  props: {  },
  components: {
    OnlineDocumentList
  },
  data: function () {
    return {
      OnlineDocumentListData: {
         googleApiDataRedirectUrl: "http://localhost:8080/", 略
      }
    };
  }
});
</script>
```

### html上で使う方法

```
<script src="https://unpkg.com/vue@^2.6.10" defer></script>
<script src="https://unpkg.com/@fushihara/vue-online-document-list@^2.0.0" defer></script>
<script>
window.addEventListener("DOMContentLoaded",(e)=>{
  const v = new VueOnlineDocumentList({
    propsData:{
      googleApiDataRedirectUrl:"http://localhost:8080/", 略
    }
  });
  v.$mount("#vue-online-document-list");
}, false);
<div id="vue-online-document-list"></div>
```

## オプションの値

定義されている全てのpropは以下の通り

|propName|type|
|-|-|
|googleApiDataRedirectUrl|String|
|googleApiDataClientId|String|
|googleApiDataClientSecret|String|
|useChromeIdentityiApi|Boolena|
|evernoteApiUrl|String|
|evernoteApiDeveloperToken|String|


### Google Document spreadsheetsを使う場合

Google Drive Apiを登録し、ClientIdとClientSecretを取得します。登録は https://console.developers.google.com/ から。

詳しい手順は省略しますが、最終的に以下のページにあるクライアントID、クライアントシークレット、承認済みのリダイレクトURIが必要となります。

![google developer console](https://github.com/fushihara/vue-google-docs-spread-list/raw/master/document/2019-06-07-20-59-10.png)

その後、以下のプロパティを設定する

|プロパティ名|サンプル値|
|-|-|
|googleApiDataRedirectUrl|http://localhost:8080/|
|googleApiDataClientId|651111111168-ldxxxxx9h.apps.googleusercontent.com|
|googleApiDataClientSecret|xxxxxxxxxxxxxxxxx|


### Google Document spreadsheetsをchromeの拡張の中で使う場合

Google Drive Api を使う場合は認証後に戻ってくるコールバックURLを登録する必要があるが、そのURLはhttpかhttpsしか指定できず、chrome-extensionは登録出来ないので特別な対応が必要となる。

最終的には以下の内容を登録する必要がある。chromeウェブストアのURLを入れる欄があるが、chromeストアに公開していないプライベートなアプリでもアプリケーションIDを入力すれば大丈夫。

![google developer console](https://github.com/fushihara/vue-google-docs-spread-list/raw/master/document/2019-06-07-21-02-19.png)

ここで取得したクライアントIDをchrome拡張のmanifest.jsonの以下の所に記入する。oauth2プロパティと、permissionsプロパティの中にidentityを指定する事が大切。
```
// manifest.json
{
   "manifest_version": 2,
   "name": "speelDial",
   "permissions": [
      "identity",
      "https://www.googleapis.com/"
   ],
   "version": "1.0.0",
   "oauth2": {
      "client_id": "651111111168-ldxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx9h.apps.googleusercontent.com",
      "scopes": [
         "https://www.googleapis.com/auth/drive.metadata.readonly"
      ]
   }
}
```
その後、以下のプロパティを設定する

|プロパティ名|サンプル値|
|-|-|
|useChromeIdentityiApi|true|


### evernoteを使う場合

evernoteのAPIはサーバ上から使われる事が前提になっているので、自分でサーバを用意する必要がある。
サーバ側のAPIはこちら https://github.com/fushihara/evernote-booklist が必要。

また、evernoteのDeveloper Tokensを取得する必要がある。これは2019/06/01 時点で自動化されておらず、サポートフォーラムで運営にDMを送ってもらう必要がある・・かも。あれこれやっているうちにいつの間にか有効になっていたので自身無い。
最終的に`S=a99:U=012abc:E=12345abcdef:C=1234abcde:P=1ab:A=en-devtoken:V=2:H=123abc123abc123abc123abc`の様な値が取得出来るはず。

その後、以下のプロパティを設定する

|プロパティ名|サンプル値|
|-|-|
|evernoteApiUrl|http://example.com|
|evernoteApiDeveloperToken|S=a99:U=012abc:E=12345abcdef: 略|


# 制限、todo

- 全ての検索にはユーザが開発者登録を行う必要がある。
- ファイル数が大量にある場合、apiの2ページ目移行のファイルでファイル名検索が出来ない。これは改善予定。
- evernoteの検索には別途サーバが必要。evernoteのsdkがクライアントサイドで動く事を考慮していないのと、サーバ側でapiの戻り値にAccess-Control-Allow-Originヘッダが含まれていないのでクライアントサイドだけでapiを叩くのはセキュリティ上厳しい。
- web上でデモが行えるようにしたい。デモ用のロジックをどう書くか考え中。

# 更新履歴
バージョン表記は、メジャーバージョンが変わった時は既存の環境で破壊的変更あり、マイナーバージョンはそれ以外、パッチバージョンは未使用。という使い方。
- 2019/07/13 v2.4.0
  - LicenseをMITからApache-2.0に変更。不都合あったらごめん。
  - package.jsonのリンクミスを修正
  - readmeにバッジを色々追加
- 2019/07/13 v2.3.0
  - ソースコードにmapファイルを追加
- 2019/07/13 v2.2.0
  - readmeの更新履歴を新しい順に変更
  - evernoteのPCで開くURLを新しいwebクライアントに変更
- 2019/06/07 v2.1.0
  - readmeを更新
- 2019/06/06 v2.0.0
  - jsから使う時のクラス名を"vueOnlineDocumentList"から"VueOnlineDocumentList"に変更
- 2019/06/06 v1.2.0
  - package.jsonのmainプロパティ更新
- 2019/06/06 v1.1.0
  - package.jsonのfilesプロパティ更新
- 2019/06/06 v1.0.0
  - npmでリリース

# git cloneした後に実行出来るコマンド一覧

## 開発用
サーバを起動して確認出来る
- npm run serve

## プロダクション用
/build-result/の中に各種ファイルが作成される
- npm run build

# 参考URL一覧

## APIはこちらから登録

https://console.cloud.google.com/apis/

作成する認証情報は OAuth 2.0 クライアント ID


## google drive apiのドキュメント

https://developers.google.com/drive/api/v3/about-auth?hl=JA

https://developer.chrome.com/extensions/identity#method-getAccounts

## オープンソース

- 読み込み中svgアニメーション作成
  - https://loading.io/
- 各種アイコン
  - https://fontawesome.com/license/free

# todo

- google docとevernoteを完全に同一扱いにする。
   - 後々、pocket とか todoist も扱いたいので。
   - 最初のgoogleAPIの認証ボタンもダサいのでなんとかする。
- google apiのaccess tokenが切れた時に再取得する処理を入れる
  - localStorageにリフレッシュトークンしか保存してないので、そこをなんとかする。
- apiでエラーが帰ってきた時に画面上にエラーを表示する場所を確保する。
  - 小さい画面でも使っているので場所を悩み中。
