import Vue, { VNode } from 'vue'

declare global {
  export namespace chrome {
    export class identity {
      public static getAuthToken(option?: { interactive: boolean }, callback?: (token: string) => void): void;
    }
  }
}
export type SortType = "last_view_me" | "last_update_me" | "last_update" | "createdTime" | "title";
