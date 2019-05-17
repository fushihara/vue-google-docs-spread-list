<template>
  <div style="display:flex;flex-direction:column;height:100%;background:white;">
    <div style="flex:0 0 auto;display:flex;background:silver;height:1.5em;align-items: center;">
      <div
        style="flex:1 1 0;align-items: center;padding-left: 10px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;"
      >Web Documents</div>
      <div v-show="loadingMessageShow" style="display: flex;align-items: center;">読込中</div>
      <select
        v-model="columnStyleSelect"
        @change="saveColumnOptionValue"
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
          :src="iconImage.googleDocsSpread"
          style="object-fit:contain;width:20px;height:20px;"
          title="google docs spread"
        >
      </a>
      <a
        href="https://docs.google.com/document/create"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;height: 100%;"
      >
        <img
          :src="iconImage.googleDocsDocument"
          style="object-fit:contain;width:20px;height:20px;"
          title="google docs document"
        >
      </a>
      <a
        :href="evernoteNewLink"
        style="display: flex;align-items: center;border: solid 1px silver;background: buttonface;height: 100%;"
      >
        <img
          :src="iconImage.evernote"
          style="object-fit:contain;width:20px;height:20px;"
          title="evernote"
        >
      </a>
      <button
        v-on:click="reloadData"
        :disabled="disableReloadSelectUi"
        style="height: 100%;"
      >再読込</button>
      <select
        @change="reloadData()"
        v-model="sortModel"
        :disabled="disableReloadSelectUi"
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
      <input type="search" style="flex:1 1 0;" v-model="filterKeyword" placeholder="絞り込みキーワード">
      <div v-if="textSearch.mode=='検索中'" style="flex:0 0 auto;display: flex;align-items: center;">
        <img :src="iconImage.loading" style="width:20px;object-fit:contain;">
        全文検索中
      </div>
      <div
        v-if="textSearch.mode=='本文検索結果表示指示待機中' && (Number(textSearch.newItems.googleDrive)+Number(textSearch.newItems.evernote)) != 0 "
        style="flex:0 0 auto;display: flex;align-items: center;"
      >
        <button @click="showTextSearchResult">全文検索結果表示 {{ Number(textSearch.newItems.googleDrive)+Number(textSearch.newItems.evernote) }}個</button>
      </div>
      <div
        v-if="textSearch.mode=='本文検索結果表示指示待機中' && (Number(textSearch.newItems.googleDrive)+Number(textSearch.newItems.evernote)) == 0 "
        style="flex:0 0 auto;display: flex;align-items: center;"
      >
      検索結果無し
      </div>
      <div
        v-if="textSearch.mode=='本文検索結果表示中'"
        style="flex:0 0 auto;display: flex;align-items: center;"
      >全文検索結果表示中</div>
      <div v-show="false" style="flex:0 0 auto;display: flex;align-items: center;">Google全文検索エラー</div>
      <div v-show="false" style="flex:0 0 auto;display: flex;align-items: center;">Evernote全文検索エラー</div>
    </div>
    <ul
      v-if="authStatus == '認証情報あり'"
      class="list-ul-parent"
      :class="listUlClass"
      style="flex:1 1 0;margin-top:0;overflow-y:scroll;overscroll-behavior: contain;margin-bottom:0;"
      data-is-scroll-parent
      @wheel="listWheelEvent"
    >
      <li
        v-for="item in filterdList"
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
    <div v-else-if="authStatus == '認証情報なし'">
      <button v-on:click="authStartPush">認証開始</button>
    </div>
    <div v-else-if="authStatus == 'アクセストークン更新中'">アクセストークン更新中</div>
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
    this.sortModel = get_sort_option();
    this.columnStyleSelect = getColumnOptionValue();
    const chrome拡張のapiを使う = !!this.useChromeIdentityiApi;
    const URLにcodeがある = document.location.href.match(/\?code=(.+?)&/) != null;
    if (chrome拡張のapiを使う && chrome && chrome.identity && chrome.identity.getAuthToken) {
      // まずはトークンが取得出来るかチェック
      this.authStatus = "アクセストークン更新中";
      chrome.identity.getAuthToken({ interactive: false }, token => {
        if (!token) {
          // トークンが取得できなかった。
          this.authStatus = "認証情報なし";
        } else {
          this.authStatus = "認証情報あり";
          this.access_token = token;
          this.reloadData();
          EvernoteApi.DataRequest.loadData({
            url: this.evernoteApiUrl,
            developer_token: this.evernoteApiDeveloperToken,
            words: "",
            ascending: false,
            order: "updated"
          }).then(evernoteList => {
            this.evernoteApiResult = evernoteList;
          });
        }
      })
    } else if (URLにcodeがある) {
      const code = RegExp.$1;
      this.authStatus = "アクセストークン更新中";
      this.loadingMessageShow = true;
      GoogleApi.Auth.getAccessTokenNewGet(code, this.googleApiDataRedirectUrl, this.googleApiDataClientId, this.googleApiDataClientSecret).then(a => {
        this.loadingMessageShow = false;
        save_refresh_token(a.refreshToken);
        document.location.href = this.googleApiDataRedirectUrl;
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.googleApiDataRedirectUrl;
      });
    } else if (get_refresh_token() != "") {
      this.authStatus = "認証情報あり";
      GoogleApi.Auth.getAccessTokenRefresh(get_refresh_token(), this.googleApiDataClientId, this.googleApiDataClientSecret).then(b => {
        this.access_token = b.accessToken;
        this.reloadData();
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
        this.evernoteApiResult = evernoteList;
      });
    } else {
      this.authStatus = "認証情報なし";
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
      googleDriveApiResult: [] as GoogleApi.DataRequest.GoogleApiFileData[],
      evernoteApiResult: null as (EvernoteApi.DataRequest.EvernoteApiData | null),
      sortModel: "last_view_me" as SortType,
      authStatus: "認証情報なし" as "認証情報なし" | "アクセストークン更新中" | "認証情報あり",
      access_token: "",
      loadingMessageShow: false,
      filterKeyword: "",
      iconImage: {
        googleDocsDocument: require("./images/icon-google-docs-doc.svg"),
        googleDocsSpread: require("./images/icon-google-docs-spread.svg"),
        evernote: require("./images/icon-evernote.svg"),
        loading: require("./images/loading.svg"),
      },
      columnStyleSelect: "1",
      textSearch: { mode: "検索なし" } as { mode: "検索なし" } |
      { mode: "検索中", settimeoutTimerId: number, apiAbortController: AbortController } |
      { mode: "本文検索結果表示指示待機中", apiResult: { googleDrive: GoogleApi.DataRequest.GoogleApiFileData[], evernote: (EvernoteApi.DataRequest.EvernoteApiData | null) }, newItems: { googleDrive: number, evernote: number } } |
      { mode: "本文検索結果表示中", apiResult: { googleDrive: GoogleApi.DataRequest.GoogleApiFileData[], evernote: (EvernoteApi.DataRequest.EvernoteApiData | null) } },
      enable_scroll: true
    };
  },
  watch: {
    filterKeyword: function (newVal, oldVal) {
      if (this.textSearch.mode == "検索中") {
        clearTimeout(this.textSearch.settimeoutTimerId);
        this.textSearch.apiAbortController.abort();
      } else if (this.textSearch.mode == "本文検索結果表示指示待機中" || this.textSearch.mode == "本文検索結果表示中") {
        this.textSearch.apiResult.googleDrive = [];
        this.textSearch.apiResult.evernote = null;
      }
      const abortController = new AbortController();
      const settimeoutTimerId = setTimeout(() => {
        this.textSearchStart(abortController.signal).then(a => {
          const gooleDriveFiles = a[0] ? a[0].files : [];
          const evernoteApiData = a[1] ? a[1] : null;
          const currentItemUrls = this.filterdList.map(a => a.link);
          const sortType = this.sortModel;
          const googleDriveNewItemCount = GoogleApi.DataFilter.convertDatas(gooleDriveFiles, sortType, { doc: this.iconImage.googleDocsDocument, spread: this.iconImage.googleDocsSpread })
            .map(a => a.link)
            .filter(a => currentItemUrls.includes(a) == false).length;
          const evernoteNewItemCount = (evernoteApiData ? EvernoteApi.DataFilter.convertDatas(evernoteApiData, sortType, this.iconImage.evernote, false) : [])
            .map(a => a.link)
            .filter(a => currentItemUrls.includes(a) == false).length;
          this.textSearch = {
            mode: "本文検索結果表示指示待機中",
            apiResult: {
              googleDrive: gooleDriveFiles,
              evernote: evernoteApiData
            },
            newItems: {
              googleDrive: googleDriveNewItemCount,
              evernote: evernoteNewItemCount
            }
          };
        })
      }, 1000);
      this.textSearch = {
        mode: "検索中",
        settimeoutTimerId,
        apiAbortController: abortController
      };
    }
  },
  computed: {
    listUlClass: function () {
      const tateMatch = this.columnStyleSelect.match(/tate-(\d+)px/);
      const yokoMatch = this.columnStyleSelect.match(/yoko-(\d+)/);
      if (this.columnStyleSelect == "1") {
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
      const tateMatch = this.columnStyleSelect.match(/tate-(\d+)px/);
      const yokoMatch = this.columnStyleSelect.match(/yoko-(\d+)/);
      if (this.columnStyleSelect == "1") {
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
    evernoteNewLink: function () {
      const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
      if (isMobilePhone) {
        return `intent://scan/#Intent;scheme=evernote;package=com.evernote;end`;
      } else {
        return `https://www.evernote.com/client/web`;
      }
    },
    disableReloadSelectUi: function () {
      return this.loadingMessageShow;
    },
    filterdList: function (): ListItem[] {
      const result: (ListItem & { full_text_result: boolean })[] = [];
      const sortType = this.sortModel;
      const keywordFilter = new KeywordFilter(this.filterKeyword);
      const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
      GoogleApi.DataFilter.convertDatas(this.googleDriveApiResult, sortType, { doc: this.iconImage.googleDocsDocument, spread: this.iconImage.googleDocsSpread })
        .forEach(a => {
          if (keywordFilter.isMatch(a.title) && result.every(b => b.link != a.link)) {
            result.push(Object.assign(a, { full_text_result: false }));
          }
        })
      if (this.evernoteApiResult != null) {
        EvernoteApi.DataFilter.convertDatas(this.evernoteApiResult, sortType, this.iconImage.evernote, isMobilePhone)
          .forEach(a => {
            if (keywordFilter.isMatch(a.title) && result.every(b => b.link != a.link)) {
              result.push(Object.assign(a, { full_text_result: false }));
            }
          })
      }
      if (this.textSearch.mode == "本文検索結果表示中") {
        GoogleApi.DataFilter.convertDatas(this.textSearch.apiResult.googleDrive, sortType, { doc: this.iconImage.googleDocsDocument, spread: this.iconImage.googleDocsSpread })
          .forEach(a => {
            if (result.every(b => b.link != a.link)) {
              result.push(Object.assign(a, { full_text_result: true }));
            }
          })
        if (this.textSearch.apiResult.evernote) {
          EvernoteApi.DataFilter.convertDatas(this.textSearch.apiResult.evernote, sortType, this.iconImage.evernote, isMobilePhone)
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
    showTextSearchResult: function () {
      if (this.textSearch.mode != "本文検索結果表示指示待機中") {
        return;
      }
      const apiResult = this.textSearch.apiResult;
      this.textSearch = {
        mode: "本文検索結果表示中",
        apiResult: apiResult
      };
    },
    textSearchStart: async function (abortSignal: AbortSignal) {
      const googleDrivePropmise = GoogleApi.DataRequest.getDataFromApi(this.filterKeyword, this.sortModel, this.access_token, abortSignal).catch(e => {
        if (e && e.name == "AbortError") {
          // 握りつぶす
          return undefined;
        }
        throw e;//それ以外は投げ直す
      });
      const evernoteApiPromise = EvernoteApi.DataRequest.loadData({
        url: this.evernoteApiUrl,
        developer_token: this.evernoteApiDeveloperToken,
        words: this.filterKeyword,
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
    authStartPush: function () {
      const chrome拡張のapiを使う = !!this.useChromeIdentityiApi;
      if (chrome拡張のapiを使う && chrome && chrome.identity && chrome.identity.getAuthToken) {
        // まずはトークンが取得出来るかチェック
        this.loadingMessageShow = true;
        this.authStatus = "アクセストークン更新中";
        chrome.identity.getAuthToken({ interactive: true }, token => {
          this.loadingMessageShow = false;
          if (!token) {
            // トークンが取得できなかった。
            this.authStatus = "認証情報なし";
          } else {
            this.authStatus = "認証情報あり";
            this.access_token = token;
            this.reloadData();
          }
        });
        return;
      }
      this.loadingMessageShow = true;
      document.location.href = GoogleApi.Auth.getAuthStartUrl({
        クライアントID: this.googleApiDataClientId,
        リダイレクトURI: this.googleApiDataRedirectUrl
      });
    },
    reloadData: function () {
      this.loadingMessageShow = true;
      GoogleApi.DataRequest.getDataFromApi("", this.sortModel, this.access_token).then(json => {
        this.loadingMessageShow = false;
        save_sort_option(this.sortModel);
        this.googleDriveApiResult = json.files;
      });
    },
    saveColumnOptionValue: function () {
      setColumnOptionValue(this.columnStyleSelect);
    },
    forceScrollTop: function () {
      const el = this.$el.querySelector("[data-is-scroll-parent]");
      if (el) {
        el.scrollTop = 0
      }
    },
    listWheelEvent: function (event: WheelEvent) {
      if (this.enable_scroll == false) {
        event.stopPropagation();
        return;
      }
      const tateMatch = this.columnStyleSelect.match(/tate-(\d+)px/);
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
