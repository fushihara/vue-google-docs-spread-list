import GoogleDocList from "./../components/index.vue";
const v2 = new GoogleDocList<object, { set_callback: (cb: () => void) => void }>({
  propsData: {
    googleApiDataRedirectUrl: String(process.env.VUE_APP_CALLBACK_URL || ""),
    googleApiDataClientId: String(process.env.VUE_APP_API_CLIENT_ID || ""),
    googleApiDataClientSecret: String(process.env.VUE_APP_API_CLIENT_SECRET || ""),
    evernoteApiUrl: String(process.env.VUE_APP_EVERNOTE_LIST_API || ""),
    evernoteApiDeveloperToken: String(process.env.VUE_APP_EVERNOTE_DEVELOPER_TOKEN || "")
  }
});
v2.$mount("#app"); // main.tsはbuild appでしか使われないから、他のコンポーネントの事を考える必要は一切無いので#app固定
