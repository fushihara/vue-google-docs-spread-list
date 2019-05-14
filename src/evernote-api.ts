import { ListItemWithSortValue, SortType } from './d.ts/shims-tsx';

export namespace EvernoteApi {
  export namespace DataRequest {
    export type EvernoteApiData = {
      userData: EvernoteUserData,
      noteBooks: EvernoteNotebookData[]
    };
    export type EvernoteUserData = {
      id: number,//123456
      name: string,//あいうえお
      shardId: string,//s123
      username: string//aiueo
    }
    export type EvernoteNotebookData = {
      title: string,
      size: number,
      updateDate: Date,
      createdDate: Date,
      guid: string,
      notebookName: string
      notebookGuid: string
    }
    export async function loadData(args: { url: string, words: string, ascending: boolean, order: "created" | "updated" | "title", developer_token: string, abortSignal?: AbortSignal }): Promise<EvernoteApiData | null> {
      if (args.url == "") {
        return null;
      }
      const urlParams = new URLSearchParams();
      urlParams.append("developer_token", args.developer_token);
      urlParams.append("words", args.words);
      urlParams.append("order", args.order);
      urlParams.append("ascending", args.ascending ? "1" : "");
      const json = await fetch(`${args.url}?${urlParams.toString()}`, { signal: args.abortSignal }).then(response => response.json());
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
  }
  export namespace DataFilter {
    export function convertDatas(apiValue: EvernoteApi.DataRequest.EvernoteApiData, sortType: SortType, iconUrl: string, isMobileLink: boolean) {
      const result: ListItemWithSortValue = [];
      const evernoteUserData = apiValue.userData;
      apiValue.noteBooks.forEach(a => {
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
        const linkUrl = isMobileLink
          ? `evernote:///view/${evernoteUserData.id}/${evernoteUserData.shardId}/${a.guid}/${a.guid}/` :
          `https://www.evernote.com/Home.action#n=${a.guid}&s=${evernoteUserData.shardId}&ses=4&sh=2&sds=5&`;//pc版
        result.push({
          title: a.title,
          iconUrl: iconUrl,
          link: linkUrl,
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