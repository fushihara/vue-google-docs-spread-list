import { SortType, ListItemWithSortValue } from './d.ts/shims-tsx';

export namespace GoogleApi {
  export namespace Auth {
    export function getAuthStartUrl(val: { クライアントID: string, リダイレクトURI: string, }): string {
      const urlBase = `https://accounts.google.com/o/oauth2/auth`;
      const params = [];
      const スコープs = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
      ];
      params.push(`response_type=code`);
      params.push(`client_id=${val.クライアントID}`);
      params.push(`redirect_uri=${val.リダイレクトURI}`);
      params.push(`scope=${encodeURIComponent(スコープs.join(" "))}`);
      params.push(`access_type=offline`);
      params.push(`approval_prompt=force`);
      const accessUrl = `${urlBase}?${params.join("&")}`;
      return accessUrl;
    }
    export async function getAccessTokenNewGet(requestCode: string, リダイレクトURL: string, クライアントID: string, クライアントシークレット: string): Promise<{ accessToken: string, expiresInSecond: number, refreshToken: string }> {
      const postValues = [];
      postValues.push(`code=${encodeURIComponent(requestCode)}`);
      postValues.push(`client_id=${encodeURIComponent(クライアントID)}`);
      postValues.push(`client_secret=${encodeURIComponent(クライアントシークレット)}`);
      postValues.push(`redirect_uri=${encodeURIComponent(リダイレクトURL)}`);
      postValues.push(`grant_type=authorization_code`);
      postValues.push(`access_type=offline`);
      return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postValues.join("&")
      })
        .then(async request => {
          return request.json().then(json => {
            const accessToken = String(json.access_token || "");
            const expiresInSecond = Number(json.expires_in || "0");
            const refreshToken = String(json.refresh_token || "");
            return {
              accessToken, expiresInSecond, refreshToken
            }
          });
        });
    }
    export async function getAccessTokenRefresh(リフレッシュトークン: string, クライアントID: string, クライアントシークレット: string): Promise<{ accessToken: string, expiresInSecond: number }> {
      const postValues = [];
      postValues.push(`refresh_token=${encodeURIComponent(リフレッシュトークン)}`);
      postValues.push(`client_id=${encodeURIComponent(クライアントID)}`);
      postValues.push(`client_secret=${encodeURIComponent(クライアントシークレット)}`);
      postValues.push(`grant_type=refresh_token`);
      postValues.push(`access_type=offline`);
      return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postValues.join("&")
      }).then(async request => {
        return request.json().then(json => {
          const accessToken = String(json.access_token || "");
          const expiresInSecond = Number(json.expires_in || "0");
          return {
            accessToken, expiresInSecond
          }
        });
      });
    }
  }
  export namespace DataRequest {
    export type GoogleApiViewByMe = { viewedByMe: false } | { viewedByMe: true, viewedByMeTime: string };
    export type GoogleModifiedByMe = { modifiedByMe: false } | { modifiedByMe: true, modifiedByMeTime: string }
    export type GoogleApiData = {
      files: ({ id: string, name: string, mimeType: string, iconLink: string, createdTime: string, modifiedTime: string } & GoogleModifiedByMe & GoogleApiViewByMe)[]
    };

    export async function getDataFromApi(searchKeyword: string, sortType: SortType, accessToken: string): Promise<GoogleApiData> {
      let orderBy = "";
      switch (sortType) {
        case "last_view_me": orderBy = "viewedByMeTime desc"; break;
        case "last_update_me": orderBy = "modifiedByMeTime desc"; break;
        case "last_update": orderBy = "modifiedTime desc"; break;
        case "title": orderBy = "name"; break;
        case "createdTime": orderBy = "createdTime desc"; break;
      }
      const qQueries = [];
      if (searchKeyword.trim() != "") {
        qQueries.push(`fullText contains '${searchKeyword.trim().replace(/'/g, "\\'")}'`)
      }
      qQueries.push("trashed = false");
      qQueries.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document')");
      return await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        [
          "orderBy=" + encodeURIComponent(orderBy),
          "q=" + encodeURIComponent(qQueries.join(" and ")),
          "fields=" + encodeURIComponent("files(kind,id,name,mimeType,iconLink,viewedByMe,viewedByMeTime,createdTime,modifiedTime,modifiedByMeTime,modifiedByMe)"),
          "pageSize=1000",
        ].join("&"),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      ).then(request => request.json().then<GoogleApiData>(json => {
        if (isGoogleApiData(json)) {
          return json;
        } else {
          return Promise.reject(new Error("google api result format error"));
        }
      }));
    }
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
  }
  export namespace DataFilter {
    export function convertDatas(apiValue: DataRequest.GoogleApiData, sortType: SortType, iconImage: { doc: string, spread: string }): ListItemWithSortValue {
      const result: ListItemWithSortValue = [];
      apiValue.files.forEach(a => {
        let link = "";
        let iconImageUrl = "";
        if (a.mimeType === "application/vnd.google-apps.document") {
          link = `https://docs.google.com/document/d/${a.id}/edit`;
          iconImageUrl = iconImage.doc;
        } else if (a.mimeType == "application/vnd.google-apps.spreadsheet") {
          link = `https://docs.google.com/spreadsheets/d/${a.id}/edit`;
          iconImageUrl = iconImage.spread;
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
          iconUrl: iconImageUrl,
          timestamp: {
            value: timestamp,
            label: timeLabel
          },
          sortValue: sortValue
        });
      });
      return result;
    }
  }
}