<template>
  <div style="display:flex;flex-direction:column;height:100%;background:white;">
    <div style="flex:0 0 auto;display:flex;background:silver;height:1.5em;align-items: center;">
      <div
        style="flex:1 1 0;align-items: center;padding-left: 10px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;"
      >Web Documents</div>
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
      <div style="flex:0 0 auto;padding-left: 10px;padding-right: 6px;">絞り込み検索</div>
      <input type="search" style="flex:1 1 0;" v-model="filter_keyword" placeholder="絞り込みキーワード">
    </div>
    <ul
      v-if="auth_status == '認証情報あり'"
      style="flex:1 1 0;margin-top:0;overflow-y:scroll;overscroll-behavior: contain;margin-bottom:0;"
      data-is-scroll-parent
    >
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
import { GoogleApi } from "./google-api"
import { EvernoteApi } from "./evernote-api"
import { SortType, ListItem, ListItemWithSortValue } from './shims-tsx';
// localstorageに使う接頭語
const vue_element_key = `h4hc25ub`
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
export default Vue.extend({
  mounted: function () {
    this.$el.addEventListener("ScrollTop", () => {
      const el = this.$el.querySelector("[data-is-scroll-parent]");
      if (el) {
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
          EvernoteApi.DataRequest.loadData(this.evernoteのドキュメント一覧のapi).then(evernoteList => {
            this.evernote_api_result = evernoteList;
          });
        }
      })
    } else if (URLにcodeがある) {
      const code = RegExp.$1;
      this.auth_status = "アクセストークン更新中";
      this.loading_message_show = true;
      GoogleApi.Auth.getAccessTokenNewGet(code, this.redirect_url, this.クライアントID, this.クライアントシークレット).then(a => {
        this.loading_message_show = false;
        save_refresh_token(a.refreshToken);
        document.location.href = this.redirect_url;
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.redirect_url;
      });
    } else if (get_refresh_token() != "") {
      this.auth_status = "認証情報あり";
      GoogleApi.Auth.getAccessTokenRefresh(get_refresh_token(), this.クライアントID, this.クライアントシークレット).then(b => {
        this.access_token = b.accessToken;
        this.reload_data();
      }).catch(e => {
        alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
        save_refresh_token("");
        document.location.href = this.redirect_url;
      });
      EvernoteApi.DataRequest.loadData(this.evernoteのドキュメント一覧のapi).then(evernoteList => {
        this.evernote_api_result = evernoteList;
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
      google_drive_api_result: { files: [] } as GoogleApi.DataRequest.GoogleApiData,
      evernote_api_result: null as (EvernoteApi.DataRequest.EvernoteApiData | null),
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
    evernote_new_link:function(){
      const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
      if(isMobilePhone){
        return `intent://scan/#Intent;scheme=evernote;package=com.evernote;end`;
      }else{
        return `https://www.evernote.com/client/web`;
      }
    },
    disable_reload_select_ui: function () {
      return this.loading_message_show;
    },
    filterd_list2: function (): ListItem[] {
      const result: ListItemWithSortValue = [];
      const sortType = this.sort_model;
      GoogleApi.DataFilter.convertDatas(this.google_drive_api_result, sortType, { doc: this.icon_image.googleDocsDocument, spread: this.icon_image.googleDocsSpread })
        .forEach(a => {
          result.push(a);
        })
      const isMobilePhone = window.navigator.userAgent.match(/android/i) != null;
      if (this.evernote_api_result != null) {
        EvernoteApi.DataFilter.convertDatas(this.evernote_api_result, sortType, this.icon_image.evernote, isMobilePhone)
          .forEach(a => {
            result.push(a);
          })
      }
      const sortMulti = sortType == "title" ? 1 : -1;// titleの時は昇順にソートするが、それ以外は新しい方から見たいので降順ソートにする
      result.sort((a, b) => {
        return a.sortValue.localeCompare(b.sortValue) * sortMulti;
      });
      const keywords: string[] = this.filter_keyword.replace(/　/g, " ").trim().split(/\s+/).filter(a => a != "").map(a => a.toLowerCase());
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
    }
  },
  methods: {
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
      document.location.href = GoogleApi.Auth.getAuthStartUrl({
        クライアントID: this.クライアントID,
        リダイレクトURI: this.redirect_url
      });
    },
    reload_data: function () {
      this.loading_message_show = true;
      GoogleApi.DataRequest.getDataFromApi(this.sort_model, this.access_token).then(json => {
        this.loading_message_show = false;
        save_sort_option(this.sort_model);
        this.google_drive_api_result = json;
      });
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
