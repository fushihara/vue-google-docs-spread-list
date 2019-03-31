<template>
  <div style="display:flex;flex-direction:column;height:100%;">
    <div style="flex:0 0 auto;display:flex;background:silver;height:2em;">
      <div
        style="flex:1 1 0;display: flex;align-items: center;padding-left: 10px;"
      >GoogleDocumentの一覧</div>
      <div v-show="loading_message_show" style="display: flex;align-items: center;">読込中</div>
      <a
        href="https://docs.google.com/spreadsheets/create"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;"
      >新規Spread</a>
      <a
        href="https://docs.google.com/document/create"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;"
      >新規Document</a>
      <button v-on:click="reload_data" :disabled="disable_reload_select_ui">再読込</button>
      <select @change="reload_data()" v-model="sort_model" :disabled="disable_reload_select_ui">
        <option value="last_view_me" selected>最終閲覧(自分)</option>
        <option value="last_update_me">最終更新(自分)</option>
        <option value="last_update">最終更新</option>
        <option value="createdTime">作成日時</option>
        <option value="title">タイトル</option>
      </select>
    </div>
    <ul v-if="auth_status == '認証情報あり'" style="flex:1 1 0;margin-top:0;overflow-y:scroll;">
      <li
        v-for="item in google_drive_api_result.files"
        :key="item.id"
        style="display:flex;border-bottom:solid 1px silver;"
      >
        <a
          :href="getLink(item.id,item.mimeType)"
          style="display:flex;align-items: center;width:100%;text-decoration:none;"
        >
          <div style="flex:0 0 25px;display: flex;justify-content: center;">
            <img v-bind:src="item.iconLink" style="object-fit:contain;width:16px;height:16px;">
          </div>
          <div style="flex:1 1 0;">
            <div style="font-size:small;">{{ item.name }}</div>
            <div
              v-if="sort_model=='last_view_me'"
              style="font-size:x-small;"
            >閲覧日時：{{formatDateFromString(item.viewedByMeTime)}}</div>
            <div
              v-else-if="sort_model=='last_update_me'"
              style="font-size:x-small;"
            >更新日時：{{formatDateFromString(item.modifiedByMeTime)}}</div>
            <div
              v-else-if="sort_model=='last_update'"
              style="font-size:x-small;"
            >更新日時：{{formatDateFromString(item.modifiedTime)}}</div>
            <div
              v-else-if="sort_model=='createdTime'"
              style="font-size:x-small;"
            >作成日時：{{formatDateFromString(item.createdTime)}}</div>
            <div
              v-else-if="sort_model=='title'"
              style="font-size:x-small;"
            >最終更新：{{formatDateFromString(item.modifiedTime)}}</div>
          </div>
        </a>
      </li>
    </ul>
    <div v-else-if="auth_status == '認証情報なし'">
      <button v-on:click="auth_start_push">認証開始</button>
    </div>
    <div v-else-if="auth_status == 'アクセストークン更新中'">アクセストークン更新中</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import dateformat from "dateformat";
// localstorageに使う接頭語
const vue_element_key = `h4hc25ub`
type GoogleApiViewByMe = { viewedByMe: false } | { viewedByMe: true, viewedByMeTime: string };
type GoogleModifiedByMe = { modifiedByMe: false } | { modifiedByMe: true, modifiedByMeTime: string }
type GoogleApiData = {
  files: ({ id: string, name: string, mimeType: string, iconLink: string, viewedByMeTime: string, createdTime: string, modifiedTime: string } & GoogleApiViewByMe & GoogleApiViewByMe)[]
};
function isGoogleApiData(data: any): data is GoogleApiData {
  if (data == null || typeof data !== "object") { return false; }
  if (data.files == null || Array.isArray(data.files) === false) { return false; }
  for (let d of data.files) {
    if (d == null || typeof d !== "object") { debugger; return false; }
    if (typeof d.id !== "string") { debugger; return false; }
    if (typeof d.name !== "string") { debugger; return false; }
    if (typeof d.mimeType !== "string") { debugger; return false; }
    if (typeof d.iconLink !== "string") { debugger; return false; }
    if (typeof d.createdTime !== "string") { debugger; return false; }
    if (typeof d.modifiedTime !== "string") { debugger; return false; }
    if (typeof d.modifiedByMe !== "boolean") { debugger; return false; }
    if (d.modifiedByMe === true && typeof d.modifiedByMeTime !== "string") { debugger; return false; }
    if (typeof d.viewedByMe !== "boolean") { debugger; return false; }
    if (d.viewedByMe === true && typeof d.viewedByMeTime !== "string") { debugger; return false; }
  }
  return true;
}
function get_sort_option() {
  return String(localStorage[`${vue_element_key}-sort-option`] || "");
}
function save_sort_option(sort_option: string) {
  localStorage[`${vue_element_key}-sort-option`] = sort_option;
}
function save_refresh_token(refresh_token: string) {
  localStorage[`${vue_element_key}-refresh-token`] = refresh_token;
}
function get_refresh_token() {
  return String(localStorage[`${vue_element_key}-refresh-token`] || "");
}

export default Vue.extend({
  mounted: function () {
    this.sort_model = get_sort_option() !== "" ? get_sort_option() : this.sort_model;
    const chrome拡張のapiを使う = !!this.chromeのidentityiAPIを使う;
    const URLにcodeがある = document.location.href.match(/\?code=(.+?)&/) != null;
    if (chrome拡張のapiを使う && chrome && chrome.identity && chrome.identity.getAuthToken) {
      // まずはトークンが取得出来るかチェック
      this.auth_status = "アクセストークン更新中";
      chrome.identity.getAuthToken({ interactive: false }, token => {
        if (!token) {
          // トークンが取得できなかった。
          this.auth_status = "認証情報なし";
        } else {
          this.auth_status = "認証情報あり";
          this.access_token = token;
          this.reload_data();
        }
      })
    } else if (URLにcodeがある) {
      const code = RegExp.$1;
      this.auth_status = "アクセストークン更新中";
      this.access_token_new_get(code).then(a => {
        save_refresh_token(a.refreshToken);
        document.location.href = this.redirect_url;
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.redirect_url;
      });
    } else if (get_refresh_token() != "") {
      this.auth_status = "認証情報あり";
      this.access_token_refresh().then(b => {
        this.access_token = b.accessToken;
        this.reload_data();
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.redirect_url;
      });
    } else {
      this.auth_status = "認証情報なし";
    }
  },
  props: {
    redirect_url: { type: String, required: true },
    クライアントID: { type: String, required: true },
    クライアントシークレット: { type: String, required: true },
    chromeのidentityiAPIを使う: { type: Boolean, required: true }
  },
  data: function () {
    return {
      google_drive_api_result: { files: [] } as GoogleApiData,
      sort_model: "last_view_me",
      auth_status: "認証情報なし" as "認証情報なし" | "アクセストークン更新中" | "認証情報あり",
      access_token: "",
      loading_message_show: false
    };
  },
  computed: {
    disable_reload_select_ui: function () {
      return this.loading_message_show;
    }
  },
  methods: {
    getLink: function (documentId: string, mimeType: string) {
      if (mimeType === "application/vnd.google-apps.document") {
        return `https://docs.google.com/document/d/${documentId}/edit`;
      } else if (mimeType == "application/vnd.google-apps.spreadsheet") {
        return `https://docs.google.com/spreadsheets/d/${documentId}/edit`;
      } else {
        return ``;
      }
    },
    formatDateFromString: function (dateString: string | null) {
      if (dateString == null) {
        return "";
      }
      dateformat.i18n.dayNames = [
        "日",
        "月",
        "火",
        "水",
        "木",
        "金",
        "土",
        "日曜日",
        "月曜日",
        "火曜日",
        "水曜日",
        "木曜日",
        "金曜日",
        "土曜日"
      ];
      return dateformat(new Date(dateString), "yyyy/mm/dd(ddd)HH:MM:ss");
    },
    access_token_refresh: function () {
      const postValues = [];
      postValues.push(`refresh_token=${encodeURIComponent(get_refresh_token())}`);
      postValues.push(`client_id=${encodeURIComponent(this.クライアントID)}`);
      postValues.push(`client_secret=${encodeURIComponent(this.クライアントシークレット)}`);
      postValues.push(`grant_type=refresh_token`);
      postValues.push(`access_type=offline`);
      return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postValues.join("&")
      }).then(request => {
        return request.json().then(json => {
          const accessToken = String(json.access_token || "");
          const expiresInSecond = String(json.expires_in || "");
          return {
            accessToken, expiresInSecond
          }
        });
      });
    },
    access_token_new_get: function (code: string) {
      this.loading_message_show = true;
      const リダイレクトURL = this.redirect_url;
      const postValues = [];
      postValues.push(`code=${encodeURIComponent(code)}`);
      postValues.push(`client_id=${encodeURIComponent(this.クライアントID)}`);
      postValues.push(`client_secret=${encodeURIComponent(this.クライアントシークレット)}`);
      postValues.push(`redirect_uri=${encodeURIComponent(リダイレクトURL)}`);
      postValues.push(`grant_type=authorization_code`);
      postValues.push(`access_type=offline`);
      return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postValues.join("&")
      })
        .then(request => {
          return request.json().then(json => {
            this.loading_message_show = false;
            const accessToken = String(json.access_token || "");
            const expiresInSecond = String(json.expires_in || "");
            const refreshToken = String(json.refresh_token || "");
            console.log(accessToken, expiresInSecond, refreshToken);
            return {
              accessToken, expiresInSecond, refreshToken
            }
          });
        });

    },
    auth_start_push: function () {
      const chrome拡張のapiを使う = !!this.chromeのidentityiAPIを使う;
      if (chrome拡張のapiを使う && chrome && chrome.identity && chrome.identity.getAuthToken) {
        // まずはトークンが取得出来るかチェック
        this.loading_message_show = true;
        this.auth_status = "アクセストークン更新中";
        chrome.identity.getAuthToken({ interactive: true }, token => {
          this.loading_message_show = false;
          if (!token) {
            // トークンが取得できなかった。
            this.auth_status = "認証情報なし";
          } else {
            this.auth_status = "認証情報あり";
            this.access_token = token;
            this.reload_data();
          }
        });
        return;
      }
      this.loading_message_show = true;
      const urlBase = `https://accounts.google.com/o/oauth2/auth`;
      const params = [];
      const スコープs = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
      ];
      params.push(`response_type=code`);
      params.push(`client_id=${this.クライアントID}`);
      params.push(`redirect_uri=${this.redirect_url}`);
      params.push(`scope=${encodeURIComponent(スコープs.join(" "))}`);
      params.push(`access_type=offline`);
      params.push(`approval_prompt=force`);
      const accessUrl = `${urlBase}?${params.join("&")}`;
      document.location.href = accessUrl;
    },
    reload_data: function () {
      this.loading_message_show = true;
      let orderBy = "";
      switch (this.sort_model) {
        case "last_view_me": orderBy = "viewedByMeTime desc"; break;
        case "last_update_me": orderBy = "modifiedByMeTime desc"; break;
        case "last_update": orderBy = "modifiedTime desc"; break;
        case "title": orderBy = "name"; break;
        case "createdTime": orderBy = "createdTime desc"; break;
      }
      fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        [
          "orderBy=" + encodeURIComponent(orderBy),
          "q=" + encodeURIComponent("trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document')"),
          "fields=" + encodeURIComponent("files(kind,id,name,mimeType,iconLink,viewedByMe,viewedByMeTime,createdTime,modifiedTime,modifiedByMeTime,modifiedByMe)"),
          "pageSize=1000",
        ].join("&"),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${this.access_token}`
          }
        }
      ).then(response =>
        response.json().then(json => {
          this.loading_message_show = false;
          if (isGoogleApiData(json)) {
            save_sort_option(this.sort_model);
            this.google_drive_api_result = json;
          }
        })
      );
    }
  }
});
</script>

<style lang="scss" scoped>
ul {
  padding-left: 0;
}
ul > li {
  list-style: none;
}
button[disabled],
select[disabled] {
  opacity: 0.7;
}
</style>
