import GoogleDocList from "./GoogleDocList.vue";
const v2 = new GoogleDocList<object, { set_callback: (cb: () => void) => void }>({
  propsData: {
    redirect_url: String(process.env.VUE_APP_CALLBACK_URL || ""),
    クライアントID: String(process.env.VUE_APP_API_CLIENT_ID || ""),
    クライアントシークレット: String(process.env.VUE_APP_API_CLIENT_SECRET || ""),
    chromeのidentityiAPIを使う: !!process.env.VUE_APP_USE_CHROME_IDENTITY_API
  }
});
v2.$mount(String(process.env.VUE_APP_MOUNT_QUERY || ""));
