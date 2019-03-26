# vue google doc list

GoogleDriveAPIを使って、documentとspreadsheetsを一覧表示する。

公式のアプリを使うとdocumentの一覧とspreadsheetsの一覧が別に表示されるが、このvueコンポーネントを使うと一覧表示出来る。

通常のwebページに加えて、chromeの拡張ページ内でも使う事が出来る。chromeの拡張ページはURLがchrome-extension:// で始まるが、GoogleAPIで認証後のコールバックにはhttp もしくはhttpsで始まるURLしか指定出来ないので別の仕組みが必要。

![プレビュー](http://i.imgur.com/xxxx.png )

# git cloneした後に実行出来るコマンド一覧

## 開発用。サーバを起動して確認出来る
- npm run serve

## プロダクション用。/build-result/にhtmlとjsが作られる
- npm run build

## 使用しているモジュールが作成したjsファイルでどのくらいの容量を使っているのか確認する
-  ./node_modules/.bin/webpack-bundle-analyzer.cmd ./build-result/stats.json

# パラメータ指定方法

`.env`からパラメータを指定する。コンポーネントを使う場所がhttp/httpsで始まるか、chrome-extensionで始まるかで指定方法が異なる。

## 共通のパラメータ

- VUE_APP_MOUNT_QUERY
  - vueをマウントするエレメントID。`#dom-id` の様な値を指定。

## http/httpsで始まる場所

- VUE_APP_CALLBACK_URL
   - コールバックURL。認証後に戻ってくるページのアドレス。GoogleAPIのコンソールで完全一致の値を指定する必要あり。
- VUE_APP_API_CLIENT_ID
   - クライアントID。`123456789-xxxxxxxx3sgsv73cqd4kdhuc1xhyjgum.apps.googleusercontent.com`の様な値
- VUE_APP_API_CLIENT_SECRET
   - クライアントシークレット。`XXXXXXzze23o08myhpdm0waw`のような値。

## chrome-extensionで始まる場所

- VUE_APP_USE_CHROME_IDENTITY_API
   - 1 を指定する。

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

