<template>
  <div style="display:flex;flex-direction:column;height:100%;background:white;">
    <div style="flex:0 0 auto;display:flex;background:silver;height:1.5em;align-items: center;">
      <div
        style="flex:1 1 0;align-items: center;padding-left: 10px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;"
      >Web Documents</div>
      <div v-show="loading_message_show" style="display: flex;align-items: center;">読込中</div>
      <select
        v-model="column_style_select"
        @change="save_column_option_value"
        style="height: 100%;"
      >
        <option value="1">1行</option>
        <option value="yoko-2">横2列</option>
        <option value="yoko-3">横3列</option>
        <option value="yoko-4">横4列</option>
        <option value="yoko-5">横5列</option>
        <option value="yoko-6">横6列</option>
        <option value="tate-250px">縦250px</option>
        <option value="tate-300px">縦300px</option>
        <option value="tate-400px">縦400px</option>
        <option value="tate-500px">縦500px</option>
      </select>
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
        :href="evernote_new_link"
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
      <div style="flex:0 0 auto;padding-left: 10px;padding-right: 6px;">検索</div>
      <input type="search" style="flex:1 1 0;" v-model="filter_keyword" placeholder="絞り込みキーワード">
      <div v-if="text_search.mode=='検索中'" style="flex:0 0 auto;display: flex;align-items: center;">
        <img :src="icon_image.loading" style="width:20px;object-fit:contain;">
        全文検索中
      </div>
      <div
        v-if="text_search.mode=='本文検索結果表示指示待機中'"
        style="flex:0 0 auto;display: flex;align-items: center;"
      >
        <button @click="show_text_search_result">全文検索結果表示 {{ text_search.new_items.google_drive }}個</button>
      </div>
      <div
        v-if="text_search.mode=='本文検索結果表示中'"
        style="flex:0 0 auto;display: flex;align-items: center;"
      >全文検索結果表示中</div>
      <div v-show="false" style="flex:0 0 auto;display: flex;align-items: center;">Google全文検索エラー</div>
      <div v-show="false" style="flex:0 0 auto;display: flex;align-items: center;">Evernote全文検索エラー</div>
    </div>
    <ul
      v-if="auth_status == '認証情報あり'"
      class="list-ul-parent"
      :class="listUlClass"
      style="flex:1 1 0;margin-top:0;overflow-y:scroll;overscroll-behavior: contain;margin-bottom:0;"
      data-is-scroll-parent
      @wheel="listWheelEvent"
    >
      <li
        v-for="item in filterd_list2"
        :key="item.link"
        :style="listLIClass"
        style="display:flex;border-bottom:solid 1px silver;"
      >
        <a
          :href="item.link"
          :title="item.title"
          :alt="item.title"
          style="display:flex;align-items: center;width:100%;text-decoration:none;"
        >
          <div style="flex:0 0 25px;display: flex;justify-content: center;">
            <img v-bind:src="item.iconUrl" style="object-fit:contain;width:20px;height:20px;">
          </div>
          <div style="flex:1 1 0;" class="filename-parent">
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
import { GoogleApi } from "./google-api"
import { EvernoteApi } from "./evernote-api"
import { KeywordFilter } from "./KeywordFilter"
import { SortType, ListItem } from './d.ts/shims-tsx';
// localstorageに使う接頭語
const vue_element_key = `h4hc25ub-google-document-list`;
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
function getColumnOptionValue() {
  return String(localStorage[`${vue_element_key}-column-option`] || "1")
}
function setColumnOptionValue(val: string) {
  localStorage[`${vue_element_key}-column-option`] = val;
}
export default Vue.extend({
  components: {
  },
  mounted: function () {
    this.$el.addEventListener("ScrollTop", () => { // emitに出来るかも
      const el = this.$el.querySelector("[data-is-scroll-parent]");
      if (el) {
        el.scrollTop = 0
      }
    });
    this.sort_model = get_sort_option();
    this.column_style_select = getColumnOptionValue();
    const chrome拡張のapiを使う = !!this.useChromeIdentityiApi;
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
          EvernoteApi.DataRequest.loadData({
            url: this.evernoteApiUrl,
            developer_token: this.evernoteApiDeveloperToken,
            words: "",
            ascending: false,
            order: "updated"
          }).then(evernoteList => {
            this.evernote_api_result = evernoteList;
          });
        }
      })
    } else if (URLにcodeがある) {
      const code = RegExp.$1;
      this.auth_status = "アクセストークン更新中";
      this.loading_message_show = true;
      GoogleApi.Auth.getAccessTokenNewGet(code, this.googleApiDataRedirectUrl, this.googleApiDataClientId, this.googleApiDataClientSecret).then(a => {
        this.loading_message_show = false;
        save_refresh_token(a.refreshToken);
        document.location.href = this.googleApiDataRedirectUrl;
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.googleApiDataRedirectUrl;
      });
    } else if (get_refresh_token() != "") {
      this.auth_status = "認証情報あり";
      GoogleApi.Auth.getAccessTokenRefresh(get_refresh_token(), this.googleApiDataClientId, this.googleApiDataClientSecret).then(b => {
        this.access_token = b.accessToken;
        this.reload_data();
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.googleApiDataRedirectUrl;
      });
      EvernoteApi.DataRequest.loadData({
        url: this.evernoteApiUrl,
        developer_token: this.evernoteApiDeveloperToken,
        words: "",
        ascending: false,
        order: "updated"
      }).then(evernoteList => {
        this.evernote_api_result = evernoteList;
      });
    } else {
      this.auth_status = "認証情報なし";
    }
  },
  props: {
    googleApiDataRedirectUrl: { type: String, required: false },
    googleApiDataClientId: { type: String, required: false },
    googleApiDataClientSecret: { type: String, required: false },
    useChromeIdentityiApi: { type: Boolean, required: false },
    evernoteApiUrl: { type: String, required: false },
    evernoteApiDeveloperToken: { type: String, required: false },
  },
  data: function () {
    return {
      google_drive_api_result: [] as GoogleApi.DataRequest.GoogleApiFileData[],
      evernote_api_result: null as (EvernoteApi.DataRequest.EvernoteApiData | null),
      sort_model: "last_view_me" as SortType,
      auth_status: "認証情報なし" as "認証情報なし" | "アクセストークン更新中" | "認証情報あり",
      access_token: "",
      loading_message_show: false,
      filter_keyword: "",
      icon_image: {
        googleDocsDocument: require("./images/icon-google-docs-doc.svg"),
        googleDocsSpread: require("./images/icon-google-docs-spread.svg"),
        evernote: require("./images/icon-evernote.svg"),
        loading: require("./images/loading.svg"),
      },
      column_style_select: "1",
      text_search: { "mode": "検索なし" } as { "mode": "検索なし" } |
      { "mode": "検索中", "settimeout_timer_id": number, "api_abort_controller": AbortController } |
      { "mode": "本文検索結果表示指示待機中", api_result: { google_drive: GoogleApi.DataRequest.GoogleApiFileData[], evernote: (EvernoteApi.DataRequest.EvernoteApiData | null) }, new_items: { google_drive: number, evernote: number } } |
      { "mode": "本文検索結果表示中", api_result: { google_drive: GoogleApi.DataRequest.GoogleApiFileData[], evernote: (EvernoteApi.DataRequest.EvernoteApiData | null) } }
    };
  },
  watch: {
    filter_keyword: function (newVal, oldVal) {
      if (this.text_search.mode == "検索中") {
        clearTimeout(this.text_search.settimeout_timer_id);
        this.text_search.api_abort_controller.abort();
      } else if (this.text_search.mode == "本文検索結果表示指示待機中" || this.text_search.mode == "本文検索結果表示中") {
        this.text_search.api_result.google_drive = [];
        this.text_search.api_result.evernote = null;
      }
      const abortController = new AbortController();
      const settimeout_timer_id = setTimeout(() => {
        this.text_search_start(abortController.signal).then(a => {
          const gooleDriveFiles = a[0] ? a[0].files : [];
          const evernoteApiData = a[1] ? a[1] : null;
          const currentItemUrls = this.filterd_list2.map(a => a.link);
          const sortType = this.sort_model;
          const googleDriveNewItemCount = GoogleApi.DataFilter.convertDatas(gooleDriveFiles, sortType, { doc: this.icon_image.googleDocsDocument, spread: this.icon_image.googleDocsSpread })
            .map(a => a.link)
            .filter(a => currentItemUrls.includes(a) == false).length;
          const evernoteNewItemCount = (evernoteApiData ? EvernoteApi.DataFilter.convertDatas(evernoteApiData, sortType, this.icon_image.evernote, false) : [])
            .map(a => a.link)
            .filter(a => currentItemUrls.includes(a) == false).length;
          this.text_search = {
            mode: "本文検索結果表示指示待機中",
            api_result: {
              google_drive: gooleDriveFiles,
              evernote: evernoteApiData
            },
            new_items: {
              google_drive: googleDriveNewItemCount,
              evernote: evernoteNewItemCount
            }
          };
        })
      }, 1000);
      this.text_search = {
        mode: "検索中",
        settimeout_timer_id,
        api_abort_controller: abortController
      };
    }
  },
  computed: {
    listUlClass: function () {
      const tateMatch = this.column_style_select.match(/tate-(\d+)px/);
      const yokoMatch = this.column_style_select.match(/yoko-(\d+)/);
      if (this.column_style_select == "1") {
        return "";
      } else if (tateMatch) {
        return ["multi-columns", "tate"];
      } else if (yokoMatch) {
        return ["multi-columns", "yoko"];
      } else {
        return "";
      }
    },
    listLIClass: function () {
      const tateMatch = this.column_style_select.match(/tate-(\d+)px/);
      const yokoMatch = this.column_style_select.match(/yoko-(\d+)/);
      if (this.column_style_select == "1") {
        return {}
      } else if (yokoMatch && 2 <= Number(yokoMatch[1])) {
        const p = 100 / Number(yokoMatch[1]);
        return { "flex": ` 0 0 ${p}%` };
      } else if (tateMatch) {
        return {
          width: `${tateMatch[1]}px`
        }
      } else {
        return {};
      }
    },
    evernote_new_link: function () {
      const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
      if (isMobilePhone) {
        return `intent://scan/#Intent;scheme=evernote;package=com.evernote;end`;
      } else {
        return `https://www.evernote.com/client/web`;
      }
    },
    disable_reload_select_ui: function () {
      return this.loading_message_show;
    },
    filterd_list2: function (): ListItem[] {
      const result: (ListItem & { full_text_result: boolean })[] = [];
      const sortType = this.sort_model;
      const keywordFilter = new KeywordFilter(this.filter_keyword);
      const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
      GoogleApi.DataFilter.convertDatas(this.google_drive_api_result, sortType, { doc: this.icon_image.googleDocsDocument, spread: this.icon_image.googleDocsSpread })
        .forEach(a => {
          if (keywordFilter.isMatch(a.title) && result.every(b => b.link != a.link)) {
            result.push(Object.assign(a, { full_text_result: false }));
          }
        })
      if (this.evernote_api_result != null) {
        EvernoteApi.DataFilter.convertDatas(this.evernote_api_result, sortType, this.icon_image.evernote, isMobilePhone)
          .forEach(a => {
            if (keywordFilter.isMatch(a.title) && result.every(b => b.link != a.link)) {
              result.push(Object.assign(a, { full_text_result: false }));
            }
          })
      }
      if (this.text_search.mode == "本文検索結果表示中") {
        GoogleApi.DataFilter.convertDatas(this.text_search.api_result.google_drive, sortType, { doc: this.icon_image.googleDocsDocument, spread: this.icon_image.googleDocsSpread })
          .forEach(a => {
            if (result.every(b => b.link != a.link)) {
              result.push(Object.assign(a, { full_text_result: true }));
            }
          })
        if (this.text_search.api_result.evernote) {
          EvernoteApi.DataFilter.convertDatas(this.text_search.api_result.evernote, sortType, this.icon_image.evernote, isMobilePhone)
            .forEach(a => {
              if (result.every(b => b.link != a.link)) {
                result.push(Object.assign(a, { full_text_result: true }));
              }
            })
        }
      }
      const sortMulti = sortType == "title" ? 1 : -1;// titleの時は昇順にソートするが、それ以外は新しい方から見たいので降順ソートにする
      result.sort((a, b) => {
        return a.sortValue.localeCompare(b.sortValue) * sortMulti;
      });
      return result;
    }
  },
  methods: {
    show_text_search_result: function () {
      if (this.text_search.mode != "本文検索結果表示指示待機中") {
        return;
      }
      const api_result = this.text_search.api_result;
      this.text_search = {
        mode: "本文検索結果表示中",
        api_result: api_result
      };
    },
    text_search_start: async function (abortSignal: AbortSignal) {
      const googleDrivePropmise = GoogleApi.DataRequest.getDataFromApi(this.filter_keyword, this.sort_model, this.access_token, abortSignal).catch(e => {
        if (e && e.name == "AbortError") {
          // 握りつぶす
          return undefined;
        }
        throw e;//それ以外は投げ直す
      });
      const evernoteApiPromise = EvernoteApi.DataRequest.loadData({
        url: this.evernoteApiUrl,
        developer_token: this.evernoteApiDeveloperToken,
        words: this.filter_keyword,
        ascending: false,
        order: "updated",
        abortSignal: abortSignal
      }).catch(e => {
        if (e && e.name == "AbortError") {
          // 握りつぶす
          return undefined;
        }
        throw e;//それ以外は投げ直す
      });
      return Promise.all([googleDrivePropmise, evernoteApiPromise]);
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
    auth_start_push: function () {
      const chrome拡張のapiを使う = !!this.useChromeIdentityiApi;
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
      document.location.href = GoogleApi.Auth.getAuthStartUrl({
        クライアントID: this.googleApiDataClientId,
        リダイレクトURI: this.googleApiDataRedirectUrl
      });
    },
    reload_data: function () {
      this.loading_message_show = true;
      GoogleApi.DataRequest.getDataFromApi("", this.sort_model, this.access_token).then(json => {
        this.loading_message_show = false;
        save_sort_option(this.sort_model);
        this.google_drive_api_result = json.files;
      });
    },
    save_column_option_value: function () {
      setColumnOptionValue(this.column_style_select);
    },
    listWheelEvent: function (event: WheelEvent) {
      const tateMatch = this.column_style_select.match(/tate-(\d+)px/);
      if (tateMatch) {
        const el = this.$el.querySelector<HTMLLIElement>("[data-is-scroll-parent]")!;
        el.scrollLeft += event.deltaY / 2;
        event.preventDefault();
      }
    }
  }
});
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.list-ul-parent.multi-columns {
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  display: flex;
  &.yoko {
    flex-direction: row;
    align-content: flex-start;
    justify-content: flex-start;
  }
  &.tate {
    flex-direction: column;
    justify-content: flex-start;
    align-content: flex-start;
  }
  > li {
    /* flex: 0 0 var(--my-color, 50%); これはcomputed.listLIClass で書き込む*/
    border-right: 1px solid silver;
    overflow: hidden;
    .filename-parent {
      overflow: hidden;
      > div {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}
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
