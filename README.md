# vue online document list

GoogleDriveのdocumentとspreadsheetsやevernoteといったweb上にあるドキュメントを一覧表示＆検索をするvueコンポーネントです。

![縦表示](https://github.com/fushihara/vue-google-docs-spread-list/raw/master/document/2019-06-06-01-30-23.png)

![横表示](https://github.com/fushihara/vue-google-docs-spread-list/raw/master/document/2019-06-06-01-30-24.png)

# 特長

- ドキュメントの一覧は縦表示・横表示対応。
  - 横画面の時も、PCでマウスホイールの上下移動に対応。
- スマホ対応。
- GoogleDriveのdocument、spreadsheet、evernoteに対応
- 対応サービスのファイル名絞り込み＆ファイルの中身絞り込み対応
  - 検索ボックスにテキストが入力されるとリアルタイムでファイル名で検索を行います。ファイル名検索はオンメモリで行いますので高速です。
  - 同時に、googleDriveとevernoteのapiを使ってファイルの中身検索を行います。中身検索の結果は各サービスのapi依存です。

# 制限、todo

- 全ての検索にはユーザが開発者登録を行う必要がある。
- ファイル数が大量にある場合、apiの2ページ目移行のファイルでファイル名検索が出来ない。これは改善予定。
- evernoteの検索には別途サーバが必要。evernoteのsdkがクライアントサイドで動く事を考慮していないのと、サーバ側でapiの戻り値にAccess-Control-Allow-Originヘッダが含まれていないのでクライアントサイドだけでapiを叩くのはセキュリティ上厳しい。
- web上でデモが行えるようにしたい。デモ用のロジックをどう書くか考え中。

# 更新履歴
バージョン表記は、メジャーバージョンが変わった時は既存の環境で破壊的変更あり、マイナーバージョンはそれ以外、パッチバージョンは未使用。という使い方。

- 2019/06/06 v1.0.0
  - npmでリリース
- 2019/06/06 v1.1.0
  - package.jsonのfilesプロパティ更新
- 2019/06/06 v1.2.0
  - package.jsonのmainプロパティ更新
- 2019/06/06 v2.0.0
  - jsから使う時のクラス名を"vueOnlineDocumentList"から"VueOnlineDocumentList"に変更


# git cloneした後に実行出来るコマンド一覧

## 開発用
サーバを起動して確認出来る
- npm run serve

## プロダクション用
/build-result/の中に各種ファイルが作成される
- npm run build

# vueコンポーネントのpropの値

```
new GoogleDocList<object, { set_callback: (cb: () => void) => void }>({
  propsData: {
    googleApiDataRedirectUrl:"https://example.com",//コールバックURL。認証後に戻ってくるページのアドレス。GoogleAPIのコンソールで完全一致の値を指定する必要あり。
    googleApiDataClientId:"123456789-xxxxxxxx3sgsv73cqd4kdhuc1xhyjgum.apps.googleusercontent.com",//googldDriveApiのclientID
    googleApiDataClientSecret: "XXXXXXzze23o08myhpdm0waw",//googleDriveApiのClientSecret
    useChromeIdentityiApi:false,//googleDriveApiではなく、chrome.identity.getAuthToken APIを使うかどうか
    evernoteApiUrl : "https://example.com/evernote?token=xxxxxxxxx" // evernote apiのURL
  }
});
```

# google apiの準備方法

Google Cloud Platformからプロジェクトを登録。Google Drive APIを有効化。認証情報からOAuth 2.0 クライアント IDを指定。タイプは以下を参照。

## http/httpsで始まる場所

認証情報「ウェブ アプリケーション」のapiキーを作成する。クライアント IDとクライアント シークレットを得る事が出来る。
「承認済みのリダイレクト URI」にVUE_APP_CALLBACK_URLと全く同じ値をセットする。

## chrome-extensionで始まる場所

認証情報「Chrome アプリ」のapiキーを作成する。アプリケーション IDを入れる欄があるが、ストアに公開していない自作のアプリでも大丈夫。

# manifest.jsonの指定

chrome拡張の中で使う場合には、manifest.jsonの中に以下の項目を追加する必要がある。

```
{
   "permissions": [
      "identity",
      "https://www.googleapis.com/"
   ],
   "oauth2": {
      "client_id": "123456789-xxxxxxxx3sgsv73cqd4kdhuc1xhyjgum.apps.googleusercontent.com",
      "scopes": [
         "https://www.googleapis.com/auth/drive.metadata.readonly"
      ]
   }
}

```


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
- typescriptのバージョンを3.4.x に上げると壊れる https://github.com/vuejs/vue/issues/9873 ので、直るのを待つ。
- cdnに配信するタイミングを確認する。毎回buildしてjsを手動配置するのは使いにくい。
