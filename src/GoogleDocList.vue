<template>
  <div style="display:flex;flex-direction:column;height:100%;background:white;">
    <div style="flex:0 0 auto;display:flex;background:silver;height:2em;align-items: center;">
      <div
        style="flex:1 1 0;align-items: center;padding-left: 10px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;"
      >GoogleDocumentの一覧</div>
      <div v-show="loading_message_show" style="display: flex;align-items: center;">読込中</div>
      <a
        href="https://docs.google.com/spreadsheets/create"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;height: 100%;"
      >
        <img
          :src="icon_image.googleDocsSpread"
          style="object-fit:contain;width:20px;height:20px;"
          title="google docs spread"
        >
      </a>
      <a
        href="https://docs.google.com/document/create"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;height: 100%;"
      >
        <img
          :src="icon_image.googleDocsDocument"
          style="object-fit:contain;width:20px;height:20px;"
          title="google docs document"
        >
      </a>
      <a
        href="https://www.evernote.com/client/web"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;height: 100%;"
      >
        <img
          :src="icon_image.evernote"
          style="object-fit:contain;width:20px;height:20px;"
          title="evernote"
        >
      </a>
      <button
        v-on:click="reload_data"
        :disabled="disable_reload_select_ui"
        style="height: 100%;"
      >再読込</button>
      <select
        @change="reload_data()"
        v-model="sort_model"
        :disabled="disable_reload_select_ui"
        style="height: 100%;"
      >
        <option value="last_view_me" selected>最終閲覧(自分)</option>
        <option value="last_update_me">最終更新(自分)</option>
        <option value="last_update">最終更新</option>
        <option value="createdTime">作成日時</option>
        <option value="title">タイトル</option>
      </select>
    </div>
    <div style="flex:0 0 auto;display:flex;background:silver;heigth:2em;">
      <div style="flex:0 0 auto;padding-left: 10px;padding-right: 6px;">絞り込み検索</div>
      <input type="search" style="flex:1 1 0;" v-model="filter_keyword" placeholder="絞り込みキーワード">
    </div>
    <ul v-if="auth_status == '認証情報あり'" style="flex:1 1 0;margin-top:0;overflow-y:scroll;overscroll-behavior: contain" data-is-scroll-parent>
      <li
        v-for="item in filterd_list2"
        :key="item.link"
        style="display:flex;border-bottom:solid 1px silver;"
      >
        <a
          :href="item.link"
          style="display:flex;align-items: center;width:100%;text-decoration:none;"
        >
          <div style="flex:0 0 25px;display: flex;justify-content: center;">
            <img v-bind:src="item.iconUrl" style="object-fit:contain;width:20px;height:20px;">
          </div>
          <div style="flex:1 1 0;">
            <div style="font-size:small;">{{ item.title }}</div>
            <div
              style="font-size:x-small;"
            >{{item.timestamp.label}}：{{formatDateFromString(item.timestamp.value)}}</div>
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
type SortType = "last_view_me" | "last_update_me" | "last_update" | "createdTime" | "title";
type GoogleApiViewByMe = { viewedByMe: false } | { viewedByMe: true, viewedByMeTime: string };
type GoogleModifiedByMe = { modifiedByMe: false } | { modifiedByMe: true, modifiedByMeTime: string }
type GoogleApiData = {
  files: ({ id: string, name: string, mimeType: string, iconLink: string, createdTime: string, modifiedTime: string } & GoogleModifiedByMe & GoogleApiViewByMe)[]
};
type EvernoteApiData = {
  userData: EvernoteUserData,
  noteBooks: EvernoteNotebookData[]
};
type EvernoteUserData = {
  id: number,//123456
  name: string,//あいうえお
  shardId: string,//s123
  username: string//aiueo
}
type EvernoteNotebookData = {
  title: string,
  size: number,
  updateDate: Date,
  createdDate: Date,
  guid: string,
  notebookName: string
  notebookGuid: string
}
type ListItem = {
  link: string,
  title: string,
  iconUrl: string,
  timestamp: {
    value: Date,
    label: string
  }
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
function get_sort_option(): SortType {
  const saveRawValue = String(localStorage[`${vue_element_key}-sort-option`] || "");
  if (saveRawValue == "last_view_me" || saveRawValue == "last_update_me" || saveRawValue == "last_update" || saveRawValue == "createdTime" || saveRawValue == "title") {
    return saveRawValue;
  }
  return "last_update";
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
async function loadEvernoteData(url: string): Promise<EvernoteApiData | null> {
  if (url == "") {
    return null;
  }
  const result: EvernoteApiData[] = [];
  const json = await fetch(url).then(response => response.json());
  if (json === null || json === undefined) { return null; }
  if (typeof json !== "object") { return null; }
  if (!Array.isArray(json.noteBooks)) { return null; }
  const notebooks: EvernoteNotebookData[] = [];
  for (let v of json.noteBooks) {
    if (v == null) { return null; }
    notebooks.push({
      title: String(v.title),
      size: Number(v.size),
      updateDate: new Date(String(v.updateDate)),
      createdDate: new Date(String(v.createdDate)),
      guid: String(v.guid),
      notebookName: String(v.notebookName),
      notebookGuid: String(v.notebookGuid)
    });
  }
  const userData: EvernoteUserData = {
    id: Number(json.userData.id),
    name: String(json.userData.name),
    shardId: String(json.userData.shardId),
    username: String(json.userData.username),
  }
  return {
    userData,
    noteBooks: notebooks
  };
}

export default Vue.extend({
  mounted: function () {
    this.$el.addEventListener("ScrollTop", () => {
      const el = this.$el.querySelector("[data-is-scroll-parent]");
      if(el){
        el.scrollTop = 0
      }
    });
    this.sort_model = get_sort_option();
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
          loadEvernoteData(this.evernoteのドキュメント一覧のapi).then(evernoteList => {
            this.evernote_api_result = evernoteList;
          });
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
        loadEvernoteData(this.evernoteのドキュメント一覧のapi).then(evernoteList => {
          this.evernote_api_result = evernoteList;
        });
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
    chromeのidentityiAPIを使う: { type: Boolean, required: true },
    evernoteのドキュメント一覧のapi: { type: String, required: false }
  },
  data: function () {
    return {
      google_drive_api_result: { files: [] } as GoogleApiData,
      evernote_api_result: null as (EvernoteApiData | null),
      sort_model: "last_view_me" as SortType,
      auth_status: "認証情報なし" as "認証情報なし" | "アクセストークン更新中" | "認証情報あり",
      access_token: "",
      loading_message_show: false,
      filter_keyword: "",
      icon_image: {
        googleDocsDocument: require("./images/icon-google-docs-doc.svg"),
        googleDocsSpread: require("./images/icon-google-docs-spread.svg"),
        evernote: require("./images/icon-evernote.svg")
      }
    };
  },
  computed: {
    disable_reload_select_ui: function () {
      return this.loading_message_show;
    },
    filterd_list2: function (): ListItem[] {
      const result: (ListItem & { sortValue: string })[] = [];
      const sortType = this.sort_model;
      const keywords: string[] = this.filter_keyword.replace(/　/g, " ").trim().split(/\s+/).filter(a => a != "").map(a => a.toLowerCase());
      // google driveのファイルを追加
      this.google_drive_api_result.files.forEach(a => {
        let link = "";
        let iconImage = "";
        if (a.mimeType === "application/vnd.google-apps.document") {
          link = `https://docs.google.com/document/d/${a.id}/edit`;
          iconImage = this.icon_image.googleDocsDocument;
        } else if (a.mimeType == "application/vnd.google-apps.spreadsheet") {
          link = `https://docs.google.com/spreadsheets/d/${a.id}/edit`;
          iconImage = this.icon_image.googleDocsSpread;
        } else {
          return;
        }
        let timestamp: Date;
        let timeLabel: string;
        let sortValue: string | null;
        switch (sortType) {
          case "last_view_me":
            if (a.viewedByMe) {
              timestamp = new Date(String(a.viewedByMeTime));
              timeLabel = "閲覧日時";
              sortValue = String(new Date(String(a.viewedByMeTime)).getTime());
            } else {
              return
            }
            break;
          case "last_update_me":
            if (a.modifiedByMe) {
              timestamp = new Date(String(a.modifiedByMeTime));
              timeLabel = "更新日時";
              sortValue = String(new Date(String(a.modifiedByMeTime)).getTime());
            } else {
              return;
            }
            break;
          case "last_update":
            timestamp = new Date(String(a.modifiedTime));
            timeLabel = "更新日時";
            sortValue = String(new Date(String(a.modifiedTime)).getTime());
            break;
          case "createdTime":
            timestamp = new Date(String(a.createdTime));
            timeLabel = "作成日時";
            sortValue = String(new Date(String(a.createdTime)).getTime());
            break;
          case "title":
            timestamp = new Date(String(a.modifiedTime))
            timeLabel = "更新日時";
            sortValue = a.name;
            break;
          default: return;
        }
        result.push({
          title: a.name,
          link,
          iconUrl: iconImage,
          timestamp: {
            value: timestamp,
            label: timeLabel
          },
          sortValue: sortValue
        });
      });
      if (this.evernote_api_result) {
        const evernoteUserData = this.evernote_api_result.userData;
        this.evernote_api_result.noteBooks.forEach(a => {
          let timestamp: Date;
          let timeLabel: string;
          let sortValue: string | null;
          switch (sortType) {
            case "last_view_me": return;
            case "last_update_me":
              timestamp = new Date(String(a.updateDate));
              timeLabel = "更新日時";
              sortValue = String(new Date(String(a.updateDate)).getTime());
              break;
            case "last_update":
              timestamp = new Date(String(a.updateDate));
              timeLabel = "更新日時";
              sortValue = String(new Date(String(a.updateDate)).getTime());
              break;
            case "createdTime":
              timestamp = new Date(String(a.createdDate));
              timeLabel = "作成日時";
              sortValue = String(new Date(String(a.createdDate)).getTime());
              break;
            case "title":
              timestamp = new Date(String(a.updateDate))
              timeLabel = "更新日時";
              sortValue = a.title;
              break;
            default: return;
          }
          const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
          const linkUrl = isMobilePhone
            ? `evernote:///view/${evernoteUserData.id}/${evernoteUserData.shardId}/${a.guid}/${a.guid}/` :
            `https://www.evernote.com/client/web#?an=true&fs=true&n=${a.guid}`;//pc版

          result.push({
            title: a.title,
            iconUrl: this.icon_image.evernote,
            link: linkUrl,
            timestamp: {
              value: timestamp,
              label: timeLabel
            },
            sortValue: sortValue
          });
        });
      }
      const sortMulti = sortType == "title" ? 1 : -1;// titleの時は昇順にソートするが、それ以外は新しい方から見たいので降順ソートにする
      result.sort((a, b) => {
        return a.sortValue.localeCompare(b.sortValue) * sortMulti;
      });
      if (keywords.length == 0) {
        return result;
      } else {
        return result.filter(a => {
          const name = a.title.toLowerCase();
          return keywords.find(keyword => {
            return name.includes(keyword);
          }) !== undefined;
        });
      }
    },
    filterd_list: function () {
      const keywords: string[] = this.filter_keyword.replace(/　/g, " ").trim().split(/\s+/).filter(a => a != "").map(a => a.toLowerCase());
      if (keywords.length == 0) {
        return this.google_drive_api_result.files;
      }
      return this.google_drive_api_result.files.filter(a => {
        const name = a.name.toLowerCase();
        return keywords.find(keyword => {
          return name.includes(keyword);
        });
      });
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
